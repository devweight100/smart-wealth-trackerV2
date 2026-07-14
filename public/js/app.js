// Smart Wealth Tracker - Main Frontend Logic (public/js/app.js)

// --- Application State ---
const State = {
  transactions: [],
  accounts: [],
  categories: [],
  filters: {
    type: 'all',
    category: 'all',
    account: 'all',
    search: '',
    dateStart: '',
    dateEnd: ''
  },
  pagination: {
    page: 1,
    limit: 10
  },
  uploadedFileUrl: null,
  uploadedFileName: null
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', async () => {
  // Set today's date in header
  updateHeaderDate();

  const token = localStorage.getItem('swt_session_token');
  if (token) {
    try {
      await reloadAppData();
      const loginOverlay = document.getElementById('loginOverlay');
      if (loginOverlay) loginOverlay.classList.add('hidden');
      // Show admin nav if admin
      if (API.isAdmin()) {
        const adminBtn = document.getElementById('btn-nav-admin');
        if (adminBtn) adminBtn.style.display = '';
      }
      // Show username in sidebar
      const user = API.getCurrentUser();
      const usernameEl = document.getElementById('sidebar-username');
      if (usernameEl) usernameEl.textContent = user.username;
    } catch (error) {
      console.error('Session validation failed:', error);
      localStorage.removeItem('swt_session_token');
      const loginOverlay = document.getElementById('loginOverlay');
      if (loginOverlay) loginOverlay.classList.remove('hidden');
    }
  } else {
    // Show login overlay
    const loginOverlay = document.getElementById('loginOverlay');
    if (loginOverlay) {
      loginOverlay.classList.remove('hidden');
    }
  }

  // Setup Event Listeners
  setupEventListeners();

  // Load default transaction form date to today
  document.getElementById('tx-date').value = new Date().toLocaleDateString('sv-SE');
});

// Update header current date display
function updateHeaderDate() {
  const options = { day: 'numeric', month: 'short', year: 'numeric' };
  document.getElementById('header-date').innerText = new Date().toLocaleDateString('th-TH', options);
}

// Reload all data from backend and refresh UI
async function reloadAppData() {
  showLoader();
  try {
    // Parallel fetch for speed — load up to 500 transactions for Dashboard/Charts
    console.log('[SWT] Starting reloadAppData...');
    const [accounts, categories, txResult] = await Promise.all([
      API.getAccounts(),
      API.getCategories(),
      API.getTransactions({ limit: 500, page: 1 })
    ]);

    console.log('[SWT] txResult type:', typeof txResult, Array.isArray(txResult), txResult?.data ? 'has .data' : 'no .data');

    State.accounts     = Array.isArray(accounts)    ? accounts    : [];
    State.categories   = Array.isArray(categories)  ? categories  : [];
    // API returns { data, total, pages, ... } — always extract .data array
    const txData = txResult?.data ?? txResult;
    State.transactions = Array.isArray(txData) ? txData : [];
    State.txTotal      = txResult?.total  ?? State.transactions.length;
    State.txPages      = txResult?.pages  ?? 1;

    console.log('[SWT] State.transactions length:', State.transactions.length, 'isArray:', Array.isArray(State.transactions));

    // Refresh UI Components
    console.log('[SWT] populateFilterDropdowns...');
    populateFilterDropdowns();
    console.log('[SWT] populateFormDropdowns...');
    populateFormDropdowns();
    console.log('[SWT] refreshDashboard...');
    refreshDashboard();
    console.log('[SWT] refreshTransactionsTable...');
    refreshTransactionsTable();
    console.log('[SWT] refreshAccountsList...');
    refreshAccountsList();
    console.log('[SWT] refreshCategoriesLists...');
    refreshCategoriesLists();
    console.log('[SWT] refreshReportsTable...');
    refreshReportsTable();
    console.log('[SWT] Done!');

  } catch (error) {
    console.error('[SWT] ERROR in reloadAppData:', error);
    console.error('[SWT] Stack:', error.stack);
    alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์: ' + error.message);
  } finally {
    hideLoader();
  }
}

// --- Loading Overlay ---
function showLoader() {
  // Lightweight loader visually (handled elegantly by browser speed, can add minor visual cue if needed)
}
function hideLoader() {
  // Dismiss loader
}

// --- UI Refresh Handlers ---

// Populate Dropdowns
function populateFilterDropdowns() {
  // Category filter
  const catFilter = document.getElementById('filter-category');
  const currentVal = catFilter.value;
  catFilter.innerHTML = '<option value="all">ทั้งหมด</option>';
  
  // Sort categories alphabetically
  const sortedCats = [...State.categories].sort((a, b) => a.name.localeCompare(b.name));
  sortedCats.forEach(cat => {
    const typeLabel = cat.type === 'income' ? 'รายรับ' : 'รายจ่าย';
    catFilter.innerHTML += `<option value="${cat.name}">${cat.name} (${typeLabel})</option>`;
  });
  catFilter.value = currentVal || 'all';

  // Account filter
  const accFilter = document.getElementById('filter-account');
  const currentAccVal = accFilter.value;
  accFilter.innerHTML = '<option value="all">ทั้งหมด</option>';
  State.accounts.forEach(acc => {
    accFilter.innerHTML += `<option value="${acc.id}">${acc.name}</option>`;
  });
  accFilter.value = currentAccVal || 'all';
}

function populateFormDropdowns() {
  // Populate accounts based on selected payment method
  updateTransactionFormAccounts();

  // Populate categories based on transaction type (income / expense) in form
  updateTransactionFormCategories();
}

function updateTransactionFormCategories() {
  let txType = document.getElementById('tx-type').value;
  if (txType === 'future') txType = 'expense';
  const txCatSelect = document.getElementById('tx-category');
  txCatSelect.innerHTML = '';
  
  const filteredCats = State.categories
    .filter(cat => cat.type === txType)
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0) || a.name.localeCompare(b.name, 'th'));
  filteredCats.forEach(cat => {
    txCatSelect.innerHTML += `<option value="${cat.name}">${cat.name}</option>`;
  });
}

function updateTransactionFormAccounts() {
  const method = document.getElementById('tx-payment-method').value;
  const txAccSelect = document.getElementById('tx-account');
  const currentVal = txAccSelect.value;
  
  txAccSelect.innerHTML = '';
  
  let filteredAccounts = State.accounts;
  if (method === 'Transfer') {
    // Remove cash accounts
    filteredAccounts = State.accounts.filter(acc => acc.type !== 'cash' && acc.id !== 'acc-cash');
    txAccSelect.disabled = false;
    document.getElementById('group-tx-account').style.opacity = '1';
  } else {
    // Cash method
    txAccSelect.disabled = true;
    document.getElementById('group-tx-account').style.opacity = '0.5';
    filteredAccounts = State.accounts.filter(acc => acc.type === 'cash' || acc.id === 'acc-cash');
  }
  
  filteredAccounts.forEach(acc => {
    txAccSelect.innerHTML += `<option value="${acc.id}">${acc.name}</option>`;
  });
  
  // Set value
  if (method === 'Cash') {
    txAccSelect.value = 'acc-cash';
  } else if (filteredAccounts.some(acc => acc.id === currentVal)) {
    txAccSelect.value = currentVal;
  } else {
    if (filteredAccounts.length > 0) {
      txAccSelect.value = filteredAccounts[0].id;
    }
  }
}

function populateTransferAccountSelects() {
  const txAccSelect = document.getElementById('tx-account');
  const txToAccSelect = document.getElementById('tx-to-account');
  
  if (!txAccSelect || !txToAccSelect) return;
  
  const currentVal = txAccSelect.value;
  const currentToVal = txToAccSelect.value;
  
  txAccSelect.innerHTML = '';
  txToAccSelect.innerHTML = '';
  
  txAccSelect.disabled = false;
  txToAccSelect.disabled = false;
  
  const groupAcc = document.getElementById('group-tx-account');
  const groupToAcc = document.getElementById('group-tx-to-account');
  if (groupAcc) groupAcc.style.opacity = '1';
  if (groupToAcc) groupToAcc.style.opacity = '1';

  State.accounts.forEach(acc => {
    txAccSelect.innerHTML += `<option value="${acc.id}">${acc.name}</option>`;
    txToAccSelect.innerHTML += `<option value="${acc.id}">${acc.name}</option>`;
  });
  
  if (State.accounts.some(acc => acc.id === currentVal)) {
    txAccSelect.value = currentVal;
  } else if (State.accounts.length > 0) {
    txAccSelect.value = State.accounts[0].id;
  }
  
  if (State.accounts.some(acc => acc.id === currentToVal)) {
    txToAccSelect.value = currentToVal;
  } else if (State.accounts.length > 1) {
    txToAccSelect.value = State.accounts[1].id;
  } else if (State.accounts.length > 0) {
    txToAccSelect.value = State.accounts[0].id;
  }
}

