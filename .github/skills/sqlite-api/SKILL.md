---
name: sqlite-api
description: >
  أنماط كتابة SQLite API routes للمُنسق.
  استخدم عند كتابة endpoints جديدة لـ inventory أو sales أو purchases أو reports.
  يوفر templates جاهزة لكل نوع من الـ routes.
allowed-tools: editFiles, readFile
---

# SQLite API Patterns Skill

## نمط 1 — GET قائمة مع فلترة وترقيم الصفحات

```typescript
router.get('/', authenticate, (req, res) => {
  try {
    const {
      search = '',
      page = '1',
      limit = '20',
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    // بناء WHERE ديناميكي
    const conditions: string[] = ['t.is_active = 1'];
    const params: unknown[] = [];

    if (search) {
      conditions.push('(t.name LIKE ? OR t.code LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const orderClause = `ORDER BY ${sortBy} ${sortOrder === 'ASC' ? 'ASC' : 'DESC'}`;

    const countRow = db.prepare(
      `SELECT COUNT(*) as total FROM table_name t ${where}`
    ).get(...params) as { total: number };

    const rows = db.prepare(
      `SELECT t.* FROM table_name t ${where} ${orderClause} LIMIT ? OFFSET ?`
    ).all(...params, limitNum, offset);

    res.json({
      success: true,
      data: rows,
      total: countRow.total,
      page: pageNum,
      totalPages: Math.ceil(countRow.total / limitNum),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'خطأ في جلب البيانات' });
  }
});
```

## نمط 2 — GET عنصر واحد بالـ ID

```typescript
router.get('/:id', authenticate, (req, res) => {
  try {
    const { id } = req.params;
    const item = db.prepare(
      'SELECT * FROM table_name WHERE id = ? AND is_active = 1'
    ).get(parseInt(id));

    if (!item) {
      return res.status(404).json({ success: false, message: 'العنصر غير موجود' });
    }

    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في جلب البيانات' });
  }
});
```

## نمط 3 — POST إنشاء مع Zod

```typescript
import { z } from 'zod';

const createSchema = z.object({
  name: z.string().min(1, 'الاسم مطلوب').max(200),
  // ... باقي الحقول
});

router.post('/', authenticate, (req, res) => {
  try {
    const validation = createSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: validation.error.errors[0].message
      });
    }

    const data = validation.data;

    // التحقق من عدم التكرار (إذا لزم)
    const existing = db.prepare('SELECT id FROM table_name WHERE code = ?').get(data.code);
    if (existing) {
      return res.status(400).json({ success: false, message: 'الكود مستخدم مسبقاً' });
    }

    const result = db.prepare(
      'INSERT INTO table_name (name, ...) VALUES (?, ...)'
    ).run(data.name, ...);

    const created = db.prepare('SELECT * FROM table_name WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في إنشاء العنصر' });
  }
});
```

## نمط 4 — PUT تعديل

```typescript
router.put('/:id', authenticate, (req, res) => {
  try {
    const { id } = req.params;
    const item = db.prepare('SELECT * FROM table_name WHERE id = ? AND is_active = 1').get(parseInt(id));
    if (!item) return res.status(404).json({ success: false, message: 'العنصر غير موجود' });

    const validation = updateSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ success: false, message: validation.error.errors[0].message });
    }

    const data = validation.data;
    db.prepare('UPDATE table_name SET name = ?, updated_at = datetime(\'now\') WHERE id = ?')
      .run(data.name, parseInt(id));

    // Audit log
    logAudit((req as AuthRequest).user!.userId, 'UPDATE', 'table_name', parseInt(id), item, data);

    const updated = db.prepare('SELECT * FROM table_name WHERE id = ?').get(parseInt(id));
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في تعديل العنصر' });
  }
});
```

## نمط 5 — DELETE (Soft)

```typescript
router.delete('/:id', authenticate, checkRole('admin'), (req, res) => {
  try {
    const { id } = req.params;
    const item = db.prepare('SELECT * FROM table_name WHERE id = ? AND is_active = 1').get(parseInt(id));
    if (!item) return res.status(404).json({ success: false, message: 'العنصر غير موجود' });

    // تحقق من الاستخدام في جداول أخرى
    const usedIn = db.prepare('SELECT COUNT(*) as c FROM related_table WHERE item_id = ?').get(parseInt(id)) as { c: number };
    if (usedIn.c > 0) {
      return res.status(400).json({ success: false, message: 'لا يمكن الحذف — العنصر مستخدم في سجلات أخرى' });
    }

    db.prepare('UPDATE table_name SET is_active = 0 WHERE id = ?').run(parseInt(id));
    logAudit((req as AuthRequest).user!.userId, 'DELETE', 'table_name', parseInt(id), item, null);

    res.json({ success: true, message: 'تم الحذف بنجاح' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في حذف العنصر' });
  }
});
```

## نمط 6 — Transaction للفواتير

