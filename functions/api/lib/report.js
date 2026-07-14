// functions/api/lib/report.js
// Daily Report via LINE Messaging API + Google Drive Backup

// ─── LINE Messaging API ───────────────────────────────────────────────────────
// ใช้ LINE Messaging API push message ส่งเข้ากลุ่ม LINE
// ต้องการ: channelAccessToken + groupId
// Docs: https://developers.line.biz/en/reference/messaging-api/#send-push-message

/**
 * ส่งข้อความเข้ากลุ่ม LINE ผ่าน Messaging API
 * @param {string} channelAccessToken - Channel Access Token จาก LINE Developers Console
 * @param {string} groupId - Group ID ของกลุ่ม LINE ที่จะส่งเข้า
 * @param {string} message - ข้อความที่จะส่ง (text สูงสุด 5000 ตัวอักษร)
 * @returns {Promise<boolean>} true ถ้าส่งสำเร็จ
 */
export async function sendLineReport(channelAccessToken, groupId, message) {
  if (!channelAccessToken || !groupId) {
    console.warn('[Report] LINE credentials not configured (channelAccessToken or groupId missing) — skipping');
    return false;
  }

  try {
    const res = await fetch('https://api.line.me/v2/bot/message/push', {
      method : 'POST',
      headers: {
        'Content-Type' : 'application/json',
        'Authorization': `Bearer ${channelAccessToken}`,
      },
      body: JSON.stringify({
        to      : groupId,
        messages: [{ type: 'text', text: message }],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[Report] LINE Messaging API push failed:', res.status, errText);
      return false;
    }
    return true;
  } catch (e) {
    console.error('[Report] LINE Messaging API error:', e.message);
    return false;
  }
}

// ─── Build Daily Report Message ───────────────────────────────────────────────

export function buildDailyReport({
  balances,
  todayIncome,
  todayExpense,
  monthIncome,
  monthExpense,
  futureItems = [],
  backupStatus,
  dbStats,
  todayTransactions = [],
  tomorrowItems = [],
  reportDateStr
}) {
  const bangkokTodayStr = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Bangkok' });
  const isToday = !reportDateStr || reportDateStr === bangkokTodayStr;
  
  // แปลง reportDateStr (YYYY-MM-DD) เป็นภาษาไทย
  let todayText = '';
  let shortDateText = '';
  const dateToUse = reportDateStr || bangkokTodayStr;
  
  const parts = dateToUse.split('-');
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  todayText = d.toLocaleDateString('th-TH', { dateStyle: 'full' });
  shortDateText = d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' }).replace(' พ.ศ. ', ' ');

  const totalBal = balances.reduce((s, a) => s + (a.balance || 0), 0);
  const net      = todayIncome - todayExpense;
  const monthNet = monthIncome - monthExpense;

  const sign  = n => n >= 0 ? '+' : '';
  const baht  = n => `฿${n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // 1. หัวรายงาน (ปรับตามเงื่อนไขย้อนหลัง)
  let msg = `📊 รายงานประจำวัน${isToday ? '' : ' (ย้อนหลัง)'} — ${todayText}\n`;
  msg += `${'─'.repeat(32)}\n`;
  
  // 2. ส่วนของวันนั้นๆ (ปรับหัวข้อ "วันนี้" เป็น "วันที่เลือก" กรณีส่งแมนนวลย้อนหลัง)
  msg += `📅 ${isToday ? 'วันนี้' : `วันที่เลือก (${shortDateText})`}:\n`;
  msg += `  ↑ รายรับ: ${baht(todayIncome)}\n`;
  msg += `  ↓ รายจ่าย: ${baht(todayExpense)}\n`;
  msg += `  ${net >= 0 ? '✅' : '⚠️'} ดุลยภาพ: ${sign(net)}${baht(net)}\n\n`;

  // 3. ส่วนของเดือนนี้ (หรือเดือนที่เลือก)
  const monthLabel = isToday ? 'เดือนนี้' : 'เดือนที่เลือก';
  msg += `📆 ${monthLabel}:\n`;
  msg += `  ↑ รายรับ: ${baht(monthIncome)}\n`;
  msg += `  ↓ รายจ่าย: ${baht(monthExpense)}\n`;
  msg += `  ${monthNet >= 0 ? '✅' : '⚠️'} ดุลยภาพ: ${sign(monthNet)}${baht(monthNet)}\n\n`;

  // 4. วิเคราะห์ความเคลื่อนไหวของแต่ละบัญชี
  const accountChanges = {};
  for (const acc of balances) {
    accountChanges[acc.id] = { income: 0, expense: 0 };
  }
  for (const tx of todayTransactions) {
    const amt = Number(tx.amount || 0);
    const accId = tx.account_id || tx.accountId;
    if (accId) {
      if (!accountChanges[accId]) {
        accountChanges[accId] = { income: 0, expense: 0 };
      }
      if (tx.type === 'income' || tx.type === 'transfer_in') {
        accountChanges[accId].income += amt;
      } else if (tx.type === 'expense' || tx.type === 'transfer_out' || (tx.type === 'future' && tx.status === 'paid')) {
        accountChanges[accId].expense += amt;
      }
    }
  }

  msg += `🏦 ยอดคงเหลือและการเปลี่ยนแปลงรายบัญชี:\n`;
  for (const acc of balances) {
    const change = accountChanges[acc.id] || { income: 0, expense: 0 };
    let changeStr = '';
    if (change.income > 0 && change.expense > 0) {
      changeStr = ` (+${baht(change.income)} / -${baht(change.expense)})`;
    } else if (change.income > 0) {
      changeStr = ` (+${baht(change.income)})`;
    } else if (change.expense > 0) {
      changeStr = ` (-${baht(change.expense)})`;
    }
    msg += `  • ${acc.name}: ${baht(acc.balance || 0)}${changeStr}\n`;
  }
  msg += '\n';

  // 5. สินทรัพย์รวม (Net Wealth) ปรับป้ายกำกับให้ระบุวันที่ที่เลือก
  msg += `💰 ${isToday ? 'สินทรัพย์รวมทั้งหมด' : 'สินทรัพย์รวม ณ วันที่เลือก'}: ${baht(totalBal)}\n`;
  msg += `${'─'.repeat(32)}\n\n`;

  // 6. วิเคราะห์ค่าใช้จ่ายล่วงหน้าของวันพรุ่งนี้ (ซ่อนทั้งหมดเมื่อผู้ใช้เลือกวันที่ย้อนหลัง)
  if (isToday) {
    const tomorrowTotal = tomorrowItems.reduce((s, t) => s + Number(t.amount || 0), 0);
    msg += `⏰ รายจ่ายล่วงหน้าของวันพรุ่งนี้:\n`;
    msg += `  • จำนวน: ${tomorrowItems.length} รายการ\n`;
    msg += `  • ยอดรวม: ${baht(tomorrowTotal)}\n`;

    // ตรวจว่างบประมาณพอหรือไม่
    const isOverbudget = tomorrowTotal > totalBal;
    if (isOverbudget) {
      msg += `🚨🚨🚨 [เตือนภัย: ยอดจ่ายล่วงหน้าพรุ่งนี้เกินเงินที่มีอยู่ทั้งหมด!] 🚨🚨🚨\n`;
    }

    // เสนอวิธีชำระเงินที่ไม่ซับซ้อน
    if (tomorrowItems.length > 0) {
      msg += `💡 แนะนำวิธีชำระเงินในวันพรุ่งนี้:\n`;
      
      // โคลนยอดเงินมาเพื่อประมวลผลจำลอง
      const tempBalances = balances.map(a => ({ id: a.id, name: a.name, balance: a.balance || 0, type: a.type }));
      
      tomorrowItems.forEach(t => {
        const amt = Number(t.amount || 0);
        const acc = tempBalances.find(a => a.id === t.accountId);
        
        if (acc && acc.balance >= amt) {
          // บัญชีหลักมีเงินพอ
          acc.balance -= amt;
          msg += `  • รายการ "${t.notes || t.category}" (${baht(amt)}) แนะนำให้โอน/จ่ายผ่านบัญชี [${acc.name}] ตามที่ผูกไว้ (ยอดหลังจ่ายจะเหลือ ${baht(acc.balance)})\n`;
        } else {
          // เงินในบัญชีที่ผูกไม่พอ พยายามหาบัญชีประเภทโอน/เงินสดอื่นที่มีเงินเพียงพอ
          const isTransfer = t.paymentMethod === 'Transfer';
          const possibleAlternative = tempBalances
            .filter(a => (isTransfer ? a.type === 'bank' : true) && a.balance >= amt)
            .sort((a, b) => b.balance - a.balance)[0];
            
          if (possibleAlternative) {
            possibleAlternative.balance -= amt;
            msg += `  • ⚠️ บัญชี [${acc ? acc.name : 'ไม่ระบุ'}] มีเงินไม่พอสำหรับรายการ "${t.notes || t.category}" (${baht(amt)}) แนะนำให้เปลี่ยนไปใช้บัญชี [${possibleAlternative.name}] ชำระแทน (ยอดหลังจ่ายจะเหลือ ${baht(possibleAlternative.balance)})\n`;
          } else {
            // หากไม่มีบัญชีไหนมีเงินพอจ่ายเดี่ยวๆ ลองหาบัญชีที่มีเงินมากที่สุดเพื่อโอนมาสมทบ
            const richest = [...tempBalances].sort((a, b) => b.balance - a.balance)[0];
            if (richest && richest.balance + (acc ? acc.balance : 0) >= amt) {
              const needed = amt - (acc ? acc.balance : 0);
              richest.balance -= needed;
              if (acc) acc.balance = 0;
              msg += `  • ⚠️ บัญชี [${acc ? acc.name : 'ไม่ระบุ'}] ขาดเงินอีก ${baht(needed)} สำหรับรายการ "${t.notes || t.category}" (${baht(amt)}) แนะนำให้โอนเงินจาก [${richest.name}] มาสมทบเพื่อจ่าย\n`;
            } else {
              msg += `  • 🚨 รายการ "${t.notes || t.category}" (${baht(amt)}) เงินในระบบไม่เพียงพอจ่าย! กรุณาเติมเงินเข้าระบบ\n`;
            }
          }
        }
      });
    }
    msg += '\n';
  }

  msg += `💾 Backup: ${backupStatus || 'ยังไม่มีข้อมูล'}\n`;
  msg += `📁 DB: ${dbStats?.transactions || 0} รายการ | ${dbStats?.accounts || 0} บัญชี`;

  return msg;
}

// ─── Build Monthly Report Message ─────────────────────────────────────────────

export function buildMonthlyReport({ monthName, year, balances, monthIncome, monthExpense, categoriesStats = [] }) {
  const totalBal = balances.reduce((s, a) => s + (a.balance || 0), 0);
  const net      = monthIncome - monthExpense;
  const baht     = n => `฿${n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const sign     = n => n >= 0 ? '+' : '';

  let msg = `📊 รายงานสรุปภาพรวมประจำเดือน — ${monthName} ${year}\n`;
  msg += `${'─'.repeat(32)}\n`;
  msg += `📅 ผลรวมดุลยภาพของเดือนนี้:\n`;
  msg += `  ↑ รายรับสะสม: ${baht(monthIncome)}\n`;
  msg += `  ↓ รายจ่ายสะสม: ${baht(monthExpense)}\n`;
  msg += `  ${net >= 0 ? '✅' : '⚠️'} สุทธิ: ${sign(net)}${baht(net)}\n\n`;

  msg += `🛍️ หมวดหมู่ค่าใช้จ่ายสูงสุดของเดือนนี้ (Top 5 Categories):\n`;
  if (categoriesStats && categoriesStats.length > 0) {
    const sorted = [...categoriesStats].sort((a, b) => b.amount - a.amount).slice(0, 5);
    const totalExpenseCalc = monthExpense || sorted.reduce((s, c) => s + c.amount, 0);
    sorted.forEach((cat, index) => {
      const pct = totalExpenseCalc > 0 ? ((cat.amount / totalExpenseCalc) * 100).toFixed(1) : '0.0';
      msg += `  ${index + 1}. ${cat.name}: ${baht(cat.amount)} (${pct}% ของรายจ่ายทั้งหมด)\n`;
    });
  } else {
    msg += `  (ไม่มีข้อมูลการใช้จ่ายในเดือนนี้)\n`;
  }
  msg += '\n';

  msg += `🏦 ยอดเงินคงเหลือ ณ วันสิ้นเดือน:\n`;
  for (const acc of balances) {
    msg += `  • ${acc.name}: ${baht(acc.balance || 0)}\n`;
  }
  msg += '\n';
  msg += `💰 สินทรัพย์สุทธิรวม: ${baht(totalBal)}\n`;
  msg += `${'─'.repeat(32)}\n`;
  msg += `ยินดีด้วยที่บริหารเงินผ่านไปอีกหนึ่งเดือน! 🚀`;

  return msg;
}

// ─── Google Drive Backup Upload ───────────────────────────────────────────────

/**
 * Upload backup JSON to Google Drive using Service Account JWT.
 * Requires env vars: GDRIVE_SA_KEY (JSON string), GDRIVE_FOLDER_ID
 */
export async function uploadToGoogleDrive(serviceAccountKey, folderId, filename, jsonContent) {
  try {
    const sa = typeof serviceAccountKey === 'string' ? JSON.parse(serviceAccountKey) : serviceAccountKey;
    const accessToken = await getGoogleAccessToken(sa);
    if (!accessToken) throw new Error('Failed to get Google access token');

    const boundary  = '----FormBoundary' + Date.now();
    const metadata  = JSON.stringify({ name: filename, parents: [folderId] });
    const body      = [
      `--${boundary}`,
      'Content-Type: application/json; charset=UTF-8',
      '',
      metadata,
      `--${boundary}`,
      'Content-Type: application/json',
      '',
      jsonContent,
      `--${boundary}--`,
    ].join('\r\n');

    const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method : 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type' : `multipart/related; boundary=${boundary}`,
      },
      body,
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Google Drive upload failed: ${res.status} ${err}`);
    }
    const file = await res.json();
    return { success: true, fileId: file.id, filename };
  } catch (e) {
    console.error('[GDrive] Upload error:', e.message);
    return { success: false, error: e.message };
  }
}

/**
 * Clean up old backups (keep last N days).
 */
export async function cleanupOldDriveBackups(serviceAccountKey, folderId, keepDays = 30) {
  try {
    const sa = typeof serviceAccountKey === 'string' ? JSON.parse(serviceAccountKey) : serviceAccountKey;
    const accessToken = await getGoogleAccessToken(sa);
    if (!accessToken) return;

    const cutoff = new Date(Date.now() - keepDays * 86400000).toISOString();
    const query  = encodeURIComponent(`'${folderId}' in parents and createdTime < '${cutoff}' and name contains 'Smart_Wealth_Backup'`);
    const res    = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });
    if (!res.ok) return;

    const { files } = await res.json();
    for (const file of files || []) {
      await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}`, {
        method : 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
    }
  } catch (e) {
    console.error('[GDrive] Cleanup error:', e.message);
  }
}

// ─── Google OAuth2 via Service Account JWT ────────────────────────────────────

async function getGoogleAccessToken(serviceAccount) {
  try {
    const now    = Math.floor(Date.now() / 1000);
    const header = { alg: 'RS256', typ: 'JWT' };
    const claim  = {
      iss  : serviceAccount.client_email,
      scope: 'https://www.googleapis.com/auth/drive.file',
      aud  : 'https://oauth2.googleapis.com/token',
      exp  : now + 3600,
      iat  : now,
    };

    const b64 = obj => btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const unsigned = `${b64(header)}.${b64(claim)}`;

    // Import RSA private key
    const pemBody = serviceAccount.private_key
      .replace(/-----BEGIN PRIVATE KEY-----/, '')
      .replace(/-----END PRIVATE KEY-----/, '')
      .replace(/\s/g, '');
    const binaryKey  = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0));
    const cryptoKey  = await crypto.subtle.importKey(
      'pkcs8', binaryKey,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false, ['sign']
    );
    const signature  = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, new TextEncoder().encode(unsigned));
    const sigB64     = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const jwt        = `${unsigned}.${sigB64}`;

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method : 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body   : `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    });
    const data = await res.json();
    return data.access_token || null;
  } catch (e) {
    console.error('[GDrive] JWT error:', e.message);
    return null;
  }
}
