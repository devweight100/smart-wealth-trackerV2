# IMPLEMENTATION PLAN
# Smart Wealth Tracker — Production-Ready Upgrade
**Version:** 1.0  
**Date:** 2026-07-02  
**Based on:** System Refactor Specification + Backup Analysis

---

## 1. การวิเคราะห์โครงสร้างโปรเจคปัจจุบัน

### Architecture ปัจจุบัน

```
Cloudflare Pages (Static Hosting)
  └─ public/
       ├─ index.html          (SPA หลัก ~42KB)
       ├─ css/                (styles)
       └─ js/
            ├─ api.js         (client API wrapper)
            ├─ app.js         (main app logic ~68KB)
            ├─ charts.js      (chart rendering)
            └─ export.js      (Excel/CSV export)

Cloudflare Pages Functions (Backend API)
  └─ functions/api/[[path]].js  (~16KB, catch-all handler)

Storage (ปัจจุบัน):
  ├─ Cloudflare KV  → swt_accounts, swt_transactions, swt_categories
  └─ Cloudflare KV  → bill-*.jpg/png/jpeg (binary file storage)

Local Dev (Express.js):
  └─ server.js → database/*.json
```

### โครงสร้างข้อมูลจาก Backup จริง

**accounts** — 7 รายการ:

| ID | ชื่อ | ประเภท | ธนาคาร | initialBalance |
|----|------|--------|--------|----------------|
| acc-cash | เงินสด | cash | — | 482,603 |
| acc-1780128518689 | พร้อมเพย์ ภาณุวิชญ์ | bank | กสิกรไทย | 17,725.88 |
| acc-1780129287573 | จงเจริญทรัพย์ เทรดดิ้ง | bank | กสิกรไทย | 55,885 |
| acc-1780372598070 | พร้อมเพย์ ปนันดา | bank | กรุงศรีอยุธยา | 15,414 |
| acc-1780372741319 | พร้อมเพย์ ยศหิรัญ | bank | กรุงศรีอยุธยา | 53,281 |
| acc-1780372785201 | กรุงไทย ปนันดา | bank | กรุงไทย | 28,035 |
| acc-1781517994948 | ปนันดา กสิกร | bank | กสิกรไทย | 63.24 |

**transactions** — ~190 รายการ (2026-06-02 ถึง 2026-07-01)

```json
{
  "id": "tx-{timestamp}-{random}",
  "date": "YYYY-MM-DD",
  "type": "income | expense | future",
  "category": "string ชื่อ (ไม่ใช่ ID!)",
  "amount": 12000,
  "paymentMethod": "Cash | Transfer",
  "accountId": "acc-xxx",
  "notes": "string",
  "slipUrl": "/uploads/bill-xxx.jpg | null",
  "status": "pending | paid"
}
```

> ⚠️ Critical: `category` เก็บเป็น **ชื่อ** ไม่ใช่ ID

**categories** — 13 รายการ:
Income: POS, รายได้เสริม, โอนเงินเข้า, ดอกเบี้ย/เงินปันผล, อื่นๆ  
Expense: ค่าขนส่ง, การเดินทาง/น้ำมัน, เงินเดือนพนักงาน, ค่าสินค้า, ค่าน้ำ/ค่าไฟ/อินเทอร์เน็ต, ความบันเทิง, สุขภาพ, อื่นๆ

---

## 2. จุดเสี่ยงที่พบ

| # | จุดเสี่ยง | ระดับ | รายละเอียด |
|---|-----------|-------|------------|
| 1 | Static Auth Token | 🔴 Critical | Token "swt-token-1234" hardcode ไม่มี expiry |
| 2 | Password hash ใน source | 🔴 Critical | SHA-256 hash อยู่ใน source code |
| 3 | KV เป็น DB หลัก | 🔴 Critical | ไม่เหมาะกับ relational data, limit 25MB/value |
| 4 | category ใช้ชื่อไม่ใช่ ID | 🟡 High | เปลี่ยนชื่อ = transaction ไม่ตรง |
| 5 | balance เก็บใน accounts | 🟡 High | recalculate ทุก GET — race condition |
| 6 | ไม่มี Soft Delete | 🟡 High | ลบแล้วหายถาวร |
| 7 | ไม่มี Audit Log | 🟡 High | ไม่มี tracking |
| 8 | No file serving endpoint | 🟡 High | /uploads/ ไม่มี handler ใน KV mode |
| 9 | No input validation | 🟠 Medium | ไม่ validate amount, date, type |
| 10 | No pagination | 🟠 Medium | GET ดึงทั้งหมด — ช้าเมื่อ data มาก |
| 11 | CORS Allow All Origins | 🟠 Medium | Access-Control-Allow-Origin: * |
| 12 | No error boundary | 🟠 Medium | KV fail = ทั้งระบบ fail |

