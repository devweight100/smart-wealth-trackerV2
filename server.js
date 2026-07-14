const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the public folder
app.use(express.static(path.join(__dirname, 'public')));
// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure directories exist
const dbDir = path.join(__dirname, 'database');
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Database file paths
const ACCOUNTS_FILE = path.join(dbDir, 'accounts.json');
const TRANSACTIONS_FILE = path.join(dbDir, 'transactions.json');
const CATEGORIES_FILE = path.join(dbDir, 'categories.json');

// --- JSON Helper Database ---
function readJSONFile(filePath, defaultVal = []) {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultVal, null, 2), 'utf8');
      return defaultVal;
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data || '[]');
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return defaultVal;
  }
}

function writeJSONFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error);
  }
}

// Seed Default Categories if empty
const defaultCategories = [
  // Income Categories
  { id: 'cat-inc-1', name: 'เงินเดือน', type: 'income', isSystem: false },
  { id: 'cat-inc-2', name: 'รายได้เสริม', type: 'income', isSystem: false },
  { id: 'cat-inc-3', name: 'โอนเงินเข้า', type: 'income', isSystem: false },
  { id: 'cat-inc-4', name: 'ดอกเบี้ย / เงินปันผล', type: 'income', isSystem: false },
  { id: 'cat-inc-5', name: 'อื่นๆ', type: 'income', isSystem: false },
  // Expense Categories
  { id: 'cat-exp-1', name: 'อาหารและเครื่องดื่ม', type: 'expense', isSystem: false },
  { id: 'cat-exp-2', name: 'การเดินทาง / น้ำมัน', type: 'expense', isSystem: false },
  { id: 'cat-exp-3', name: 'ช้อปปิ้ง', type: 'expense', isSystem: false },
  { id: 'cat-exp-4', name: 'ค่าบ้าน / คอนโด / ค่าเช่า', type: 'expense', isSystem: false },
  { id: 'cat-exp-5', name: 'ค่าน้ำ / ค่าไฟ / ค่าอินเทอร์เน็ต', type: 'expense', isSystem: false },
  { id: 'cat-exp-6', name: 'ความบันเทิง / ท่องเที่ยว', type: 'expense', isSystem: false },
  { id: 'cat-exp-7', name: 'สุขภาพ / ยารักษาโรค', type: 'expense', isSystem: false },
  { id: 'cat-exp-8', name: 'อื่นๆ', type: 'expense', isSystem: false }
];

// Seed Default Accounts if empty
const defaultAccounts = [
  { id: 'acc-cash', name: 'เงินสด', type: 'cash', accountNumber: '-', bankName: '-', initialBalance: 0, balance: 0 }
];

// Load and Seed
let categories = readJSONFile(CATEGORIES_FILE, defaultCategories);
if (categories.length === 0) {
  categories = defaultCategories;
  writeJSONFile(CATEGORIES_FILE, categories);
}

let accounts = readJSONFile(ACCOUNTS_FILE, defaultAccounts);
if (accounts.length === 0) {
  accounts = defaultAccounts;
  writeJSONFile(ACCOUNTS_FILE, accounts);
}

let transactions = readJSONFile(TRANSACTIONS_FILE, []);

