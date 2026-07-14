-- ==========================================================
-- Smart Wealth Tracker â€” Migration Data
-- Generated: 2026-07-02T08:36:00.937Z
-- Source backup: Smart_Wealth_Tracker_Backup_2026-07-02.json
-- Backup version: 1
-- ==========================================================


-- USERS
INSERT OR IGNORE INTO users (id, username, password_hash, role, is_active, created_at, updated_at)
VALUES ('user-admin', 'admin', 'pbkdf2sha256:100000:36b90e76300362314a64cb6306f94ebe:203d11d86ef80cd6e1be00edede7a89999f2652b03e9644fa47b6578a24c4989', 'admin', 1, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');

-- ACCOUNTS
INSERT OR IGNORE INTO accounts (id, name, type, account_number, bank_name, initial_balance, is_default, created_at, updated_at)
VALUES ('acc-cash', 'à¹€à¸‡à¸´à¸™à¸ªà¸”', 'cash', '-', '-', 482603, 1, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO accounts (id, name, type, account_number, bank_name, initial_balance, is_default, created_at, updated_at)
VALUES ('acc-1780128518689', 'à¸žà¸£à¹‰à¸­à¸¡à¹€à¸žà¸¢à¹Œ à¸ à¸²à¸“à¸¸à¸§à¸´à¸Šà¸à¹Œ', 'bank', '870-2-17538-1', 'à¸à¸ªà¸´à¸à¸£à¹„à¸—à¸¢', 17725.88, 0, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO accounts (id, name, type, account_number, bank_name, initial_balance, is_default, created_at, updated_at)
VALUES ('acc-1780129287573', 'à¸ˆà¸‡à¹€à¸ˆà¸£à¸´à¸à¸—à¸£à¸±à¸žà¸¢à¹Œ à¹€à¸—à¸£à¸”à¸”à¸´à¹‰à¸‡', 'bank', '231-1-81156-0', 'à¸à¸ªà¸´à¸à¸£à¹„à¸—à¸¢', 55885, 0, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO accounts (id, name, type, account_number, bank_name, initial_balance, is_default, created_at, updated_at)
VALUES ('acc-1780372598070', 'à¸žà¸£à¹‰à¸­à¸¡à¹€à¸žà¸¢à¹Œ à¸›à¸™à¸±à¸™à¸”à¸²', 'bank', '464-1-23182-6', 'à¸à¸£à¸¸à¸‡à¸¨à¸£à¸µà¸­à¸¢à¸¸à¸˜à¸¢à¸²', 15414, 0, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO accounts (id, name, type, account_number, bank_name, initial_balance, is_default, created_at, updated_at)
VALUES ('acc-1780372741319', 'à¸žà¸£à¹‰à¸­à¸¡à¹€à¸žà¸¢à¹Œ à¸¢à¸¨à¸«à¸´à¸£à¸±à¸', 'bank', '464-1-35782-3', 'à¸à¸£à¸¸à¸‡à¸¨à¸£à¸µà¸­à¸¢à¸¸à¸˜à¸¢à¸²', 53281, 0, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO accounts (id, name, type, account_number, bank_name, initial_balance, is_default, created_at, updated_at)
VALUES ('acc-1780372785201', 'à¸à¸£à¸¸à¸‡à¹„à¸—à¸¢ à¸›à¸™à¸±à¸™à¸”à¸²', 'bank', '978-0-09375-3', 'à¸à¸£à¸¸à¸‡à¹„à¸—à¸¢', 28035, 0, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO accounts (id, name, type, account_number, bank_name, initial_balance, is_default, created_at, updated_at)
VALUES ('acc-1781517994948', 'à¸›à¸™à¸±à¸™à¸”à¸² à¸à¸ªà¸´à¸à¸£', 'bank', '0908403746', 'à¸à¸ªà¸´à¸à¸£à¹„à¸—à¸¢', 63.24, 0, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');

-- CATEGORIES
INSERT OR IGNORE INTO categories (id, name, type, is_system, created_at, updated_at)
VALUES ('cat-inc-1', 'POS', 'income', 0, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO categories (id, name, type, is_system, created_at, updated_at)
VALUES ('cat-inc-2', 'à¸£à¸²à¸¢à¹„à¸”à¹‰à¹€à¸ªà¸£à¸´à¸¡', 'income', 0, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO categories (id, name, type, is_system, created_at, updated_at)
VALUES ('cat-inc-3', 'à¹‚à¸­à¸™à¹€à¸‡à¸´à¸™à¹€à¸‚à¹‰à¸²', 'income', 0, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO categories (id, name, type, is_system, created_at, updated_at)
VALUES ('cat-inc-4', 'à¸”à¸­à¸à¹€à¸šà¸µà¹‰à¸¢ / à¹€à¸‡à¸´à¸™à¸›à¸±à¸™à¸œà¸¥', 'income', 0, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO categories (id, name, type, is_system, created_at, updated_at)
VALUES ('cat-inc-5', 'à¸­à¸·à¹ˆà¸™à¹†', 'income', 0, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO categories (id, name, type, is_system, created_at, updated_at)
VALUES ('cat-exp-1', 'à¸„à¹ˆà¸²à¸‚à¸™à¸ªà¹ˆà¸‡', 'expense', 0, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO categories (id, name, type, is_system, created_at, updated_at)
VALUES ('cat-exp-2', 'à¸à¸²à¸£à¹€à¸”à¸´à¸™à¸—à¸²à¸‡ / à¸™à¹‰à¸³à¸¡à¸±à¸™', 'expense', 0, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO categories (id, name, type, is_system, created_at, updated_at)
VALUES ('cat-exp-3', 'à¹€à¸‡à¸´à¸™à¹€à¸”à¸·à¸­à¸™à¸žà¸™à¸±à¸à¸‡à¸²à¸™', 'expense', 0, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO categories (id, name, type, is_system, created_at, updated_at)
VALUES ('cat-exp-4', 'à¸„à¹ˆà¸²à¸ªà¸´à¸™à¸„à¹‰à¸²', 'expense', 0, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO categories (id, name, type, is_system, created_at, updated_at)
VALUES ('cat-exp-5', 'à¸„à¹ˆà¸²à¸™à¹‰à¸³ / à¸„à¹ˆà¸²à¹„à¸Ÿ / à¸„à¹ˆà¸²à¸­à¸´à¸™à¹€à¸—à¸­à¸£à¹Œà¹€à¸™à¹‡à¸•', 'expense', 0, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO categories (id, name, type, is_system, created_at, updated_at)
VALUES ('cat-exp-6', 'à¸„à¸§à¸²à¸¡à¸šà¸±à¸™à¹€à¸—à¸´à¸‡ / à¸—à¹ˆà¸­à¸‡à¹€à¸—à¸µà¹ˆà¸¢à¸§', 'expense', 0, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO categories (id, name, type, is_system, created_at, updated_at)
VALUES ('cat-exp-7', 'à¸ªà¸¸à¸‚à¸ à¸²à¸ž / à¸¢à¸²à¸£à¸±à¸à¸©à¸²à¹‚à¸£à¸„', 'expense', 0, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO categories (id, name, type, is_system, created_at, updated_at)
VALUES ('cat-exp-8', 'à¸­à¸·à¹ˆà¸™à¹†', 'expense', 0, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');

-- TRANSACTIONS
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1780386891636-144', '2026-06-02', 'expense', 'à¹€à¸‡à¸´à¸™à¹€à¸”à¸·à¸­à¸™à¸žà¸™à¸±à¸à¸‡à¸²à¸™', 'cat-exp-3', 12000, 'Transfer', 'acc-1780372598070', '', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1780394771731-423', '2026-06-02', 'income', 'POS', 'cat-inc-1', 33892, 'Cash', 'acc-cash', 'à¹€à¸‡à¸´à¸™à¹€à¸à¸´à¸™ 1 à¸šà¸²à¸—', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1780394856152-616', '2026-06-02', 'income', 'POS', 'cat-inc-1', 1636, 'Transfer', 'acc-1780372598070', '', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1780394874940-528', '2026-06-02', 'income', 'POS', 'cat-inc-1', 6359, 'Transfer', 'acc-1780372741319', '', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1780394983896-976', '2026-06-02', 'expense', 'à¸„à¹ˆà¸²à¸ªà¸´à¸™à¸„à¹‰à¸²', 'cat-exp-4', 23424, 'Cash', 'acc-cash', 'à¸„à¹ˆà¸²à¸‚à¸­à¸‡ MG à¹ƒà¸šà¸§à¸²à¸‡à¸šà¸´à¸¥ BI0004251', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1780480350593-527', '2026-06-03', 'income', 'POS', 'cat-inc-1', 11560, 'Cash', 'acc-cash', 'à¸›à¸´à¸”à¸à¸°', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1780480559329-98', '2026-06-03', 'income', 'POS', 'cat-inc-1', 1941, 'Transfer', 'acc-1780128518689', 'à¹€à¸•à¸µà¸¢à¸‡ 10', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1780480584018-722', '2026-06-03', 'income', 'POS', 'cat-inc-1', 11488, 'Transfer', 'acc-1780372741319', 'à¹€à¸‡à¸´à¸™à¹‚à¸­à¸™à¸›à¸´à¸”à¸à¸°', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1780543397176-556', '2026-06-04', 'expense', 'à¸„à¹ˆà¸²à¸ªà¸´à¸™à¸„à¹‰à¸²', 'cat-exp-4', 8055, 'Cash', 'acc-cash', 'à¸„à¹ˆà¸²à¸‚à¸­à¸‡KIM', '/uploads/bill-1780543395296-105847008.jpg', NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1780543478224-883', '2026-06-04', 'expense', 'à¸„à¹ˆà¸²à¸ªà¸´à¸™à¸„à¹‰à¸²', 'cat-exp-4', 20574, 'Cash', 'acc-cash', 'à¸„à¹ˆà¸²à¸‚à¸­à¸‡GV', '/uploads/bill-1780543476528-26872581.jpg', NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1780543523219-347', '2026-06-04', 'expense', 'à¸„à¹ˆà¸²à¸ªà¸´à¸™à¸„à¹‰à¸²', 'cat-exp-4', 5184, 'Cash', 'acc-cash', 'à¸„à¹ˆà¸²à¸‚à¸­à¸‡RLP', '/uploads/bill-1780543521932-507145119.jpg', NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1780548957791-96', '2026-06-04', 'expense', 'à¸„à¹ˆà¸²à¸ªà¸´à¸™à¸„à¹‰à¸²', 'cat-exp-4', 202563, 'Cash', 'acc-cash', 'à¸„à¹ˆà¸²à¸‚à¸­à¸‡ SR', '/uploads/bill-1780548956017-993656429.jpg', NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1780549653458-711', '2026-06-04', 'expense', 'à¸à¸²à¸£à¹€à¸”à¸´à¸™à¸—à¸²à¸‡ / à¸™à¹‰à¸³à¸¡à¸±à¸™', 'cat-exp-2', 100, 'Transfer', 'acc-1780128518689', 'à¸„à¹ˆà¸²à¸£à¸– Blot à¹„à¸›à¹€à¸­à¸²à¸£à¸–à¸•à¸¹à¹‰', '/uploads/bill-1780549788219-769269284.jpeg', NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1780549706385-669', '2026-06-04', 'expense', 'à¹€à¸‡à¸´à¸™à¹€à¸”à¸·à¸­à¸™à¸žà¸™à¸±à¸à¸‡à¸²à¸™', 'cat-exp-3', 13000, 'Cash', 'acc-cash', 'à¸„à¹ˆà¸²à¹à¸£à¸‡à¸›à¸£à¸´à¸¡', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1780556161510-676', '2026-06-04', 'expense', 'à¸­à¸·à¹ˆà¸™à¹†', 'cat-exp-8', 1590, 'Cash', 'acc-cash', 'à¸‹à¸·à¹‰à¸­ AP TP-link Ax1800', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1780567460592-712', '2026-06-04', 'income', 'POS', 'cat-inc-1', 11372, 'Cash', 'acc-cash', '', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1780567481295-277', '2026-06-04', 'income', 'POS', 'cat-inc-1', 3993, 'Transfer', 'acc-1780372598070', 'à¸›à¸´à¸”à¸à¸°', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1780567503098-263', '2026-06-04', 'income', 'POS', 'cat-inc-1', 800, 'Transfer', 'acc-1780372598070', 'à¸„à¸¸à¸“à¹à¸à¹ˆà¸™', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1780653959164-918', '2026-06-05', 'income', 'POS', 'cat-inc-1', 4073, 'Cash', 'acc-cash', 'à¸›à¸´à¸”à¸à¸°', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1780654086196-546', '2026-06-05', 'income', 'POS', 'cat-inc-1', 7077, 'Transfer', 'acc-1780372598070', 'à¸›à¸´à¸”à¸à¸°à¹€à¸‡à¸´à¸™à¹‚à¸­à¸™', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1780708287652-749', '2026-06-05', 'expense', 'à¸„à¹ˆà¸²à¸ªà¸´à¸™à¸„à¹‰à¸²', 'cat-exp-4', 52437, 'Transfer', 'acc-1780129287573', 'DrySuper', '/uploads/bill-1780708287112-715575681.jpg', NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1780708322059-360', '2026-06-05', 'expense', 'à¸„à¹ˆà¸²à¸ªà¸´à¸™à¸„à¹‰à¸²', 'cat-exp-4', 9072.01, 'Transfer', 'acc-1780128518689', 'DrySuper', '/uploads/bill-1780708321469-483787845.jpeg', NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1780708381248-136', '2026-06-05', 'expense', 'à¸„à¹ˆà¸²à¸ªà¸´à¸™à¸„à¹‰à¸²', 'cat-exp-4', 50000, 'Transfer', 'acc-1780372741319', 'DrySuper', '/uploads/bill-1780708803502-345151893.jpg', NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1780708486507-459', '2026-06-05', 'expense', 'à¸„à¹ˆà¸²à¸ªà¸´à¸™à¸„à¹‰à¸²', 'cat-exp-4', 20000, 'Transfer', 'acc-1780372785201', 'DrySuper', '/uploads/bill-1780708793779-112849793.jpg', NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1780708738980-538', '2026-06-04', 'expense', 'à¸„à¹ˆà¸²à¸ªà¸´à¸™à¸„à¹‰à¸²', 'cat-exp-4', 15214, 'Transfer', 'acc-1780372598070', 'SR', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1780709037300-850', '2026-06-04', 'expense', 'à¸„à¹ˆà¸²à¸ªà¸´à¸™à¸„à¹‰à¸²', 'cat-exp-4', 1461.09, 'Transfer', 'acc-1780128518689', 'à¸§à¹ˆà¸²à¸§à¸™à¸à¸­à¸´à¸™à¸—à¸£à¸µ à¸ˆà¸²à¸ 1688', '/uploads/bill-1780709036553-583277851.jpeg', NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1780709131500-743', '2026-06-05', 'expense', 'à¸„à¹ˆà¸²à¸ªà¸´à¸™à¸„à¹‰à¸²', 'cat-exp-4', 2230.05, 'Transfer', 'acc-1780128518689', 'à¸ªà¸à¸¸à¸¥à¸Šà¸µà¹ˆ à¸‹à¸²à¸¥à¸²à¹€à¸›à¸² à¸ˆà¸²à¸ 1688', '/uploads/bill-1780709130672-398584372.jpeg', NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1780740186346-395', '2026-06-06', 'income', 'POS', 'cat-inc-1', 6053, 'Transfer', 'acc-1780128518689', 'à¸›à¸´à¸”à¸à¸°', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1780740231303-158', '2026-06-06', 'income', 'POS', 'cat-inc-1', 7403, 'Cash', 'acc-cash', 'à¸›à¸´à¸”à¸à¸°', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1780809161790-997', '2026-06-07', 'income', 'POS', 'cat-inc-1', 644, 'Cash', 'acc-cash', 'à¸›à¸´à¸”à¸à¸°', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1780809207619-913', '2026-06-07', 'income', 'POS', 'cat-inc-1', 2340, 'Transfer', 'acc-1780129287573', 'à¸›à¸´à¸”à¸à¸°', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1780888883426-279', '2026-06-07', 'expense', 'à¸„à¹ˆà¸²à¸‚à¸™à¸ªà¹ˆà¸‡', 'cat-exp-1', 1882, 'Transfer', 'acc-1780128518689', 'à¸ªà¸à¸¸à¸¥à¸Šà¸µà¹ˆ', '/uploads/bill-1780888882709-675209720.jpeg', NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1780888910041-74', '2026-06-06', 'expense', 'à¸„à¹ˆà¸²à¸‚à¸™à¸ªà¹ˆà¸‡', 'cat-exp-1', 350, 'Cash', 'acc-cash', 'à¸•à¸´à¹ˆà¸‡', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1780888935031-55', '2026-06-08', 'expense', 'à¸­à¸·à¹ˆà¸™à¹†', 'cat-exp-8', 120, 'Cash', 'acc-cash', 'à¹„à¸¡à¹‰à¸à¸§à¸²à¸”', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1780888978779-381', '2026-06-07', 'expense', 'à¸„à¹ˆà¸²à¸‚à¸™à¸ªà¹ˆà¸‡', 'cat-exp-1', 540.93, 'Transfer', 'acc-1780128518689', 'à¸‚à¸™à¸ªà¹ˆà¸‡à¸§à¹ˆà¸²à¸§à¸­à¸´à¸—à¸£à¸µ', '/uploads/bill-1780888977871-306759203.jpeg', NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1780889050656-771', '2026-06-07', 'expense', 'à¸„à¹ˆà¸²à¸‚à¸™à¸ªà¹ˆà¸‡', 'cat-exp-1', 1885.58, 'Transfer', 'acc-1780128518689', 'à¸„à¹ˆà¸²à¸‚à¸™à¸ªà¹ˆà¸‡à¸ˆà¹ˆà¸²à¸¢à¸‹à¹‰à¸³ à¹à¸•à¹ˆà¸£à¸­à¸„à¸·à¸™à¹€à¸‡à¸´à¸™ 14 à¸§à¸±à¸™', '/uploads/bill-1780889049452-559913458.jpg', NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1780889078604-739', '2026-06-08', 'expense', 'à¸„à¹ˆà¸²à¸ªà¸´à¸™à¸„à¹‰à¸²', 'cat-exp-4', 19997.88, 'Transfer', 'acc-1780372741319', 'à¸„à¹ˆà¸²à¸‚à¸­à¸‡à¸¡à¹‰à¸²à¸™à¹‰à¸³', '/uploads/bill-1780889125916-405725992.jpg', NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1780912583284-363', '2026-06-08', 'expense', 'à¸­à¸·à¹ˆà¸™à¹†', 'cat-exp-8', 116, 'Cash', 'acc-cash', 'à¸„à¹ˆà¸²à¸™à¹‰à¸³à¸”à¸·à¹ˆà¸¡', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1780912613766-180', '2026-06-08', 'income', 'POS', 'cat-inc-1', 12288, 'Cash', 'acc-cash', '', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1780912633253-200', '2026-06-08', 'income', 'POS', 'cat-inc-1', 6643, 'Transfer', 'acc-1780372598070', '', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1780912650808-892', '2026-06-08', 'income', 'POS', 'cat-inc-1', 11991, 'Transfer', 'acc-1780128518689', '', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1780912713944-501', '2026-06-08', 'expense', 'à¸„à¹ˆà¸²à¸ªà¸´à¸™à¸„à¹‰à¸²', 'cat-exp-4', 11450, 'Transfer', 'acc-1780128518689', 'à¸„à¹ˆà¸²à¸Šà¸¹à¸Šà¸µà¸ž', '/uploads/bill-1780912712081-244391150.jpg', NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1780999081486-982', '2026-06-09', 'expense', 'à¸„à¹ˆà¸²à¸‚à¸™à¸ªà¹ˆà¸‡', 'cat-exp-1', 550, 'Cash', 'acc-cash', 'à¸•à¸´à¹ˆà¸‡', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1780999106152-306', '2026-06-09', 'income', 'POS', 'cat-inc-1', 6689, 'Cash', 'acc-cash', 'à¸›à¸´à¸”à¸à¸°', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1780999159167-25', '2026-06-09', 'income', 'POS', 'cat-inc-1', 3626, 'Transfer', 'acc-1780129287573', 'à¸›à¸´à¸”à¸à¸°', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1780999617040-357', '2026-06-09', 'expense', 'à¸­à¸·à¹ˆà¸™à¹†', 'cat-exp-8', 49, 'Transfer', 'acc-1780128518689', 'shopee VIP', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1780999645140-100', '2026-06-08', 'income', 'POS', 'cat-inc-1', 1000, 'Transfer', 'acc-1780128518689', 'à¹€à¸•à¸µà¸¢à¸‡ 10', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1781083933819-130', '2026-06-10', 'expense', 'à¸„à¹ˆà¸²à¸‚à¸™à¸ªà¹ˆà¸‡', 'cat-exp-1', 200, 'Cash', 'acc-cash', 'à¸•à¸´à¹ˆà¸‡', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1781083986831-60', '2026-06-10', 'expense', 'à¸„à¹ˆà¸²à¸ªà¸´à¸™à¸„à¹‰à¸²', 'cat-exp-4', 1800, 'Transfer', 'acc-1780372785201', 'MTR', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1781085770537-261', '2026-06-10', 'income', 'POS', 'cat-inc-1', 7616, 'Cash', 'acc-cash', 'à¸›à¸´à¸”à¸à¸°', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1781085784473-738', '2026-06-10', 'income', 'POS', 'cat-inc-1', 6171, 'Transfer', 'acc-1780372598070', 'à¸›à¸´à¸”à¸à¸°', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1781085849440-762', '2026-06-02', 'income', 'POS', 'cat-inc-1', 3000, 'Transfer', 'acc-1780372598070', 'à¹à¸ˆà¹Šà¸ª', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1781141666081-581', '2026-06-11', 'income', 'à¹‚à¸­à¸™à¹€à¸‡à¸´à¸™à¹€à¸‚à¹‰à¸²', 'cat-inc-3', 39800, 'Transfer', 'acc-1780129287573', 'à¹‚à¸¢à¸à¹€à¸‡à¸´à¸™à¸ªà¸”', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1781141693350-138', '2026-06-11', 'expense', 'à¸­à¸·à¹ˆà¸™à¹†', 'cat-exp-8', 39800, 'Cash', 'acc-cash', 'à¹‚à¸¢à¸à¹€à¸‡à¸´à¸™à¹„à¸›à¸ˆà¸‡à¹€à¸ˆà¸£à¸´à¸', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1781146184963-207', '2026-06-11', 'expense', 'à¸„à¹ˆà¸²à¸ªà¸´à¸™à¸„à¹‰à¸²', 'cat-exp-4', 43528, 'Transfer', 'acc-1780129287573', 'à¸„à¹ˆà¸²à¸‚à¸­à¸‡VR', '/uploads/bill-1781146184236-888859639.jpg', NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1781146232896-626', '2026-06-11', 'expense', 'à¸„à¹ˆà¸²à¸ªà¸´à¸™à¸„à¹‰à¸²', 'cat-exp-4', 13225.6, 'Transfer', 'acc-1780372598070', 'à¸„à¹ˆà¸²à¸‚à¸­à¸‡ZJ', '/uploads/bill-1781146232359-353255401.jpg', NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1781146260573-643', '2026-06-11', 'expense', 'à¸à¸²à¸£à¹€à¸”à¸´à¸™à¸—à¸²à¸‡ / à¸™à¹‰à¸³à¸¡à¸±à¸™', 'cat-exp-2', 100, 'Cash', 'acc-cash', 'à¸™à¹‰à¸³à¸¡à¸±à¸™à¸¡à¸­à¹„à¸‹', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1781171982841-452', '2026-06-11', 'income', 'POS', 'cat-inc-1', 4214, 'Cash', 'acc-cash', 'à¸›à¸´à¸”à¸à¸°', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1781171996311-434', '2026-06-11', 'income', 'POS', 'cat-inc-1', 248, 'Transfer', 'acc-1780372598070', 'à¸›à¸´à¸”à¸à¸°', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1781258241020-631', '2026-06-12', 'income', 'POS', 'cat-inc-1', 12992, 'Cash', 'acc-cash', 'à¸›à¸´à¸”à¸à¸°', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1781258349147-355', '2026-06-12', 'income', 'POS', 'cat-inc-1', 2552, 'Transfer', 'acc-1780129287573', 'à¹€à¸§à¸µà¸¢à¸‡', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1781258400927-914', '2026-06-12', 'income', 'POS', 'cat-inc-1', 3609, 'Transfer', 'acc-1780372598070', 'à¸›à¸´à¸”à¸à¸°', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1781328627146-543', '2026-06-09', 'income', 'POS', 'cat-inc-1', 500, 'Transfer', 'acc-1780372741319', 'à¹€à¸•à¸µà¸¢à¸‡ 10', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1781345140862-572', '2026-06-13', 'expense', 'à¸„à¹ˆà¸²à¸ªà¸´à¸™à¸„à¹‰à¸²', 'cat-exp-4', 122, 'Transfer', 'acc-1780372598070', 'à¸„à¹ˆà¸²à¸£à¸­à¸à¸§à¹ˆà¸²à¸§', '/uploads/bill-1781345140284-930983224.jpg', NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1781345190893-686', '2026-06-13', 'income', 'POS', 'cat-inc-1', 300, 'Transfer', 'acc-1780372598070', '', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1781345205139-900', '2026-06-13', 'income', 'POS', 'cat-inc-1', 9641, 'Cash', 'acc-cash', 'à¸›à¸´à¸”à¸à¸°', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1781345246733-237', '2026-06-13', 'income', 'POS', 'cat-inc-1', 9809, 'Transfer', 'acc-1780372741319', 'à¸›à¸´à¸”à¸à¸°', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1781413101970-22', '2026-06-14', 'income', 'POS', 'cat-inc-1', 1365, 'Transfer', 'acc-1780372598070', 'à¸ªà¸²à¸¢à¸à¸™', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1781413115267-512', '2026-06-14', 'income', 'POS', 'cat-inc-1', 5819, 'Cash', 'acc-cash', 'à¸›à¸´à¸”à¸à¸°', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1781413128530-453', '2026-06-14', 'income', 'POS', 'cat-inc-1', 2124, 'Transfer', 'acc-1780372741319', 'à¸›à¸´à¸”à¸à¸°', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1781413212038-676', '2026-06-09', 'income', 'à¸­à¸·à¹ˆà¸™à¹†', 'cat-inc-5', 5000, 'Transfer', 'acc-1780128518689', 'à¹€à¸—à¸žà¸„à¸·à¸™', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1781488604084-570', '2026-06-15', 'expense', 'à¸­à¸·à¹ˆà¸™à¹†', 'cat-exp-8', 1140, 'Transfer', 'acc-1780372598070', 'à¸„à¹ˆà¸²à¸–à¸¸à¸‡', '/uploads/bill-1781488603483-38091921.jpg', NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1781517777906-900', '2026-06-15', 'income', 'POS', 'cat-inc-1', 22602, 'Cash', 'acc-cash', 'à¸›à¸´à¸”à¸à¸°', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1781517816741-11', '2026-06-15', 'income', 'POS', 'cat-inc-1', 6216, 'Transfer', 'acc-1780129287573', 'à¹€à¸§à¸µà¸¢à¸‡', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1781517860239-494', '2026-06-15', 'expense', 'à¸„à¹ˆà¸²à¸‚à¸™à¸ªà¹ˆà¸‡', 'cat-exp-1', 150, 'Cash', 'acc-cash', 'à¸•à¸´à¹ˆà¸‡', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1781517877701-325', '2026-06-15', 'expense', 'à¸„à¹ˆà¸²à¸ªà¸´à¸™à¸„à¹‰à¸²', 'cat-exp-4', 20780, 'Cash', 'acc-cash', 'à¸¡à¹‰à¸²à¸™à¹‰à¸³', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1781518021035-166', '2026-06-15', 'income', 'POS', 'cat-inc-1', 10024, 'Transfer', 'acc-1781517994948', 'à¸›à¸´à¸”à¸à¸°', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1781600170646-913', '2026-06-16', 'expense', 'à¸­à¸·à¹ˆà¸™à¹†', 'cat-exp-8', 174, 'Cash', 'acc-cash', 'à¸™à¹‰à¸³à¸”à¸·à¹ˆà¸¡', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1781600340199-717', '2026-06-16', 'expense', 'à¸„à¹ˆà¸²à¸ªà¸´à¸™à¸„à¹‰à¸²', 'cat-exp-4', 76965, 'Cash', 'acc-cash', 'à¸„à¹ˆà¸²à¸‚à¸­à¸‡SJR', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1781604212801-883', '2026-06-16', 'income', 'POS', 'cat-inc-1', 180, 'Transfer', 'acc-1781517994948', 'à¸›à¸´à¸”à¸à¸°', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1781604239952-453', '2026-06-16', 'income', 'POS', 'cat-inc-1', 2626, 'Cash', 'acc-cash', 'à¸›à¸´à¸”à¸à¸°', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1781613983136-381', '2026-06-16', 'expense', 'à¹€à¸‡à¸´à¸™à¹€à¸”à¸·à¸­à¸™à¸žà¸™à¸±à¸à¸‡à¸²à¸™', 'cat-exp-3', 6650, 'Transfer', 'acc-1780372598070', 'à¹€à¸‡à¸´à¸™à¹€à¸”à¸·à¸­à¸™à¸žà¸µà¹ˆà¸à¸­à¸¥à¹Œà¸Ÿ', '/uploads/bill-1781613982418-336008291.jpg', NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1781614010010-600', '2026-06-16', 'expense', 'à¹€à¸‡à¸´à¸™à¹€à¸”à¸·à¸­à¸™à¸žà¸™à¸±à¸à¸‡à¸²à¸™', 'cat-exp-3', 2000, 'Cash', 'acc-cash', 'à¹€à¸‡à¸´à¸™à¹€à¸”à¸·à¸­à¸™à¸™à¸±à¸— 1 à¸ªà¹ˆà¸§à¸™', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1781690127713-453', '2026-06-17', 'expense', 'à¸„à¹ˆà¸²à¸‚à¸™à¸ªà¹ˆà¸‡', 'cat-exp-1', 50, 'Cash', 'acc-cash', 'à¸•à¸´à¹ˆà¸‡', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1781690149320-729', '2026-06-17', 'expense', 'à¸à¸²à¸£à¹€à¸”à¸´à¸™à¸—à¸²à¸‡ / à¸™à¹‰à¸³à¸¡à¸±à¸™', 'cat-exp-2', 500, 'Cash', 'acc-cash', 'à¸™à¹‰à¸³à¸¡à¸±à¸™à¸£à¸–à¸•à¸¹à¹‰', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1781690175379-282', '2026-06-17', 'expense', 'à¹€à¸‡à¸´à¸™à¹€à¸”à¸·à¸­à¸™à¸žà¸™à¸±à¸à¸‡à¸²à¸™', 'cat-exp-3', 2810, 'Cash', 'acc-cash', 'à¹€à¸‡à¸´à¸™à¹€à¸”à¸·à¸­à¸™à¸™à¸±à¸—', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1781690275829-569', '2026-06-17', 'income', 'POS', 'cat-inc-1', 3581, 'Cash', 'acc-cash', 'à¸›à¸´à¸”à¸à¸°', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1781690374123-740', '2026-06-17', 'income', 'POS', 'cat-inc-1', 11574, 'Transfer', 'acc-1780372741319', 'à¸›à¸´à¸”à¸à¸°', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1781776756253-156', '2026-06-18', 'income', 'POS', 'cat-inc-1', 9029, 'Cash', 'acc-cash', 'à¸›à¸´à¸”à¸à¸°', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1781776797824-908', '2026-06-18', 'expense', 'à¸­à¸·à¹ˆà¸™à¹†', 'cat-exp-8', 60, 'Cash', 'acc-cash', 'à¸„à¹ˆà¸²à¸‚à¹‰à¸²à¸§à¸™à¸¸', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1781776883290-781', '2026-06-18', 'income', 'POS', 'cat-inc-1', 4360, 'Transfer', 'acc-1780372598070', 'à¸žà¸µà¹ˆà¹€à¸­à¹‹', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1781776900537-410', '2026-06-18', 'income', 'POS', 'cat-inc-1', 11741, 'Transfer', 'acc-1780372741319', 'à¸›à¸´à¸”à¸à¸°', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1781776945933-210', '2026-06-18', 'expense', 'à¸„à¹ˆà¸²à¸ªà¸´à¸™à¸„à¹‰à¸²', 'cat-exp-4', 100000, 'Cash', 'acc-cash', 'à¸ˆà¹ˆà¸²à¸¢à¹€à¸®à¸µà¸¢à¸à¸´à¸•', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1781947311382-217', '2026-06-19', 'income', 'POS', 'cat-inc-1', 7870, 'Cash', 'acc-cash', 'à¸›à¸´à¸”à¸à¸°1', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1781947385192-35', '2026-06-19', 'income', 'POS', 'cat-inc-1', 4754, 'Transfer', 'acc-1780128518689', 'à¸›à¸´à¸”à¸à¸°1', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1781947437571-766', '2026-06-19', 'income', 'POS', 'cat-inc-1', 2115, 'Cash', 'acc-cash', 'à¸›à¸´à¸”à¸à¸°2', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1781947514569-549', '2026-06-19', 'income', 'POS', 'cat-inc-1', 2896, 'Transfer', 'acc-1780128518689', 'à¸›à¸´à¸”à¸à¸°2', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1781947531550-27', '2026-06-19', 'income', 'POS', 'cat-inc-1', 190, 'Transfer', 'acc-1781517994948', 'à¸›à¸´à¸”à¸à¸°2', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1781947674098-285', '2026-06-16', 'expense', 'à¸­à¸·à¹ˆà¸™à¹†', 'cat-exp-8', 267, 'Transfer', 'acc-1780128518689', 'à¸„à¹ˆà¸²à¸‚à¹‰à¸²à¸§ 7-11', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1781947707748-982', '2026-06-20', 'income', 'à¸”à¸­à¸à¹€à¸šà¸µà¹‰à¸¢ / à¹€à¸‡à¸´à¸™à¸›à¸±à¸™à¸œà¸¥', 'cat-inc-4', 45.66, 'Transfer', 'acc-1780128518689', '', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1781949598288-85', '2026-06-20', 'income', 'POS', 'cat-inc-1', 20716, 'Cash', 'acc-cash', 'à¸›à¸´à¸”à¸à¸°', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1781949617419-659', '2026-06-20', 'income', 'POS', 'cat-inc-1', 19572, 'Transfer', 'acc-1781517994948', 'à¸›à¸´à¸”à¸à¸°', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1781949709719-330', '2026-06-22', 'expense', 'à¸„à¹ˆà¸²à¸‚à¸™à¸ªà¹ˆà¸‡', 'cat-exp-1', 100, 'Cash', 'acc-cash', 'à¸•à¸´à¹ˆà¸‡', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1781949726364-739', '2026-06-19', 'expense', 'à¸­à¸·à¹ˆà¸™à¹†', 'cat-exp-8', 60, 'Cash', 'acc-cash', 'cable tile', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1782018013811-933', '2026-06-21', 'income', 'POS', 'cat-inc-1', 1773, 'Cash', 'acc-cash', 'à¸›à¸´à¸”à¸à¸°', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1782018170873-652', '2026-06-21', 'income', 'POS', 'cat-inc-1', 5501, 'Transfer', 'acc-1780372598070', '5569', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1782268701926-451', '2026-06-22', 'income', 'POS', 'cat-inc-1', 8968, 'Transfer', 'acc-1780372741319', 'à¸›à¸´à¸”à¸à¸°', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1782268775015-748', '2026-06-22', 'income', 'POS', 'cat-inc-1', 7616, 'Cash', 'acc-cash', 'à¸›à¸´à¸”à¸à¸°', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1782270408120-22', '2026-06-23', 'income', 'POS', 'cat-inc-1', 2255, 'Transfer', 'acc-1781517994948', 'à¸›à¸´à¸”à¸à¸°', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1782270432194-706', '2026-06-23', 'income', 'POS', 'cat-inc-1', 4620, 'Transfer', 'acc-1780372598070', 'à¸›à¸´à¸”à¸à¸ž', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1782270460060-264', '2026-06-23', 'income', 'POS', 'cat-inc-1', 17282, 'Cash', 'acc-cash', 'à¸›à¸´à¸”à¸à¸°', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1782294850806-586', '2026-06-24', 'income', 'POS', 'cat-inc-1', 3458, 'Cash', 'acc-cash', 'à¸›à¸´à¸”à¸à¸°', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1782294901071-212', '2026-06-24', 'income', 'POS', 'cat-inc-1', 1765, 'Transfer', 'acc-1780129287573', 'à¸›à¸´à¸”à¸à¸°', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1782295089454-335', '2026-06-19', 'income', 'à¸”à¸­à¸à¹€à¸šà¸µà¹‰à¸¢ / à¹€à¸‡à¸´à¸™à¸›à¸±à¸™à¸œà¸¥', 'cat-inc-4', 4.22, 'Transfer', 'acc-1780129287573', '', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1782295113422-840', '2026-06-20', 'income', 'POS', 'cat-inc-1', 2284, 'Transfer', 'acc-1780129287573', 'à¹€à¸§à¸µà¸¢à¸‡', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1782295170622-708', '2026-06-24', 'expense', 'à¸„à¹ˆà¸²à¸ªà¸´à¸™à¸„à¹‰à¸²', 'cat-exp-4', 20438, 'Transfer', 'acc-1780128518689', 'ZT', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1782295199293-619', '2026-06-24', 'expense', 'à¸­à¸·à¹ˆà¸™à¹†', 'cat-exp-8', 111, 'Transfer', 'acc-1780128518689', 'à¸„à¹ˆà¸²à¸‚à¹‰à¸²à¸§', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1782295800725-231', '2026-06-24', 'income', 'POS', 'cat-inc-1', 149, 'Transfer', 'acc-1780129287573', 'à¸¥à¸¹à¸à¸„à¹‰à¸²à¸›à¸¥à¸µà¸', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1782350482007-407', '2026-06-22', 'expense', 'à¸­à¸·à¹ˆà¸™à¹†', 'cat-exp-8', 30, 'Cash', 'acc-cash', 'à¸™à¹‡à¸­à¸•', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1782350524203-627', '2026-06-22', 'expense', 'à¸­à¸·à¹ˆà¸™à¹†', 'cat-exp-8', 65, 'Cash', 'acc-cash', 'à¸¢à¸²à¸‰à¸µà¸”à¸¢à¸¸à¸‡', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1782350547305-413', '2026-06-22', 'expense', 'à¸­à¸·à¹ˆà¸™à¹†', 'cat-exp-8', 135, 'Cash', 'acc-cash', 'à¹à¸”à¹‡à¸›', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1782350567504-648', '2026-06-24', 'expense', 'à¸„à¹ˆà¸²à¸‚à¸™à¸ªà¹ˆà¸‡', 'cat-exp-1', 250, 'Cash', 'acc-cash', 'à¸•à¸´à¹ˆà¸‡', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1782350979100-680', '2026-06-15', 'expense', 'à¸„à¹ˆà¸²à¸ªà¸´à¸™à¸„à¹‰à¸²', 'cat-exp-4', 12398, 'Transfer', 'acc-1780372741319', 'à¸šà¸µà¸¢à¸­à¸™', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1782381649240-741', '2026-06-25', 'income', 'POS', 'cat-inc-1', 16205, 'Cash', 'acc-cash', 'à¸›à¸´à¸”à¸à¸°', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1782381770629-312', '2026-06-25', 'income', 'POS', 'cat-inc-1', 368, 'Transfer', 'acc-1780372598070', 'à¸›à¸´à¸”à¸à¸°', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1782381876867-873', '2026-06-25', 'income', 'POS', 'cat-inc-1', 7136, 'Transfer', 'acc-1780129287573', 'à¸›à¸´à¸”à¸à¸°', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1782468468677-98', '2026-06-26', 'income', 'POS', 'cat-inc-1', 15494, 'Transfer', 'acc-1780372741319', 'à¸›à¸´à¸”à¸à¸°', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1782468498857-160', '2026-06-26', 'income', 'à¸­à¸·à¹ˆà¸™à¹†', 'cat-inc-5', 200, 'Transfer', 'acc-1780372741319', 'à¸„à¹ˆà¸²à¸ªà¹ˆà¸‡à¸‚à¸­à¸‡à¹€à¸à¸²à¸°à¸¥à¹‰à¸²à¸™à¸¥à¸¹à¸à¸„à¹‰à¸²à¹‚à¸­à¸™à¹ƒà¸«à¹‰ à¸ˆà¹ˆà¸²à¸¢à¹€à¸‡à¸´à¸™à¸ªà¸”à¹„à¸› (à¹à¸¥à¸à¹€à¸‡à¸´à¸™à¸ªà¸”)', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1782468515013-778', '2026-06-26', 'income', 'POS', 'cat-inc-1', 12195, 'Cash', 'acc-cash', 'à¸›à¸´à¸”à¸à¸°', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1782468533135-413', '2026-06-26', 'expense', 'à¸à¸²à¸£à¹€à¸”à¸´à¸™à¸—à¸²à¸‡ / à¸™à¹‰à¸³à¸¡à¸±à¸™', 'cat-exp-2', 100, 'Cash', 'acc-cash', 'bolt à¹€à¸­à¸²à¸£à¸–à¹„à¸›à¸‹à¹ˆà¸­à¸¡', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1782468587783-794', '2026-06-26', 'expense', 'à¸­à¸·à¹ˆà¸™à¹†', 'cat-exp-8', 158, 'Cash', 'acc-cash', 'à¸„à¹ˆà¸²à¸—à¹ˆà¸­à¹à¸­à¸£à¹Œ', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1782553885206-789', '2026-06-27', 'expense', 'à¸­à¸·à¹ˆà¸™à¹†', 'cat-exp-8', 6100, 'Transfer', 'acc-1780128518689', 'à¸‹à¹ˆà¸­à¸¡à¸£à¸–à¸•à¸¹à¹‰', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1782553900882-455', '2026-06-27', 'expense', 'à¸„à¹ˆà¸²à¸‚à¸™à¸ªà¹ˆà¸‡', 'cat-exp-1', 850, 'Cash', 'acc-cash', 'à¸•à¸´à¹ˆà¸‡', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1782554285968-928', '2026-06-27', 'income', 'POS', 'cat-inc-1', 15697, 'Cash', 'acc-cash', 'à¸›à¸´à¸”à¸à¸°', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1782554304661-624', '2026-06-27', 'income', 'POS', 'cat-inc-1', 599, 'Transfer', 'acc-1780372598070', 'à¸ªà¸²à¸¢à¸à¸™', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1782554435778-34', '2026-06-27', 'income', 'POS', 'cat-inc-1', 400, 'Transfer', 'acc-1780129287573', 'à¹à¸ˆà¹Šà¸ª', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1782554455860-39', '2026-06-27', 'income', 'POS', 'cat-inc-1', 6439, 'Transfer', 'acc-1780128518689', 'à¸›à¸´à¸”à¸à¸°', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1782554514834-484', '2026-06-26', 'expense', 'à¸­à¸·à¹ˆà¸™à¹†', 'cat-exp-8', 232, 'Transfer', 'acc-1780128518689', 'à¸«à¹ˆà¸²à¸‡à¸§à¹ˆà¸²à¸§', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1782554548914-691', '2026-06-25', 'expense', 'à¸­à¸·à¹ˆà¸™à¹†', 'cat-exp-8', 1209.59, 'Transfer', 'acc-1780128518689', 'homePro', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1782554634368-536', '2026-06-27', 'expense', 'à¸„à¹ˆà¸²à¸ªà¸´à¸™à¸„à¹‰à¸²', 'cat-exp-4', 5145, 'Transfer', 'acc-1780372598070', 'à¸„à¹ˆà¸²à¸‚à¸­à¸‡à¸šà¸±à¸¥à¸¥à¸¹à¸™à¸Šà¸±à¸¢', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1782554808148-135', '2026-06-27', 'income', 'à¸”à¸­à¸à¹€à¸šà¸µà¹‰à¸¢ / à¹€à¸‡à¸´à¸™à¸›à¸±à¸™à¸œà¸¥', 'cat-inc-4', 3.07, 'Transfer', 'acc-1781517994948', '', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1782622957162-957', '2026-06-28', 'income', 'POS', 'cat-inc-1', 4223, 'Transfer', 'acc-1780372598070', 'à¸›à¸´à¸”à¸à¸°', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1782623006496-800', '2026-06-28', 'income', 'POS', 'cat-inc-1', 10978, 'Cash', 'acc-cash', 'à¸›à¸´à¸”à¸à¸°', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1782623025137-475', '2026-06-28', 'income', 'POS', 'cat-inc-1', 2013, 'Transfer', 'acc-1780128518689', 'à¸›à¸´à¸”à¸à¸°', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1782623067372-139', '2026-06-28', 'expense', 'à¸„à¹ˆà¸²à¸ªà¸´à¸™à¸„à¹‰à¸²', 'cat-exp-4', 2352, 'Cash', 'acc-cash', 'à¸„à¹ˆà¸²à¸‚à¸­à¸‡à¸ªà¸¸à¸§à¸´à¸ˆà¸±à¸à¸£', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1782727563550-803', '2026-06-29', 'income', 'POS', 'cat-inc-1', 6450, 'Transfer', 'acc-1780128518689', 'à¸›à¸´à¸”à¸à¸°', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1782727581337-218', '2026-06-29', 'income', 'POS', 'cat-inc-1', 1527, 'Transfer', 'acc-1780372598070', 'à¹€à¸ˆà¹‰à¸ªà¸²à¸¢à¸à¸™', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1782727626073-983', '2026-06-29', 'expense', 'à¸à¸²à¸£à¹€à¸”à¸´à¸™à¸—à¸²à¸‡ / à¸™à¹‰à¸³à¸¡à¸±à¸™', 'cat-exp-2', 70, 'Cash', 'acc-cash', 'bolt', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1782727647862-713', '2026-06-29', 'expense', 'à¸à¸²à¸£à¹€à¸”à¸´à¸™à¸—à¸²à¸‡ / à¸™à¹‰à¸³à¸¡à¸±à¸™', 'cat-exp-2', 500, 'Cash', 'acc-cash', 'à¸™à¹‰à¸³à¸¡à¸±à¸™à¸£à¸–à¸•à¸¹à¹‰', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1782727663882-377', '2026-06-29', 'expense', 'à¸­à¸·à¹ˆà¸™à¹†', 'cat-exp-8', 642, 'Cash', 'acc-cash', 'à¸žà¸£à¸š à¸¡à¸­à¹„à¸‹', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1782727701303-177', '2026-06-29', 'income', 'POS', 'cat-inc-1', 29037, 'Cash', 'acc-cash', 'à¸›à¸´à¸”à¸à¸°', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1782809795456-924', '2026-06-30', 'income', 'POS', 'cat-inc-1', 5617, 'Cash', 'acc-cash', 'à¸›à¸´à¸”à¸à¸°', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1782809866301-498', '2026-06-30', 'income', 'POS', 'cat-inc-1', 15007, 'Transfer', 'acc-1780128518689', 'à¸›à¸´à¸”à¸à¸°1', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1782809883682-857', '2026-06-30', 'expense', 'à¸­à¸·à¹ˆà¸™à¹†', 'cat-exp-8', 100, 'Transfer', 'acc-1780128518689', 'à¸œà¹‰à¸²à¸–à¸¹à¸žà¸·à¹‰à¸™', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1782809895949-281', '2026-06-30', 'expense', 'à¸­à¸·à¹ˆà¸™à¹†', 'cat-exp-8', 200, 'Cash', 'acc-cash', 'à¹€à¸„à¹€à¸šà¸´à¹‰à¸¥à¹„à¸—', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1782878734884-851', '2026-07-01', 'expense', 'à¹€à¸‡à¸´à¸™à¹€à¸”à¸·à¸­à¸™à¸žà¸™à¸±à¸à¸‡à¸²à¸™', 'cat-exp-3', 10000, 'Transfer', 'acc-1780128518689', 'à¹€à¸‡à¸´à¸™à¹€à¸”à¸·à¸­à¸™à¸“à¸¸', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1782878764717-559', '2026-06-30', 'income', 'POS', 'cat-inc-1', 1820, 'Transfer', 'acc-1780128518689', 'à¸›à¸´à¸”à¸à¸° 2', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1782878796582-286', '2026-06-30', 'expense', 'à¹€à¸‡à¸´à¸™à¹€à¸”à¸·à¸­à¸™à¸žà¸™à¸±à¸à¸‡à¸²à¸™', 'cat-exp-3', 6650, 'Transfer', 'acc-1780128518689', 'à¸„à¹ˆà¸²à¹à¸£à¸‡à¸žà¸µà¹ˆà¸à¸­à¸Ÿ', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1782879135812-729', '2026-06-30', 'income', 'POS', 'cat-inc-1', 280, 'Cash', 'acc-cash', 'à¸›à¸´à¸”à¸à¸° 2', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1782879538373-905', '2026-07-01', 'expense', 'à¸„à¹ˆà¸²à¸™à¹‰à¸³ / à¸„à¹ˆà¸²à¹„à¸Ÿ / à¸„à¹ˆà¸²à¸­à¸´à¸™à¹€à¸—à¸­à¸£à¹Œà¹€à¸™à¹‡à¸•', 'cat-exp-5', 6032, 'Cash', 'acc-cash', 'à¸„à¹ˆà¸²à¹„à¸Ÿ', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1782899969079-749', '2026-07-01', 'income', 'POS', 'cat-inc-1', 5894, 'Cash', 'acc-cash', 'à¸›à¸´à¸”à¸à¸°', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1782900032898-482', '2026-07-01', 'income', 'POS', 'cat-inc-1', 7255, 'Transfer', 'acc-1780129287573', 'à¸›à¸´à¸”à¸à¸°', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');
INSERT OR IGNORE INTO transactions (id, date, type, category_name, category_id, amount, payment_method, account_id, notes, slip_url, status, created_at, updated_at)
VALUES ('tx-1782900053160-611', '2026-07-01', 'expense', 'à¸„à¹ˆà¸²à¸‚à¸™à¸ªà¹ˆà¸‡', 'cat-exp-1', 50, 'Cash', 'acc-cash', 'à¸•à¸´à¹ˆà¸‡', NULL, NULL, '2026-07-02 08:36:00.937', '2026-07-02 08:36:00.937');

-- SETTINGS (preserve existing or use defaults)
INSERT OR IGNORE INTO settings (key, value) VALUES ('backup_date_last', '2026-07-02T04:49:33.659Z');


-- Summary:
--   users        : 1 (admin)
--   accounts     : 7
--   categories   : 13
--   transactions : 163 (skipped: 0)

