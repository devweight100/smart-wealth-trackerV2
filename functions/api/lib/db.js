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
  await ensureBankAlertsTables(db);
  await db.prepare(
    `INSERT INTO accounts (id, name, type, account_number, bank_name, initial_balance, sort_order, alert_email, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    data.id, data.name, data.type, data.accountNumber || '-',
    data.bankName || '-', data.initialBalance || 0, data.sortOrder || 0,
    data.alertEmail || null, now, now
  ).run();
  return getAccountById(db, data.id);
}

export async function updateAccount(db, id, data) {
  const now = nowISO();
  await ensureBankAlertsTables(db);
  const current = await db.prepare(`SELECT * FROM accounts WHERE id = ? AND deleted_at IS NULL`).bind(id).first();
  if (!current) return null;

  await db.prepare(
    `UPDATE accounts SET name=?, type=?, account_number=?, bank_name=?, initial_balance=?, alert_email=?, updated_at=? WHERE id=?`
  ).bind(
    data.name ?? current.name,
    data.type ?? current.type,
    data.accountNumber ?? current.account_number,
    data.bankName ?? current.bank_name,
    data.initialBalance !== undefined ? data.initialBalance : current.initial_balance,
    data.alertEmail !== undefined ? (data.alertEmail ? data.alertEmail.trim() : null) : (current.alert_email || null),
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
  const current = await db.prepare(`SELECT * FROM categories WHERE id = ? AND deleted_at IS NULL`).bind(id).first();
  if (!current) return null;

  await db.prepare(
    `UPDATE categories SET name=?, sort_order=?, updated_at=? WHERE id=? AND deleted_at IS NULL`
  ).bind(
    data.name !== undefined ? data.name : current.name,
    data.sortOrder !== undefined ? data.sortOrder : current.sort_order,
    now, id
  ).run();
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
       (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, transfer_tx_id, due_date, created_by, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    data.id, data.date, data.type,
    data.category, data.categoryId || null,
    data.amount, data.paymentMethod, data.accountId,
    data.notes || '', data.slipUrl || null,
    data.type === 'future' ? (data.status || 'pending') : null,
    data.transferTxId || null,
    data.dueDate || null,
    data.createdBy || null, now, now
  ).run();
  return getTransactionById(db, data.id);
}

export async function updateTransaction(db, id, data) {
  const now     = nowISO();
  const current = await db.prepare(`SELECT * FROM transactions WHERE id = ? AND deleted_at IS NULL`).bind(id).first();
  if (!current) return null;

  await db.prepare(
    `UPDATE transactions SET date=?, type=?, category_name=?, category_id=?, amount=?, payment_method=?, account_id=?, notes=?, slip_url=?, status=?, transfer_tx_id=?, due_date=?, updated_at=? WHERE id=?`
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
    data.dueDate       !== undefined ? data.dueDate   : current.due_date,
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

// ─── SHIFT CLOSINGS ───────────────────────────────────────────────────────────

export async function getShiftClosings(db) {
  // Ensure shift_closings table exists
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS shift_closings (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        shift_name TEXT NOT NULL,
        cash_amount REAL DEFAULT 0,
        total_cash_income REAL DEFAULT 0,
        total_transfer_income REAL DEFAULT 0,
        total_income REAL DEFAULT 0,
        total_expense REAL DEFAULT 0,
        net_amount REAL DEFAULT 0,
        transfers_json TEXT,
        expenses_json TEXT,
        created_tx_ids TEXT,
        file_url TEXT,
        created_by TEXT,
        created_at TEXT NOT NULL,
        deleted_at TEXT
      )
    `).run();
  } catch (err) {
    console.error('Error creating shift_closings table:', err);
  }

  try {
    const { results } = await db.prepare(
      `SELECT * FROM shift_closings WHERE deleted_at IS NULL ORDER BY date DESC, created_at DESC`
    ).all();
    return (results || []).map(toShiftClosingAPI);
  } catch (err) {
    console.error('Error fetching shift_closings:', err);
    return [];
  }
}

