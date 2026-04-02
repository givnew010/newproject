// ══════════════════════════════════════════════════════════════════════════════
// server/routes/settings.ts
// المهمة 8-6: إعدادات النظام GET/PUT/backup/restore
// ══════════════════════════════════════════════════════════════════════════════

import { Router, Request, Response } from "express";
import db from "../db.js";
import { verifyToken, checkRole } from "../middleware/auth.js";
import type { ApiResponse } from "../types.js";

const router = Router();

router.use(verifyToken);

router.get("/", (req: Request, res: Response<ApiResponse<unknown>>) => {
  try {
    const rows = db.prepare("SELECT key, value FROM settings").all();
    const settings = rows.reduce((acc: Record<string, string>, row: any) => {
      acc[row.key] = row.value;
      return acc;
    }, {});

    res.json({ success: true, data: settings });
  } catch (error) {
    console.error("خطأ في جلب الإعدادات:", error);
    res.status(500).json({ success: false, error: "فشل في جلب الإعدادات" });
  }
});

router.put("/", checkRole("admin"), (req: Request, res: Response<ApiResponse<unknown>>) => {
  try {
    const updates = req.body as Record<string, unknown>;

    if (!updates || typeof updates !== "object") {
      return res.status(400).json({ success: false, error: "البيانات غير صحيحة" });
    }

    const stmt = db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)");
    const tx = db.transaction((pairs: Array<[string, string]>) => {
      for (const [key, value] of pairs) {
        stmt.run(key, value.toString());
      }
    });

    const pairs = Object.entries(updates).map(([k, v]) => [k, v == null ? "" : v.toString()] as [string, string]);
    tx(pairs);

    const rows = db.prepare("SELECT key, value FROM settings").all();
    const settings = rows.reduce((acc: Record<string, string>, row: any) => {
      acc[row.key] = row.value;
      return acc;
    }, {});

    res.json({ success: true, data: settings });
  } catch (error) {
    console.error("خطأ في تحديث الإعدادات:", error);
    res.status(500).json({ success: false, error: "فشل في تحديث الإعدادات" });
  }
});

router.post("/backup", checkRole("admin"), (req: Request, res: Response<ApiResponse<unknown>>) => {
  try {
    const snapshot: Record<string, unknown> = {
      settings: db.prepare("SELECT * FROM settings").all(),
      customers: db.prepare("SELECT * FROM customers").all(),
      suppliers: db.prepare("SELECT * FROM suppliers").all(),
      warehouses: db.prepare("SELECT * FROM warehouses").all(),
      inventory_items: db.prepare("SELECT * FROM inventory_items").all(),
      sales_invoices: db.prepare("SELECT * FROM sales_invoices").all(),
      sales_invoice_items: db.prepare("SELECT * FROM sales_invoice_items").all(),
      purchase_invoices: db.prepare("SELECT * FROM purchase_invoices").all(),
      purchase_invoice_items: db.prepare("SELECT * FROM purchase_invoice_items").all(),
      payments: db.prepare("SELECT * FROM payments").all(),
      stock_movements: db.prepare("SELECT * FROM stock_movements").all(),
    };

    res.json({ success: true, data: snapshot });
  } catch (error) {
    console.error("خطأ في backup settings:", error);
    res.status(500).json({ success: false, error: "فشل في عمل نسخة احتياطية من الإعدادات" });
  }
});

router.post("/restore", checkRole("admin"), (req: Request, res: Response<ApiResponse<unknown>>) => {
  try {
    const payload = req.body as Record<string, unknown>;
    if (!payload || typeof payload !== "object") {
      return res.status(400).json({ success: false, error: "تنسيق البيانات غير صحيح" });
    }

    const tables = [
      "settings",
      "customers",
      "suppliers",
      "warehouses",
      "inventory_items",
      "sales_invoices",
      "sales_invoice_items",
      "purchase_invoices",
      "purchase_invoice_items",
      "payments",
      "stock_movements",
    ];

    const restoreTx = db.transaction(() => {
      for (const table of tables) {
        if (!(table in payload)) continue;

        const items = payload[table] as Array<Record<string, unknown>>;
        if (!Array.isArray(items)) continue;

        db.prepare(`DELETE FROM ${table}`).run();

        if (items.length === 0) continue;

        const cols = Object.keys(items[0]);
        const placeholders = cols.map(() => "?").join(",");
        const insert = db.prepare(`INSERT INTO ${table} (${cols.join(",")}) VALUES (${placeholders})`);

        for (const item of items) {
          const vals = cols.map((col) => (item[col] == null ? null : item[col]));
          insert.run(...vals);
        }
      }
    });

    restoreTx();

    res.json({ success: true, data: { message: "تمت استعادة البيانات بنجاح" } });
  } catch (error) {
    console.error("خطأ في restore settings:", error);
    res.status(500).json({ success: false, error: "فشل في استعادة الإعدادات" });
  }
});

export default router;
