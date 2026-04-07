---
mode: agent
description: إضافة مهمة محددة من قائمة مهام المُنسق — أدخل رقم المهمة لتنفيذها
---

# تنفيذ مهمة محددة من قائمة المهام

## كيفية الاستخدام

اكتب رقم المهمة من قائمة المهام (مثال: `1-1` أو `6-2` أو `9-3`)

---

## فهرس المهام السريع

### المرحلة 1 — إعداد Backend

- `1-1` تثبيت حزم البيئة
- `1-2` إعداد هيكل server/
- `1-3` إنشاء server/index.ts

### المرحلة 2 — قاعدة البيانات

- `2-1` إنشاء جداول SQLite الكاملة
- `2-2` إضافة بيانات أولية (seed)

### المرحلة 3 — Authentication

- `3-1` POST /api/v1/auth/login
- `3-2` GET /api/v1/auth/me
- `3-3` Auth Middleware (verifyToken)
- `3-4` CRUD المستخدمين (admin فقط)

### المرحلة 4 — Inventory & Warehouses

- `4-1` GET /api/v1/inventory مع الفلاتر
- `4-2` POST /api/v1/inventory
- `4-3` PUT + DELETE للأصناف
- `4-4` حركات المخزون (movements)
- `4-5` CRUD المخازن

### المرحلة 5 — العملاء والموردون

- `5-1` GET /api/v1/customers
- `5-2` POST/PUT/DELETE العملاء
- `5-3` CRUD الموردين + كشف الحساب

### المرحلة 6 — فواتير المبيعات

- `6-1` GET /api/v1/sales
- `6-2` POST /api/v1/sales (مع المخزون) ⭐ حرج
- `6-3` PUT تعديل فاتورة ⭐ حرج
- `6-4` DELETE + تسجيل الدفعات

### المرحلة 7 — فواتير المشتريات

- `7-1` GET /api/v1/purchases
- `7-2` POST /api/v1/purchases (مع المخزون) ⭐ حرج
- `7-3` PUT + DELETE + مدفوعات المشتريات

### المرحلة 8 — التقارير والإعدادات

- `8-1` GET /api/v1/reports/dashboard
- `8-2` GET /api/v1/reports/sales
- `8-3` GET /api/v1/reports/purchases
- `8-4` ذمم العملاء والموردين (Aging)
- `8-5` GET /api/v1/reports/inventory
- `8-6` CRUD إعدادات النظام

### المرحلة 9 — ربط Frontend

- `9-1` إنشاء src/lib/api.ts
- `9-2` إنشاء src/hooks/useApi.ts
- `9-3` AuthContext + صفحة Login
- `9-4` ربط Dashboard بالـ API

### المرحلة 10 — ربط صفحات البيع والشراء

- `10-1` ربط SalesInvoices.tsx بالـ API
- `10-2` ربط PurchaseInvoices.tsx بالـ API
- `10-3` ربط Reports.tsx بالـ API
- `10-4` ربط Warehouses.tsx بالـ API

### المرحلة 11 — ربط الأصناف والإعدادات

- `11-1` ربط صفحة الأصناف (App.tsx) بالـ API
- `11-2` ربط Settings.tsx بالـ API

### المرحلة 12 — صفحات العملاء والموردين

- `12-1` إنشاء صفحة العملاء (Customers.tsx)
- `12-2` إنشاء صفحة الموردين (Suppliers.tsx)
- `12-3` طباعة الفواتير (InvoicePrint.tsx)

### المرحلة 13 — ميزات متقدمة

- `13-1` Toast Notifications
- `13-2` تنبيهات المخزون المنخفض (polling)
- `13-3` سجل العمليات (Audit Log)

---

## عند إدخال رقم مهمة، نفّذ:

1. اقرأ المهمة المطلوبة من هذا الفهرس و من ملف `../../attached_assets/index1_tasks.md` لفهم المطلوب.
2. راجع الـ instructions ذات الصلة:
   - مهام `1-x` إلى `8-x`: راجع `backend.instructions.md` + `database.instructions.md`
   - مهام `9-x` إلى `13-x`: راجع `frontend.instructions.md`
   - أي مهام فواتير: راجع skill `invoice-logic`
3. نفّذ المهمة بالخطوات المذكورة في خطة المهام و ملف `../../attached_assets/index1_tasks.md`.
4. تحقق من عدم كسر أي كود موجود
5. أضف الـ route لـ `server/index.ts` إذا كان backend endpoint

## ملاحظة حول المهام الحرجة ⭐

المهام `6-2` و `6-3` و `7-2` و `7-3` تؤثر مباشرةً على المخزون.
لا تبني هذه المهام بدون مراجعة `invoice-logic` skill أولاً.
