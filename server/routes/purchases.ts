// ══════════════════════════════════════════════════════════════════════════════
// server/routes/purchases.ts
// المهمة 7-1 إلى 7-3: CRUD كامل لفواتير المشتريات مع التأثير على المخزون
//
// GET    /api/v1/purchases             — قائمة فواتير الشراء مع الفلاتر
// GET    /api/v1/purchases/:id         — تفاصيل فاتورة شراء واحدة مع بنودها
// POST   /api/v1/purchases             — إنشاء فاتورة شراء جديدة (زيادة المخزون)
// PUT    /api/v1/purchases/:id         — تعديل فاتورة شراء (reverse + apply)
// DELETE /api/v1/purchases/:id         — إلغاء فاتورة شراء (نزع الكميات)
//
// POST   /api/v1/purchases/:id/payments — تسجيل دفعة على فاتورة
// GET    /api/v1/purchases/:id/payments — سجل مدفوعات فاتورة
// ══════════════════════════════════════════════════════════════════════════════

import { Router, Request, Response } from "express";
import { z, ZodError } from "zod";
import db, { generateInvoiceNumber } from "../db.js";
import { verifyToken, checkRole } from "../middleware/auth.js";
import type {
  DbPurchaseInvoice,
  PurchaseInvoiceWithDetails,
  SalesInvoiceItem,
  DbPayment,
  ApiResponse,
  DbSupplier,
  DbInventoryItem,
} from "../types.js";

const router = Router();

router.use(verifyToken);

const createPurchaseInvoiceSchema = z.object({
  supplier_id: z.number().int().positive().optional().nullable(),
  date: z.string().optional(),
  due_date: z.string().optional(),
  payment_type: z.enum(["cash", "credit", "partial"]).default("credit"),
  items: z.array(z.object({
    item_id: z.number().int().positive(),
    quantity: z.number().positive(),
    unit_price: z.number().nonnegative(),
    discount: z.number().nonnegative().default(0),
  })).min(1, "يجب إضافة صنف واحد على الأقل"),
  discount_amount: z.number().nonnegative().default(0),
  notes: z.string().max(500).optional().nullable(),
});

const updatePurchaseInvoiceSchema = createPurchaseInvoiceSchema.partial();

