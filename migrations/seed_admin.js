// migrations/seed_admin.js
// Run this ONCE after schema creation to seed the admin user.
// Usage (local):  node migrations/seed_admin.js
// Usage (wrangler): see DEPLOYMENT_GUIDE.md — use the /api/init-admin endpoint instead

/**
 * This script generates a PBKDF2 hash for the admin password
 * using Node.js built-in crypto (compatible with the Workers Web Crypto format).
 * 
 * Output: A SQL INSERT statement you can run via wrangler d1 execute
 */

const { createHash, randomBytes, pbkdf2 } = require('crypto');

const USERNAME = 'admin';
const PASSWORD = 'Htmsxzs7';
const ADMIN_ID = 'user-admin-001';

function toHex(buffer) {
  return Buffer.from(buffer).toString('hex');
}

const salt = randomBytes(16);
const saltHex = toHex(salt);

pbkdf2(PASSWORD, salt, 100000, 32, 'sha256', (err, derivedKey) => {
  if (err) { console.error(err); process.exit(1); }

  const hashHex = toHex(derivedKey);
  const stored  = `pbkdf2sha256:100000:${saltHex}:${hashHex}`;
  const now     = new Date().toISOString().replace('T', ' ').replace('Z', '');

  const sql = `
-- Seed admin user (run via: npx wrangler d1 execute smart-wealth-db --file=- <<< "SQL_HERE")
INSERT OR IGNORE INTO users (id, username, password_hash, role, is_active, created_at, updated_at)
VALUES (
  '${ADMIN_ID}',
  '${USERNAME}',
  '${stored}',
  'admin',
  1,
  '${now}',
  '${now}'
);
  `.trim();

  console.log('='.repeat(60));
  console.log('Admin user SQL (copy and run via wrangler):');
  console.log('='.repeat(60));
  console.log(sql);
  console.log('='.repeat(60));
  console.log('\nOr paste this hash directly:');
  console.log(`Password hash: ${stored}`);
});