function refreshDashboard() {
  const todayStr = new Date().toLocaleDateString('sv-SE');
  // Guard: ensure transactions is always an array
  const txList = Array.isArray(State.transactions) ? State.transactions : [];

  // Recalculate Dashboard Stats
  const totalBalance = State.accounts.reduce((sum, acc) => sum + Number(acc.balance || 0), 0);
  
  const pastAndPresentTx = txList.filter(t => t.date <= todayStr);
  
  // Realized income/expenses this month
  const currentMonthKey = todayStr.slice(0, 7); // 'YYYY-MM'
  const totalIncomeThisMonth = pastAndPresentTx
    .filter(t => t.type === 'income' && t.date.slice(0, 7) === currentMonthKey)
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const totalExpenseThisMonth = pastAndPresentTx
    .filter(t => (t.type === 'expense' || (t.type === 'future' && t.status === 'paid')) && t.date.slice(0, 7) === currentMonthKey)
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  // Total pending/unpaid future expenses (future date >= today, status !== 'paid')
  const totalFutureExpense = txList
    .filter(t => t.type === 'future' && t.status !== 'paid' && t.date >= todayStr)
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  // Total overdue unpaid expenses (future date < today, status !== 'paid')
  const overdueTx = txList
    .filter(t => t.type === 'future' && t.status !== 'paid' && t.date < todayStr);
  const totalOverdue = overdueTx.reduce((sum, t) => sum + Number(t.amount || 0), 0);

  // Update Stats Cards
  document.querySelector('#metric-total-wealth .metric-value').innerText = formatCurrency(totalBalance);
  document.querySelector('#metric-total-income .metric-value').innerText = formatCurrency(totalIncomeThisMonth);
  document.querySelector('#metric-total-expense .metric-value').innerText = formatCurrency(totalExpenseThisMonth);
  document.querySelector('#metric-future-expense .metric-value').innerText = formatCurrency(totalFutureExpense);
  
  document.querySelector('#metric-overdue-expense .metric-value').innerText = formatCurrency(totalOverdue);
  document.getElementById('overdue-count').innerText = `เกินกำหนด ${overdueTx.length} รายการ`;

  const monthLabelOptions = { month: 'long' };
  const currentMonthTh = new Date().toLocaleDateString('th-TH', monthLabelOptions);
  document.getElementById('income-month-name').innerText = `สะสมเฉพาะเดือน${currentMonthTh}`;
  document.getElementById('expense-month-name').innerText = `สะสมเฉพาะเดือน${currentMonthTh}`;

  // Upcoming Alerts Container logic (Today & Next 7 Days)
  const alertsContainer = document.getElementById('upcoming-alerts-container');
  alertsContainer.innerHTML = '';

  const sevenDaysLater = new Date();
  sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
  const sevenDaysLaterStr = sevenDaysLater.toLocaleDateString('sv-SE');

  // Filter future expenses for today and next 7 days (ONLY type === 'future' and status !== 'paid')
  const todayExpenses        = txList.filter(t => t.type === 'future' && t.status !== 'paid' && t.date === todayStr);
  const upcoming7DaysExpenses = txList.filter(t => t.type === 'future' && t.status !== 'paid' && t.date > todayStr && t.date <= sevenDaysLaterStr);

  if (todayExpenses.length > 0 || upcoming7DaysExpenses.length > 0) {
    let alertsHtml = '<div class="upcoming-alert-container">';
    
    // 1. Group today's scheduled expenses
    if (todayExpenses.length > 0) {
      const todayTotal = todayExpenses.reduce((sum, t) => sum + Number(t.amount || 0), 0);
      alertsHtml += `
        <div class="upcoming-alert alert-danger" style="cursor: pointer;" onclick="openFutureDetailsModal()">
          <i class="fa-solid fa-triangle-exclamation upcoming-alert-icon"></i>
          <div class="upcoming-alert-info">
            <div class="upcoming-alert-text">
              <span class="upcoming-alert-title">ครบกำหนดจ่ายล่วงหน้าวันนี้! (ยอดรวมทั้งหมด)</span>
              <span class="upcoming-alert-desc">มีทั้งหมด ${todayExpenses.length} รายการที่ต้องชำระในวันนี้</span>
            </div>
            <span class="upcoming-alert-value">-${formatCurrency(todayTotal)}</span>
          </div>
        </div>`;
    }

    // 2. Render 7 days ahead
    upcoming7DaysExpenses.forEach(t => {
      const dateTh = formatDateThShort(t.date);
      alertsHtml += `
        <div class="upcoming-alert alert-warning">
          <i class="fa-regular fa-bell upcoming-alert-icon"></i>
          <div class="upcoming-alert-info">
            <div class="upcoming-alert-text">
              <span class="upcoming-alert-title">รายจ่ายล่วงหน้ากำลังจะถึง (กำหนดจ่าย: ${dateTh})</span>
              <span class="upcoming-alert-desc">${t.notes || t.category} (${t.category})</span>
            </div>
            <span class="upcoming-alert-value">-${formatCurrency(t.amount)}</span>
          </div>
        </div>`;
    });

    alertsHtml += '</div>';
    alertsContainer.innerHTML = alertsHtml;
  }

  // Update Dynamic Charts
  Charts.renderDashboardCharts(txList, State.accounts);

  // Update Dashboard Quick Lists
  // A. Upcoming Expenses List
  const upcomingList = document.getElementById('upcoming-expenses-list');
  upcomingList.innerHTML = '';
  
  // Sort future expenses ascending (soonest first, unpaid only)
  const upcomingTx = txList
    .filter(t => t.type === 'future' && t.status !== 'paid' && t.date > todayStr)
    .sort((a, b) => a.date.localeCompare(b.date));
  
  document.getElementById('upcoming-count').innerText = `${upcomingTx.length} รายการ`;
  
  if (upcomingTx.length === 0) {
    upcomingList.innerHTML = `
      <div class="empty-state">
        <i class="fa-regular fa-calendar-check empty-icon text-slate"></i>
        <p class="empty-text">ไม่มีรายการใช้จ่ายล่วงหน้า</p>
      </div>`;
  } else {
    upcomingTx.forEach(t => {
      const acc = State.accounts.find(a => a.id === t.accountId);
      const dateTh = formatDateThShort(t.date);
      
      upcomingList.innerHTML += `
        <div class="upcoming-item">
          <div class="upcoming-left">
            <span class="upcoming-date"><i class="fa-solid fa-clock"></i> ${dateTh}</span>
            <span class="upcoming-title">${t.notes || t.category}</span>
            <span class="upcoming-cat">หมวดหมู่: ${t.category}</span>
          </div>
          <div class="upcoming-right">
            <span class="upcoming-amount">-${formatCurrency(t.amount)}</span>
            <span class="badge badge-slate" style="font-size:0.65rem;">${acc ? acc.name : '-'}</span>
          </div>
        </div>`;
    });
  }

  // B. Accounts Quick List
  const quickAccountsList = document.getElementById('dashboard-accounts-list');
  quickAccountsList.innerHTML = '';
  
  State.accounts.forEach(acc => {
    const isCash = acc.type === 'cash';
    const iconClass = isCash ? 'fa-solid fa-wallet' : 'fa-solid fa-building-columns';
    const bgClass = isCash ? 'bg-cash text-white' : getBankColorClass(acc.bankName);
    
    quickAccountsList.innerHTML += `
      <div class="quick-acc-item">
        <div class="quick-acc-left">
          <div class="quick-acc-icon ${bgClass}">
            <i class="${iconClass}"></i>
          </div>
          <div class="quick-acc-info">
            <span class="quick-acc-name">${acc.name}</span>
            <span class="quick-acc-num">${isCash ? 'เงินสดสำรอง' : `${acc.bankName} • ${acc.accountNumber}`}</span>
          </div>
        </div>
        <span class="quick-acc-val">${formatCurrency(acc.balance)}</span>
      </div>`;
  });
}

// Get CSS class based on bank name for background styling
function getBankColorClass(bankName) {
  if (bankName === 'กสิกรไทย') return 'bg-kbank';
  if (bankName === 'ไทยพาณิชย์') return 'bg-scb';
  if (bankName === 'กรุงเทพ') return 'bg-bbl';
  if (bankName === 'กรุงไทย') return 'bg-ktb';
  if (bankName === 'กรุงศรีอยุธยา') return 'bg-bay';
  if (bankName === 'ทหารไทยธนชาต') return 'bg-ttb';
  if (bankName === 'ออมสิน') return 'bg-gsb';
  return 'bg-other-bank';
}