```typescript
router.post('/', authenticate, (req, res) => {
  try {
    const validation = createInvoiceSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ success: false, message: validation.error.errors[0].message });
    }

    const { items, ...invoiceData } = validation.data;

    // التحقق من الكميات قبل Transaction
    for (const item of items) {
      const stock = db.prepare('SELECT quantity, name FROM inventory_items WHERE id = ? AND is_active = 1').get(item.item_id) as { quantity: number; name: string } | undefined;
      if (!stock) return res.status(400).json({ success: false, message: `الصنف ${item.item_id} غير موجود` });
      if (stock.quantity < item.quantity) {
        return res.status(400).json({ success: false, message: `الكمية المتوفرة من "${stock.name}": ${stock.quantity} فقط` });
      }
    }

    // حساب الإجماليات
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price * (1 - (item.discount_percent || 0) / 100)), 0);
    const discountAmount = invoiceData.discount_amount || 0;
    const taxRate = invoiceData.tax_rate || 15;
    const taxAmount = (subtotal - discountAmount) * (taxRate / 100);
    const total = subtotal - discountAmount + taxAmount;

    const createInvoice = db.transaction(() => {
      const invoiceNumber = generateInvoiceNumber('sale');

      const invoiceResult = db.prepare(`
        INSERT INTO sales_invoices (invoice_number, customer_id, payment_type, subtotal, discount_amount, tax_rate, tax_amount, total, paid_amount, date, due_date, notes, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        invoiceNumber, invoiceData.customer_id || null, invoiceData.payment_type,
        subtotal, discountAmount, taxRate, taxAmount, total,
        invoiceData.payment_type === 'cash' ? total : 0,
        invoiceData.date || new Date().toISOString().slice(0, 10),
        invoiceData.due_date || null, invoiceData.notes || null,
        (req as AuthRequest).user!.userId
      );

      const invoiceId = invoiceResult.lastInsertRowid as number;

      for (const item of items) {
        const lineTotal = item.quantity * item.unit_price * (1 - (item.discount_percent || 0) / 100);
        db.prepare('INSERT INTO sales_invoice_items (invoice_id, item_id, quantity, unit_price, discount_percent, total) VALUES (?, ?, ?, ?, ?, ?)')
          .run(invoiceId, item.item_id, item.quantity, item.unit_price, item.discount_percent || 0, lineTotal);

        const currentQty = (db.prepare('SELECT quantity FROM inventory_items WHERE id = ?').get(item.item_id) as { quantity: number }).quantity;
        db.prepare('UPDATE inventory_items SET quantity = quantity - ?, updated_at = datetime(\'now\') WHERE id = ?')
          .run(item.quantity, item.item_id);

        db.prepare('INSERT INTO stock_movements (item_id, type, quantity, reference_type, reference_id, balance_after, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)')
          .run(item.item_id, 'out', item.quantity, 'sale', invoiceId, currentQty - item.quantity, (req as AuthRequest).user!.userId);
      }

      if (invoiceData.payment_type === 'cash') {
        db.prepare('INSERT INTO payments (reference_type, reference_id, amount, payment_method, created_by) VALUES (?, ?, ?, ?, ?)')
          .run('sale', invoiceId, total, 'cash', (req as AuthRequest).user!.userId);
        db.prepare("UPDATE sales_invoices SET status = 'paid' WHERE id = ?").run(invoiceId);
      }

      return db.prepare('SELECT * FROM sales_invoices WHERE id = ?').get(invoiceId);
    });

    const newInvoice = createInvoice();
    res.status(201).json({ success: true, data: newInvoice });
  } catch (error) {
    console.error('Invoice creation error:', error);
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'خطأ في إنشاء الفاتورة' });
  }
});
```

## نمط 7 — Reports (تجميع بيانات)

```typescript
router.get('/dashboard', authenticate, (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const monthStart = today.slice(0, 7) + '-01';

    const todaySales = db.prepare(
      "SELECT COALESCE(SUM(total), 0) as total FROM sales_invoices WHERE date = ? AND status != 'cancelled'"
    ).get(today) as { total: number };

    const monthSales = db.prepare(
      "SELECT COALESCE(SUM(total), 0) as total FROM sales_invoices WHERE date >= ? AND status != 'cancelled'"
    ).get(monthStart) as { total: number };

    const lowStock = db.prepare(
      'SELECT id, name, quantity, min_quantity FROM inventory_items WHERE quantity <= min_quantity AND is_active = 1 ORDER BY quantity ASC LIMIT 10'
    ).all();

    const recentSales = db.prepare(
      "SELECT si.*, c.name as customer_name FROM sales_invoices si LEFT JOIN customers c ON si.customer_id = c.id WHERE si.status != 'cancelled' ORDER BY si.created_at DESC LIMIT 5"
    ).all();

    res.json({
      success: true,
      data: {
        today_sales: todaySales.total,
        month_sales: monthSales.total,
        low_stock_items: lowStock,
        recent_sales: recentSales,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في جلب بيانات لوحة التحكم' });
  }
});
```
