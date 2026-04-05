---
applyTo: "server/db.ts"
---

# تعليمات قاعدة البيانات (SQLite Schema)

## الجداول المطلوبة — مرجع كامل

### الجداول الأساسية (server/db.ts)
عند كتابة أو تعديل `server/db.ts`، يجب أن تحتوي `createTables()` على هذه الجداول بالترتيب الصحيح:

```sql
-- 1. إعدادات النظام
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 2. المستخدمون
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT DEFAULT 'cashier' CHECK(role IN ('admin','cashier','viewer')),
  is_active INTEGER DEFAULT 1,
  last_login TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 3. المخازن
CREATE TABLE IF NOT EXISTS warehouses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  location TEXT,
  capacity INTEGER DEFAULT 0,
  color TEXT DEFAULT '#3b82f6',
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 4. الأصناف
CREATE TABLE IF NOT EXISTS inventory_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  sku TEXT UNIQUE,
  barcode TEXT UNIQUE,
  category TEXT,
  unit TEXT DEFAULT 'قطعة',
  cost_price REAL DEFAULT 0,
  selling_price REAL DEFAULT 0,
  quantity INTEGER DEFAULT 0,
  min_quantity INTEGER DEFAULT 5,
  warehouse_id INTEGER REFERENCES warehouses(id),
  description TEXT,
  image_url TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 5. حركات المخزون
CREATE TABLE IF NOT EXISTS stock_movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id INTEGER NOT NULL REFERENCES inventory_items(id),
  type TEXT NOT NULL CHECK(type IN ('in','out','adjustment')),
  quantity INTEGER NOT NULL,
  reference_type TEXT CHECK(reference_type IN ('purchase','sale','manual','return','adjustment')),
  reference_id INTEGER,
  note TEXT,
  balance_after INTEGER,
  created_by INTEGER REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now'))
);

-- 6. العملاء
CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  tax_number TEXT,
  credit_limit REAL DEFAULT 0,
  balance REAL DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 7. الموردون
CREATE TABLE IF NOT EXISTS suppliers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  tax_number TEXT,
  balance REAL DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 8. فواتير المبيعات
CREATE TABLE IF NOT EXISTS sales_invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_number TEXT UNIQUE NOT NULL,
  customer_id INTEGER REFERENCES customers(id),
  status TEXT DEFAULT 'confirmed' CHECK(status IN ('draft','confirmed','paid','partial','cancelled')),
  payment_type TEXT DEFAULT 'cash' CHECK(payment_type IN ('cash','credit','bank')),
  subtotal REAL DEFAULT 0,
  discount_amount REAL DEFAULT 0,
  tax_rate REAL DEFAULT 15,
  tax_amount REAL DEFAULT 0,
  total REAL DEFAULT 0,
  paid_amount REAL DEFAULT 0,
  date TEXT DEFAULT (date('now')),
  due_date TEXT,
  notes TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now'))
);

-- 9. بنود فواتير المبيعات
CREATE TABLE IF NOT EXISTS sales_invoice_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_id INTEGER NOT NULL REFERENCES sales_invoices(id) ON DELETE CASCADE,
  item_id INTEGER NOT NULL REFERENCES inventory_items(id),
  quantity INTEGER NOT NULL,
  unit_price REAL NOT NULL,
  discount_percent REAL DEFAULT 0,
  total REAL NOT NULL
);

-- 10. فواتير المشتريات
CREATE TABLE IF NOT EXISTS purchase_invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_number TEXT UNIQUE NOT NULL,
  supplier_id INTEGER REFERENCES suppliers(id),
  status TEXT DEFAULT 'confirmed' CHECK(status IN ('draft','confirmed','paid','partial','cancelled')),
  payment_type TEXT DEFAULT 'cash' CHECK(payment_type IN ('cash','credit','bank')),
  subtotal REAL DEFAULT 0,
  discount_amount REAL DEFAULT 0,
  tax_rate REAL DEFAULT 15,
  tax_amount REAL DEFAULT 0,
  total REAL DEFAULT 0,
  paid_amount REAL DEFAULT 0,
  date TEXT DEFAULT (date('now')),
  due_date TEXT,
  notes TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now'))
);

-- 11. بنود فواتير المشتريات
CREATE TABLE IF NOT EXISTS purchase_invoice_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_id INTEGER NOT NULL REFERENCES purchase_invoices(id) ON DELETE CASCADE,
  item_id INTEGER NOT NULL REFERENCES inventory_items(id),
  quantity INTEGER NOT NULL,
  unit_price REAL NOT NULL,
  discount_percent REAL DEFAULT 0,
  total REAL NOT NULL
);

-- 12. المدفوعات
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference_type TEXT NOT NULL CHECK(reference_type IN ('sale','purchase')),
  reference_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  payment_method TEXT DEFAULT 'cash' CHECK(payment_method IN ('cash','bank','other')),
  notes TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now'))
);

-- 13. سجل العمليات
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id INTEGER,
  old_data TEXT,
  new_data TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
```

## البيانات الأولية (Seed Data)
```typescript
export function seedData() {
  // تحقق إذا كانت البيانات موجودة مسبقاً
  const userCount = (db.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number }).c;
  if (userCount > 0) return;

  // إنشاء مستخدم admin افتراضي
  const bcrypt = require('bcryptjs');
  const adminHash = bcrypt.hashSync('admin123', 10);
  db.prepare(`INSERT INTO users (username, password_hash, full_name, role) VALUES (?, ?, ?, ?)`)
    .run('admin', adminHash, 'مدير النظام', 'admin');

  // إعدادات افتراضية
  const settings = [
    ['company_name', 'شركة المُنسق'],
    ['company_address', 'المملكة العربية السعودية'],
    ['tax_number', ''],
    ['default_tax_rate', '15'],
    ['currency', 'SAR'],
    ['invoice_prefix', 'INV'],
    ['po_prefix', 'PO'],
    ['low_stock_threshold', '5'],
    ['fiscal_year_start', '01-01'],
  ];
  const insertSetting = db.prepare('INSERT OR IGNORE INTO app_settings (key, value) VALUES (?, ?)');
  settings.forEach(([k, v]) => insertSetting.run(k, v));
}
```

## دالة توليد رقم الفاتورة
```typescript
export function generateInvoiceNumber(type: 'sale' | 'purchase'): string {
  const year = new Date().getFullYear();
  const prefix = type === 'sale' ? 'INV' : 'PO';
  const table = type === 'sale' ? 'sales_invoices' : 'purchase_invoices';
  const pattern = `${prefix}-${year}-%`;
  const last = db.prepare(`SELECT invoice_number FROM ${table} WHERE invoice_number LIKE ? ORDER BY id DESC LIMIT 1`).get(pattern) as { invoice_number: string } | undefined;
  const seq = last ? parseInt(last.invoice_number.split('-')[2]) + 1 : 1;
  return `${prefix}-${year}-${String(seq).padStart(4, '0')}`;
}
```
