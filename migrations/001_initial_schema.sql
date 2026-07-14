-- ============================================================
-- SMART WEALTH TRACKER — D1 Schema v1
-- Run: npx wrangler d1 execute smart-wealth-db --file=migrations/001_initial_schema.sql --remote
-- ============================================================

-- D1 Note: PRAGMA journal_mode and foreign_keys are managed automatically by D1

-- ------------------------------------------------------------
-- Schema Version Tracking
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS schema_versions (
  version     INTEGER PRIMARY KEY,
  description TEXT    NOT NULL,
  applied_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO schema_versions (version, description)
VALUES (1, 'Initial D1 schema — migrated from Cloudflare KV');

-- ------------------------------------------------------------
-- USERS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id              TEXT    PRIMARY KEY,
  username        TEXT    NOT NULL UNIQUE,
  password_hash   TEXT    NOT NULL,
  role            TEXT    NOT NULL DEFAULT 'user',   -- 'admin' | 'user'
  is_active       INTEGER NOT NULL DEFAULT 1,
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until    TEXT,                               -- ISO datetime or NULL
  last_login_at   TEXT,
  created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT    NOT NULL DEFAULT (datetime('now')),
  deleted_at      TEXT
);

-- ------------------------------------------------------------
-- SESSIONS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sessions (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash   TEXT NOT NULL UNIQUE,
  user_agent   TEXT,
  ip_address   TEXT,
  expires_at   TEXT NOT NULL,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  last_used_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_sessions_token   ON sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_user    ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- ------------------------------------------------------------
-- ACCOUNTS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS accounts (
  id              TEXT    PRIMARY KEY,
  name            TEXT    NOT NULL,
  type            TEXT    NOT NULL DEFAULT 'bank',  -- 'cash' | 'bank'
  account_number  TEXT    NOT NULL DEFAULT '-',
  bank_name       TEXT    NOT NULL DEFAULT '-',
  initial_balance REAL    NOT NULL DEFAULT 0,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  is_default      INTEGER NOT NULL DEFAULT 0,       -- 1 = acc-cash (protected)
  created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT    NOT NULL DEFAULT (datetime('now')),
  deleted_at      TEXT
);

CREATE INDEX IF NOT EXISTS idx_accounts_deleted ON accounts(deleted_at);

-- ------------------------------------------------------------
-- CATEGORIES
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
  id         TEXT    PRIMARY KEY,
  name       TEXT    NOT NULL,
  type       TEXT    NOT NULL,                      -- 'income' | 'expense'
  is_system  INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT    NOT NULL DEFAULT (datetime('now')),
  deleted_at TEXT,
  UNIQUE(name, type, deleted_at)
);

CREATE INDEX IF NOT EXISTS idx_categories_type    ON categories(type);
CREATE INDEX IF NOT EXISTS idx_categories_deleted ON categories(deleted_at);

-- ------------------------------------------------------------
-- TRANSACTIONS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transactions (
  id             TEXT    PRIMARY KEY,
  date           TEXT    NOT NULL,                  -- 'YYYY-MM-DD'
  type           TEXT    NOT NULL,                  -- 'income' | 'expense' | 'future'
  category_name  TEXT    NOT NULL,                  -- ชื่อ category (backward compat)
  category_id    TEXT    REFERENCES categories(id) ON DELETE SET NULL,
  amount         REAL    NOT NULL DEFAULT 0,
  payment_method TEXT    NOT NULL DEFAULT 'Cash',   -- 'Cash' | 'Transfer'
  account_id     TEXT    NOT NULL REFERENCES accounts(id),
  notes          TEXT    NOT NULL DEFAULT '',
  slip_url       TEXT,                              -- file URL or NULL
  status         TEXT,                              -- 'pending' | 'paid' (future only)
  created_by     TEXT    REFERENCES users(id) ON DELETE SET NULL,
  created_at     TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT    NOT NULL DEFAULT (datetime('now')),
  deleted_at     TEXT
);

CREATE INDEX IF NOT EXISTS idx_tx_date      ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_tx_account   ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_tx_type      ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_tx_category  ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_tx_deleted   ON transactions(deleted_at);

-- ------------------------------------------------------------
-- ATTACHMENTS (metadata for uploaded files)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS attachments (
  id              TEXT PRIMARY KEY,
  transaction_id  TEXT REFERENCES transactions(id) ON DELETE SET NULL,
  original_name   TEXT NOT NULL,
  stored_name     TEXT NOT NULL,
  file_url        TEXT NOT NULL,
  mime_type       TEXT,
  file_size       INTEGER,
  storage_backend TEXT NOT NULL DEFAULT 'kv',       -- 'kv' | 'r2'
  width           INTEGER,
  height          INTEGER,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at      TEXT
);

-- ------------------------------------------------------------
-- AUDIT LOGS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
  id          TEXT PRIMARY KEY,
  user_id     TEXT REFERENCES users(id) ON DELETE SET NULL,
  username    TEXT,                                 -- snapshot for display
  action      TEXT NOT NULL,                        -- 'login'|'logout'|'create'|'update'|'delete'|'restore'|'backup'|'import'
  resource    TEXT NOT NULL,                        -- 'transaction'|'account'|'category'|'user'|'system'
  resource_id TEXT,
  ip_address  TEXT,
  user_agent  TEXT,
  old_data    TEXT,                                 -- JSON snapshot
  new_data    TEXT,                                 -- JSON snapshot
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_audit_user    ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action  ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_resource ON audit_logs(resource);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);

-- ------------------------------------------------------------
-- SETTINGS (key-value config store)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_by TEXT REFERENCES users(id) ON DELETE SET NULL
);

INSERT OR IGNORE INTO settings (key, value) VALUES
  ('app_version',             '2.0.0'),
  ('db_schema_version',       '1'),
  ('backup_retention_days',   '30'),
  ('daily_report_enabled',    'true'),
  ('daily_backup_enabled',    'true'),
  ('line_user_id',            ''),
  ('gdrive_folder_id',        '');

-- ------------------------------------------------------------
-- BACKUP HISTORY
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS backup_history (
  id             TEXT PRIMARY KEY,
  backup_version TEXT NOT NULL DEFAULT '1',
  app_version    TEXT,
  accounts_count INTEGER,
  tx_count       INTEGER,
  categories_count INTEGER,
  storage_path   TEXT,
  file_size      INTEGER,
  checksum       TEXT,
  status         TEXT NOT NULL DEFAULT 'pending',   -- 'pending'|'success'|'failed'
  error_message  TEXT,
  created_by     TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_backup_created ON backup_history(created_at);
CREATE INDEX IF NOT EXISTS idx_backup_status  ON backup_history(status);
