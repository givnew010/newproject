import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

// ─────────────────────────────────────────────────────────────────────────────
// قاعدة البيانات واختبار وجود المجلد
// ─────────────────────────────────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.resolve(__dirname, '../data/database.sqlite');

// إنشاء اتصال قاعدة البيانات
const db = new Database(DB_PATH);

// تحسين الأداء وسلامة البيانات
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ─────────────────────────────────────────────────────────────────────────────
// تهيئة الجداول (المراحل 2-2 حتى 2-10)
// ─────────────────────────────────────────────────────────────────────────────
export function initializeDatabase(): void {
  createTables();
  seedData();

  console.log('✅ قاعدة البيانات جاهزة:', DB_PATH);
}

// 2-2 users
function createUsersTable(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      username      TEXT    NOT NULL UNIQUE,
      password_hash TEXT    NOT NULL,
      full_name     TEXT    NOT NULL,
      role          TEXT    NOT NULL DEFAULT 'sales'
                    CHECK(role IN ('admin', 'accountant', 'sales', 'warehouse')),
      is_active     INTEGER NOT NULL DEFAULT 1,
      created_at    TEXT    NOT NULL DEFAULT (datetime('now', 'localtime')),
      last_login    TEXT
    )
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_username
    ON users(username)
  `);
}

// 2-4 warehouses
function createWarehousesTable(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS warehouses (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      name         TEXT    NOT NULL UNIQUE,
      location     TEXT,
      capacity     REAL    NOT NULL DEFAULT 0,
      manager_name TEXT,
      phone        TEXT,
      color        TEXT    NOT NULL DEFAULT '#3b82f6',
      description  TEXT,
      is_active    INTEGER NOT NULL DEFAULT 1,
      created_at   TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
    )
  `);
}

// 2-3 inventory_items
function createInventoryItemsTable(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS inventory_items (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      name          TEXT    NOT NULL,
      sku           TEXT    NOT NULL UNIQUE,
      barcode       TEXT    UNIQUE,
      category      TEXT    NOT NULL DEFAULT 'عام',
      unit          TEXT    NOT NULL DEFAULT 'قطعة',
      quantity      REAL    NOT NULL DEFAULT 0,
      min_quantity  REAL    NOT NULL DEFAULT 5,
      cost_price    REAL    NOT NULL DEFAULT 0,
      selling_price REAL    NOT NULL DEFAULT 0,
      warehouse_id  INTEGER REFERENCES warehouses(id) ON DELETE SET NULL,
      description   TEXT,
      is_active     INTEGER NOT NULL DEFAULT 1,
      created_at    TEXT    NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at    TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
    )
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_inventory_sku      ON inventory_items(sku);
    CREATE INDEX IF NOT EXISTS idx_inventory_barcode  ON inventory_items(barcode);
    CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory_items(category);
    CREATE INDEX IF NOT EXISTS idx_inventory_warehouse ON inventory_items(warehouse_id);
  `);

  db.exec(`
    CREATE TRIGGER IF NOT EXISTS trg_inventory_updated_at
    AFTER UPDATE ON inventory_items
    BEGIN
      UPDATE inventory_items
      SET updated_at = datetime('now', 'localtime')
      WHERE id = NEW.id;
    END
  `);
}

// 2-5 customers
function createCustomersTable(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      name         TEXT    NOT NULL,
      phone        TEXT,
      email        TEXT,
      address      TEXT,
      tax_number   TEXT,
      credit_limit REAL    NOT NULL DEFAULT 0,
      balance      REAL    NOT NULL DEFAULT 0,
      notes        TEXT,
      is_active    INTEGER NOT NULL DEFAULT 1,
      created_at   TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
    )
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_customers_name  ON customers(name);
    CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
  `);
}

