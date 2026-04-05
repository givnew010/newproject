---
mode: agent
description: بناء الـ Backend API الكامل للمُنسق — Express + SQLite + JWT
---

# بناء Backend API المُنسق الكامل

## المهمة
ابنِ الـ Backend الكامل لنظام المُنسق وفق هذا الترتيب الدقيق:

## المرحلة 1 — تثبيت الحزم وإعداد الهيكل

1. ثبّت الحزم المطلوبة:
```bash
npm install better-sqlite3 zod cors bcryptjs jsonwebtoken
npm install -D @types/better-sqlite3 @types/bcryptjs @types/jsonwebtoken
```

2. أنشئ الملفات التالية (فارغة أولاً):
- `server/types.ts`
- `server/db.ts`
- `server/middleware/auth.ts`
- `server/middleware/errorHandler.ts`
- `server/routes/auth.ts`
- `server/routes/inventory.ts`
- `server/routes/warehouses.ts`
- `server/routes/customers.ts`
- `server/routes/suppliers.ts`
- `server/routes/sales.ts`
- `server/routes/purchases.ts`
- `server/routes/reports.ts`
- `server/routes/settings.ts`
- `server/routes/users.ts`
- `server/schemas/inventory.ts`
- `server/schemas/sales.ts`
- `server/schemas/purchases.ts`

## المرحلة 2 — قاعدة البيانات (server/db.ts)

اكتب `server/db.ts` بحيث يشمل:
- اتصال better-sqlite3 مع `WAL mode` و `foreign_keys ON`
- دالة `createTables()` تنشئ كل الجداول (راجع database.instructions.md)
- دالة `seedData()` تضيف admin افتراضي + إعدادات أولية
- دالة `generateInvoiceNumber(type)` للفواتير
- تصدير `db` كـ default export

## المرحلة 3 — Auth System

### server/middleware/auth.ts
- `authenticate` middleware يتحقق من JWT
- `checkRole(...roles)` للتحقق من الصلاحيات
- إضافة `req.user` على الـ Request type

### server/routes/auth.ts
- `POST /api/v1/auth/login` — bcrypt.compare + JWT sign 24h
- `GET /api/v1/auth/me` — التحقق من token + إعادة بيانات المستخدم

## المرحلة 4 — Inventory API (server/routes/inventory.ts)

- `GET /api/v1/inventory` — مع فلاتر: search, category, status, warehouse_id, page, limit
- `GET /api/v1/inventory/categories` — قائمة التصنيفات الفريدة
- `GET /api/v1/inventory/alerts` — الأصناف منخفضة المخزون
- `GET /api/v1/inventory/:id` — تفاصيل صنف واحد
- `POST /api/v1/inventory` — Zod validation + توليد SKU تلقائي
- `PUT /api/v1/inventory/:id` — تحديث + تسجيل حركة عند تغيير الكمية
- `DELETE /api/v1/inventory/:id` — soft delete (is_active=0) فقط إذا لم يُستخدم في فاتورة
- `GET /api/v1/inventory/:id/movements` — حركات الصنف مع date_from, date_to

## المرحلة 5 — Warehouses, Customers, Suppliers

### Warehouses (server/routes/warehouses.ts)
- CRUD كامل مع حساب `current_stock` و `utilization_percentage`
- منع الحذف إذا يحتوي على أصناف

### Customers (server/routes/customers.ts)
- CRUD مع حساب `balance = total_invoices - total_payments`
- `GET /api/v1/customers/:id/statement` — كشف الحساب
- `GET /api/v1/customers/:id/invoices` — فواتير العميل

### Suppliers (server/routes/suppliers.ts)
- نفس هيكل Customers

## المرحلة 6 — Sales API (server/routes/sales.ts)

**المهم**: كل عملية CRUD للمبيعات يجب أن تستخدم `db.transaction()`

- `GET /api/v1/sales` — مع JOIN customers + فلاتر شاملة
- `GET /api/v1/sales/:id` — مع items و customer
- `POST /api/v1/sales` — الترتيب داخل transaction:
  1. التحقق من توفر الكميات لكل صنف
  2. توليد invoice_number
  3. إدراج رأس الفاتورة
  4. إدراج البنود
  5. خصم المخزون
  6. تسجيل stock_movements (type='out')
  7. إذا cash → إدراج payment تلقائي
- `PUT /api/v1/sales/:id` — reverse القديم + apply الجديد (transaction)
- `DELETE /api/v1/sales/:id` — status=cancelled + إعادة المخزون
- `POST /api/v1/sales/:id/payments` — تسجيل دفعة + تحديث status
- `GET /api/v1/sales/:id/payments` — سجل المدفوعات

## المرحلة 7 — Purchases API (server/routes/purchases.ts)

مثل Sales لكن معكوس:
- `POST /api/v1/purchases` — زيادة المخزون + تحديث cost_price بالمتوسط المرجح
- `DELETE /api/v1/purchases/:id` — status=cancelled + خصم الكميات المُضافة

## المرحلة 8 — Reports & Settings

### Reports (server/routes/reports.ts)
- `GET /api/v1/reports/dashboard` — KPIs سريعة + آخر الفواتير + تنبيهات
- `GET /api/v1/reports/sales` — مع group_by: day|week|month + top_customers + top_items
- `GET /api/v1/reports/purchases` — نفس هيكل sales
- `GET /api/v1/reports/receivables` — ذمم العملاء مع Aging (current، 1-30، 31-60، +60)
- `GET /api/v1/reports/payables` — ذمم الموردين
- `GET /api/v1/reports/inventory` — قيمة المخزون + بطيئة الحركة

### Settings (server/routes/settings.ts)
- `GET /api/v1/settings` — كل الإعدادات
- `PUT /api/v1/settings` — تحديث إعداد/أكثر
- `POST /api/v1/settings/backup` — تصدير كل البيانات JSON
- `POST /api/v1/settings/restore` — استيراد (admin only)

## المرحلة 9 — server/index.ts الرئيسي

```typescript
import express from 'express';
import cors from 'cors';
import { createTables, seedData } from './db';

const app = express();
app.use(cors({ origin: 'http://localhost:5000' }));
app.use(express.json());

// Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', usersRouter);
// ... باقي الـ routes

// تهيئة DB عند البدء
createTables();
seedData();

app.listen(3001, () => console.log('✅ Server running on port 3001'));
```

## تعليمات مهمة
- كل Route يجب أن يرد بـ `{ success: true, data: ... }` أو `{ success: false, message: '...' }`
- رسائل الخطأ بالعربية دائماً
- لا تنسَ `authenticate` middleware على جميع routes
- استخدم `checkRole('admin')` على routes الإدارة فقط
