---
name: invoice-logic
description: >
  منطق الفواتير في المُنسق — حساب الإجماليات، خصم/إضافة المخزون، تسجيل المدفوعات.
  استخدم عند العمل على sales.ts أو purchases.ts أو حسابات الفواتير في الـ Frontend.
allowed-tools: editFiles, readFile
---

# Invoice Logic Skill

## حسابات الفاتورة

### حساب إجمالي بند واحد
```typescript
function calcLineTotal(qty: number, unitPrice: number, discountPercent = 0): number {
  return qty * unitPrice * (1 - discountPercent / 100);
}
```

### حساب إجمالي الفاتورة كاملة
```typescript
function calcInvoiceTotals(items: InvoiceItem[], discountAmount = 0, taxRate = 15) {
  const subtotal = items.reduce((sum, item) =>
    sum + calcLineTotal(item.quantity, item.unit_price, item.discount_percent), 0);
  const afterDiscount = Math.max(0, subtotal - discountAmount);
  const taxAmount = afterDiscount * (taxRate / 100);
  const total = afterDiscount + taxAmount;
  return { subtotal, discountAmount, taxRate, taxAmount, total };
}
```

### حالة الدفع التلقائية
```typescript
function getPaymentStatus(total: number, paidAmount: number): 'paid' | 'partial' | 'confirmed' {
  if (paidAmount >= total) return 'paid';
  if (paidAmount > 0) return 'partial';
  return 'confirmed';
}
```

## Backend — إنشاء فاتورة بيع (Transaction كاملة)