export async function createShiftClosing(db, data) {
  await getShiftClosings(db); // ensure table exists
  const now = nowISO();

  const resolvedCash = Number(data.cashAmount || data.cashIncome || data.totalCashIncome || 0);

  await db.prepare(
    `INSERT INTO shift_closings (
      id, date, shift_name, cash_amount, total_cash_income, total_transfer_income,
      total_income, total_expense, net_amount, transfers_json, expenses_json,
      created_tx_ids, file_url, created_by, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      date = excluded.date,
      shift_name = excluded.shift_name,
      cash_amount = excluded.cash_amount,
      total_cash_income = excluded.total_cash_income,
      total_transfer_income = excluded.total_transfer_income,
      total_income = excluded.total_income,
      total_expense = excluded.total_expense,
      net_amount = excluded.net_amount,
      transfers_json = excluded.transfers_json,
      expenses_json = excluded.expenses_json,
      created_tx_ids = excluded.created_tx_ids,
      file_url = COALESCE(excluded.file_url, shift_closings.file_url),
      deleted_at = NULL`
  ).bind(
    data.id,
    data.date,
    data.shiftName,
    resolvedCash,
    resolvedCash,
    data.totalTransferIncome || 0,
    data.totalIncome || 0,
    data.totalExpense || 0,
    data.netAmount || 0,
    JSON.stringify(data.transfers || data.transferIncomes || []),
    JSON.stringify(data.expenses || []),
    JSON.stringify(data.createdTxIds || []),
    data.fileUrl || null,
    data.createdBy || null,
    data.createdAt || now
  ).run();

  return data;
}

export async function updateShiftClosing(db, id, data) {
  await getShiftClosings(db);
  const resolvedCash = Number(data.cashAmount || data.cashIncome || data.totalCashIncome || 0);

  await db.prepare(
    `UPDATE shift_closings SET
      date = ?,
      shift_name = ?,
      cash_amount = ?,
      total_cash_income = ?,
      total_transfer_income = ?,
      total_income = ?,
      total_expense = ?,
      net_amount = ?,
      transfers_json = ?,
      expenses_json = ?,
      created_tx_ids = ?,
      file_url = COALESCE(?, file_url),
      deleted_at = NULL
     WHERE id = ?`
  ).bind(
    data.date,
    data.shiftName,
    resolvedCash,
    resolvedCash,
    data.totalTransferIncome || 0,
    data.totalIncome || 0,
    data.totalExpense || 0,
    data.netAmount || 0,
    JSON.stringify(data.transfers || data.transferIncomes || []),
    JSON.stringify(data.expenses || []),
    JSON.stringify(data.createdTxIds || []),
    data.fileUrl || null,
    id
  ).run();

  return { id, ...data };
}

export async function deleteShiftClosing(db, id) {
  const now = nowISO();
  try {
    await db.prepare(`UPDATE shift_closings SET deleted_at=?, updated_at=? WHERE id=?`).bind(now, now, id).run();
  } catch (e) {
    await db.prepare(`UPDATE shift_closings SET deleted_at=? WHERE id=?`).bind(now, id).run();
  }
}

function toShiftClosingAPI(row) {
  const transfers = row.transfers_json ? JSON.parse(row.transfers_json) : [];
  const expenses = row.expenses_json ? JSON.parse(row.expenses_json) : [];
  const rawCash = Number(row.cash_amount || 0);
  const rawTotalCash = Number(row.total_cash_income || 0);
  const totalInc = Number(row.total_income || 0);
  const totalTransferInc = Number(row.total_transfer_income || 0);
  
  // Robust cash resolution: if cash_amount is 0 but total_cash_income or (total_income - total_transfer_income) > 0, fallback!
  const resolvedCash = rawCash || rawTotalCash || Math.max(0, totalInc - totalTransferInc);

  return {
    id: row.id,
    date: row.date,
    shiftName: row.shift_name,
    cashAmount: resolvedCash,
    cashIncome: resolvedCash,
    totalCashIncome: resolvedCash,
    totalTransferIncome: totalTransferInc,
    totalIncome: totalInc,
    totalExpense: Number(row.total_expense || 0),
    netAmount: Number(row.net_amount || 0),
    transfers,
    transferIncomes: transfers,
    expenses,
    createdTxIds: row.created_tx_ids ? JSON.parse(row.created_tx_ids) : [],
    fileUrl: row.file_url || null,
    createdBy: row.created_by || null,
    createdAt: row.created_at
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
    alertEmail     : row.alert_email || null,
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
    dueDate       : row.due_date || null,
    createdAt     : row.created_at,
    deletedAt     : row.deleted_at || null,
  };
}

// ─── BANK ALERTS & COUNTERPARTY MEMORY ────────────────────────────────────────

