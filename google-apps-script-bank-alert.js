/**
 * Google Apps Script for Smart Wealth Tracker
 * ระบบส่งต่อรายการแจ้งเตือนเงินเข้า-ออกจาก Gmail สู่ระบบ Smart Wealth Tracker อัตโนมัติ
 * 
 * วิธีติดตั้ง:
 * 1. เปิด https://script.google.com ด้วยบัญชี Gmail ที่รับแจ้งเตือนจากธนาคาร
 * 2. สร้าง New Project แล้ววางโค้ดนี้ทั้งหมดลงไป
 * 3. ตั้งค่า WEB_APP_URL ให้เป็น URL ของระบบ Smart Wealth Tracker (เช่น https://your-domain.pages.dev)
 * 4. กำหนด SECRET_TOKEN ให้ตรงกับ BANK_ALERT_SECRET ของระบบ (ค่าเริ่มต้น: swt-secret-bank-alert)
 * 5. ตั้ง Triggers (รูปนาฬิกาด้านซ้าย) ให้ฟังก์ชัน syncBankAlerts รันทุก 5 หรือ 10 นาที
 */

const CONFIG = {
  // URL ระบบ Smart Wealth Tracker (Production)
  WEB_APP_URL: 'https://smart-wealth-tracker-v2.pages.dev/api/bank-alerts/incoming',
  
  // Secret token เพื่อความปลอดภัย
  SECRET_TOKEN: 'swt-secret-bank-alert',

  // ค้นหาอีเมลที่เข้ามาไม่เกินกี่ชั่วโมง (ค่าเริ่มต้น 24 ชั่วโมง)
  HOURS_BACK: 24,

  // คำค้นหาใน Gmail (รองรับ KBANK, SCB, KTB, TTB ฯลฯ)
  SEARCH_QUERY: 'newer_than:1d (from:kasikornbank.com OR from:scb.co.th OR from:ktb.co.th OR subject:"เงินเข้า" OR subject:"K-eMail Alert" OR subject:"เงินโอนเข้า" OR subject:"แจ้งรายการเงินเข้า")'
};

/**
 * ฟังก์ชันหลักที่ทำงานตามรอบเวลา (Trigger) หรือกดรันด้วยตนเอง
 */
function syncBankAlerts() {
  const threads = GmailApp.search(CONFIG.SEARCH_QUERY, 0, 30);
  const alerts = [];

  for (const thread of threads) {
    const messages = thread.getMessages();
    for (const msg of messages) {
      // ตรวจสอบว่าเคยประมวลผลแล้วหรือยังผ่าน UserProperties
      const msgId = msg.getId();
      if (isMessageProcessed(msgId)) continue;

      const subject = msg.getSubject() || '';
      const body = msg.getPlainBody() || '';
      const date = msg.getDate();

      const parsed = parseBankEmail(subject, body, date);
      if (parsed) {
        parsed.id = 'GMAIL-' + msgId;
        parsed.email = Session.getActiveUser().getEmail();
        parsed.rawSubject = subject;
        parsed.rawSnippet = body.substring(0, 200).replace(/\s+/g, ' ');
        alerts.push(parsed);
        markMessageProcessed(msgId);
      }
    }
  }

  if (alerts.length > 0) {
    Logger.log(`พบรายการแจ้งเตือนใหม่ ${alerts.length} รายการ กำลังส่งเข้าระบบ...`);
    sendAlertsToWebApp(alerts);
  } else {
    Logger.log('ไม่พบรายการแจ้งเตือนใหม่');
  }
}

/**
 * แยกข้อมูลจากเนื้อหาอีเมลธนาคาร
 */
