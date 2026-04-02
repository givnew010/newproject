// ══════════════════════════════════════════════════════════════════════════════
// server/routes/warehouses.ts
// المهمة 4-5: CRUD كامل للمخازن
//
// GET    /api/v1/warehouses       — قائمة المخازن مع إحصاءات الإشغال
// GET    /api/v1/warehouses/:id   — تفاصيل مخزن واحد مع قائمة أصنافه
// POST   /api/v1/warehouses       — إنشاء مخزن جديد
// PUT    /api/v1/warehouses/:id   — تعديل بيانات مخزن
// DELETE /api/v1/warehouses/:id   — حذف مخزن (يمنع الحذف إن يحتوي أصناف)
// ══════════════════════════════════════════════════════════════════════════════

import { Router, Request, Response } from "express";
import { z, ZodError }               from "zod";
import db                            from "../db.js";
import { verifyToken, checkRole }    from "../middleware/auth.js";
import type { DbWarehouse, WarehouseWithStats, DbInventoryItem } from "../types.js";

const router = Router();

// جميع routes تتطلب تسجيل الدخول
router.use(verifyToken);

// ══════════════════════════════════════════════════════════════════════════════
// Zod Schemas
// ══════════════════════════════════════════════════════════════════════════════

const createWarehouseSchema = z.object({
  name: z
    .string({ required_error: "اسم المخزن مطلوب" })
    .min(2,   "اسم المخزن حرفان على الأقل")
    .max(100, "اسم المخزن طويل جداً"),

  location: z
    .string()
    .max(200, "الموقع طويل جداً")
    .optional()
    .nullable(),

  capacity: z
    .number({ invalid_type_error: "الطاقة الاستيعابية يجب أن تكون رقماً" })
    .min(0, "الطاقة الاستيعابية لا يمكن أن تكون سالبة")
    .default(0),

  manager_name: z
    .string()
    .max(100, "اسم المسؤول طويل جداً")
    .optional()
    .nullable(),

  phone: z
    .string()
    .max(20, "رقم الهاتف طويل جداً")
    .optional()
    .nullable(),

  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "اللون يجب أن يكون بصيغة HEX مثل #3b82f6")
    .default("#3b82f6"),

  description: z
    .string()
    .max(500, "الوصف طويل جداً")
    .optional()
    .nullable(),
});

// schema التعديل — كل الحقول اختيارية
const updateWarehouseSchema = createWarehouseSchema.partial().extend({
  is_active: z.number().int().min(0).max(1).optional(),
});

// ══════════════════════════════════════════════════════════════════════════════
// دوال مساعدة
// ══════════════════════════════════════════════════════════════════════════════

/** التحقق من أن المعرّف رقم صحيح موجب */
function parseId(param: string): number | null {
  const id = parseInt(param, 10);
  return isNaN(id) || id <= 0 ? null : id;
}

/** معالجة أخطاء Zod */
function handleZodError(err: ZodError, res: Response): void {
  res.status(400).json({
    success: false,
    error: "بيانات غير صالحة",
    details: err.errors.map((e) => ({ field: e.path.join("."), message: e.message })),
  });
}

/**
 * إحضار إحصاءات مخزن واحد:
 * - current_stock:            مجموع الكميات الموجودة
 * - items_count:              عدد الأصناف المختلفة
 * - utilization_percentage:   نسبة الإشغال من الطاقة الاستيعابية
 */
function getWarehouseStats(warehouseId: number, capacity: number): {
  current_stock:           number;
  items_count:             number;
  utilization_percentage:  number;
} {
  const statsRow = db.prepare(`
    SELECT
      COUNT(*)       AS items_count,
      SUM(quantity)  AS current_stock
    FROM inventory_items
    WHERE warehouse_id = ? AND is_active = 1
  `).get(warehouseId) as { items_count: number; current_stock: number | null };

  const current_stock  = statsRow.current_stock ?? 0;
  const items_count    = statsRow.items_count   ?? 0;
  const utilization    = capacity > 0
    ? Math.min(100, (current_stock / capacity) * 100)
    : 0;

  return {
    current_stock,
    items_count,
    utilization_percentage: Math.round(utilization * 100) / 100,
  };
}

