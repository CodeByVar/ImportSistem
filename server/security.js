import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, 'data');
const secretPath = path.join(dataDir, '.jwt_secret');

// =============================================================================
// 1. PERSISTENT CRYPTOGRAPHIC SECRET FOR JWT SIGNING (HS256)
// =============================================================================
function loadOrCreateJwtSecret() {
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32) {
    return process.env.JWT_SECRET;
  }
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (fs.existsSync(secretPath)) {
    const existing = fs.readFileSync(secretPath, 'utf8').trim();
    if (existing.length >= 32) return existing;
  }
  const generated = crypto.randomBytes(48).toString('hex');
  fs.writeFileSync(secretPath, generated, { mode: 0o600 });
  return generated;
}

const JWT_SECRET = loadOrCreateJwtSecret();
const TOKEN_TTL_SECONDS = 12 * 60 * 60; // 12 hours (full work shift)

// =============================================================================
// 2. PIN / PASSWORD HASHING (SCRYPT + RANDOM SALT + TIMING-SAFE COMPARE)
// =============================================================================
const HASH_PREFIX = 'scrypt$';

export function isHashedPin(value) {
  return typeof value === 'string' && value.startsWith(HASH_PREFIX);
}

export function hashPin(plainPin) {
  const clean = String(plainPin ?? '').trim();
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(clean, salt, 64).toString('hex');
  return `${HASH_PREFIX}${salt}$${derived}`;
}

export function verifyPin(plainPin, storedValue) {
  const clean = String(plainPin ?? '').trim();
  if (!clean || !storedValue) return false;

  if (isHashedPin(storedValue)) {
    const parts = storedValue.split('$');
    if (parts.length !== 3) return false;
    const [, salt, storedHex] = parts;
    const derivedBuf = crypto.scryptSync(clean, salt, 64);
    const storedBuf = Buffer.from(storedHex, 'hex');
    if (derivedBuf.length !== storedBuf.length) return false;
    return crypto.timingSafeEqual(derivedBuf, storedBuf);
  }

  // Fallback for legacy unmigrated plaintext (timing-safe comparison)
  const a = Buffer.from(clean, 'utf8');
  const b = Buffer.from(String(storedValue), 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function migratePlaintextPins(db) {
  const users = db.prepare('SELECT id, pin_code FROM users').all();
  let migrated = 0;
  const updateStmt = db.prepare('UPDATE users SET pin_code = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');

  const tx = db.transaction(() => {
    for (const u of users) {
      if (u.pin_code && !isHashedPin(u.pin_code)) {
        updateStmt.run(hashPin(u.pin_code), u.id);
        migrated++;
      }
    }
  });
  tx();

  if (migrated > 0) {
    console.log(`🔐 Seguridad: ${migrated} PIN(s) migrados de texto plano a hash criptográfico scrypt.`);
  }
}

// =============================================================================
// 3. STANDARD HS256 JWT SIGNING & VERIFICATION
// =============================================================================
function base64UrlEncode(input) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(String(input), 'utf8');
  return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function base64UrlDecode(str) {
  let s = str.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return Buffer.from(s, 'base64').toString('utf8');
}

export function signToken(user) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    sub: user.id,
    username: user.username,
    role: user.role,
    name: user.name,
    iat: now,
    exp: now + TOKEN_TTL_SECONDS
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(signingInput)
    .digest();

  return `${signingInput}.${base64UrlEncode(signature)}`;
}

export function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const expectedSig = base64UrlEncode(
    crypto.createHmac('sha256', JWT_SECRET).update(signingInput).digest()
  );

  const sigBufA = Buffer.from(encodedSignature, 'utf8');
  const sigBufB = Buffer.from(expectedSig, 'utf8');
  if (sigBufA.length !== sigBufB.length || !crypto.timingSafeEqual(sigBufA, sigBufB)) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    const now = Math.floor(Date.now() / 1000);
    if (!payload.exp || payload.exp < now) return null;
    if (!payload.sub) return null;
    return payload;
  } catch {
    return null;
  }
}