---

## 3. Target Architecture (Cloudflare Free Plan)

```
Cloudflare Pages (Frontend)
         |
Cloudflare Workers API (Pages Functions)
    /         |          \
Cloudflare D1  Cloudflare R2  Cloudflare KV
(Primary DB)   (Images)       (Session/Config)
         |
Cloudflare Cron Triggers
  00:00 → Backup → Google Drive
  20:00 → Daily Report → LINE API
```

---

## 4. D1 Database Schema ใหม่

### Tables

```sql
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- Schema version tracking
CREATE TABLE IF NOT EXISTS schema_versions (
  version     INTEGER PRIMARY KEY,
  description TEXT NOT NULL,
  applied_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Users (replaces static passcode)
CREATE TABLE IF NOT EXISTS users (
  id              TEXT PRIMARY KEY,
  username        TEXT NOT NULL UNIQUE,
  password_hash   TEXT NOT NULL,
  role            TEXT NOT NULL DEFAULT 'user', -- 'admin' | 'user'
  is_active       INTEGER NOT NULL DEFAULT 1,
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until    TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at      TEXT
);

-- Sessions
CREATE TABLE IF NOT EXISTS sessions (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users(id),
  token_hash   TEXT NOT NULL UNIQUE,
  user_agent   TEXT,
  ip_address   TEXT,
  expires_at   TEXT NOT NULL,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  last_used_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Accounts
CREATE TABLE IF NOT EXISTS accounts (
  id              TEXT PRIMARY KEY,       -- acc-cash, acc-{timestamp}
  name            TEXT NOT NULL,
  type            TEXT NOT NULL DEFAULT 'bank', -- cash | bank
  account_number  TEXT NOT NULL DEFAULT '-',
  bank_name       TEXT NOT NULL DEFAULT '-',
  initial_balance REAL NOT NULL DEFAULT 0,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  is_default      INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at      TEXT
);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  type       TEXT NOT NULL,              -- income | expense
  is_system  INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at TEXT,
  UNIQUE(name, type)
);

-- Transactions
CREATE TABLE IF NOT EXISTS transactions (
  id             TEXT PRIMARY KEY,        -- tx-{timestamp}-{random}
  date           TEXT NOT NULL,           -- YYYY-MM-DD
  type           TEXT NOT NULL,           -- income | expense | future
  category_name  TEXT NOT NULL,           -- ชื่อ category (backward compat)
  category_id    TEXT REFERENCES categories(id),
  amount         REAL NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'Cash',
  account_id     TEXT NOT NULL REFERENCES accounts(id),
  notes          TEXT NOT NULL DEFAULT '',
  slip_url       TEXT,
  status         TEXT,                    -- pending | paid (future only)
  created_by     TEXT REFERENCES users(id),
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at     TEXT
);

CREATE INDEX IF NOT EXISTS idx_tx_date    ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_tx_account ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_tx_type    ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_tx_deleted ON transactions(deleted_at);

-- Attachments
CREATE TABLE IF NOT EXISTS attachments (
  id              TEXT PRIMARY KEY,
  transaction_id  TEXT REFERENCES transactions(id),
  original_name   TEXT NOT NULL,
  stored_name     TEXT NOT NULL,
  file_url        TEXT NOT NULL,
  mime_type       TEXT,
  file_size       INTEGER,
  storage_backend TEXT NOT NULL DEFAULT 'kv', -- kv | r2
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at      TEXT
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id          TEXT PRIMARY KEY,
  user_id     TEXT REFERENCES users(id),
  action      TEXT NOT NULL,
  resource    TEXT NOT NULL,
  resource_id TEXT,
  ip_address  TEXT,
  user_agent  TEXT,
  old_data    TEXT,
  new_data    TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_audit_user    ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);

-- Settings
CREATE TABLE IF NOT EXISTS settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_by TEXT REFERENCES users(id)
);

INSERT OR IGNORE INTO settings (key, value) VALUES
  ('app_version', '2.0.0'),
  ('db_schema_version', '1'),
  ('backup_retention_days', '30'),
  ('daily_report_enabled', 'true'),
  ('daily_report_hour', '20'),
  ('backup_hour', '0');

-- Backup History
CREATE TABLE IF NOT EXISTS backup_history (
  id             TEXT PRIMARY KEY,
  backup_version TEXT NOT NULL,
  app_version    TEXT,
  record_counts  TEXT,
  storage_path   TEXT,
  file_size      INTEGER,
  checksum       TEXT,
  status         TEXT NOT NULL DEFAULT 'pending',
  error_message  TEXT,
  created_by     TEXT REFERENCES users(id),
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);
```

