# خطة إكمال مشروع المُنسق — مفصّلة

## المرحلة 1 — إعداد بيئة الـ Backend
*تجهيز المشروع لاستقبال Express + SQLite*

### تجهيز الحزم والهيكل

#### 1-1: تثبيت حزم الـ Backend المطلوبة
- موجز: تثبيت better-sqlite3, zod, cors, bcryptjs, jsonwebtoken عبر npm
- الأولوية: عاجل
- الوقت المقدر: 30 دقيقة
- الملفات المتأثرة:
  - `package.json`
- خطوات:
  1. تشغيل: `npm install better-sqlite3 zod cors bcryptjs jsonwebtoken`
  2. تثبيت أنواع TypeScript: `npm install -D @types/better-sqlite3 @types/bcryptjs @types/jsonwebtoken`
  3. التأكد أن express و `@types/express` موجودان (هما موجودان بالفعل في package.json)
  4. إضافة tsx إلى devDependencies إذا لم يكن موجوداً (موجود بالفعل)
- ملاحظة: express موجود بالفعل في المشروع، فقط نضيف ما ينقص

#### 1-2: إعداد هيكل مجلد server/
- موجز: تنظيم ملفات الـ Backend داخل مجلد server/ بطريقة منظمة
- الأولوية: عاجل
- الوقت المقدر: 30 دقيقة
- الملفات المتأثرة:
  - `server/index.ts`
  - `server/db.ts`
  - `server/routes/`
  - `server/middleware/`
  - `server/schemas/`
  - `server/types.ts`
- خطوات:
  1. إنشاء: `server/index.ts` — نقطة دخول Express
  2. إنشاء: `server/db.ts` — إعداد اتصال SQLite وتصدير الـ db instance
  3. إنشاء: `server/middleware/` — مجلد للـ middlewares (auth, errorHandler)
  4. إنشاء: `server/routes/` — مجلد لكل مجموعة routes
  5. إنشاء: `server/schemas/` — ملفات Zod للتحقق من البيانات
  6. إنشاء: `server/types.ts` — أنواع TypeScript المشتركة

#### 1-3: إعداد نقطة دخول Express الرئيسية (server/index.ts)
- موجز: كتابة الملف الرئيسي الذي يشغّل الـ server على port منفصل
- الأولوية: عاجل
- الوقت المقدر: 1 ساعة
- الملفات المتأثرة:
  - `server/index.ts`
  - `package.json`
- خطوات:
  1. استيراد express, cors, والـ routes كلها
  2. تفعيل cors مع `origin: http://localhost:5000` (Vite port)
  3. استخدام `express.json()` و `express.urlencoded()`
  4. تسجيل جميع الـ routes تحت prefix `/api/v1/`
  5. إضافة error handler middleware في النهاية
  6. تشغيل السيرفر على port `3001`
  7. إضافة script في package.json: `"server": "tsx watch server/index.ts"`
- ملاحظة: Vite يعمل على 5000، Express على 3001، نضيف proxy في vite.config.ts

#### 1-4: إعداد Vite Proxy لتوجيه طلبات /api إلى Express
- موجز: تعديل vite.config.ts لتوجيه كل طلبات /api إلى Express تلقائياً
- الأولوية: عاجل
- الوقت المقدر: 15 دقيقة
- الملفات المتأثرة:
  - `vite.config.ts`
- خطوات:
  1. فتح `vite.config.ts` وإضافة قسم `server.proxy`
  2. إضافة: `proxy: { "/api": { target: "http://localhost:3001", changeOrigin: true } }`
  3. هكذا الـ Frontend يكتب `fetch("/api/v1/...")` وتصل لـ Express تلقائياً
  4. اختبار الـ proxy بطلب بسيط `GET /api/v1/health`

## المرحلة 2 — قاعدة البيانات SQLite
*إنشاء جميع الجداول وعلاقاتها*

### إعداد الاتصال والجداول الأساسية

#### 2-1: إعداد اتصال SQLite وإنشاء ملف db.ts
- موجز: كتابة ملف الاتصال بقاعدة البيانات مع تفعيل WAL mode
- الأولوية: عاجل
- الوقت المقدر: 30 دقيقة
- الملفات المتأثرة:
  - `server/db.ts`
  - `data/database.sqlite`
- خطوات:
  1. استيراد `Database` من `better-sqlite3`
  2. إنشاء ملف: `data/database.sqlite` (تلقائياً عند أول تشغيل)
  3. تفعيل WAL mode: `db.pragma("journal_mode = WAL")` لتحسين الأداء
  4. تفعيل Foreign Keys: `db.pragma("foreign_keys = ON")`
  5. تصدير الـ `db` instance للاستخدام في كل الـ routes

#### 2-2: إنشاء جدول users (المستخدمون)
- موجز: جدول المستخدمين مع الأدوار والصلاحيات
- الأولوية: عاجل
- الوقت المقدر: 20 دقيقة
- الملفات المتأثرة:
  - `server/db.ts`
- خطوات:
  1. `CREATE TABLE users`: `id` (INTEGER PK), `username`, `password_hash`, `full_name`
  2. إضافة حقل: `role TEXT` (`admin | accountant | sales | warehouse`)
  3. إضافة: `is_active INTEGER DEFAULT 1`
  4. إضافة: `created_at`, `last_login TEXT`
  5. إضافة `unique constraint` على `username`
  6. إدخال مستخدم `admin` افتراضي (`admin/admin123`) كـ seed data

#### 2-3: إنشاء جدول inventory_items (الأصناف)
- موجز: جدول الأصناف مطابق للنوع InventoryItem الموجود في `src/types.ts` مع إضافات
- الأولوية: عاجل
- الوقت المقدر: 20 دقيقة
- الملفات المتأثرة:
  - `server/db.ts`
- خطوات:
  1. `CREATE TABLE inventory_items`: `id`, `name`, `sku` (رقم الصنف), `barcode`
  2. إضافة: `category`, `unit` (قطعة/كيلو/كرتون), `quantity REAL`
  3. إضافة: `min_quantity REAL` (حد التنبيه), `cost_price REAL`, `selling_price REAL`
  4. إضافة: `warehouse_id INTEGER REFERENCES warehouses(id)`
  5. إضافة: `description`, `is_active`, `created_at`, `updated_at`
  6. إنشاء `index` على: `sku`, `barcode`, `category` لتسريع البحث

