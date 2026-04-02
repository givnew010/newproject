// ══════════════════════════════════════════════════════════════════════════════
// server/routes/inventory.ts
// المهمة 4-4: عمليات CRUD متكاملة للأصناف
//
// GET    /api/v1/inventory       — قائمة الأصناف مع الفلترة، الفرز، والتفريغ
// GET    /api/v1/inventory/:id   — تفاصيل صنف واحد
// POST   /api/v1/inventory       — إنشاء صنف جديد
// PUT    /api/v1/inventory/:id   — تعديل صنف
// DELETE /api/v1/inventory/:id   — حذف (soft-delete)
// POST   /api/v1/inventory/:id/adjust-stock — تعديل كمية المخزون (وِفق حركة المخزون)
// ══════════════════════════════════════════════════════════════════════════════

import { Router, Request, Response } from "express";
import { z, ZodError } from "zod";
import db from "../db.js";
import { verifyToken, checkRole } from "../middleware/auth.js";
import type {
  DbInventoryItem,
  DbWarehouse,
  InventoryItemWithStock,
  InventoryMovement,
  MovementType,
} from "../types.js";

const router = Router();

// جميع routes تتطلب تسجيل الدخول
router.use(verifyToken);

// ══════════════════════════════════════════════════════════════════════════════
// Zod Schemas
// ══════════════════════════════════════════════════════════════════════════════

const createInventorySchema = z.object({
  name: z.string().min(2, "الاسم يجب أن يحتوي على حرفين على الأقل").max(150, "الاسم طويل جدًا"),
  sku: z.string().max(50, "SKU طويل جدًا").optional().nullable(),
  barcode: z.string().max(100, "الباركود طويل جدًا").optional().nullable(),
  category: z.string().max(100, "التصنيف طويل جدًا").optional().nullable(),
  unit: z.string().max(20, "وحدة القياس طويلة جدًا").default("pcs"),
  quantity: z.number().int().nonnegative().default(0),
  min_quantity: z.number().int().nonnegative().default(0),
  cost_price: z.number().nonnegative().default(0),
  selling_price: z.number().nonnegative().default(0),
  warehouse_id: z.number().int().positive("معرّف المخزن مطلوب"),
  is_active: z.number().int().min(0).max(1).default(1),
});

const updateInventorySchema = createInventorySchema.partial().extend({
  is_active: z.number().int().min(0).max(1).optional(),
});

const stockAdjustmentSchema = z.object({
  quantity: z.number().int().nonnegative(),
  movement_type: z.enum(["in", "out"]),
  note: z.string().max(500, "الملاحظة طويلة جدًا").optional().nullable(),
});

// ══════════════════════════════════════════════════════════════════════════════
// Helpers
// ══════════════════════════════════════════════════════════════════════════════

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

function getInventoryItem(id: number): DbInventoryItem | undefined {
  return db
    .prepare("SELECT * FROM inventory_items WHERE id = ? AND is_active = 1")
    .get(id) as DbInventoryItem | undefined;
}

function getWarehouse(warehouseId: number): DbWarehouse | undefined {
  return db
    .prepare("SELECT * FROM warehouses WHERE id = ? AND is_active = 1")
    .get(warehouseId) as DbWarehouse | undefined;
}

function determineStatus(quantity: number, min_quantity: number): "in_stock" | "low_stock" | "out_of_stock" {
  if (quantity <= 0) return "out_of_stock";
  if (quantity <= min_quantity) return "low_stock";
  return "in_stock";
}

function enrichInventoryItem(item: DbInventoryItem): InventoryItemWithStock {
  return {
    ...item,
    status: determineStatus(item.quantity, item.min_quantity),
    stock_value: item.quantity * item.cost_price,
  };
}

