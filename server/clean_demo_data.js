import db from './db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbFile = path.join(__dirname, 'data', 'siscontrol.db');
const backupFile = path.join(__dirname, 'data', 'siscontrol.db.backup_before_demo_cleanup');

console.log('📦 Creando copia de respaldo de la base de datos...');
fs.copyFileSync(dbFile, backupFile);
console.log(`✅ Respaldo creado en: ${backupFile}`);

// 1. Check current demo items
const demoSkus = [
  'IMP-AUD-01',
  'IMP-CAM-4G',
  'IMP-SMW-09',
  'IMP-FER-21V',
  'IMP-LUZ-300W',
  'IMP-AUT-CMP',
  'IMP-FER-LLV46',
  'IMP-ENG-PW30',
  'IMP-HOG-ASP',
  'IMP-AUT-SOP',
  'IMP-LUZ-LED10',
  'IMP-TXT-MCH01',
  'IMP-FER-DISC',
  'IMP-GAM-PAD',
  'IMP-VINT-FAN'
];

const demoContainers = ['MSCU9482710', 'EGLV3820194', 'MAEU7719203'];

const demoExpenseDescriptions = [
  'Alquiler almacén central nave 3',
  'Honorarios de despacho aduanero contenedor MSCU',
  'Flete de camión puerto a bodega 40 pies',
  'Personal de descarga, embalaje y bodega',
  'Electricidad trifásica y montacargas',
  'Personal de descarga y despacho'
];

const demoProductsBefore = db.prepare(`SELECT id, sku, name FROM products WHERE sku IN (${demoSkus.map(() => '?').join(',')})`).all(...demoSkus);
console.log(`\n🔍 Productos demo encontrados: ${demoProductsBefore.length}`);
demoProductsBefore.forEach(p => console.log(`  - [${p.sku}] ${p.name} (ID: ${p.id})`));

const demoContainersBefore = db.prepare(`SELECT id, tracking_number, notes FROM containers WHERE tracking_number IN (${demoContainers.map(() => '?').join(',')})`).all(...demoContainers);
console.log(`\n🔍 Contenedores demo encontrados: ${demoContainersBefore.length}`);
demoContainersBefore.forEach(c => console.log(`  - [${c.tracking_number}] (ID: ${c.id}) ${c.notes}`));

const demoExpensesBefore = db.prepare(`SELECT id, category, description, amount FROM expenses WHERE description IN (${demoExpenseDescriptions.map(() => '?').join(',')})`).all(...demoExpenseDescriptions);
console.log(`\n🔍 Gastos demo encontrados: ${demoExpensesBefore.length}`);
demoExpensesBefore.forEach(e => console.log(`  - [${e.category}] $${e.amount} - ${e.description} (ID: ${e.id})`));

const demoHistoryBefore = db.prepare("SELECT * FROM import_history WHERE filename = 'Inventario_GoogleSheets_Master_2026.xlsx'").all();
console.log(`\n🔍 Historial de importación demo encontrado: ${demoHistoryBefore.length}`);

// Perform cleanup in a single transaction
const cleanupTx = db.transaction(() => {
  // 1. Delete inventory movements related to demo products or demo containers
  const prodIds = demoProductsBefore.map(p => p.id);
  const containerIds = demoContainersBefore.map(c => c.id);

  let deletedMovementsCount = 0;
  if (prodIds.length > 0) {
    const resMov = db.prepare(`
      DELETE FROM inventory_movements 
      WHERE product_id IN (${prodIds.map(() => '?').join(',')})
         OR (container_id IS NOT NULL AND container_id IN (${containerIds.length ? containerIds.map(() => '?').join(',') : 'NULL'}))
         OR reference LIKE 'IMP-BL-%'
         OR reference LIKE 'FAC-2026-%'
    `).run(...prodIds, ...(containerIds.length ? containerIds : []));
    deletedMovementsCount = resMov.changes;
  }

  // 2. Delete demo products
  let deletedProductsCount = 0;
  if (demoSkus.length > 0) {
    const resProd = db.prepare(`DELETE FROM products WHERE sku IN (${demoSkus.map(() => '?').join(',')})`).run(...demoSkus);
    deletedProductsCount = resProd.changes;
  }

  // 3. Delete demo containers
  let deletedContainersCount = 0;
  if (demoContainers.length > 0) {
    const resCont = db.prepare(`DELETE FROM containers WHERE tracking_number IN (${demoContainers.map(() => '?').join(',')})`).run(...demoContainers);
    deletedContainersCount = resCont.changes;
  }

  // 4. Delete demo expenses
  let deletedExpensesCount = 0;
  if (demoExpenseDescriptions.length > 0) {
    const resExp = db.prepare(`DELETE FROM expenses WHERE description IN (${demoExpenseDescriptions.map(() => '?').join(',')})`).run(...demoExpenseDescriptions);
    deletedExpensesCount = resExp.changes;
  }

  // 5. Delete demo import history
  const resHist = db.prepare("DELETE FROM import_history WHERE filename = 'Inventario_GoogleSheets_Master_2026.xlsx'").run();

  return {
    deletedMovementsCount,
    deletedProductsCount,
    deletedContainersCount,
    deletedExpensesCount,
    deletedHistoryCount: resHist.changes
  };
});

const result = cleanupTx();
console.log('\n🧹 RESULTADOS DE LA LIMPIEZA:');
console.log(`  - Movimientos demo eliminados: ${result.deletedMovementsCount}`);
console.log(`  - Productos demo eliminados: ${result.deletedProductsCount}`);
console.log(`  - Contenedores demo eliminados: ${result.deletedContainersCount}`);
console.log(`  - Gastos operativos demo eliminados: ${result.deletedExpensesCount}`);
console.log(`  - Registros de importación demo eliminados: ${result.deletedHistoryCount}`);

// Optimize DB
db.pragma('optimize');

// Verify remaining real data
console.log('\n📊 ESTADO ACTUAL DE LA BASE DE DATOS TRAS LIMPIEZA:');
const totalProducts = db.prepare('SELECT count(*) as c FROM products').get();
console.log(`  - Productos reales en catálogo: ${totalProducts.c}`);

const totalContainers = db.prepare('SELECT count(*) as c FROM containers').get();
console.log(`  - Contenedores: ${totalContainers.c}`);

const totalExpenses = db.prepare('SELECT count(*) as c FROM expenses').get();
console.log(`  - Gastos operativos: ${totalExpenses.c}`);

const totalMovements = db.prepare('SELECT count(*) as c FROM inventory_movements').get();
console.log(`  - Movimientos de inventario: ${totalMovements.c}`);

const realHistory = db.prepare('SELECT id, filename, source_type, records_count, imported_at FROM import_history').all();
console.log(`  - Historial de importaciones reales (${realHistory.length}):`);
realHistory.forEach(h => console.log(`    * [ID ${h.id}] ${h.filename} (${h.source_type}) -> ${h.records_count} registros (${h.imported_at})`));

console.log('\n✨ Limpieza de datos de prueba completada con éxito.');