#### 2-4: إنشاء جدول warehouses (المخازن)
- موجز: جدول المخازن مطابق للنوع الموجود في المشروع
- الأولوية: عاجل
- الوقت المقدر: 15 دقيقة
- الملفات المتأثرة:
  - `server/db.ts`
- خطوات:
  1. `CREATE TABLE warehouses`: `id`, `name`, `location`, `capacity REAL`
  2. إضافة: `manager_name`, `phone`, `is_active`, `created_at`
  3. إضافة: `color TEXT` (للـ UI)، `description TEXT`

#### 2-5: إنشاء جدولَي customers و suppliers
- موجز: جداول العملاء والموردين كأساس للفواتير
- الأولوية: عاجل
- الوقت المقدر: 25 دقيقة
- الملفات المتأثرة:
  - `server/db.ts`
- خطوات:
  1. `CREATE TABLE customers`: `id`, `name`, `phone`, `email`, `address`
  2. إضافة للعملاء: `credit_limit REAL DEFAULT 0`, `balance REAL DEFAULT 0`
  3. إضافة للعملاء: `tax_number`, `notes`, `is_active`, `created_at`
  4. `CREATE TABLE suppliers`: `id`, `name`, `phone`, `email`, `address`, `contact_person`
  5. إضافة للموردين: `payment_terms TEXT` (يومي/أسبوعي/شهري), `balance REAL DEFAULT 0`
  6. إضافة للموردين: `tax_number`, `notes`, `is_active`, `created_at`

### جداول الفواتير والمدفوعات

#### 2-6: إنشاء جداول فواتير المبيعات
- موجز: جدولان: رأس الفاتورة + بنود الفاتورة
- الأولوية: عاجل
- الوقت المقدر: 25 دقيقة
- الملفات المتأثرة:
  - `server/db.ts`
- خطوات:
  1. `CREATE TABLE sales_invoices`: `id`, `invoice_number` (فريد), `customer_id FK`
  2. إضافة: `date TEXT`, `due_date TEXT`, `status` (`draft|confirmed|paid|partial|cancelled`)
  3. إضافة: `payment_type` (`cash|credit|partial`), `subtotal`, `discount_amount`
  4. إضافة: `tax_rate REAL DEFAULT 15`, `tax_amount`, `total`, `paid_amount`, `notes`
  5. إضافة: `created_by FK users(id)`, `created_at`, `updated_at`
  6. `CREATE TABLE sales_invoice_items`: `id`, `invoice_id FK`, `item_id FK`
  7. إضافة للبنود: `quantity REAL`, `unit_price REAL`, `discount REAL DEFAULT 0`, `total REAL`
  8. إنشاء `trigger` لتحديث `updated_at` تلقائياً

#### 2-7: إنشاء جداول فواتير المشتريات
- موجز: بنفس هيكل فواتير المبيعات مع خصوصية المشتريات
- الأولوية: عاجل
- الوقت المقدر: 20 دقيقة
- الملفات المتأثرة:
  - `server/db.ts`
- خطوات:
  1. `CREATE TABLE purchase_invoices`: `id`, `invoice_number`, `supplier_id FK`
  2. إضافة: `date`, `due_date`, `status`, `payment_type`, `subtotal`, `discount_amount`
  3. إضافة: `tax_rate`, `tax_amount`, `total`, `paid_amount`, `notes`
  4. إضافة: `created_by FK`, `created_at`, `updated_at`
  5. `CREATE TABLE purchase_invoice_items`: `id`, `invoice_id FK`, `item_id FK`
  6. إضافة للبنود: `quantity REAL`, `unit_price REAL`, `discount REAL`, `total REAL`

#### 2-8: إنشاء جدول المدفوعات (payments)
- موجز: تتبع كل دفعة مرتبطة بفاتورة بيع أو شراء
- الأولوية: عاجل
- الوقت المقدر: 20 دقيقة
- الملفات المتأثرة:
  - `server/db.ts`
- خطوات:
  1. `CREATE TABLE payments`: `id`, `type` (`sales|purchase`)
  2. إضافة: `invoice_id INTEGER`, `amount REAL`, `payment_date TEXT`
  3. إضافة: `payment_method` (`cash|bank|check`), `reference_number`, `notes`
  4. إضافة: `created_by FK users(id)`, `created_at`
  5. إنشاء `index` على `(type, invoice_id)` للبحث السريع

#### 2-9: إنشاء جداول المرتجعات (returns)
- موجز: جداول لمرتجعات المبيعات والمشتريات
- الأولوية: مهمة
- الوقت المقدر: 20 دقيقة
- الملفات المتأثرة:
  - `server/db.ts`
- خطوات:
  1. `CREATE TABLE sales_returns`: `id`, `original_invoice_id FK`, `customer_id FK`
  2. إضافة: `return_date`, `reason`, `total`, `status` (`draft|confirmed`)
  3. `CREATE TABLE sales_return_items`: `id`, `return_id FK`, `item_id FK`, `quantity`, `unit_price`, `total`
  4. `CREATE TABLE purchase_returns`: `id`, `original_invoice_id FK`, `supplier_id FK`
  5. `CREATE TABLE purchase_return_items`: `id`, `return_id FK`, `item_id FK`, `quantity`, `unit_price`, `total`

#### 2-10: إنشاء جدول الإعدادات (settings)
- موجز: جدول key-value لإعدادات النظام
- الأولوية: عاجل
- الوقت المقدر: 15 دقيقة
- الملفات المتأثرة:
  - `server/db.ts`
- خطوات:
  1. `CREATE TABLE settings`: `key TEXT PRIMARY KEY`, `value TEXT`
  2. إدخال قيم افتراضية: `company_name`, `company_address`, `tax_number`
  3. إضافة: `default_tax_rate=15`, `currency=SAR`, `invoice_prefix=INV`
  4. إضافة: `low_stock_threshold=5`, `fiscal_year_start`

## المرحلة 3 — Backend API: Authentication
*نظام تسجيل الدخول والصلاحيات*

### إنشاء Auth Routes

#### 3-1: كتابة POST /api/v1/auth/login
- موجز: endpoint تسجيل الدخول يعيد JWT token
- الأولوية: عاجل
- الوقت المقدر: 1 ساعة
- الملفات المتأثرة:
  - `server/routes/auth.ts`