// =============================================================================
// 4. DATA SANITIZATION (NEVER EXPOSE PINS OR INTERNAL COSTS TO UNAUTHORIZED ROLES)
// =============================================================================
export function sanitizeUserForClient(user) {
  if (!user) return null;
  const { pin_code, ...safe } = user;
  return {
    ...safe,
    has_pin: Boolean(pin_code)
  };
}

export function sanitizeProductForRole(product, role) {
  if (!product) return product;
  if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
    return product;
  }
  return {
    ...product,
    fob_price: 0,
    shipping_cost: 0,
    tariff_cost: 0,
    landed_cost: 0,
    unit_margin: 0,
    margin_percentage: 0,
    stock_total_cost: 0
  };
}

// =============================================================================
// 5. BRUTE-FORCE & FLOOD PROTECTION (RATE LIMITERS)
// =============================================================================
const loginAttemptsByKey = new Map();
const loginAttemptsByIp = new Map();
const MAX_LOGIN_ATTEMPTS_ACCOUNT = 5;
const MAX_LOGIN_ATTEMPTS_IP = 20;
const LOGIN_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

export function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

function pruneRecord(map, key, now) {
  const rec = map.get(key);
  if (!rec) return null;
  if (rec.lockedUntil && rec.lockedUntil > now) return rec;
  if (now - rec.firstAttemptAt > LOGIN_WINDOW_MS) {
    map.delete(key);
    return null;
  }
  return rec;
}

export function checkLoginRateLimit(req, usernameKey) {
  const now = Date.now();
  const ip = getClientIp(req);
  const accKey = `${ip}::${String(usernameKey || 'unknown').toLowerCase()}`;

  const ipRec = pruneRecord(loginAttemptsByIp, ip, now);
  if (ipRec && ipRec.lockedUntil && ipRec.lockedUntil > now) {
    const mins = Math.ceil((ipRec.lockedUntil - now) / 60000);
    return {
      blocked: true,
      retryAfterMinutes: mins,
      message: `Demasiados intentos fallidos desde tu dispositivo. Por seguridad, intenta nuevamente en ${mins} minuto(s).`
    };
  }

  const accRec = pruneRecord(loginAttemptsByKey, accKey, now);
  if (accRec && accRec.lockedUntil && accRec.lockedUntil > now) {
    const mins = Math.ceil((accRec.lockedUntil - now) / 60000);
    return {
      blocked: true,
      retryAfterMinutes: mins,
      message: `Cuenta bloqueada temporalmente por intentos fallidos. Intenta de nuevo en ${mins} minuto(s).`
    };
  }

  return { blocked: false };
}

export function recordLoginFailure(req, usernameKey) {
  const now = Date.now();
  const ip = getClientIp(req);
  const accKey = `${ip}::${String(usernameKey || 'unknown').toLowerCase()}`;

  const bump = (map, key, limit) => {
    const cur = pruneRecord(map, key, now) || { count: 0, firstAttemptAt: now, lockedUntil: 0 };
    cur.count += 1;
    if (cur.count >= limit) {
      cur.lockedUntil = now + LOGIN_WINDOW_MS;
    }
    map.set(key, cur);
    return cur;
  };

  const accRec = bump(loginAttemptsByKey, accKey, MAX_LOGIN_ATTEMPTS_ACCOUNT);
  bump(loginAttemptsByIp, ip, MAX_LOGIN_ATTEMPTS_IP);

  const remaining = Math.max(0, MAX_LOGIN_ATTEMPTS_ACCOUNT - accRec.count);
  return { remaining, locked: accRec.lockedUntil > now };
}

export function resetLoginFailures(req, usernameKey) {
  const ip = getClientIp(req);
  const accKey = `${ip}::${String(usernameKey || 'unknown').toLowerCase()}`;
  loginAttemptsByKey.delete(accKey);
}

// General API rate limiter (600 req/min per IP)
const apiHits = new Map();
const API_WINDOW_MS = 60 * 1000;
const API_MAX_REQUESTS = 600;

