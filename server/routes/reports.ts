// ══════════════════════════════════════════════════════════════════════════════
// server/routes/reports.ts
// المهمة 8-1 إلى 8-6: تقارير dashboard، مبيعات، مشتريات، ذمم، مخزون
// ══════════════════════════════════════════════════════════════════════════════

import { Router, Request, Response } from "express";
import db from "../db.js";
import { verifyToken, checkRole } from "../middleware/auth.js";
import type { ApiResponse } from "../types.js";

const router = Router();

router.use(verifyToken);

// ══════════════════════════════════════════════════════════════════════════════
// 8-1: dashboard
// ══════════════════════════════════════════════════════════════════════════════
router.get("/dashboard", (req: Request, res: Response<ApiResponse<unknown>>) => {
  try {
    const totalSalesToday = (db.prepare(`
      SELECT COALESCE(SUM(total), 0) as total
      FROM sales_invoices
      WHERE status != 'cancelled' AND date(date) = date('now','localtime')
    `).get() as { total: number }).total;

    const totalSalesMonth = (db.prepare(`
      SELECT COALESCE(SUM(total), 0) as total
      FROM sales_invoices
      WHERE status != 'cancelled' AND strftime('%Y-%m', date) = strftime('%Y-%m', 'now','localtime')
    `).get() as { total: number }).total;

    const totalSalesYear = (db.prepare(`
      SELECT COALESCE(SUM(total), 0) as total
      FROM sales_invoices
      WHERE status != 'cancelled' AND strftime('%Y', date) = strftime('%Y', 'now','localtime')
    `).get() as { total: number }).total;

    const totalPurchasesMonth = (db.prepare(`
      SELECT COALESCE(SUM(total), 0) as total
      FROM purchase_invoices
      WHERE status != 'cancelled' AND strftime('%Y-%m', date) = strftime('%Y-%m', 'now','localtime')
    `).get() as { total: number }).total;

    const cogsSales = (db.prepare(`
      SELECT COALESCE(SUM(sii.quantity * ii.cost_price), 0) as cogs
      FROM sales_invoice_items sii
      JOIN sales_invoices si ON sii.invoice_id = si.id
      JOIN inventory_items ii ON sii.item_id = ii.id
      WHERE si.status != 'cancelled'
    `).get() as { cogs: number }).cogs;

    const netProfit = Math.round((totalSalesMonth - cogsSales) * 100) / 100;

    const pendingSales = (db.prepare(`
      SELECT COUNT(*) as count
      FROM sales_invoices
      WHERE status IN ('draft', 'confirmed', 'partial')
    `).get() as { count: number }).count;

    const lowStockItems = db.prepare(`
      SELECT id, name, quantity, min_quantity
      FROM inventory_items
      WHERE is_active = 1 AND quantity <= min_quantity
      ORDER BY quantity ASC
    `).all();

    const lastSales = db.prepare(`
      SELECT id, invoice_number, customer_id, date, total, paid_amount, status
      FROM sales_invoices
      ORDER BY date DESC, id DESC
      LIMIT 5
    `).all();

    const lastPurchases = db.prepare(`
      SELECT id, invoice_number, supplier_id, date, total, paid_amount, status
      FROM purchase_invoices
      ORDER BY date DESC, id DESC
      LIMIT 5
    `).all();

    res.json({
      success: true,
      data: {
        totalSalesToday,
        totalSalesMonth,
        totalSalesYear,
        totalPurchasesMonth,
        netProfit,
        pendingSales,
        lowStockCount: lowStockItems.length,
        lowStockItems,
        lastSales,
        lastPurchases,
      },
    });
  } catch (error) {
    console.error("خطأ dashboard:", error);
    res.status(500).json({ success: false, error: "فشل في جلب بيانات dashboard" });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// 8-2: sales report
// ══════════════════════════════════════════════════════════════════════════════
router.get("/sales", (req: Request, res: Response<ApiResponse<unknown>>) => {
  try {
    const { date_from, date_to, customer_id, group_by = "month" } = req.query as Record<string, string>;
    let periodExpr = "strftime('%Y-%m', date)";

    if (group_by === "day") periodExpr = "strftime('%Y-%m-%d', date)";
    if (group_by === "week") periodExpr = "strftime('%Y-W%W', date)";

    const conditions: string[] = ["status != 'cancelled'"];
    const params: unknown[] = [];

    if (date_from) { conditions.push("date >= ?"); params.push(date_from); }
    if (date_to) { conditions.push("date <= ?"); params.push(date_to); }
    if (customer_id) { conditions.push("customer_id = ?"); params.push(customer_id); }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const stmtSalesByPeriod = db.prepare(`
      SELECT ${periodExpr} as period, COUNT(*) as invoices_count, COALESCE(SUM(total),0) as total_sales
      FROM sales_invoices
      ${where}
      GROUP BY period
      ORDER BY period DESC
    `);
    const salesByPeriod = (params.length ? (stmtSalesByPeriod as any).all(...params) : stmtSalesByPeriod.all()) as Array<any>;

    const stmtTopCustomers = db.prepare(`
      SELECT c.id, c.name, COUNT(si.id) as invoices_count, COALESCE(SUM(si.total),0) as total_spent
      FROM sales_invoices si
      JOIN customers c ON si.customer_id = c.id
      ${where}
      GROUP BY c.id, c.name
      ORDER BY total_spent DESC
      LIMIT 10
    `);
    const topCustomers = (params.length ? (stmtTopCustomers as any).all(...params) : stmtTopCustomers.all()) as Array<any>;

    const stmtTopItems = db.prepare(`
      SELECT ii.id, ii.name, ii.sku, COALESCE(SUM(sii.quantity),0) as quantity_sold, COALESCE(SUM(sii.total),0) as revenue
      FROM sales_invoice_items sii
      JOIN sales_invoices si ON sii.invoice_id = si.id
      JOIN inventory_items ii ON sii.item_id = ii.id
      ${where}
      GROUP BY ii.id, ii.name, ii.sku
      ORDER BY quantity_sold DESC
      LIMIT 10
    `);
    const topItems = (params.length ? (stmtTopItems as any).all(...params) : stmtTopItems.all()) as Array<any>;

    const totalsStmt = db.prepare<{ gross_sales: number; discounts: number; tax: number }>(`
      SELECT COALESCE(SUM(total),0) as gross_sales, COALESCE(SUM(discount_amount),0) as discounts, COALESCE(SUM(tax_amount),0) as tax
      FROM sales_invoices
      ${where}
    `);
    const totals = ((params.length ? (totalsStmt as any).get(...params) : (totalsStmt as any).get(undefined)) as { gross_sales: number; discounts: number; tax: number } | undefined);

    const safeTotals = totals ?? { gross_sales: 0, discounts: 0, tax: 0 };
    const net_sales = Math.round((safeTotals.gross_sales - safeTotals.discounts) * 100) / 100;

    res.json({
      success: true,
      data: {
        sales_by_period: salesByPeriod,
        top_customers: topCustomers,
        top_items: topItems,
        totals: {
          gross_sales: safeTotals.gross_sales,
          discounts: safeTotals.discounts,
          tax: safeTotals.tax,
          net_sales,
        },
      },
    });
  } catch (error) {
    console.error("خطأ في تقرير المبيعات:", error);
    res.status(500).json({ success: false, error: "فشل في جلب تقرير المبيعات" });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// 8-3: purchases report
// ══════════════════════════════════════════════════════════════════════════════
router.get("/purchases", (req: Request, res: Response<ApiResponse<unknown>>) => {
  try {
    const { date_from, date_to, supplier_id, group_by = "month" } = req.query as Record<string, string>;
    let periodExpr = "strftime('%Y-%m', date)";

    if (group_by === "day") periodExpr = "strftime('%Y-%m-%d', date)";
    if (group_by === "week") periodExpr = "strftime('%Y-W%W', date)";

    const conditions: string[] = ["status != 'cancelled'"];
    const params: unknown[] = [];

    if (date_from) { conditions.push("date >= ?"); params.push(date_from); }
    if (date_to) { conditions.push("date <= ?"); params.push(date_to); }
    if (supplier_id) { conditions.push("supplier_id = ?"); params.push(supplier_id); }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const stmtPurchasesByPeriod = db.prepare(`
      SELECT ${periodExpr} as period, COUNT(*) as invoices_count, COALESCE(SUM(total),0) as total_purchases
      FROM purchase_invoices
      ${where}
      GROUP BY period
      ORDER BY period DESC
    `);
    const purchasesByPeriod = (params.length ? (stmtPurchasesByPeriod as any).all(...params) : stmtPurchasesByPeriod.all()) as Array<any>;

    const stmtTopSuppliers = db.prepare(`
      SELECT s.id, s.name, COUNT(pi.id) as invoices_count, COALESCE(SUM(pi.total),0) as total_purchased
      FROM purchase_invoices pi
      JOIN suppliers s ON pi.supplier_id = s.id
      ${where}
      GROUP BY s.id, s.name
      ORDER BY total_purchased DESC
      LIMIT 10
    `);
    const topSuppliers = (params.length ? (stmtTopSuppliers as any).all(...params) : stmtTopSuppliers.all()) as Array<any>;

    const stmtTopPurchasedItems = db.prepare(`
      SELECT ii.id, ii.name, ii.sku, COALESCE(SUM(pii.quantity),0) as quantity_purchased, COALESCE(SUM(pii.total),0) as value
      FROM purchase_invoice_items pii
      JOIN purchase_invoices pi ON pii.invoice_id = pi.id
      JOIN inventory_items ii ON pii.item_id = ii.id
      ${where}
      GROUP BY ii.id, ii.name, ii.sku
      ORDER BY quantity_purchased DESC
      LIMIT 10
    `);
    const topPurchasedItems = (params.length ? (stmtTopPurchasedItems as any).all(...params) : stmtTopPurchasedItems.all()) as Array<any>;

    const totalsStmt = db.prepare<{ gross_purchases: number; discounts: number; tax: number }>(`
      SELECT COALESCE(SUM(total),0) as gross_purchases, COALESCE(SUM(discount_amount),0) as discounts, COALESCE(SUM(tax_amount),0) as tax
      FROM purchase_invoices
      ${where}
    `);
    const totals = ((params.length ? (totalsStmt as any).get(...params) : (totalsStmt as any).get(undefined)) as { gross_purchases: number; discounts: number; tax: number } | undefined);

    const safePurchaseTotals = totals ?? { gross_purchases: 0, discounts: 0, tax: 0 };
    const net_purchases = Math.round((safePurchaseTotals.gross_purchases - safePurchaseTotals.discounts) * 100) / 100;

    res.json({
      success: true,
      data: {
        purchases_by_period: purchasesByPeriod,
        top_suppliers: topSuppliers,
        top_purchased_items: topPurchasedItems,
        totals: {
          gross_purchases: safePurchaseTotals.gross_purchases,
          discounts: safePurchaseTotals.discounts,
          tax: safePurchaseTotals.tax,
          net_purchases,
        },
      },
    });
  } catch (error) {
    console.error("خطأ في تقرير المشتريات:", error);
    res.status(500).json({ success: false, error: "فشل في جلب تقرير المشتريات" });
  }
});

function computeAging(dueDate: string, refAmount: number): { current: number; unr30: number; unr60: number; over60: number } {
  const dest = new Date(dueDate);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - dest.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { current: refAmount, unr30: 0, unr60: 0, over60: 0 };
  if (diffDays <= 30) return { current: 0, unr30: refAmount, unr60: 0, over60: 0 };
  if (diffDays <= 60) return { current: 0, unr30: 0, unr60: refAmount, over60: 0 };
  return { current: 0, unr30: 0, unr60: 0, over60: refAmount };
}

// ══════════════════════════════════════════════════════════════════════════════
// 8-4: reports receivables
// ══════════════════════════════════════════════════════════════════════════════
router.get("/receivables", (req: Request, res: Response<ApiResponse<unknown>>) => {
  try {
    const customers = db.prepare("SELECT id, name FROM customers WHERE is_active = 1").all();

    const rows = customers.map((cust: any) => {
      const invoices = db.prepare<{
        total: number;
        paid_amount: number;
        due_date: string | null;
        date: string;
      }>(`
        SELECT total, paid_amount, due_date, date FROM sales_invoices
        WHERE customer_id = ? AND status != 'cancelled'
      `).all(cust.id) as Array<{
        total: number;
        paid_amount: number;
        due_date: string | null;
        date: string;
      }>;

      let current = 0, unr30 = 0, unr60 = 0, over60 = 0;
      let total_due = 0;

      for (const inv of invoices) {
        const due = inv.total - inv.paid_amount;
        if (due <= 0) continue;
        total_due += due;
        const aging = computeAging(inv.due_date || inv.date, due);
        current += aging.current;
        unr30 += aging.unr30;
        unr60 += aging.unr60;
        over60 += aging.over60;
      }

      return {
        customer_id: cust.id,
        customer_name: cust.name,
        total_due: Math.round(total_due * 100) / 100,
        current: Math.round(current * 100) / 100,
        '1_30': Math.round(unr30 * 100) / 100,
        '31_60': Math.round(unr60 * 100) / 100,
        over60: Math.round(over60 * 100) / 100,
      };
    });

    const total_overdue = rows.reduce((sum: number, r: any) => sum + r['31_60'] + r.over60, 0);

    res.json({ success: true, data: { rows, total_overdue: Math.round(total_overdue * 100) / 100 } });
  } catch (error) {
    console.error("خطأ في تقرير الذمم (receivables):", error);
    res.status(500).json({ success: false, error: "فشل في جلب تقرير الذمم" });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// 8-4: reports payables
// ══════════════════════════════════════════════════════════════════════════════
router.get("/payables", (req: Request, res: Response<ApiResponse<unknown>>) => {
  try {
    const suppliers = db.prepare("SELECT id, name FROM suppliers WHERE is_active = 1").all();

    const rows = suppliers.map((supp: any) => {
      const invoices = db.prepare<{
        total: number;
        paid_amount: number;
        due_date: string | null;
        date: string;
      }>(`
        SELECT total, paid_amount, due_date, date FROM purchase_invoices
        WHERE supplier_id = ? AND status != 'cancelled'
      `).all(supp.id) as Array<{
        total: number;
        paid_amount: number;
        due_date: string | null;
        date: string;
      }>;

      let current = 0, unr30 = 0, unr60 = 0, over60 = 0;
      let total_due = 0;

      for (const inv of invoices) {
        const due = inv.total - inv.paid_amount;
        if (due <= 0) continue;
        total_due += due;
        const aging = computeAging(inv.due_date || inv.date, due);
        current += aging.current;
        unr30 += aging.unr30;
        unr60 += aging.unr60;
        over60 += aging.over60;
      }

      return {
        supplier_id: supp.id,
        supplier_name: supp.name,
        total_due: Math.round(total_due * 100) / 100,
        current: Math.round(current * 100) / 100,
        '1_30': Math.round(unr30 * 100) / 100,
        '31_60': Math.round(unr60 * 100) / 100,
        over60: Math.round(over60 * 100) / 100,
      };
    });

    const total_overdue = rows.reduce((sum: number, r: any) => sum + r['31_60'] + r.over60, 0);

    res.json({ success: true, data: { rows, total_overdue: Math.round(total_overdue * 100) / 100 } });
  } catch (error) {
    console.error("خطأ في تقرير الذمم (payables):", error);
    res.status(500).json({ success: false, error: "فشل في جلب تقرير الذمم" });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// 8-5: inventory report
// ══════════════════════════════════════════════════════════════════════════════
router.get("/inventory", (req: Request, res: Response<ApiResponse<unknown>>) => {
  try {
    const totalValue = (db.prepare(`
      SELECT COALESCE(SUM(quantity * cost_price), 0) as total
      FROM inventory_items
      WHERE is_active = 1
    `).get() as { total: number }).total;

    const byCategory = db.prepare(`
      SELECT category, COALESCE(SUM(quantity * cost_price),0) as value
      FROM inventory_items
      WHERE is_active = 1
      GROUP BY category
      ORDER BY value DESC
    `).all();

    const lowStock = db.prepare(`
      SELECT id, name, category, quantity, min_quantity
      FROM inventory_items
      WHERE is_active = 1 AND quantity <= min_quantity
      ORDER BY quantity ASC
    `).all();

    const slowMoving = db.prepare(`
      SELECT id, name, category, quantity, cost_price, selling_price
      FROM inventory_items
      WHERE is_active = 1 AND id NOT IN (
        SELECT DISTINCT item_id FROM sales_invoice_items sii
        JOIN sales_invoices si ON sii.invoice_id = si.id
        WHERE si.status != 'cancelled' AND date(si.date) >= date('now','-30 day')
      )
      ORDER BY quantity DESC
      LIMIT 20
    `).all();

    res.json({
      success: true,
      data: {
        total_stock_value: Math.round(totalValue * 100) / 100,
        by_category: byCategory,
        low_stock: lowStock,
        slow_moving: slowMoving,
      },
    });
  } catch (error) {
    console.error("خطأ في تقرير المخزون:", error);
    res.status(500).json({ success: false, error: "فشل في جلب تقرير المخزون" });
  }
});

export default router;
