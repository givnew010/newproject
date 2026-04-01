import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const dataDir = path.resolve(process.cwd(), 'data');
const dbPath = path.join(dataDir, 'database.sqlite');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS inventory_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  sku TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  price REAL NOT NULL,
  barcode TEXT NOT NULL,
  status TEXT NOT NULL,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS purchase_invoices (
  id TEXT PRIMARY KEY,
  invoiceNumber TEXT NOT NULL,
  supplier TEXT NOT NULL,
  date TEXT NOT NULL,
  notes TEXT,
  items TEXT NOT NULL,
  totalAmount REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS sales_invoices (
  id TEXT PRIMARY KEY,
  invoiceNumber TEXT NOT NULL,
  customer TEXT NOT NULL,
  date TEXT NOT NULL,
  notes TEXT,
  items TEXT NOT NULL,
  totalAmount REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS warehouses (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  manager TEXT NOT NULL,
  phone TEXT NOT NULL,
  capacity INTEGER NOT NULL,
  notes TEXT,
  color TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS system_users (
  id TEXT PRIMARY KEY,
  fullName TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  role TEXT NOT NULL,
  status TEXT NOT NULL,
  department TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  lastLogin TEXT,
  avatar TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS app_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  data TEXT NOT NULL
);
`);

const seedInventory = [
  {
    id: '01',
    name: 'آيفون 15 برو ماكس',
    category: 'إلكترونيات / هواتف',
    sku: 'APP-IP15-PM',
    quantity: 24,
    price: 5200,
    barcode: '123456789',
    status: 'in-stock',
    notes: null,
  },
  {
    id: '02',
    name: 'سماعات سوني WH-1000XM5',
    category: 'إلكترونيات / صوتيات',
    sku: 'SONY-WH5-BLK',
    quantity: 5,
    price: 1400,
    barcode: '987654321',
    status: 'low-stock',
    notes: null,
  },
  {
    id: '03',
    name: 'ماك بوك برو M3',
    category: 'أجهزة / حواسيب',
    sku: 'APP-MBP-M3',
    quantity: 0,
    price: 8500,
    barcode: '456789123',
    status: 'out-of-stock',
    notes: null,
  },
];

const seedPurchaseInvoices = [
  {
    id: 'inv-001',
    invoiceNumber: 'PO-2025-001',
    supplier: 'شركة الرياض للإلكترونيات',
    date: '2025-03-10',
    notes: 'دفعة أولى من طلبية الربع الأول',
    items: [
      { id: 'li-1', name: 'آيفون 15 برو ماكس', quantity: 10, price: 5200, total: 52000 },
      { id: 'li-2', name: 'سماعات سوني WH-1000XM5', quantity: 5, price: 1400, total: 7000 },
    ],
    totalAmount: 59000,
  },
  {
    id: 'inv-002',
    invoiceNumber: 'PO-2025-002',
    supplier: 'مؤسسة النور للتجارة',
    date: '2025-03-18',
    notes: '',
    items: [
      { id: 'li-3', name: 'ماك بوك برو M3', quantity: 3, price: 8500, total: 25500 },
    ],
    totalAmount: 25500,
  },
];

const seedSalesInvoices = [
  {
    id: 'sale-001',
    invoiceNumber: 'SO-2025-001',
    customer: 'أحمد محمد العمري',
    date: '2025-03-15',
    notes: 'عميل منتظم',
    items: [{ id: 'sli-1', inventoryItemId: '01', name: 'آيفون 15 برو ماكس', quantity: 2, price: 5800, total: 11600 }],
    totalAmount: 11600,
  },
  {
    id: 'sale-002',
    invoiceNumber: 'SO-2025-002',
    customer: 'شركة التقنية المتقدمة',
    date: '2025-03-22',
    notes: '',
    items: [{ id: 'sli-2', inventoryItemId: '02', name: 'سماعات سوني WH-1000XM5', quantity: 2, price: 1600, total: 3200 }],
    totalAmount: 3200,
  },
];

const seedWarehouses = [
  {
    id: 'wh-01',
    name: 'المستودع الرئيسي',
    location: 'الرياض – المنطقة الصناعية',
    manager: 'أحمد العمري',
    phone: '0501234567',
    capacity: 1000,
    notes: 'المستودع الرئيسي للبضائع الواردة والصادرة',
    color: 'blue',
  },
  {
    id: 'wh-02',
    name: 'مستودع جدة',
    location: 'جدة – طريق الملك فهد',
    manager: 'سارة المالكي',
    phone: '0557654321',
    capacity: 600,
    notes: 'فرع المنطقة الغربية',
    color: 'green',
  },
  {
    id: 'wh-03',
    name: 'مستودع الإلكترونيات',
    location: 'الرياض – العليا',
    manager: 'خالد الزهراني',
    phone: '0509876543',
    capacity: 300,
    notes: 'مخصص لتخزين الأجهزة الإلكترونية',
    color: 'purple',
  },
];

const seedUsers = [
  {
    id: 'usr-001',
    fullName: 'أحمد محمد العمري',
    email: 'ahmed.omari@almunassiq.com',
    phone: '0501234567',
    role: 'admin',
    status: 'active',
    department: 'تقنية المعلومات',
    createdAt: '2024-01-10',
    lastLogin: '2025-03-29',
    avatar: null,
    notes: 'مدير النظام الرئيسي',
  },
  {
    id: 'usr-002',
    fullName: 'سارة عبدالله المالكي',
    email: 'sara.maliki@almunassiq.com',
    phone: '0557654321',
    role: 'manager',
    status: 'active',
    department: 'الإدارة العامة',
    createdAt: '2024-02-15',
    lastLogin: '2025-03-28',
    avatar: null,
    notes: null,
  },
  {
    id: 'usr-003',
    fullName: 'خالد ناصر الزهراني',
    email: 'khalid.zahrani@almunassiq.com',
    phone: '0509876543',
    role: 'accountant',
    status: 'active',
    department: 'المالية والمحاسبة',
    createdAt: '2024-03-01',
    lastLogin: '2025-03-27',
    avatar: null,
    notes: null,
  },
];

const seedSettings = {
  theme: 'system',
  notifications: true,
  currency: 'SAR',
  locale: 'ar-SA',
};

function seedTable<T>(table: string, rows: T[], columns: string[]) {
  const count = db.prepare(`SELECT COUNT(1) AS count FROM ${table}`).get().count as number;
  if (count > 0) return;

  const placeholders = columns.map(() => '?').join(', ');
  const insert = db.prepare(`INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`);
  const transaction = db.transaction((items: T[]) => {
    for (const item of items) {
      insert.run(Object.values(item));
    }
  });
  transaction(rows);
}

seedTable('inventory_items', seedInventory, ['id', 'name', 'category', 'sku', 'quantity', 'price', 'barcode', 'status', 'notes']);
seedTable('purchase_invoices', seedPurchaseInvoices.map(inv => ({ ...inv, items: JSON.stringify(inv.items) })), ['id', 'invoiceNumber', 'supplier', 'date', 'notes', 'items', 'totalAmount']);
seedTable('sales_invoices', seedSalesInvoices.map(inv => ({ ...inv, items: JSON.stringify(inv.items) })), ['id', 'invoiceNumber', 'customer', 'date', 'notes', 'items', 'totalAmount']);
seedTable('warehouses', seedWarehouses, ['id', 'name', 'location', 'manager', 'phone', 'capacity', 'notes', 'color']);
seedTable('system_users', seedUsers, ['id', 'fullName', 'email', 'phone', 'role', 'status', 'department', 'createdAt', 'lastLogin', 'avatar', 'notes']);

const settingsCount = db.prepare('SELECT COUNT(1) AS count FROM app_settings').get().count as number;
if (settingsCount === 0) {
  db.prepare('INSERT INTO app_settings (id, data) VALUES (1, ?)').run(JSON.stringify(seedSettings));
}

export function parseInvoiceRow(row: any) {
  if (!row) return null;
  return {
    ...row,
    items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items,
  };
}

export { db };