- خطوات:
  1. قراءة `username` و `password` من request body
  2. التحقق بـ Zod: `{ username: z.string().min(1), password: z.string().min(6) }`
  3. البحث عن المستخدم في قاعدة البيانات بالـ `username`
  4. مقارنة الباسورد بـ `bcrypt.compare()`
  5. إنشاء JWT token يحتوي: `{ userId, username, role }` مع expiry 24h
  6. إعادة: `{ token, user: { id, username, fullName, role } }`
  7. في حالة الخطأ: إعادة 401 Unauthorized

#### 3-2: كتابة GET /api/v1/auth/me
- موجز: endpoint للتحقق من صحة الـ token وإعادة بيانات المستخدم الحالي
- الأولوية: عاجل
- الوقت المقدر: 30 دقيقة
- الملفات المتأثرة:
  - `server/routes/auth.ts`
- خطوات:
  1. قراءة Authorization header: `Bearer <token>`
  2. التحقق من صحة الـ JWT بـ `jwt.verify()`
  3. البحث عن المستخدم في قاعدة البيانات
  4. إعادة بيانات المستخدم (بدون `password_hash`)
  5. تحديث حقل `last_login`

#### 3-3: كتابة Auth Middleware (verifyToken)
- موجز: middleware يحمي جميع الـ routes ويتحقق من الـ JWT
- الأولوية: عاجل
- الوقت المقدر: 30 دقيقة
- الملفات المتأثرة:
  - `server/middleware/auth.ts`
- خطوات:
  1. إنشاء `server/middleware/auth.ts`
  2. استخراج token من Authorization header
  3. التحقق منه بـ `jwt.verify()` وإضافة `req.user` للـ request
  4. في حالة عدم وجود token: إعادة 401
  5. في حالة token منتهي: إعادة 401 مع رسالة "انتهت الجلسة"
  6. إنشاء `checkRole(...roles)` middleware للتحقق من الصلاحية

#### 3-4: CRUD إدارة المستخدمين (admin فقط)
- موجز: endpoints إدارة المستخدمين للمدير فقط
- الأولوية: عاجل
- الوقت المقدر: 1 ساعة
- الملفات المتأثرة:
  - `server/routes/users.ts`
- خطوات:
  1. `GET /api/v1/users` — قائمة المستخدمين (admin only)
  2. `POST /api/v1/users` — إنشاء مستخدم جديد مع bcrypt للباسورد
  3. `PUT /api/v1/users/:id` — تعديل بيانات أو الدور
  4. `PUT /api/v1/users/:id/password` — تغيير كلمة المرور
  5. `DELETE /api/v1/users/:id` — تعطيل المستخدم (`is_active=0`، لا حذف فعلي)
  6. التحقق: لا يمكن تعطيل آخر admin في النظام

## المرحلة 4 — Backend API: الأصناف والمخازن
*CRUD كامل للأصناف وعمليات المخزون*

### Inventory API

#### 4-1: GET /api/v1/inventory — قائمة الأصناف مع الفلاتر
- موجز: endpoint إحضار الأصناف مع دعم البحث والفلترة والترتيب
- الأولوية: عاجل
- الوقت المقدر: 1 ساعة
- الملفات المتأثرة:
  - `server/routes/inventory.ts`
- خطوات:
  1. query params: `search`, `category`, `status` (`in_stock|low_stock|out_of_stock`)
  2. query params: `warehouse_id`, `sortBy`, `sortOrder`, `page`, `limit`
  3. بناء SQL ديناميكي بناءً على الفلاتر المرسلة
  4. حساب status تلقائياً: `0→out_of_stock`, `≤min_quantity→low_stock`, else→`in_stock`
  5. إعادة: `{ items: [...], total, page, totalPages }`
  6. إضافة `GET /api/v1/inventory/categories` لإحضار قائمة التصنيفات الفريدة

#### 4-2: POST /api/v1/inventory — إنشاء صنف جديد
- موجز: endpoint إضافة صنف مع التحقق من الحقول الإلزامية
- الأولوية: عاجل
- الوقت المقدر: 45 دقيقة
- الملفات المتأثرة:
  - `server/routes/inventory.ts`
  - `server/schemas/inventory.ts`
- خطوات:
  1. Zod schema للتحقق: `name` (required), `sku` (required + unique), `cost_price`, `selling_price`
  2. التحقق من عدم تكرار الـ `sku` أو `barcode`
  3. توليد `sku` تلقائي إذا لم يُرسل (`ITM-XXXX`)
  4. إدخال الصنف وإعادة البيانات الكاملة
  5. تسجيل العملية في `audit_log`

#### 4-3: PUT /api/v1/inventory/:id و DELETE
- موجز: تعديل وحذف الأصناف مع التحقق من الاستخدام
- الأولوية: عاجل
- الوقت المقدر: 45 دقيقة
- الملفات المتأثرة:
  - `server/routes/inventory.ts`
- خطوات:
  1. PUT: تحديث بيانات الصنف مع التحقق من تكرار `sku`
  2. التحقق عند تعديل: إذا تغيرت الكمية مباشرة→ تسجيل في `stock_movements`
  3. DELETE: منع الحذف إذا استُخدم الصنف في أي فاتورة (soft delete فقط)
  4. GET /api/v1/inventory/:id — تفاصيل صنف واحد مع حركات المخزون

#### 4-4: GET /api/v1/inventory/:id/movements — حركات الصنف
- موجز: endpoint لعرض كل حركات دخول وخروج صنف معين
- الأولوية: مهمة
- الوقت المقدر: 45 دقيقة
- الملفات المتأثرة:
  - `server/routes/inventory.ts`
  - `server/db.ts`
- خطوات:
  1. إنشاء جدول `stock_movements`: `id`, `item_id`, `type` (`in|out|adjustment`), `quantity`
  2. إضافة: `reference_type` (`purchase|sale|manual|return`), `reference_id`, `note`, `created_by`, `created_at`
  3. query: `SELECT * FROM stock_movements WHERE item_id=? ORDER BY created_at DESC`
  4. إعادة مع رصيد متراكم لكل حركة
  5. دعم فلترة بالتاريخ: `date_from`, `date_to`

### Warehouses API

#### 4-5: CRUD كامل للمخازن GET/POST/PUT/DELETE
- موجز: إدارة المخازن مع حساب نسبة الإشغال
- الأولوية: عاجل
- الوقت المقدر: 1 ساعة
- الملفات المتأثرة:
  - `server/routes/warehouses.ts`
