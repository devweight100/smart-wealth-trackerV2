# Smart Wealth Tracker — คู่มือโครงการ (Project Documentation)

> อัปเดตล่าสุด: 2026-07-03

---

## 📁 โครงสร้างไฟล์ทั้งโปรเจค

```
Ai รายรับรายจ่าย/
├── public/                          # Frontend (Static Files)
│   ├── index.html                   # หน้าเว็บหลัก (SPA)
│   ├── css/
│   │   └── style.css                # CSS ทั้งหมด (Design System, Components, Themes)
│   └── js/
│       ├── api.js                   # Client-side API helper (fetch wrapper + auth)
│       ├── app.js                   # Logic หลักของ Frontend (State, UI, Event Handlers)
│       ├── charts.js                # Chart.js — กราฟ Dashboard (รายได้/รายจ่าย/แนวโน้ม)
│       └── export.js                # Export Excel/CSV ฝั่ง browser
│
├── functions/                       # Backend (Cloudflare Pages Functions)
│   ├── _worker.js                   # Entry Point: HTTP routing + Cron Triggers
│   └── api/
│       ├── [[path]].js              # API Handler หลัก — routes ทุก endpoint
│       └── lib/
│           ├── auth.js              # Authentication: hash, JWT, session
│           ├── db.js                # Database layer: D1 queries ทุก table
│           ├── report.js            # LINE Messaging API: sendLineReport()
│           ├── backup.js            # Backup/Restore: export/import JSON
│           ├── storage.js           # R2 Object Storage: upload/serve/delete ไฟล์
│           ├── audit.js             # Audit Log: บันทึก action ผู้ใช้
│           └── validator.js         # Input Validation: sanitize, validate schemas
│
├── migrations/                      # D1 SQL Migration Scripts
│   └── 0001_initial.sql             # Schema ครั้งแรก (tables ทั้งหมด)
│
├── wrangler.toml                    # Cloudflare Wrangler Config (D1, R2, KV binding)
├── DOCS.md                          # คู่มือนี้ — อัปเดตเมื่อมีการแก้ไขโปรเจค
└── package.json
```

---

## 🗄️ Database Schema (Cloudflare D1)

### ตาราง `accounts` — บัญชีการเงิน
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | UUID |
| name | TEXT | ชื่อบัญชี |
| type | TEXT | `cash` / `bank` |
| bank_name | TEXT | ชื่อธนาคาร |
| initial_balance | REAL | ยอดเริ่มต้น |
| color | TEXT | สีบัญชี |
| created_by | TEXT | FK → users.id |
| created_at | TEXT | ISO datetime |
| deleted_at | TEXT | Soft delete |

### ตาราง `categories` — หมวดหมู่
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | UUID |
| name | TEXT | ชื่อหมวดหมู่ |
| type | TEXT | `income` / `expense` |
| icon | TEXT | Icon class |
| created_by | TEXT | FK → users.id |
| deleted_at | TEXT | Soft delete |

### ตาราง `transactions` — รายการรายรับ-รายจ่าย
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | UUID |
| date | TEXT | วันที่ (YYYY-MM-DD) |
| type | TEXT | `income` / `expense` / `future` |
| category_name | TEXT | ชื่อหมวดหมู่ (snapshot) |
| category_id | TEXT | FK → categories.id |
| amount | REAL | จำนวนเงิน |
| payment_method | TEXT | วิธีชำระ |
| account_id | TEXT | FK → accounts.id |
| notes | TEXT | หมายเหตุ |
| slip_url | TEXT | URL สลิป (R2) |
| status | TEXT | `pending` / `paid` (สำหรับ future) |
| created_by | TEXT | FK → users.id |
| created_at | TEXT | ISO datetime |
| updated_at | TEXT | ISO datetime |
| deleted_at | TEXT | Soft delete |

### ตาราง `users` — ผู้ใช้งาน
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | UUID |
| username | TEXT UNIQUE | ชื่อผู้ใช้ |
| password_hash | TEXT | bcrypt hash |
| role | TEXT | `admin` / `user` |
| is_active | INTEGER | 1=active, 0=disabled |
| created_at | TEXT | ISO datetime |

### ตาราง `sessions` — Session Token
| Column | Type | Description |
|--------|------|-------------|
| token | TEXT PK | JWT-like token |
| user_id | TEXT | FK → users.id |
| expires_at | TEXT | วันหมดอายุ |
| created_at | TEXT | ISO datetime |

### ตาราง `settings` — การตั้งค่าระบบ
| Column | Type | Description |
|--------|------|-------------|
| key | TEXT PK | ชื่อค่า |
| value | TEXT | ค่า |
| updated_at | TEXT | ISO datetime |

**Settings keys ที่ใช้งาน:**
| Key | ความหมาย |
|-----|----------|
| `line_channel_token` | LINE Messaging API Channel Access Token |
| `line_group_id` | LINE Group ID ที่จะส่งแจ้งเตือนเข้า |
| `gdrive_folder_id` | Google Drive Folder ID (backup) |
| `backup_retention_days` | เก็บ backup กี่วัน (default: 30) |

