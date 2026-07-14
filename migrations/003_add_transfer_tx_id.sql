-- ============================================================
-- SMART WEALTH TRACKER — D1 Schema v2 Migration (Add Transfer Support)
-- Run: npx wrangler d1 execute smart-wealth-db-v2 --file=migrations/003_add_transfer_tx_id.sql --remote
-- ============================================================

ALTER TABLE transactions ADD COLUMN transfer_tx_id TEXT;
CREATE INDEX IF NOT EXISTS idx_tx_transfer_tx_id ON transactions(transfer_tx_id);
