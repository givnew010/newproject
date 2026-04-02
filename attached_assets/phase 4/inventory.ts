// ══════════════════════════════════════════════════════════════════════════════
// server/routes/inventory.ts
// المهمة 4-1: GET  /api/v1/inventory          — قائمة الأصناف مع الفلاتر
// المهمة 4-1: GET  /api/v1/inventory/categories — قائمة التصنيفات
// المهمة 4-1: GET  /api/v1/inventory/alerts    — الأصناف منخفضة/منعدمة المخزون
// المهمة 4-2: POST /api/v1/inventory           — إنشاء صنف جديد
// المهمة 4-3: GET  /api/v1/inventory/:id       — تفاصيل صنف واحد
// المهمة 4-3: PUT  /api/v1/inventory/:id       — تعديل صنف
// المهمة 4-3: DELETE /api/v1/inventory/:id     — حذف صنف (soft delete)
// المهمة 4-4: GET  /api/v1/inventory/:id/movements — حركات صنف معين
// المهمة 4-4: POST /api/v1/inventory/:id/movements — تسجيل حركة يدوية
// ══════════════════════════════════════════════════════════════════════════════

import { Router, Request, Response } from "express";
import { z, ZodError }               from "zod";
import db                            from "../db.js";
import { verifyToken, checkRole }    from "../middleware/auth.js";
import type {
  DbInventoryItem,
  InventoryItemWithStatus,
  StockMovementWithUser,
  StockStatus,
  PaginatedResult,
} from "../types.js";

const router = Router();

// جميع routes تتطلب تسجيل الدخول
router.use(verifyToken);

// ══════════════════════════════════════════════════════════════════════════════
// Zod Schemas
// ══════════════════════════════════════════════════════════════════════════════

const createItemSchema = z.object({
  name: z
    .string({ required_error: "اسم الصنف مطلوب" })
    .min(2,   "اسم الصنف حرفان على الأقل")
    .max(200, "اسم الصنف طويل جداً"),

  sku: z
    .string()
    .max(50, "رقم الصنف (SKU) طويل جداً")
    .optional(), // اختياري — يُولَّد تلقائياً إذا لم يُرسَل

  barcode: z
    .string()
    .max(50, "الباركود طويل جداً")
    .optional()
    .nullable(),

  category: z
    .string()
    .max(100, "اسم التصنيف طويل جداً")
    .default("عام"),

  unit: z
    .string()
    .max(30, "وحدة القياس طويلة جداً")
    .default("قطعة"),

  quantity: z
    .number({ invalid_type_error: "الكمية يجب أن تكون رقماً" })
    .min(0, "الكمية لا يمكن أن تكون سالبة")
    .default(0),

  min_quantity: z
    .number({ invalid_type_error: "حد التنبيه يجب أن يكون رقماً" })
    .min(0, "حد التنبيه لا يمكن أن يكون سالباً")
    .default(5),

  cost_price: z
    .number({ invalid_type_error: "سعر التكلفة يجب أن يكون رقماً" })
    .min(0, "سعر التكلفة لا يمكن أن يكون سالباً")
    .default(0),

  selling_price: z
    .number({ required_error: "سعر البيع مطلوب", invalid_type_error: "سعر البيع يجب أن يكون رقماً" })
    .min(0, "سعر البيع لا يمكن أن يكون سالباً"),

  warehouse_id: z
    .number({ invalid_type_error: "معرّف المخزن يجب أن يكون رقماً" })
    .int()
    .positive()
    .optional()
    .nullable(),

  description: z
    .string()
    .max(1000, "الوصف طويل جداً")
    .optional()
    .nullable(),
});

// schema التعديل — كل الحقول اختيارية
const updateItemSchema = createItemSchema.partial().extend({
  is_active: z.number().int().min(0).max(1).optional(),
});