---

## 5. Backup Versioning

| Version | Format | รองรับตลอดไป |
|---------|--------|--------------|
| v1 (ปัจจุบัน) | `{accounts, transactions, categories, backupDate}` | ✅ |
| v2 (ใหม่) | ZIP: database.json + metadata.json + manifest.json + attachments/ | ✅ |

### v1 → D1 Field Mapping

| Backup Field | D1 Column | หมายเหตุ |
|---|---|---|
| accountNumber | account_number | camelCase → snake_case |
| bankName | bank_name | camelCase → snake_case |
| initialBalance | initial_balance | ตรงๆ |
| balance | *computed* | ไม่เก็บ |
| category (ชื่อ) | category_name | เก็บชื่อ + lookup FK |
| paymentMethod | payment_method | camelCase → snake_case |
| accountId | account_id | camelCase → snake_case |
| slipUrl | slip_url | camelCase → snake_case |
| isSystem | is_system | boolean → 0/1 |

---

## 6. รายการไฟล์ที่จะถูกแก้ไข

### Phase 2 — Database
| ไฟล์ | สถานะ |
|------|--------|
| `migrations/001_initial_schema.sql` | NEW |
| `migrations/migrate_from_backup.js` | NEW |
| `migrations/seed_admin.js` | NEW |
| `wrangler.toml` | MODIFY |

### Phase 3 — Backend
| ไฟล์ | สถานะ |
|------|--------|
| `functions/api/[[path]].js` | MODIFY |
| `functions/api/_middleware.js` | NEW |
| `functions/api/lib/db.js` | NEW |
| `functions/api/lib/auth.js` | NEW |
| `functions/api/lib/backup.js` | NEW |
| `functions/api/lib/audit.js` | NEW |
| `functions/api/lib/validator.js` | NEW |
| `functions/_worker.js` | NEW |

### Phase 4 — Image Storage
| ไฟล์ | สถานะ |
|------|--------|
| `functions/api/lib/storage.js` | NEW |

### Phase 5 — Frontend
| ไฟล์ | สถานะ |
|------|--------|
| `public/js/api.js` | MODIFY |
| `public/js/app.js` | MODIFY |
| `public/index.html` | MODIFY |
| `public/_headers` | NEW |
| `public/_redirects` | NEW |

---

## 7. Migration Plan (9 ขั้นตอน)

1. **Analyze** ✅ — เสร็จแล้ว (plan นี้)
2. **Backup Existing Data** — Download + hash backup
3. **Create D1 Schema** — `wrangler d1 create` + run SQL
4. **Migration Script** — สร้าง migrate_from_backup.js
5. **Import Data** — Run script กับ backup จริง
6. **Verify** — Query D1, เปรียบเทียบ counts + totals
7. **Switch Backend → D1** — Deploy staging, ทดสอบ API
8. **Regression Test** — Login, CRUD, Upload, Backup, Restore
9. **Remove Legacy KV** — หลัง 7 วัน production

---

## 8. Testing Plan

### Integration Tests
| Endpoint | Cases |
|----------|-------|
| POST /api/login | correct / wrong / rate-limit |
| GET /api/accounts | with token / without token |
| POST /api/transactions | valid / missing fields / invalid |
| GET /api/backup | valid structure |
| POST /api/restore | v1 / v2 / invalid format |
| POST /api/upload | jpg/png/pdf OK, exe/zip NG, >10MB NG |

### Manual Checklist
- [ ] Login ด้วยรหัสเดิมได้
- [ ] ยอดเงินทุก account ตรงกับ backup
- [ ] Transaction list แสดงครบ
- [ ] Slip images ดูได้
- [ ] Export Excel/CSV ทำงาน
- [ ] Import backup v1 เดิมสำเร็จ
- [ ] Soft delete → Trash → Restore ได้

---

## 9. Rollback Plan