// 2. TRANSACTIONS TABLE REFRESH (WITH FILTERS & PAGINATION)
function refreshTransactionsTable() {
  const tbody = document.getElementById('transactions-table-body');
  tbody.innerHTML = '';

  const todayStr = new Date().toLocaleDateString('sv-SE');

  // Filter transactions (guard against non-array)
  const txList = Array.isArray(State.transactions) ? State.transactions : [];
  let filtered = txList.filter(t => {
    // Type filter
    if (State.filters.type === 'income' && t.type !== 'income') return false;
    if (State.filters.type === 'expense' && t.type !== 'expense') return false;
    if (State.filters.type === 'future' && t.type !== 'future') return false;
    if (State.filters.type === 'transfer' && t.type !== 'transfer_out' && t.type !== 'transfer_in') return false;

    // Category filter
    if (State.filters.category !== 'all' && t.category !== State.filters.category) return false;

    // Account filter
    if (State.filters.account !== 'all' && t.accountId !== State.filters.account) return false;

    // Filter out transfer_in to avoid duplicate rows when displaying all accounts
    if (State.filters.account === 'all' && t.type === 'transfer_in') return false;

    // Date filters
    if (State.filters.dateStart && t.date < State.filters.dateStart) return false;
    if (State.filters.dateEnd && t.date > State.filters.dateEnd) return false;

    // Search query (guard null fields)
    if (State.filters.search) {
      const q = State.filters.search.toLowerCase();
      const categoryMatch = (t.category || '').toLowerCase().includes(q);
      const notesMatch    = (t.notes    || '').toLowerCase().includes(q);
      const amountMatch   = String(t.amount || '').includes(q);
      
      const acc = State.accounts.find(a => a.id === t.accountId);
      const accountMatch = acc ? acc.name.toLowerCase().includes(q) : false;

      if (!categoryMatch && !notesMatch && !amountMatch && !accountMatch) return false;
    }

    return true;
  });

  const totalEntries = filtered.length;
  
  // Handle Pagination
  const limit = State.pagination.limit;
  const totalPages = Math.max(1, Math.ceil(totalEntries / limit));
  
  if (State.pagination.page > totalPages) {
    State.pagination.page = totalPages;
  }
  
  const startIndex = (State.pagination.page - 1) * limit;
  const endIndex = Math.min(startIndex + limit, totalEntries);
  
  const paginatedData = filtered.slice(startIndex, endIndex);

  // Render Table Entries Info
  document.getElementById('table-entries-info').innerText = 
    totalEntries > 0 
      ? `แสดง ${startIndex + 1} ถึง ${endIndex} จากทั้งหมด ${totalEntries} รายการ` 
      : 'แสดง 0 ถึง 0 จากทั้งหมด 0 รายการ';

  // Render Pagination buttons
  renderPaginationControls(totalPages);

  if (paginatedData.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="text-center py-12 text-slate">
          <i class="fa-regular fa-folder-open text-3xl mb-3 block text-slate-400"></i>
          ไม่พบรายการธุรกรรมตามตัวกรองที่เลือก
        </td>
      </tr>`;
    return;
  }

  // Draw Rows
  const today = new Date();
  today.setHours(0,0,0,0);

  paginatedData.forEach(t => {
    const acc = State.accounts.find(a => a.id === t.accountId);
    const isIncome = t.type === 'income';
    const isFutureType = t.type === 'future';
    const isTransferOut = t.type === 'transfer_out';
    const isTransferIn = t.type === 'transfer_in';
    
    // Amount class
    let amountClass = 'text-amount-exp';
    let amountPrefix = '-฿';
    let amountStyle = '';
    if (isIncome) {
      amountClass = 'text-amount-inc';
      amountPrefix = '+฿';
    } else if (isFutureType) {
      amountClass = 'text-amount-future';
    } else if (isTransferOut) {
      amountClass = 'text-slate';
      amountPrefix = '-฿';
      amountStyle = 'style="font-weight: 800; color: #64748b;"';
    } else if (isTransferIn) {
      amountClass = 'text-slate';
      amountPrefix = '+฿';
      amountStyle = 'style="font-weight: 800; color: #64748b;"';
    }

    // Attachment btn
    let attachmentBtn = '';
    if (t.slipUrl) {
      const ext = t.slipUrl.split('.').pop().toLowerCase();
      const icon = ext === 'pdf' ? 'fa-regular fa-file-pdf text-rose' : 'fa-regular fa-image text-indigo';
      attachmentBtn = `<button class="btn-table-attachment" onclick="previewAttachment('${t.slipUrl}')"><i class="${icon}"></i> ดูไฟล์</button>`;
    } else {
      attachmentBtn = `<button class="btn-table-attachment no-attachment" disabled><i class="fa-solid fa-ban"></i> ไม่มี</button>`;
    }

    // Calculate urgency row styling for unpaid prepaid expenses
    let rowUrgencyClass = '';
    if (t.type === 'future' && t.status !== 'paid') {
      const parts = t.date.split('-');
      if (parts.length === 3) {
        const txDate = new Date(parts[0], parts[1] - 1, parts[2]);
        txDate.setHours(0,0,0,0);
        const diffTime = txDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) {
          rowUrgencyClass = 'row-future-overdue';
        } else if (diffDays === 0) {
          rowUrgencyClass = 'row-future-today';
        } else if (diffDays > 0 && diffDays <= 3) {
          rowUrgencyClass = 'row-future-3days';
        } else if (diffDays > 3 && diffDays <= 7) {
          rowUrgencyClass = 'row-future-7days';
        }
      }
    }

    // Type Badge & Status rendering
    let typeCellContent = '';
    if (isIncome) {
      typeCellContent = '<span class="badge badge-emerald"><i class="fa-solid fa-circle-chevron-down mr-1"></i> รายรับ</span>';
    } else if (isFutureType) {
      let statusText = '';
      if (t.status === 'paid') {
        statusText = '<span class="badge badge-emerald" style="margin-left:0.25rem;"><i class="fa-solid fa-check mr-1"></i> ชำระแล้ว</span>';
      } else if (t.date < todayStr) {
        statusText = '<span class="badge badge-rose" style="margin-left:0.25rem; border:1.5px solid var(--amber);"><i class="fa-solid fa-triangle-exclamation mr-1"></i> เกินกำหนด</span>';
      } else {
        statusText = '<span class="badge badge-slate" style="margin-left:0.25rem;"><i class="fa-regular fa-clock mr-1"></i> ค้างชำระ</span>';
      }
      typeCellContent = `<span class="badge badge-amber"><i class="fa-regular fa-clock mr-1"></i> จ่ายล่วงหน้า</span> ${statusText}`;
    } else if (isTransferOut || isTransferIn) {
      typeCellContent = '<span class="badge badge-indigo" style="background-color: var(--primary-light); color: var(--primary); border: 1px solid rgba(79,70,229,0.15);"><i class="fa-solid fa-money-bill-transfer mr-1"></i> ย้ายเงิน</span>';
    } else {
      typeCellContent = '<span class="badge badge-rose"><i class="fa-solid fa-circle-chevron-up mr-1"></i> รายจ่าย</span>';
    }

    let quickPayBtn = '';
    if (t.type === 'future' && t.status !== 'paid') {
      quickPayBtn = `
        <button class="btn-quick-pay" onclick="markAsPaid('${t.id}')" title="ชำระเงินแล้ว">
          <i class="fa-solid fa-check mr-1"></i> ชำระแล้ว
        </button>`;
    }

    let detailHTML = `<div class="table-text-main">${t.notes || '-'}</div>`;
    let accountCellHTML = `<div class="table-text-main">${acc ? acc.name : 'ไม่ระบุ/ถูกลบ'}</div>
                           <div class="table-text-sub">${acc && acc.type === 'bank' ? `${acc.bankName}` : '-'}</div>`;

    if (isTransferOut || isTransferIn) {
      const otherTx = (Array.isArray(State.transactions) ? State.transactions : []).find(tx => tx.id === t.transferTxId);
      let fromAccId = isTransferOut ? t.accountId : (otherTx ? otherTx.accountId : '');
      let toAccId = isTransferIn ? t.accountId : (otherTx ? otherTx.accountId : '');
      
      const fromAcc = State.accounts.find(a => a.id === fromAccId);
      const toAcc = State.accounts.find(a => a.id === toAccId);
      const fromName = fromAcc ? fromAcc.name : 'ไม่ระบุ';
      const toName = toAcc ? toAcc.name : 'ไม่ระบุ';
      
      detailHTML = `<div class="table-text-main" style="color: var(--primary); font-weight: 600;">
                      <i class="fa-solid fa-right-long mr-1"></i> ย้ายเงิน: ${fromName} ➔ ${toName}
                    </div>
                    <div class="table-text-sub" style="font-style: italic;">
                      ${t.notes ? `หมายเหตุ: ${t.notes}` : 'ไม่มีหมายเหตุเพิ่มเติม'}
                    </div>`;
                    
      accountCellHTML = `<div class="table-text-main">${fromName} ➔ ${toName}</div>
                         <div class="table-text-sub">ย้ายเงินระหว่างบัญชี</div>`;
    }

    tbody.innerHTML += `
      <tr class="${rowUrgencyClass}">
        <td class="table-text-main">${formatDateThShort(t.date)}</td>
        <td>
          ${typeCellContent}
        </td>
        <td class="table-text-main">${t.category}</td>
        <td>
          ${detailHTML}
          ${t.type === 'future' ? '<div class="table-text-sub text-amber-hover"><i class="fa-regular fa-hourglass-half"></i> ตั้งจ่ายล่วงหน้า</div>' : ''}
        </td>
        <td>
          <span class="badge badge-slate">${t.paymentMethod === 'Cash' ? 'เงินสด' : 'เงินโอน'}</span>
        </td>
        <td>
          ${accountCellHTML}
        </td>
        <td class="${amountClass} text-right text-base" ${amountStyle}>${amountPrefix}${formatCurrencyNumber(t.amount)}</td>
        <td class="text-center">${attachmentBtn}</td>
        <td class="text-center">
          <div style="display:flex; justify-content:center; gap:0.25rem; align-items:center;">
            ${quickPayBtn}
            <button class="btn-table-action" onclick="openEditTransactionModal('${t.id}')" title="แก้ไขรายการ">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button class="btn-table-action action-delete" onclick="deleteTransaction('${t.id}')" title="ลบรายการ">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </td>
      </tr>`;
  });
}

function renderPaginationControls(totalPages) {
  const pagDiv = document.getElementById('table-pagination');
  pagDiv.innerHTML = '';

  const currentPage = State.pagination.page;

  // Previous btn
  const prevBtn = document.createElement('button');
  prevBtn.className = 'pagination-btn';
  prevBtn.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';
  prevBtn.disabled = currentPage === 1;
  prevBtn.onclick = () => {
    if (State.pagination.page > 1) {
      State.pagination.page--;
      refreshTransactionsTable();
    }
  };
  pagDiv.appendChild(prevBtn);

  // Determine pages range to show
  const range = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) {
      range.push(i);
    }
  } else {
    range.push(1);

    let start = Math.max(2, currentPage - 1);
    let end = Math.min(totalPages - 1, currentPage + 1);

    if (currentPage <= 4) {
      end = 5;
    } else if (currentPage >= totalPages - 3) {
      start = totalPages - 4;
    }

    if (start > 2) {
      range.push('...');
    }

    for (let i = start; i <= end; i++) {
      range.push(i);
    }

    if (end < totalPages - 1) {
      range.push('...');
    }

    range.push(totalPages);
  }

  // Numeric buttons & ellipses
  range.forEach(item => {
    if (item === '...') {
      const span = document.createElement('span');
      span.className = 'pagination-ellipsis';
      span.innerText = '...';
      span.style.width = '32px';
      span.style.height = '32px';
      span.style.display = 'inline-flex';
      span.style.alignItems = 'center';
      span.style.justifyContent = 'center';
      span.style.color = 'var(--text-helper)';
      span.style.fontWeight = '600';
      pagDiv.appendChild(span);
    } else {
      const btn = document.createElement('button');
      btn.className = `pagination-btn ${item === currentPage ? 'active' : ''}`;
      btn.innerText = item;
      btn.onclick = () => {
        State.pagination.page = item;
        refreshTransactionsTable();
      };
      pagDiv.appendChild(btn);
    }
  });

  // Next btn
  const nextBtn = document.createElement('button');
  nextBtn.className = 'pagination-btn';
  nextBtn.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.onclick = () => {
    if (State.pagination.page < totalPages) {
      State.pagination.page++;
      refreshTransactionsTable();
    }
  };
  pagDiv.appendChild(nextBtn);
}

// 3. ACCOUNTS PAGE REFRESH
function refreshAccountsList() {
  const container = document.getElementById('accounts-cards-container');
  container.innerHTML = '';

  document.getElementById('accounts-count').innerText = `${State.accounts.length} บัญชี`;

  State.accounts.forEach(acc => {
    const isCash = acc.type === 'cash';
    const iconClass = isCash ? 'fa-solid fa-wallet' : 'fa-solid fa-building-columns';
    const bgClass = isCash ? 'bg-cash text-white' : getBankColorClass(acc.bankName);
    
    const cardBorderAccentClass = isCash ? 'bank-cash' : `bank-${getBankBrandSlug(acc.bankName)}`;

    // Generate Cards
    container.innerHTML += `
      <div class="bank-card ${cardBorderAccentClass}">
        <div class="bank-card-header">
          <div class="bank-logo-box ${bgClass}">
            <i class="${iconClass}"></i>
          </div>
          <div class="bank-card-actions">
            <button class="btn-table-action" onclick="loadAccountToForm('${acc.id}')" title="แก้ไขบัญชี">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            ${acc.id !== 'acc-cash' ? `
              <button class="btn-table-action action-delete" onclick="deleteAccount('${acc.id}')" title="ลบบัญชี">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            ` : ''}
          </div>
        </div>
        
        <div class="bank-card-info">
          <h4 class="bank-card-name">${acc.name}</h4>
          <span class="bank-card-details">${isCash ? 'เงินสดคงเหลือ' : `${acc.bankName} • เลขบัญชี: ${acc.accountNumber}`}</span>
        </div>

        <div class="bank-card-balance-section">
          <span class="bank-card-lbl">เงินคงเหลือปัจจุบัน</span>
          <h3 class="bank-card-val">${formatCurrency(acc.balance)}</h3>
          <span class="bank-card-initial">ยอดเริ่มต้น: ${formatCurrency(acc.initialBalance)}</span>
        </div>
      </div>`;
  });
}

function getBankBrandSlug(bankName) {
  if (bankName === 'กสิกรไทย') return 'kbank';
  if (bankName === 'ไทยพาณิชย์') return 'scb';
  if (bankName === 'กรุงเทพ') return 'bbl';
  if (bankName === 'กรุงไทย') return 'ktb';
  if (bankName === 'กรุงศรีอยุธยา') return 'bay';
  if (bankName === 'ทหารไทยธนชาต') return 'ttb';
  if (bankName === 'ออมสิน') return 'gsb';
  return 'other';
}

// 4. CATEGORIES TAB REFRESH
function refreshCategoriesLists() {
  const incList = document.getElementById('income-categories-list');
  const expList = document.getElementById('expense-categories-list');
  
  incList.innerHTML = '';
  expList.innerHTML = '';

  const incomeCats = State.categories.filter(c => c.type === 'income');
  const expenseCats = State.categories.filter(c => c.type === 'expense');

  document.getElementById('income-categories-count').innerText = incomeCats.length;
  document.getElementById('expense-categories-count').innerText = expenseCats.length;

  // Render Income Categories
  incomeCats.forEach(cat => {
    const editBtn = `<button class="btn-table-action" onclick="loadCategoryToForm('${cat.id}')" title="แก้ไขหมวดหมู่"><i class="fa-solid fa-pen-to-square"></i></button>`;
    const deleteBtn = `<button class="btn-table-action action-delete" onclick="deleteCategory('${cat.id}')" title="ลบหมวดหมู่"><i class="fa-solid fa-trash-can"></i></button>`;

    incList.innerHTML += `
      <div class="category-list-item">
        <span class="category-item-text">
          <i class="fa-solid fa-circle-arrow-down text-emerald"></i> ${cat.name}
        </span>
        <div class="category-item-actions" style="display: flex; gap: 0.25rem;">
          ${editBtn}
          ${deleteBtn}
        </div>
      </div>`;
  });

  // Render Expense Categories
  expenseCats.forEach(cat => {
    const editBtn = `<button class="btn-table-action" onclick="loadCategoryToForm('${cat.id}')" title="แก้ไขหมวดหมู่"><i class="fa-solid fa-pen-to-square"></i></button>`;
    const deleteBtn = `<button class="btn-table-action action-delete" onclick="deleteCategory('${cat.id}')" title="ลบหมวดหมู่"><i class="fa-solid fa-trash-can"></i></button>`;

    expList.innerHTML += `
      <div class="category-list-item">
        <span class="category-item-text">
          <i class="fa-solid fa-circle-arrow-up text-rose"></i> ${cat.name}
        </span>
        <div class="category-item-actions" style="display: flex; gap: 0.25rem;">
          ${editBtn}
          ${deleteBtn}
        </div>
      </div>`;
  });
}

// 5. REPORTS TAB DATA REFRESH
function refreshReportsTable() {
  const tbody = document.getElementById('reports-summary-body');
  tbody.innerHTML = '';

  const todayStr = new Date().toLocaleDateString('sv-SE');

  // Filter transactions (guard against non-array)
  const txList2 = Array.isArray(State.transactions) ? State.transactions : [];
  let filtered = txList2.filter(t => {
    if (State.filters.type === 'income' && t.type !== 'income') return false;
    if (State.filters.type === 'expense' && t.type !== 'expense') return false;
    if (State.filters.type === 'future' && t.type !== 'future') return false;

    if (State.filters.category !== 'all' && t.category !== State.filters.category) return false;
    if (State.filters.account !== 'all' && t.accountId !== State.filters.account) return false;

    if (State.filters.dateStart && t.date < State.filters.dateStart) return false;
    if (State.filters.dateEnd && t.date > State.filters.dateEnd) return false;

    return true;
  });

  // Calculate scope stats
  const totalIncome = filtered
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const totalExpense = filtered
    .filter(t => t.type === 'expense' || t.type === 'future')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const netBalance = totalIncome - totalExpense;

  document.getElementById('report-scope-income').innerText = formatCurrency(totalIncome);
  document.getElementById('report-scope-expense').innerText = formatCurrency(totalExpense);
  
  const netEl = document.getElementById('report-scope-net');
  netEl.innerText = formatCurrency(netBalance);
  if (netBalance >= 0) {
    netEl.className = 'stat-mini-val text-emerald';
  } else {
    netEl.className = 'stat-mini-val text-rose';
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center py-12 text-slate">
          ไม่มีรายการตามช่วงเวลาที่กรอง กรุณาตั้งค่าตัวกรองในแถบ บันทึกรายรับ-รายจ่าย
        </td>
      </tr>`;
    return;
  }

  // Draw max 50 rows in mini table
  const showData = filtered.slice(0, 50);

  showData.forEach(t => {
    const acc = State.accounts.find(a => a.id === t.accountId);
    
    tbody.innerHTML += `
      <tr>
        <td>${formatDateThShort(t.date)}</td>
        <td>
          ${t.type === 'income' 
            ? '<span class="badge badge-emerald">รายรับ</span>' 
            : t.type === 'future'
              ? '<span class="badge badge-amber">จ่ายล่วงหน้า</span>'
              : '<span class="badge badge-rose">รายจ่าย</span>'}
        </td>
        <td class="table-text-main">${t.category}</td>
        <td>${acc ? acc.name : 'ไม่ระบุ'}</td>
        <td>${t.notes || '-'}</td>
        <td class="${t.type === 'income' ? 'text-amount-inc' : t.type === 'future' ? 'text-amount-future' : 'text-amount-exp'} text-right">
          ${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)}
        </td>
      </tr>`;
  });
}