- خطوات:
  1. `GET /api/v1/warehouses` — جميع المخازن مع حساب `current_stock` لكل مخزن
  2. `POST /api/v1/warehouses` — إنشاء مخزن جديد
  3. `PUT /api/v1/warehouses/:id` — تعديل بيانات المخزن
  4. `DELETE /api/v1/warehouses/:id` — منع الحذف إذا يحتوي على أصناف
  5. إضافة حساب `utilization_percentage = (current_stock / capacity) * 100`

## المرحلة 5 — Backend API: العملاء والموردون
*CRUD العملاء والموردين مع حساب الأرصدة*

### Customers API

#### 5-1: GET /api/v1/customers — قائمة العملاء مع الفلاتر
- موجز: قائمة العملاء مع الرصيد المستحق والبحث
- الأولوية: عاجل
- الوقت المقدر: 45 دقيقة
- الملفات المتأثرة:
  - `server/routes/customers.ts`
- خطوات:
  1. query params: `search`, `has_balance` (`true=عملاء بذمم فقط`), `is_active`
  2. حساب `balance` من فرق (إجمالي الفواتير - إجمالي المدفوعات) لكل عميل
  3. `GET /api/v1/customers/:id` — تفاصيل عميل واحد
  4. `GET /api/v1/customers/:id/invoices` — فواتير عميل محدد
  5. `GET /api/v1/customers/:id/payments` — مدفوعات عميل محدد
  6. `GET /api/v1/customers/:id/statement` — كشف حساب العميل

#### 5-2: POST/PUT/DELETE للعملاء
- موجز: إنشاء وتعديل وحذف العملاء
- الأولوية: عاجل
- الوقت المقدر: 45 دقيقة
- الملفات المتأثرة:
  - `server/routes/customers.ts`
  - `server/schemas/customers.ts`
- خطوات:
  1. POST: Zod schema للتحقق من `name` (required), `phone` (optional), `credit_limit`
  2. PUT: تعديل بيانات العميل مع منع تعديل الرصيد مباشرة
  3. DELETE: soft delete فقط (`is_active=0`) إذا له فواتير
  4. التحقق من uniqueness الـ `phone` إذا أُدخل

### Suppliers API

#### 5-3: CRUD كامل للموردين + كشف الحساب
- موجز: نفس هيكل العملاء مع خصوصية الموردين
- الأولوية: عاجل
- الوقت المقدر: 1 ساعة
- الملفات المتأثرة:
  - `server/routes/suppliers.ts`
- خطوات:
  1. `GET /api/v1/suppliers` — قائمة الموردين مع الرصيد المستحق دفعه
  2. `GET /api/v1/suppliers/:id/invoices` — فواتير مورد محدد
  3. `GET /api/v1/suppliers/:id/statement` — كشف حساب المورد
  4. `POST /api/v1/suppliers` — إنشاء مورد جديد
  5. `PUT /api/v1/suppliers/:id` — تعديل بيانات المورد
  6. `DELETE /api/v1/suppliers/:id` — soft delete

## المرحلة 6 — Backend API: فواتير المبيعات
*كامل دورة فاتورة البيع مع التأثير على المخزون*

### Sales Invoices API

#### 6-1: GET /api/v1/sales — قائمة فواتير البيع
- موجز: إحضار الفواتير مع الفلاتر الشاملة
- الأولوية: عاجل
- الوقت المقدر: 45 دقيقة
- الملفات المتأثرة:
  - `server/routes/sales.ts`
- خطوات:
  1. query params: `customer_id`, `status`, `payment_type`, `date_from`, `date_to`
  2. query params: `search` (`invoice_number`), `page`, `limit`, `sortBy`
  3. JOIN مع customers لإحضار اسم العميل
  4. إضافة حقل محسوب: `remaining_amount = total - paid_amount`
  5. `GET /api/v1/sales/:id` — تفاصيل فاتورة واحدة مع بنودها

#### 6-2: POST /api/v1/sales — إنشاء فاتورة بيع جديدة
- موجز: إنشاء الفاتورة مع خصم الكميات من المخزون تلقائياً
- الأولوية: عاجل
- الوقت المقدر: 2 ساعة
- الملفات المتأثرة:
  - `server/routes/sales.ts`
  - `server/schemas/sales.ts`
- خطوات:
  1. Zod schema: `customer_id` (optional), `items` (array: `item_id`, `quantity`, `unit_price`, `discount`)
  2. التحقق: كل صنف في `items` موجود في المخزون
  3. التحقق: كمية كل صنف متوفرة (`quantity >= المطلوب`)
  4. حساب: `subtotal`, `discount_amount`, `tax_amount`, `total`
  5. توليد `invoice_number` تلقائي: `INV-2026-0001` (متسلسل)
  6. إدخال رأس الفاتورة في `sales_invoices`
  7. إدخال البنود في `sales_invoice_items`
  8. خصم الكميات من `inventory_items` لكل صنف
  9. تسجيل حركة في `stock_movements` (`type=out`, `reference_type=sale`)
  10. إذا `payment_type=cash`: إنشاء سجل في `payments` تلقائياً
  11. تحديث balance العميل إذا `payment_type=credit`
  12. كل العمليات داخل SQLite transaction واحدة

#### 6-3: PUT /api/v1/sales/:id — تعديل فاتورة بيع
- موجز: تعديل الفاتورة مع إعادة حساب المخزون بشكل صحيح
- الأولوية: عاجل
- الوقت المقدر: 2 ساعة
- الملفات المتأثرة:
  - `server/routes/sales.ts`
- خطوات:
  1. السماح بالتعديل فقط إذا `status=draft` أو `confirmed` (وليس paid)
  2. إعادة الكميات القديمة للمخزون (reverse old items)
  3. خصم الكميات الجديدة (apply new items)
  4. تحديث رأس الفاتورة والبنود
  5. إعادة حساب الإجماليات
  6. كل العمليات داخل transaction

#### 6-4: DELETE + تسجيل الدفعات على فاتورة بيع
- موجز: إلغاء الفواتير وتسجيل المدفوعات الجزئية
- الأولوية: عاجل
- الوقت المقدر: 1 ساعة
- الملفات المتأثرة:
  - `server/routes/sales.ts`
- خطوات:
  1. `DELETE /api/v1/sales/:id` — تغيير `status` إلى `cancelled` وإعادة الكميات للمخزون
  2. `POST /api/v1/sales/:id/payments` — تسجيل دفعة على الفاتورة
  3. التحقق: المبلغ المدفوع لا يتجاوز `remaining_amount`
  4. تحديث `paid_amount` في الفاتورة
  5. تحديث `status` تلقائياً: إذا `paid_amount=total` → `status=paid`، إذا جزئي → `partial`
  6. تحديث balance العميل
  7. `GET /api/v1/sales/:id/payments` — سجل مدفوعات فاتورة

