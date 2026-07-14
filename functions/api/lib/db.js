// functions/api/lib/db.js
// D1 Database Query Helpers

// ─── Common Helpers ────────────────────────────────────────────────────────────

export function nowISO() {
  return new Date().toISOString().replace('T', ' ').replace('Z', '');
}

// ─── ACCOUNTS ─────────────────────────────────────────────────────────────────

export async function getAccounts(db, includeDeleted = false) {
  const sql = includeDeleted
    ? `SELECT * FROM accounts ORDER BY is_default DESC, sort_order, name`
    : `SELECT * FROM accounts WHERE deleted_at IS NULL ORDER BY is_default DESC, sort_order, name`;
  const { results } = await db.prepare(sql).all();
  return results.map(toAccountAPI);
}

export async function getAccountById(db, id) {
  const row = await db.prepare(`SELECT * FROM accounts WHERE id = ?`).bind(id).first();
  return row ? toAccountAPI(row) : null;
}

export async function createAccount(db, data) {
  const now = nowISO();
  await db.prepare(
    `INSERT INTO accounts (id, name, type, account_number, bank_name, initial_balance, sort_order, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    data.id, data.name, data.type, data.accountNumber || '-',
    data.bankName || '-', data.initialBalance || 0, data.sortOrder || 0, now, now
  ).run();
  return getAccountById(db, data.id);
}

export async function updateAccount(db, id, data) {
  const now = nowISO();
  const current = await db.prepare(`SELECT * FROM accounts WHERE id = ? AND deleted_at IS NULL`).bind(id).first();
  if (!current) return null;

  await db.prepare(
    `UPDATE accounts SET name=?, type=?, account_number=?, bank_name=?, initial_balance=?, updated_at=? WHERE id=?`
  ).bind(
    data.name ?? current.name,
    data.type ?? current.type,
    data.accountNumber ?? current.account_number,
    data.bankName ?? current.bank_name,
    data.initialBalance !== undefined ? data.initialBalance : current.initial_balance,
    now, id
  ).run();
  return getAccountById(db, id);
}

export async function deleteAccount(db, id) {
  const now = nowISO();
  await db.prepare(`UPDATE accounts SET deleted_at=?, updated_at=? WHERE id=?`).bind(now, now, id).run();
}

export async function restoreAccount(db, id) {
  const now = nowISO();
  await db.prepare(`UPDATE accounts SET deleted_at=NULL, updated_at=? WHERE id=?`).bind(now, id).run();
}

// ─── BALANCE CALCULATION ──────────────────────────────────────────────────────

export async function calculateBalances(db) {
  const { results: accounts } = await db.prepare(
    `SELECT * FROM accounts WHERE deleted_at IS NULL`
  ).all();

  const today = new Date().toLocaleDateString('sv-SE'); // YYYY-MM-DD

  const { results: txs } = await db.prepare(
    `SELECT account_id, type, amount, date, status FROM transactions WHERE deleted_at IS NULL`
  ).all();

  return accounts.map(acc => {
    let balance = Number(acc.initial_balance || 0);
    for (const tx of txs) {
      if (tx.account_id !== acc.id) continue;
      const amt = Number(tx.amount || 0);
      if ((tx.type === 'income' || tx.type === 'transfer_in') && tx.date <= today) balance += amt;
      else if ((tx.type === 'expense' || tx.type === 'transfer_out') && tx.date <= today) balance -= amt;
      else if (tx.type === 'future' && tx.status === 'paid') balance -= amt;
    }
    return { ...toAccountAPI(acc), balance };
  });
}

// ─── CATEGORIES ───────────────────────────────────────────────────────────────

export async function getCategories(db, includeDeleted = false) {
  const sql = includeDeleted
    ? `SELECT * FROM categories ORDER BY type, sort_order, name`
    : `SELECT * FROM categories WHERE deleted_at IS NULL ORDER BY type, sort_order, name`;
  const { results } = await db.prepare(sql).all();
  return results.map(toCategoryAPI);
}

export async function getCategoryById(db, id) {
  const row = await db.prepare(`SELECT * FROM categories WHERE id = ?`).bind(id).first();
  return row ? toCategoryAPI(row) : null;
}

export async function createCategory(db, data) {
  const now = nowISO();
  await db.prepare(
    `INSERT INTO categories (id, name, type, is_system, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(data.id, data.name, data.type, data.isSystem ? 1 : 0, now, now).run();
  return getCategoryById(db, data.id);
}

export async function updateCategory(db, id, data) {
  const now = nowISO();
  await db.prepare(
    `UPDATE categories SET name=?, updated_at=? WHERE id=? AND deleted_at IS NULL`
  ).bind(data.name, now, id).run();
  return getCategoryById(db, id);
}

export async function deleteCategory(db, id) {
  const now = nowISO();
  await db.prepare(`UPDATE categories SET deleted_at=?, updated_at=? WHERE id=?`).bind(now, now, id).run();
}

export async function restoreCategory(db, id) {
  const now = nowISO();
  await db.prepare(`UPDATE categories SET deleted_at=NULL, updated_at=? WHERE id=?`).bind(now, id).run();
}

// ─── TRANSACTIONS ─────────────────────────────────────────────────────────────

export async function getTransactions(db, opts = {}) {
  const {
    page = 1, limit = 50, accountId, type, startDate, endDate,
    keyword, includeDeleted = false
  } = opts;

  const where  = [];
  const params = [];

  if (!includeDeleted) { where.push('t.deleted_at IS NULL'); }
  if (accountId)  { where.push('t.account_id = ?');    params.push(accountId); }
  if (type)       { where.push('t.type = ?');           params.push(type); }
  if (startDate)  { where.push('t.date >= ?');          params.push(startDate); }
  if (endDate)    { where.push('t.date <= ?');          params.push(endDate); }
  if (keyword)    {
    where.push('(t.notes LIKE ? OR t.category_name LIKE ?)');
    params.push(`%${keyword}%`, `%${keyword}%`);
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const offset      = (page - 1) * limit;

  const countRow = await db.prepare(
    `SELECT COUNT(*) as total FROM transactions t ${whereClause}`
  ).bind(...params).first();

  const { results } = await db.prepare(
    `SELECT t.* FROM transactions t ${whereClause} ORDER BY t.date DESC, t.id DESC LIMIT ? OFFSET ?`
  ).bind(...params, limit, offset).all();

  return {
    data  : results.map(toTransactionAPI),
    total : countRow?.total || 0,
    page, limit,
    pages : Math.ceil((countRow?.total || 0) / limit),
  };
}

export async function getTransactionById(db, id) {
  const row = await db.prepare(`SELECT * FROM transactions WHERE id = ?`).bind(id).first();
  return row ? toTransactionAPI(row) : null;
}

export async function createTransaction(db, data) {
  const now = nowISO();
  await db.prepare(
    `INSERT INTO transactions
       (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, transfer_tx_id, created_by, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    data.id, data.date, data.type,
    data.category, data.categoryId || null,
    data.amount, data.paymentMethod, data.accountId,
    data.notes || '', data.slipUrl || null,
    data.type === 'future' ? (data.status || 'pending') : null,
    data.transferTxId || null,
    data.createdBy || null, now, now
  ).run();
  return getTransactionById(db, data.id);
}

export async function updateTransaction(db, id, data) {
  const now     = nowISO();
  const current = await db.prepare(`SELECT * FROM transactions WHERE id = ? AND deleted_at IS NULL`).bind(id).first();
  if (!current) return null;

  await db.prepare(
    `UPDATE transactions SET date=?, type=?, category_name=?, category_id=?, amount=?, payment_method=?, account_id=?, notes=?, slip_url=?, status=?, transfer_tx_id=?, updated_at=? WHERE id=?`
  ).bind(
    data.date          ?? current.date,
    data.type          ?? current.type,
    data.category      ?? current.category_name,
    data.categoryId    !== undefined ? data.categoryId : current.category_id,
    data.amount        !== undefined ? data.amount    : current.amount,
    data.paymentMethod ?? current.payment_method,
    data.accountId     ?? current.account_id,
    data.notes         !== undefined ? data.notes     : current.notes,
    data.slipUrl       !== undefined ? data.slipUrl   : current.slip_url,
    data.status        !== undefined ? data.status    : current.status,
    data.transferTxId  !== undefined ? data.transferTxId : current.transfer_tx_id,
    now, id
  ).run();
  return getTransactionById(db, id);
}

export async function softDeleteTransaction(db, id) {
  const now = nowISO();
  await db.prepare(`UPDATE transactions SET deleted_at=?, updated_at=? WHERE id=?`).bind(now, now, id).run();
}

export async function restoreTransaction(db, id) {
  const now = nowISO();
  await db.prepare(`UPDATE transactions SET deleted_at=NULL, updated_at=? WHERE id=?`).bind(now, id).run();
}

// ─── SETTINGS ─────────────────────────────────────────────────────────────────

export async function getSetting(db, key) {
  const row = await db.prepare(`SELECT value FROM settings WHERE key = ?`).bind(key).first();
  return row?.value;
}

export async function setSetting(db, key, value, userId = null) {
  const now = nowISO();
  await db.prepare(
    `INSERT INTO settings (key, value, updated_at, updated_by) VALUES (?, ?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at, updated_by=excluded.updated_by`
  ).bind(key, String(value), now, userId).run();
}

export async function getAllSettings(db) {
  const { results } = await db.prepare(`SELECT key, value FROM settings`).all();
  return Object.fromEntries(results.map(r => [r.key, r.value]));
}

// ─── USERS ────────────────────────────────────────────────────────────────────

export async function getUsers(db) {
  const { results } = await db.prepare(
    `SELECT id, username, role, is_active, last_login_at, created_at, deleted_at FROM users ORDER BY created_at`
  ).all();
  return results;
}

export async function createUser(db, data) {
  const now = nowISO();
  await db.prepare(
    `INSERT INTO users (id, username, password_hash, role, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, 1, ?, ?)`
  ).bind(data.id, data.username, data.passwordHash, data.role || 'user', now, now).run();
}

export async function updateUserPassword(db, userId, passwordHash) {
  const now = nowISO();
  await db.prepare(`UPDATE users SET password_hash=?, updated_at=? WHERE id=?`).bind(passwordHash, now, userId).run();
}

export async function toggleUserActive(db, userId, isActive) {
  const now = nowISO();
  await db.prepare(`UPDATE users SET is_active=?, updated_at=? WHERE id=?`).bind(isActive ? 1 : 0, now, userId).run();
}

// ─── BACKUP/EXPORT DATA ───────────────────────────────────────────────────────

export async function exportAllData(db) {
  const { results: accounts }     = await db.prepare(`SELECT * FROM accounts WHERE deleted_at IS NULL`).all();
  const { results: categories }   = await db.prepare(`SELECT * FROM categories WHERE deleted_at IS NULL`).all();
  const { results: transactions } = await db.prepare(`SELECT * FROM transactions WHERE deleted_at IS NULL`).all();

  return {
    accounts    : accounts.map(toAccountAPI),
    categories  : categories.map(toCategoryAPI),
    transactions: transactions.map(toTransactionAPI),
    backupDate  : new Date().toISOString(),
    backupVersion: 1,  // v1 format for backward compat
  };
}

// ─── TRASH (soft-deleted items) ───────────────────────────────────────────────

export async function getTrash(db) {
  const { results: transactions } = await db.prepare(
    `SELECT * FROM transactions WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC LIMIT 200`
  ).all();
  const { results: accounts } = await db.prepare(
    `SELECT * FROM accounts WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC`
  ).all();
  return {
    transactions: transactions.map(toTransactionAPI),
    accounts    : accounts.map(toAccountAPI),
  };
}

// ─── AUDIT ────────────────────────────────────────────────────────────────────

export async function getAuditLogs(db, { limit = 100, offset = 0 } = {}) {
  const { results } = await db.prepare(
    `SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ? OFFSET ?`
  ).bind(limit, offset).all();
  return results;
}

// ─── DASHBOARD STATS ──────────────────────────────────────────────────────────

export async function getDashboardStats(db) {
  const today = new Date().toLocaleDateString('sv-SE');
  const monthStart = today.slice(0, 7) + '-01';

  const [acc, tx, todayIncome, todayExpense, monthIncome, monthExpense, cats, backups] = await Promise.all([
    db.prepare(`SELECT COUNT(*) as c FROM accounts WHERE deleted_at IS NULL`).first(),
    db.prepare(`SELECT COUNT(*) as c FROM transactions WHERE deleted_at IS NULL`).first(),
    db.prepare(`SELECT COALESCE(SUM(amount),0) as s FROM transactions WHERE type='income' AND date=? AND deleted_at IS NULL`).bind(today).first(),
    db.prepare(`SELECT COALESCE(SUM(amount),0) as s FROM transactions WHERE type='expense' AND date=? AND deleted_at IS NULL`).bind(today).first(),
    db.prepare(`SELECT COALESCE(SUM(amount),0) as s FROM transactions WHERE type='income' AND date>=? AND deleted_at IS NULL`).bind(monthStart).first(),
    db.prepare(`SELECT COALESCE(SUM(amount),0) as s FROM transactions WHERE type='expense' AND date>=? AND deleted_at IS NULL`).bind(monthStart).first(),
    db.prepare(`SELECT COUNT(*) as c FROM categories WHERE deleted_at IS NULL`).first(),
    db.prepare(`SELECT * FROM backup_history ORDER BY created_at DESC LIMIT 1`).first(),
  ]);

  return {
    accounts       : acc?.c || 0,
    transactions   : tx?.c  || 0,
    categories     : cats?.c || 0,
    todayIncome    : todayIncome?.s  || 0,
    todayExpense   : todayExpense?.s || 0,
    monthIncome    : monthIncome?.s  || 0,
    monthExpense   : monthExpense?.s || 0,
    lastBackup     : backups || null,
  };
}

// ─── Format Converters (snake_case → camelCase) ───────────────────────────────

function toAccountAPI(row) {
  return {
    id             : row.id,
    name           : row.name,
    type           : row.type,
    accountNumber  : row.account_number,
    bankName       : row.bank_name,
    initialBalance : row.initial_balance,
    balance        : row.balance !== undefined ? row.balance : row.initial_balance,
    isDefault      : Boolean(row.is_default),
    sortOrder      : row.sort_order,
    createdAt      : row.created_at,
    deletedAt      : row.deleted_at || null,
  };
}

function toCategoryAPI(row) {
  return {
    id        : row.id,
    name      : row.name,
    type      : row.type,
    isSystem  : Boolean(row.is_system),
    sortOrder : row.sort_order,
    createdAt : row.created_at,
    deletedAt : row.deleted_at || null,
  };
}

function toTransactionAPI(row) {
  return {
    id            : row.id,
    date          : row.date,
    type          : row.type,
    category      : row.category_name,
    categoryId    : row.category_id || null,
    amount        : Number(row.amount),
    paymentMethod : row.payment_method,
    accountId     : row.account_id,
    notes         : row.notes || '',
    slipUrl       : row.slip_url || null,
    status        : row.status || null,
    transferTxId  : row.transfer_tx_id || null,
    createdAt     : row.created_at,
    deletedAt     : row.deleted_at || null,
  };
}