// schema تسجيل حركة يدوية
const manualMovementSchema = z.object({
  type: z.enum(["in", "out", "adjustment"], {
    errorMap: () => ({ message: "نوع الحركة يجب أن يكون: in, out, أو adjustment" }),
  }),
  quantity: z
    .number({ required_error: "الكمية مطلوبة", invalid_type_error: "الكمية يجب أن تكون رقماً" })
    .positive("الكمية يجب أن تكون أكبر من صفر"),
  note: z
    .string()
    .max(500, "الملاحظة طويلة جداً")
    .optional(),
});

// ══════════════════════════════════════════════════════════════════════════════
// دوال مساعدة
// ══════════════════════════════════════════════════════════════════════════════

/** حساب حالة المخزون بناءً على الكمية وحد التنبيه */
function calcStatus(quantity: number, min_quantity: number): StockStatus {
  if (quantity <= 0)            return "out_of_stock";
  if (quantity <= min_quantity) return "low_stock";
  return "in_stock";
}

/** إضافة حقل status وwarehouse_name وstock_value لكل صنف */
function enrichItem(item: DbInventoryItem & { warehouse_name?: string | null }): InventoryItemWithStatus {
  return {
    ...item,
    status:        calcStatus(item.quantity, item.min_quantity),
    warehouse_name: item.warehouse_name ?? null,
    stock_value:   item.quantity * item.cost_price,
  };
}

/** معالجة أخطاء Zod بصيغة موحّدة */
function handleZodError(err: ZodError, res: Response): void {
  res.status(400).json({
    success: false,
    error: "بيانات غير صالحة",
    details: err.errors.map((e) => ({ field: e.path.join("."), message: e.message })),
  });
}

/** التحقق من أن المعرّف رقم صحيح موجب */
function parseId(param: string): number | null {
  const id = parseInt(param, 10);
  return isNaN(id) || id <= 0 ? null : id;
}

/**
 * توليد SKU فريد بصيغة ITM-XXXX
 * يبحث عن أعلى رقم مستخدم ثم يزيد عليه
 */
function generateSku(): string {
  const last = db
    .prepare(`SELECT sku FROM inventory_items WHERE sku LIKE 'ITM-%' ORDER BY id DESC LIMIT 1`)
    .get() as { sku: string } | undefined;

  if (!last) return "ITM-0001";

  const num = parseInt(last.sku.replace("ITM-", ""), 10);
  return `ITM-${String(num + 1).padStart(4, "0")}`;
}

/**
 * تسجيل حركة مخزون في جدول stock_movements
 * تُستخدَم داخلياً من inventory routes ومن sales/purchase routes لاحقاً
 */