// Recalculate account balances dynamically
function recalculateBalances() {
  const currentAccounts = readJSONFile(ACCOUNTS_FILE, defaultAccounts);
  const currentTransactions = readJSONFile(TRANSACTIONS_FILE, []);

  const updatedAccounts = currentAccounts.map(account => {
    let balance = Number(account.initialBalance || 0);
    
    // Filter transactions associated with this account (exclude future/pre-recorded expenses from current balance if desired, 
    // but typically let's include all recorded transactions up to current time or all of them. Let's calculate based on ALL non-future 
    // or all transactions depending on what user wants. Let's calculate based on ALL transactions for current book-keeping balance, 
    // but mark future transactions clearly in the frontend so they don't surprise the user).
    // Let's check: typically future pre-recorded transactions shouldn't affect "current" available balance yet, or they should. Let's only
    // apply transactions whose date is <= today's date for current balance, and also show overall balance including future ones.
    // For simplicity, let's include transactions whose date <= today to represent "current balance", OR let's include all completed ones.
    // Let's include transactions with date <= today (in local timezone).
    const todayStr = new Date().toLocaleDateString('sv-SE'); // YYYY-MM-DD format in local timezone
    
    currentTransactions.forEach(tx => {
      if (tx.accountId === account.id) {
        const txAmount = Number(tx.amount || 0);
        if (tx.type === 'income') {
          if (tx.date <= todayStr) {
            balance += txAmount;
          }
        } else if (tx.type === 'expense') {
          if (tx.date <= todayStr) {
            balance -= txAmount;
          }
        } else if (tx.type === 'future') {
          if (tx.status === 'paid') {
            balance -= txAmount;
          }
        }
      }
    });

    return { ...account, balance };
  });

  writeJSONFile(ACCOUNTS_FILE, updatedAccounts);
  return updatedAccounts;
}

// Recalculate balances on startup
recalculateBalances();


// --- File Upload Setup (Multer) ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'bill-' + uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.png', '.jpg', '.jpeg', '.pdf'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only PNG, JPG, JPEG, and PDF files are allowed!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});


// --- REST API Endpoints ---

// --- Authentication Middleware ---
const PASSCODE_HASH = '2f62895bf9515e9ca6ed2c20df42521eaa4420657ef2a99031080fbe3b9306e7';
const AUTH_TOKEN = 'swt-token-1234';

app.use('/api', (req, res, next) => {
  if (req.path === '/login' || req.path === '/login/') {
    return next();
  }
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token === AUTH_TOKEN) {
    return next();
  }
  return res.status(401).json({ error: 'Unauthorized: กรุณาเข้าสู่ระบบร้านค้า' });
});

// Login endpoint
app.post('/api/login', (req, res) => {
  const { passcode } = req.body;
  if (!passcode) {
    return res.status(400).json({ error: 'กรุณากรอกรหัสผ่าน' });
  }
  const hash = crypto.createHash('sha256').update(passcode).digest('hex');
  if (hash === PASSCODE_HASH) {
    res.json({ token: AUTH_TOKEN });
  } else {
    res.status(401).json({ error: 'รหัสผ่านร้านค้าไม่ถูกต้อง!' });
  }
});

// Upload endpoint
app.post('/api/upload', upload.single('attachment'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.status(201).json({
    message: 'File uploaded successfully',
    filename: req.file.filename,
    fileUrl: fileUrl,
    mimeType: req.file.mimetype
  });
});

// --- ACCOUNTS API ---
app.get('/api/accounts', (req, res) => {
  // Recalculate to ensure accurate balances
  const updatedAccounts = recalculateBalances();
  res.json(updatedAccounts);
});

app.post('/api/accounts', (req, res) => {
  const newAccounts = readJSONFile(ACCOUNTS_FILE, defaultAccounts);
  const account = {
    id: 'acc-' + Date.now(),
    name: req.body.name,
    type: req.body.type || 'bank', // cash or bank
    accountNumber: req.body.accountNumber || '-',
    bankName: req.body.bankName || '-',
    initialBalance: Number(req.body.initialBalance || 0),
    balance: Number(req.body.initialBalance || 0)
  };
  
  newAccounts.push(account);
  writeJSONFile(ACCOUNTS_FILE, newAccounts);
  recalculateBalances();
  
  res.status(201).json(account);
});

