const fs = require('fs');
const path = require('path');

const backupPath = 'I:/My Drive/ไฟล์เว็บรายรับรายจ่าย/Ai รายรับรายจ่าย/BackupFile/Smart_Wealth_Tracker_Backup_2026-07-03.json';
const sqlPath = 'v2-import.sql';

try {
  const data = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
  let sql = `-- Auto-generated SQL for Smart Wealth Tracker v2 Import\n\n`;

  // Fix Schema for V1 to V2 migration missing columns
  sql += `-- Apply missing columns for v2 schema compatibility\n`;
  sql += `ALTER TABLE accounts ADD COLUMN color TEXT;\n`;
  sql += `ALTER TABLE accounts ADD COLUMN created_by TEXT;\n`;
  sql += `ALTER TABLE categories ADD COLUMN icon TEXT;\n`;
  sql += `ALTER TABLE categories ADD COLUMN color TEXT;\n`;
  sql += `ALTER TABLE categories ADD COLUMN created_by TEXT;\n\n`;

  // Helper to escape strings
  const escapeStr = (str) => {
    if (str === null || str === undefined) return 'NULL';
    return "'" + String(str).replace(/'/g, "''") + "'";
  };

  // 1. Insert Accounts
  if (data.accounts && data.accounts.length > 0) {
    sql += `-- Accounts\n`;
    for (const acc of data.accounts) {
      sql += `INSERT OR IGNORE INTO accounts (id, name, type, bank_name, initial_balance, color, created_by, created_at, updated_at, deleted_at) VALUES (${escapeStr(acc.id)}, ${escapeStr(acc.name)}, ${escapeStr(acc.type)}, ${escapeStr(acc.bank_name)}, ${acc.initialBalance || acc.initial_balance || 0}, ${escapeStr(acc.color)}, ${escapeStr(acc.created_by)}, ${escapeStr(acc.created_at)}, ${escapeStr(acc.updated_at)}, ${escapeStr(acc.deleted_at)});\n`;
    }
    sql += `\n`;
  }

  // 2. Insert Categories
  if (data.categories && data.categories.length > 0) {
    sql += `-- Categories\n`;
    for (const cat of data.categories) {
      sql += `INSERT OR IGNORE INTO categories (id, name, type, icon, color, created_by, created_at, updated_at, deleted_at) VALUES (${escapeStr(cat.id)}, ${escapeStr(cat.name)}, ${escapeStr(cat.type)}, ${escapeStr(cat.icon)}, ${escapeStr(cat.color)}, ${escapeStr(cat.created_by)}, ${escapeStr(cat.created_at)}, ${escapeStr(cat.updated_at)}, ${escapeStr(cat.deleted_at)});\n`;
    }
    sql += `\n`;
  }

  // 3. Insert Transactions
  if (data.transactions && data.transactions.length > 0) {
    sql += `-- Transactions\n`;
    for (const tx of data.transactions) {
      sql += `INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_by, created_at, updated_at, deleted_at) VALUES (${escapeStr(tx.id)}, ${escapeStr(tx.date)}, ${escapeStr(tx.type)}, ${escapeStr(tx.category_name)}, ${escapeStr(tx.category_id)}, ${tx.amount}, ${escapeStr(tx.payment_method)}, ${escapeStr(tx.account_id)}, ${escapeStr(tx.notes)}, ${escapeStr(tx.slip_url)}, ${escapeStr(tx.status)}, ${escapeStr(tx.created_by)}, ${escapeStr(tx.created_at)}, ${escapeStr(tx.updated_at)}, ${escapeStr(tx.deleted_at)});\n`;
    }
    sql += `\n`;
  }

  // 4. Inject Default LINE Settings
  sql += `-- Default LINE Settings\n`;
  const lineToken = "rInIWjuPWIdapzPzBmIok8nhGD5s8YMeo4WfWRL30gA09DuzdbQIYQgatk/NOfzyDdPVfsHYMUJ6VIakeRfnIAwsivaxrMqkRgshSg6aQKVhEq35CwKMW92GNexo7YFvnUjGeolnjUaSCEhWe3sP5AdB04t89/1O/w1cDnyilFU=";
  const lineGroupId = "Cac9ec37115f7a29ed3798dd91c4af7d6";
  const now = new Date().toISOString();
  
  sql += `INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES ('line_channel_token', ${escapeStr(lineToken)}, '${now}');\n`;
  sql += `INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES ('line_group_id', ${escapeStr(lineGroupId)}, '${now}');\n`;
  
  fs.writeFileSync(sqlPath, sql, 'utf8');
  console.log('✅ Generated ' + sqlPath + ' successfully!');

} catch (err) {
  console.error('Error generating SQL:', err.message);
}