export async function ensureBankAlertsTables(db) {
  try {
    await db.prepare(`ALTER TABLE accounts ADD COLUMN alert_email TEXT`).run();
  } catch (e) {
    // Ignore if column already exists
  }

  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS counterparty_memory (
        id                   TEXT PRIMARY KEY,
        account_id           TEXT NOT NULL,
        counterparty_account TEXT NOT NULL,
        counterparty_name    TEXT,
        type                 TEXT NOT NULL,
        last_notes           TEXT NOT NULL,
        last_category        TEXT,
        updated_at           TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE(account_id, counterparty_account, type)
      )
    `).run();
    await db.prepare(`CREATE INDEX IF NOT EXISTS idx_cpm_lookup ON counterparty_memory(account_id, counterparty_account, type)`).run();
  } catch (e) {
    // Table might already exist
  }

  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS bank_alerts (
        id                   TEXT PRIMARY KEY,
        email                TEXT NOT NULL,
        account_id           TEXT,
        account_number       TEXT NOT NULL,
        tx_time              TEXT NOT NULL,
        type                 TEXT NOT NULL,
        amount               REAL NOT NULL,
        counterparty_account TEXT,
        counterparty_name    TEXT,
        channel              TEXT,
        raw_subject          TEXT,
        raw_snippet          TEXT,
        is_imported          INTEGER NOT NULL DEFAULT 0,
        shift_id             TEXT,
        created_at           TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `).run();
    await db.prepare(`CREATE INDEX IF NOT EXISTS idx_bank_alerts_acc ON bank_alerts(account_id, tx_time)`).run();
    await db.prepare(`CREATE INDEX IF NOT EXISTS idx_bank_alerts_status ON bank_alerts(is_imported)`).run();
  } catch (e) {
    // Table might already exist
  }
}