// 2-5 suppliers
function createSuppliersTable(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS suppliers (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      name           TEXT    NOT NULL,
      phone          TEXT,
      email          TEXT,
      address        TEXT,
      contact_person TEXT,
      tax_number     TEXT,
      payment_terms  TEXT    NOT NULL DEFAULT 'فوري'
                     CHECK(payment_terms IN ('فوري', 'أسبوعي', 'شهري', 'ثلاثة أشهر')),
      balance        REAL    NOT NULL DEFAULT 0,
      notes          TEXT,
      is_active      INTEGER NOT NULL DEFAULT 1,
      created_at     TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
    )
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);
  `);
}

// 2-6 sales invoices
function createSalesInvoicesTables(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS sales_invoices (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_number   TEXT    NOT NULL UNIQUE,
      customer_id      INTEGER REFERENCES customers(id) ON DELETE SET NULL,
      date             TEXT    NOT NULL DEFAULT (date('now', 'localtime')),
      due_date         TEXT,
      status           TEXT    NOT NULL DEFAULT 'confirmed'
                       CHECK(status IN ('draft','confirmed','paid','partial','cancelled')),
      payment_type     TEXT    NOT NULL DEFAULT 'cash'
                       CHECK(payment_type IN ('cash','credit','partial')),
      subtotal         REAL    NOT NULL DEFAULT 0,
      discount_amount  REAL    NOT NULL DEFAULT 0,
      tax_rate         REAL    NOT NULL DEFAULT 15,
      tax_amount       REAL    NOT NULL DEFAULT 0,
      total            REAL    NOT NULL DEFAULT 0,
      paid_amount      REAL    NOT NULL DEFAULT 0,
      notes            TEXT,
      created_by       INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at       TEXT    NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at       TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS sales_invoice_items (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id  INTEGER NOT NULL REFERENCES sales_invoices(id) ON DELETE CASCADE,
      item_id     INTEGER NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
      quantity    REAL    NOT NULL,
      unit_price  REAL    NOT NULL,
      discount    REAL    NOT NULL DEFAULT 0,
      total       REAL    NOT NULL
    )
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_sales_invoices_customer ON sales_invoices(customer_id);
    CREATE INDEX IF NOT EXISTS idx_sales_invoices_date     ON sales_invoices(date);
    CREATE INDEX IF NOT EXISTS idx_sales_invoices_status   ON sales_invoices(status);
    CREATE INDEX IF NOT EXISTS idx_sales_items_invoice     ON sales_invoice_items(invoice_id);
    CREATE INDEX IF NOT EXISTS idx_sales_items_item        ON sales_invoice_items(item_id);
  `);

  db.exec(`
    CREATE TRIGGER IF NOT EXISTS trg_sales_invoices_updated_at
    AFTER UPDATE ON sales_invoices
    BEGIN
      UPDATE sales_invoices
      SET updated_at = datetime('now', 'localtime')
      WHERE id = NEW.id;
    END
  `);
}

// 2-7 purchase invoices
function createPurchaseInvoicesTables(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS purchase_invoices (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_number   TEXT    NOT NULL UNIQUE,
      supplier_id      INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
      date             TEXT    NOT NULL DEFAULT (date('now', 'localtime')),
      due_date         TEXT,
      status           TEXT    NOT NULL DEFAULT 'confirmed'
                       CHECK(status IN ('draft','confirmed','paid','partial','cancelled')),
      payment_type     TEXT    NOT NULL DEFAULT 'cash'
                       CHECK(payment_type IN ('cash','credit','partial')),
      subtotal         REAL    NOT NULL DEFAULT 0,
      discount_amount  REAL    NOT NULL DEFAULT 0,
      tax_rate         REAL    NOT NULL DEFAULT 15,
      tax_amount       REAL    NOT NULL DEFAULT 0,
      total            REAL    NOT NULL DEFAULT 0,
      paid_amount      REAL    NOT NULL DEFAULT 0,
      notes            TEXT,
      created_by       INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at       TEXT    NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at       TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS purchase_invoice_items (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id  INTEGER NOT NULL REFERENCES purchase_invoices(id) ON DELETE CASCADE,
      item_id     INTEGER NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
      quantity    REAL    NOT NULL,
      unit_price  REAL    NOT NULL,
      discount    REAL    NOT NULL DEFAULT 0,
      total       REAL    NOT NULL
    )
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_purchase_invoices_supplier ON purchase_invoices(supplier_id);
    CREATE INDEX IF NOT EXISTS idx_purchase_invoices_date     ON purchase_invoices(date);
    CREATE INDEX IF NOT EXISTS idx_purchase_invoices_status   ON purchase_invoices(status);
    CREATE INDEX IF NOT EXISTS idx_purchase_items_invoice     ON purchase_invoice_items(invoice_id);
  `);

  db.exec(`
    CREATE TRIGGER IF NOT EXISTS trg_purchase_invoices_updated_at
    AFTER UPDATE ON purchase_invoices
    BEGIN
      UPDATE purchase_invoices
      SET updated_at = datetime('now', 'localtime')
      WHERE id = NEW.id;
    END
  `);
}

// 2-8 payments
function createPaymentsTable(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS payments (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      type             TEXT    NOT NULL
                       CHECK(type IN ('sales', 'purchase')),
      invoice_id       INTEGER NOT NULL,
      amount           REAL    NOT NULL,
      payment_date     TEXT    NOT NULL DEFAULT (date('now', 'localtime')),
      payment_method   TEXT    NOT NULL DEFAULT 'cash'
                       CHECK(payment_method IN ('cash','bank','check','transfer')),
      reference_number TEXT,
      notes            TEXT,
      created_by       INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at       TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
    )
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_payments_type_invoice
    ON payments(type, invoice_id)
  `);
}

