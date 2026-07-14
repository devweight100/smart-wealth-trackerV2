// public/js/api.js
// Client-side API Helper for Smart Wealth Tracker v2
// Updated: username/password auth, pagination support, trash, admin endpoints

const API_BASE_URL = '';

// ─── Authenticated Fetch ───────────────────────────────────────────────────────
async function fetchWithAuth(url, options = {}) {
  const token = localStorage.getItem('swt_session_token');
  options.headers = options.headers || {};
  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }
  // credentials: 'include' ensures HttpOnly cookie is also sent
  options.credentials = 'include';

  const res = await fetch(url, options);

  if (res.status === 401 && !url.includes('/api/login')) {
    localStorage.removeItem('swt_session_token');
    const loginOverlay = document.getElementById('loginOverlay');
    if (loginOverlay) {
      loginOverlay.classList.remove('hidden');
      document.body.classList.add('modal-open');
    }
    throw new Error('กรุณาเข้าสู่ระบบ');
  }

  return res;
}

const API = {
  // ─── Authentication ─────────────────────────────────────────────────────────

  async login(username, password) {
    const res = await fetch(`${API_BASE_URL}/api/login`, {
      method     : 'POST',
      credentials: 'include',
      headers    : { 'Content-Type': 'application/json' },
      body       : JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
    }
    const data = await res.json();
    if (data.token) {
      localStorage.setItem('swt_session_token', data.token);
      localStorage.setItem('swt_username', data.username || username);
      localStorage.setItem('swt_role', data.role || 'user');
    }
    return data;
  },

  async logout() {
    try {
      await fetchWithAuth(`${API_BASE_URL}/api/logout`, { method: 'POST' });
    } catch {}
    localStorage.removeItem('swt_session_token');
    localStorage.removeItem('swt_username');
    localStorage.removeItem('swt_role');
  },

  getCurrentUser() {
    return {
      username: localStorage.getItem('swt_username') || 'user',
      role    : localStorage.getItem('swt_role')     || 'user',
    };
  },

  isAdmin() {
    return localStorage.getItem('swt_role') === 'admin';
  },

  // ─── Accounts ───────────────────────────────────────────────────────────────

  async getAccounts() {
    const res = await fetchWithAuth(`${API_BASE_URL}/api/accounts`);
    if (!res.ok) throw new Error('ไม่สามารถโหลดรายการบัญชีได้');
    return res.json();
  },

  async createAccount(data) {
    const res = await fetchWithAuth(`${API_BASE_URL}/api/accounts`, {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify(data),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'สร้างบัญชีไม่สำเร็จ'); }
    return res.json();
  },

  async updateAccount(id, data) {
    const res = await fetchWithAuth(`${API_BASE_URL}/api/accounts/${id}`, {
      method : 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify(data),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'แก้ไขบัญชีไม่สำเร็จ'); }
    return res.json();
  },

  async deleteAccount(id) {
    const res = await fetchWithAuth(`${API_BASE_URL}/api/accounts/${id}`, { method: 'DELETE' });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'ลบบัญชีไม่สำเร็จ'); }
    return res.json();
  },

  // ─── Categories ─────────────────────────────────────────────────────────────

  async getCategories() {
    const res = await fetchWithAuth(`${API_BASE_URL}/api/categories`);
    if (!res.ok) throw new Error('ไม่สามารถโหลดหมวดหมู่ได้');
    return res.json();
  },

  async createCategory(data) {
    const res = await fetchWithAuth(`${API_BASE_URL}/api/categories`, {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify(data),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'สร้างหมวดหมู่ไม่สำเร็จ'); }
    return res.json();
  },

  async updateCategory(id, data) {
    const res = await fetchWithAuth(`${API_BASE_URL}/api/categories/${id}`, {
      method : 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify(data),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'แก้ไขหมวดหมู่ไม่สำเร็จ'); }
    return res.json();
  },

  async deleteCategory(id) {
    const res = await fetchWithAuth(`${API_BASE_URL}/api/categories/${id}`, { method: 'DELETE' });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'ลบหมวดหมู่ไม่สำเร็จ'); }
    return res.json();
  },

  // ─── Transactions (now supports pagination + filters) ────────────────────────

  async getTransactions(params = {}) {
    const qs = new URLSearchParams();
    if (params.page)      qs.set('page',      params.page);
    if (params.limit)     qs.set('limit',      params.limit);
    if (params.type && params.type !== 'all') qs.set('type', params.type);
    if (params.accountId && params.accountId !== 'all') qs.set('accountId', params.accountId);
    if (params.startDate) qs.set('startDate', params.startDate);
    if (params.endDate)   qs.set('endDate',   params.endDate);
    if (params.keyword)   qs.set('keyword',   params.keyword);

    const res = await fetchWithAuth(`${API_BASE_URL}/api/transactions?${qs}`);
    if (!res.ok) throw new Error('ไม่สามารถโหลดรายการธุรกรรมได้');
    const result = await res.json();

    // Backward compat: API now returns { data, total, page, limit, pages }
    // If it returns an array (legacy), wrap it
    if (Array.isArray(result)) return result;
    return result;
  },

  async createTransaction(data) {
    const res = await fetchWithAuth(`${API_BASE_URL}/api/transactions`, {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify(data),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'บันทึกรายการไม่สำเร็จ'); }
    return res.json();
  },

  async updateTransaction(id, data) {
    const res = await fetchWithAuth(`${API_BASE_URL}/api/transactions/${id}`, {
      method : 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify(data),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'แก้ไขรายการไม่สำเร็จ'); }
    return res.json();
  },

  async deleteTransaction(id) {
    const res = await fetchWithAuth(`${API_BASE_URL}/api/transactions/${id}`, { method: 'DELETE' });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'ลบรายการไม่สำเร็จ'); }
    return res.json();
  },

  // ─── Upload ─────────────────────────────────────────────────────────────────

  async uploadAttachment(file) {
    const formData = new FormData();
    formData.append('attachment', file);
    const res = await fetchWithAuth(`${API_BASE_URL}/api/upload`, {
      method: 'POST',
      body  : formData,
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'อัปโหลดไฟล์ไม่สำเร็จ'); }
    return res.json();
  },

  // ─── Backup & Restore ───────────────────────────────────────────────────────

  async getBackup() {
    const res = await fetchWithAuth(`${API_BASE_URL}/api/backup`);
    if (!res.ok) throw new Error('ไม่สามารถดาวน์โหลด backup ได้');
    return res.json();
  },

  async restoreBackup(data, mode = 'replace') {
    const res = await fetchWithAuth(`${API_BASE_URL}/api/restore`, {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify({ ...data, importMode: mode }),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'นำเข้า backup ไม่สำเร็จ'); }
    return res.json();
  },

  // ─── Trash ──────────────────────────────────────────────────────────────────

  async getTrash() {
    const res = await fetchWithAuth(`${API_BASE_URL}/api/trash`);
    if (!res.ok) throw new Error('ไม่สามารถโหลด Trash ได้');
    return res.json();
  },

  async restoreFromTrash(type, id) {
    const res = await fetchWithAuth(`${API_BASE_URL}/api/trash/${type}/${id}`, { method: 'POST' });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'กู้คืนไม่สำเร็จ'); }
    return res.json();
  },

  async permanentDelete(type, id) {
    const res = await fetchWithAuth(`${API_BASE_URL}/api/trash/${type}/${id}`, { method: 'DELETE' });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'ลบถาวรไม่สำเร็จ'); }
    return res.json();
  },

  // ─── Admin ──────────────────────────────────────────────────────────────────

  async getAdminStats() {
    const res = await fetchWithAuth(`${API_BASE_URL}/api/admin/stats`);
    if (!res.ok) throw new Error('ไม่สามารถโหลดสถิติได้');
    return res.json();
  },

  async getAuditLogs(limit = 100, offset = 0) {
    const res = await fetchWithAuth(`${API_BASE_URL}/api/admin/audit?limit=${limit}&offset=${offset}`);
    if (!res.ok) throw new Error('ไม่สามารถโหลด audit logs ได้');
    return res.json();
  },

  async getSettings() {
    const res = await fetchWithAuth(`${API_BASE_URL}/api/admin/settings`);
    if (!res.ok) throw new Error('ไม่สามารถโหลดการตั้งค่าได้');
    return res.json();
  },

  async saveSettings(data) {
    const res = await fetchWithAuth(`${API_BASE_URL}/api/admin/settings`, {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify(data),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'บันทึกการตั้งค่าไม่สำเร็จ'); }
    return res.json();
  },

  async getUsers() {
    const res = await fetchWithAuth(`${API_BASE_URL}/api/admin/users`);
    if (!res.ok) throw new Error('ไม่สามารถโหลดรายชื่อผู้ใช้ได้');
    return res.json();
  },

  async createUser(data) {
    const res = await fetchWithAuth(`${API_BASE_URL}/api/admin/users`, {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify(data),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'สร้างผู้ใช้ไม่สำเร็จ'); }
    return res.json();
  },

  async updateUser(id, data) {
    const res = await fetchWithAuth(`${API_BASE_URL}/api/admin/users/${id}`, {
      method : 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify(data),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'อัปเดตผู้ใช้ไม่สำเร็จ'); }
    return res.json();
  },

  async sendMonthlyReport(date) {
    const res = await fetchWithAuth(`${API_BASE_URL}/api/admin/send-monthly-report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date })
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'ส่งรายงานรายเดือนไม่สำเร็จ'); }
    return res.json();
  },
};

window.API = API;

// ─── Status Indicator ─────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  const statusText = document.querySelector('.system-status .status-text');
  const statusIndicator = document.querySelector('.system-status .status-indicator');
  if (statusText) {
    const isCloud = !['localhost', '127.0.0.1'].includes(window.location.hostname)
                 && !window.location.hostname.startsWith('192.168.')
                 && !window.location.hostname.startsWith('10.');
    statusText.innerText = isCloud ? 'Cloudflare D1 Connected' : 'Local Dev Server';
    if (statusIndicator) {
      statusIndicator.style.backgroundColor = isCloud ? 'var(--emerald)' : 'var(--primary)';
    }
  }
});