## المرحلة 7 — Backend API: فواتير المشتريات
*دورة فاتورة الشراء مع التأثير على المخزون*

### Purchase Invoices API

#### 7-1: GET /api/v1/purchases — قائمة فواتير الشراء
- موجز: قائمة فواتير الشراء مع نفس فلاتر المبيعات
- الأولوية: عاجل
- الوقت المقدر: 30 دقيقة
- الملفات المتأثرة:
  - `server/routes/purchases.ts`
- خطوات:
  1. query params: `supplier_id`, `status`, `date_from`, `date_to`, `search`, `page`, `limit`
  2. JOIN مع suppliers لإحضار اسم المورد
  3. `GET /api/v1/purchases/:id` — تفاصيل فاتورة واحدة مع بنودها وبيانات المورد

#### 7-2: POST /api/v1/purchases — إنشاء فاتورة شراء
- موجز: إنشاء الفاتورة مع إضافة الكميات للمخزون تلقائياً
- الأولوية: عاجل
- الوقت المقدر: 2 ساعة
- الملفات المتأثرة:
  - `server/routes/purchases.ts`
- خطوات:
  1. Zod schema: `supplier_id` (optional), `items` (array), `payment_type`, `date`, `notes`
  2. التحقق: كل `item_id` موجود في قاعدة البيانات
  3. حساب الإجماليات: `subtotal`, `discount`, `tax`, `total`
  4. توليد `invoice_number`: `PO-2026-0001`
  5. إدخال رأس الفاتورة والبنود داخل transaction
  6. إضافة الكميات إلى `inventory_items` لكل صنف
  7. تحديث `cost_price` للصنف بمتوسط التكلفة الجديد (Weighted Average)
  8. تسجيل في `stock_movements` (`type=in`, `reference_type=purchase`)
  9. إذا `cash`: إنشاء `payment` تلقائياً

#### 7-3: PUT + DELETE + مدفوعات فواتير الشراء
- موجز: تعديل وإلغاء وتسجيل مدفوعات للموردين
- الأولوية: عاجل
- الوقت المقدر: 1.5 ساعة
- الملفات المتأثرة:
  - `server/routes/purchases.ts`
- خطوات:
  1. `PUT /api/v1/purchases/:id` — reverse القديم + apply الجديد (في transaction)
  2. `DELETE`: تغيير `status=cancelled` + خصم الكميات التي أُضيفت
  3. `POST /api/v1/purchases/:id/payments` — تسجيل دفعة للمورد
  4. `GET /api/v1/purchases/:id/payments` — سجل المدفوعات
  5. تحديث balance المورد عند كل دفعة

## المرحلة 8 — Backend API: الذمم والتقارير والإعدادات
*endpoints التقارير والذمم والإعدادات*

### Accounts & Reports API

#### 8-1: GET /api/v1/reports/dashboard — بيانات لوحة التحكم
- موجز: إحصاءات سريعة للـ dashboard في طلب واحد
- الأولوية: عاجل
- الوقت المقدر: 1 ساعة
- الملفات المتأثرة:
  - `server/routes/reports.ts`
- خطوات:
  1. إجمالي مبيعات اليوم / الشهر / السنة
  2. إجمالي مشتريات الشهر
  3. صافي الربح = مبيعات - تكلفة بضاعة مباعة
  4. عدد الفواتير المعلقة (غير مدفوعة)
  5. الأصناف منخفضة المخزون (`quantity ≤ min_quantity`)
  6. آخر 5 فواتير بيع وآخر 5 فواتير شراء

#### 8-2: GET /api/v1/reports/sales — تقرير المبيعات
- موجز: تقرير المبيعات مع تجميع شهري وفلترة بالتاريخ
- الأولوية: مهمة
- الوقت المقدر: 1 ساعة
- الملفات المتأثرة:
  - `server/routes/reports.ts`
- خطوات:
  1. query params: `date_from`, `date_to`, `customer_id`, `group_by` (`day|week|month`)
  2. إعادة: `sales_by_period` (مصفوفة للرسم البياني)
  3. إعادة: `top_customers` (أعلى 10 عملاء)
  4. إعادة: `top_items` (أكثر 10 أصناف مبيعاً بالكمية والقيمة)
  5. إعادة: totals: `{ gross_sales, discounts, tax, net_sales, returns }`

#### 8-3: GET /api/v1/reports/purchases — تقرير المشتريات
- موجز: تقرير المشتريات بنفس هيكل تقرير المبيعات
- الأولوية: مهمة
- الوقت المقدر: 45 دقيقة
- الملفات المتأثرة:
  - `server/routes/reports.ts`
- خطوات:
  1. تجميع المشتريات حسب الفترة
  2. `top_suppliers` أعلى 10 موردين
  3. `top_purchased_items` الأكثر شراءً
  4. totals: `{ gross_purchases, discounts, tax, net_purchases }`

#### 8-4: GET /api/v1/reports/receivables و payables — الذمم
- موجز: تقرير الذمم مع تصنيف العمر (Aging)
- الأولوية: عاجل
- الوقت المقدر: 1 ساعة
- الملفات المتأثرة:
  - `server/routes/reports.ts`
- خطوات:
  1. `GET /api/v1/reports/receivables` — ذمم العملاء
  2. حساب: `current` (غير مستحق)، `1-30 يوم`, `31-60 يوم`, `+60 يوم`
  3. `GET /api/v1/reports/payables` — ذمم الموردين بنفس التصنيف
  4. إعادة: قائمة العملاء/الموردين مع تفاصيل كل شريحة
  5. إضافة: `total_overdue` (متأخر عن الاستحقاق)

#### 8-5: GET /api/v1/reports/inventory — تقرير المخزون
- موجز: قيمة المخزون الكاملة مع تفاصيل كل صنف
- الأولوية: مهمة
- الوقت المقدر: 45 دقيقة
- الملفات المتأثرة:
  - `server/routes/reports.ts`
- خطوات:
  1. إجمالي قيمة المخزون = Σ(`quantity × cost_price`) لكل صنف
  2. تجميع حسب التصنيف: قائمة التصنيفات مع قيمتها
  3. قائمة الأصناف منخفضة/منعدمة المخزون
  4. أبطأ الأصناف حركة (لم يُبع منها شيء خلال 30 يوم)