// --- Event Listeners and Setup ---
function setupEventListeners() {
  // 1. Sidebar Tab Switching Navigation
  const navButtons = document.querySelectorAll('.sidebar-nav .nav-btn');
  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetView = btn.getAttribute('data-target');
      
      // Update sidebar buttons active state
      navButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Update header title (Translate Dashboard to English)
      let viewTitle = btn.querySelector('span').innerText;
      if (targetView === 'dashboard') {
        viewTitle = 'Dashboard';
      }
      document.getElementById('pageTitle').innerText = viewTitle;

      // Update active view
      const views = document.querySelectorAll('.app-viewport .tab-view');
      views.forEach(v => v.classList.remove('active'));
      document.getElementById(`view-${targetView}`).classList.add('active');

      // Close mobile sidebar if open
      document.getElementById('appSidebar').classList.remove('active');
      const overlay = document.getElementById('sidebarOverlay');
      if (overlay) overlay.classList.remove('active');
    });
  });

  // Sidebar Toggle (Mobile & Desktop)
  document.getElementById('sidebarToggle').addEventListener('click', (e) => {
    e.stopPropagation();
    if (window.innerWidth > 768) {
      document.querySelector('.app-container').classList.toggle('sidebar-collapsed');
    } else {
      document.getElementById('appSidebar').classList.add('active');
      const overlay = document.getElementById('sidebarOverlay');
      if (overlay) overlay.classList.add('active');
    }
  });

  // Close Mobile sidebar when clicking overlay
  const overlay = document.getElementById('sidebarOverlay');
  if (overlay) {
    overlay.addEventListener('click', () => {
      document.getElementById('appSidebar').classList.remove('active');
      overlay.classList.remove('active');
    });
  }

  // Close Mobile sidebar when clicking the X close button
  const closeBtn = document.getElementById('sidebarCloseBtn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      document.getElementById('appSidebar').classList.remove('active');
      const overlay = document.getElementById('sidebarOverlay');
      if (overlay) overlay.classList.remove('active');
    });
  }  // 2. Quick Action Buttons
  document.getElementById('btn-quick-transaction').addEventListener('click', () => {
    openCreateTransactionModal();
  });
  
  document.getElementById('btn-quick-add-account').addEventListener('click', () => {
    // Go to Accounts view and focus on Account Form
    document.getElementById('btn-nav-accounts').click();
    document.getElementById('account-name').focus();
  });

  // 3. Transactions Filters Handlers
  document.getElementById('tx-search').addEventListener('input', (e) => {
    State.filters.search = e.target.value;
    State.pagination.page = 1;
    refreshTransactionsTable();
    refreshReportsTable();
  });

  document.getElementById('filter-type').addEventListener('change', (e) => {
    State.filters.type = e.target.value;
    State.pagination.page = 1;
    refreshTransactionsTable();
    refreshReportsTable();
  });

  document.getElementById('filter-category').addEventListener('change', (e) => {
    State.filters.category = e.target.value;
    State.pagination.page = 1;
    refreshTransactionsTable();
    refreshReportsTable();
  });

  document.getElementById('filter-account').addEventListener('change', (e) => {
    State.filters.account = e.target.value;
    State.pagination.page = 1;
    refreshTransactionsTable();
    refreshReportsTable();
  });

  document.getElementById('filter-date-start').addEventListener('change', (e) => {
    State.filters.dateStart = e.target.value;
    State.pagination.page = 1;
    refreshTransactionsTable();
    refreshReportsTable();
  });

  document.getElementById('filter-date-end').addEventListener('change', (e) => {
    State.filters.dateEnd = e.target.value;
    State.pagination.page = 1;
    refreshTransactionsTable();
    refreshReportsTable();
  });

  document.getElementById('btn-reset-filters').addEventListener('click', () => {
    document.getElementById('tx-search').value = '';
    document.getElementById('filter-type').value = 'all';
    document.getElementById('filter-category').value = 'all';
    document.getElementById('filter-account').value = 'all';
    document.getElementById('filter-date-start').value = '';
    document.getElementById('filter-date-end').value = '';

    State.filters = {
      type: 'all',
      category: 'all',
      account: 'all',
      search: '',
      dateStart: '',
      dateEnd: ''
    };
    State.pagination.page = 1;
    refreshTransactionsTable();
    refreshReportsTable();
  });

  // 4. Modal Triggers
  document.getElementById('btn-close-tx-modal').addEventListener('click', closeTransactionModal);
  document.getElementById('btn-cancel-tx-modal').addEventListener('click', closeTransactionModal);
  
  // Transaction Type Blocks logic
  const typeButtons = document.querySelectorAll('.transaction-type-blocks .type-block-btn');
  typeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      typeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const selectedType = btn.getAttribute('data-type');
      document.getElementById('tx-type').value = selectedType;
      handleTypeChange(selectedType);
    });
  });

  // Handle Payment Method changing account field in form (Interactive!)
  document.getElementById('tx-payment-method').addEventListener('change', () => {
    updateTransactionFormAccounts();
  });

  // Close modal when clicking on backdrop (main window background)
  document.getElementById('modal-transaction').addEventListener('click', (e) => {
    if (e.target === document.getElementById('modal-transaction')) {
      closeTransactionModal();
    }
  });

  document.getElementById('modal-preview-attachment').addEventListener('click', (e) => {
    if (e.target === document.getElementById('modal-preview-attachment')) {
      closePreviewModal();
    }
  });

  // --- 5. DRAG & DROP ATTACHMENT FILE UPLOAD ---
  const dropZone = document.getElementById('attachment-upload-zone');
  const fileInput = document.getElementById('tx-attachment-input');

  dropZone.addEventListener('click', () => fileInput.click());

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'var(--primary)';
    dropZone.style.backgroundColor = 'var(--primary-light-soft)';
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.style.borderColor = 'var(--border-color)';
    dropZone.style.backgroundColor = 'var(--bg-app)';
  });

  dropZone.addEventListener('drop', async (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'var(--border-color)';
    dropZone.style.backgroundColor = 'var(--bg-app)';

    if (e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      await handleAttachmentUpload(file);
    }
  });

  fileInput.addEventListener('change', async () => {
    if (fileInput.files.length > 0) {
      const file = fileInput.files[0];
      await handleAttachmentUpload(file);
    }
  });

  document.getElementById('btn-remove-attachment').addEventListener('click', removeUploadedAttachment);

  // 6. Submit Transaction Form
  document.getElementById('transaction-form').addEventListener('submit', handleTransactionSubmit);

  // 7. Accounts Form Logic & CRUD
  const accTypeSelect = document.getElementById('account-type');
  accTypeSelect.addEventListener('change', () => {
    const isBank = accTypeSelect.value === 'bank';
    document.getElementById('group-bank-name').style.display = isBank ? 'flex' : 'none';
    document.getElementById('group-account-number').style.display = isBank ? 'flex' : 'none';
  });

  document.getElementById('account-form').addEventListener('submit', handleAccountSubmit);
  document.getElementById('btn-cancel-account').addEventListener('click', resetAccountForm);

  // 8. Categories Form Logic & CRUD
  document.getElementById('category-form').addEventListener('submit', handleCategorySubmit);
  document.getElementById('btn-cancel-category').addEventListener('click', resetCategoryForm);

  // 9. Excel Export Banner
  document.getElementById('btn-export-excel-report').addEventListener('click', () => {
    ExcelExport.exportToExcel(State.transactions, State.accounts, State.categories);
  });

  // 10. Backup & Restore System Actions
  document.getElementById('btn-sidebar-backup').addEventListener('click', async () => {
    try {
      const data = await API.getBackup();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `Smart_Wealth_Tracker_Backup_${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('ล้มเหลวในการดาวน์โหลดไฟล์ Backup: ' + err.message);
    }
  });

  const sidebarRestoreBtn = document.getElementById('btn-sidebar-restore');
  const restoreFileInput = document.getElementById('file-restore-input');

  sidebarRestoreBtn.addEventListener('click', () => restoreFileInput.click());

  restoreFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const backupData = JSON.parse(event.target.result);
        const confirmRestore = confirm('⚠️ คำเตือน: การนำเข้าไฟล์สำรองข้อมูล (Restore) จะล้างฐานข้อมูลการเงินทั้งหมดในระบบปัจจุบันเพื่อแทนที่ด้วยไฟล์นี้ คุณแน่ใจที่จะดำเนินการต่อหรือไม่?');
        
        if (confirmRestore) {
          showLoader();
          const res = await API.restoreBackup(backupData);
          alert(res.message || 'กู้คืนข้อมูลระบบเสร็จสิ้น!');
          await reloadAppData();
        }
      } catch (err) {
        alert('เกิดข้อผิดพลาดในการอ่านไฟล์ Backup: โครงสร้างไฟล์ JSON ไม่ถูกต้อง');
      } finally {
        restoreFileInput.value = '';
      }
    };
    reader.readAsText(file);
  });

  // 11. Custom Slip PDF Previews Close modals events
  document.getElementById('btn-close-preview-modal').addEventListener('click', closePreviewModal);
  document.getElementById('btn-close-preview-modal-footer').addEventListener('click', closePreviewModal);

  // 12. Future Expenses Modal Click Trigger & Close Events
  document.getElementById('metric-future-expense').style.cursor = 'pointer';
  document.getElementById('metric-future-expense').addEventListener('click', openFutureDetailsModal);
  
  document.getElementById('metric-overdue-expense').style.cursor = 'pointer';
  document.getElementById('metric-overdue-expense').addEventListener('click', openFutureDetailsModal);
  
  document.getElementById('btn-close-future-modal').addEventListener('click', closeFutureDetailsModal);
  document.getElementById('btn-close-future-modal-footer').addEventListener('click', closeFutureDetailsModal);

  // Close future details modal when clicking on backdrop
  document.getElementById('modal-future-details').addEventListener('click', (e) => {
    if (e.target === document.getElementById('modal-future-details')) {
      closeFutureDetailsModal();
    }
  });

  // 13. Login Form Submit Handler
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = (document.getElementById('loginUsername')?.value || '').trim();
      const password  = document.getElementById('loginPasscode').value;
      const errorDiv  = document.getElementById('loginError');
      if (errorDiv) errorDiv.style.display = 'none';
      
      if (!username || !password) {
        if (errorDiv) { errorDiv.textContent = 'กรุณากรอก username และ password'; errorDiv.style.display = 'block'; }
        return;
      }
      
      try {
        showLoader();
        await API.login(username, password);
        const loginOverlay = document.getElementById('loginOverlay');
        if (loginOverlay) loginOverlay.classList.add('hidden');
        document.body.classList.remove('modal-open');
        
        // Show admin nav
        if (API.isAdmin()) {
          const adminBtn = document.getElementById('btn-nav-admin');
          if (adminBtn) adminBtn.style.display = '';
        }
        // Show username
        const user = API.getCurrentUser();
        const usernameEl = document.getElementById('sidebar-username');
        if (usernameEl) usernameEl.textContent = user.username;
        
        await reloadAppData();
      } catch (error) {
        if (errorDiv) { errorDiv.textContent = error.message; errorDiv.style.display = 'block'; }
        else alert(error.message);
      } finally {
        hideLoader();
      }
    });
  }

  // 14. Passcode Visibility Toggle Handler
  const toggleBtn = document.getElementById('btnTogglePasscode');
  const passcodeField = document.getElementById('loginPasscode');
  if (toggleBtn && passcodeField) {
    toggleBtn.addEventListener('click', () => {
      const type = passcodeField.getAttribute('type') === 'password' ? 'text' : 'password';
      passcodeField.setAttribute('type', type);
      const icon = toggleBtn.querySelector('i');
      if (icon) {
        icon.className = type === 'password' ? 'fa-regular fa-eye' : 'fa-regular fa-eye-slash';
      }
    });
  }

  // 15. Logout Button Handler
  const logoutBtn = document.getElementById('btn-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      if (confirm('คุณต้องการออกจากระบบใช่หรือไม่?')) {
        await API.logout();
        location.reload();
      }
    });
  }

  // 16. Interactive Dashboard Metrics click handlers
  const totalWealthCard = document.getElementById('metric-total-wealth');
  if (totalWealthCard) {
    totalWealthCard.style.cursor = 'pointer';
    totalWealthCard.addEventListener('click', () => {
      document.getElementById('btn-nav-accounts').click();
    });
  }

  const totalIncomeCard = document.getElementById('metric-total-income');
  if (totalIncomeCard) {
    totalIncomeCard.style.cursor = 'pointer';
    totalIncomeCard.addEventListener('click', () => {
      document.getElementById('btn-nav-transactions').click();
      document.getElementById('filter-type').value = 'income';
      State.filters.type = 'income';
      
      const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Bangkok' });
      const monthStart = today.slice(0, 8) + '01';
      document.getElementById('filter-date-start').value = monthStart;
      document.getElementById('filter-date-end').value = today;
      State.filters.dateStart = monthStart;
      State.filters.dateEnd = today;
      
      State.pagination.page = 1;
      refreshTransactionsTable();
      refreshReportsTable();
    });
  }

  const totalExpenseCard = document.getElementById('metric-total-expense');
  if (totalExpenseCard) {
    totalExpenseCard.style.cursor = 'pointer';
    totalExpenseCard.addEventListener('click', () => {
      document.getElementById('btn-nav-transactions').click();
      document.getElementById('filter-type').value = 'expense';
      State.filters.type = 'expense';
      
      const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Bangkok' });
      const monthStart = today.slice(0, 8) + '01';
      document.getElementById('filter-date-start').value = monthStart;
      document.getElementById('filter-date-end').value = today;
      State.filters.dateStart = monthStart;
      State.filters.dateEnd = today;
      
      State.pagination.page = 1;
      refreshTransactionsTable();
      refreshReportsTable();
    });
  }
}

// --- Attachment Selection Logic ---
async function handleAttachmentUpload(file) {
  // Validate extension
  const ext = file.name.split('.').pop().toLowerCase();
  const allowed = ['jpg', 'jpeg', 'png', 'pdf'];
  if (!allowed.includes(ext)) {
    alert('รูปแบบไฟล์แนบไม่ถูกต้อง! รองรับเฉพาะไฟล์รูปภาพ JPG, PNG หรือ เอกสาร PDF เท่านั้น');
    return;
  }

  // Validate size (10MB limit)
  if (file.size > 10 * 1024 * 1024) {
    alert('ไฟล์มีขนาดใหญ่เกินไป! ขนาดไฟล์แนบต้องไม่เกิน 10MB');
    return;
  }

  // Store file locally, do NOT upload yet
  State.pendingFile = file;
  State.uploadedFileName = file.name;

  // Display Badge immediately
  document.getElementById('attachment-upload-zone').style.display = 'none';
  
  const badge = document.getElementById('uploaded-file-badge');
  const badgeIcon = document.getElementById('badge-file-icon');
  const badgeName = document.getElementById('badge-file-name');
  
  badgeName.innerText = file.name;
  badgeIcon.className = ext === 'pdf' ? 'fa-regular fa-file-pdf text-rose' : 'fa-regular fa-image text-indigo';
  
  badge.style.display = 'flex';
}

function removeUploadedAttachment() {
  State.uploadedFileUrl = null;
  State.uploadedFileName = null;
  State.pendingFile = null;
  
  document.getElementById('uploaded-file-badge').style.display = 'none';
  document.getElementById('attachment-upload-zone').style.display = 'flex';
  document.getElementById('tx-attachment-input').value = '';
}

// --- Modals Control Handlers ---

function openCreateTransactionModal() {
  // Reset Form
  document.getElementById('transaction-form').reset();
  document.getElementById('tx-id').value = '';
  document.getElementById('tx-slip-url').value = '';
  
  // Set date to today
  document.getElementById('tx-date').value = new Date().toLocaleDateString('sv-SE');
  
  // Reset Upload badge
  removeUploadedAttachment();
  
  // Reset type hidden field and select active button
  document.getElementById('tx-type').value = 'expense';
  const typeButtons = document.querySelectorAll('.transaction-type-blocks .type-block-btn');
  typeButtons.forEach(btn => {
    if (btn.getAttribute('data-type') === 'expense') {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  handleTypeChange('expense');
  
  // Set default payment method and update accounts dropdown
  document.getElementById('tx-payment-method').value = 'Transfer';
  updateTransactionFormAccounts();

  document.getElementById('tx-modal-title').innerHTML = '<i class="fa-solid fa-money-bill-transfer text-indigo"></i> บันทึกธุรกรรมการเงิน';
  document.getElementById('modal-transaction').classList.add('active');
  document.body.classList.add('modal-open');
}

function openEditTransactionModal(id) {
  const t = (Array.isArray(State.transactions) ? State.transactions : []).find(tx => tx.id === id);
  if (!t) return;

  // Reset form first
  document.getElementById('transaction-form').reset();
  
  const isTransfer = t.type === 'transfer_out' || t.type === 'transfer_in';
  const formType = isTransfer ? 'transfer' : t.type;

  // Load data
  document.getElementById('tx-id').value = t.id;
  document.getElementById('tx-type').value = formType;
  document.getElementById('tx-date').value = t.date;
  
  // Update active type button state
  const typeButtons = document.querySelectorAll('.transaction-type-blocks .type-block-btn');
  typeButtons.forEach(btn => {
    if (btn.getAttribute('data-type') === formType) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  handleTypeChange(formType);
  
  if (formType === 'future') {
    document.getElementById('tx-status').value = t.status || 'pending';
  }

  document.getElementById('tx-amount').value = t.amount;

  if (isTransfer) {
    const otherTx = (Array.isArray(State.transactions) ? State.transactions : []).find(tx => tx.id === t.transferTxId);
    populateTransferAccountSelects();
    
    if (t.type === 'transfer_out') {
      document.getElementById('tx-account').value = t.accountId;
      if (otherTx) {
        document.getElementById('tx-to-account').value = otherTx.accountId;
      }
    } else {
      if (otherTx) {
        document.getElementById('tx-account').value = otherTx.accountId;
      }
      document.getElementById('tx-to-account').value = t.accountId;
    }
  } else {
    // Populate category based on loaded type and set value
    updateTransactionFormCategories();
    document.getElementById('tx-category').value = t.category;
    
    document.getElementById('tx-payment-method').value = t.paymentMethod;
    
    updateTransactionFormAccounts();
    document.getElementById('tx-account').value = t.accountId;
  }

  document.getElementById('tx-notes').value = t.notes || '';
  document.getElementById('tx-slip-url').value = t.slipUrl || '';

  // Setup uploaded badge
  if (t.slipUrl) {
    State.uploadedFileUrl = t.slipUrl;
    // Extract file name
    const filename = t.slipUrl.split('/').pop();
    State.uploadedFileName = filename;
    
    document.getElementById('attachment-upload-zone').style.display = 'none';
    
    const badge = document.getElementById('uploaded-file-badge');
    const badgeIcon = document.getElementById('badge-file-icon');
    const badgeName = document.getElementById('badge-file-name');
    
    badgeName.innerText = filename;
    
    const ext = filename.split('.').pop().toLowerCase();
    badgeIcon.className = ext === 'pdf' ? 'fa-regular fa-file-pdf text-rose' : 'fa-regular fa-image text-indigo';
    badge.style.display = 'flex';
  } else {
    removeUploadedAttachment();
  }

  document.getElementById('tx-modal-title').innerHTML = '<i class="fa-solid fa-pen-to-square text-indigo"></i> แก้ไขข้อมูลธุรกรรมการเงิน';
  document.getElementById('modal-transaction').classList.add('active');
  document.body.classList.add('modal-open');
}

function closeTransactionModal() {
  document.getElementById('modal-transaction').classList.remove('active');
  document.body.classList.remove('modal-open');
}

// Preview PDF or Slip image attachment
function previewAttachment(fileUrl) {
  const ext = fileUrl.split('.').pop().toLowerCase();
  
  document.getElementById('preview-img-container').style.display = 'none';
  document.getElementById('preview-pdf-container').style.display = 'none';
  document.getElementById('preview-error-container').style.display = 'none';
  
  document.getElementById('btn-download-preview-file').href = fileUrl;

  if (ext === 'pdf') {
    document.getElementById('preview-pdf').src = fileUrl;
    document.getElementById('preview-pdf-container').style.display = 'block';
  } else if (['jpg', 'jpeg', 'png'].includes(ext)) {
    document.getElementById('preview-img').src = fileUrl;
    document.getElementById('preview-img-container').style.display = 'block';
  } else {
    document.getElementById('preview-error-container').style.display = 'block';
  }

  document.getElementById('modal-preview-attachment').classList.add('active');
  document.body.classList.add('modal-open');
}

function closePreviewModal() {
  document.getElementById('modal-preview-attachment').classList.remove('active');
  document.body.classList.remove('modal-open');
  // Clear iframe src to stop video/pdf reloading
  document.getElementById('preview-pdf').src = '';
}

// --- Future Expenses Modal Handlers ---
function openFutureDetailsModal() {
  const todayStr = new Date().toLocaleDateString('sv-SE');
  
  const sevenDaysLater = new Date();
  sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
  const sevenDaysLaterStr = sevenDaysLater.toLocaleDateString('sv-SE');

  const thirtyDaysLater = new Date();
  thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
  const thirtyDaysLaterStr = thirtyDaysLater.toLocaleDateString('sv-SE');

  // Filter future type transactions that are NOT paid
  const allPendingFuture = (Array.isArray(State.transactions) ? State.transactions : []).filter(t => t.type === 'future' && t.status !== 'paid');
  
  const todayList = allPendingFuture.filter(t => t.date === todayStr);
  const weekList = allPendingFuture.filter(t => t.date > todayStr && t.date <= sevenDaysLaterStr);
  const monthList = allPendingFuture.filter(t => t.date > todayStr && t.date <= thirtyDaysLaterStr);
  const customTotal = allPendingFuture.reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const todayTotal = todayList.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const weekTotal = weekList.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const monthTotal = monthList.reduce((sum, t) => sum + Number(t.amount || 0), 0);

  // Set Block Values
  document.getElementById('future-block-today-val').innerText = formatCurrency(todayTotal);
  document.getElementById('future-block-today-count').innerText = `${todayList.length} รายการ`;

  document.getElementById('future-block-week-val').innerText = formatCurrency(weekTotal);
  document.getElementById('future-block-week-count').innerText = `${weekList.length} รายการ`;

  document.getElementById('future-block-month-val').innerText = formatCurrency(monthTotal);
  document.getElementById('future-block-month-count').innerText = `${monthList.length} รายการ`;

  document.getElementById('future-block-custom-val').innerText = formatCurrency(customTotal);
  document.getElementById('future-block-custom-count').innerText = `${allPendingFuture.length} รายการ`;

  const blockToday = document.getElementById('block-future-today');
  const blockWeek = document.getElementById('block-future-week');
  const blockMonth = document.getElementById('block-future-month');
  const blockCustom = document.getElementById('block-future-custom');
  const customInputs = document.getElementById('future-custom-range-inputs');

  // Set default custom dates (start = today, end = today + 30)
  if (!document.getElementById('future-custom-start').value) {
    document.getElementById('future-custom-start').value = todayStr;
    document.getElementById('future-custom-end').value = thirtyDaysLaterStr;
  }

  let activeTab = 'today';

  function updateModalList() {
    blockToday.classList.remove('active');
    blockWeek.classList.remove('active');
    blockMonth.classList.remove('active');
    blockCustom.classList.remove('active');
    customInputs.style.display = 'none';

    let displayList = [];
    let titleText = '';

    if (activeTab === 'today') {
      blockToday.classList.add('active');
      titleText = '<i class="fa-solid fa-calendar-day text-rose"></i> รายการที่ต้องชำระวันนี้';
      displayList = todayList;
    } else if (activeTab === 'week') {
      blockWeek.classList.add('active');
      titleText = '<i class="fa-solid fa-calendar-week text-amber-hover"></i> รายการค้างจ่ายในอีก 7 วันข้างหน้า';
      displayList = weekList;
    } else if (activeTab === 'month') {
      blockMonth.classList.add('active');
      titleText = '<i class="fa-solid fa-calendar-days text-indigo"></i> รายการค้างจ่ายในอีก 30 วันข้างหน้า';
      displayList = monthList;
    } else if (activeTab === 'custom') {
      blockCustom.classList.add('active');
      customInputs.style.display = 'flex';
      titleText = '<i class="fa-solid fa-sliders text-slate"></i> รายการค้างจ่าย (กำหนดระยะเวลาเอง)';

      const startVal = document.getElementById('future-custom-start').value;
      const endVal = document.getElementById('future-custom-end').value;

      displayList = allPendingFuture.filter(t => {
        if (startVal && t.date < startVal) return false;
        if (endVal && t.date > endVal) return false;
        return true;
      });

      const currentCustomTotal = displayList.reduce((sum, t) => sum + Number(t.amount || 0), 0);
      document.getElementById('future-block-custom-val').innerText = formatCurrency(currentCustomTotal);
      document.getElementById('future-block-custom-count').innerText = `${displayList.length} รายการ`;
    }

    document.getElementById('future-details-title').innerHTML = titleText;

    const listContainer = document.getElementById('future-details-list-container');
    listContainer.innerHTML = '';

    if (displayList.length === 0) {
      listContainer.innerHTML = `
        <div class="empty-state py-8">
          <i class="fa-regular fa-calendar-xmark empty-icon text-slate text-xl mb-2"></i>
          <p class="empty-text text-sm">ไม่พบรายการค้างชำระในช่วงเวลาที่เลือก</p>
        </div>`;
    } else {
      displayList.forEach(t => renderFutureDetailRow(t, listContainer));
    }
  }

  blockToday.onclick = () => { activeTab = 'today'; updateModalList(); };
  blockWeek.onclick = () => { activeTab = 'week'; updateModalList(); };
  blockMonth.onclick = () => { activeTab = 'month'; updateModalList(); };
  blockCustom.onclick = () => { activeTab = 'custom'; updateModalList(); };

  document.getElementById('future-custom-start').onchange = () => { if (activeTab === 'custom') updateModalList(); };
  document.getElementById('future-custom-end').onchange = () => { if (activeTab === 'custom') updateModalList(); };

  // Set default active tab
  activeTab = todayList.length > 0 ? 'today' : weekList.length > 0 ? 'week' : monthList.length > 0 ? 'month' : 'custom';
  updateModalList();

  document.getElementById('modal-future-details').classList.add('active');
  document.body.classList.add('modal-open');
}

function renderFutureDetailRow(t, container) {
  const acc = State.accounts.find(a => a.id === t.accountId);
  container.innerHTML += `
    <div class="future-detail-item">
      <div class="future-detail-left">
        <span class="future-detail-date"><i class="fa-solid fa-clock"></i> ${formatDateThShort(t.date)}</span>
        <span class="future-detail-title">${t.notes || t.category}</span>
        <span class="future-detail-cat">หมวดหมู่: ${t.category}</span>
      </div>
      <div class="future-detail-right">
        <span class="future-detail-amount">-${formatCurrency(t.amount)}</span>
        <span class="future-detail-acc">${acc ? acc.name : '-'}</span>
      </div>
    </div>`;
}

function closeFutureDetailsModal() {
  document.getElementById('modal-future-details').classList.remove('active');
  document.body.classList.remove('modal-open');
}

// --- API Actions Form Submissions ---

// Transaction Form Submit
async function handleTransactionSubmit(e) {
  e.preventDefault();
  
  const id = document.getElementById('tx-id').value;
  const type = document.getElementById('tx-type').value;
  const date = document.getElementById('tx-date').value;
  const category = document.getElementById('tx-category').value;
  const amount = Number(document.getElementById('tx-amount').value);
  const paymentMethod = document.getElementById('tx-payment-method').value;
  
  // If payment method is Cash, force accountId to cash
  const accountId = paymentMethod === 'Cash' ? 'acc-cash' : document.getElementById('tx-account').value;
  const toAccountId = document.getElementById('tx-to-account').value;
  
  const notes = document.getElementById('tx-notes').value;

  showLoader();
  
  let slipUrl = document.getElementById('tx-slip-url').value || State.uploadedFileUrl;
  
  // Upload file first if there is a pending file selection
  if (State.pendingFile) {
    try {
      const uploadRes = await API.uploadAttachment(State.pendingFile);
      slipUrl = uploadRes.fileUrl;
    } catch (uploadError) {
      hideLoader();
      alert('อัปโหลดไฟล์แนบล้มเหลว: ' + uploadError.message);
      return;
    }
  }

  const txData = {
    date,
    type,
    category: type === 'transfer' ? 'โอนย้ายเงิน' : category,
    amount,
    paymentMethod: type === 'transfer' ? 'Transfer' : paymentMethod,
    accountId: type === 'transfer' ? document.getElementById('tx-account').value : accountId,
    toAccountId: type === 'transfer' ? toAccountId : undefined,
    notes,
    slipUrl: slipUrl || null,
    status: type === 'future' ? document.getElementById('tx-status').value : undefined
  };

  try {
    if (id) {
      await API.updateTransaction(id, txData);
    } else {
      await API.createTransaction(txData);
    }
    
    // Reset pending file
    State.pendingFile = null;
    
    closeTransactionModal();
    await reloadAppData();
  } catch (error) {
    alert('บันทึกธุรกรรมล้มเหลว: ' + error.message);
  } finally {
    hideLoader();
  }
}

// Delete Transaction
async function deleteTransaction(id) {
  const confirmDelete = confirm('คุณแน่ใจหรือไม่ว่าต้องการลบรายการธุรกรรมการเงินนี้? (รายการจะถูกย้ายไปที่ถังขยะและคุณสามารถกู้คืนได้ภายหลัง)');
  if (!confirmDelete) return;

  showLoader();
  try {
    await API.deleteTransaction(id);
    await reloadAppData();
  } catch (error) {
    alert('ลบรายการล้มเหลว: ' + error.message);
  } finally {
    hideLoader();
  }
}

// Account Form Submit
async function handleAccountSubmit(e) {
  e.preventDefault();

  const id = document.getElementById('account-id').value;
  const name = document.getElementById('account-name').value;
  const type = document.getElementById('account-type').value;
  const bankName = type === 'bank' ? document.getElementById('account-bank').value : '-';
  const accountNumber = type === 'bank' ? document.getElementById('account-number').value : '-';
  const initialBalance = Number(document.getElementById('account-initial-balance').value);

  const accData = {
    name,
    type,
    bankName,
    accountNumber,
    initialBalance
  };

  showLoader();
  try {
    if (id) {
      await API.updateAccount(id, accData);
    } else {
      await API.createAccount(accData);
    }
    
    resetAccountForm();
    await reloadAppData();
  } catch (error) {
    alert('บันทึกบัญชีล้มเหลว: ' + error.message);
  } finally {
    hideLoader();
  }
}

function loadAccountToForm(id) {
  const acc = State.accounts.find(a => a.id === id);
  if (!acc) return;

  document.getElementById('account-id').value = acc.id;
  document.getElementById('account-name').value = acc.name;
  
  const typeSelect = document.getElementById('account-type');
  typeSelect.value = acc.type;
  
  if (acc.type === 'cash') {
    document.getElementById('group-bank-name').style.display = 'none';
    document.getElementById('group-account-number').style.display = 'none';
  } else {
    document.getElementById('group-bank-name').style.display = 'flex';
    document.getElementById('group-account-number').style.display = 'flex';
    document.getElementById('account-bank').value = acc.bankName;
    document.getElementById('account-number').value = acc.accountNumber || '';
  }

  // For default cash account, prevent changing type to bank
  if (acc.id === 'acc-cash') {
    typeSelect.disabled = true;
  } else {
    typeSelect.disabled = false;
  }

  document.getElementById('account-initial-balance').value = acc.initialBalance;
  
  document.getElementById('account-form-title').innerHTML = '<i class="fa-solid fa-pen-to-square text-indigo"></i> แก้ไขข้อมูลบัญชีการเงิน';
  document.getElementById('btn-submit-account').innerText = 'บันทึกการแก้ไข';
  
  // Scroll to form (on mobile/tablets)
  document.getElementById('account-name').focus();
}

function resetAccountForm() {
  document.getElementById('account-form').reset();
  document.getElementById('account-id').value = '';
  document.getElementById('account-type').disabled = false;
  
  // Reset bank fields display
  document.getElementById('group-bank-name').style.display = 'flex';
  document.getElementById('group-account-number').style.display = 'flex';

  document.getElementById('account-form-title').innerHTML = '<i class="fa-solid fa-plus-minus text-indigo"></i> สร้างบัญชีการเงินใหม่';
  document.getElementById('btn-submit-account').innerText = 'บันทึกบัญชี';
}

// Delete Account
async function deleteAccount(id) {
  const confirmDelete = confirm('⚠️ คำเตือน: การลบบัญชีการเงินนี้จะทำให้ธุรกรรมต่างๆ ที่เคยผูกกับบัญชีนี้เป็นสถานะ "ไม่ระบุบัญชี" และคุณไม่สามารถลบบัญชีหลัก "เงินสด" ได้ คุณต้องการดำเนินการลบบัญชีนี้จริงหรือไม่?');
  if (!confirmDelete) return;

  showLoader();
  try {
    await API.deleteAccount(id);
    await reloadAppData();
  } catch (error) {
    alert('ลบบัญชีล้มเหลว: ' + error.message);
  } finally {
    hideLoader();
  }
}

// Category Form Submit
async function handleCategorySubmit(e) {
  e.preventDefault();

  const id = document.getElementById('category-id').value;
  const name = document.getElementById('category-name').value;
  const type = document.getElementById('category-type').value;
  const sortOrder = Number(document.getElementById('category-sort-order')?.value || 0);

  const catData = { name, type, sortOrder };

  showLoader();
  try {
    if (id) {
      await API.updateCategory(id, catData);
    } else {
      await API.createCategory(catData);
    }
    resetCategoryForm();
    await reloadAppData();
  } catch (error) {
    alert('บันทึกหมวดหมู่ล้มเหลว: ' + error.message);
  } finally {
    hideLoader();
  }
}

function loadCategoryToForm(id) {
  const cat = State.categories.find(c => c.id === id);
  if (!cat) return;

  document.getElementById('category-id').value = cat.id;
  document.getElementById('category-name').value = cat.name;
  document.getElementById('category-type').value = cat.type;
  
  const sortOrderInput = document.getElementById('category-sort-order');
  if (sortOrderInput) sortOrderInput.value = cat.sortOrder !== undefined ? cat.sortOrder : 0;

  document.getElementById('category-form-title').innerHTML = '<i class="fa-solid fa-pen-to-square text-indigo"></i> แก้ไขข้อมูลหมวดหมู่';
  document.getElementById('btn-submit-category').innerText = 'บันทึกการแก้ไข';
  document.getElementById('category-name').focus();
}

function resetCategoryForm() {
  document.getElementById('category-form').reset();
  document.getElementById('category-id').value = '';
  
  const sortOrderInput = document.getElementById('category-sort-order');
  if (sortOrderInput) sortOrderInput.value = '0';

  document.getElementById('category-form-title').innerHTML = '<i class="fa-solid fa-tags text-indigo"></i> จัดการหมวดหมู่รายรับ-รายจ่าย';
  document.getElementById('btn-submit-category').innerText = 'บันทึกหมวดหมู่';
}

// Delete Category
async function deleteCategory(id) {
  const confirmDelete = confirm('คุณแน่ใจหรือไม่ว่าต้องการลบหมวดหมู่นี้?');
  if (!confirmDelete) return;

  showLoader();
  try {
    await API.deleteCategory(id);
    await reloadAppData();
  } catch (error) {
    alert('ลบหมวดหมู่ล้มเหลว: ' + error.message);
  } finally {
    hideLoader();
  }
}

// Expose category methods globally
window.loadCategoryToForm = loadCategoryToForm;
window.deleteCategory = deleteCategory;


// --- Helper Formatting Utilities ---

// Thai Currency Formatter (฿1,234.56)
function formatCurrency(value) {
  return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(value);
}

// Number representation of currency (1,234.56 without ฿ symbol)
function formatCurrencyNumber(value) {
  return new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

// Convert YYYY-MM-DD to short Thai format (e.g. 29 พ.ค. 69)
function formatDateThShort(dateStr) {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const d     = new Date(parts[0], parts[1] - 1, parts[2]);
  const day   = d.getDate();
  const month = d.toLocaleDateString('th-TH', { month: 'short' });
  const year  = String(d.getFullYear() + 543).slice(-2);
  return `${day} ${month} ${year}`;
}

function handleTypeChange(type) {
  const statusGroup = document.getElementById('group-tx-status');
  const catGroup = document.getElementById('group-tx-category');
  const methodGroup = document.getElementById('group-tx-payment-method');
  const toAccGroup = document.getElementById('group-tx-to-account');
  const accLabel = document.querySelector('#group-tx-account label');

  if (statusGroup) statusGroup.style.display = type === 'future' ? 'flex' : 'none';

  if (type === 'transfer') {
    if (catGroup) catGroup.style.display = 'none';
    if (methodGroup) methodGroup.style.display = 'none';
    if (toAccGroup) toAccGroup.style.display = 'flex';
    if (accLabel) accLabel.innerHTML = 'จากบัญชี (ต้นทาง) <span class="text-rose">*</span>';
    populateTransferAccountSelects();
  } else {
    if (catGroup) catGroup.style.display = 'flex';
    if (methodGroup) methodGroup.style.display = 'flex';
    if (toAccGroup) toAccGroup.style.display = 'none';
    if (accLabel) accLabel.innerHTML = 'บัญชีการเงินที่ผูก <span class="text-rose">*</span>';
    updateTransactionFormCategories();
    updateTransactionFormAccounts();
  }
}

// ─── TRASH PAGE ───────────────────────────────────────────────────────────────
async function loadTrashPage() {
  const container = document.getElementById('trash-transactions-container');
  if (!container) return;
  container.innerHTML = '<p class="text-slate" style="padding:1rem;">กำลังโหลด...</p>';
  try {
    const { transactions, accounts } = await API.getTrash();
    if (!transactions?.length && !accounts?.length) {
      container.innerHTML = '<div class="empty-state"><p class="empty-text">ถังขยะว่างเปล่า</p></div>';
      return;
    }
    
    let html = '';
    
    // 1. Transactions section
    if (transactions && transactions.length > 0) {
      html += '<h4 style="margin-bottom: 0.5rem; font-weight: 700; color: var(--text-main); display: flex; align-items: center; gap: 0.5rem;"><i class="fa-solid fa-list-check text-indigo"></i> รายการธุรกรรมที่ลบ</h4>';
      html += '<div class="table-container scrollbar" style="max-height:250px; margin-bottom: 1.5rem;"><table class="premium-table compact"><thead><tr><th>วันที่</th><th>ประเภท</th><th>หมวดหมู่</th><th>จำนวนเงิน</th><th>จัดการ</th></tr></thead><tbody>';
      transactions.forEach(t => {
        const dt  = formatDateThShort(t.date);
        const cls = t.type === 'income' ? 'text-amount-inc' : 'text-amount-exp';
        const typeLabel = t.type === 'income' ? 'รายรับ' : (t.type === 'future' ? 'จ่ายล่วงหน้า' : 'รายจ่าย');
        html += '<tr><td>' + dt + '</td><td>' + typeLabel + '</td><td>' + t.category + '</td><td class="' + cls + '">' + formatCurrency(t.amount) + '</td><td><button class="btn btn-outline btn-xs" onclick="restoreTrashItem(\'transaction\',\'' + t.id + '\')">กู้คืน</button> <button class="btn btn-xs" style="background:var(--rose);color:#fff;" onclick="permanentDeleteItem(\'transaction\',\'' + t.id + '\')">ลบถาวร</button></td></tr>';
      });
      html += '</tbody></table></div>';
    }
    
    // 2. Accounts section
    if (accounts && accounts.length > 0) {
      html += '<h4 style="margin-bottom: 0.5rem; font-weight: 700; color: var(--text-main); display: flex; align-items: center; gap: 0.5rem;"><i class="fa-solid fa-building-columns text-indigo"></i> บัญชีที่ลบ</h4>';
      html += '<div class="table-container scrollbar" style="max-height:200px;"><table class="premium-table compact"><thead><tr><th>ชื่อบัญชี</th><th>ประเภท</th><th>ยอดเงินเริ่มต้น</th><th>จัดการ</th></tr></thead><tbody>';
      accounts.forEach(a => {
        const typeLabel = a.type === 'cash' ? 'เงินสด' : 'บัญชีธนาคาร';
        html += '<tr><td>' + a.name + '</td><td>' + typeLabel + '</td><td>' + formatCurrency(a.initialBalance) + '</td><td><button class="btn btn-outline btn-xs" onclick="restoreTrashItem(\'account\',\'' + a.id + '\')">กู้คืน</button> <button class="btn btn-xs" style="background:var(--rose);color:#fff;" onclick="permanentDeleteItem(\'account\',\'' + a.id + '\')">ลบถาวร</button></td></tr>';
      });
      html += '</tbody></table></div>';
    }
    
    container.innerHTML = html;
  } catch (e) {
    container.innerHTML = '<p class="text-rose">เกิดข้อผิดพลาด: ' + e.message + '</p>';
  }
}

async function restoreTrashItem(type, id) {
  try { await API.restoreFromTrash(type, id); await reloadAppData(); await loadTrashPage(); }
  catch (e) { alert('กู้คืนไม่สำเร็จ: ' + e.message); }
}

async function permanentDeleteItem(type, id) {
  if (!confirm('ลบถาวร? ไม่สามารถกู้คืนได้อีก')) return;
  try { await API.permanentDelete(type, id); await reloadAppData(); await loadTrashPage(); }
  catch (e) { alert('ลบไม่สำเร็จ: ' + e.message); }
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN PANEL
// ─────────────────────────────────────────────────────────────────────────────
async function loadAdminPanel() {
  if (!API.isAdmin()) return;
  try {
    const stats = await API.getAdminStats();
    const el = document.getElementById('admin-stats-container');
    if (el) el.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;padding:0.5rem 0;">
        <div class="stat-mini-box"><span class="stat-mini-lbl">Transactions</span><span class="stat-mini-val text-indigo">${stats.transactions||0}</span></div>
        <div class="stat-mini-box"><span class="stat-mini-lbl">Accounts</span><span class="stat-mini-val text-indigo">${stats.accounts||0}</span></div>
        <div class="stat-mini-box"><span class="stat-mini-lbl">Categories</span><span class="stat-mini-val text-indigo">${stats.categories||0}</span></div>
        <div class="stat-mini-box"><span class="stat-mini-lbl">Last Backup</span><span class="stat-mini-val" style="font-size:0.8rem;">${stats.lastBackup?(stats.lastBackup.status==='success'?'✅':'❌')+' '+(stats.lastBackup.created_at?.slice(0,10)||'-'):'ไม่มีข้อมูล'}</span></div>
      </div>`;
  } catch {}
  try {
    const users = await API.getUsers();
    const me    = API.getCurrentUser();
    const el    = document.getElementById('admin-users-list');
    if (el) el.innerHTML = users.map(u => {
      const isSelf = me && u.username === me.username;
      const toggleLabel = u.is_active ? '<i class="fa-solid fa-ban"></i> ปิดใช้งาน' : '<i class="fa-solid fa-check"></i> เปิดใช้งาน';
      const resetBtn = `<button class="btn btn-xs" style="background:var(--amber);color:#fff;" onclick="adminResetPassword('${u.id}','${u.username}')"><i class="fa-solid fa-key"></i> รีเซ็ตรหัส</button>`;
      const deleteBtn = isSelf ? '' : `<button class="btn btn-xs" style="background:var(--rose);color:#fff;" onclick="adminDeleteUser('${u.id}','${u.username}')"><i class="fa-solid fa-trash-can"></i> ลบ</button>`;
      const selfBadge = isSelf ? '<span class="badge badge-emerald" style="margin-left:0.25rem;">ตัวคุณ</span>' : '';
      const inactiveBadge = !u.is_active ? '<span class="badge badge-rose" style="margin-left:0.25rem;">ปิดใช้งาน</span>' : '';
      return `<div style="display:flex;justify-content:space-between;align-items:center;padding:0.6rem 0;border-bottom:1px solid var(--border-color);gap:0.5rem;flex-wrap:wrap;">
        <div><span style="font-weight:600;">${u.username}</span>
          <span class="badge ${u.role==='admin'?'badge-indigo':'badge-slate'}" style="margin-left:0.5rem;">${u.role}</span>
          ${inactiveBadge}${selfBadge}</div>
        <div style="display:flex;gap:0.4rem;flex-wrap:wrap;">
          <button class="btn btn-outline btn-xs" onclick="toggleUserActive('${u.id}',${!u.is_active})">${toggleLabel}</button>
          ${resetBtn}${deleteBtn}
        </div></div>`;
    }).join('');
  } catch {}
  try {
    const logs = await API.getAuditLogs(100);
    const tbody = document.getElementById('audit-table-body');
    if (tbody) tbody.innerHTML = logs.length
      ? logs.map(l => `<tr>
          <td style="white-space:nowrap;font-size:0.78rem;">${(l.created_at||'').slice(0,16)}</td>
          <td>${l.username||'-'}</td>
          <td><span class="badge badge-slate" style="font-size:0.7rem;">${l.action}</span></td>
          <td>${l.resource}${l.resource_id?' #'+l.resource_id.slice(0,8):''}</td>
          <td style="font-size:0.78rem;">${l.ip_address||'-'}</td></tr>`).join('')
      : '<tr><td colspan="5" class="text-center text-slate">ไม่มีข้อมูล</td></tr>';
  } catch {}

  const showFormBtn = document.getElementById('btn-show-create-user');
  if (showFormBtn && !showFormBtn._bound) {
    showFormBtn._bound = true;
    showFormBtn.addEventListener('click', () => {
      const form = document.getElementById('admin-create-user-form');
      if (form) form.style.display = form.style.display === 'none' ? '' : 'none';
    });
  }
  const createUserBtn = document.getElementById('btn-create-user');
  if (createUserBtn && !createUserBtn._bound) {
    createUserBtn._bound = true;
    createUserBtn.addEventListener('click', async () => {
      const username = document.getElementById('new-user-username').value.trim();
      const password = document.getElementById('new-user-password').value;
      if (!username || !password) { alert('กรุณากรอก username และ password'); return; }
      try {
        await API.createUser({ username, password, role: 'user' });
        alert('สร้างผู้ใช้สำเร็จ');
        document.getElementById('new-user-username').value = '';
        document.getElementById('new-user-password').value = '';
        document.getElementById('admin-create-user-form').style.display = 'none';
        await loadAdminPanel();
      } catch (e) { alert('สร้างผู้ใช้ไม่สำเร็จ: ' + e.message); }
    });
  }
  // จัดการตั้งค่า LINE Bot
  await loadLineSettings();

  // ตั้งค่าเริ่มต้นของวันที่และเดือนย้อนหลังในหน้ารายงาน
  const dailyInput = document.getElementById('report-daily-date');
  const monthlyInput = document.getElementById('report-monthly-date');
  if (dailyInput && !dailyInput.value) {
    dailyInput.value = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Bangkok' });
  }
  if (monthlyInput && !monthlyInput.value) {
    monthlyInput.value = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Bangkok' }).slice(0, 7);
  }
}

async function toggleUserActive(userId, isActive) {
  try { await API.updateUser(userId, { isActive }); await loadAdminPanel(); }
  catch (e) { alert('อัปเดตไม่สำเร็จ: ' + e.message); }
}

document.addEventListener('DOMContentLoaded', () => {
  const trashBtn = document.getElementById('btn-nav-trash');
  if (trashBtn) trashBtn.addEventListener('click', () => loadTrashPage());
  const adminBtn = document.getElementById('btn-nav-admin');
  if (adminBtn) adminBtn.addEventListener('click', () => loadAdminPanel());
});

window.restoreTrashItem    = restoreTrashItem;
window.permanentDeleteItem = permanentDeleteItem;
window.toggleUserActive    = toggleUserActive;

// ─── Admin User Management ────────────────────────────────────────────────────

/** รีเซ็ตรหัสผ่านของ user */
async function adminResetPassword(userId, username) {
  const newPass = prompt(`รีเซ็ตรหัสผ่านของ "${username}"\n\nใส่รหัสผ่านใหม่ (ขั้นต่ำ 6 ตัวอักษร):`);
  if (!newPass) return;
  if (newPass.length < 6) { alert('❌ รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'); return; }
  try {
    const res = await fetch(`/api/admin/users/${userId}/reset-password`, {
      method : 'POST',
      headers: {
        'Content-Type' : 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('swt_session_token')}`,
      },
      body: JSON.stringify({ newPassword: newPass }),
    });
    const data = await res.json();
    if (res.ok) alert(`✅ รีเซ็ตรหัสผ่านของ "${username}" สำเร็จ`);
    else        alert('❌ ' + (data.error || 'รีเซ็ตไม่สำเร็จ'));
  } catch (e) { alert('❌ เกิดข้อผิดพลาด: ' + e.message); }
}

/** ลบ user ออกจากระบบ */
async function adminDeleteUser(userId, username) {
  if (!confirm(`⚠️ ลบผู้ใช้ "${username}" ออกจากระบบ?\n\nการกระทำนี้ไม่สามารถย้อนกลับได้`)) return;
  try {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method : 'DELETE',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('swt_session_token')}` },
    });
    const data = await res.json();
    if (res.ok) { alert(`✅ ลบผู้ใช้ "${username}" สำเร็จ`); await loadAdminPanel(); }
    else        alert('❌ ' + (data.error || 'ลบไม่สำเร็จ'));
  } catch (e) { alert('❌ เกิดข้อผิดพลาด: ' + e.message); }
}

