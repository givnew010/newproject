// ══════════════════════════════════════════════════════════════════════════════
// server/routes/sales.ts
// المهمة 6-1 إلى 6-4: CRUD كامل لفواتير المبيعات مع التأثير على المخزون
//
// GET    /api/v1/sales              — قائمة فواتير البيع مع الفلاتر
// GET    /api/v1/sales/:id          — تفاصيل فاتورة واحدة مع بنودها
// POST   /api/v1/sales              — إنشاء فاتورة بيع جديدة (خصم من المخزون)
// PUT    /api/v1/sales/:id          — تعديل فاتورة بيع (reverse + apply)
// DELETE /api/v1/sales/:id          — إلغاء فاتورة (إعادة الكميات)
//
// POST   /api/v1/sales/:id/payments — تسجيل دفعة على فاتورة
// GET    /api/v1/sales/:id/payments — سجل مدفوعات فاتورة
// ══════════════════════════════════════════════════════════════════════════════

import { Router, Request, Response } from "express";
import { z, ZodError } from "zod";
import db from "../db.js";
import { verifyToken, checkRole } from "../middleware/auth.js";
import type {
  DbSalesInvoice,
  SalesInvoiceWithDetails,
  SalesInvoiceItem,
  DbPayment,
  ApiResponse
} from "../types.js";

const router = Router();

// جميع routes تتطلب تسجيل الدخول
router.use(verifyToken);

// ══════════════════════════════════════════════════════════════════════════════
// Zod Schemas
// ══════════════════════════════════════════════════════════════════════════════

