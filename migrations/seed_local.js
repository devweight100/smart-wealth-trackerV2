// migrations/seed_local.js — สร้าง admin user สำหรับ local dev
// Usage: node migrations/seed_local.js | npx wrangler d1 execute DB --local --file=-
const { randomBytes } = require('crypto');
const { webcrypto }   = require('crypto');
const subtle = webcrypto.subtle;

async function main() {
  const password = 'Htmsxzs7';
  const saltBytes = randomBytes(16);
  const saltHex   = saltBytes.toString('hex');
  const encoder   = new TextEncoder();

  const keyMaterial = await subtle.importKey(
    'raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']
  );
  const hashBuf = await subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: saltBytes, iterations: 100000 },
    keyMaterial, 256
  );
  const hashHex = Buffer.from(hashBuf).toString('hex');
  const stored  = `pbkdf2sha256:100000:${saltHex}:${hashHex}`;
  const now     = new Date().toISOString();

  const sql = `
INSERT OR IGNORE INTO users (id, username, password_hash, role, is_active, created_at, updated_at)
VALUES ('user-admin-001', 'admin', '${stored}', 'admin', 1, '${now}', '${now}');
`.trim();

  process.stdout.write(sql + '\n');
}

main().catch(e => { console.error(e); process.exit(1); });