window.adminResetPassword = adminResetPassword;
window.adminDeleteUser    = adminDeleteUser;

async function markAsPaid(id) {
  const t = (Array.isArray(State.transactions) ? State.transactions : []).find(tx => tx.id === id);
  if (!t) return;
  
  showLoader();
  try {
    await API.updateTransaction(id, {
      ...t,
      status: 'paid'
    });
    await reloadAppData();
  } catch (error) {
    alert('ไม่สามารถอัปเดตสถานะได้: ' + error.message);
  } finally {
    hideLoader();
  }
}
window.markAsPaid = markAsPaid;

// ─── LINE Messaging Bot — Admin Functions ─────────────────────────────────────

/** โหลดสถานะ LINE จาก API แล้วอัปเดต UI */
async function loadLineSettings() {
  try {
    const res  = await fetch('/api/admin/line-settings', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('swt_session_token')}` },
    });
    if (!res.ok) return;
    const data = await res.json();

    const badge   = document.getElementById('line-bot-status-badge');
    const statusText = document.getElementById('line-bot-status-text');

    if (data.configured) {
      badge.textContent = '✅ ตั้งค่าแล้ว';
      badge.className   = 'badge badge-emerald';
      const src = data.usingEnvVar ? 'Cloudflare Secret (env)' : `Database (Group: ${data.groupIdHint || '-'})`;
      statusText.textContent = `Bot พร้อมใช้งาน — ใช้ credential จาก ${src}`;
    } else if (data.hasToken && !data.hasGroupId) {
      badge.textContent = '⚠️ ขาด Group ID';
      badge.className   = 'badge badge-amber';
      statusText.textContent = 'มี Channel Token แล้ว แต่ยังไม่ได้ตั้งค่า Group ID';
    } else {
      badge.textContent = '❌ ยังไม่ตั้งค่า';
      badge.className   = 'badge badge-rose';
      statusText.textContent = 'กรุณาใส่ Channel Access Token และ Group ID แล้วกดบันทึก';
    }
  } catch (e) {
    console.warn('[LINE] loadLineSettings error:', e.message);
  }
}

/** เปิด Modal ตั้งค่า LINE */
function openLineSettingsModal() {
  const modal = document.getElementById('lineSettingsModal');
  if (modal) {
    modal.style.display = 'flex';
    // Clear input fields initially to prevent accidentally showing old typed data
    document.getElementById('line-channel-token').value = '';
  }
}

/** ปิด Modal ตั้งค่า LINE */
function closeLineSettingsModal() {
  const modal = document.getElementById('lineSettingsModal');
  if (modal) modal.style.display = 'none';
}

/** บันทึก Channel Token + Group ID ลง Database */
async function saveLineSettings() {
  const token   = document.getElementById('line-channel-token')?.value?.trim();
  const groupId = document.getElementById('line-group-id')?.value?.trim();

  if (!token || !groupId) {
    alert('❌ กรุณาใส่ Channel Access Token และ Group ID ให้ครบ');
    return;
  }

  const btn = document.getElementById('btn-save-line-settings');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังบันทึก...'; }

  try {
    const res = await fetch('/api/admin/line-settings', {
      method : 'POST',
      headers: {
        'Content-Type' : 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('swt_session_token')}`,
      },
      body: JSON.stringify({ channelToken: token, groupId }),
    });
    const data = await res.json();
    if (res.ok) {
      alert('✅ ' + data.message);
      document.getElementById('line-channel-token').value = '';  // Clear for security
      closeLineSettingsModal(); // ปิด Modal อัตโนมัติเมื่อสำเร็จ
      await loadLineSettings();
    } else {
      alert('❌ ' + (data.error || 'บันทึกไม่สำเร็จ'));
    }
  } catch (e) {
    alert('❌ เกิดข้อผิดพลาด: ' + e.message);
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> บันทึก'; }
  }
}