/** دمج بيانات المخزن مع إحصاءاته */
function enrichWarehouse(warehouse: DbWarehouse): WarehouseWithStats {
  const stats = getWarehouseStats(warehouse.id, warehouse.capacity);
  return { ...warehouse, ...stats };
}

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/v1/warehouses
// قائمة جميع المخازن مع إحصاءات الإشغال
// ══════════════════════════════════════════════════════════════════════════════
router.get("/", (req: Request, res: Response): void => {
  const { is_active = "1", search } = req.query as Record<string, string>;

  const conditions: string[] = [];
  const params: unknown[]    = [];

  if (is_active !== "all") {
    conditions.push("is_active = ?");
    params.push(is_active === "0" ? 0 : 1);
  }

  if (search?.trim()) {
    conditions.push("(name LIKE ? OR location LIKE ?)");
    const pattern = `%${search.trim()}%`;
    params.push(pattern, pattern);
  }

  const whereClause = conditions.length > 0
    ? "WHERE " + conditions.join(" AND ")
    : "";

  const warehouses = db.prepare(`
    SELECT * FROM warehouses
    ${whereClause}
    ORDER BY created_at ASC
  `).all(...params) as DbWarehouse[];

  // إضافة إحصاءات لكل مخزن
  const enriched = warehouses.map(enrichWarehouse);

  // إجماليات سريعة
  const totalItems = enriched.reduce((acc, w) => acc + w.items_count, 0);
  const totalStock = enriched.reduce((acc, w) => acc + w.current_stock, 0);

  res.status(200).json({
    success: true,
    data: {
      warehouses: enriched,
      total:      enriched.length,
      summary: {
        total_warehouses: enriched.length,
        total_items:      totalItems,
        total_stock:      totalStock,
      },
    },
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/v1/warehouses/:id
// تفاصيل مخزن واحد مع قائمة أصنافه
// ══════════════════════════════════════════════════════════════════════════════
router.get("/:id", (req: Request, res: Response): void => {
  const id = parseId(req.params.id);
  if (!id) {
    res.status(400).json({ success: false, error: "معرّف المخزن غير صالح" });
    return;
  }

  const warehouse = db
    .prepare("SELECT * FROM warehouses WHERE id = ?")
    .get(id) as DbWarehouse | undefined;

  if (!warehouse) {
    res.status(404).json({ success: false, error: "المخزن غير موجود" });
    return;
  }

  // قائمة أصناف المخزن مع حالة المخزون لكل صنف
  const items = db.prepare(`
    SELECT
      id, name, sku, barcode, category, unit,
      quantity, min_quantity, cost_price, selling_price,
      CASE
        WHEN quantity <= 0              THEN 'out_of_stock'
        WHEN quantity <= min_quantity   THEN 'low_stock'
        ELSE                                 'in_stock'
      END AS status,
      (quantity * cost_price) AS stock_value
    FROM inventory_items
    WHERE warehouse_id = ? AND is_active = 1
    ORDER BY name ASC
  `).all(id) as (DbInventoryItem & { status: string; stock_value: number })[];

  // قيمة المخزون الكلية لهذا المخزن
  const totalValue = items.reduce((acc, item) => acc + item.stock_value, 0);

  res.status(200).json({
    success: true,
    data: {
      warehouse: enrichWarehouse(warehouse),
      items,
      items_total_value: totalValue,
    },
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/v1/warehouses
// إنشاء مخزن جديد
// ══════════════════════════════════════════════════════════════════════════════
router.post(
  "/",
  checkRole("admin"),
  (req: Request, res: Response): void => {
    // ── 1. التحقق من صحة البيانات ─────────────────────────────────────────
    let parsed: z.infer<typeof createWarehouseSchema>;
    try {
      parsed = createWarehouseSchema.parse(req.body);
    } catch (err) {
      if (err instanceof ZodError) { handleZodError(err, res); return; }
      throw err;
    }

    // ── 2. التحقق من عدم تكرار الاسم ──────────────────────────────────────
    const nameExists = db
      .prepare("SELECT id FROM warehouses WHERE name = ?")
      .get(parsed.name);

    if (nameExists) {
      res.status(409).json({
        success: false,
        error: `مخزن بالاسم "${parsed.name}" موجود بالفعل`,
      });
      return;
    }

    // ── 3. إنشاء المخزن ────────────────────────────────────────────────────
    const result = db.prepare(`
      INSERT INTO warehouses
        (name, location, capacity, manager_name, phone, color, description)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      parsed.name,
      parsed.location     ?? null,
      parsed.capacity,
      parsed.manager_name ?? null,
      parsed.phone        ?? null,
      parsed.color,
      parsed.description  ?? null,
    );

    const newWarehouse = db
      .prepare("SELECT * FROM warehouses WHERE id = ?")
      .get(result.lastInsertRowid) as DbWarehouse;

    res.status(201).json({
      success: true,
      data:    { warehouse: enrichWarehouse(newWarehouse) },
      message: `تم إنشاء المخزن "${parsed.name}" بنجاح`,
    });
  }
);

// ══════════════════════════════════════════════════════════════════════════════
// PUT /api/v1/warehouses/:id
// تعديل بيانات مخزن
// ══════════════════════════════════════════════════════════════════════════════
router.put(
  "/:id",
  checkRole("admin"),
  (req: Request, res: Response): void => {
    const id = parseId(req.params.id);
    if (!id) {
      res.status(400).json({ success: false, error: "معرّف المخزن غير صالح" });
      return;
    }

    // ── 1. التحقق من وجود المخزن ──────────────────────────────────────────
    const existing = db
      .prepare("SELECT * FROM warehouses WHERE id = ?")
      .get(id) as DbWarehouse | undefined;

    if (!existing) {
      res.status(404).json({ success: false, error: "المخزن غير موجود" });
      return;
    }

    // ── 2. التحقق من صحة البيانات ─────────────────────────────────────────
    let parsed: z.infer<typeof updateWarehouseSchema>;
    try {
      parsed = updateWarehouseSchema.parse(req.body);
    } catch (err) {
      if (err instanceof ZodError) { handleZodError(err, res); return; }
      throw err;
    }

    // ── 3. التحقق من عدم تكرار الاسم (إن تغيّر) ──────────────────────────
    if (parsed.name && parsed.name !== existing.name) {
      const nameExists = db
        .prepare("SELECT id FROM warehouses WHERE name = ? AND id != ?")
        .get(parsed.name, id);
      if (nameExists) {
        res.status(409).json({
          success: false,
          error: `مخزن بالاسم "${parsed.name}" موجود بالفعل`,
        });
        return;
      }
    }

    // ── 4. منع تقليل الطاقة الاستيعابية أقل من المخزون الحالي ─────────────
    if (parsed.capacity !== undefined && parsed.capacity < existing.capacity) {
      const stats = getWarehouseStats(id, existing.capacity);
      if (parsed.capacity < stats.current_stock) {
        res.status(422).json({
          success: false,
          error: `لا يمكن تقليل الطاقة الاستيعابية إلى ${parsed.capacity} — المخزون الحالي ${stats.current_stock} أكبر منها`,
        });
        return;
      }
    }

    // ── 5. بناء UPDATE ديناميكي ────────────────────────────────────────────
    const updatableFields: (keyof typeof parsed)[] = [
      "name", "location", "capacity", "manager_name",
      "phone", "color", "description", "is_active",
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
    db.prepare(`UPDATE warehouses SET ${updates.join(", ")} WHERE id = ?`).run(...params);

    const updated = db
      .prepare("SELECT * FROM warehouses WHERE id = ?")
      .get(id) as DbWarehouse;

    res.status(200).json({
      success: true,
      data:    { warehouse: enrichWarehouse(updated) },
      message: "تم تحديث بيانات المخزن بنجاح",
    });
  }
);

// ══════════════════════════════════════════════════════════════════════════════
// DELETE /api/v1/warehouses/:id
// حذف مخزن — يُمنع إذا يحتوي على أصناف نشطة
// ══════════════════════════════════════════════════════════════════════════════
router.delete(
  "/:id",
  checkRole("admin"),
  (req: Request, res: Response): void => {
    const id = parseId(req.params.id);
    if (!id) {
      res.status(400).json({ success: false, error: "معرّف المخزن غير صالح" });
      return;
    }

    // ── 1. التحقق من وجود المخزن ──────────────────────────────────────────
    const warehouse = db
      .prepare("SELECT * FROM warehouses WHERE id = ?")
      .get(id) as DbWarehouse | undefined;

    if (!warehouse) {
      res.status(404).json({ success: false, error: "المخزن غير موجود" });
      return;
    }

    // ── 2. التحقق من عدم احتواء المخزن على أصناف نشطة ────────────────────
    const itemsCount = (db
      .prepare("SELECT COUNT(*) as cnt FROM inventory_items WHERE warehouse_id = ? AND is_active = 1")
      .get(id) as { cnt: number }).cnt;

    if (itemsCount > 0) {
      res.status(422).json({
        success: false,
        error: `لا يمكن حذف المخزن "${warehouse.name}" — يحتوي على ${itemsCount} صنف نشط. انقل الأصناف أولاً أو قم بتعطيل المخزن بدلاً من حذفه`,
      });
      return;
    }

    // ── 3. منع حذف المخزن الوحيد في النظام ───────────────────────────────
    const activeWarehousesCount = (db
      .prepare("SELECT COUNT(*) as cnt FROM warehouses WHERE is_active = 1")
      .get() as { cnt: number }).cnt;

    if (activeWarehousesCount <= 1) {
      res.status(422).json({
        success: false,
        error: "لا يمكن حذف المخزن الوحيد في النظام",
      });
      return;
    }

    // ── 4. soft delete ─────────────────────────────────────────────────────
    db.prepare("UPDATE warehouses SET is_active = 0 WHERE id = ?").run(id);

    res.status(200).json({
      success: true,
      message: `تم تعطيل المخزن "${warehouse.name}" بنجاح`,
    });
  }
);

export default router;
