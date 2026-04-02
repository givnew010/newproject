// ══════════════════════════════════════════════════════════════════════════════
// server/routes/suppliers.ts
// المهمة 5-3: CRUD كامل للموردين مع حساب الأرصدة
//
// GET    /api/v1/suppliers       — قائمة الموردين مع الفلاتر والأرصدة
// GET    /api/v1/suppliers/:id   — تفاصيل مورد واحد
// POST   /api/v1/suppliers       — إنشاء مورد جديد
// PUT    /api/v1/suppliers/:id   — تعديل بيانات مورد
// DELETE /api/v1/suppliers/:id   — حذف (soft-delete)
//
// GET    /api/v1/suppliers/:id/invoices  — فواتير المورد
// GET    /api/v1/suppliers/:id/payments  — مدفوعات المورد
// GET    /api/v1/suppliers/:id/statement — كشف حساب المورد
// ══════════════════════════════════════════════════════════════════════════════

import { Router, Request, Response } from "express";
import { z, ZodError } from "zod";
import db from "../db.js";
import { verifyToken, checkRole } from "../middleware/auth.js";
import type { DbSupplier, SupplierWithStats } from "../types.js";

const router = Router();

// جميع routes تتطلب تسجيل الدخول
router.use(verifyToken);

// ══════════════════════════════════════════════════════════════════════════════
// Zod Schemas
// ══════════════════════════════════════════════════════════════════════════════

const createSupplierSchema = z.object({
  name: z.string().min(2, "اسم المورد يجب أن يحتوي على حرفين على الأقل").max(150, "الاسم طويل جدًا"),
  phone: z.string().max(20, "رقم الهاتف طويل جدًا").optional().nullable(),
  email: z.string().email("البريد الإلكتروني غير صالح").optional().nullable(),
  address: z.string().max(300, "العنوان طويل جدًا").optional().nullable(),
  contact_person: z.string().max(100, "اسم جهة الاتصال طويل جدًا").optional().nullable(),
  tax_number: z.string().max(50, "رقم الضريبة طويل جدًا").optional().nullable(),
  payment_terms: z.enum(["فوري", "أسبوعي", "شهري", "ثلاثة أشهر"]).default("فوري"),
  notes: z.string().max(500, "الملاحظات طويلة جدًا").optional().nullable(),
});