#### 8-6: CRUD إعدادات النظام GET/PUT /api/v1/settings
- موجز: قراءة وتحديث إعدادات الشركة والنظام
- الأولوية: مهمة
- الوقت المقدر: 30 دقيقة
- الملفات المتأثرة:
  - `server/routes/settings.ts`
- خطوات:
  1. `GET /api/v1/settings` — إعادة كل الإعدادات كـ object `{ key: value }`
  2. `PUT /api/v1/settings` — تحديث إعداد واحد أو أكثر
  3. `POST /api/v1/settings/backup` — تصدير جميع البيانات كـ JSON
  4. `POST /api/v1/settings/restore` — استيراد بيانات من JSON (admin only)

## المرحلة 9 — ربط Frontend: طبقة API واللوحة
*إنشاء API client وربط صفحة Dashboard*

### إنشاء API Client Layer

#### 9-1: إنشاء src/lib/api.ts — الـ API client المركزي
- موجز: كلاس أو مجموعة دوال مركزية لجميع طلبات HTTP
- الأولوية: عاجل
- الوقت المقدر: 1 ساعة
- الملفات المتأثرة:
  - `src/lib/api.ts`
- خطوات:
  1. إنشاء دالة `apiRequest(method, url, body?)` — تتعامل مع `fetch`
  2. قراءة الـ token من `localStorage` تلقائياً وإضافته لكل طلب
  3. معالجة الأخطاء مركزياً: 401 → redirect لصفحة login
  4. إنشاء: `inventoryApi`, `salesApi`, `purchasesApi`, `customersApi`, `suppliersApi`
  5. كل module يحتوي على: `getAll`, `getById`, `create`, `update`, `delete`
  6. استخدام TypeScript generics لضمان أنواع الاستجابة

#### 9-2: إنشاء src/hooks/useApi.ts — custom hooks للـ data fetching
- موجز: hooks تجمع الطلبات مع حالات loading/error/data
- الأولوية: عاجل
- الوقت المقدر: 1 ساعة
- الملفات المتأثرة:
  - `src/hooks/useApi.ts`
  - `src/hooks/useInventory.ts`
- خطوات:
  1. إنشاء `useQuery(fetchFn, deps)` — يحضر البيانات ويتابع loading/error
  2. إنشاء `useMutation(mutateFn)` — لعمليات POST/PUT/DELETE
  3. `useMutation` يعيد: `{ mutate, loading, error, success }`
  4. `useInventory()`, `useSales()`, `usePurchases()` كـ wrapper hooks
  5. إضافة `refetch` function لإعادة جلب البيانات بعد أي عملية

#### 9-3: إنشاء AuthContext وصفحة تسجيل الدخول
- موجز: context للمستخدم الحالي + صفحة login احترافية
- الأولوية: عاجل
- الوقت المقدر: 2 ساعة
- الملفات المتأثرة:
  - `src/context/AuthContext.tsx`
  - `src/Login.tsx`
  - `src/App.tsx`
- خطوات:
  1. إنشاء `src/context/AuthContext.tsx` مع: `user`, `token`, `login`, `logout`
  2. حفظ token في `localStorage` عند تسجيل الدخول
  3. عند تحميل التطبيق: قراءة token وإرسال `GET /api/v1/auth/me` للتحقق
  4. إنشاء `src/Login.tsx` — صفحة تسجيل الدخول بتصميم يتناسب مع المشروع
  5. إضافة `ProtectedRoute` component: يحول لـ login إذا لم يكن مسجلاً
  6. تعديل `App.tsx` لإضافة `AuthContext.Provider` حول كل شيء
  7. إضافة زر تسجيل الخروج في الـ header مع اسم المستخدم ودوره

#### 9-4: ربط Dashboard.tsx بـ GET /api/v1/reports/dashboard
- موجز: استبدال البيانات الوهمية ببيانات حقيقية من الـ API
- الأولوية: عاجل
- الوقت المقدر: 1.5 ساعة
- الملفات المتأثرة:
  - `src/Dashboard.tsx`
- خطوات:
  1. استخدام `useQuery` لجلب بيانات الـ dashboard عند تحميل الصفحة
  2. إضافة skeleton loaders أثناء التحميل
  3. عرض KPI cards بالبيانات الفعلية: إجمالي المبيعات، المشتريات، الأرباح
  4. عرض قائمة الأصناف منخفضة المخزون
  5. عرض آخر الفواتير
  6. إضافة زر Refresh لإعادة جلب البيانات

## المرحلة 10 — ربط Frontend: صفحات الأصناف والمخازن
*استبدال localStorage بطلبات API في App.tsx و Warehouses.tsx*

### ربط صفحة الأصناف

#### 10-1: ربط قائمة الأصناف (Inventory Table) بـ GET /api/v1/inventory
- موجز: جلب الأصناف من API مع الفلترة والترتيب والـ pagination
- الأولوية: عاجل
- الوقت المقدر: 2 ساعة
- الملفات المتأثرة:
  - `src/App.tsx`
- خطوات:
  1. إزالة جميع قراءات `localStorage.getItem("inventory_items")`
  2. استخدام `useInventory()` hook لجلب الأصناف
  3. إرسال query params عند تغيير البحث أو الفلتر أو الترتيب
  4. إضافة Pagination component إذا الأصناف > 20
  5. عرض spinner أثناء التحميل ورسالة خطأ عند الفشل
  6. Debounce لحقل البحث (500ms) لتقليل عدد الطلبات

#### 10-2: ربط إضافة/تعديل/حذف الأصناف
- موجز: ربط نماذج CRUD بـ API endpoints
- الأولوية: عاجل
- الوقت المقدر: 1.5 ساعة
- الملفات المتأثرة:
  - `src/App.tsx`
- خطوات:
  1. زر "إضافة صنف" → `POST /api/v1/inventory` → إغلاق Modal + Refresh القائمة
  2. زر "تعديل" → تحميل بيانات الصنف في الـ form → `PUT /api/v1/inventory/:id`
  3. زر "حذف" → تأكيد → `DELETE /api/v1/inventory/:id` → Refresh
  4. عرض رسائل نجاح أو خطأ toast notifications
  5. معالجة أخطاء التحقق من الـ API وعرضها على الحقول

#### 10-3: ربط صفحة المخازن (Warehouses.tsx) بالـ API
- موجز: استبدال localStorage في `Warehouses.tsx` بطلبات API
- الأولوية: عاجل
- الوقت المقدر: 1.5 ساعة
- الملفات المتأثرة:
  - `src/Warehouses.tsx`
