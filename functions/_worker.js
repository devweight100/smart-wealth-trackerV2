// functions/_worker.js
// Cloudflare Pages Advanced Mode Worker
// Handles: HTTP requests (route-based) + Scheduled Cron events

import {
  exportBackupV1, recordBackup, calculateBalances,
  getTransactions, getDashboardStats, getSetting
} from './api/lib/db.js';
import { sendLineReport, buildDailyReport, buildMonthlyReport, uploadToGoogleDrive, cleanupOldDriveBackups } from './api/lib/report.js';

// ─── HTTP Request Handler ─────────────────────────────────────────────────────
// Delegate to Pages Functions routing (pass-through)
export default {
  async fetch(request, env, ctx) {
    // Pages Functions handles routing automatically via functions/api/[[path]].js
    // This worker just adds cron support alongside it
    return env.ASSETS.fetch(request);
  },

  // ─── Scheduled Events (Cron Triggers) ───────────────────────────────────────
  async scheduled(event, env, ctx) {
    const db = env.DB;
    if (!db) {
      console.error('[Cron] D1 database not bound');
      return;
    }

    const cronExpression = event.cron;
    console.log(`[Cron] Triggered: ${cronExpression} at ${new Date().toISOString()}`);

    // 00:00 ICT = 17:00 UTC → Daily Backup
    if (cronExpression === '0 17 * * *') {
      await runDailyBackup(db, env);
    }

    // 20:00 ICT = 13:00 UTC → Daily Report
    if (cronExpression === '0 13 * * *') {
      await runDailyReport(db, env);
    }
  },
};

// ─── Daily Backup ─────────────────────────────────────────────────────────────

async function runDailyBackup(db, env) {
  console.log('[Backup] Starting daily backup...');
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const filename = `Smart_Wealth_Backup_${dateStr}.json`;

  let status = 'failed';
  let storagePath = null;
  let fileSize = 0;
  let checksum = null;
  let errorMessage = null;
  let counts = {};

  try {
    // 1. Export data
    const data = await exportBackupV1(db);
    const balances = await calculateBalances(db);
    const balanceMap = Object.fromEntries(balances.map(a => [a.id, a.balance]));
    data.accounts = data.accounts.map(a => ({ ...a, balance: balanceMap[a.id] ?? a.initialBalance }));

    const jsonContent = JSON.stringify(data, null, 2);
    fileSize = new TextEncoder().encode(jsonContent).byteLength;

    counts = {
      accounts    : data.accounts.length,
      transactions: data.transactions.length,
      categories  : data.categories.length,
    };

    // 2. Compute checksum (SHA-256)
    const hashBuf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(jsonContent));
    checksum = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('');

    // 3. Upload to Google Drive
    const saKey    = env.GDRIVE_SA_KEY;
    const folderId = env.GDRIVE_FOLDER_ID || await getSetting(db, 'gdrive_folder_id');

    if (saKey && folderId) {
      const result = await uploadToGoogleDrive(saKey, folderId, filename, jsonContent);
      if (result.success) {
        storagePath = `gdrive:${folderId}/${filename}`;
        status = 'success';
        console.log(`[Backup] Uploaded to Google Drive: ${filename}`);

        // Cleanup old backups
        const retainDays = parseInt(await getSetting(db, 'backup_retention_days') || '30');
        await cleanupOldDriveBackups(saKey, folderId, retainDays);
      } else {
        errorMessage = result.error;
        console.error('[Backup] Google Drive upload failed:', result.error);
      }
    } else {
      // Store in R2 as fallback
      if (env.IMAGES) {
        await env.IMAGES.put(`backups/${filename}`, jsonContent, {
          httpMetadata: { contentType: 'application/json' },
          customMetadata: { backupDate: now.toISOString(), checksum },
        });
        storagePath = `r2:backups/${filename}`;
        status = 'success';
        console.log(`[Backup] Stored in R2: backups/${filename}`);
      } else {
        errorMessage = 'No storage configured (GDRIVE_SA_KEY or R2 IMAGES)';
        console.warn('[Backup] ' + errorMessage);
        status = 'success'; // Data was still exported, just not uploaded
        storagePath = 'local-only';
      }
    }
  } catch (e) {
    errorMessage = e.message;
    console.error('[Backup] Error:', e.message);
  }

  // 4. Record in backup_history
  await recordBackup(db, { status, storagePath, fileSize, checksum, errorMessage, userId: null, counts });

  // 5. Notify via LINE Messaging API if backup failed
  if (status === 'failed') {
    const lineToken   = env.LINE_CHANNEL_ACCESS_TOKEN || await getSetting(db, 'line_channel_token');
    const lineGroupId = env.LINE_GROUP_ID             || await getSetting(db, 'line_group_id');
    if (lineToken && lineGroupId) {
      await sendLineReport(lineToken, lineGroupId,
        `⚠️ [Smart Wealth] Backup ล้มเหลว!\nวันที่: ${dateStr}\nError: ${errorMessage}`);
    }
  }

  console.log(`[Backup] Done — status: ${status}`);
}

// ─── Daily Report ─────────────────────────────────────────────────────────────

