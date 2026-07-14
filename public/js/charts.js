// Chart rendering helpers using Chart.js for Smart Wealth Tracker

let incomeExpenseChart = null;
let categoryChart = null;
let balanceTrendChart = null;

const Charts = {
  destroyCharts() {
    if (incomeExpenseChart) incomeExpenseChart.destroy();
    if (categoryChart) categoryChart.destroy();
    if (balanceTrendChart) balanceTrendChart.destroy();
  },

  // Generate charts on dashboard
  renderDashboardCharts(transactions, accounts) {
    this.destroyCharts();

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-indexed

    // Filter transactions (excluding future ones from historical trends, or let's show everything up to today)
    const todayStr = today.toLocaleDateString('sv-SE');
    const pastAndPresentTransactions = transactions.filter(t => t.date <= todayStr);

    // --- Chart 1: Daily Income vs Expenses (7 Days Back & 7 Days Ahead) ---
    this.renderDailyComparisonChart(transactions);

    // --- Chart 2: Expenses by Category (Current Month) ---
    this.renderCategoryExpensesChart(transactions, currentYear, currentMonth);

    // --- Chart 3: Account Balance Trend (Last 30 Days) ---
    this.renderBalanceTrendChart(pastAndPresentTransactions, accounts);
  },

  // Chart 1: Daily 15-Day Bar Chart
  renderDailyComparisonChart(transactions) {
    const ctx = document.getElementById('incomeExpenseChart');
    if (!ctx) return;

    // Generate dates for 7 days back and 7 days ahead (total 15 days)
    const daysLabels = [];
    const daysKeys = []; // YYYY-MM-DD
    
    for (let i = -7; i <= 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const key = d.toLocaleDateString('sv-SE'); // YYYY-MM-DD
      daysKeys.push(key);
      
      let label = '';
      if (i === 0) {
        label = 'วันนี้';
      } else {
        const day = d.getDate();
        const month = d.toLocaleDateString('th-TH', { month: 'short' });
        label = `${day} ${month}`;
      }
      daysLabels.push(label);
    }

    const incomeData = Array(15).fill(0);
    const expenseData = Array(15).fill(0);

    transactions.forEach(t => {
      const idx = daysKeys.indexOf(t.date);
      if (idx !== -1) {
        if (t.type === 'income') {
          incomeData[idx] += Number(t.amount || 0);
        } else if (t.type === 'expense' || t.type === 'future') {
          expenseData[idx] += Number(t.amount || 0);
        }
      }
    });

    incomeExpenseChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: daysLabels,
        datasets: [
          {
            label: 'รายรับ',
            data: incomeData,
            backgroundColor: 'rgba(16, 185, 129, 0.85)', // Emerald Green
            borderColor: 'rgba(16, 185, 129, 1)',
            borderWidth: 1,
            borderRadius: 4,
            barPercentage: 0.7,
            categoryPercentage: 0.7
          },
          {
            label: 'รายจ่าย',
            data: expenseData,
            backgroundColor: 'rgba(239, 68, 68, 0.85)', // Rose Red
            borderColor: 'rgba(239, 68, 68, 1)',
            borderWidth: 1,
            borderRadius: 4,
            barPercentage: 0.7,
            categoryPercentage: 0.7
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              boxWidth: 10,
              font: { family: 'Plus Jakarta Sans, Inter, sans-serif', size: 10 },
              color: '#475569'
            }
          },
          tooltip: {
            titleFont: { family: 'Plus Jakarta Sans, Inter, sans-serif', size: 11 },
            bodyFont: { family: 'Plus Jakarta Sans, Inter, sans-serif', size: 11 },
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) label += ': ';
                if (context.parsed.y !== null) {
                  label += new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(context.parsed.y);
                }
                return label;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              font: { family: 'Plus Jakarta Sans, Inter, sans-serif', size: 9 },
              color: '#64748b',
              maxTicksLimit: 15
            }
          },
          y: {
            border: { dash: [4, 4] },
            grid: { color: '#e2e8f0' },
            ticks: {
              font: { family: 'Plus Jakarta Sans, Inter, sans-serif', size: 9 },
              color: '#64748b',
              callback: function(value) {
                if (value >= 1000) return (value / 1000) + 'k';
                return value;
              }
            }
          }
        }
      }
    });
  },

  // Chart 2: Category Expenses Doughnut Chart
  renderCategoryExpensesChart(transactions, year, month) {
    const ctx = document.getElementById('categoryChart');
    if (!ctx) return;

    // Filter expenses in this specific month/year
    const monthStr = String(month + 1).padStart(2, '0');
    const targetMonthKey = `${year}-${monthStr}`; // 'YYYY-MM'

    const expenseCategories = {};
    let totalExpenseThisMonth = 0;

    transactions.forEach(t => {
      const txMonthKey = t.date.slice(0, 7);
      if ((t.type === 'expense' || t.type === 'future') && txMonthKey === targetMonthKey) {
        const cat = t.category || 'อื่นๆ';
        const amt = Number(t.amount || 0);
        expenseCategories[cat] = (expenseCategories[cat] || 0) + amt;
        totalExpenseThisMonth += amt;
      }
    });

    const categories = Object.keys(expenseCategories);
    const amounts = Object.values(expenseCategories);

    // If no transactions, show placeholder message or empty chart
    if (categories.length === 0) {
      categories.push('ไม่มีรายจ่ายในเดือนนี้');
      amounts.push(0.1); // Small placeholder
    }

    const premiumColors = [
      '#4f46e5', // Indigo
      '#ef4444', // Red/Rose
      '#f59e0b', // Amber/Yellow
      '#06b6d4', // Cyan
      '#8b5cf6', // Violet
      '#ec4899', // Pink
      '#10b981', // Emerald
      '#64748b', // Slate
      '#14b8a6', // Teal
      '#f97316'  // Orange
    ];

    categoryChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: categories,
        datasets: [{
          data: amounts,
          backgroundColor: categories[0] === 'ไม่มีรายจ่ายในเดือนนี้' ? ['#e2e8f0'] : premiumColors.slice(0, categories.length),
          borderWidth: 2,
          borderColor: '#ffffff',
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'right',
            labels: {
              boxWidth: 12,
              font: { family: 'Plus Jakarta Sans, Inter, sans-serif', size: 11 },
              color: '#475569',
              generateLabels: function(chart) {
                const data = chart.data;
                if (data.labels.length && data.datasets.length) {
                  return data.labels.map(function(label, i) {
                    const value = data.datasets[0].data[i];
                    const percent = totalExpenseThisMonth > 0 && label !== 'ไม่มีรายจ่ายในเดือนนี้' 
                      ? Math.round((value / totalExpenseThisMonth) * 100) 
                      : 0;
                    
                    const displayLabel = label === 'ไม่มีรายจ่ายในเดือนนี้' 
                      ? label 
                      : `${label} (${percent}%)`;
                    
                    return {
                      text: displayLabel,
                      fillStyle: data.datasets[0].backgroundColor[i],
                      strokeStyle: data.datasets[0].backgroundColor[i],
                      lineWidth: 0,
                      hidden: isNaN(data.datasets[0].data[i]) || chart.getDatasetMeta(0).data[i].hidden,
                      index: i
                    };
                  });
                }
                return [];
              }
            }
          },
          tooltip: {
            enabled: categories[0] !== 'ไม่มีรายจ่ายในเดือนนี้',
            titleFont: { family: 'Plus Jakarta Sans, Inter, sans-serif', size: 13 },
            bodyFont: { family: 'Plus Jakarta Sans, Inter, sans-serif', size: 12 },
            callbacks: {
              label: function(context) {
                const val = context.parsed;
                const formatted = new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(val);
                return ` ${context.label}: ${formatted}`;
              }
            }
          }
        }
      }
    });
  },

  // Chart 3: Net Wealth Trend over the Last 30 Days (Rolling balance)
  renderBalanceTrendChart(transactions, accounts) {
    const ctx = document.getElementById('balanceTrendChart');
    if (!ctx) return;

    // 1. Generate dates for last 30 days
    const dates = [];
    const dateLabels = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const isoDate = d.toLocaleDateString('sv-SE'); // YYYY-MM-DD
      dates.push(isoDate);
      
      const label = d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
      dateLabels.push(label);
    }

    // 2. We need to calculate the balance for each day in `dates`
    // First, let's get the sum of initial balances
    let currentBalance = 0;
    accounts.forEach(acc => {
      currentBalance += Number(acc.initialBalance || 0);
    });

    // Get all transactions sorted ascending by date (to roll forward)
    const sortedTx = [...transactions].sort((a, b) => a.date.localeCompare(b.date));

    // Calculate historical balances at each day
    const balanceMap = {};
    const firstDate = dates[0];

    // Find all transactions that occurred BEFORE our 30-day window
    let startingBalance = currentBalance;
    const beforeTx = sortedTx.filter(t => t.date < firstDate);
    beforeTx.forEach(t => {
      const amt = Number(t.amount || 0);
      if (t.type === 'income' || t.type === 'transfer_in') {
        startingBalance += amt;
      } else if (t.type === 'expense' || t.type === 'future' || t.type === 'transfer_out') {
        startingBalance -= amt;
      }
    });

    // Roll forward daily
    let rollingBalance = startingBalance;
    
    // Group transactions by date inside the 30-day window
    const windowTxMap = {};
    const windowTx = sortedTx.filter(t => t.date >= firstDate && t.date <= dates[dates.length - 1]);
    
    windowTx.forEach(t => {
      if (!windowTxMap[t.date]) windowTxMap[t.date] = [];
      windowTxMap[t.date].push(t);
    });

    const balanceHistoryData = [];

    dates.forEach(date => {
      const dayTxList = windowTxMap[date] || [];
      dayTxList.forEach(t => {
        const amt = Number(t.amount || 0);
        if (t.type === 'income' || t.type === 'transfer_in') {
          rollingBalance += amt;
        } else if (t.type === 'expense' || t.type === 'future' || t.type === 'transfer_out') {
          rollingBalance -= amt;
        }
      });
      balanceHistoryData.push(rollingBalance);
    });

    // Create line gradient
    let gradient = null;
    if (ctx) {
      const renderingContext = ctx.getContext('2d');
      gradient = renderingContext.createLinearGradient(0, 0, 0, 200);
      gradient.addColorStop(0, 'rgba(79, 70, 229, 0.3)');
      gradient.addColorStop(1, 'rgba(79, 70, 229, 0.0)');
    }

    balanceTrendChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: dateLabels,
        datasets: [{
          label: 'ความมั่งคั่งสุทธิ',
          data: balanceHistoryData,
          fill: true,
          backgroundColor: gradient || 'rgba(79, 70, 229, 0.1)',
          borderColor: 'rgba(79, 70, 229, 1)', // Indigo primary
          borderWidth: 2,
          pointRadius: 2,
          pointHoverRadius: 5,
          pointBackgroundColor: 'rgba(79, 70, 229, 1)',
          tension: 0.35
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            titleFont: { family: 'Plus Jakarta Sans, Inter, sans-serif', size: 13 },
            bodyFont: { family: 'Plus Jakarta Sans, Inter, sans-serif', size: 12 },
            callbacks: {
              label: function(context) {
                const val = context.parsed.y;
                const formatted = new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(val);
                return ` สินทรัพย์สุทธิ: ${formatted}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              font: { family: 'Plus Jakarta Sans, Inter, sans-serif', size: 10 },
              color: '#64748b',
              maxTicksLimit: 8
            }
          },
          y: {
            border: { dash: [4, 4] },
            grid: { color: '#e2e8f0' },
            ticks: {
              font: { family: 'Plus Jakarta Sans, Inter, sans-serif', size: 11 },
              color: '#64748b',
              callback: function(value) {
                if (value >= 1000) return (value / 1000) + 'k';
                return value;
              }
            }
          }
        }
      }
    });
  }
};

window.Charts = Charts;