- خطوات:
  1. جلب المخازن من `GET /api/v1/warehouses` عند تحميل الصفحة
  2. عرض نسبة الإشغال الحقيقية من بيانات الـ API
  3. ربط إضافة مخزن جديد بـ `POST /api/v1/warehouses`
  4. ربط تعديل المخزن بـ `PUT /api/v1/warehouses/:id`
  5. ربط حذف المخزن بـ DELETE مع عرض خطأ واضح إذا له أصناف

## المرحلة 11 — ربط Frontend: فواتير البيع والشراء
*ربط SalesInvoices.tsx و PurchaseInvoices.tsx بالـ API*

### ربط فواتير البيع

#### 11-1: ربط قائمة فواتير البيع بـ GET /api/v1/sales
- موجز: جلب الفواتير من API مع الفلاتر والـ pagination
- الأولوية: عاجل
- الوقت المقدر: 1.5 ساعة
- الملفات المتأثرة:
  - `src/SalesInvoices.tsx`
- خطوات:
  1. إزالة قراءة `localStorage.getItem("sales_invoices")`
  2. جلب الفواتير عند التحميل مع دعم الفلاتر: `status`, `date_from`, `date_to`
  3. عرض اسم العميل (من بيانات الـ API) في جدول الفواتير
  4. إضافة عمود "المتبقي" = `total - paid_amount` مع لون مختلف للمتأخرين
  5. إضافة فلتر سريع للحالة: الكل / مدفوع / غير مدفوع / جزئي

#### 11-2: ربط نموذج إنشاء/تعديل فاتورة البيع
- موجز: form إنشاء الفاتورة مع اختيار العميل والأصناف من API
- الأولوية: عاجل
- الوقت المقدر: 3 ساعات
- الملفات المتأثرة:
  - `src/SalesInvoices.tsx`
- خطوات:
  1. إضافة dropdown لاختيار العميل من `GET /api/v1/customers`
  2. Searchable dropdown للأصناف من `GET /api/v1/inventory?status=in_stock`
  3. عند اختيار صنف: عرض السعر تلقائياً وإمكانية تعديله
  4. حساب الإجمالي في الـ frontend قبل الإرسال (للعرض فقط)
  5. إرسال `POST /api/v1/sales` عند الحفظ + إعادة تحميل القائمة
  6. عرض رقم الفاتورة الجديد في رسالة النجاح
  7. ربط التعديل بـ `PUT /api/v1/sales/:id`

#### 11-3: إضافة واجهة تسجيل الدفعات على فاتورة بيع
- موجز: modal لتسجيل دفعة جزئية أو كاملة على فاتورة محددة
- الأولوية: عاجل
- الوقت المقدر: 1.5 ساعة
- الملفات المتأثرة:
  - `src/SalesInvoices.tsx`
- خطوات:
  1. زر "تسجيل دفعة" في صف الفاتورة يفتح modal
  2. Modal يعرض: رقم الفاتورة، الإجمالي، المدفوع، المتبقي
  3. حقل: المبلغ المدفوع (لا يتجاوز المتبقي) + طريقة الدفع + ملاحظة
  4. إرسال `POST /api/v1/sales/:id/payments`
  5. تحديث status الفاتورة في القائمة فوراً
  6. عرض سجل الدفعات السابقة داخل نفس الـ modal

### ربط فواتير الشراء

#### 11-4: ربط فواتير المشتريات بالـ API كاملاً
- موجز: نفس خطوات فواتير البيع مع تغيير العميل بالمورد
- الأولوية: عاجل
- الوقت المقدر: 4 ساعات
- الملفات المتأثرة:
  - `src/PurchaseInvoices.tsx`
- خطوات:
  1. إزالة قراءة `localStorage.getItem("purchase_invoices")`
  2. جلب الفواتير من `GET /api/v1/purchases` مع الفلاتر
  3. ربط نموذج الإنشاء: dropdown للمورد من `GET /api/v1/suppliers`
  4. اختيار الأصناف مع تحديث `cost_price` في الـ form (قيمة افتراضية من آخر شراء)
  5. إرسال `POST /api/v1/purchases` عند الحفظ
  6. إضافة modal تسجيل دفعة للمورد بنفس هيكل البيع
  7. ربط التعديل والحذف بالـ API

## المرحلة 12 — ربط Frontend: العملاء والموردون والتقارير
*صفحات جديدة للعملاء والموردين + ربط Reports.tsx*

### صفحات العملاء والموردين

#### 12-1: إنشاء صفحة src/Customers.tsx — إدارة العملاء
- موجز: صفحة جديدة كاملة لإدارة العملاء
- الأولوية: عاجل
- الوقت المقدر: 3 ساعات
- الملفات المتأثرة:
  - `src/Customers.tsx`
  - `src/App.tsx`
- خطوات:
  1. جدول العملاء مع البحث والفلترة (`has_balance`)
  2. عرض: الاسم، الهاتف، الرصيد المستحق، عدد الفواتير
  3. Modal إضافة/تعديل عميل (اسم، هاتف، عنوان، حد ائتمان)
  4. زر "كشف حساب" يفتح modal يعرض كل الفواتير والمدفوعات
  5. ربط جميع العمليات بـ `customersApi`
  6. إضافة الصفحة في `App.tsx` وربط الـ nav sidebar بها

#### 12-2: إنشاء صفحة src/Suppliers.tsx — إدارة الموردين
- موجز: صفحة مشابهة للعملاء مع بيانات خاصة بالموردين
- الأولوية: عاجل
- الوقت المقدر: 2 ساعات
- الملفات المتأثرة:
  - `src/Suppliers.tsx`
  - `src/App.tsx`
- خطوات:
  1. جدول الموردين مع البحث والفلترة
  2. عرض: الاسم، جهة الاتصال، الرصيد المستحق دفعه
  3. Modal إضافة/تعديل مورد
  4. زر "كشف حساب" مع تاريخ المشتريات والمدفوعات
  5. إضافة الصفحة في `App.tsx` والـ sidebar

### ربط صفحة التقارير

#### 12-3: ربط Reports.tsx بـ API التقارير الكامل
- موجز: استبدال البيانات الوهمية بطلبات حقيقية لكل قسم
- الأولوية: مهمة
- الوقت المقدر: 3 ساعات
- الملفات المتأثرة:
  - `src/Reports.tsx`