async function runDailyReport(db, env) {
  console.log('[Report] Starting daily report...');

  // Priority: env var > D1 settings
  const lineToken   = env.LINE_CHANNEL_ACCESS_TOKEN || await getSetting(db, 'line_channel_token');
  const lineGroupId = env.LINE_GROUP_ID             || await getSetting(db, 'line_group_id');

  if (!lineToken || !lineGroupId) {
    console.warn('[Report] LINE credentials not configured (LINE_CHANNEL_ACCESS_TOKEN or LINE_GROUP_ID missing) — skipping');
    return;
  }

  try {
    const today      = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Bangkok' });
    const monthStart = today.slice(0, 7) + '-01';

    // คำนวณวันพรุ่งนี้ (Tomorrow) ในเขตเวลา Asia/Bangkok
    const todayDate = new Date();
    const localTime = todayDate.getTime() + todayDate.getTimezoneOffset() * 60000;
    const bangkokToday = new Date(localTime + (7 * 60 * 60 * 1000));
    const bangkokTomorrow = new Date(bangkokToday.getTime() + 24 * 60 * 60 * 1000);
    const tomorrow = bangkokTomorrow.toISOString().slice(0, 10);

    // Fetch all data in parallel
    const [balances, stats, futureTxResult] = await Promise.all([
      calculateBalances(db),
      getDashboardStats(db),
      getTransactions(db, { type: 'future', limit: 500 }),
    ]);

    // ดึงธุรกรรมของวันนี้แบบเต็ม (Today transactions)
    const { results: todayTransactions } = await db.prepare(
      `SELECT type, amount, account_id, status FROM transactions WHERE date=? AND deleted_at IS NULL`
    ).bind(today).all();

    // ดึงธุรกรรมของวันพรุ่งนี้แบบเต็ม (Tomorrow items)
    const { results: tomorrowItems } = await db.prepare(
      `SELECT notes, category_name as category, amount, account_id, payment_method FROM transactions WHERE type='future' AND status != 'paid' AND date=? AND deleted_at IS NULL`
    ).bind(tomorrow).all();

    // Today income/expense
    const todayIncome  = todayTransactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
    const todayExpense = todayTransactions.filter(t => t.type === 'expense' || (t.type === 'future' && t.status === 'paid')).reduce((s, t) => s + Number(t.amount), 0);

    // Month income/expense
    const { results: monthTx } = await db.prepare(
      `SELECT type, amount FROM transactions WHERE date>=? AND date<=? AND deleted_at IS NULL`
    ).bind(monthStart, today).all();

    const monthIncome  = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
    const monthExpense = monthTx.filter(t => t.type === 'expense' || (t.type === 'future' && t.status === 'paid')).reduce((s, t) => s + Number(t.amount), 0);

    // Get last backup info
    const lastBackup = await db.prepare(
      `SELECT status, created_at FROM backup_history ORDER BY created_at DESC LIMIT 1`
    ).first();
    const backupStatus = lastBackup
      ? `${lastBackup.status === 'success' ? '✅' : '❌'} ${lastBackup.created_at?.slice(0, 10) || '-'}`
      : 'ไม่มีข้อมูล';

    // สร้าง Daily Report message
    const message = buildDailyReport({
      balances,
      todayIncome,
      todayExpense,
      monthIncome,
      monthExpense,
      futureItems : futureTxResult.data || [],
      backupStatus,
      dbStats     : stats,
      todayTransactions,
      tomorrowItems
    });

    const sent = await sendLineReport(lineToken, lineGroupId, message);
    console.log(`[Report] LINE Daily Report notification ${sent ? 'sent ✅' : 'failed ❌'}`);

    // ตรวจสอบวันสิ้นเดือนเพื่อส่ง Monthly Report อัตโนมัติ
    const nextDay = new Date(bangkokToday.getTime() + 24 * 60 * 60 * 1000);
    const isLastDayOfMonth = nextDay.getMonth() !== bangkokToday.getMonth();

    if (isLastDayOfMonth) {
      console.log('[Report] Today is end of month. Sending Monthly Report...');
      
      // ดึงสถิติรายจ่ายแยกตามหมวดหมู่ในเดือนปัจจุบัน
      const { results: categoriesStats } = await db.prepare(
        `SELECT category_name as name, SUM(amount) as amount FROM transactions 
         WHERE type='expense' AND date>=? AND date<=? AND deleted_at IS NULL 
         GROUP BY category_name`
      ).bind(monthStart, today).all();

      const monthName = bangkokToday.toLocaleDateString('th-TH', { month: 'long' });
      const year = bangkokToday.toLocaleDateString('th-TH', { year: 'numeric' });

      // สร้าง Monthly Report message
      const monthlyMessage = buildMonthlyReport({
        monthName,
        year,
        balances,
        monthIncome,
        monthExpense,
        categoriesStats
      });

      const sentMonthly = await sendLineReport(lineToken, lineGroupId, monthlyMessage);
      console.log(`[Report] LINE Monthly Report notification ${sentMonthly ? 'sent ✅' : 'failed ❌'}`);
    }
  } catch (e) {
    console.error('[Report] Error:', e.message);
  }
}
