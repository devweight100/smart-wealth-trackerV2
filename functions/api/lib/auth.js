// functions/api/lib/auth.js
// Authentication & Session Management (Cloudflare Workers compatible)

const SESSION_DURATION_HOURS = 24 * 7; // 7 days
const MAX_FAILED_ATTEMPTS    = 5;
const LOCKOUT_MINUTES        = 15;

// ─── Password Hashing (PBKDF2 via Web Crypto API) ───────────────────────────

export async function hashPassword(password) {
  const encoder   = new TextEncoder();
  const saltBytes = crypto.getRandomValues(new Uint8Array(16));
  const saltHex   = toHex(saltBytes);

  const keyMaterial = await crypto.subtle.importKey(
    'raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']
  );
  const hashBuf = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: saltBytes, iterations: 100000 },
    keyMaterial, 256
  );
  const hashHex = toHex(new Uint8Array(hashBuf));
  return `pbkdf2sha256:100000:${saltHex}:${hashHex}`;
}

export async function verifyPassword(password, stored) {
  try {
    const parts = stored.split(':');
    if (parts.length !== 4) return false;
    const [, iterations, saltHex, hashHex] = parts;

    const encoder   = new TextEncoder();
    const saltBytes = fromHex(saltHex);

    const keyMaterial = await crypto.subtle.importKey(
      'raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']
    );
    const hashBuf = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', hash: 'SHA-256', salt: saltBytes, iterations: parseInt(iterations) },
      keyMaterial, 256
    );
    const computed = toHex(new Uint8Array(hashBuf));

    // Constant-time comparison
    return safeEqual(computed, hashHex);
  } catch {
    return false;
  }
}

// ─── Session Token ────────────────────────────────────────────────────────────

export function generateToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return toHex(bytes);
}

export async function hashToken(token) {
  const encoder = new TextEncoder();
  const hashBuf = await crypto.subtle.digest('SHA-256', encoder.encode(token));
  return toHex(new Uint8Array(hashBuf));
}

// ─── Session CRUD (D1) ────────────────────────────────────────────────────────

export async function createSession(db, userId, token, request) {
  const tokenHash = await hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_HOURS * 3600 * 1000)
    .toISOString().replace('T', ' ').replace('Z', '');
  const now       = nowISO();
  const id        = generateId();

  const ip  = request?.headers?.get('CF-Connecting-IP') || request?.headers?.get('X-Real-IP') || '';
  const ua  = request?.headers?.get('User-Agent') || '';

  await db.prepare(
    `INSERT INTO sessions (id, user_id, token_hash, ip_address, user_agent, expires_at, created_at, last_used_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, userId, tokenHash, ip, ua, expiresAt, now, now).run();

  return { id, expiresAt };
}

export async function validateSession(db, token) {
  if (!token) return null;

  const tokenHash = await hashToken(token);
  const now       = nowISO();

  const session = await db.prepare(
    `SELECT s.*, u.id as uid, u.username, u.role, u.is_active
     FROM sessions s
     JOIN users u ON s.user_id = u.id
     WHERE s.token_hash = ? AND s.expires_at > ? AND u.deleted_at IS NULL`
  ).bind(tokenHash, now).first();

  if (!session) return null;
  if (!session.is_active) return null;

  // Update last_used_at
  await db.prepare(`UPDATE sessions SET last_used_at = ? WHERE id = ?`)
    .bind(now, session.id).run();

  return {
    sessionId : session.id,
    userId    : session.uid,
    username  : session.username,
    role      : session.role,
  };
}

export async function deleteSession(db, token) {
  if (!token) return;
  const tokenHash = await hashToken(token);
  await db.prepare(`DELETE FROM sessions WHERE token_hash = ?`).bind(tokenHash).run();
}

export async function deleteUserSessions(db, userId) {
  await db.prepare(`DELETE FROM sessions WHERE user_id = ?`).bind(userId).run();
}

// ─── Rate Limiting (D1-based) ─────────────────────────────────────────────────

export async function checkAndRecordFailedLogin(db, username) {
  const now  = nowISO();
  const user = await db.prepare(
    `SELECT id, failed_attempts, locked_until FROM users WHERE username = ? AND deleted_at IS NULL`
  ).bind(username).first();

  if (!user) return { locked: false }; // don't reveal if user exists

  // Check if still locked
  if (user.locked_until && user.locked_until > now) {
    return { locked: true, until: user.locked_until };
  }

  // Reset lockout if expired
  if (user.locked_until && user.locked_until <= now) {
    await db.prepare(`UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = ?`)
      .bind(user.id).run();
    user.failed_attempts = 0;
  }

  const newAttempts = (user.failed_attempts || 0) + 1;

  if (newAttempts >= MAX_FAILED_ATTEMPTS) {
    const lockedUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000)
      .toISOString().replace('T', ' ').replace('Z', '');
    await db.prepare(
      `UPDATE users SET failed_attempts = ?, locked_until = ?, updated_at = ? WHERE id = ?`
    ).bind(newAttempts, lockedUntil, now, user.id).run();
    return { locked: true, until: lockedUntil };
  }

  await db.prepare(
    `UPDATE users SET failed_attempts = ?, updated_at = ? WHERE id = ?`
  ).bind(newAttempts, now, user.id).run();
  return { locked: false, attempts: newAttempts, max: MAX_FAILED_ATTEMPTS };
}

export async function resetFailedAttempts(db, userId) {
  const now = nowISO();
  await db.prepare(
    `UPDATE users SET failed_attempts = 0, locked_until = NULL, last_login_at = ?, updated_at = ? WHERE id = ?`
  ).bind(now, now, userId).run();
}

// ─── Token Extraction from Request ───────────────────────────────────────────

export function extractToken(request) {
  // Try Authorization header first
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  // Try cookie
  const cookieHeader = request.headers.get('Cookie') || '';
  const match = cookieHeader.match(/swt_session=([^;]+)/);
  if (match) return match[1].trim();
  return null;
}

// ─── User CRUD ────────────────────────────────────────────────────────────────

export async function getUserByUsername(db, username) {
  return db.prepare(
    `SELECT * FROM users WHERE username = ? AND deleted_at IS NULL`
  ).bind(username).first();
}

export async function getUserById(db, id) {
  return db.prepare(
    `SELECT id, username, role, is_active, last_login_at, created_at FROM users WHERE id = ? AND deleted_at IS NULL`
  ).bind(id).first();
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function toHex(bytes) {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function fromHex(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function generateId(prefix = '') {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return prefix + toHex(bytes);
}

export function nowISO() {
  return new Date().toISOString().replace('T', ' ').replace('Z', '');
}