```typescript
// في server/routes/sales.ts

const createSaleTransaction = db.transaction((
  invoiceHead: SalesInvoiceHead,
  items: SalesInvoiceItemInput[],
  userId: number
): SalesInvoice => {
  // 1. توليد رقم الفاتورة
  const invoiceNumber = generateInvoiceNumber('sale');

  // 2. حساب الإجماليات
  const subtotal = items.reduce((s, item) =>
    s + item.quantity * item.unit_price * (1 - (item.discount_percent || 0) / 100), 0);
  const discountAmount = invoiceHead.discount_amount || 0;
  const taxRate = invoiceHead.tax_rate ?? 15;
  const afterDiscount = Math.max(0, subtotal - discountAmount);
  const taxAmount = afterDiscount * (taxRate / 100);
  const total = afterDiscount + taxAmount;
  const isCash = invoiceHead.payment_type === 'cash';

  // 3. إدراج رأس الفاتورة
  const invResult = db.prepare(`
    INSERT INTO sales_invoices
      (invoice_number, customer_id, payment_type, subtotal, discount_amount, tax_rate, tax_amount, total, paid_amount, status, date, due_date, notes, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    invoiceNumber,
    invoiceHead.customer_id ?? null,
    invoiceHead.payment_type,
    subtotal, discountAmount, taxRate, taxAmount, total,
    isCash ? total : 0,
    isCash ? 'paid' : 'confirmed',
    invoiceHead.date ?? new Date().toISOString().slice(0, 10),
    invoiceHead.due_date ?? null,
    invoiceHead.notes ?? null,
    userId
  );
  const invoiceId = invResult.lastInsertRowid as number;

  // 4. إدراج بنود الفاتورة + تحديث المخزون
  for (const item of items) {
    const lineTotal = item.quantity * item.unit_price * (1 - (item.discount_percent || 0) / 100);

    db.prepare(`INSERT INTO sales_invoice_items (invoice_id, item_id, quantity, unit_price, discount_percent, total) VALUES (?, ?, ?, ?, ?, ?)`)
      .run(invoiceId, item.item_id, item.quantity, item.unit_price, item.discount_percent || 0, lineTotal);

    const currentItem = db.prepare('SELECT quantity FROM inventory_items WHERE id = ?').get(item.item_id) as { quantity: number };
    const newQty = currentItem.quantity - item.quantity;

    db.prepare('UPDATE inventory_items SET quantity = ?, updated_at = datetime(\'now\') WHERE id = ?')
      .run(newQty, item.item_id);

    db.prepare(`INSERT INTO stock_movements (item_id, type, quantity, reference_type, reference_id, balance_after, created_by) VALUES (?, 'out', ?, 'sale', ?, ?, ?)`)
      .run(item.item_id, item.quantity, invoiceId, newQty, userId);
  }

  // 5. إنشاء سجل دفع تلقائي للكاش
  if (isCash) {
    db.prepare(`INSERT INTO payments (reference_type, reference_id, amount, payment_method, created_by) VALUES ('sale', ?, ?, 'cash', ?)`)
      .run(invoiceId, total, userId);
  }

  // 6. إعادة الفاتورة الكاملة
  return db.prepare(`
    SELECT si.*, c.name as customer_name
    FROM sales_invoices si
    LEFT JOIN customers c ON si.customer_id = c.id
    WHERE si.id = ?
  `).get(invoiceId) as SalesInvoice;
});
```

## Backend — إلغاء فاتورة (إعادة المخزون)

```typescript
router.delete('/:id', authenticate, (req, res) => {
  const { id } = req.params;
  const invoice = db.prepare('SELECT * FROM sales_invoices WHERE id = ?').get(parseInt(id)) as SalesInvoice | undefined;

  if (!invoice) return res.status(404).json({ success: false, message: 'الفاتورة غير موجودة' });
  if (invoice.status === 'cancelled') return res.status(400).json({ success: false, message: 'الفاتورة ملغاة مسبقاً' });

  const cancelInvoice = db.transaction(() => {
    const items = db.prepare('SELECT * FROM sales_invoice_items WHERE invoice_id = ?').all(parseInt(id)) as SalesInvoiceItem[];

    for (const item of items) {
      db.prepare('UPDATE inventory_items SET quantity = quantity + ?, updated_at = datetime(\'now\') WHERE id = ?')
        .run(item.quantity, item.item_id);
      db.prepare(`INSERT INTO stock_movements (item_id, type, quantity, reference_type, reference_id, note, created_by) VALUES (?, 'in', ?, 'sale', ?, 'إلغاء فاتورة', ?)`)
        .run(item.item_id, item.quantity, parseInt(id), (req as AuthRequest).user!.userId);
    }

    db.prepare("UPDATE sales_invoices SET status = 'cancelled' WHERE id = ?").run(parseInt(id));
  });

  cancelInvoice();
  res.json({ success: true, message: 'تم إلغاء الفاتورة وإعادة الكميات للمخزون' });
});
```

## Backend — تسجيل دفعة على فاتورة

```typescript
router.post('/:id/payments', authenticate, (req, res) => {
  const { id } = req.params;
  const { amount, payment_method = 'cash', notes } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ success: false, message: 'مبلغ الدفعة غير صحيح' });
  }

  const invoice = db.prepare('SELECT * FROM sales_invoices WHERE id = ?').get(parseInt(id)) as SalesInvoice | undefined;
  if (!invoice) return res.status(404).json({ success: false, message: 'الفاتورة غير موجودة' });
  if (invoice.status === 'cancelled') return res.status(400).json({ success: false, message: 'الفاتورة ملغاة' });

  const remaining = invoice.total - invoice.paid_amount;
  if (amount > remaining + 0.001) { // tolerance للـ floating point
    return res.status(400).json({ success: false, message: `المبلغ المتبقي ${remaining.toFixed(2)} فقط` });
  }

  db.transaction(() => {
    db.prepare('INSERT INTO payments (reference_type, reference_id, amount, payment_method, notes, created_by) VALUES (?, ?, ?, ?, ?, ?)')
      .run('sale', parseInt(id), amount, payment_method, notes || null, (req as AuthRequest).user!.userId);

    const newPaid = invoice.paid_amount + amount;
    const newStatus = newPaid >= invoice.total - 0.001 ? 'paid' : 'partial';

    db.prepare('UPDATE sales_invoices SET paid_amount = ?, status = ? WHERE id = ?')
      .run(newPaid, newStatus, parseInt(id));
  })();

  const updated = db.prepare('SELECT * FROM sales_invoices WHERE id = ?').get(parseInt(id));
  res.json({ success: true, data: updated });
});
```

## Frontend — نموذج إنشاء فاتورة (React)

```tsx
// حالة النموذج
const [formData, setFormData] = useState({
  customer_id: null as number | null,
  payment_type: 'cash' as 'cash' | 'credit' | 'bank',
  discount_amount: 0,
  tax_rate: 15,
  date: new Date().toISOString().slice(0, 10),
  notes: '',
  items: [] as Array<{
    item_id: number;
    item_name: string;
    quantity: number;
    unit_price: number;
    discount_percent: number;
  }>,
});

// حساب الإجماليات في real-time
const totals = useMemo(() => {
  const subtotal = formData.items.reduce((s, item) =>
    s + item.quantity * item.unit_price * (1 - item.discount_percent / 100), 0);
  const afterDiscount = Math.max(0, subtotal - formData.discount_amount);
  const taxAmount = afterDiscount * (formData.tax_rate / 100);
  return { subtotal, afterDiscount, taxAmount, total: afterDiscount + taxAmount };
}, [formData.items, formData.discount_amount, formData.tax_rate]);

// عرض الإجماليات
<div className="bg-slate-900 rounded-xl p-4 space-y-2 text-sm">
  <div className="flex justify-between text-slate-400">
    <span>المجموع الفرعي</span>
    <span className="font-mono">{totals.subtotal.toFixed(2)} ر.س</span>
  </div>
  <div className="flex justify-between text-slate-400">
    <span>الخصم</span>
    <span className="font-mono text-red-400">- {formData.discount_amount.toFixed(2)} ر.س</span>
  </div>
  <div className="flex justify-between text-slate-400">
    <span>ضريبة القيمة المضافة ({formData.tax_rate}%)</span>
    <span className="font-mono">{totals.taxAmount.toFixed(2)} ر.س</span>
  </div>
  <div className="flex justify-between text-white font-bold text-base border-t border-slate-700 pt-2">
    <span>الإجمالي</span>
    <span className="font-mono text-emerald-400">{totals.total.toFixed(2)} ر.س</span>
  </div>
</div>
```