function createMovement(
  itemId: number,
  type: MovementType,
  quantity: number,
  warehouseId: number,
  userId: number,
  note?: string,
): InventoryMovement {
  const timestamp = new Date().toISOString();

  const result = db.prepare(`
    INSERT INTO inventory_movements
      (inventory_item_id, movement_type, quantity, warehouse_id, user_id, note, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(itemId, type, quantity, warehouseId, userId, note ?? null, timestamp);

  return {
    id: result.lastInsertRowid as number,
    inventory_item_id: itemId,
    movement_type: type,
    quantity,
    warehouse_id: warehouseId,
    user_id: userId,
    note: note ?? null,
    created_at: timestamp,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// Routes
// ══════════════════════════════════════════════════════════════════════════════

router.get("/", (req: Request, res: Response) => {
  const {
    search,
    warehouse_id,
    category,
    status,
    min_stock,
    max_stock,
    order_by = "name",
    order_dir = "ASC",
    limit = "50",
    offset = "0",
  } = req.query as Record<string, string>;

  const conditions: string[] = ["is_active = 1"];
  const params: unknown[] = [];

  if (search?.trim()) {
    conditions.push("(name LIKE ? OR sku LIKE ? OR barcode LIKE ?)");
    const q = `%${search.trim()}%`;
    params.push(q, q, q);
  }

  if (warehouse_id) {
    conditions.push("warehouse_id = ?");
    params.push(parseInt(warehouse_id, 10));
  }

  if (category) {
    conditions.push("category = ?");
    params.push(category);
  }

  if (status) {
    if (status === "in_stock") conditions.push("quantity > min_quantity");
    else if (status === "low_stock") conditions.push("quantity <= min_quantity AND quantity > 0");
    else if (status === "out_of_stock") conditions.push("quantity <= 0");
  }

  if (min_stock) {
    conditions.push("quantity >= ?");
    params.push(parseInt(min_stock, 10));
  }

  if (max_stock) {
    conditions.push("quantity <= ?");
    params.push(parseInt(max_stock, 10));
  }

  const validOrderColumns = ["name", "sku", "category", "quantity", "cost_price", "selling_price"];
  const safeOrderBy = validOrderColumns.includes(order_by) ? order_by : "name";
  const safeOrderDir = order_dir.toUpperCase() === "DESC" ? "DESC" : "ASC";

  const query = `SELECT * FROM inventory_items WHERE ${conditions.join(" AND ")} ORDER BY ${safeOrderBy} ${safeOrderDir} LIMIT ? OFFSET ?`;
  params.push(parseInt(limit, 10));
  params.push(parseInt(offset, 10));

  const items = db.prepare(query).all(...params) as DbInventoryItem[];
  const enriched = items.map(enrichInventoryItem);

  const total = db.prepare(`SELECT COUNT(*) as cnt FROM inventory_items WHERE ${conditions.join(" AND ")}`).get(...params.slice(0, params.length - 2)) as { cnt: number };

  res.status(200).json({
    success: true,
    data: {
      items: enriched,
      total: total.cnt,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
    },
  });
});

router.get("/:id", (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  if (!id) {
    res.status(400).json({ success: false, error: "معرّف الصنف غير صالح" });
    return;
  }

  const item = getInventoryItem(id);
  if (!item) {
    res.status(404).json({ success: false, error: "الصنف غير موجود" });
    return;
  }

  res.status(200).json({ success: true, data: { item: enrichInventoryItem(item) } });
});

router.post("/", checkRole("admin"), (req: Request, res: Response) => {
  let parsed: z.infer<typeof createInventorySchema>;
  try {
    parsed = createInventorySchema.parse(req.body);
  } catch (err) {
    if (err instanceof ZodError) {
      handleZodError(err, res);
      return;
    }
    throw err;
  }

  const warehouse = getWarehouse(parsed.warehouse_id);
  if (!warehouse) {
    res.status(400).json({ success: false, error: "المخزن المحدد غير موجود" });
    return;
  }

  const existing = db
    .prepare("SELECT id FROM inventory_items WHERE name = ? AND warehouse_id = ?")
    .get(parsed.name, parsed.warehouse_id);

  if (existing) {
    res.status(409).json({ success: false, error: "الصنف موجود بالفعل في نفس المخزن" });
    return;
  }

  const result = db
    .prepare(`
      INSERT INTO inventory_items
        (name, sku, barcode, category, unit, quantity, min_quantity, cost_price, selling_price, warehouse_id, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      parsed.name,
      parsed.sku ?? null,
      parsed.barcode ?? null,
      parsed.category ?? null,
      parsed.unit,
      parsed.quantity,
      parsed.min_quantity,
      parsed.cost_price,
      parsed.selling_price,
      parsed.warehouse_id,
      parsed.is_active,
    );

  const newItem = db
    .prepare("SELECT * FROM inventory_items WHERE id = ?")
    .get(result.lastInsertRowid) as DbInventoryItem;

  // سجل حركة المخزون عند إنشاء الصنف إذا الكمية > 0
  if (parsed.quantity > 0) {
    createMovement(newItem.id, "in", parsed.quantity, parsed.warehouse_id, (req as any).user.id, "بدء حساب المخزون");
  }

  res.status(201).json({ success: true, data: { item: enrichInventoryItem(newItem) }, message: "تم إنشاء الصنف بنجاح" });
});