### ตาราง `backup_history` — ประวัติ Backup
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | UUID |
| status | TEXT | `success` / `failed` |
| storage_path | TEXT | path ใน R2 |
| file_size | INTEGER | ขนาดไฟล์ (bytes) |
| error_message | TEXT | ข้อผิดพลาด (ถ้ามี) |
| created_at | TEXT | ISO datetime |

### ตาราง `audit_logs` — Audit Trail
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | UUID |
| user_id | TEXT | FK → users.id |
| username | TEXT | snapshot ชื่อผู้ใช้ |
| action | TEXT | เช่น `create_transaction` |
| resource | TEXT | เช่น `transaction` |
| ip_address | TEXT | IP ผู้ใช้ |
| created_at | TEXT | ISO datetime |

---

## 🔌 API Endpoints

> Base URL: `https://smart-wealth-tracker.pages.dev`  
> Auth: `Authorization: Bearer <token>` header (ทุก endpoint ยกเว้น `/api/login`)

### 🔐 Authentication
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/login` | Login → ได้ token กลับ |
| POST | `/api/logout` | Logout (ลบ session) |
| GET | `/api/me` | ข้อมูล user ปัจจุบัน |

### 💰 Transactions
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/transactions` | ดึงรายการ (รองรับ pagination + filter) |
| POST | `/api/transactions` | สร้างรายการใหม่ |
| PUT | `/api/transactions/:id` | แก้ไขรายการ |
| DELETE | `/api/transactions/:id` | Soft delete |

**Query params สำหรับ GET:**
- `page`, `limit` — pagination
- `type` — `income` / `expense` / `future`
- `accountId`, `startDate`, `endDate`, `keyword`

**Response format:**
```json
{ "data": [...], "total": 163, "page": 1, "limit": 50, "pages": 4 }
```

### 🏦 Accounts
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/accounts` | รายการบัญชีทั้งหมด (พร้อม balance คำนวณ) |
| POST | `/api/accounts` | สร้างบัญชีใหม่ |
| PUT | `/api/accounts/:id` | แก้ไขบัญชี |
| DELETE | `/api/accounts/:id` | Soft delete |

### 🏷️ Categories
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/categories` | หมวดหมู่ทั้งหมด |
| POST | `/api/categories` | สร้างหมวดหมู่ |
| PUT | `/api/categories/:id` | แก้ไข |
| DELETE | `/api/categories/:id` | Soft delete |

### 📎 Upload
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/upload` | อัปโหลดสลิป → เก็บใน R2 |
| GET | `/api/files/:filename` | ดึงไฟล์จาก R2 |

### 🗑️ Trash
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/trash` | รายการที่ถูกลบ (soft delete) |
| POST | `/api/trash/:type/:id` | กู้คืน |
| DELETE | `/api/trash/:type/:id` | ลบถาวร |

### 💾 Backup & Restore
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/backup` | ดาวน์โหลด Backup JSON |
| POST | `/api/restore` | นำเข้า Backup JSON |

### 🔧 Admin (admin เท่านั้น)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/stats` | สถิติระบบ |
| GET | `/api/admin/audit` | Audit logs |
| GET | `/api/admin/settings` | ดึง settings |
| POST | `/api/admin/settings` | บันทึก settings |
| GET | `/api/admin/users` | รายชื่อผู้ใช้ |
| POST | `/api/admin/users` | สร้างผู้ใช้ใหม่ |
| PUT | `/api/admin/users/:id` | แก้ไขผู้ใช้ |
| GET | `/api/admin/line-settings` | ดูสถานะการตั้งค่า LINE Bot |
| POST | `/api/admin/line-settings` | บันทึก LINE Bot credentials |
| POST | `/api/admin/test-line` | ทดสอบส่งข้อความ LINE |
| POST | `/api/admin/send-report` | ส่ง Daily Report ไป LINE ทันที |

---

## 🌿 Environment Variables / Secrets

ตั้งค่าใน **Cloudflare Dashboard → Pages → Settings → Environment Variables**

| Variable | ที่ใช้ | ต้องการ? |
|----------|--------|---------|
| `LINE_CHANNEL_ACCESS_TOKEN` | LINE Messaging API token (override DB) | Optional |
| `LINE_GROUP_ID` | LINE Group ID (override DB) | Optional |
| `GDRIVE_SA_KEY` | Google Service Account JSON (backup to Drive) | Optional |
| `GDRIVE_FOLDER_ID` | Google Drive Folder ID | Optional |

> **หมายเหตุ:** LINE credentials สามารถตั้งค่าผ่าน Admin Panel ได้โดยไม่ต้อง redeploy  
> Env var จะ **override** ค่าใน Database เสมอ

---

## 🏗️ Frontend Architecture

### State Management
```js
const State = {
  transactions: [],    // array ของ transaction objects
  accounts:     [],    // array ของ account objects
  categories:   [],    // array ของ category objects
  filters:      { type, category, account, search, dateStart, dateEnd },
  pagination:   { page, limit },
  txTotal:      0,     // จำนวนรายการทั้งหมด (server-side)
  txPages:      1,     // จำนวนหน้าทั้งหมด
}
```