export async function saveBankAlerts(db, alerts) {
  await ensureBankAlertsTables(db);
  const now = nowISO();
  const saved = [];

  const { results: accounts } = await db.prepare(
    `SELECT * FROM accounts WHERE deleted_at IS NULL`
  ).all();

  const cleanNum = (n) => (n || '').replace(/[^0-9]/g, '');

  for (const item of alerts) {
    if (!item.amount || !item.accountNumber) continue;

    let matchedAcc = null;
    const itemAccClean = cleanNum(item.accountNumber);
    const itemEmailClean = (item.email || '').trim().toLowerCase();

    if (item.accountId) {
      matchedAcc = accounts.find(a => a.id === item.accountId);
    } else {
      matchedAcc = accounts.find(a => {
        const aNumClean = cleanNum(a.account_number);
        const aEmailClean = (a.alert_email || '').trim().toLowerCase();
        const emailMatch = !itemEmailClean || !aEmailClean || (itemEmailClean === aEmailClean);
        const accMatch = (aNumClean.length >= 3 && itemAccClean.length >= 3) &&
          (aNumClean === itemAccClean || aNumClean.endsWith(itemAccClean) || itemAccClean.endsWith(aNumClean));
        return emailMatch && accMatch;
      });
      if (!matchedAcc) {
        matchedAcc = accounts.find(a => {
          const aNumClean = cleanNum(a.account_number);
          return (aNumClean.length >= 3 && itemAccClean.length >= 3) &&
            (aNumClean === itemAccClean || aNumClean.endsWith(itemAccClean) || itemAccClean.endsWith(aNumClean));
        });
      }
    }

    const id = item.id || ('ALERT-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6));
    const accId = matchedAcc ? matchedAcc.id : (item.accountId || null);

    try {
      await db.prepare(`
        INSERT INTO bank_alerts (
          id, email, account_id, account_number, tx_time, type,
          amount, counterparty_account, counterparty_name, channel,
          raw_subject, raw_snippet, is_imported, shift_id, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          account_id = COALESCE(excluded.account_id, bank_alerts.account_id),
          amount = excluded.amount,
          counterparty_account = COALESCE(excluded.counterparty_account, bank_alerts.counterparty_account),
          counterparty_name = COALESCE(excluded.counterparty_name, bank_alerts.counterparty_name),
          channel = COALESCE(excluded.channel, bank_alerts.channel)
      `).bind(
        id,
        item.email || (matchedAcc?.alert_email) || '',
        accId,
        item.accountNumber,
        item.txTime || item.date || now,
        item.type || 'income',
        Number(item.amount),
        item.counterpartyAccount || null,
        item.counterpartyName || null,
        item.channel || 'Transfer',
        item.rawSubject || null,
        item.rawSnippet || null,
        item.isImported ? 1 : 0,
        item.shiftId || null,
        item.createdAt || now
      ).run();

      saved.push({ id, accountId: accId, amount: item.amount });
    } catch (err) {
      console.error('Error saving bank alert:', err);
    }
  }

  return saved;
}

export async function getBankAlerts(db, options = {}) {
  await ensureBankAlertsTables(db);
  const { accountId, date, unimportedOnly = true } = options;

  let sql = `SELECT b.*, a.name as account_name, a.bank_name as bank_name 
             FROM bank_alerts b 
             LEFT JOIN accounts a ON b.account_id = a.id 
             WHERE 1=1`;
  const params = [];

  if (unimportedOnly) {
    sql += ` AND b.is_imported = 0`;
  }
  if (accountId) {
    sql += ` AND b.account_id = ?`;
    params.push(accountId);
  }
  if (date) {
    sql += ` AND substr(b.tx_time, 1, 10) = ?`;
    params.push(date);
  }

  sql += ` ORDER BY b.tx_time DESC, b.created_at DESC LIMIT 200`;

  const { results } = await db.prepare(sql).bind(...params).all();

  const memories = await getAllCounterpartyMemories(db);
  const memMap = {};
  memories.forEach(m => {
    const key = `${m.accountId || '*'}_${(m.counterpartyAccount || '').trim()}_${m.type}`;
    memMap[key] = m;
    const fallbackKey = `*_${(m.counterpartyAccount || '').trim()}_${m.type}`;
    if (!memMap[fallbackKey]) memMap[fallbackKey] = m;
  });

  return (results || []).map(row => {
    const cpAcc = (row.counterparty_account || '').trim();
    const type = row.type || 'income';
    const directKey = `${row.account_id}_${cpAcc}_${type}`;
    const fallbackKey = `*_${cpAcc}_${type}`;
    const memory = cpAcc ? (memMap[directKey] || memMap[fallbackKey]) : null;

    return {
      id: row.id,
      email: row.email,
      accountId: row.account_id,
      accountName: row.account_name,
      bankName: row.bank_name,
      accountNumber: row.account_number,
      txTime: row.tx_time,
      type: row.type,
      amount: Number(row.amount),
      counterpartyAccount: row.counterparty_account,
      counterpartyName: row.counterparty_name,
      channel: row.channel,
      rawSubject: row.raw_subject,
      rawSnippet: row.raw_snippet,
      isImported: Boolean(row.is_imported),
      shiftId: row.shift_id,
      createdAt: row.created_at,
      suggestedNotes: memory ? memory.lastNotes : '',
      suggestedCategory: memory ? memory.lastCategory : '',
      hasMemoryMatch: Boolean(memory)
    };
  });
}

export async function markBankAlertsImported(db, ids, shiftId = null) {
  if (!ids || ids.length === 0) return;
  await ensureBankAlertsTables(db);
  for (const id of ids) {
    await db.prepare(`UPDATE bank_alerts SET is_imported = 1, shift_id = COALESCE(?, shift_id) WHERE id = ?`).bind(shiftId, id).run();
  }
}

export async function upsertCounterpartyMemory(db, data) {
  await ensureBankAlertsTables(db);
  const now = nowISO();
  const id = `MEM-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

  await db.prepare(`
    INSERT INTO counterparty_memory (
      id, account_id, counterparty_account, counterparty_name, type, last_notes, last_category, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(account_id, counterparty_account, type) DO UPDATE SET
      last_notes = excluded.last_notes,
      last_category = COALESCE(excluded.last_category, counterparty_memory.last_category),
      counterparty_name = COALESCE(excluded.counterparty_name, counterparty_memory.counterparty_name),
      updated_at = excluded.updated_at
  `).bind(
    id,
    data.accountId,
    (data.counterpartyAccount || '').trim(),
    data.counterpartyName || null,
    data.type || 'income',
    data.lastNotes || '',
    data.lastCategory || null,
    now
  ).run();
}

export async function getAllCounterpartyMemories(db, accountId = null) {
  await ensureBankAlertsTables(db);
  let sql = `SELECT * FROM counterparty_memory`;
  const params = [];
  if (accountId) {
    sql += ` WHERE account_id = ?`;
    params.push(accountId);
  }
  sql += ` ORDER BY updated_at DESC`;

  const { results } = await db.prepare(sql).bind(...params).all();
  return (results || []).map(r => ({
    id: r.id,
    accountId: r.account_id,
    counterpartyAccount: r.counterparty_account,
    counterpartyName: r.counterparty_name,
    type: r.type,
    lastNotes: r.last_notes,
    lastCategory: r.last_category,
    updatedAt: r.updated_at
  }));
}
