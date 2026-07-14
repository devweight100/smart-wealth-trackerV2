#!/usr/bin/env node
/**
 * Smart Wealth Tracker — Backup Migration Script
 * 
 * Reads a v1 backup JSON and outputs SQL for D1 import.
 * 
 * Usage:
 *   node migrations/migrate_from_backup.js <backup-file.json>
 *   
 * Then run the generated SQL:
 *   npx wrangler d1 execute smart-wealth-db --file=migrations/migration_data.sql --remote
 */

const fs   = require('fs');
const path = require('path');
const crypto = require('crypto');

// ─── Config ──────────────────────────────────────────────────────────────────
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'Htmsxzs7';  // Will be hashed with PBKDF2
const ADMIN_ROLE     = 'admin';
const PBKDF2_ITER    = 100000;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function uuid() {
  return crypto.randomUUID();
}

function nowISO() {
  return new Date().toISOString().replace('T', ' ').replace('Z', '');
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, PBKDF2_ITER, 32, 'sha256').toString('hex');
  return `pbkdf2sha256:${PBKDF2_ITER}:${salt}:${hash}`;
}

function esc(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return isFinite(val) ? String(val) : '0';
  if (typeof val === 'boolean') return val ? '1' : '0';
  return `'${String(val).replace(/'/g, "''")}'`;
}

function detectVersion(data) {
  if (data.backupVersion === 2 || (data.metadata && data.metadata.schemaVersion)) return 2;
  if (data.accounts && data.transactions && data.categories) return 1;
  throw new Error('Unknown backup format — cannot detect version');
}

// ─── Main ────────────────────────────────────────────────────────────────────
const backupFile = process.argv[2];
if (!backupFile) {
  console.error('Usage: node migrate_from_backup.js <backup-file.json>');
  process.exit(1);
}

const backupPath = path.resolve(backupFile);
if (!fs.existsSync(backupPath)) {
  console.error(`File not found: ${backupPath}`);
  process.exit(1);
}

let raw;
try {
  raw = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
} catch (e) {
  console.error('Failed to parse JSON:', e.message);
  process.exit(1);
}

const version = detectVersion(raw);
console.log(`\n✅ Detected backup version: ${version}`);
console.log(`   accounts    : ${raw.accounts.length}`);
console.log(`   transactions: ${raw.transactions.length}`);
console.log(`   categories  : ${raw.categories.length}`);
console.log(`   backupDate  : ${raw.backupDate || 'unknown'}\n`);

const lines = [];
const now   = nowISO();
const adminId = 'user-admin';

lines.push('-- ==========================================================');
lines.push(`-- Smart Wealth Tracker — Migration Data`);
lines.push(`-- Generated: ${new Date().toISOString()}`);
lines.push(`-- Source backup: ${path.basename(backupPath)}`);
lines.push(`-- Backup version: ${version}`);
lines.push('-- ==========================================================');
lines.push('');
lines.push('PRAGMA foreign_keys = OFF;');
lines.push('BEGIN TRANSACTION;');
lines.push('');

// ── 1. Admin User ─────────────────────────────────────────────────────────
console.log('🔐 Hashing admin password...');
const passwordHash = hashPassword(ADMIN_PASSWORD);

lines.push('-- USERS');
lines.push(`INSERT OR IGNORE INTO users (id, username, password_hash, role, is_active, created_at, updated_at)`);
lines.push(`VALUES (${esc(adminId)}, ${esc(ADMIN_USERNAME)}, ${esc(passwordHash)}, ${esc(ADMIN_ROLE)}, 1, ${esc(now)}, ${esc(now)});`);
lines.push('');

// ── 2. Accounts ───────────────────────────────────────────────────────────
lines.push('-- ACCOUNTS');
for (const acc of raw.accounts) {
  const id      = acc.id   || `acc-${Date.now()}-${Math.random()}`;
  const name    = acc.name || 'Unknown';
  const type    = acc.type || 'bank';
  const accNum  = acc.accountNumber || '-';
  const bank    = acc.bankName      || '-';
  const initBal = Number(acc.initialBalance || 0);
  const isDef   = id === 'acc-cash' ? 1 : 0;

  lines.push(`INSERT OR IGNORE INTO accounts (id, name, type, account_number, bank_name, initial_balance, is_default, created_at, updated_at)`);
  lines.push(`VALUES (${esc(id)}, ${esc(name)}, ${esc(type)}, ${esc(accNum)}, ${esc(bank)}, ${initBal}, ${isDef}, ${esc(now)}, ${esc(now)});`);
}
lines.push('');