const createSalesInvoiceSchema = z.object({
  customer_id: z.number().int().positive().optional().nullable(),
  date: z.string().optional(), // ISO date string
  due_date: z.string().optional(), // ISO date string
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

const updateSalesInvoiceSchema = createSalesInvoiceSchema.partial();

const createPaymentSchema = z.object({
  amount: z.number().positive(),
  payment_date: z.string().optional(), // ISO date string
  payment_method: z.enum(["cash", "bank", "check"]).default("cash"),
  reference_number: z.string().max(100).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

// ══════════════════════════════════════════════════════════════════════════════
// Helper Functions
// ══════════════════════════════════════════════════════════════════════════════

/**
 * توليد رقم فاتورة جديد متسلسل
 */
function generateInvoiceNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');

  // احصل على آخر رقم فاتورة لهذا الشهر
  const stmt = db.prepare(`
    SELECT invoice_number
    FROM sales_invoices
    WHERE invoice_number LIKE ?
    ORDER BY id DESC
    LIMIT 1
  `);

  const prefix = `INV-${year}${month}-`;
  const lastInvoice = stmt.get(`${prefix}%`) as { invoice_number: string } | undefined;

  let nextNumber = 1;
  if (lastInvoice) {
    const lastNumber = parseInt(lastInvoice.invoice_number.split('-')[2]);
    nextNumber = lastNumber + 1;
  }

  return `${prefix}${String(nextNumber).padStart(3, '0')}`;
}

/**
 * حساب إجماليات الفاتورة
 */
function calculateInvoiceTotals(items: Array<{ quantity: number; unit_price: number; discount: number }>, discountAmount: number, taxRate: number = 15) {
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price - item.discount), 0);
  const discountAmountTotal = discountAmount;
  const taxableAmount = subtotal - discountAmountTotal;
  const taxAmount = taxableAmount * (taxRate / 100);
  const total = taxableAmount + taxAmount;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discount_amount: discountAmountTotal,
    tax_rate: taxRate,
    tax_amount: Math.round(taxAmount * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

/**
 * التحقق من توفر الكميات في المخزون
 */
function checkStockAvailability(items: Array<{ item_id: number; quantity: number }>): { available: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const item of items) {
    const stmt = db.prepare("SELECT name, quantity FROM inventory_items WHERE id = ? AND is_active = 1");
    const dbItem = stmt.get(item.item_id) as { name: string; quantity: number } | undefined;

    if (!dbItem) {
      errors.push(`الصنف ${item.item_id} غير موجود`);
      continue;
    }

    if (dbItem.quantity < item.quantity) {
      errors.push(`الصنف "${dbItem.name}" متوفر ${dbItem.quantity} فقط، مطلوب ${item.quantity}`);
    }
  }

  return { available: errors.length === 0, errors };
}

/**
 * خصم الكميات من المخزون وتسجيل الحركات
 */
function deductStock(invoiceId: number, items: Array<{ item_id: number; quantity: number }>, userId: number) {
  const deductStmt = db.prepare("UPDATE inventory_items SET quantity = quantity - ?, updated_at = datetime('now') WHERE id = ?");
  const movementStmt = db.prepare(`
    INSERT INTO stock_movements (item_id, type, quantity, balance_after, reference_type, reference_id, note, created_by, created_at)
    VALUES (?, 'out', ?, (SELECT quantity FROM inventory_items WHERE id = ?), 'sale', ?, 'خصم من فاتورة مبيعات', ?, datetime('now'))
  `);

  for (const item of items) {
    deductStmt.run(item.quantity, item.item_id);
    movementStmt.run(item.item_id, item.quantity, item.item_id, invoiceId, userId);
  }
}

/**
 * إعادة الكميات للمخزون (عند التعديل أو الإلغاء)
 */
function restoreStock(invoiceId: number, items: Array<{ item_id: number; quantity: number }>, userId: number) {
  const restoreStmt = db.prepare("UPDATE inventory_items SET quantity = quantity + ?, updated_at = datetime('now') WHERE id = ?");
  const movementStmt = db.prepare(`
    INSERT INTO stock_movements (item_id, type, quantity, balance_after, reference_type, reference_id, note, created_by, created_at)
    VALUES (?, 'in', ?, (SELECT quantity FROM inventory_items WHERE id = ?), 'sale', ?, 'إعادة للمخزون (تعديل/إلغاء فاتورة)', ?, datetime('now'))
  `);

  for (const item of items) {
    restoreStmt.run(item.quantity, item.item_id);
    movementStmt.run(item.item_id, item.quantity, item.item_id, invoiceId, userId);
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// Routes
// ══════════════════════════════════════════════════════════════════════════════

// 6-1: GET /api/v1/sales — قائمة فواتير البيع مع الفلاتر
router.get("/", (req: Request, res: Response<ApiResponse<{ invoices: SalesInvoiceWithDetails[]; total: number; page: number; totalPages: number }>>) => {
  try {
    const {
      customer_id,
      status,
      payment_type,
      date_from,
      date_to,
      search,
      page = "1",
      limit = "20",
      sortBy = "created_at",
      sortOrder = "desc"
    } = req.query;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;
    const offset = (pageNum - 1) * limitNum;

    // بناء WHERE clause ديناميكياً
    const whereConditions: string[] = [];
    const params: any[] = [];

    if (customer_id) {
      whereConditions.push("si.customer_id = ?");
      params.push(customer_id);
    }

    if (status) {
      whereConditions.push("si.status = ?");
      params.push(status);
    }

    if (payment_type) {
      whereConditions.push("si.payment_type = ?");
      params.push(payment_type);
    }

    if (date_from) {
      whereConditions.push("si.date >= ?");
      params.push(date_from);
    }

    if (date_to) {
      whereConditions.push("si.date <= ?");
      params.push(date_to);
    }

    if (search) {
      whereConditions.push("(si.invoice_number LIKE ? OR c.name LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

    // عد إجمالي السجلات
    const countStmt = db.prepare(`SELECT COUNT(*) as total FROM sales_invoices si LEFT JOIN customers c ON si.customer_id = c.id ${whereClause}`);
    const { total } = countStmt.get(...params) as { total: number };

    // جلب الفواتير مع البيانات
    const stmt = db.prepare(`
      SELECT
        si.*,
        c.name as customer_name,
        c.phone as customer_phone,
        (si.total - si.paid_amount) as remaining_amount
      FROM sales_invoices si
      LEFT JOIN customers c ON si.customer_id = c.id
      ${whereClause}
      ORDER BY si.${sortBy} ${sortOrder}
      LIMIT ? OFFSET ?
    `);

    const invoices = stmt.all(...params, limitNum, offset) as SalesInvoiceWithDetails[];

    // جلب بنود كل فاتورة
    for (const invoice of invoices) {
      const itemsStmt = db.prepare(`
        SELECT
          sii.*,
          ii.name as item_name,
          ii.sku as item_sku
        FROM sales_invoice_items sii
        JOIN inventory_items ii ON sii.item_id = ii.id
        WHERE sii.invoice_id = ?
        ORDER BY sii.id
      `);
      invoice.items = itemsStmt.all(invoice.id) as SalesInvoiceItem[];
    }

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: {
        invoices,
        total,
        page: pageNum,
        totalPages,
      },
    });
  } catch (error) {
    console.error("خطأ في جلب فواتير المبيعات:", error);
    res.status(500).json({
      success: false,
      error: "فشل في جلب فواتير المبيعات",
    });
  }
});

// 6-1: GET /api/v1/sales/:id — تفاصيل فاتورة واحدة
router.get("/:id", (req: Request, res: Response<ApiResponse<SalesInvoiceWithDetails>>) => {
  try {
    const { id } = req.params;
    const invoiceId = parseInt(id, 10);

    if (isNaN(invoiceId)) {
      return res.status(400).json({
        success: false,
        error: "معرف الفاتورة غير صالح",
      });
    }

    // جلب الفاتورة
    const stmt = db.prepare(`
      SELECT
        si.*,
        c.name as customer_name,
        c.phone as customer_phone,
        (si.total - si.paid_amount) as remaining_amount
      FROM sales_invoices si
      LEFT JOIN customers c ON si.customer_id = c.id
      WHERE si.id = ?
    `);

    const invoice = stmt.get(invoiceId) as SalesInvoiceWithDetails | undefined;

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: "الفاتورة غير موجودة",
      });
    }

    // جلب البنود
    const itemsStmt = db.prepare(`
      SELECT
        sii.*,
        ii.name as item_name,
        ii.sku as item_sku
      FROM sales_invoice_items sii
      JOIN inventory_items ii ON sii.item_id = ii.id
      WHERE sii.invoice_id = ?
      ORDER BY sii.id
    `);
    invoice.items = itemsStmt.all(invoiceId) as SalesInvoiceItem[];

    res.json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    console.error("خطأ في جلب تفاصيل الفاتورة:", error);
    res.status(500).json({
      success: false,
      error: "فشل في جلب تفاصيل الفاتورة",
    });
  }
});

// 6-2: POST /api/v1/sales — إنشاء فاتورة بيع جديدة
router.post("/", (req: Request, res: Response<ApiResponse<SalesInvoiceWithDetails>>) => {
  try {
    const validatedData = createSalesInvoiceSchema.parse(req.body);
    const userId = req.user!.userId;

    // التحقق من توفر الكميات
    const stockCheck = checkStockAvailability(validatedData.items);
    if (!stockCheck.available) {
      return res.status(400).json({
        success: false,
        error: "كميات غير متوفرة في المخزون",
        details: stockCheck.errors,
      });
    }

    // حساب الإجماليات
    const totals = calculateInvoiceTotals(validatedData.items, validatedData.discount_amount);

    // توليد رقم الفاتورة
    const invoiceNumber = generateInvoiceNumber();

    // تحديد التاريخ والاستحقاق
    const date = validatedData.date || new Date().toISOString().split('T')[0];
    const dueDate = validatedData.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 30 يوم

    // إدراج الفاتورة داخل transaction
    const insertInvoice = db.transaction(() => {
      // إدراج رأس الفاتورة
      const invoiceStmt = db.prepare(`
        INSERT INTO sales_invoices (
          invoice_number, customer_id, date, due_date, status, payment_type,
          subtotal, discount_amount, tax_rate, tax_amount, total, paid_amount,
          notes, created_by, created_at, updated_at
        ) VALUES (?, ?, ?, ?, 'confirmed', ?, ?, ?, ?, ?, ?, 0, ?, ?, datetime('now'), datetime('now'))
      `);

      const result = invoiceStmt.run(
        invoiceNumber,
        validatedData.customer_id || null,
        date,
        dueDate,
        validatedData.payment_type,
        totals.subtotal,
        totals.discount_amount,
        totals.tax_rate,
        totals.tax_amount,
        totals.total,
        validatedData.notes || null,
        userId
      );

      const invoiceId = result.lastInsertRowid as number;

      // إدراج البنود
      const itemStmt = db.prepare(`
        INSERT INTO sales_invoice_items (invoice_id, item_id, quantity, unit_price, discount, total)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      for (const item of validatedData.items) {
        const itemTotal = (item.quantity * item.unit_price) - item.discount;
        itemStmt.run(invoiceId, item.item_id, item.quantity, item.unit_price, item.discount, itemTotal);
      }

      // خصم من المخزون
      deductStock(invoiceId, validatedData.items, userId);

      // إذا كان الدفع نقدي، أضف دفعة تلقائياً
      if (validatedData.payment_type === "cash") {
        const paymentStmt = db.prepare(`
          INSERT INTO payments (type, invoice_id, amount, payment_date, payment_method, notes, created_by, created_at)
          VALUES ('sales', ?, ?, ?, 'cash', 'دفع نقدي تلقائي', ?, datetime('now'))
        `);
        paymentStmt.run(invoiceId, totals.total, date, userId);

        // تحديث paid_amount في الفاتورة
        db.prepare("UPDATE sales_invoices SET paid_amount = ?, status = 'paid', updated_at = datetime('now') WHERE id = ?")
          .run(totals.total, invoiceId);
      }

      return invoiceId;
    });

    const invoiceId = insertInvoice();

    // جلب الفاتورة المُنشأة للإعادة
    const getStmt = db.prepare(`
      SELECT
        si.*,
        c.name as customer_name,
        c.phone as customer_phone,
        (si.total - si.paid_amount) as remaining_amount
      FROM sales_invoices si
      LEFT JOIN customers c ON si.customer_id = c.id
      WHERE si.id = ?
    `);

    const invoice = getStmt.get(invoiceId) as SalesInvoiceWithDetails;

    // جلب البنود
    const itemsStmt = db.prepare(`
      SELECT
        sii.*,
        ii.name as item_name,
        ii.sku as item_sku
      FROM sales_invoice_items sii
      JOIN inventory_items ii ON sii.item_id = ii.id
      WHERE sii.invoice_id = ?
      ORDER BY sii.id
    `);
    invoice.items = itemsStmt.all(invoiceId) as SalesInvoiceItem[];

    res.status(201).json({
      success: true,
      data: invoice,
      message: `تم إنشاء الفاتورة ${invoiceNumber} بنجاح`,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        error: "بيانات غير صالحة",
        details: error.issues,
      });
    }

    console.error("خطأ في إنشاء فاتورة المبيعات:", error);
    res.status(500).json({
      success: false,
      error: "فشل في إنشاء فاتورة المبيعات",
    });
  }
});

// 6-3: PUT /api/v1/sales/:id — تعديل فاتورة بيع
router.put("/:id", (req: Request, res: Response<ApiResponse<SalesInvoiceWithDetails>>) => {
  try {
    const { id } = req.params;
    const invoiceId = parseInt(id, 10);

    if (isNaN(invoiceId)) {
      return res.status(400).json({
        success: false,
        error: "معرف الفاتورة غير صالح",
      });
    }

    // التحقق من وجود الفاتورة
    const existingInvoice = db.prepare("SELECT * FROM sales_invoices WHERE id = ?").get(invoiceId) as DbSalesInvoice | undefined;
    if (!existingInvoice) {
      return res.status(404).json({
        success: false,
        error: "الفاتورة غير موجودة",
      });
    }

    // منع التعديل إذا كانت مدفوعة بالكامل
    if (existingInvoice.status === "paid") {
      return res.status(400).json({
        success: false,
        error: "لا يمكن تعديل فاتورة مدفوعة بالكامل",
      });
    }

    const validatedData = updateSalesInvoiceSchema.parse(req.body);
    const userId = req.user!.userId;

    // إذا كان هناك تغيير في البنود، نحتاج للتحقق من المخزون
    let newItems: Array<{ item_id: number; quantity: number; unit_price: number; discount: number }>;
    if (!validatedData.items) {
      // إذا لم يتم تمرير items، نحتاج للحفاظ على البنود الحالية
      const currentItemsStmt = db.prepare("SELECT item_id, quantity, unit_price, discount FROM sales_invoice_items WHERE invoice_id = ?");
      newItems = currentItemsStmt.all(invoiceId) as Array<{ item_id: number; quantity: number; unit_price: number; discount: number }>;
    } else {
      newItems = validatedData.items;
    }

    // التحقق من توفر الكميات (بعد إعادة الكميات القديمة)
    const stockCheck = checkStockAvailability(newItems.map(item => ({ item_id: item.item_id, quantity: item.quantity })));
    if (!stockCheck.available) {
      return res.status(400).json({
        success: false,
        error: "كميات غير متوفرة في المخزون",
        details: stockCheck.errors,
      });
    }

    // حساب الإجماليات الجديدة
    const totals = calculateInvoiceTotals(newItems, validatedData.discount_amount || existingInvoice.discount_amount);

    // تحديث الفاتورة داخل transaction
    const updateInvoice = db.transaction(() => {
      // إعادة الكميات القديمة للمخزون
      const oldItemsStmt = db.prepare("SELECT item_id, quantity FROM sales_invoice_items WHERE invoice_id = ?");
      const oldItems = oldItemsStmt.all(invoiceId) as Array<{ item_id: number; quantity: number }>;
      restoreStock(invoiceId, oldItems, userId);

      // حذف البنود القديمة
      db.prepare("DELETE FROM sales_invoice_items WHERE invoice_id = ?").run(invoiceId);

      // إدراج البنود الجديدة
      const itemStmt = db.prepare(`
        INSERT INTO sales_invoice_items (invoice_id, item_id, quantity, unit_price, discount, total)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      for (const item of newItems) {
        const itemTotal = (item.quantity * item.unit_price) - item.discount;
        itemStmt.run(invoiceId, item.item_id, item.quantity, item.unit_price, item.discount, itemTotal);
      }

      // خصم الكميات الجديدة
      deductStock(invoiceId, newItems.map(item => ({ item_id: item.item_id, quantity: item.quantity })), userId);

      // تحديث رأس الفاتورة
      const updateStmt = db.prepare(`
        UPDATE sales_invoices SET
          customer_id = ?,
          date = ?,
          due_date = ?,
          payment_type = ?,
          subtotal = ?,
          discount_amount = ?,
          tax_rate = ?,
          tax_amount = ?,
          total = ?,
          notes = ?,
          updated_at = datetime('now')
        WHERE id = ?
      `);

      updateStmt.run(
        validatedData.customer_id !== undefined ? validatedData.customer_id : existingInvoice.customer_id,
        validatedData.date || existingInvoice.date,
        validatedData.due_date || existingInvoice.due_date,
        validatedData.payment_type || existingInvoice.payment_type,
        totals.subtotal,
        totals.discount_amount,
        totals.tax_rate,
        totals.tax_amount,
        totals.total,
        validatedData.notes !== undefined ? validatedData.notes : existingInvoice.notes,
        invoiceId
      );

      return invoiceId;
    });

    updateInvoice();

    // جلب الفاتورة المحدثة
    const getStmt = db.prepare(`
      SELECT
        si.*,
        c.name as customer_name,
        c.phone as customer_phone,
        (si.total - si.paid_amount) as remaining_amount
      FROM sales_invoices si
      LEFT JOIN customers c ON si.customer_id = c.id
      WHERE si.id = ?
    `);

    const invoice = getStmt.get(invoiceId) as SalesInvoiceWithDetails;

    // جلب البنود الجديدة
    const itemsStmt = db.prepare(`
      SELECT
        sii.*,
        ii.name as item_name,
        ii.sku as item_sku
      FROM sales_invoice_items sii
      JOIN inventory_items ii ON sii.item_id = ii.id
      WHERE sii.invoice_id = ?
      ORDER BY sii.id
    `);
    invoice.items = itemsStmt.all(invoiceId) as SalesInvoiceItem[];

    res.json({
      success: true,
      data: invoice,
      message: "تم تحديث الفاتورة بنجاح",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        error: "بيانات غير صالحة",
        details: error.issues,
      });
    }

    console.error("خطأ في تحديث فاتورة المبيعات:", error);
    res.status(500).json({
      success: false,
      error: "فشل في تحديث فاتورة المبيعات",
    });
  }
});

// 6-4: DELETE /api/v1/sales/:id — إلغاء فاتورة
router.delete("/:id", (req: Request, res: Response<ApiResponse<{ message: string }>>) => {
  try {
    const { id } = req.params;
    const invoiceId = parseInt(id, 10);

    if (isNaN(invoiceId)) {
      return res.status(400).json({
        success: false,
        error: "معرف الفاتورة غير صالح",
      });
    }

    // التحقق من وجود الفاتورة
    const invoice = db.prepare("SELECT * FROM sales_invoices WHERE id = ?").get(invoiceId) as DbSalesInvoice | undefined;
    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: "الفاتورة غير موجودة",
      });
    }

    // منع إلغاء فاتورة مدفوعة بالكامل
    if (invoice.status === "paid") {
      return res.status(400).json({
        success: false,
        error: "لا يمكن إلغاء فاتورة مدفوعة بالكامل",
      });
    }

    const userId = req.user!.userId;

    // إلغاء الفاتورة داخل transaction
    const cancelInvoice = db.transaction(() => {
      // إعادة الكميات للمخزون
      const itemsStmt = db.prepare("SELECT item_id, quantity FROM sales_invoice_items WHERE invoice_id = ?");
      const items = itemsStmt.all(invoiceId) as Array<{ item_id: number; quantity: number }>;
      restoreStock(invoiceId, items, userId);

      // تحديث حالة الفاتورة
      db.prepare("UPDATE sales_invoices SET status = 'cancelled', updated_at = datetime('now') WHERE id = ?").run(invoiceId);
    });

    cancelInvoice();

    res.json({
      success: true,
      data: { message: "تم إلغاء الفاتورة بنجاح" },
    });
  } catch (error) {
    console.error("خطأ في إلغاء فاتورة المبيعات:", error);
    res.status(500).json({
      success: false,
      error: "فشل في إلغاء فاتورة المبيعات",
    });
  }
});