export function recordStockMovement(params: {
  item_id:        number;
  type:           "in" | "out" | "adjustment";
  quantity:       number;
  balance_after:  number;
  reference_type?: "purchase" | "sale" | "return" | "manual" | null;
  reference_id?:  number | null;
  note?:          string | null;
  created_by?:    number | null;
}): void {
  db.prepare(`
    INSERT INTO stock_movements
      (item_id, type, quantity, balance_after, reference_type, reference_id, note, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    params.item_id,
    params.type,
    params.quantity,
    params.balance_after,
    params.reference_type ?? null,
    params.reference_id   ?? null,
    params.note           ?? null,
    params.created_by     ?? null,
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 4-1: GET /api/v1/inventory/categories
// قائمة التصنيفات الفريدة الموجودة في قاعدة البيانات
// ══════════════════════════════════════════════════════════════════════════════
router.get("/categories", (_req: Request, res: Response): void => {
  const rows = db
    .prepare(`
      SELECT DISTINCT category, COUNT(*) as items_count
      FROM inventory_items
      WHERE is_active = 1
      GROUP BY category
      ORDER BY category ASC
    `)
    .all() as { category: string; items_count: number }[];

  res.status(200).json({
    success: true,
    data: { categories: rows },
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4-1: GET /api/v1/inventory/alerts
// الأصناف منخفضة أو منعدمة المخزون — للتنبيهات في الـ header
// ══════════════════════════════════════════════════════════════════════════════
router.get("/alerts", (_req: Request, res: Response): void => {
  const items = db
    .prepare(`
      SELECT
        i.id, i.name, i.sku, i.quantity, i.min_quantity, i.unit,
        w.name AS warehouse_name
      FROM inventory_items i
      LEFT JOIN warehouses w ON i.warehouse_id = w.id
      WHERE i.is_active = 1
        AND i.quantity <= i.min_quantity
      ORDER BY i.quantity ASC
      LIMIT 50
    `)
    .all() as (DbInventoryItem & { warehouse_name: string | null })[];

  const enriched = items.map((item) => ({
    ...item,
    status: calcStatus(item.quantity, item.min_quantity),
  }));

  res.status(200).json({
    success: true,
    data: {
      alerts: enriched,
      total:  enriched.length,
      out_of_stock: enriched.filter((i) => i.status === "out_of_stock").length,
      low_stock:    enriched.filter((i) => i.status === "low_stock").length,
    },
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4-1: GET /api/v1/inventory
// قائمة الأصناف مع الفلاتر والترتيب والـ pagination
// ══════════════════════════════════════════════════════════════════════════════
router.get("/", (req: Request, res: Response): void => {
  const {
    search,
    category,
    status,
    warehouse_id,
    is_active = "1",
    sortBy    = "name",
    sortOrder = "ASC",
    page      = "1",
    limit     = "20",
  } = req.query as Record<string, string>;

  // ── تحقق من قيم الترتيب لمنع SQL Injection ───────────────────────────────
  const allowedSortBy = ["name","quantity","selling_price","cost_price","created_at","updated_at","category"];
  const safeSortBy    = allowedSortBy.includes(sortBy) ? `i.${sortBy}` : "i.name";
  const safeSortOrder = sortOrder.toUpperCase() === "DESC" ? "DESC" : "ASC";

  // ── معالجة pagination ────────────────────────────────────────────────────
  const pageNum  = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const offset   = (pageNum - 1) * limitNum;

  // ── بناء شروط WHERE ديناميكياً ───────────────────────────────────────────
  const conditions: string[] = ["i.is_active = ?"];
  const params: unknown[]    = [is_active === "0" ? 0 : 1];

  if (search?.trim()) {
    conditions.push("(i.name LIKE ? OR i.sku LIKE ? OR i.barcode LIKE ?)");
    const pattern = `%${search.trim()}%`;
    params.push(pattern, pattern, pattern);
  }

  if (category?.trim()) {
    conditions.push("i.category = ?");
    params.push(category.trim());
  }

  if (warehouse_id) {
    conditions.push("i.warehouse_id = ?");
    params.push(parseInt(warehouse_id, 10));
  }

  // فلتر الحالة: يُطبَّق بعد جلب البيانات لأنه محسوب (ليس عموداً فعلياً)
  // لكن نستطيع تحسينه بشروط SQL مباشرة:
  if (status) {
    if (status === "out_of_stock") {
      conditions.push("i.quantity <= 0");
    } else if (status === "low_stock") {
      conditions.push("i.quantity > 0 AND i.quantity <= i.min_quantity");
    } else if (status === "in_stock") {
      conditions.push("i.quantity > i.min_quantity");
    }
  }

  const whereClause = "WHERE " + conditions.join(" AND ");

  // ── الاستعلام الرئيسي ────────────────────────────────────────────────────
  const items = db
    .prepare(`
      SELECT
        i.*,
        w.name AS warehouse_name
      FROM inventory_items i
      LEFT JOIN warehouses w ON i.warehouse_id = w.id
      ${whereClause}
      ORDER BY ${safeSortBy} ${safeSortOrder}
      LIMIT ? OFFSET ?
    `)
    .all(...params, limitNum, offset) as (DbInventoryItem & { warehouse_name: string | null })[];

  // ── COUNT للـ pagination ──────────────────────────────────────────────────
  const countRow = db
    .prepare(`
      SELECT COUNT(*) as total
      FROM inventory_items i
      ${whereClause}
    `)
    .get(...params) as { total: number };

  const total      = countRow.total;
  const totalPages = Math.ceil(total / limitNum);

  // ── إضافة الحقول المحسوبة ────────────────────────────────────────────────
  const enriched = items.map(enrichItem);

  // ── ملخص الإحصاءات ───────────────────────────────────────────────────────
  const statsRow = db
    .prepare(`
      SELECT
        COUNT(*)                                          AS total_items,
        SUM(CASE WHEN quantity <= 0 THEN 1 ELSE 0 END)   AS out_of_stock,
        SUM(CASE WHEN quantity > 0 AND quantity <= min_quantity THEN 1 ELSE 0 END) AS low_stock,
        SUM(CASE WHEN quantity > min_quantity THEN 1 ELSE 0 END) AS in_stock,
        SUM(quantity * cost_price)                        AS total_value
      FROM inventory_items
      WHERE is_active = 1
    `)
    .get() as {
      total_items:   number;
      out_of_stock:  number;
      low_stock:     number;
      in_stock:      number;
      total_value:   number;
    };

  const result: PaginatedResult<InventoryItemWithStatus> = {
    items:       enriched,
    total,
    page:        pageNum,
    limit:       limitNum,
    total_pages: totalPages,
  };

  res.status(200).json({
    success: true,
    data: {
      ...result,
      stats: {
        total_items:  statsRow.total_items  ?? 0,
        out_of_stock: statsRow.out_of_stock ?? 0,
        low_stock:    statsRow.low_stock    ?? 0,
        in_stock:     statsRow.in_stock     ?? 0,
        total_value:  statsRow.total_value  ?? 0,
      },
    },
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4-2: POST /api/v1/inventory
// إنشاء صنف جديد
// ══════════════════════════════════════════════════════════════════════════════
router.post(
  "/",
  checkRole("admin", "accountant", "warehouse"),
  async (req: Request, res: Response): Promise<void> => {
    // ── 1. التحقق من صحة البيانات ─────────────────────────────────────────
    let parsed: z.infer<typeof createItemSchema>;
    try {
      parsed = createItemSchema.parse(req.body);
    } catch (err) {
      if (err instanceof ZodError) { handleZodError(err, res); return; }
      throw err;
    }

    // ── 2. توليد SKU تلقائي إذا لم يُرسَل ────────────────────────────────
    const sku = parsed.sku?.trim() || generateSku();

    // ── 3. التحقق من عدم تكرار SKU ───────────────────────────────────────
    const skuExists = db
      .prepare("SELECT id FROM inventory_items WHERE sku = ?")
      .get(sku);
    if (skuExists) {
      res.status(409).json({
        success: false,
        error: `رقم الصنف (SKU) "${sku}" مستخدم بالفعل`,
      });
      return;
    }

    // ── 4. التحقق من عدم تكرار الباركود (إن وُجد) ────────────────────────
    if (parsed.barcode) {
      const barcodeExists = db
        .prepare("SELECT id FROM inventory_items WHERE barcode = ?")
        .get(parsed.barcode);
      if (barcodeExists) {
        res.status(409).json({
          success: false,
          error: `الباركود "${parsed.barcode}" مستخدم لصنف آخر`,
        });
        return;
      }
    }

    // ── 5. التحقق من وجود المخزن إن أُرسل ───────────────────────────────
    if (parsed.warehouse_id) {
      const warehouseExists = db
        .prepare("SELECT id FROM warehouses WHERE id = ? AND is_active = 1")
        .get(parsed.warehouse_id);
      if (!warehouseExists) {
        res.status(404).json({
          success: false,
          error: "المخزن المحدد غير موجود أو غير نشط",
        });
        return;
      }
    }

    // ── 6. إدخال الصنف الجديد ─────────────────────────────────────────────
    const result = db.prepare(`
      INSERT INTO inventory_items
        (name, sku, barcode, category, unit, quantity, min_quantity,
         cost_price, selling_price, warehouse_id, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      parsed.name,
      sku,
      parsed.barcode       ?? null,
      parsed.category,
      parsed.unit,
      parsed.quantity,
      parsed.min_quantity,
      parsed.cost_price,
      parsed.selling_price,
      parsed.warehouse_id  ?? null,
      parsed.description   ?? null,
    );

    const newItemId = result.lastInsertRowid as number;

    // ── 7. تسجيل حركة المخزون الأولية إذا كانت الكمية > 0 ────────────────
    if (parsed.quantity > 0) {
      recordStockMovement({
        item_id:        newItemId,
        type:           "in",
        quantity:       parsed.quantity,
        balance_after:  parsed.quantity,
        reference_type: "manual",
        note:           "كمية أولية عند إنشاء الصنف",
        created_by:     req.user!.userId,
      });
    }

    // ── 8. إعادة الصنف الجديد كاملاً ─────────────────────────────────────
    const newItem = db.prepare(`
      SELECT i.*, w.name AS warehouse_name
      FROM inventory_items i
      LEFT JOIN warehouses w ON i.warehouse_id = w.id
      WHERE i.id = ?
    `).get(newItemId) as DbInventoryItem & { warehouse_name: string | null };

    res.status(201).json({
      success: true,
      data:    { item: enrichItem(newItem) },
      message: `تم إضافة الصنف "${parsed.name}" بنجاح`,
    });
  }
);

