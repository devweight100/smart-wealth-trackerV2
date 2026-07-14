// functions/api/lib/validator.js
// Input Validation Helpers

export class ValidationError extends Error {
  constructor(message, field = null) {
    super(message);
    this.name  = 'ValidationError';
    this.field = field;
  }
}

// ─── Validate Transaction ──────────────────────────────────────────────────────

export function validateTransaction(body) {
  const errors = [];

  if (!body.date || !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
    errors.push({ field: 'date', message: 'วันที่ไม่ถูกต้อง (ต้องเป็น YYYY-MM-DD)' });
  }
  if (!['income', 'expense', 'future'].includes(body.type)) {
    errors.push({ field: 'type', message: 'ประเภทต้องเป็น income, expense หรือ future' });
  }
  if (!body.category || typeof body.category !== 'string' || body.category.trim().length === 0) {
    errors.push({ field: 'category', message: 'กรุณาระบุหมวดหมู่' });
  }
  const amount = Number(body.amount);
  if (isNaN(amount) || amount < 0) {
    errors.push({ field: 'amount', message: 'จำนวนเงินต้องเป็นตัวเลขที่ >= 0' });
  }
  if (!['Cash', 'Transfer'].includes(body.paymentMethod)) {
    errors.push({ field: 'paymentMethod', message: 'วิธีชำระต้องเป็น Cash หรือ Transfer' });
  }
  if (!body.accountId || typeof body.accountId !== 'string') {
    errors.push({ field: 'accountId', message: 'กรุณาเลือกบัญชี' });
  }
  if (body.type === 'future' && body.status && !['pending', 'paid'].includes(body.status)) {
    errors.push({ field: 'status', message: 'สถานะต้องเป็น pending หรือ paid' });
  }

  return errors;
}

// ─── Validate Account ─────────────────────────────────────────────────────────

export function validateAccount(body) {
  const errors = [];
  if (!body.name || body.name.trim().length === 0) {
    errors.push({ field: 'name', message: 'กรุณาระบุชื่อบัญชี' });
  }
  if (!['cash', 'bank'].includes(body.type)) {
    errors.push({ field: 'type', message: 'ประเภทต้องเป็น cash หรือ bank' });
  }
  if (body.initialBalance !== undefined) {
    const bal = Number(body.initialBalance);
    if (isNaN(bal)) errors.push({ field: 'initialBalance', message: 'ยอดเริ่มต้นต้องเป็นตัวเลข' });
  }
  return errors;
}

// ─── Validate Category ────────────────────────────────────────────────────────

export function validateCategory(body) {
  const errors = [];
  if (!body.name || body.name.trim().length === 0) {
    errors.push({ field: 'name', message: 'กรุณาระบุชื่อหมวดหมู่' });
  }
  if (!['income', 'expense'].includes(body.type)) {
    errors.push({ field: 'type', message: 'ประเภทต้องเป็น income หรือ expense' });
  }
  return errors;
}

// ─── Validate Backup ─────────────────────────────────────────────────────────

export function validateBackup(data) {
  if (!data || typeof data !== 'object') return false;
  if (!Array.isArray(data.accounts))     return false;
  if (!Array.isArray(data.transactions)) return false;
  if (!Array.isArray(data.categories))   return false;
  return true;
}

// ─── Sanitize String ──────────────────────────────────────────────────────────

export function sanitize(str, maxLen = 500) {
  if (!str) return '';
  return String(str).trim().slice(0, maxLen);
}