export function apiRateLimiter(req, res, next) {
  const now = Date.now();
  const ip = getClientIp(req);
  let entry = apiHits.get(ip);

  if (!entry || now - entry.windowStart > API_WINDOW_MS) {
    entry = { count: 1, windowStart: now };
    apiHits.set(ip, entry);
  } else {
    entry.count += 1;
  }

  if (entry.count > API_MAX_REQUESTS) {
    return res.status(429).json({
      success: false,
      error: 'Demasiadas peticiones en muy poco tiempo. Espera unos segundos e intenta de nuevo.'
    });
  }
  next();
}

// Periodic cleanup of stale rate-limit maps (every 15 min)
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of apiHits.entries()) {
    if (now - v.windowStart > API_WINDOW_MS * 2) apiHits.delete(k);
  }
  for (const [k, v] of loginAttemptsByKey.entries()) {
    if (now - v.firstAttemptAt > LOGIN_WINDOW_MS * 2 && (!v.lockedUntil || v.lockedUntil < now)) {
      loginAttemptsByKey.delete(k);
    }
  }
  for (const [k, v] of loginAttemptsByIp.entries()) {
    if (now - v.firstAttemptAt > LOGIN_WINDOW_MS * 2 && (!v.lockedUntil || v.lockedUntil < now)) {
      loginAttemptsByIp.delete(k);
    }
  }
}, 15 * 60 * 1000).unref();

// =============================================================================
// 6. SECURITY HEADERS & STRICT CORS WHITELIST
// =============================================================================
export function securityHeaders(req, res, next) {
  res.removeHeader('X-Powered-By');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
  next();
}

const LOCAL_OR_LAN_ORIGIN_REGEX = /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})(:\d+)?$/i;
const ALLOWED_TUNNEL_REGEX = /^https:\/\/[a-z0-9-]+\.(lhr\.life|trycloudflare\.com|ngrok-free\.app)$/i;

export function createCorsOptions() {
  const envOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  return {
    origin(origin, callback) {
      // Allow same-origin / server-to-server / curl without Origin header
      if (!origin) return callback(null, true);
      if (
        LOCAL_OR_LAN_ORIGIN_REGEX.test(origin) ||
        ALLOWED_TUNNEL_REGEX.test(origin) ||
        envOrigins.includes(origin)
      ) {
        return callback(null, true);
      }
      return callback(new Error(`Origen bloqueado por política CORS de seguridad: ${origin}`));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  };
}

// =============================================================================
// 7. AUTHENTICATION & ROLE-BASED ACCESS CONTROL (RBAC) MIDDLEWARE
// =============================================================================
export function createAuthMiddleware(db) {
  return function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        code: 'AUTH_REQUIRED',
        error: 'Sesión no autorizada. Inicia sesión con tu usuario y PIN.'
      });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        code: 'TOKEN_INVALID',
        error: 'Tu sesión expiró o no es válida. Inicia sesión nuevamente.'
      });
    }

    // Verify user still exists and is active in DB (immediate revocation if deactivated/role changed)
    const user = db
      .prepare('SELECT id, name, username, role, phone, email, avatar_color, avatar_url, status FROM users WHERE id = ?')
      .get(decoded.sub);

    if (!user || user.status !== 'ACTIVO') {
      return res.status(401).json({
        success: false,
        code: 'USER_INACTIVE',
        error: 'Tu cuenta fue desactivada o eliminada. Contacta al administrador.'
      });
    }

    req.user = user;
    next();
  };
}

export function requireRoles(...allowedRoles) {
  return function roleGuard(req, res, next) {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Sesión requerida para realizar esta acción.'
      });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Acceso denegado. Tu rol (${req.user.role}) no tiene permiso para esta operación.`
      });
    }
    next();
  };
}

// =============================================================================
// 8. SECURITY AUDIT LOGGER
// =============================================================================
export function logSecurityEvent(db, { action, actorUser = null, target = null, ip = null, details = null }) {
  try {
    db.prepare(`
      INSERT INTO security_audit_logs (action, actor_user_id, actor_username, actor_role, target, ip_address, details)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      action,
      actorUser?.id || null,
      actorUser?.username || null,
      actorUser?.role || null,
      target ? String(target) : null,
      ip || null,
      details ? (typeof details === 'string' ? details : JSON.stringify(details)) : null
    );
  } catch (err) {
    console.error('Error writing security audit log:', err.message);
  }
}