router.put("/:id", checkRole("admin"), (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  if (!id) {
    res.status(400).json({ success: false, error: "معرّف الصنف غير صالح" });
    return;
  }

  const existing = db.prepare("SELECT * FROM inventory_items WHERE id = ?").get(id) as DbInventoryItem | undefined;
  if (!existing) {
    res.status(404).json({ success: false, error: "الصنف غير موجود" });
    return;
  }

  let parsed: z.infer<typeof updateInventorySchema>;
  try {
    parsed = updateInventorySchema.parse(req.body);
  } catch (err) {
    if (err instanceof ZodError) {
      handleZodError(err, res);
      return;
    }
    throw err;
  }

  if (parsed.warehouse_id) {
    const warehouse = getWarehouse(parsed.warehouse_id);
    if (!warehouse) {
      res.status(400).json({ success: false, error: "المخزن المحدد غير موجود" });
      return;
    }
  }

  const updates: string[] = [];
  const params: unknown[] = [];

  for (const field of [
    "name",
    "sku",
    "barcode",
    "category",
    "unit",
    "quantity",
    "min_quantity",
    "cost_price",
    "selling_price",
    "warehouse_id",
    "is_active",
  ] as const) {
    if ((parsed as any)[field] !== undefined) {
      updates.push(`${field} = ?`);
      params.push((parsed as any)[field]);
    }
  }

  if (updates.length === 0) {
    res.status(400).json({ success: false, error: "لم تُرسل أي بيانات للتعديل" });
    return;
  }

  params.push(id);
  db.prepare(`UPDATE inventory_items SET ${updates.join(", ")} WHERE id = ?`).run(...params);

  const updated = db.prepare("SELECT * FROM inventory_items WHERE id = ?").get(id) as DbInventoryItem;

  res.status(200).json({ success: true, data: { item: enrichInventoryItem(updated) }, message: "تم تحديث الصنف بنجاح" });
});

router.delete("/:id", checkRole("admin"), (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  if (!id) {
    res.status(400).json({ success: false, error: "معرّف الصنف غير صالح" });
    return;
  }

  const existing = db.prepare("SELECT * FROM inventory_items WHERE id = ?").get(id) as DbInventoryItem | undefined;
  if (!existing) {
    res.status(404).json({ success: false, error: "الصنف غير موجود" });
    return;
  }

  db.prepare("UPDATE inventory_items SET is_active = 0 WHERE id = ?").run(id);

  res.status(200).json({ success: true, message: "تم حذف الصنف بنجاح" });
});

router.post("/:id/adjust-stock", checkRole("admin"), (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  if (!id) {
    res.status(400).json({ success: false, error: "معرّف الصنف غير صالح" });
    return;
  }

  const existing = db.prepare("SELECT * FROM inventory_items WHERE id = ?").get(id) as DbInventoryItem | undefined;
  if (!existing) {
    res.status(404).json({ success: false, error: "الصنف غير موجود" });
    return;
  }

  let parsed: z.infer<typeof stockAdjustmentSchema>;
  try {
    parsed = stockAdjustmentSchema.parse(req.body);
  } catch (err) {
    if (err instanceof ZodError) {
      handleZodError(err, res);
      return;
    }
    throw err;
  }

  const newQuantity = parsed.movement_type === "in" ? existing.quantity + parsed.quantity : existing.quantity - parsed.quantity;
  if (newQuantity < 0) {
    res.status(422).json({ success: false, error: "لا يمكن أن تصبح الكمية سلبية" });
    return;
  }

  db.prepare("UPDATE inventory_items SET quantity = ? WHERE id = ?").run(newQuantity, id);

  if (existing.warehouse_id === null) {
    res.status(422).json({ success: false, error: "المخزن المرتبط بالصنف غير صالح" });
    return;
  }

  const movement = createMovement(
    id,
    parsed.movement_type,
    parsed.quantity,
    existing.warehouse_id,
    (req as any).user.id,
    parsed.note ?? undefined,
  );

  const updated = db.prepare("SELECT * FROM inventory_items WHERE id = ?").get(id) as DbInventoryItem;

  res.status(200).json({
    success: true,
    data: {
      item: enrichInventoryItem(updated),
      movement,
    },
    message: "تم تعديل المخزون بنجاح",
  });
});

export default router;