// 6-4: POST /api/v1/sales/:id/payments — تسجيل دفعة على فاتورة
router.post("/:id/payments", (req: Request, res: Response<ApiResponse<DbPayment>>) => {
  try {
    const { id } = req.params;
    const invoiceId = parseInt(id, 10);

    if (isNaN(invoiceId)) {
      return res.status(400).json({
        success: false,
        error: "معرف الفاتورة غير صالح",
      });
    }

    const validatedData = createPaymentSchema.parse(req.body);
    const userId = req.user!.userId;

    // التحقق من وجود الفاتورة
    const invoice = db.prepare("SELECT * FROM sales_invoices WHERE id = ?").get(invoiceId) as DbSalesInvoice | undefined;
    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: "الفاتورة غير موجودة",
      });
    }

    // التحقق من أن الفاتورة لم تُلغى
    if (invoice.status === "cancelled") {
      return res.status(400).json({
        success: false,
        error: "لا يمكن تسجيل دفعة على فاتورة ملغاة",
      });
    }

    const remainingAmount = invoice.total - invoice.paid_amount;
    if (validatedData.amount > remainingAmount) {
      return res.status(400).json({
        success: false,
        error: `المبلغ المطلوب ${validatedData.amount} أكبر من المبلغ المتبقي ${remainingAmount}`,
      });
    }

    // تسجيل الدفعة داخل transaction
    const recordPayment = db.transaction(() => {
      // إدراج الدفعة
      const paymentStmt = db.prepare(`
        INSERT INTO payments (type, invoice_id, amount, payment_date, payment_method, reference_number, notes, created_by, created_at)
        VALUES ('sales', ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `);

      const result = paymentStmt.run(
        invoiceId,
        validatedData.amount,
        validatedData.payment_date || new Date().toISOString().split('T')[0],
        validatedData.payment_method,
        validatedData.reference_number || null,
        validatedData.notes || null,
        userId
      );

      // تحديث paid_amount في الفاتورة
      const newPaidAmount = invoice.paid_amount + validatedData.amount;
      let newStatus = invoice.status;

      if (newPaidAmount >= invoice.total) {
        newStatus = "paid";
      } else if (newPaidAmount > 0) {
        newStatus = "partial";
      }

      db.prepare("UPDATE sales_invoices SET paid_amount = ?, status = ?, updated_at = datetime('now') WHERE id = ?")
        .run(newPaidAmount, newStatus, invoiceId);

      return result.lastInsertRowid as number;
    });

    const paymentId = recordPayment();

    // جلب الدفعة المُسجلة
    const payment = db.prepare("SELECT * FROM payments WHERE id = ?").get(paymentId) as DbPayment;

    res.status(201).json({
      success: true,
      data: payment,
      message: "تم تسجيل الدفعة بنجاح",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        error: "بيانات غير صالحة",
        details: error.issues,
      });
    }

    console.error("خطأ في تسجيل الدفعة:", error);
    res.status(500).json({
      success: false,
      error: "فشل في تسجيل الدفعة",
    });
  }
});

// 6-4: GET /api/v1/sales/:id/payments — سجل مدفوعات فاتورة
router.get("/:id/payments", (req: Request, res: Response<ApiResponse<DbPayment[]>>) => {
  try {
    const { id } = req.params;
    const invoiceId = parseInt(id, 10);

    if (isNaN(invoiceId)) {
      return res.status(400).json({
        success: false,
        error: "معرف الفاتورة غير صالح",
      });
    }

    // التحقق من وجود الفاتورة
    const invoice = db.prepare("SELECT id FROM sales_invoices WHERE id = ?").get(invoiceId);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: "الفاتورة غير موجودة",
      });
    }

    // جلب المدفوعات
    const stmt = db.prepare(`
      SELECT * FROM payments
      WHERE type = 'sales' AND invoice_id = ?
      ORDER BY payment_date DESC, created_at DESC
    `);

    const payments = stmt.all(invoiceId) as DbPayment[];

    res.json({
      success: true,
      data: payments,
    });
  } catch (error) {
    console.error("خطأ في جلب مدفوعات الفاتورة:", error);
    res.status(500).json({
      success: false,
      error: "فشل في جلب مدفوعات الفاتورة",
    });
  }
});

export default router;