**Immediate (< 1 นาที):**
- Cloudflare Dashboard → Pages → Deployments → Rollback
- KV data ยังอยู่ครบ

**Data Rollback:**
- ใช้ backup v1 JSON + `POST /api/restore`

**Emergency:**
- Revert wrangler.toml → redeploy
- KV fallback code ยังเก็บไว้ชั่วคราว

---

## 10. Phase Checklist

### Phase 1 — Analysis ✅
- [x] อ่าน System Refactor Specification (PDF)
- [x] วิเคราะห์ backup structure (7 accounts, 190 tx, 13 categories)
- [x] วิเคราะห์ Pages Function, server.js, frontend
- [x] สร้าง IMPLEMENTATION_PLAN.md

### Phase 2 — Database Setup
- [ ] สร้าง D1 database บน Cloudflare
- [ ] เขียน 001_initial_schema.sql (ตาม schema ข้างต้น)
- [ ] เขียน migrate_from_backup.js
- [ ] Run migration กับ backup จริง
- [ ] Verify data integrity (counts + totals)

### Phase 3 — Backend Refactor
- [ ] Refactor Pages Function → ใช้ D1 แทน KV
- [ ] User auth (username/password/role)
- [ ] Session management (KV-backed secure sessions)
- [ ] Rate limiting (5 attempts → 15 min lock)
- [ ] Input validation
- [ ] Soft delete (deleted_at)
- [ ] Pagination (GET /api/transactions?page=&limit=)
- [ ] Audit logging
- [ ] Backup v1 import (backward compat)
- [ ] Backup v2 export (ZIP)
- [ ] File serving endpoint (/uploads/:filename)
- [ ] Security headers middleware

### Phase 4 — Image Storage (R2)
- [ ] สร้าง R2 bucket
- [ ] Upload → R2 (resize → WebP 1600px 80%)
- [ ] Migrate KV images → R2
- [ ] Update slip_url format

### Phase 5 — Frontend Updates
- [ ] Auth → secure cookie/session (ลบ localStorage token)
- [ ] User management UI (admin only)
- [ ] Trash/Soft-Delete UI
- [ ] Pagination UI
- [ ] Backup Import Wizard (step-by-step)
- [ ] Admin Dashboard (D1/R2/KV/Cron status)
- [ ] Security headers (_headers)

### Phase 6 — Automation
- [ ] Cron trigger: Daily backup 00:00
- [ ] Cron trigger: Daily report 20:00
- [ ] LINE Messaging API integration
- [ ] Google Drive backup upload

### Phase 7 — Testing & Cleanup
- [ ] Integration tests ผ่านทั้งหมด
- [ ] Import backup v1 ไฟล์เดิมสำเร็จ
- [ ] Performance test
- [ ] Security review
- [ ] Remove legacy KV code
- [ ] สร้าง walkthrough.md

---

## 11. Open Questions

> [!IMPORTANT]
> **โปรดยืนยันประเด็นเหล่านี้ก่อนเริ่ม Phase 2:**

1. **Admin Credentials**: ต้องการ username อะไร? รหัส passcode เดิมจะถูกแปลงเป็น bcrypt hash ให้ หรือต้องการตั้งรหัสใหม่?

2. **Cloudflare R2**: เปิดใช้ R2 แล้วหรือยัง? ถ้ายัง — ต้องการให้ทำ Phase 4 (R2) เลย หรือทิ้งไว้ใน KV ก่อนแล้วค่อยทำ?

3. **LINE Bot**: มี LINE Channel Access Token อยู่ไหม? หรือต้องการ setup ใหม่?

4. **Google Drive Backup**: ต้องการ auto Google Drive backup จริงๆ หรือ manual download ก็พอ?

5. **Multi-user**: ต้องการ multi-user (admin + user roles) ทันที Phase 3 หรือทำ single-admin ก่อน?

6. **Staging Branch**: ต้องการ staging branch ก่อน deploy production ไหม?

---

> [!WARNING]
> **ห้ามแก้ไขโค้ดใดๆ จนกว่าจะได้รับการยืนยัน**

> [!NOTE]
> `server.js` ใช้สำหรับ local development เท่านั้น ไม่ deploy ขึ้น Cloudflare

> [!TIP]
> D1 Free: 5GB / 5M read rows/day / 100K write rows/day — เกินพอสำหรับ 4 users

---
*Prepared by: Antigravity AI | 2026-07-02*
