// ══════════════════════════════════════════════════════════════════════════════
// server/routes/customers.ts
// المهمة 5-1 و 5-2: CRUD كامل للعملاء مع حساب الأرصدة
//
// GET    /api/v1/customers       — قائمة العملاء مع الفلاتر والأرصدة
// GET    /api/v1/customers/:id   — تفاصيل عميل واحد
// POST   /api/v1/customers       — إنشاء عميل جديد
// PUT    /api/v1/customers/:id   — تعديل بيانات عميل
// DELETE /api/v1/customers/:id   — حذف (soft-delete)
//
// GET    /api/v1/customers/:id/invoices  — فواتير العميل
// GET    /api/v1/customers/:id/payments  — مدفوعات العميل
// GET    /api/v1/customers/:id/statement — كشف حساب العميل
// ══════════════════════════════════════════════════════════════════════════════

import { Router, Request, Response } from "express";
import { z, ZodError } from "zod";
import db from "../db.js";
import { verifyToken, checkRole } from "../middleware/auth.js";
import type { DbCustomer, CustomerWithStats } from "../types.js";

const router = Router();

// جميع routes تتطلب تسجيل الدخول
router.use(verifyToken);

// ══════════════════════════════════════════════════════════════════════════════
// Zod Schemas
// ══════════════════════════════════════════════════════════════════════════════

const createCustomerSchema = z.object({
  name: z.string().min(2, "اسم العميل يجب أن يحتوي على حرفين على الأقل").max(150, "الاسم طويل جدًا"),
  phone: z.string().max(20, "رقم الهاتف طويل جدًا").optional().nullable(),
  email: z.string().email("البريد الإلكتروني غير صالح").optional().nullable(),
  address: z.string().max(300, "العنوان طويل جدًا").optional().nullable(),
  tax_number: z.string().max(50, "رقم الضريبة طويل جدًا").optional().nullable(),
  credit_limit: z.number().nonnegative().default(0),
  notes: z.string().max(500, "الملاحظات طويلة جدًا").optional().nullable(),
});

const updateCustomerSchema = createCustomerSchema.partial().extend({
  is_active: z.number().int().min(0).max(1).optional(),
});

// ─── أنواع محلية ─────────────────────────────────────────────────────────────
interface Transaction {
  type: string;
  id: number;
  reference: string;
  transaction_date: string;
  debit: number;
  credit: number;
  notes: string | null;
  balance?: number;
}

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

