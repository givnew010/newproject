/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import {
  TrendingUp, TrendingDown, ShoppingCart, ShoppingBag, DollarSign,
  Package, BarChart3, ArrowUp, ArrowDown, Layers
} from 'lucide-react';
import { motion } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { InventoryItem, PurchaseInvoice, SalesInvoice } from './types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Props {
  inventoryItems: InventoryItem[];
}

export default function Reports({ inventoryItems }: Props) {
  const purchaseInvoices = useMemo<PurchaseInvoice[]>(() => {
    try { return JSON.parse(localStorage.getItem('purchase_invoices') ?? '[]'); }
    catch { return []; }
  }, []);

  const salesInvoices = useMemo<SalesInvoice[]>(() => {
    try { return JSON.parse(localStorage.getItem('sales_invoices') ?? '[]'); }
    catch { return []; }
  }, []);

  const totalSales = salesInvoices.reduce((s, i) => s + i.totalAmount, 0);
  const totalPurchases = purchaseInvoices.reduce((s, i) => s + i.totalAmount, 0);
  const grossProfit = totalSales - totalPurchases;
  const profitMargin = totalSales > 0 ? ((grossProfit / totalSales) * 100).toFixed(1) : '0';
  const totalInventoryValue = inventoryItems.reduce((s, i) => s + i.price * i.quantity, 0);

  // Top selling items by quantity
  const topSelling = useMemo(() => {
    const map: Record<string, { name: string; qty: number; revenue: number }> = {};
    salesInvoices.forEach(inv => {
      inv.items.forEach(item => {
        if (!map[item.name]) map[item.name] = { name: item.name, qty: 0, revenue: 0 };
        map[item.name].qty += item.quantity;
        map[item.name].revenue += item.total;
      });
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [salesInvoices]);

  // Top purchased items
  const topPurchased = useMemo(() => {
    const map: Record<string, { name: string; qty: number; cost: number }> = {};
    purchaseInvoices.forEach(inv => {
      inv.items.forEach(item => {
        if (!map[item.name]) map[item.name] = { name: item.name, qty: 0, cost: 0 };
        map[item.name].qty += item.quantity;
        map[item.name].cost += item.total;
      });
    });
    return Object.values(map).sort((a, b) => b.cost - a.cost).slice(0, 5);
  }, [purchaseInvoices]);

  // Monthly summary
  const monthlySummary = useMemo(() => {
    const months: Record<string, { sales: number; purchases: number; label: string }> = {};
    const toMonth = (date: string) => date.substring(0, 7);
    const toLabel = (ym: string) => {
      const [y, m] = ym.split('-');
      const monthNames = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
      return `${monthNames[parseInt(m) - 1]} ${y}`;
    };
    salesInvoices.forEach(inv => {
      const k = toMonth(inv.date);
      if (!months[k]) months[k] = { sales: 0, purchases: 0, label: toLabel(k) };
      months[k].sales += inv.totalAmount;
    });
    purchaseInvoices.forEach(inv => {
      const k = toMonth(inv.date);
      if (!months[k]) months[k] = { sales: 0, purchases: 0, label: toLabel(k) };
      months[k].purchases += inv.totalAmount;
    });
    return Object.entries(months)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 6)
      .map(([, v]) => v);
  }, [salesInvoices, purchaseInvoices]);

  const maxMonthlyValue = Math.max(...monthlySummary.flatMap(m => [m.sales, m.purchases]), 1);

  return (
    <div className="p-4 lg:p-8 space-y-6 flex-1">

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          label="إجمالي الإيرادات"
          value={`${totalSales.toLocaleString('ar-SA')} ر.س`}
          icon={<TrendingUp size={20} />}
          color="text-green-700 bg-green-100"
          bg="bg-green-50"
        />
        <SummaryCard
          label="إجمالي التكاليف"
          value={`${totalPurchases.toLocaleString('ar-SA')} ر.س`}
          icon={<ShoppingCart size={20} />}
          color="text-blue-700 bg-blue-100"
          bg="bg-blue-50"
        />
        <SummaryCard
          label={grossProfit >= 0 ? "صافي الربح" : "صافي الخسارة"}
          value={`${Math.abs(grossProfit).toLocaleString('ar-SA')} ر.س`}
          icon={grossProfit >= 0 ? <DollarSign size={20} /> : <TrendingDown size={20} />}
          color={grossProfit >= 0 ? "text-emerald-700 bg-emerald-100" : "text-error bg-error-container"}
          bg={grossProfit >= 0 ? "bg-emerald-50" : "bg-red-50"}
          sub={`هامش الربح ${profitMargin}%`}
        />
        <SummaryCard
          label="قيمة المخزون الحالية"
          value={`${totalInventoryValue.toLocaleString('ar-SA')} ر.س`}
          icon={<Layers size={20} />}
          color="text-primary bg-primary-fixed"
          bg="bg-primary-fixed/20"
          sub={`${inventoryItems.length} صنف`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Monthly Chart */}
        <div className="bg-white rounded-2xl border border-surface-container-high shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-surface-container-high">
            <h4 className="font-bold text-on-surface text-sm flex items-center gap-2">
              <BarChart3 size={16} className="text-primary" />
              الأداء الشهري
            </h4>
          </div>
          {monthlySummary.length === 0 ? (
            <div className="p-10 text-center text-on-surface-variant text-sm">لا توجد بيانات كافية</div>
          ) : (
            <div className="p-5 space-y-4">
              {monthlySummary.map((month, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs text-on-surface-variant">
                    <span className="font-semibold">{month.label}</span>
                    <span className={cn("font-bold", month.sales >= month.purchases ? "text-green-700" : "text-orange-600")}>
                      {month.sales >= month.purchases
                        ? `ربح: ${(month.sales - month.purchases).toLocaleString('ar-SA')} ر.س`
                        : `خسارة: ${(month.purchases - month.sales).toLocaleString('ar-SA')} ر.س`}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-green-600 w-14 text-left font-medium">مبيعات</span>
                      <div className="flex-1 bg-green-50 rounded-full h-2.5 overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-l from-green-400 to-green-600 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${(month.sales / maxMonthlyValue) * 100}%` }}
                          transition={{ delay: idx * 0.05 + 0.1, duration: 0.5 }}
                        />
                      </div>
                      <span className="text-[10px] text-on-surface-variant w-20 text-left">{month.sales.toLocaleString('ar-SA')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-blue-600 w-14 text-left font-medium">مشتريات</span>
                      <div className="flex-1 bg-blue-50 rounded-full h-2.5 overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-l from-blue-400 to-blue-600 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${(month.purchases / maxMonthlyValue) * 100}%` }}
                          transition={{ delay: idx * 0.05 + 0.15, duration: 0.5 }}
                        />
                      </div>
                      <span className="text-[10px] text-on-surface-variant w-20 text-left">{month.purchases.toLocaleString('ar-SA')}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Top Items */}
        <div className="space-y-4">
          {/* Top Selling */}
          <div className="bg-white rounded-2xl border border-surface-container-high shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-surface-container-high">
              <h4 className="font-bold text-on-surface text-sm flex items-center gap-2">
                <ShoppingBag size={15} className="text-green-600" />
                الأصناف الأكثر مبيعاً
              </h4>
            </div>
            {topSelling.length === 0 ? (
              <div className="p-6 text-center text-xs text-on-surface-variant">لا توجد مبيعات بعد</div>
            ) : (
              <div className="divide-y divide-surface-container-low">
                {topSelling.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-green-50 text-green-700 text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="text-xs font-bold text-on-surface">{item.name}</p>
                        <p className="text-[10px] text-on-surface-variant">{item.qty} وحدة مباعة</p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold text-green-700">{item.revenue.toLocaleString('ar-SA')} ر.س</p>
                      <div className="flex items-center gap-0.5 justify-end">
                        <ArrowUp size={10} className="text-green-600" />
                        <span className="text-[10px] text-green-600">إيرادات</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Purchased */}
          <div className="bg-white rounded-2xl border border-surface-container-high shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-surface-container-high">
              <h4 className="font-bold text-on-surface text-sm flex items-center gap-2">
                <Package size={15} className="text-blue-600" />
                الأصناف الأكثر شراءً
              </h4>
            </div>
            {topPurchased.length === 0 ? (
              <div className="p-6 text-center text-xs text-on-surface-variant">لا توجد مشتريات بعد</div>
            ) : (
              <div className="divide-y divide-surface-container-low">
                {topPurchased.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="text-xs font-bold text-on-surface">{item.name}</p>
                        <p className="text-[10px] text-on-surface-variant">{item.qty} وحدة تم شراؤها</p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold text-blue-700">{item.cost.toLocaleString('ar-SA')} ر.س</p>
                      <div className="flex items-center gap-0.5 justify-end">
                        <ArrowDown size={10} className="text-blue-600" />
                        <span className="text-[10px] text-blue-600">تكلفة</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Inventory Breakdown Table */}
      <div className="bg-white rounded-2xl border border-surface-container-high shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-surface-container-high flex items-center justify-between">
          <h4 className="font-bold text-on-surface text-sm flex items-center gap-2">
            <Layers size={16} className="text-primary" />
            تقرير المخزون التفصيلي
          </h4>
          <span className="text-xs text-on-surface-variant">{inventoryItems.length} صنف</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-surface-container-low/40 border-b border-surface-container-high">
              <tr>
                <th className="px-5 py-3 text-[11px] font-bold text-on-surface-variant">الصنف</th>
                <th className="px-5 py-3 text-[11px] font-bold text-on-surface-variant text-center">الكمية المتاحة</th>
                <th className="px-5 py-3 text-[11px] font-bold text-on-surface-variant text-center">سعر الوحدة</th>
                <th className="px-5 py-3 text-[11px] font-bold text-on-surface-variant text-center">القيمة الإجمالية</th>
                <th className="px-5 py-3 text-[11px] font-bold text-on-surface-variant text-center">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low">
              {inventoryItems.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-on-surface-variant text-xs">لا توجد أصناف</td></tr>
              ) : (
                inventoryItems.map(item => (
                  <tr key={item.id} className="hover:bg-surface-container-low/20 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-bold text-on-surface text-xs">{item.name}</p>
                      <p className="text-[10px] text-on-surface-variant">{item.sku}</p>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={cn(
                        "font-bold text-xs",
                        item.quantity === 0 ? "text-error" : item.quantity <= 5 ? "text-orange-600" : "text-primary"
                      )}>{item.quantity} وحدة</span>
                    </td>
                    <td className="px-5 py-3 text-center text-xs text-on-surface-variant font-medium">
                      {item.price.toLocaleString('ar-SA')} ر.س
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className="font-bold text-xs text-on-surface">
                        {(item.price * item.quantity).toLocaleString('ar-SA')} ر.س
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap",
                        item.status === 'in-stock' ? "bg-primary-fixed text-on-primary-fixed-variant" :
                        item.status === 'low-stock' ? "bg-orange-100 text-orange-700" :
                        "bg-error-container text-on-error-container"
                      )}>
                        {item.status === 'in-stock' ? 'متوفر' : item.status === 'low-stock' ? 'كمية منخفضة' : 'نفذ المخزون'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot className="bg-surface-container-low/30 border-t-2 border-surface-container-high">
              <tr>
                <td colSpan={3} className="px-5 py-3 text-left text-xs font-bold text-on-surface">إجمالي قيمة المخزون</td>
                <td className="px-5 py-3 text-center font-extrabold text-primary text-sm">
                  {totalInventoryValue.toLocaleString('ar-SA')} ر.س
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  label, value, icon, color, bg, sub
}: {
  label: string; value: string; icon: React.ReactNode;
  color: string; bg: string; sub?: string;
}) {
  return (
    <div className={cn("rounded-2xl p-5 border border-surface-container-high shadow-sm", bg)}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-on-surface-variant mb-1 truncate">{label}</p>
          <p className={cn("text-lg font-extrabold leading-tight", color.split(' ')[0])}>{value}</p>
          {sub && <p className="text-[11px] text-on-surface-variant mt-1">{sub}</p>}
        </div>
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", color)}>
          {icon}
        </div>
      </div>
    </div>
  );
}