app.put('/api/accounts/:id', (req, res) => {
  const currentAccounts = readJSONFile(ACCOUNTS_FILE, defaultAccounts);
  const index = currentAccounts.findIndex(acc => acc.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Account not found' });
  }

  // Cash account cannot be renamed/deleted easily if it's the system default
  const updated = {
    ...currentAccounts[index],
    name: req.body.name || currentAccounts[index].name,
    type: req.body.type || currentAccounts[index].type,
    accountNumber: req.body.accountNumber || currentAccounts[index].accountNumber,
    bankName: req.body.bankName || currentAccounts[index].bankName,
    initialBalance: Number(req.body.initialBalance !== undefined ? req.body.initialBalance : currentAccounts[index].initialBalance)
  };

  currentAccounts[index] = updated;
  writeJSONFile(ACCOUNTS_FILE, currentAccounts);
  recalculateBalances();

  res.json(updated);
});

app.delete('/api/accounts/:id', (req, res) => {
  let currentAccounts = readJSONFile(ACCOUNTS_FILE, defaultAccounts);
  const accountToDelete = currentAccounts.find(acc => acc.id === req.params.id);
  
  if (!accountToDelete) {
    return res.status(404).json({ error: 'Account not found' });
  }

  if (req.params.id === 'acc-cash') {
    return res.status(400).json({ error: 'Cannot delete default cash account' });
  }

  // Remove account
  currentAccounts = currentAccounts.filter(acc => acc.id !== req.params.id);
  writeJSONFile(ACCOUNTS_FILE, currentAccounts);
  
  // Re-link or remove transaction accounts or recalculate
  recalculateBalances();
  
  res.json({ message: 'Account deleted successfully' });
});


// --- CATEGORIES API ---
app.get('/api/categories', (req, res) => {
  const currentCategories = readJSONFile(CATEGORIES_FILE, defaultCategories);
  res.json(currentCategories);
});

app.post('/api/categories', (req, res) => {
  const currentCategories = readJSONFile(CATEGORIES_FILE, defaultCategories);
  
  // Check duplicate
  const exists = currentCategories.some(
    cat => cat.name.trim().toLowerCase() === req.body.name.trim().toLowerCase() && cat.type === req.body.type
  );
  
  if (exists) {
    return res.status(400).json({ error: 'Category already exists' });
  }

  const category = {
    id: 'cat-' + Date.now(),
    name: req.body.name,
    type: req.body.type, // income or expense
    isSystem: false
  };

  currentCategories.push(category);
  writeJSONFile(CATEGORIES_FILE, currentCategories);
  
  res.status(201).json(category);
});

app.put('/api/categories/:id', (req, res) => {
  const currentCategories = readJSONFile(CATEGORIES_FILE, defaultCategories);
  const index = currentCategories.findIndex(cat => cat.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: 'Category not found' });
  }

  currentCategories[index].name = req.body.name || currentCategories[index].name;
  writeJSONFile(CATEGORIES_FILE, currentCategories);

  res.json(currentCategories[index]);
});

app.delete('/api/categories/:id', (req, res) => {
  let currentCategories = readJSONFile(CATEGORIES_FILE, defaultCategories);
  const categoryToDelete = currentCategories.find(cat => cat.id === req.params.id);

  if (!categoryToDelete) {
    return res.status(404).json({ error: 'Category not found' });
  }

  currentCategories = currentCategories.filter(cat => cat.id !== req.params.id);
  writeJSONFile(CATEGORIES_FILE, currentCategories);

  res.json({ message: 'Category deleted successfully' });
});


// --- TRANSACTIONS API ---
app.get('/api/transactions', (req, res) => {
  const currentTransactions = readJSONFile(TRANSACTIONS_FILE, []);
  
  // Return sorted by date descending, then ID descending
  const sorted = [...currentTransactions].sort((a, b) => {
    if (a.date !== b.date) {
      return b.date.localeCompare(a.date);
    }
    return b.id.localeCompare(a.id);
  });
  
  res.json(sorted);
});