/** ทดสอบส่งข้อความเข้ากลุ่ม LINE */
async function testLineBot() {
  const btn = document.getElementById('btn-test-line');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังส่ง...'; }
  try {
    const res = await fetch('/api/admin/test-line', {
      method : 'POST',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('swt_session_token')}` },
    });
    const data = await res.json();
    if (res.ok) {
      alert('✅ ' + data.message);
      await loadLineSettings();
    } else {
      alert('❌ ' + (data.error || 'ส่งไม่สำเร็จ'));
    }
  } catch (e) {
    alert('❌ เกิดข้อผิดพลาด: ' + e.message);
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> ทดสอบส่ง'; }
  }
}

/** ส่ง Daily Report เข้ากลุ่ม LINE ทันที */
async function sendLineReport() {
  const selectedDate = document.getElementById('report-daily-date')?.value || '';
  if (!confirm(`ส่ง Daily Report ของวันที่ ${selectedDate || 'วันนี้'} เข้ากลุ่ม LINE ตอนนี้เลยใช่ไหม?`)) return;
  const btn = document.getElementById('btn-send-report');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังส่ง...'; }
  try {
    const res = await fetch('/api/admin/send-report', {
      method : 'POST',
      headers: { 
        'Authorization': `Bearer ${localStorage.getItem('swt_session_token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ date: selectedDate })
    });
    const data = await res.json();
    if (res.ok) alert('✅ ' + data.message);
    else        alert('❌ ' + (data.error || 'ส่งไม่สำเร็จ'));
  } catch (e) {
    alert('❌ เกิดข้อผิดพลาด: ' + e.message);
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-chart-bar"></i> ส่ง Daily'; }
  }
}

/** Toggle แสดง/ซ่อน token */
function toggleLineTokenVisibility() {
  const input = document.getElementById('line-channel-token');
  const icon  = document.getElementById('line-token-eye');
  if (!input) return;
  if (input.type === 'password') {
    input.type    = 'text';
    icon.className = 'fa-solid fa-eye-slash';
  } else {
    input.type    = 'password';
    icon.className = 'fa-solid fa-eye';
  }
}

/** ส่ง Monthly Report เข้ากลุ่ม LINE ทันที */
async function sendLineMonthlyReport() {
  const selectedMonth = document.getElementById('report-monthly-date')?.value || '';
  if (!confirm(`ส่ง Monthly Report ของเดือน ${selectedMonth || 'เดือนนี้'} เข้ากลุ่ม LINE ตอนนี้เลยใช่ไหม?`)) return;
  const btn = document.getElementById('btn-send-monthly-report');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังส่ง...'; }
  try {
    const data = await API.sendMonthlyReport(selectedMonth);
    alert('✅ ' + (data.message || 'ส่งสำเร็จ'));
  } catch (e) {
    alert('❌ เกิดข้อผิดพลาด: ' + e.message);
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-calendar-check"></i> ส่ง Monthly'; }
  }
}

window.loadLineSettings          = loadLineSettings;
window.saveLineSettings          = saveLineSettings;
window.testLineBot               = testLineBot;
window.sendLineReport            = sendLineReport;
window.sendLineMonthlyReport     = sendLineMonthlyReport;
window.toggleLineTokenVisibility = toggleLineTokenVisibility;