// ── 3. Categories ─────────────────────────────────────────────────────────
lines.push('-- CATEGORIES');
const categoryMap = {}; // name:type → id

for (const cat of raw.categories) {
  const id       = cat.id   || `cat-${Date.now()}-${Math.random()}`;
  const name     = cat.name || 'Unknown';
  const type     = cat.type || 'expense';
  const isSys    = cat.isSystem ? 1 : 0;
  const mapKey   = `${name}:${type}`;
  categoryMap[mapKey] = id;

  lines.push(`INSERT OR IGNORE INTO categories (id, name, type, is_system, created_at, updated_at)`);
  lines.push(`VALUES (${esc(id)}, ${esc(name)}, ${esc(type)}, ${isSys}, ${esc(now)}, ${esc(now)});`);
}
lines.push('');

// ── 4. Transactions ───────────────────────────────────────────────────────
lines.push('-- TRANSACTIONS');
let skipped = 0;

for (const tx of raw.transactions) {
  const id       = tx.id            || `tx-${Date.now()}-${Math.random()}`;
  const date     = tx.date          || '2026-01-01';
  const type     = tx.type          || 'expense';
  const catName  = tx.category      || 'อื่นๆ';
  const amount   = Number(tx.amount || 0);
  const method   = tx.paymentMethod || 'Cash';
  const accId    = tx.accountId     || 'acc-cash';
  const notes    = tx.notes         || '';
  const slipUrl  = tx.slipUrl       || null;
  const status   = tx.status        || null;
  const createdAt = tx.createdAt    || now;

  // Lookup category_id
  const catType  = (type === 'income') ? 'income' : 'expense';
  const mapKey   = `${catName}:${catType}`;
  const catId    = categoryMap[mapKey] || null;

  if (type === 'status') { skipped++; continue; }

  lines.push(`INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)`);
  lines.push(`VALUES (${esc(id)}, ${esc(date)}, ${esc(type)}, ${esc(catName)}, ${esc(catId)}, ${amount}, ${esc(method)}, ${esc(accId)}, ${esc(notes)}, ${esc(slipUrl)}, ${esc(status)}, ${esc(createdAt)}, ${esc(now)});`);
}
lines.push('');

// ── 5. Settings ───────────────────────────────────────────────────────────
lines.push('-- SETTINGS (preserve existing or use defaults)');
lines.push(`INSERT OR IGNORE INTO settings (key, value) VALUES ('backup_date_last', ${esc(raw.backupDate || now)});`);
lines.push('');

lines.push('COMMIT;');
lines.push('PRAGMA foreign_keys = ON;');
lines.push('');
lines.push(`-- Summary:`);
lines.push(`--   users        : 1 (admin)`);
lines.push(`--   accounts     : ${raw.accounts.length}`);
lines.push(`--   categories   : ${raw.categories.length}`);
lines.push(`--   transactions : ${raw.transactions.length - skipped} (skipped: ${skipped})`);

// Write output
const outputPath = path.join(__dirname, 'migration_data.sql');
fs.writeFileSync(outputPath, lines.join('\n') + '\n', 'utf8');

console.log(`✅ Migration SQL written to: ${outputPath}`);
console.log('');
console.log('Next steps:');
console.log('  1. npx wrangler d1 execute smart-wealth-db --file=migrations/migration_data.sql --remote');
console.log('  2. Verify data with: npx wrangler d1 execute smart-wealth-db --command="SELECT COUNT(*) FROM transactions" --remote');
console.log('');
console.log('Admin credentials:');
console.log(`  Username : ${ADMIN_USERNAME}`);
console.log(`  Password : ${ADMIN_PASSWORD}`);
console.log('  (password is hashed with PBKDF2-SHA256, 100,000 iterations)');