// 2-9 returns
function createReturnsTable(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS sales_returns (
      id                  INTEGER PRIMARY KEY AUTOINCREMENT,
      original_invoice_id INTEGER NOT NULL REFERENCES sales_invoices(id) ON DELETE RESTRICT,
      customer_id         INTEGER REFERENCES customers(id) ON DELETE SET NULL,
      return_date         TEXT    NOT NULL DEFAULT (date('now', 'localtime')),
      reason              TEXT,
      total               REAL    NOT NULL DEFAULT 0,
      status              TEXT    NOT NULL DEFAULT 'confirmed'
                          CHECK(status IN ('draft', 'confirmed')),
      created_by          INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at          TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS sales_return_items (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      return_id   INTEGER NOT NULL REFERENCES sales_returns(id) ON DELETE CASCADE,
      item_id     INTEGER NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
      quantity    REAL    NOT NULL,
      unit_price  REAL    NOT NULL,
      total       REAL    NOT NULL
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS purchase_returns (
      id                  INTEGER PRIMARY KEY AUTOINCREMENT,
      original_invoice_id INTEGER NOT NULL REFERENCES purchase_invoices(id) ON DELETE RESTRICT,
      supplier_id         INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
      return_date         TEXT    NOT NULL DEFAULT (date('now', 'localtime')),
      reason              TEXT,
      total               REAL    NOT NULL DEFAULT 0,
      status              TEXT    NOT NULL DEFAULT 'confirmed'
                          CHECK(status IN ('draft', 'confirmed')),
      created_by          INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at          TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS purchase_return_items (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      return_id   INTEGER NOT NULL REFERENCES purchase_returns(id) ON DELETE CASCADE,
      item_id     INTEGER NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
      quantity    REAL    NOT NULL,
      unit_price  REAL    NOT NULL,
      total       REAL    NOT NULL
    )
  `);
}

// stock_movements
function createStockMovementsTable(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS stock_movements (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id          INTEGER NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
      type             TEXT    NOT NULL
                       CHECK(type IN ('in', 'out', 'adjustment')),
      quantity         REAL    NOT NULL,
      balance_after    REAL    NOT NULL,
      reference_type   TEXT
                       CHECK(reference_type IN ('purchase','sale','return','manual', NULL)),
      reference_id     INTEGER,
      note             TEXT,
      created_by       INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at       TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
    )
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_movements_item    ON stock_movements(item_id);
    CREATE INDEX IF NOT EXISTS idx_movements_date    ON stock_movements(created_at);
    CREATE INDEX IF NOT EXISTS idx_movements_ref     ON stock_movements(reference_type, reference_id);
  `);
}

// 2-10 settings
function createSettingsTable(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key        TEXT PRIMARY KEY,
      value      TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    )
  `);
}

// audit_logs
function createAuditLogsTable(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
      action      TEXT    NOT NULL
                  CHECK(action IN ('create', 'update', 'delete')),
      entity_type TEXT    NOT NULL,
      entity_id   INTEGER NOT NULL,
      old_data    TEXT,
      new_data    TEXT,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
    )
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id);
    CREATE INDEX IF NOT EXISTS idx_audit_user   ON audit_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_date   ON audit_logs(created_at);
  `);
}

// seed data and helpers
function seedDefaultData(): void {
  seedAdminUser();
  seedDefaultSettings();
  seedDefaultWarehouse();
}