// ══════════════════════════════════════════════════════════════════════════════
// 4-3: GET /api/v1/inventory/:id
// تفاصيل صنف واحد
// ══════════════════════════════════════════════════════════════════════════════
router.get("/:id", (req: Request, res: Response): void => {
  const id = parseId(req.params.id);
  if (!id) {
    res.status(400).json({ success: false, error: "معرّف الصنف غير صالح" });
    return;
  }

  const item = db.prepare(`
    SELECT i.*, w.name AS warehouse_name
    FROM inventory_items i
    LEFT JOIN warehouses w ON i.warehouse_id = w.id
    WHERE i.id = ?
  `).get(id) as (DbInventoryItem & { warehouse_name: string | null }) | undefined;

  if (!item) {
    res.status(404).json({ success: false, error: "الصنف غير موجود" });
    return;
  }

  res.status(200).json({
    success: true,
    data: { item: enrichItem(item) },
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4-3: PUT /api/v1/inventory/:id
// تعديل صنف
// ══════════════════════════════════════════════════════════════════════════════
router.put(
  "/:id",
  checkRole("admin", "accountant", "warehouse"),
  (req: Request, res: Response): void => {
    const id = parseId(req.params.id);
    if (!id) {
      res.status(400).json({ success: false, error: "معرّف الصنف غير صالح" });
      return;
    }

    // ── 1. التحقق من وجود الصنف ───────────────────────────────────────────
    const existing = db
      .prepare("SELECT * FROM inventory_items WHERE id = ?")
      .get(id) as DbInventoryItem | undefined;
    if (!existing) {
      res.status(404).json({ success: false, error: "الصنف غير موجود" });
      return;
    }

    // ── 2. التحقق من صحة البيانات ─────────────────────────────────────────
    let parsed: z.infer<typeof updateItemSchema>;
    try {
      parsed = updateItemSchema.parse(req.body);
    } catch (err) {
      if (err instanceof ZodError) { handleZodError(err, res); return; }
      throw err;
    }

    // ── 3. التحقق من عدم تكرار SKU (إن تغيّر) ────────────────────────────
    if (parsed.sku && parsed.sku !== existing.sku) {
      const skuExists = db
        .prepare("SELECT id FROM inventory_items WHERE sku = ? AND id != ?")
        .get(parsed.sku, id);
      if (skuExists) {
        res.status(409).json({
          success: false,
          error: `رقم الصنف (SKU) "${parsed.sku}" مستخدم بالفعل`,
        });
        return;
      }
    }

    // ── 4. التحقق من عدم تكرار الباركود (إن تغيّر) ───────────────────────
    if (parsed.barcode && parsed.barcode !== existing.barcode) {
      const barcodeExists = db
        .prepare("SELECT id FROM inventory_items WHERE barcode = ? AND id != ?")
        .get(parsed.barcode, id);
      if (barcodeExists) {
        res.status(409).json({
          success: false,
          error: `الباركود "${parsed.barcode}" مستخدم لصنف آخر`,
        });
        return;
      }
    }

    // ── 5. التحقق من وجود المخزن (إن تغيّر) ──────────────────────────────
    if (parsed.warehouse_id !== undefined && parsed.warehouse_id !== null) {
      const warehouseExists = db
        .prepare("SELECT id FROM warehouses WHERE id = ? AND is_active = 1")
        .get(parsed.warehouse_id);
      if (!warehouseExists) {
        res.status(404).json({
          success: false,
          error: "المخزن المحدد غير موجود أو غير نشط",
        });
        return;
      }
    }

    // ── 6. تسجيل حركة مخزون إذا تغيّرت الكمية مباشرة ────────────────────
    if (parsed.quantity !== undefined && parsed.quantity !== existing.quantity) {
      const diff = parsed.quantity - existing.quantity;
      recordStockMovement({
        item_id:        id,
        type:           "adjustment",
        quantity:       Math.abs(diff),
        balance_after:  parsed.quantity,
        reference_type: "manual",
        note:           `تعديل يدوي للكمية: ${existing.quantity} → ${parsed.quantity}`,
        created_by:     req.user!.userId,
      });
    }

    // ── 7. بناء UPDATE ديناميكي على الحقول المُرسلة فقط ──────────────────
    const updatableFields: (keyof typeof parsed)[] = [
      "name", "sku", "barcode", "category", "unit", "quantity",
      "min_quantity", "cost_price", "selling_price",
      "warehouse_id", "description", "is_active",
    ];

    const updates: string[] = [];
    const params: unknown[] = [];

    for (const field of updatableFields) {
      if (parsed[field] !== undefined) {
        updates.push(`${field} = ?`);
        params.push(parsed[field] ?? null);
      }
    }

    if (updates.length === 0) {
      res.status(400).json({ success: false, error: "لم تُرسل أي بيانات للتعديل" });
      return;
    }

    params.push(id);
    db.prepare(`UPDATE inventory_items SET ${updates.join(", ")} WHERE id = ?`).run(...params);

    // ── 8. إعادة البيانات المحدّثة ─────────────────────────────────────────
    const updated = db.prepare(`
      SELECT i.*, w.name AS warehouse_name
      FROM inventory_items i
      LEFT JOIN warehouses w ON i.warehouse_id = w.id
      WHERE i.id = ?
    `).get(id) as DbInventoryItem & { warehouse_name: string | null };

    res.status(200).json({
      success: true,
      data:    { item: enrichItem(updated) },
      message: "تم تحديث بيانات الصنف بنجاح",
    });
  }
);

// ══════════════════════════════════════════════════════════════════════════════
// 4-3: DELETE /api/v1/inventory/:id
// حذف صنف (soft delete) — يمنع الحذف إذا استُخدم في فاتورة
// ══════════════════════════════════════════════════════════════════════════════
router.delete(
  "/:id",
  checkRole("admin", "accountant"),
  (req: Request, res: Response): void => {
    const id = parseId(req.params.id);
    if (!id) {
      res.status(400).json({ success: false, error: "معرّف الصنف غير صالح" });
      return;
    }

    // ── 1. التحقق من وجود الصنف ───────────────────────────────────────────
    const item = db
      .prepare("SELECT id, name, is_active FROM inventory_items WHERE id = ?")
      .get(id) as Pick<DbInventoryItem, "id" | "name" | "is_active"> | undefined;

    if (!item) {
      res.status(404).json({ success: false, error: "الصنف غير موجود" });
      return;
    }

    if (!item.is_active) {
      res.status(400).json({ success: false, error: "الصنف محذوف بالفعل" });
      return;
    }

    // ── 2. التحقق من استخدامه في فواتير مبيعات ───────────────────────────
    const usedInSales = db
      .prepare("SELECT COUNT(*) as cnt FROM sales_invoice_items WHERE item_id = ?")
      .get(id) as { cnt: number };

    // ── 3. التحقق من استخدامه في فواتير مشتريات ──────────────────────────
    const usedInPurchases = db
      .prepare("SELECT COUNT(*) as cnt FROM purchase_invoice_items WHERE item_id = ?")
      .get(id) as { cnt: number };

    if (usedInSales.cnt > 0 || usedInPurchases.cnt > 0) {
      // soft delete فقط — لا نحذفه فعلياً لأنه مرتبط بفواتير
      db.prepare("UPDATE inventory_items SET is_active = 0 WHERE id = ?").run(id);
      res.status(200).json({
        success: true,
        message: `تم إيقاف الصنف "${item.name}" (لا يمكن حذفه لارتباطه بـ ${usedInSales.cnt + usedInPurchases.cnt} فاتورة)`,
        data: { soft_deleted: true },
      });
      return;
    }

    // ── 4. حذف فعلي إذا لم يُستخدَم في أي فاتورة ─────────────────────────
    db.prepare("DELETE FROM inventory_items WHERE id = ?").run(id);

    res.status(200).json({
      success: true,
      message: `تم حذف الصنف "${item.name}" بنجاح`,
      data: { soft_deleted: false },
    });
  }
);

// ══════════════════════════════════════════════════════════════════════════════
// 4-4: GET /api/v1/inventory/:id/movements
// سجل حركات صنف معين مع رصيد متراكم وفلترة بالتاريخ
// ══════════════════════════════════════════════════════════════════════════════
router.get("/:id/movements", (req: Request, res: Response): void => {
  const id = parseId(req.params.id);
  if (!id) {
    res.status(400).json({ success: false, error: "معرّف الصنف غير صالح" });
    return;
  }

  // التحقق من وجود الصنف
  const item = db
    .prepare("SELECT id, name, quantity FROM inventory_items WHERE id = ?")
    .get(id) as Pick<DbInventoryItem, "id" | "name" | "quantity"> | undefined;

  if (!item) {
    res.status(404).json({ success: false, error: "الصنف غير موجود" });
    return;
  }

  const { date_from, date_to, page = "1", limit = "50" } = req.query as Record<string, string>;

  // ── بناء شروط WHERE ───────────────────────────────────────────────────────
  const conditions: string[] = ["sm.item_id = ?"];
  const params: unknown[]    = [id];

  if (date_from?.trim()) {
    conditions.push("DATE(sm.created_at) >= ?");
    params.push(date_from.trim());
  }
  if (date_to?.trim()) {
    conditions.push("DATE(sm.created_at) <= ?");
    params.push(date_to.trim());
  }

  const whereClause = "WHERE " + conditions.join(" AND ");

  // ── pagination ────────────────────────────────────────────────────────────
  const pageNum  = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
  const offset   = (pageNum - 1) * limitNum;

  const movements = db.prepare(`
    SELECT
      sm.*,
      u.full_name AS created_by_name
    FROM stock_movements sm
    LEFT JOIN users u ON sm.created_by = u.id
    ${whereClause}
    ORDER BY sm.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, limitNum, offset) as StockMovementWithUser[];

  const countRow = db.prepare(`
    SELECT COUNT(*) as total
    FROM stock_movements sm
    ${whereClause}
  `).get(...params) as { total: number };

  // ── ملخص الحركات ─────────────────────────────────────────────────────────
  const summaryRow = db.prepare(`
    SELECT
      SUM(CASE WHEN type = 'in'  THEN quantity ELSE 0 END) AS total_in,
      SUM(CASE WHEN type = 'out' THEN quantity ELSE 0 END) AS total_out,
      SUM(CASE WHEN type = 'adjustment' THEN quantity ELSE 0 END) AS total_adjustment
    FROM stock_movements sm
    ${whereClause}
  `).get(...params) as { total_in: number; total_out: number; total_adjustment: number };

  res.status(200).json({
    success: true,
    data: {
      item: { id: item.id, name: item.name, current_quantity: item.quantity },
      movements,
      summary: {
        total_in:         summaryRow.total_in          ?? 0,
        total_out:        summaryRow.total_out         ?? 0,
        total_adjustment: summaryRow.total_adjustment  ?? 0,
      },
      total:       countRow.total,
      page:        pageNum,
      limit:       limitNum,
      total_pages: Math.ceil(countRow.total / limitNum),
    },
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4-4: POST /api/v1/inventory/:id/movements
// تسجيل حركة مخزون يدوية (جرد، تعديل، هدية، تالف...)
// ══════════════════════════════════════════════════════════════════════════════
router.post(
  "/:id/movements",
  checkRole("admin", "accountant", "warehouse"),
  (req: Request, res: Response): void => {
    const id = parseId(req.params.id);
    if (!id) {
      res.status(400).json({ success: false, error: "معرّف الصنف غير صالح" });
      return;
    }

    // ── 1. التحقق من وجود الصنف ───────────────────────────────────────────
    const item = db
      .prepare("SELECT id, name, quantity FROM inventory_items WHERE id = ? AND is_active = 1")
      .get(id) as Pick<DbInventoryItem, "id" | "name" | "quantity"> | undefined;

    if (!item) {
      res.status(404).json({ success: false, error: "الصنف غير موجود أو غير نشط" });
      return;
    }

    // ── 2. التحقق من البيانات ─────────────────────────────────────────────
    let parsed: z.infer<typeof manualMovementSchema>;
    try {
      parsed = manualMovementSchema.parse(req.body);
    } catch (err) {
      if (err instanceof ZodError) { handleZodError(err, res); return; }
      throw err;
    }

    // ── 3. حساب الرصيد الجديد ─────────────────────────────────────────────
    let newQuantity: number;

    if (parsed.type === "in") {
      newQuantity = item.quantity + parsed.quantity;
    } else if (parsed.type === "out") {
      newQuantity = item.quantity - parsed.quantity;
      // منع الكمية من الوصول لقيمة سالبة
      if (newQuantity < 0) {
        res.status(422).json({
          success: false,
          error: `الكمية المطلوبة (${parsed.quantity}) أكبر من المتاح (${item.quantity})`,
        });
        return;
      }
    } else {
      // adjustment: الكمية المُرسلة هي الرصيد الجديد المباشر
      newQuantity = parsed.quantity;
    }

    // ── 4. تحديث الكمية وتسجيل الحركة في transaction ──────────────────────
    const doTransaction = db.transaction(() => {
      db.prepare("UPDATE inventory_items SET quantity = ? WHERE id = ?")
        .run(newQuantity, id);

      recordStockMovement({
        item_id:        id,
        type:           parsed.type,
        quantity:       parsed.type === "adjustment" ? Math.abs(newQuantity - item.quantity) : parsed.quantity,
        balance_after:  newQuantity,
        reference_type: "manual",
        note:           parsed.note ?? null,
        created_by:     req.user!.userId,
      });
    });

    doTransaction();

    res.status(201).json({
      success: true,
      data: {
        item_id:       id,
        item_name:     item.name,
        type:          parsed.type,
        quantity:      parsed.quantity,
        old_balance:   item.quantity,
        new_balance:   newQuantity,
      },
      message: `تم تسجيل حركة المخزون بنجاح — الرصيد الجديد: ${newQuantity}`,
    });
  }
);

export default router;
