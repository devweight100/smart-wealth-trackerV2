-- migrations/002_seed_admin.sql
-- Seed admin user: admin / Htmsxzs7
-- Generated via seed_admin.js with PBKDF2-SHA256 (100000 iterations)
-- Run: npx wrangler d1 execute smart-wealth-db --file=./migrations/002_seed_admin.sql

INSERT OR IGNORE INTO users (id, username, password_hash, role, is_active, created_at, updated_at)
VALUES (
  'user-admin-001',
  'admin',
  'pbkdf2sha256:100000:8db98d5dd41e80a17a51fb955464488b:19ff3f0244cbccb968ffa09c3237d2b0f09eb2695d67c2daf7ff8ca45fde3232',
  'admin',
  1,
  '2026-07-02 08:27:42',
  '2026-07-02 08:27:42'
);

-- Seed default system settings
INSERT OR IGNORE INTO settings (key, value, updated_at)
VALUES
  ('backup_retention_days', '30',    '2026-07-02 08:27:42'),
  ('daily_report_enabled',  'true',  '2026-07-02 08:27:42'),
  ('timezone',              'Asia/Bangkok', '2026-07-02 08:27:42');
