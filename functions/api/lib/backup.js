// functions/api/lib/backup.js
// Backup v1/v2 Import & Export with Backward Compatibility

import { nowISO }   from './db.js';
import { generateId } from './auth.js';

// ─── Detect Backup Version ────────────────────────────────────────────────────

export function detectBackupVersion(data) {
  if (!data || typeof data !== 'object') throw new Error('ไฟล์ backup ไม่ถูกต้อง');
  if (data.backupVersion === 2 || (data.metadata && data.metadata.schemaVersion)) return 2;
  if (Array.isArray(data.accounts) && Array.isArray(data.transactions) && Array.isArray(data.categories)) return 1;
  throw new Error('รูปแบบ backup ไม่รู้จัก');
}

// ─── Import Backup v1 (current JSON format) into D1 ─────────────────────────

export async function importBackupV1(db, data, opts = {}) {
  const { mode = 'replace', userId = null } = opts;
  // mode: 'replace' | 'merge' | 'skip'

  const now     = nowISO();
  const results = { accounts: 0, categories: 0, transactions: 0, skipped: 0 };

  // ── Categories first (transactions reference them) ──────────────────────
  const categoryMap = {}; // "name:type" → id

  for (const cat of data.categories || []) {
    const id      = cat.id   || `cat-${Date.now()}-${generateId()}`;
    const name    = (cat.name || '').trim();
    const type    = cat.type  || 'expense';
    const isSys   = cat.isSystem ? 1 : 0;
    const mapKey  = `${name}:${type}`;
    categoryMap[mapKey] = id;

    const exists = await db.prepare(`SELECT id FROM categories WHERE id = ?`).bind(id).first();
    if (exists) {
      if (mode === 'skip') { results.skipped++; continue; }
      if (mode === 'merge') { results.skipped++; continue; }
      // replace: update
      await db.prepare(`UPDATE categories SET name=?, type=?, is_system=?, updated_at=? WHERE id=?`)
        .bind(name, type, isSys, now, id).run();
    } else {
      await db.prepare(
        `INSERT OR IGNORE INTO categories (id, name, type, is_system, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).bind(id, name, type, isSys, now, now).run();
    }
    results.categories++;
  }

  // ── Accounts ──────────────────────────────────────────────────────────────
  for (const acc of data.accounts || []) {
    const id      = acc.id || `acc-${Date.now()}-${generateId()}`;
    const name    = (acc.name || '').trim();
    const type    = acc.type || 'bank';
    const accNum  = acc.accountNumber || '-';
    const bank    = acc.bankName      || '-';
    const initBal = Number(acc.initialBalance || 0);
    const isDef   = id === 'acc-cash' ? 1 : 0;

    const exists = await db.prepare(`SELECT id FROM accounts WHERE id = ?`).bind(id).first();
    if (exists) {
      if (mode === 'skip') { results.skipped++; continue; }
      if (mode === 'merge') { results.skipped++; continue; }
      await db.prepare(
        `UPDATE accounts SET name=?, type=?, account_number=?, bank_name=?, initial_balance=?, updated_at=? WHERE id=?`
      ).bind(name, type, accNum, bank, initBal, now, id).run();
    } else {
      await db.prepare(
        `INSERT OR IGNORE INTO accounts (id, name, type, account_number, bank_name, initial_balance, is_default, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(id, name, type, accNum, bank, initBal, isDef, now, now).run();
    }
    results.accounts++;
  }

  // ── Transactions ──────────────────────────────────────────────────────────
  for (const tx of data.transactions || []) {
    const id      = tx.id || `tx-${Date.now()}-${generateId()}`;
    const date    = tx.date    || '2026-01-01';
    const type    = tx.type    || 'expense';
    const catName = (tx.category || 'อื่นๆ').trim();
    const amount  = Number(tx.amount || 0);
    const method  = tx.paymentMethod || 'Cash';
    const accId   = tx.accountId     || 'acc-cash';
    const notes   = tx.notes    || '';
    const slipUrl = tx.slipUrl  || null;
    const status  = tx.status   || null;

    const catType = type === 'income' ? 'income' : 'expense';
    const catId   = categoryMap[`${catName}:${catType}`] || null;

    const exists = await db.prepare(`SELECT id FROM transactions WHERE id = ?`).bind(id).first();
    if (exists) {
      if (mode === 'skip' || mode === 'merge') { results.skipped++; continue; }
      await db.prepare(
        `UPDATE transactions SET date=?, type=?, category_name=?, category_id=?, amount=?, payment_method=?, account_id=?, notes=?, slip_url=?, status=?, updated_at=? WHERE id=?`
      ).bind(date, type, catName, catId, amount, method, accId, notes, slipUrl, status, now, id).run();
    } else {
      await db.prepare(
        `INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(id, date, type, catName, catId, amount, method, accId, notes, slipUrl, status, userId, now, now).run();
    }
    results.transactions++;
  }

  return results;
}

// ─── Export Backup v1 (backward compat format) ───────────────────────────────

export async function exportBackupV1(db) {
  const { results: accounts }     = await db.prepare(`SELECT * FROM accounts WHERE deleted_at IS NULL`).all();
  const { results: categories }   = await db.prepare(`SELECT * FROM categories WHERE deleted_at IS NULL`).all();
  const { results: transactions } = await db.prepare(`SELECT * FROM transactions WHERE deleted_at IS NULL`).all();

  return {
    accounts    : accounts.map(a => ({
      id             : a.id,
      name           : a.name,
      type           : a.type,
      accountNumber  : a.account_number,
      bankName       : a.bank_name,
      initialBalance : a.initial_balance,
      balance        : a.initial_balance, // computed separately
    })),
    categories  : categories.map(c => ({
      id      : c.id,
      name    : c.name,
      type    : c.type,
      isSystem: Boolean(c.is_system),
    })),
    transactions: transactions.map(t => ({
      id            : t.id,
      date          : t.date,
      type          : t.type,
      category      : t.category_name,
      amount        : Number(t.amount),
      paymentMethod : t.payment_method,
      accountId     : t.account_id,
      notes         : t.notes || '',
      slipUrl       : t.slip_url || null,
      status        : t.status || undefined,
    })),
    backupDate  : new Date().toISOString(),
    backupVersion: 1,
  };
}

// ─── Record backup in D1 ─────────────────────────────────────────────────────

export async function recordBackup(db, { status, storagePath, fileSize, checksum, errorMessage, userId, counts }) {
  const id  = generateId();
  const now = nowISO();
  await db.prepare(
    `INSERT INTO backup_history (id, backup_version, app_version, accounts_count, tx_count, categories_count, storage_path, file_size, checksum, status, error_message, created_by, created_at)
     VALUES (?, '1', '2.0.0', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, counts?.accounts || 0, counts?.transactions || 0, counts?.categories || 0,
    storagePath, fileSize, checksum, status, errorMessage || null, userId, now).run();
  return id;
}