function getCustomerBalance(customerId: number): { total_invoices: number; total_paid: number; total_due: number } {
  // إجمالي الفواتير (مبيعات)
  const invoicesTotal = (db.prepare(`
    SELECT COALESCE(SUM(total), 0) as total
    FROM sales_invoices
    WHERE customer_id = ? AND status != 'cancelled'
  `).get(customerId) as { total: number }).total;

  // إجمالي المدفوعات
  const paymentsTotal = (db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total
    FROM payments
    WHERE type = 'sales' AND invoice_id IN (
      SELECT id FROM sales_invoices WHERE customer_id = ?
    )
  `).get(customerId) as { total: number }).total;

  const total_due = invoicesTotal - paymentsTotal;

  return {
    total_invoices: invoicesTotal,
    total_paid: paymentsTotal,
    total_due,
  };
}

function enrichCustomer(customer: DbCustomer): CustomerWithStats {
  const stats = getCustomerBalance(customer.id);
  return { ...customer, ...stats };
}

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/v1/customers
// قائمة العملاء مع الفلاتر والأرصدة
// ══════════════════════════════════════════════════════════════════════════════

router.get("/", (req: Request, res: Response): void => {
  const { search, has_balance, is_active = "1" } = req.query as Record<string, string>;

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (is_active !== "all") {
    conditions.push("is_active = ?");
    params.push(is_active === "0" ? 0 : 1);
  }

  if (search?.trim()) {
    conditions.push("(name LIKE ? OR phone LIKE ? OR email LIKE ?)");
    const q = `%${search.trim()}%`;
    params.push(q, q, q);
  }

  if (has_balance === "true") {
    // عملاء لهم رصيد مستحق (total_due > 0)
    conditions.push(`
      id IN (
        SELECT customer_id FROM sales_invoices
        WHERE status != 'cancelled'
        GROUP BY customer_id
        HAVING SUM(total) > COALESCE((
          SELECT SUM(amount) FROM payments
          WHERE type = 'sales' AND invoice_id IN (
            SELECT id FROM sales_invoices WHERE customer_id = sales_invoices.customer_id
          )
        ), 0)
      )
    `);
  }

  const whereClause = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";

  const customers = db.prepare(`
    SELECT * FROM customers
    ${whereClause}
    ORDER BY name ASC
  `).all(...params) as DbCustomer[];

  const enriched = customers.map(enrichCustomer);

  res.status(200).json({
    success: true,
    data: {
      customers: enriched,
      total: enriched.length,
    },
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/v1/customers/:id
// تفاصيل عميل واحد مع إحصاءاته
// ══════════════════════════════════════════════════════════════════════════════

router.get("/:id", (req: Request, res: Response): void => {
  const id = parseId(req.params.id);
  if (!id) {
    res.status(400).json({ success: false, error: "معرّف العميل غير صالح" });
    return;
  }

  const customer = db.prepare("SELECT * FROM customers WHERE id = ?").get(id) as DbCustomer | undefined;
  if (!customer) {
    res.status(404).json({ success: false, error: "العميل غير موجود" });
    return;
  }

  res.status(200).json({
    success: true,
    data: { customer: enrichCustomer(customer) },
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/v1/customers
// إنشاء عميل جديد
// ══════════════════════════════════════════════════════════════════════════════

router.post("/", checkRole("admin"), (req: Request, res: Response): void => {
  let parsed: z.infer<typeof createCustomerSchema>;
  try {
    parsed = createCustomerSchema.parse(req.body);
  } catch (err) {
    if (err instanceof ZodError) {
      handleZodError(err, res);
      return;
    }
    throw err;
  }

  // التحقق من عدم تكرار الاسم
  const nameExists = db.prepare("SELECT id FROM customers WHERE name = ?").get(parsed.name);
  if (nameExists) {
    res.status(409).json({
      success: false,
      error: `عميل بالاسم "${parsed.name}" موجود بالفعل`,
    });
    return;
  }

  // التحقق من عدم تكرار رقم الهاتف إذا أُدخل
  if (parsed.phone) {
    const phoneExists = db.prepare("SELECT id FROM customers WHERE phone = ?").get(parsed.phone);
    if (phoneExists) {
      res.status(409).json({
        success: false,
        error: `رقم الهاتف "${parsed.phone}" مستخدم بالفعل`,
      });
      return;
    }
  }

  const result = db.prepare(`
    INSERT INTO customers
      (name, phone, email, address, tax_number, credit_limit, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    parsed.name,
    parsed.phone ?? null,
    parsed.email ?? null,
    parsed.address ?? null,
    parsed.tax_number ?? null,
    parsed.credit_limit,
    parsed.notes ?? null,
  );

  const newCustomer = db.prepare("SELECT * FROM customers WHERE id = ?").get(result.lastInsertRowid) as DbCustomer;

  res.status(201).json({
    success: true,
    data: { customer: enrichCustomer(newCustomer) },
    message: `تم إنشاء العميل "${parsed.name}" بنجاح`,
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// PUT /api/v1/customers/:id
// تعديل بيانات عميل
// ══════════════════════════════════════════════════════════════════════════════

router.put("/:id", checkRole("admin"), (req: Request, res: Response): void => {
  const id = parseId(req.params.id);
  if (!id) {
    res.status(400).json({ success: false, error: "معرّف العميل غير صالح" });
    return;
  }

  const existing = db.prepare("SELECT * FROM customers WHERE id = ?").get(id) as DbCustomer | undefined;
  if (!existing) {
    res.status(404).json({ success: false, error: "العميل غير موجود" });
    return;
  }

  let parsed: z.infer<typeof updateCustomerSchema>;
  try {
    parsed = updateCustomerSchema.parse(req.body);
  } catch (err) {
    if (err instanceof ZodError) {
      handleZodError(err, res);
      return;
    }
    throw err;
  }

  // التحقق من عدم تكرار الاسم (إن تغيّر)
  if (parsed.name && parsed.name !== existing.name) {
    const nameExists = db.prepare("SELECT id FROM customers WHERE name = ? AND id != ?").get(parsed.name, id);
    if (nameExists) {
      res.status(409).json({
        success: false,
        error: `عميل بالاسم "${parsed.name}" موجود بالفعل`,
      });
      return;
    }
  }

  // التحقق من عدم تكرار رقم الهاتف (إن تغيّر)
  if (parsed.phone && parsed.phone !== existing.phone) {
    const phoneExists = db.prepare("SELECT id FROM customers WHERE phone = ? AND id != ?").get(parsed.phone, id);
    if (phoneExists) {
      res.status(409).json({
        success: false,
        error: `رقم الهاتف "${parsed.phone}" مستخدم بالفعل`,
      });
      return;
    }
  }

  // منع تعديل الرصيد مباشرة (يُحسب تلقائياً)
  if (parsed.hasOwnProperty('balance')) {
    res.status(400).json({
      success: false,
      error: "لا يمكن تعديل الرصيد مباشرة — يُحسب تلقائياً من الفواتير والمدفوعات",
    });
    return;
  }

  const updatableFields = [
    "name", "phone", "email", "address", "tax_number", "credit_limit", "notes", "is_active",
  ];

  const updates: string[] = [];
  const params: unknown[] = [];

  for (const field of updatableFields) {
    if ((parsed as any)[field] !== undefined) {
      updates.push(`${field} = ?`);
      params.push((parsed as any)[field] ?? null);
    }
  }

  if (updates.length === 0) {
    res.status(400).json({ success: false, error: "لم تُرسل أي بيانات للتعديل" });
    return;
  }

  params.push(id);
  db.prepare(`UPDATE customers SET ${updates.join(", ")} WHERE id = ?`).run(...params);

  const updated = db.prepare("SELECT * FROM customers WHERE id = ?").get(id) as DbCustomer;

  res.status(200).json({
    success: true,
    data: { customer: enrichCustomer(updated) },
    message: "تم تحديث بيانات العميل بنجاح",
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// DELETE /api/v1/customers/:id
// حذف عميل — soft delete فقط إذا له فواتير
// ══════════════════════════════════════════════════════════════════════════════

router.delete("/:id", checkRole("admin"), (req: Request, res: Response): void => {
  const id = parseId(req.params.id);
  if (!id) {
    res.status(400).json({ success: false, error: "معرّف العميل غير صالح" });
    return;
  }

  const customer = db.prepare("SELECT * FROM customers WHERE id = ?").get(id) as DbCustomer | undefined;
  if (!customer) {
    res.status(404).json({ success: false, error: "العميل غير موجود" });
    return;
  }

  // التحقق من عدم وجود فواتير نشطة
  const invoicesCount = (db.prepare(`
    SELECT COUNT(*) as cnt FROM sales_invoices
    WHERE customer_id = ? AND status != 'cancelled'
  `).get(id) as { cnt: number }).cnt;

  if (invoicesCount > 0) {
    res.status(422).json({
      success: false,
      error: `لا يمكن حذف العميل "${customer.name}" — له ${invoicesCount} فاتورة نشطة. قم بإلغاء الفواتير أولاً أو قم بتعطيل العميل بدلاً من حذفه`,
    });
    return;
  }

  db.prepare("UPDATE customers SET is_active = 0 WHERE id = ?").run(id);

  res.status(200).json({
    success: true,
    message: `تم تعطيل العميل "${customer.name}" بنجاح`,
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/v1/customers/:id/invoices
// فواتير العميل
// ══════════════════════════════════════════════════════════════════════════════

router.get("/:id/invoices", (req: Request, res: Response): void => {
  const id = parseId(req.params.id);
  if (!id) {
    res.status(400).json({ success: false, error: "معرّف العميل غير صالح" });
    return;
  }

  const customer = db.prepare("SELECT id, name FROM customers WHERE id = ? AND is_active = 1").get(id) as { id: number; name: string } | undefined;
  if (!customer) {
    res.status(404).json({ success: false, error: "العميل غير موجود" });
    return;
  }

  const invoices = db.prepare(`
    SELECT
      si.id, si.invoice_number, si.date, si.due_date, si.status,
      si.total, si.paid_amount, (si.total - si.paid_amount) as remaining_amount
    FROM sales_invoices si
    WHERE si.customer_id = ?
    ORDER BY si.date DESC
  `).all(id);

  res.status(200).json({
    success: true,
    data: {
      customer,
      invoices,
    },
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/v1/customers/:id/payments
// مدفوعات العميل
// ══════════════════════════════════════════════════════════════════════════════

router.get("/:id/payments", (req: Request, res: Response): void => {
  const id = parseId(req.params.id);
  if (!id) {
    res.status(400).json({ success: false, error: "معرّف العميل غير صالح" });
    return;
  }

  const customer = db.prepare("SELECT id, name FROM customers WHERE id = ? AND is_active = 1").get(id) as { id: number; name: string } | undefined;
  if (!customer) {
    res.status(404).json({ success: false, error: "العميل غير موجود" });
    return;
  }

  const payments = db.prepare(`
    SELECT
      p.id, p.amount, p.payment_date, p.payment_method, p.reference_number, p.notes,
      si.invoice_number
    FROM payments p
    JOIN sales_invoices si ON p.invoice_id = si.id
    WHERE p.type = 'sales' AND si.customer_id = ?
    ORDER BY p.payment_date DESC
  `).all(id);

  res.status(200).json({
    success: true,
    data: {
      customer,
      payments,
    },
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/v1/customers/:id/statement
// كشف حساب العميل (فواتير + مدفوعات)
// ══════════════════════════════════════════════════════════════════════════════

router.get("/:id/statement", (req: Request, res: Response): void => {
  const id = parseId(req.params.id);
  if (!id) {
    res.status(400).json({ success: false, error: "معرّف العميل غير صالح" });
    return;
  }

  const customer = db.prepare("SELECT * FROM customers WHERE id = ? AND is_active = 1").get(id) as DbCustomer | undefined;
  if (!customer) {
    res.status(404).json({ success: false, error: "العميل غير موجود" });
    return;
  }

  // الفواتير
  const invoices = db.prepare(`
    SELECT
      'invoice' as type, id, invoice_number as reference, date as transaction_date,
      total as debit, 0 as credit, notes
    FROM sales_invoices
    WHERE customer_id = ? AND status != 'cancelled'
    ORDER BY date ASC
  `).all(id);

  // المدفوعات
  const payments = db.prepare(`
    SELECT
      'payment' as type, p.id, si.invoice_number as reference, p.payment_date as transaction_date,
      0 as debit, p.amount as credit, p.notes
    FROM payments p
    JOIN sales_invoices si ON p.invoice_id = si.id
    WHERE p.type = 'sales' AND si.customer_id = ?
    ORDER BY p.payment_date ASC
  `).all(id);

  // دمج وترتيب حسب التاريخ
  const transactions: Transaction[] = ([...invoices, ...payments] as Transaction[]).sort((a, b) =>
    new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()
  );

  // حساب الرصيد التراكمي
  let running_balance = 0;
  const statement = transactions.map((t) => {
    running_balance += t.debit - t.credit;
    return { ...t, balance: running_balance };
  });

  res.status(200).json({
    success: true,
    data: {
      customer: enrichCustomer(customer),
      statement,
      summary: getCustomerBalance(id),
    },
  });
});

export default router;