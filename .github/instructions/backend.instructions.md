---
applyTo: "server/**/*.ts"
---

# تعليمات كود الـ Backend (server/)

## بنية ملفات server/
```
server/
├── index.ts          ← نقطة دخول Express: middleware، routes، error handler
├── db.ts             ← SQLite connection + createTables() + seed data
├── types.ts          ← أنواع TypeScript المشتركة
├── middleware/
│   ├── auth.ts       ← authenticate, checkRole
│   └── errorHandler.ts
├── routes/
│   ├── auth.ts       ← /api/v1/auth/login, /me
│   ├── users.ts      ← /api/v1/users CRUD
│   ├── inventory.ts  ← /api/v1/inventory CRUD + movements
│   ├── warehouses.ts ← /api/v1/warehouses CRUD
│   ├── customers.ts  ← /api/v1/customers CRUD + statement
│   ├── suppliers.ts  ← /api/v1/suppliers CRUD + statement
│   ├── sales.ts      ← /api/v1/sales CRUD + payments
│   ├── purchases.ts  ← /api/v1/purchases CRUD + payments
│   ├── reports.ts    ← /api/v1/reports/*
│   ├── settings.ts   ← /api/v1/settings + backup/restore
│   └── auditLog.ts   ← /api/v1/audit-logs
└── schemas/
    ├── inventory.ts
    ├── sales.ts
    ├── purchases.ts
    ├── customers.ts
    └── suppliers.ts
```

## SQLite — القواعد الأساسية

### اتصال الـ Database
```typescript
// server/db.ts
import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.join(process.cwd(), 'data.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export default db;
```

### Prepared Statements دائماً
```typescript
// ✅ صحيح
const stmt = db.prepare('SELECT * FROM inventory_items WHERE id = ?');
const item = stmt.get(id);

// ❌ خطأ - SQL injection
const item = db.exec(`SELECT * FROM inventory_items WHERE id = ${id}`);
```

### Transactions للعمليات المتعددة
```typescript
// ✅ كل عملية تعدل جداول متعددة داخل transaction
const createSalesInvoice = db.transaction((invoiceData, items) => {
  const invoice = db.prepare(`INSERT INTO sales_invoices ...`).run(invoiceData);
  for (const item of items) {
    db.prepare(`INSERT INTO sales_invoice_items ...`).run({ ...item, invoice_id: invoice.lastInsertRowid });
    db.prepare(`UPDATE inventory_items SET quantity = quantity - ? WHERE id = ?`).run(item.quantity, item.item_id);
    db.prepare(`INSERT INTO stock_movements ...`).run({ item_id: item.item_id, type: 'out', reference_type: 'sale' });
  }
  return invoice.lastInsertRowid;
});
```

## Express — نمط Routes

### هيكل Route Handler
```typescript
import { Router } from 'express';
import { authenticate, checkRole } from '../middleware/auth';
import db from '../db';
import { z } from 'zod';

const router = Router();

// GET قائمة مع فلترة
router.get('/', authenticate, (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = 'SELECT * FROM table_name WHERE is_active = 1';
    const params: any[] = [];

    if (search) {
      query += ' AND (name LIKE ? OR code LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    const total = db.prepare(`SELECT COUNT(*) as count FROM (${query})`).get(...params) as { count: number };
    const items = db.prepare(`${query} LIMIT ? OFFSET ?`).all(...params, limit, offset);

    res.json({
      success: true,
      data: items,
      total: total.count,
      page: Number(page),
      totalPages: Math.ceil(total.count / Number(limit))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في جلب البيانات' });
  }
});

export default router;
```

## Zod Schemas

```typescript
// server/schemas/inventory.ts
import { z } from 'zod';

export const createInventorySchema = z.object({
  name: z.string().min(1, 'اسم الصنف مطلوب').max(200),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  category: z.string().optional(),
  unit: z.string().default('قطعة'),
  cost_price: z.number().min(0, 'سعر التكلفة لا يمكن أن يكون سالباً'),
  selling_price: z.number().min(0, 'سعر البيع لا يمكن أن يكون سالباً'),
  quantity: z.number().int().min(0).default(0),
  min_quantity: z.number().int().min(0).default(5),
  warehouse_id: z.number().int().optional(),
});

// استخدام في route
router.post('/', authenticate, (req, res) => {
  const result = createInventorySchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ success: false, message: result.error.errors[0].message });
  }
  // ... باقي المنطق
});
```

## Auth Middleware

```typescript
// server/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import db from '../db';

const JWT_SECRET = process.env.JWT_SECRET || 'almunsiq-secret-key-2026';

export interface AuthRequest extends Request {
  user?: { userId: number; username: string; role: string };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'يجب تسجيل الدخول' });
  }
  try {
    const token = authHeader.slice(7);
    const payload = jwt.verify(token, JWT_SECRET) as { userId: number; username: string; role: string };
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'انتهت الجلسة، يرجى تسجيل الدخول مجدداً' });
  }
};

export const checkRole = (...roles: string[]) => (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'ليس لديك صلاحية لهذه العملية' });
  }
  next();
};
```

## حساب المخزون

### تحديث الكمية عند البيع
```typescript
// خصم من المخزون مع التحقق المسبق
const checkStock = db.prepare('SELECT quantity FROM inventory_items WHERE id = ? AND is_active = 1');
const item = checkStock.get(itemId) as { quantity: number } | undefined;
if (!item) throw new Error(`الصنف غير موجود`);
if (item.quantity < requestedQty) throw new Error(`الكمية المتوفرة ${item.quantity} فقط`);
```

### تحديث متوسط التكلفة عند الشراء (Weighted Average)
```typescript
const existing = db.prepare('SELECT quantity, cost_price FROM inventory_items WHERE id = ?').get(itemId) as { quantity: number; cost_price: number };
const newAvgCost = ((existing.quantity * existing.cost_price) + (purchaseQty * purchasePrice)) / (existing.quantity + purchaseQty);
db.prepare('UPDATE inventory_items SET quantity = quantity + ?, cost_price = ? WHERE id = ?')
  .run(purchaseQty, newAvgCost, itemId);
```

## Audit Log
```typescript
// أضف هذا بعد كل عملية تعديل/حذف
export const logAudit = (userId: number, action: string, entityType: string, entityId: number, oldData?: any, newData?: any) => {
  db.prepare(`INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_data, new_data) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(userId, action, entityType, entityId, JSON.stringify(oldData), JSON.stringify(newData));
};
```
