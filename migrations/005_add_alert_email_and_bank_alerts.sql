-- Migration 005: Add alert_email to accounts, counterparty_memory and bank_alerts tables

ALTER TABLE accounts ADD COLUMN alert_email TEXT;

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
);

CREATE INDEX IF NOT EXISTS idx_cpm_lookup ON counterparty_memory(account_id, counterparty_account, type);

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
);

CREATE INDEX IF NOT EXISTS idx_bank_alerts_acc ON bank_alerts(account_id, tx_time);
CREATE INDEX IF NOT EXISTS idx_bank_alerts_status ON bank_alerts(is_imported);