function seedAdminUser(): void {
  const exists = db
    .prepare('SELECT id FROM users WHERE username = ?')
    .get('admin');

  if (!exists) {
    db.prepare(`
      INSERT INTO users (username, password_hash, full_name, role)
      VALUES (?, ?, ?, ?)
    `).run(
      'admin',
      '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
      'مدير النظام',
      'admin'
    );
    console.log('👤 تم إنشاء المستخدم الافتراضي: admin / admin123');
  }
}

function seedDefaultSettings(): void {
  const defaults: Record<string, string> = {
    company_name:          'شركتي للتجارة',
    company_address:       'المملكة العربية السعودية',
    company_phone:         '',
    company_email:         '',
    tax_number:            '',
    default_tax_rate:      '15',
    currency:              'SAR',
    currency_symbol:       'ر.س',
    sales_invoice_prefix:  'INV',
    purchase_invoice_prefix: 'PO',
    low_stock_threshold:   '5',
    fiscal_year_start:     '01-01',
    date_format:           'DD/MM/YYYY'
  };

  const insertSetting = db.prepare(`
    INSERT OR IGNORE INTO settings (key, value)
    VALUES (?, ?)
  `);

  const insertMany = db.transaction(() => {
    for (const [key, value] of Object.entries(defaults)) {
      insertSetting.run(key, value);
    }
  });

  insertMany();
}

function seedDefaultWarehouse(): void {
  const exists = db
    .prepare('SELECT id FROM warehouses WHERE name = ?')
    .get('المخزن الرئيسي');

  if (!exists) {
    db.prepare(`
      INSERT INTO warehouses (name, location, manager_name, phone, color)
      VALUES (?, ?, ?, ?, ?)
    `).run('المخزن الرئيسي', 'الموقع الرئيسي', 'مدير المخزن', '', '#3b82f6');
  }
}

// تُنشِئ كافة الجداول بدون إجراء seed
export function createTables(): void {
  createUsersTable();
  createWarehousesTable();
  createInventoryItemsTable();
  createCustomersTable();
  createSuppliersTable();
  createSalesInvoicesTables();
  createPurchaseInvoicesTables();
  createPaymentsTable();
  createReturnsTable();
  createStockMovementsTable();
  createSettingsTable();
  createAuditLogsTable();
}

// تقوم بإضافة بيانات افتراضية (admin، إعدادات، مخزن افتراضي)
export function seedData(): void {
  seedDefaultData();
}

/**
 * توليد رقم فاتورة مركزي (sales | purchase)
 */
export function generateInvoiceNumber(type: 'sales' | 'purchase' = 'sales'): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');

  const salesPrefixRow = db.prepare("SELECT value FROM settings WHERE key = ?").get('sales_invoice_prefix') as { value?: string } | undefined;
  const purchasePrefixRow = db.prepare("SELECT value FROM settings WHERE key = ?").get('purchase_invoice_prefix') as { value?: string } | undefined;

  const salesPrefix = (salesPrefixRow && salesPrefixRow.value) ? salesPrefixRow.value : 'INV';
  const purchasePrefix = (purchasePrefixRow && purchasePrefixRow.value) ? purchasePrefixRow.value : 'PO';

  if (type === 'sales') {
    const prefix = `${salesPrefix}-${year}${month}-`;
    const last = db.prepare(`
      SELECT invoice_number FROM sales_invoices WHERE invoice_number LIKE ? ORDER BY id DESC LIMIT 1
    `).get(`${prefix}%`) as { invoice_number?: string } | undefined;

    let next = 1;
    if (last && last.invoice_number) {
      const parts = last.invoice_number.split('-');
      const num = parseInt(parts[2] ?? '0', 10);
      if (!Number.isNaN(num)) next = num + 1;
    }

    return `${prefix}${String(next).padStart(3, '0')}`;
  }

  const prefix = `${purchasePrefix}-${year}${month}-`;
  const last = db.prepare(`
    SELECT invoice_number FROM purchase_invoices WHERE invoice_number LIKE ? ORDER BY id DESC LIMIT 1
  `).get(`${prefix}%`) as { invoice_number?: string } | undefined;

  let next = 1;
  if (last && last.invoice_number) {
    const parts = last.invoice_number.split('-');
    const num = parseInt(parts[2] ?? '0', 10);
    if (!Number.isNaN(num)) next = num + 1;
  }

  return `${prefix}${String(next).padStart(3, '0')}`;
}

export { db };
export default db;
