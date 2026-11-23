import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backupsDir = path.join(__dirname, 'data', 'backups');
const MAX_BACKUPS_TO_KEEP = 14;

function ensureBackupsDir() {
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }
}

function formatTimestamp(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}_${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`;
}

export async function createDatabaseBackup(db, reason = 'auto') {
  ensureBackupsDir();
  const safeReason = String(reason || 'auto').replace(/[^a-z0-9_-]/gi, '').slice(0, 20);
  const filename = `siscontrol-${formatTimestamp()}-${safeReason}.db`;
  const destPath = path.join(backupsDir, filename);

  // Use better-sqlite3 online backup API (safe even with concurrent WAL writes)
  await db.backup(destPath);

  const stats = fs.statSync(destPath);
  pruneOldBackups();

  return {
    filename,
    path: destPath,
    size_bytes: stats.size,
    size_kb: Math.round(stats.size / 1024),
    created_at: stats.mtime.toISOString(),
    reason: safeReason
  };
}

export function listDatabaseBackups() {
  ensureBackupsDir();
  const files = fs.readdirSync(backupsDir)
    .filter(f => f.endsWith('.db'))
    .map(filename => {
      const fullPath = path.join(backupsDir, filename);
      const stats = fs.statSync(fullPath);
      return {
        filename,
        size_bytes: stats.size,
        size_kb: Math.round(stats.size / 1024),
        created_at: stats.mtime.toISOString()
      };
    })
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return files;
}

function pruneOldBackups() {
  const files = listDatabaseBackups();
  if (files.length <= MAX_BACKUPS_TO_KEEP) return;

  const toDelete = files.slice(MAX_BACKUPS_TO_KEEP);
  for (const f of toDelete) {
    try {
      fs.unlinkSync(path.join(backupsDir, f.filename));
    } catch (err) {
      console.error(`No se pudo eliminar backup antiguo ${f.filename}:`, err.message);
    }
  }
}

export function startBackupScheduler(db) {
  ensureBackupsDir();

  // Create startup backup if no backup exists in the last 6 hours
  const existing = listDatabaseBackups();
  const sixHoursAgo = Date.now() - 6 * 60 * 60 * 1000;
  const hasRecent = existing.some(b => new Date(b.created_at).getTime() > sixHoursAgo);

  if (!hasRecent) {
    createDatabaseBackup(db, 'auto')
      .then(info => {
        console.log(`💾 Backup automático inicial creado: ${info.filename} (${info.size_kb} KB)`);
      })
      .catch(err => {
        console.error('Error creando backup inicial:', err.message);
      });
  }

  // Schedule recurring online backup every 6 hours
  const interval = setInterval(() => {
    createDatabaseBackup(db, 'scheduled')
      .then(info => {
        console.log(`💾 Backup programado completado: ${info.filename} (${info.size_kb} KB)`);
      })
      .catch(err => {
        console.error('Error en backup programado:', err.message);
      });
  }, 6 * 60 * 60 * 1000);

  interval.unref();
}