### ฟังก์ชันหลัก (`app.js`)
| ฟังก์ชัน | หน้าที่ |
|---------|---------|
| `reloadAppData()` | โหลดข้อมูลทั้งหมดจาก API + อัปเดต UI |
| `refreshDashboard()` | คำนวณ stats + อัปเดต Dashboard cards + charts |
| `refreshTransactionsTable()` | render ตารางรายการพร้อม filter + pagination |
| `refreshReportsTable()` | render ตารางสรุปรายงาน |
| `refreshAccountsList()` | render รายการบัญชี |
| `loadAdminPanel()` | โหลด Admin Panel (stats, users, audit, LINE status) |
| `loadLineSettings()` | ดึงสถานะ LINE Bot จาก API + อัปเดต badge |
| `saveLineSettings()` | บันทึก Channel Token + Group ID |
| `testLineBot()` | ทดสอบส่งข้อความ LINE |
| `sendLineReport()` | ส่ง Daily Report เข้ากลุ่ม LINE |

### `api.js` — Client-side API Helper
- `fetchWithAuth()` — fetch wrapper ที่ attach Bearer token อัตโนมัติ
- `API.login()`, `API.logout()` — authentication
- `API.getTransactions(params)` — รองรับ pagination + filters
- `API.getAccounts()`, `API.getCategories()` — master data
- `API.getBackup()`, `API.restoreBackup()` — backup management

---

## ⚙️ Backend Architecture

### `_worker.js` — Entry Point
- **HTTP requests** → ส่งต่อไปที่ `[[path]].js`
- **Cron Triggers:**
  - `0 17 * * *` (UTC) = 00:00 น. (ไทย) → `runDailyBackup()`
  - `0 13 * * *` (UTC) = 20:00 น. (ไทย) → `runDailyReport()`

### `[[path]].js` — API Router
- รับ HTTP request → ตรวจ auth → route ไปยัง handler ที่ถูกต้อง
- ใช้ Pattern: `if (path === '/endpoint' && method === 'GET') { ... }`

### `lib/db.js` — Database Layer
- ทุก SQL query ผ่านที่นี่ทั้งหมด
- ฟังก์ชัน: `getTransactions`, `createTransaction`, `getSetting`, `setSetting`, etc.
- `toTransactionAPI(row)` — map DB row → API response format

### `lib/report.js` — LINE Integration
- `sendLineReport(channelAccessToken, groupId, message)` — push ข้อความเข้ากลุ่ม LINE
- ใช้ [LINE Messaging API](https://developers.line.biz/en/reference/messaging-api/#send-push-message)
- Endpoint: `POST https://api.line.me/v2/bot/message/push`

---

## 🚀 การ Deploy

```bash
# Deploy ทั้งหมด (public folder + functions)
npx wrangler pages deploy public --project-name=smart-wealth-tracker

# ตั้ง Secret
npx wrangler pages secret put LINE_CHANNEL_ACCESS_TOKEN --project-name=smart-wealth-tracker

# ดู Deployment logs
npx wrangler pages deployment tail --project-name=smart-wealth-tracker
```

### Cron Triggers (ต้องตั้งใน Cloudflare Dashboard)
1. ไป **Cloudflare Dashboard → Pages → smart-wealth-tracker → Settings → Functions**
2. เพิ่ม **Cron Triggers:**
   - `0 17 * * *` — Auto Backup (00:00 น. ไทย)
   - `0 13 * * *` — Daily Report LINE (20:00 น. ไทย)

---

## 🔒 Security Notes

1. **Session Token** — เก็บใน `localStorage` + HTTP-only cookie
2. **Password** — hashed ด้วย bcrypt (salt rounds: 10)
3. **Rate Limiting** — Login attempts จำกัด 5 ครั้ง/15 นาที
4. **LINE Token** — เก็บใน D1 settings (admin-only) หรือ Cloudflare Secret
5. **File Upload** — ตรวจ MIME type + จำกัดขนาด

---

## 📋 Admin Credentials (ค่าเริ่มต้น)

> ⚠️ เปลี่ยน password ทันทีหลัง deploy ครั้งแรก

- Username: `admin`
- Password: `Htmsxzs7`

---

## 🐛 การแก้ไขปัญหาที่พบบ่อย

| ปัญหา | สาเหตุ | วิธีแก้ |
|-------|--------|---------|
| `State.transactions.filter is not a function` | API ส่ง `{data, total}` กลับมาแทน array | ตรวจ `reloadAppData()` — ใช้ `txResult?.data ?? txResult` |
| LINE ส่งไม่ได้ | Token/GroupId ผิด หรือ Bot ไม่ได้อยู่ในกลุ่ม | ตรวจ Admin Panel → LINE Messaging Bot |
| Backup ไม่ทำงานอัตโนมัติ | Cron Triggers ยังไม่ได้ตั้ง | ตั้งใน Cloudflare Dashboard |
| Session หมดอายุ | Token หมดอายุ 7 วัน | Login ใหม่ |

---

*คู่มือนี้ต้องอัปเดตทุกครั้งที่มีการแก้ไขโปรเจค*