const updateSupplierSchema = createSupplierSchema.partial().extend({
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

function getSupplierBalance(supplierId: number): { total_invoices: number; total_paid: number; total_due: number } {
  // إجمالي الفواتير (مشتريات)
  const invoicesTotal = (db.prepare(`
    SELECT COALESCE(SUM(total), 0) as total
    FROM purchase_invoices
    WHERE supplier_id = ? AND status != 'cancelled'
  `).get(supplierId) as { total: number }).total;

  // إجمالي المدفوعات
  const paymentsTotal = (db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total
    FROM payments
    WHERE type = 'purchase' AND invoice_id IN (
      SELECT id FROM purchase_invoices WHERE supplier_id = ?
    )
  `).get(supplierId) as { total: number }).total;

  const total_due = invoicesTotal - paymentsTotal;

  return {
    total_invoices: invoicesTotal,
    total_paid: paymentsTotal,
    total_due,
  };
}

function enrichSupplier(supplier: DbSupplier): SupplierWithStats {
  const stats = getSupplierBalance(supplier.id);
  return { ...supplier, ...stats };
}

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/v1/suppliers
// قائمة الموردين مع الفلاتر والأرصدة
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
    conditions.push("(name LIKE ? OR phone LIKE ? OR contact_person LIKE ?)");
    const q = `%${search.trim()}%`;
    params.push(q, q, q);
  }

  if (has_balance === "true") {
    // موردين لهم رصيد مستحق دفعه (total_due > 0)
    conditions.push(`
      id IN (
        SELECT supplier_id FROM purchase_invoices
        WHERE status != 'cancelled'
        GROUP BY supplier_id
        HAVING SUM(total) > COALESCE((
          SELECT SUM(amount) FROM payments
          WHERE type = 'purchase' AND invoice_id IN (
            SELECT id FROM purchase_invoices WHERE supplier_id = purchase_invoices.supplier_id
          )
        ), 0)
      )
    `);
  }

  const whereClause = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";

  const suppliers = db.prepare(`
    SELECT * FROM suppliers
    ${whereClause}
    ORDER BY name ASC
  `).all(...params) as DbSupplier[];

  const enriched = suppliers.map(enrichSupplier);

  res.status(200).json({
    success: true,
    data: {
      suppliers: enriched,
      total: enriched.length,
    },
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/v1/suppliers/:id
// تفاصيل مورد واحد مع إحصاءاته
// ══════════════════════════════════════════════════════════════════════════════

router.get("/:id", (req: Request, res: Response): void => {
  const id = parseId(req.params.id);
  if (!id) {
    res.status(400).json({ success: false, error: "معرّف المورد غير صالح" });
    return;
  }

  const supplier = db.prepare("SELECT * FROM suppliers WHERE id = ?").get(id) as DbSupplier | undefined;
  if (!supplier) {
    res.status(404).json({ success: false, error: "المورد غير موجود" });
    return;
  }

  res.status(200).json({
    success: true,
    data: { supplier: enrichSupplier(supplier) },
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/v1/suppliers
// إنشاء مورد جديد
// ══════════════════════════════════════════════════════════════════════════════

router.post("/", checkRole("admin"), (req: Request, res: Response): void => {
  let parsed: z.infer<typeof createSupplierSchema>;
  try {
    parsed = createSupplierSchema.parse(req.body);
  } catch (err) {
    if (err instanceof ZodError) {
      handleZodError(err, res);
      return;
    }
    throw err;
  }

  // التحقق من عدم تكرار الاسم
  const nameExists = db.prepare("SELECT id FROM suppliers WHERE name = ?").get(parsed.name);
  if (nameExists) {
    res.status(409).json({
      success: false,
      error: `مورد بالاسم "${parsed.name}" موجود بالفعل`,
    });
    return;
  }

  const result = db.prepare(`
    INSERT INTO suppliers
      (name, phone, email, address, contact_person, tax_number, payment_terms, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    parsed.name,
    parsed.phone ?? null,
    parsed.email ?? null,
    parsed.address ?? null,
    parsed.contact_person ?? null,
    parsed.tax_number ?? null,
    parsed.payment_terms,
    parsed.notes ?? null,
  );

  const newSupplier = db.prepare("SELECT * FROM suppliers WHERE id = ?").get(result.lastInsertRowid) as DbSupplier;

  res.status(201).json({
    success: true,
    data: { supplier: enrichSupplier(newSupplier) },
    message: `تم إنشاء المورد "${parsed.name}" بنجاح`,
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// PUT /api/v1/suppliers/:id
// تعديل بيانات مورد
// ══════════════════════════════════════════════════════════════════════════════

router.put("/:id", checkRole("admin"), (req: Request, res: Response): void => {
  const id = parseId(req.params.id);
  if (!id) {
    res.status(400).json({ success: false, error: "معرّف المورد غير صالح" });
    return;
  }

  const existing = db.prepare("SELECT * FROM suppliers WHERE id = ?").get(id) as DbSupplier | undefined;
  if (!existing) {
    res.status(404).json({ success: false, error: "المورد غير موجود" });
    return;
  }

  let parsed: z.infer<typeof updateSupplierSchema>;
  try {
    parsed = updateSupplierSchema.parse(req.body);
  } catch (err) {
    if (err instanceof ZodError) {
      handleZodError(err, res);
      return;
    }
    throw err;
  }

  // التحقق من عدم تكرار الاسم (إن تغيّر)
  if (parsed.name && parsed.name !== existing.name) {
    const nameExists = db.prepare("SELECT id FROM suppliers WHERE name = ? AND id != ?").get(parsed.name, id);
    if (nameExists) {
      res.status(409).json({
        success: false,
        error: `مورد بالاسم "${parsed.name}" موجود بالفعل`,
      });
      return;
    }
  }

  // منع تعديل الرصيد مباشرة
  if (parsed.hasOwnProperty('balance')) {
    res.status(400).json({
      success: false,
      error: "لا يمكن تعديل الرصيد مباشرة — يُحسب تلقائياً من الفواتير والمدفوعات",
    });
    return;
  }

  const updatableFields = [
    "name", "phone", "email", "address", "contact_person", "tax_number", "payment_terms", "notes", "is_active",
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
  db.prepare(`UPDATE suppliers SET ${updates.join(", ")} WHERE id = ?`).run(...params);

  const updated = db.prepare("SELECT * FROM suppliers WHERE id = ?").get(id) as DbSupplier;

  res.status(200).json({
    success: true,
    data: { supplier: enrichSupplier(updated) },
    message: "تم تحديث بيانات المورد بنجاح",
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// DELETE /api/v1/suppliers/:id
// حذف مورد — soft delete فقط إذا له فواتير
// ══════════════════════════════════════════════════════════════════════════════

router.delete("/:id", checkRole("admin"), (req: Request, res: Response): void => {
  const id = parseId(req.params.id);
  if (!id) {
    res.status(400).json({ success: false, error: "معرّف المورد غير صالح" });
    return;
  }

  const supplier = db.prepare("SELECT * FROM suppliers WHERE id = ?").get(id) as DbSupplier | undefined;
  if (!supplier) {
    res.status(404).json({ success: false, error: "المورد غير موجود" });
    return;
  }

  // التحقق من عدم وجود فواتير نشطة
  const invoicesCount = (db.prepare(`
    SELECT COUNT(*) as cnt FROM purchase_invoices
    WHERE supplier_id = ? AND status != 'cancelled'
  `).get(id) as { cnt: number }).cnt;

  if (invoicesCount > 0) {
    res.status(422).json({
      success: false,
      error: `لا يمكن حذف المورد "${supplier.name}" — له ${invoicesCount} فاتورة نشطة. قم بإلغاء الفواتير أولاً أو قم بتعطيل المورد بدلاً من حذفه`,
    });
    return;
  }

  db.prepare("UPDATE suppliers SET is_active = 0 WHERE id = ?").run(id);

  res.status(200).json({
    success: true,
    message: `تم تعطيل المورد "${supplier.name}" بنجاح`,
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/v1/suppliers/:id/invoices
// فواتير المورد
// ══════════════════════════════════════════════════════════════════════════════

router.get("/:id/invoices", (req: Request, res: Response): void => {
  const id = parseId(req.params.id);
  if (!id) {
    res.status(400).json({ success: false, error: "معرّف المورد غير صالح" });
    return;
  }

  const supplier = db.prepare("SELECT id, name FROM suppliers WHERE id = ? AND is_active = 1").get(id) as { id: number; name: string } | undefined;
  if (!supplier) {
    res.status(404).json({ success: false, error: "المورد غير موجود" });
    return;
  }

  const invoices = db.prepare(`
    SELECT
      pi.id, pi.invoice_number, pi.date, pi.due_date, pi.status,
      pi.total, pi.paid_amount, (pi.total - pi.paid_amount) as remaining_amount
    FROM purchase_invoices pi
    WHERE pi.supplier_id = ?
    ORDER BY pi.date DESC
  `).all(id);

  res.status(200).json({
    success: true,
    data: {
      supplier,
      invoices,
    },
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/v1/suppliers/:id/payments
// مدفوعات المورد
// ══════════════════════════════════════════════════════════════════════════════

router.get("/:id/payments", (req: Request, res: Response): void => {
  const id = parseId(req.params.id);
  if (!id) {
    res.status(400).json({ success: false, error: "معرّف المورد غير صالح" });
    return;
  }

  const supplier = db.prepare("SELECT id, name FROM suppliers WHERE id = ? AND is_active = 1").get(id) as { id: number; name: string } | undefined;
  if (!supplier) {
    res.status(404).json({ success: false, error: "المورد غير موجود" });
    return;
  }

  const payments = db.prepare(`
    SELECT
      p.id, p.amount, p.payment_date, p.payment_method, p.reference_number, p.notes,
      pi.invoice_number
    FROM payments p
    JOIN purchase_invoices pi ON p.invoice_id = pi.id
    WHERE p.type = 'purchase' AND pi.supplier_id = ?
    ORDER BY p.payment_date DESC
  `).all(id);

  res.status(200).json({
    success: true,
    data: {
      supplier,
      payments,
    },
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/v1/suppliers/:id/statement
// كشف حساب المورد (فواتير + مدفوعات)
// ══════════════════════════════════════════════════════════════════════════════

router.get("/:id/statement", (req: Request, res: Response): void => {
  const id = parseId(req.params.id);
  if (!id) {
    res.status(400).json({ success: false, error: "معرّف المورد غير صالح" });
    return;
  }

  const supplier = db.prepare("SELECT * FROM suppliers WHERE id = ? AND is_active = 1").get(id) as DbSupplier | undefined;
  if (!supplier) {
    res.status(404).json({ success: false, error: "المورد غير موجود" });
    return;
  }

  // الفواتير (دائنة للمورد)
  const invoices = db.prepare(`
    SELECT
      'invoice' as type, id, invoice_number as reference, date as transaction_date,
      total as debit, 0 as credit, notes
    FROM purchase_invoices
    WHERE supplier_id = ? AND status != 'cancelled'
    ORDER BY date ASC
  `).all(id);

  // المدفوعات (مدينة للمورد)
  const payments = db.prepare(`
    SELECT
      'payment' as type, p.id, pi.invoice_number as reference, p.payment_date as transaction_date,
      0 as debit, p.amount as credit, p.notes
    FROM payments p
    JOIN purchase_invoices pi ON p.invoice_id = pi.id
    WHERE p.type = 'purchase' AND pi.supplier_id = ?
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
      supplier: enrichSupplier(supplier),
      statement,
      summary: getSupplierBalance(id),
    },
  });
});

export default router;