const createPaymentSchema = z.object({
  amount: z.number().positive(),
  payment_date: z.string().optional(),
  payment_method: z.enum(["cash", "bank", "check"]).default("cash"),
  reference_number: z.string().max(100).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

function parseId(param: string): number | null {
  const id = parseInt(param, 10);
  return isNaN(id) || id <= 0 ? null : id;
}

function handleZodError(err: ZodError, res: Response): void {
  res.status(400).json({
    success: false,
    error: "بيانات غير صالحة",
    details: err.issues.map((e) => ({ field: e.path.join("."), message: e.message })),
  });
}

// Invoice numbers are generated centrally in server/db.ts -> generateInvoiceNumber('purchase')

function calculateTotals(items: Array<{ quantity: number; unit_price: number; discount: number }>, discountAmount: number, taxRate = 15) {
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price - item.discount), 0);
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = taxableAmount * (taxRate / 100);
  const total = taxableAmount + taxAmount;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discount_amount: discountAmount,
    tax_rate: taxRate,
    tax_amount: Math.round(taxAmount * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

function updateItemStockForPurchase(item_id: number, quantity: number, unit_price: number, invoiceId: number, userId: number) {
  const item = db.prepare("SELECT quantity, cost_price FROM inventory_items WHERE id = ? AND is_active = 1").get(item_id) as DbInventoryItem | undefined;
  if (!item) throw new Error(`الصنف ${item_id} غير موجود`);

  const newQuantity = item.quantity + quantity;
  const newCostPrice = newQuantity > 0
    ? ((item.quantity * item.cost_price) + (quantity * unit_price)) / newQuantity
    : unit_price;

  db.prepare("UPDATE inventory_items SET quantity = ?, cost_price = ?, updated_at = datetime('now') WHERE id = ?")
    .run(newQuantity, Math.round(newCostPrice * 100) / 100, item_id);

  db.prepare(`
    INSERT INTO stock_movements (item_id, type, quantity, balance_after, reference_type, reference_id, note, created_by, created_at)
    VALUES (?, 'in', ?, ?, 'purchase', ?, 'إضافة المخزون من فاتورة مشتريات', ?, datetime('now'))
  `).run(item_id, quantity, newQuantity, invoiceId, userId);
}

function rollbackPurchaseStock(invoiceId: number, userId: number) {
  const items = db.prepare("SELECT item_id, quantity FROM purchase_invoice_items WHERE invoice_id = ?").all(invoiceId) as Array<{ item_id: number; quantity: number }>;
  const stmt = db.prepare("UPDATE inventory_items SET quantity = quantity - ?, updated_at = datetime('now') WHERE id = ?");
  const movementStmt = db.prepare(`
    INSERT INTO stock_movements (item_id, type, quantity, balance_after, reference_type, reference_id, note, created_by, created_at)
    VALUES (?, 'out', ?, (SELECT quantity FROM inventory_items WHERE id = ?), 'purchase', ?, 'سحب المخزون بعد إلغاء/تعديل فاتورة مشتريات', ?, datetime('now'))
  `);

  for (const item of items) {
    stmt.run(item.quantity, item.item_id);
    movementStmt.run(item.item_id, item.quantity, item.item_id, invoiceId, userId);
  }
}

function getPurchaseBalance(supplierId: number) {
  const invoicesTotal = (db.prepare(`
    SELECT COALESCE(SUM(total), 0) as total
    FROM purchase_invoices WHERE supplier_id = ? AND status != 'cancelled'
  `).get(supplierId) as { total: number }).total;

  const paymentsTotal = (db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total
    FROM payments WHERE type = 'purchase' AND invoice_id IN (
      SELECT id FROM purchase_invoices WHERE supplier_id = ?
    )
  `).get(supplierId) as { total: number }).total;

  return {
    total_invoices: invoicesTotal,
    total_paid: paymentsTotal,
    total_due: invoicesTotal - paymentsTotal,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/v1/purchases
// ══════════════════════════════════════════════════════════════════════════════

router.get("/", (req: Request, res: Response<ApiResponse<{ invoices: PurchaseInvoiceWithDetails[]; total: number; page: number; totalPages: number }>>) => {
  try {
    const {
      supplier_id,
      status,
      payment_type,
      date_from,
      date_to,
      search,
      page = "1",
      limit = "20",
      sortBy = "created_at",
      sortOrder = "desc",
    } = req.query;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;
    const offset = (pageNum - 1) * limitNum;

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (supplier_id) {
      conditions.push("pi.supplier_id = ?");
      params.push(supplier_id);
    }

    if (status) {
      conditions.push("pi.status = ?");
      params.push(status);
    }

    if (payment_type) {
      conditions.push("pi.payment_type = ?");
      params.push(payment_type);
    }

    if (date_from) {
      conditions.push("pi.date >= ?");
      params.push(date_from);
    }

    if (date_to) {
      conditions.push("pi.date <= ?");
      params.push(date_to);
    }

    if (search) {
      conditions.push("(pi.invoice_number LIKE ? OR s.name LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const count = (db.prepare(`
      SELECT COUNT(*) as total
      FROM purchase_invoices pi
      LEFT JOIN suppliers s ON pi.supplier_id = s.id
      ${whereClause}
    `).get(...params) as { total: number }).total;

    const rows = db.prepare(`
      SELECT pi.*, s.name as supplier_name, s.phone as supplier_phone, (pi.total - pi.paid_amount) as remaining_amount
      FROM purchase_invoices pi
      LEFT JOIN suppliers s ON pi.supplier_id = s.id
      ${whereClause}
      ORDER BY pi.${sortBy} ${sortOrder}
      LIMIT ? OFFSET ?
    `).all(...params, limitNum, offset) as PurchaseInvoiceWithDetails[];

    for (const invoice of rows) {
      invoice.items = db.prepare(`
        SELECT pii.*, ii.name as item_name, ii.sku as item_sku
        FROM purchase_invoice_items pii
        JOIN inventory_items ii ON pii.item_id = ii.id
        WHERE pii.invoice_id = ?
        ORDER BY pii.id
      `).all(invoice.id) as SalesInvoiceItem[];
    }

    res.json({
      success: true,
      data: {
        invoices: rows,
        total: count,
        page: pageNum,
        totalPages: Math.ceil(count / limitNum),
      },
    });
  } catch (error) {
    console.error("خطأ في جلب فواتير الشراء:", error);
    res.status(500).json({ success: false, error: "فشل في جلب فواتير الشراء" });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/v1/purchases/:id
// ══════════════════════════════════════════════════════════════════════════════

router.get("/:id", (req: Request, res: Response<ApiResponse<PurchaseInvoiceWithDetails>>) => {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ success: false, error: "معرّف الفاتورة غير صالح" });
    }

    const invoice = db.prepare(`
      SELECT pi.*, s.name as supplier_name, s.phone as supplier_phone, (pi.total - pi.paid_amount) as remaining_amount
      FROM purchase_invoices pi
      LEFT JOIN suppliers s ON pi.supplier_id = s.id
      WHERE pi.id = ?
    `).get(id) as PurchaseInvoiceWithDetails | undefined;

    if (!invoice) {
      return res.status(404).json({ success: false, error: "فاتورة الشراء غير موجودة" });
    }

    invoice.items = db.prepare(`
      SELECT pii.*, ii.name as item_name, ii.sku as item_sku
      FROM purchase_invoice_items pii
      JOIN inventory_items ii ON pii.item_id = ii.id
      WHERE pii.invoice_id = ?
      ORDER BY pii.id
    `).all(id) as SalesInvoiceItem[];

    res.json({ success: true, data: invoice });
  } catch (error) {
    console.error("خطأ في جلب تفاصيل فاتورة الشراء:", error);
    res.status(500).json({ success: false, error: "فشل في جلب تفاصيل فاتورة الشراء" });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/v1/purchases
// ══════════════════════════════════════════════════════════════════════════════

router.post("/", checkRole("admin", "accountant"), (req: Request, res: Response<ApiResponse<PurchaseInvoiceWithDetails>>) => {
  let data: z.infer<typeof createPurchaseInvoiceSchema>;

  try {
    data = createPurchaseInvoiceSchema.parse(req.body);
  } catch (err) {
    if (err instanceof ZodError) {
      handleZodError(err, res);
      return;
    }
    throw err;
  }

  const userId = req.user!.userId;

  // التحققات الأساسية
  for (const item of data.items) {
    const inv = db.prepare("SELECT * FROM inventory_items WHERE id = ? AND is_active = 1").get(item.item_id) as DbInventoryItem | undefined;
    if (!inv) {
      return res.status(404).json({ success: false, error: `الصنف ${item.item_id} غير موجود أو غير مفعل` });
    }
  }

  const totals = calculateTotals(data.items, data.discount_amount);
  const invoiceNumber = generateInvoiceNumber('purchase');
  const date = data.date || new Date().toISOString().split("T")[0];
  const dueDate = data.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const createTx = db.transaction(() => {
    const insertInvoice = db.prepare(`
      INSERT INTO purchase_invoices
        (invoice_number, supplier_id, date, due_date, status, payment_type, subtotal, discount_amount, tax_rate, tax_amount, total, paid_amount, notes, created_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);

    const paidAmount = data.payment_type === "cash" ? totals.total : 0;
    const status = data.payment_type === "cash" ? "paid" : "confirmed";

    const result = insertInvoice.run(
      invoiceNumber,
      data.supplier_id ?? null,
      date,
      dueDate,
      status,
      data.payment_type,
      totals.subtotal,
      totals.discount_amount,
      totals.tax_rate,
      totals.tax_amount,
      totals.total,
      paidAmount,
      data.notes ?? null,
      userId,
    );

    const invoiceId = result.lastInsertRowid as number;

    const itemStmt = db.prepare(`
      INSERT INTO purchase_invoice_items (invoice_id, item_id, quantity, unit_price, discount, total)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const item of data.items) {
      const itemTotal = item.quantity * item.unit_price - item.discount;
      itemStmt.run(invoiceId, item.item_id, item.quantity, item.unit_price, item.discount, itemTotal);
      updateItemStockForPurchase(item.item_id, item.quantity, item.unit_price, invoiceId, userId);
    }

    if (data.payment_type === "cash") {
      db.prepare(`
        INSERT INTO payments (type, invoice_id, amount, payment_date, payment_method, notes, created_by, created_at)
        VALUES ('purchase', ?, ?, ?, 'cash', 'دفع نقدي تلقائي', ?, datetime('now'))
      `).run(invoiceId, totals.total, date, userId);
    }

    return invoiceId;
  });

  const invoiceId = createTx();

  const resultInvoice = db.prepare(`
    SELECT pi.*, s.name as supplier_name, s.phone as supplier_phone, (pi.total - pi.paid_amount) as remaining_amount
    FROM purchase_invoices pi
    LEFT JOIN suppliers s ON pi.supplier_id = s.id
    WHERE pi.id = ?
  `).get(invoiceId) as PurchaseInvoiceWithDetails;

  resultInvoice.items = db.prepare(`
    SELECT pii.*, ii.name as item_name, ii.sku as item_sku
    FROM purchase_invoice_items pii
    JOIN inventory_items ii ON pii.item_id = ii.id
    WHERE pii.invoice_id = ?
    ORDER BY pii.id
  `).all(invoiceId) as SalesInvoiceItem[];

  res.status(201).json({ success: true, data: resultInvoice, message: `تم إنشاء فاتورة شراء ${invoiceNumber}` });
});

// ══════════════════════════════════════════════════════════════════════════════
// PUT /api/v1/purchases/:id
// ══════════════════════════════════════════════════════════════════════════════

router.put("/:id", checkRole("admin", "accountant"), (req: Request, res: Response<ApiResponse<PurchaseInvoiceWithDetails>>) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ success: false, error: "معرّف الفاتورة غير صالح" });

    const existing = db.prepare("SELECT * FROM purchase_invoices WHERE id = ?").get(id) as DbPurchaseInvoice | undefined;
    if (!existing) return res.status(404).json({ success: false, error: "فاتورة الشراء غير موجودة" });
    if (existing.status === "paid") return res.status(400).json({ success: false, error: "لا يمكن تعديل فاتورة مشتريات مدفوعة" });

    let data: z.infer<typeof updatePurchaseInvoiceSchema>;
    try {
      data = updatePurchaseInvoiceSchema.parse(req.body);
    } catch (err) {
      if (err instanceof ZodError) {
        handleZodError(err, res); return;
      }
      throw err;
    }

    const userId = req.user!.userId;

    const oldItems = db.prepare("SELECT item_id, quantity, unit_price FROM purchase_invoice_items WHERE invoice_id = ?").all(id) as Array<{ item_id:number; quantity:number; unit_price:number }>;

    // تراجع الكميات القديمة
    rollbackPurchaseStock(id, userId);

    // حذف البنود القديمة
    db.prepare("DELETE FROM purchase_invoice_items WHERE invoice_id = ?").run(id);

    const newItems = data.items ?? oldItems.map(i => ({ item_id: i.item_id, quantity: i.quantity, unit_price: i.unit_price, discount: 0 }));

    for (const item of newItems) {
      const inv = db.prepare("SELECT * FROM inventory_items WHERE id = ? AND is_active = 1").get(item.item_id) as DbInventoryItem | undefined;
      if (!inv) return res.status(404).json({ success: false, error: `الصنف ${item.item_id} غير موجود أو غير مفعل` });
    }

    const totals = calculateTotals(newItems, data.discount_amount ?? existing.discount_amount);

    const itemStmt = db.prepare("INSERT INTO purchase_invoice_items (invoice_id, item_id, quantity, unit_price, discount, total) VALUES (?, ?, ?, ?, ?, ?)");
    for (const item of newItems) {
        const itemTotal = item.quantity * item.unit_price - item.discount;
        itemStmt.run(id, item.item_id, item.quantity, item.unit_price, item.discount, itemTotal);
        updateItemStockForPurchase(item.item_id, item.quantity, item.unit_price, id, userId);
      }
    const newPaid = existing.paid_amount;
    let newStatus: DbPurchaseInvoice["status"] = existing.status;
    if (newPaid >= totals.total) newStatus = "paid";
    else if (newPaid > 0) newStatus = "partial";
    else newStatus = existing.status;

    db.prepare(`
      UPDATE purchase_invoices SET supplier_id = ?, date = ?, due_date = ?, payment_type = ?, subtotal = ?, discount_amount = ?, tax_rate = ?, tax_amount = ?, total = ?, notes = ?, status = ?, updated_at = datetime('now') WHERE id = ?
    `).run(
      data.supplier_id ?? existing.supplier_id,
      data.date ?? existing.date,
      data.due_date ?? existing.due_date,
      data.payment_type ?? existing.payment_type,
      totals.subtotal,
      totals.discount_amount,
      totals.tax_rate,
      totals.tax_amount,
      totals.total,
      data.notes ?? existing.notes,
      newStatus,
      id,
    );

    const invoice = db.prepare(`
      SELECT pi.*, s.name as supplier_name, s.phone as supplier_phone, (pi.total - pi.paid_amount) as remaining_amount
      FROM purchase_invoices pi
      LEFT JOIN suppliers s ON pi.supplier_id = s.id
      WHERE pi.id = ?
    `).get(id) as PurchaseInvoiceWithDetails;

    invoice.items = db.prepare(`
      SELECT pii.*, ii.name as item_name, ii.sku as item_sku
      FROM purchase_invoice_items pii
      JOIN inventory_items ii ON pii.item_id = ii.id
      WHERE pii.invoice_id = ?
      ORDER BY pii.id
    `).all(id) as SalesInvoiceItem[];

    return res.json({ success: true, data: invoice, message: "تم تحديث الفاتورة" });
  } catch (error) {
    console.error("خطأ في تعديل فاتورة المشتريات:", error);
    res.status(500).json({ success: false, error: "فشل في تعديل الفاتورة" });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// DELETE /api/v1/purchases/:id
// ══════════════════════════════════════════════════════════════════════════════

router.delete("/:id", checkRole("admin", "accountant"), (req: Request, res: Response<ApiResponse<{ message:string }>>) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ success: false, error: "معرّف الفاتورة غير صالح" });

    const invoice = db.prepare("SELECT * FROM purchase_invoices WHERE id = ?").get(id) as DbPurchaseInvoice | undefined;
    if (!invoice) return res.status(404).json({ success: false, error: "فاتورة الشراء غير موجودة" });
    if (invoice.status === "paid") return res.status(400).json({ success: false, error: "لا يمكن إلغاء فاتورة مشتريات مدفوعة" });

    const userId = req.user!.userId;

    const deleteTx = db.transaction(() => {
      rollbackPurchaseStock(id, userId);
      db.prepare("UPDATE purchase_invoices SET status = 'cancelled', updated_at = datetime('now') WHERE id = ?").run(id);
    });

    deleteTx();

    return res.json({ success: true, data: { message: "تم إلغاء الفاتورة بنجاح" } });
  } catch (error) {
    console.error("خطأ في إلغاء فاتورة المشتريات:", error);
    res.status(500).json({ success: false, error: "فشل في إلغاء الفاتورة" });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/v1/purchases/:id/payments
// ══════════════════════════════════════════════════════════════════════════════

router.post("/:id/payments", checkRole("admin", "accountant"), (req: Request, res: Response<ApiResponse<DbPayment>>) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ success: false, error: "معرّف الفاتورة غير صالح" });

    const data = createPaymentSchema.parse(req.body);
    const userId = req.user!.userId;

    const invoice = db.prepare("SELECT * FROM purchase_invoices WHERE id = ?").get(id) as DbPurchaseInvoice | undefined;
    if (!invoice) return res.status(404).json({ success: false, error: "فاتورة الشراء غير موجودة" });
    if (invoice.status === "cancelled") return res.status(400).json({ success: false, error: "لا يمكن تسجيل دفعة على فاتورة ملغاة" });

    const remaining = invoice.total - invoice.paid_amount;
    if (data.amount > remaining) return res.status(400).json({ success: false, error: `المبلغ ${data.amount} أكبر من الباقي ${remaining}` });

    const paymentTx = db.transaction(() => {
      const r = db.prepare(`
        INSERT INTO payments (type, invoice_id, amount, payment_date, payment_method, reference_number, notes, created_by, created_at)
        VALUES ('purchase', ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).run(id, data.amount, data.payment_date ?? new Date().toISOString().split("T")[0], data.payment_method, data.reference_number ?? null, data.notes ?? null, userId);

      const paidAfter = invoice.paid_amount + data.amount;
      let status = invoice.status;
      if (paidAfter >= invoice.total) status = "paid";
      else if (paidAfter > 0) status = "partial";

      db.prepare("UPDATE purchase_invoices SET paid_amount = ?, status = ?, updated_at = datetime('now') WHERE id = ?").run(paidAfter, status, id);
      return r.lastInsertRowid as number;
    });

    const paymentId = paymentTx();
    const payment = db.prepare("SELECT * FROM payments WHERE id = ?").get(paymentId) as DbPayment;

    return res.status(201).json({ success: true, data: payment, message: "تم تسجيل الدفعة بنجاح" });
  } catch (err) {
    if (err instanceof ZodError) {
      handleZodError(err, res);
      return;
    }
    console.error("خطأ في تسجيل دفعة مشتريات:", err);
    res.status(500).json({ success: false, error: "فشل في تسجيل الدفعة" });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/v1/purchases/:id/payments
// ══════════════════════════════════════════════════════════════════════════════

router.get("/:id/payments", (req: Request, res: Response<ApiResponse<DbPayment[]>>) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ success: false, error: "معرّف الفاتورة غير صالح" });

    const invoice = db.prepare("SELECT id FROM purchase_invoices WHERE id = ?").get(id);
    if (!invoice) return res.status(404).json({ success: false, error: "فاتورة الشراء غير موجودة" });

    const payments = db.prepare(`
      SELECT * FROM payments WHERE type = 'purchase' AND invoice_id = ? ORDER BY payment_date DESC, created_at DESC
    `).all(id) as DbPayment[];

    return res.json({ success: true, data: payments });
  } catch (error) {
    console.error("خطأ في جلب مدفوعات فاتورة المشتريات:", error);
    res.status(500).json({ success: false, error: "فشل في جلب المدفوعات" });
  }
});

export default router;