- خطوات:
  1. إزالة البيانات الوهمية والقراءات من `localStorage`
  2. قسم المبيعات: جلب من `GET /api/v1/reports/sales` مع date picker
  3. قسم المشتريات: جلب من `GET /api/v1/reports/purchases`
  4. قسم المخزون: جلب من `GET /api/v1/reports/inventory`
  5. إضافة تبويب جديد "الذمم": عرض `receivables` و `payables`
  6. إضافة فلتر التاريخ (`date_from`, `date_to`) ويُرسل مع كل طلب
  7. تحديث الرسوم البيانية تلقائياً عند تغيير التاريخ

#### 12-4: ربط Settings.tsx بـ /api/v1/settings
- موجز: قراءة وحفظ الإعدادات من قاعدة البيانات بدلاً من localStorage
- الأولوية: مهمة
- الوقت المقدر: 1.5 ساعة
- الملفات المتأثرة:
  - `src/Settings.tsx`
- خطوات:
  1. جلب الإعدادات من `GET /api/v1/settings` عند تحميل الصفحة
  2. حفظ التعديلات بـ `PUT /api/v1/settings`
  3. ربط زر "تصدير البيانات" بـ `POST /api/v1/settings/backup` (تنزيل JSON)
  4. ربط زر "استيراد البيانات" بـ `POST /api/v1/settings/restore`

## المرحلة 13 — الميزات الإضافية المهمة
*ميزات تكمل النظام وتجعله جاهزاً للاستخدام الفعلي*

### المرتجعات والضرائب

#### 13-1: صفحة مرتجعات المبيعات + API
- موجز: واجهة وـ API لإنشاء مرتجع مبيعات مرتبط بفاتورة أصلية
- الأولوية: مهمة
- الوقت المقدر: 3 ساعات
- الملفات المتأثرة:
  - `server/routes/returns.ts`
  - `src/SalesReturns.tsx`
- خطوات:
  1. `POST /api/v1/sales/returns` — إنشاء مرتجع مبيعات
  2. التحقق: الكمية المردودة ≤ الكمية المباعة في الفاتورة الأصلية
  3. إعادة الكميات للمخزون + تسجيل في `stock_movements` (`type=in`, `ref=return`)
  4. إنشاء credit note للعميل (تخفيض رصيده)
  5. إنشاء `src/SalesReturns.tsx` — صفحة المرتجعات
  6. زر "مرتجع" في قائمة الفواتير يفتح نموذج المرتجع مع بيانات الفاتورة الأصلية

#### 13-2: إضافة حساب الضريبة (VAT 15%) في الفواتير
- موجز: تطبيق الضريبة في الـ Backend والـ Frontend
- الأولوية: مهمة
- الوقت المقدر: 1 ساعة
- الملفات المتأثرة:
  - `server/routes/sales.ts`
  - `src/SalesInvoices.tsx`
- خطوات:
  1. قراءة `default_tax_rate` من إعدادات النظام في كل فاتورة
  2. حساب `tax_amount = (subtotal - discount_amount) × (tax_rate / 100)`
  3. `total = subtotal - discount_amount + tax_amount`
  4. عرض تفاصيل الضريبة في نموذج الفاتورة (subtotal + ضريبة + الإجمالي)
  5. إضافة خيار "معفى من الضريبة" لبعض العملاء

#### 13-3: طباعة الفواتير بتصميم احترافي
- موجز: قالب طباعة HTML/CSS لكل فاتورة
- الأولوية: مهمة
- الوقت المقدر: 2 ساعة
- الملفات المتأثرة:
  - `src/components/InvoicePrint.tsx`
- خطوات:
  1. إنشاء `src/components/InvoicePrint.tsx` — مكوّن الطباعة
  2. القالب يشمل: شعار وبيانات الشركة من الإعدادات
  3. عرض: بيانات العميل، رقم الفاتورة، التاريخ، الاستحقاق
  4. جدول الأصناف: الكمية، الوحدة، السعر، الخصم، الإجمالي
  5. أسفل الفاتورة: المجموع، الخصم، الضريبة، الصافي
  6. استخدام `window.print()` مع `@media print` CSS
  7. زر طباعة في كل فاتورة وفي صفحة التفاصيل

### جودة الكود والتجربة

#### 13-4: إضافة Toast Notifications مركزية
- موجز: نظام إشعارات موحد لجميع عمليات النجاح والخطأ
- الأولوية: مهمة
- الوقت المقدر: 1 ساعة
- الملفات المتأثرة:
  - `src/context/ToastContext.tsx`
  - `src/components/Toast.tsx`
- خطوات:
  1. إنشاء `src/context/ToastContext.tsx`
  2. دوال: `showSuccess(msg)`, `showError(msg)`, `showWarning(msg)`
  3. مكوّن `ToastContainer` يعرض الإشعارات في زاوية الشاشة
  4. إشعارات تختفي تلقائياً بعد 3 ثواني
  5. استخدامها في جميع عمليات الـ API بدلاً من `alert()`

#### 13-5: إضافة تنبيهات المخزون المنخفض
- موجز: إشعار تلقائي في الـ header عند وجود أصناف منخفضة
- الأولوية: تحسين
- الوقت المقدر: 1 ساعة
- الملفات المتأثرة:
  - `src/App.tsx`
  - `server/routes/inventory.ts`
- خطوات:
  1. `GET /api/v1/inventory/alerts` — endpoint يعيد الأصناف منخفضة الكمية
  2. استدعاء الـ endpoint كل دقيقة في الخلفية (polling)
  3. عرض badge بالعدد على أيقونة التنبيه في الـ header
  4. Dropdown يعرض قائمة الأصناف المنخفضة مع رابط لصفحة الأصناف

#### 13-6: سجل العمليات (Audit Log)
- موجز: تتبع كل عملية تعديل أو حذف مع المستخدم المسؤول
- الأولوية: تحسين
- الوقت المقدر: 1.5 ساعة
- الملفات المتأثرة:
  - `server/routes/auditLog.ts`
  - `src/Settings.tsx`
- خطوات:
  1. إنشاء جدول `audit_logs`: `id`, `user_id`, `action`, `entity_type`, `entity_id`, `old_data`, `new_data`, `created_at`
  2. إضافة تسجيل في كل route يعدل أو يحذف بيانات
  3. `GET /api/v1/audit-logs` — صفحة سجل العمليات (admin only)
  4. عرض: الوقت، المستخدم، العملية، الكيان المتأثر
  5. إضافة الصفحة في `Settings.tsx` كتبويب