app.post('/api/transactions', (req, res) => {
  const currentTransactions = readJSONFile(TRANSACTIONS_FILE, []);
  
  const tx = {
    id: 'tx-' + Date.now() + '-' + Math.round(Math.random() * 1000),
    date: req.body.date, // YYYY-MM-DD
    type: req.body.type, // income, expense, or future
    category: req.body.category,
    amount: Number(req.body.amount || 0),
    paymentMethod: req.body.paymentMethod, // Cash or Transfer
    accountId: req.body.accountId, // account ID associated
    notes: req.body.notes || '',
    slipUrl: req.body.slipUrl || null, // attachment path
    status: req.body.type === 'future' ? (req.body.status || 'pending') : undefined
  };

  currentTransactions.push(tx);
  writeJSONFile(TRANSACTIONS_FILE, currentTransactions);
  
  recalculateBalances();
  
  res.status(201).json(tx);
});

app.put('/api/transactions/:id', (req, res) => {
  const currentTransactions = readJSONFile(TRANSACTIONS_FILE, []);
  const index = currentTransactions.findIndex(t => t.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: 'Transaction not found' });
  }

  const updated = {
    ...currentTransactions[index],
    date: req.body.date || currentTransactions[index].date,
    type: req.body.type || currentTransactions[index].type,
    category: req.body.category || currentTransactions[index].category,
    amount: Number(req.body.amount !== undefined ? req.body.amount : currentTransactions[index].amount),
    paymentMethod: req.body.paymentMethod || currentTransactions[index].paymentMethod,
    accountId: req.body.accountId || currentTransactions[index].accountId,
    notes: req.body.notes !== undefined ? req.body.notes : currentTransactions[index].notes,
    slipUrl: req.body.slipUrl !== undefined ? req.body.slipUrl : currentTransactions[index].slipUrl,
    status: req.body.status !== undefined ? req.body.status : currentTransactions[index].status
  };

  currentTransactions[index] = updated;
  writeJSONFile(TRANSACTIONS_FILE, currentTransactions);
  
  recalculateBalances();

  res.json(updated);
});

app.delete('/api/transactions/:id', (req, res) => {
  let currentTransactions = readJSONFile(TRANSACTIONS_FILE, []);
  const txToDelete = currentTransactions.find(t => t.id === req.params.id);

  if (!txToDelete) {
    return res.status(404).json({ error: 'Transaction not found' });
  }

  // If there's an attached file, we can optionally delete it, but typically we can keep it or delete it.
  // To keep it simple, we'll just remove the database entry. If you want, we could unlink it.
  if (txToDelete.slipUrl) {
    const filePath = path.join(__dirname, txToDelete.slipUrl);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error('Error deleting attachment file:', err);
      }
    }
  }

  currentTransactions = currentTransactions.filter(t => t.id !== req.params.id);
  writeJSONFile(TRANSACTIONS_FILE, currentTransactions);
  
  recalculateBalances();

  res.json({ message: 'Transaction deleted successfully' });
});


// --- SYSTEM DATA EXPORT/IMPORT API (Backup & Restore) ---
app.get('/api/backup', (req, res) => {
  const currentAccounts = readJSONFile(ACCOUNTS_FILE, defaultAccounts);
  const currentTransactions = readJSONFile(TRANSACTIONS_FILE, []);
  const currentCategories = readJSONFile(CATEGORIES_FILE, defaultCategories);

  const backupData = {
    accounts: currentAccounts,
    transactions: currentTransactions,
    categories: currentCategories,
    backupDate: new Date().toISOString()
  };

  res.json(backupData);
});

app.post('/api/restore', (req, res) => {
  const { accounts: newAccounts, transactions: newTransactions, categories: newCategories } = req.body;

  if (!newAccounts || !newTransactions || !newCategories) {
    return res.status(400).json({ error: 'Invalid backup file structure' });
  }

  writeJSONFile(ACCOUNTS_FILE, newAccounts);
  writeJSONFile(TRANSACTIONS_FILE, newTransactions);
  writeJSONFile(CATEGORIES_FILE, newCategories);

  recalculateBalances();

  res.json({ message: 'System data restored successfully' });
});


// Catch-all route to serve the SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Smart Wealth Tracker server is running on http://localhost:${PORT}`);
});