function parseBankEmail(subject, body, date) {
  const text = (subject + '\n' + body);

  // 1. ตรวจประเภท รายรับ (Income) หรือ รายจ่าย (Expense)
  const isIncome = /เงินเข้า|โอนเงินเข้า|รับโอน|โอนเข้า|deposit|received|inward/i.test(subject) ||
                   /เข้าบัญชี|รับเงินโอน|มีเงินเข้า/i.test(text);
  const isExpense = /เงินออก|โอนเงินออก|ชำระเงิน|ถอนเงิน|payment|withdraw/i.test(subject) ||
                    /หักบัญชี|โอนออกจากบัญชี/i.test(text);
  
  if (!isIncome && !isExpense) return null;
  const type = isIncome ? 'income' : 'expense';

  // 2. ดึงจำนวนเงิน (Amount)
  // รูปแบบ เช่น: จำนวนเงิน 1,500.00 บาท หรือ ยอดเงิน: 500.00 บาท หรือ 1,250.00 THB
  let amount = null;
  const amtMatch = text.match(/(?:จำนวนเงิน|ยอดเงิน|จำนวน|amount|ยอดทำรายการ|ยอดเงินโอน)\s*[:=]?\s*([0-9,]+\.?[0-9]*)\s*(?:บาท|THB)?/i) ||
                   text.match(/([0-9,]+\.[0-9]{2})\s*(?:บาท|THB)/i);
  if (amtMatch) {
    amount = parseFloat(amtMatch[1].replace(/,/g, ''));
  }
  if (!amount || isNaN(amount) || amount <= 0) return null;

  // 3. ดึงเลขที่บัญชีของเรา (Account Number)
  // เช่น เลขที่บัญชี: xxx-x-12345-x หรือ เข้าบัญชี: 123-4-56789-0 หรือ บัญชี x-1234
  let accountNumber = '';
  const accMatch = text.match(/(?:เข้าบัญชี|เลขที่บัญชี|ไปยังบัญชี|จากบัญชี|บัญชีเลขที่|บัญชีผู้รับ|บัญชีต้นทาง|account)\s*[:=]?\s*([0-9xX\-]+)/i) ||
                   text.match(/(?:[xX0-9]{3}-[xX0-9]-[xX0-9]{5}-[xX0-9]|[xX0-9]{3}-[xX0-9]{6}-[xX0-9]|[xX0-9]{1,3}-[xX0-9]{3,5})/);
  if (accMatch) {
    accountNumber = accMatch[1].trim();
  }

  // 4. ดึงข้อมูลผู้โอน / คู่ค้า (Counterparty)
  // เช่น จากบัญชี: xxx-x-99999-x หรือ ผู้โอน: นาย สมชาย หรือ พร้อมเพย์ 081-xxx-xxxx
  let counterpartyAccount = '';
  let counterpartyName = '';
  
  const fromAccMatch = text.match(/(?:จาก|ผู้โอน|จากบัญชี|จากหมายเลข|โอนจาก)\s*[:=]?\s*([0-9xX\-]+|[^\n\r]+)/i);
  if (fromAccMatch) {
    const rawVal = fromAccMatch[1].trim();
    if (/[0-9xX\-]/.test(rawVal)) {
      counterpartyAccount = rawVal.split(' ')[0].substring(0, 30);
    } else {
      counterpartyName = rawVal.substring(0, 50);
    }
  }

  // ช่องทาง PromptPay
  let channel = 'Transfer';
  if (/พร้อมเพย์|promptpay/i.test(text)) {
    channel = 'PromptPay';
  }

  // วันเวลา
  const txTime = date ? Utilities.formatDate(date, 'GMT+7', "yyyy-MM-dd'T'HH:mm:ss") : Utilities.formatDate(new Date(), 'GMT+7', "yyyy-MM-dd'T'HH:mm:ss");

  return {
    accountNumber: accountNumber || 'ไม่ระบุเลขบัญชี',
    amount: amount,
    type: type,
    txTime: txTime,
    counterpartyAccount: counterpartyAccount || null,
    counterpartyName: counterpartyName || null,
    channel: channel
  };
}

/**
 * ส่งข้อมูล JSON ไปยัง Smart Wealth Tracker API
 */
function sendAlertsToWebApp(alerts) {
  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'x-api-key': CONFIG.SECRET_TOKEN
    },
    payload: JSON.stringify({
      secret: CONFIG.SECRET_TOKEN,
      alerts: alerts
    }),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(CONFIG.WEB_APP_URL, options);
    const code = response.getResponseCode();
    const content = response.getContentText();
    Logger.log(`ผลการส่งข้อมูล: HTTP ${code} - ${content}`);
  } catch (err) {
    Logger.log(`เกิดข้อผิดพลาดในการส่งข้อมูล: ${err.message}`);
  }
}

function isMessageProcessed(msgId) {
  const props = PropertiesService.getUserProperties();
  return Boolean(props.getProperty('MSG_' + msgId));
}

function markMessageProcessed(msgId) {
  const props = PropertiesService.getUserProperties();
  props.setProperty('MSG_' + msgId, '1');
}
