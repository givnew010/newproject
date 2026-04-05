---
name: backend-setup
description: >
  إعداد بيئة Backend من الصفر لمشروع المُنسق.
  استخدم هذه المهارة عند إنشاء server/index.ts أو server/db.ts لأول مرة،
  أو عند تثبيت حزم الـ Backend، أو إعداد Express + SQLite.
allowed-tools: shell, editFiles, readFile
---

# Backend Setup Skill

## الهدف
إعداد بيئة Express + SQLite + JWT كاملة لمشروع المُنسق.

## الخطوة 1 — التحقق من الحزم المثبتة

```bash
cat package.json | grep -E '"better-sqlite3|zod|cors|bcryptjs|jsonwebtoken"'
```

إذا كانت ناقصة، ثبّتها:
```bash
npm install better-sqlite3 zod cors bcryptjs jsonwebtoken
npm install -D @types/better-sqlite3 @types/bcryptjs @types/jsonwebtoken
```

## الخطوة 2 — إنشاء هيكل المجلدات

```bash
mkdir -p server/middleware server/routes server/schemas
```

## الخطوة 3 — server/db.ts

أنشئ `server/db.ts` بالمحتوى التالي:

```typescript
import Database from 'better-sqlite3';
import path from 'path';
import bcrypt from 'bcryptjs';

const db = new Database(path.join(process.cwd(), 'data.db'));

// تحسينات الأداء
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.pragma('synchronous = NORMAL');

export function createTables(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now'))
    );

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

    CREATE TABLE IF NOT EXISTS warehouses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      location TEXT,
      capacity INTEGER DEFAULT 0,
      color TEXT DEFAULT '#3b82f6',
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

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
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS stock_movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id INTEGER NOT NULL REFERENCES inventory_items(id),
      type TEXT NOT NULL CHECK(type IN ('in','out','adjustment')),
      quantity INTEGER NOT NULL,
      reference_type TEXT CHECK(reference_type IN ('purchase','sale','manual','return','adjustment')),
      reference_id INTEGER,
      balance_after INTEGER,
      note TEXT,
      created_by INTEGER REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now'))
    );

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

    CREATE TABLE IF NOT EXISTS sales_invoice_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL REFERENCES sales_invoices(id) ON DELETE CASCADE,
      item_id INTEGER NOT NULL REFERENCES inventory_items(id),
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      discount_percent REAL DEFAULT 0,
      total REAL NOT NULL
    );

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

    CREATE TABLE IF NOT EXISTS purchase_invoice_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL REFERENCES purchase_invoices(id) ON DELETE CASCADE,
      item_id INTEGER NOT NULL REFERENCES inventory_items(id),
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      discount_percent REAL DEFAULT 0,
      total REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reference_type TEXT NOT NULL CHECK(reference_type IN ('sale','purchase')),
      reference_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      payment_method TEXT DEFAULT 'cash',
      notes TEXT,
      created_by INTEGER REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now'))
    );

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
  `);
}

export function seedData(): void {
  const count = (db.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number }).c;
  if (count > 0) return;

  // مستخدم admin افتراضي
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT INTO users (username, password_hash, full_name, role) VALUES (?, ?, ?, ?)')
    .run('admin', hash, 'مدير النظام', 'admin');

  // إعدادات أولية
  const settings: [string, string][] = [
    ['company_name', 'شركة المُنسق'],
    ['company_address', 'المملكة العربية السعودية'],
    ['tax_number', ''],
    ['default_tax_rate', '15'],
    ['currency', 'SAR'],
    ['invoice_prefix', 'INV'],
    ['po_prefix', 'PO'],
    ['low_stock_threshold', '5'],
  ];
  const ins = db.prepare('INSERT OR IGNORE INTO app_settings (key, value) VALUES (?, ?)');
  settings.forEach(([k, v]) => ins.run(k, v));
}

export function generateInvoiceNumber(type: 'sale' | 'purchase'): string {
  const year = new Date().getFullYear();
  const prefix = type === 'sale' ? 'INV' : 'PO';
  const table = type === 'sale' ? 'sales_invoices' : 'purchase_invoices';
  const last = db.prepare(
    `SELECT invoice_number FROM ${table} WHERE invoice_number LIKE ? ORDER BY id DESC LIMIT 1`
  ).get(`${prefix}-${year}-%`) as { invoice_number: string } | undefined;
  const seq = last ? parseInt(last.invoice_number.split('-')[2]) + 1 : 1;
  return `${prefix}-${year}-${String(seq).padStart(4, '0')}`;
}

export function logAudit(
  userId: number,
  action: string,
  entityType: string,
  entityId: number,
  oldData?: unknown,
  newData?: unknown
): void {
  db.prepare(
    'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_data, new_data) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(userId, action, entityType, entityId, JSON.stringify(oldData ?? null), JSON.stringify(newData ?? null));
}

export default db;
```

## الخطوة 4 — التحقق من tsconfig.json

تأكد أن `tsconfig.json` يحتوي:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "strict": true,
    "esModuleInterop": true,
    "outDir": "./dist",
    "rootDir": "./"
  },
  "include": ["src/**/*", "server/**/*"]
}
```

## الخطوة 5 — package.json scripts

تأكد أن هذه السكريبتات موجودة:
```json
{
  "scripts": {
    "dev": "concurrently \"vite\" \"tsx watch server/index.ts\"",
    "dev:server": "tsx watch server/index.ts",
    "build": "tsc && vite build",
    "start": "node dist/server/index.js"
  }
}
```

إذا `concurrently` غير مثبت:
```bash
npm install -D concurrently
```

## التحقق النهائي
```bash
npx tsx server/db.ts  # اختبار اتصال DB
ls -la data.db        # التحقق من إنشاء الملف
```
