/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import {
  TrendingUp, TrendingDown, Package, ShoppingBag, ShoppingCart,
  AlertTriangle, XCircle, ArrowLeft, DollarSign, BarChart3,
  FileText, Layers, Activity
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
  onNavigate: (page: string) => void;
}

export default function Dashboard({ inventoryItems, onNavigate }: Props) {
  const purchaseInvoices = useMemo<PurchaseInvoice[]>(() => {
    try {
      const saved = localStorage.getItem('purchase_invoices');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  }, []);

  const salesInvoices = useMemo<SalesInvoice[]>(() => {
    try {
      const saved = localStorage.getItem('sales_invoices');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  }, []);

  const totalInventoryValue = inventoryItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const totalSales = salesInvoices.reduce((s, inv) => s + inv.totalAmount, 0);
  const totalPurchases = purchaseInvoices.reduce((s, inv) => s + inv.totalAmount, 0);
  const grossProfit = totalSales - totalPurchases;
  const profitMargin = totalSales > 0 ? Math.round((grossProfit / totalSales) * 100) : 0;

  const lowStockItems = inventoryItems.filter(i => i.status === 'low-stock');
  const outOfStockItems = inventoryItems.filter(i => i.status === 'out-of-stock');

  const recentActivity = useMemo(() => {
    const sales = salesInvoices.map(inv => ({
      id: inv.id,
      type: 'sale' as const,
      label: inv.invoiceNumber,
      sub: inv.customer,
      amount: inv.totalAmount,
      date: inv.date,
    }));
    const purchases = purchaseInvoices.map(inv => ({
      id: inv.id,
      type: 'purchase' as const,
      label: inv.invoiceNumber,
      sub: inv.supplier,
      amount: inv.totalAmount,
      date: inv.date,
    }));
    return [...sales, ...purchases]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 6);
  }, [salesInvoices, purchaseInvoices]);

  return (
    <div className="p-4 lg:p-8 space-y-6 flex-1">

      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-extrabold text-on-surface">مرحباً بك 👋</h3>
          <p className="text-sm text-on-surface-variant mt-1">إليك ملخص نشاط المتجر</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 bg-white border border-surface-container-high rounded-xl px-4 py-2 shadow-sm">
          <Activity size={16} className="text-primary" />
          <span className="text-xs font-bold text-on-surface-variant">النظام يعمل بشكل طبيعي</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="قيمة المخزون"
          value={`${totalInventoryValue.toLocaleString('ar-SA')} ر.س`}
          sub={`${inventoryItems.length} صنف`}
          icon={<Layers size={22} />}
          colorClass="text-primary bg-primary-fixed"
          bgClass="bg-primary-fixed/20"
          onClick={() => onNavigate('inventory')}
        />
        <KPICard
          label="إجمالي المبيعات"
          value={`${totalSales.toLocaleString('ar-SA')} ر.س`}
          sub={`${salesInvoices.length} فاتورة`}
          icon={<TrendingUp size={22} />}
          colorClass="text-green-700 bg-green-100"
          bgClass="bg-green-50"
          onClick={() => onNavigate('sales')}
        />
        <KPICard
          label="إجمالي المشتريات"
          value={`${totalPurchases.toLocaleString('ar-SA')} ر.س`}
          sub={`${purchaseInvoices.length} فاتورة`}
          icon={<ShoppingCart size={22} />}
          colorClass="text-blue-700 bg-blue-100"
          bgClass="bg-blue-50"
          onClick={() => onNavigate('purchases')}
        />
        <KPICard
          label="إجمالي الأرباح"
          value={`${Math.abs(grossProfit).toLocaleString('ar-SA')} ر.س`}
          sub={`هامش ${profitMargin}%`}
          icon={grossProfit >= 0 ? <DollarSign size={22} /> : <TrendingDown size={22} />}
          colorClass={grossProfit >= 0 ? "text-emerald-700 bg-emerald-100" : "text-error bg-error-container"}
          bgClass={grossProfit >= 0 ? "bg-emerald-50" : "bg-red-50"}
          negative={grossProfit < 0}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Quick Navigation Cards */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-on-surface-variant px-1">اختصارات سريعة</h4>
          <QuickLink
            icon={<Package size={20} />}
            label="إدارة الأصناف"
            sub={`${inventoryItems.length} صنف في المخزون`}
            colorClass="text-primary bg-primary-fixed/40"
            onClick={() => onNavigate('inventory')}
          />
          <QuickLink
            icon={<ShoppingBag size={20} />}
            label="فواتير المبيعات"
            sub={`${salesInvoices.length} فاتورة – ${totalSales.toLocaleString('ar-SA')} ر.س`}
            colorClass="text-green-700 bg-green-100"
            onClick={() => onNavigate('sales')}
          />
          <QuickLink
            icon={<ShoppingCart size={20} />}
            label="فواتير المشتريات"
            sub={`${purchaseInvoices.length} فاتورة – ${totalPurchases.toLocaleString('ar-SA')} ر.س`}
            colorClass="text-blue-700 bg-blue-100"
            onClick={() => onNavigate('purchases')}
          />
          <QuickLink
            icon={<BarChart3 size={20} />}
            label="التقارير والتحليلات"
            sub="ملخص مالي شامل"
            colorClass="text-violet-700 bg-violet-100"
            onClick={() => onNavigate('reports')}
          />
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-surface-container-high shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-surface-container-high flex items-center justify-between">
            <h4 className="font-bold text-on-surface text-sm">آخر النشاطات</h4>
            <span className="text-xs text-on-surface-variant">{recentActivity.length} عملية</span>
          </div>
          {recentActivity.length === 0 ? (
            <div className="p-8 text-center text-on-surface-variant text-sm">
              <FileText size={32} className="mx-auto mb-2 opacity-30" />
              <p>لا توجد نشاطات بعد</p>
            </div>
          ) : (
            <div className="divide-y divide-surface-container-low">
              {recentActivity.map((act) => (
                <motion.div
                  key={act.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-surface-container-low/30 transition-colors cursor-pointer"
                  onClick={() => onNavigate(act.type === 'sale' ? 'sales' : 'purchases')}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
                      act.type === 'sale' ? "bg-green-50 text-green-700" : "bg-blue-50 text-blue-700"
                    )}>
                      {act.type === 'sale' ? <ShoppingBag size={17} /> : <ShoppingCart size={17} />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-on-surface font-mono">{act.label}</p>
                      <p className="text-[11px] text-on-surface-variant">{act.sub}</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className={cn("text-sm font-bold", act.type === 'sale' ? "text-green-700" : "text-blue-700")}>
                      {act.type === 'sale' ? '+' : '-'}{act.amount.toLocaleString('ar-SA')} ر.س
                    </p>
                    <p className="text-[11px] text-on-surface-variant">{act.date}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stock Alerts */}
      {(lowStockItems.length > 0 || outOfStockItems.length > 0) && (
        <div className="bg-white rounded-2xl border border-surface-container-high shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-surface-container-high flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle size={17} className="text-orange-500" />
              <h4 className="font-bold text-on-surface text-sm">تنبيهات المخزون</h4>
            </div>
            <button
              onClick={() => onNavigate('inventory')}
              className="flex items-center gap-1 text-xs text-primary font-bold hover:underline"
            >
              عرض الكل <ArrowLeft size={13} />
            </button>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {outOfStockItems.map(item => (
              <AlertItem key={item.id} item={item} type="out" onClick={() => onNavigate('inventory')} />
            ))}
            {lowStockItems.map(item => (
              <AlertItem key={item.id} item={item} type="low" onClick={() => onNavigate('inventory')} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function KPICard({
  label, value, sub, icon, colorClass, bgClass, onClick, negative
}: {
  label: string; value: string; sub: string;
  icon: React.ReactNode; colorClass: string; bgClass: string;
  onClick?: () => void; negative?: boolean;
}) {
  return (
    <motion.div
      whileHover={onClick ? { scale: 1.02 } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
      onClick={onClick}
      className={cn("rounded-2xl p-5 border border-surface-container-high shadow-sm", bgClass, onClick && "cursor-pointer")}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-on-surface-variant mb-1 truncate">{label}</p>
          <p className={cn("text-xl font-extrabold leading-tight", negative ? "text-error" : colorClass.split(' ')[0])}>
            {negative && '−'}{value}
          </p>
          <p className="text-[11px] text-on-surface-variant mt-1.5">{sub}</p>
        </div>
        <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0", colorClass)}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
}

function QuickLink({
  icon, label, sub, colorClass, onClick
}: {
  icon: React.ReactNode; label: string; sub: string; colorClass: string; onClick: () => void;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full bg-white rounded-xl p-4 border border-surface-container-high shadow-sm hover:shadow-md transition-all flex items-center justify-between text-right"
    >
      <div className="flex items-center gap-3">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", colorClass)}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-bold text-on-surface">{label}</p>
          <p className="text-[11px] text-on-surface-variant">{sub}</p>
        </div>
      </div>
      <ArrowLeft size={16} className="text-on-surface-variant/40 flex-shrink-0" />
    </motion.button>
  );
}

function AlertItem({
  item, type, onClick
}: {
  item: InventoryItem; type: 'low' | 'out'; onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl border cursor-pointer hover:shadow-sm transition-all",
        type === 'out'
          ? "bg-red-50 border-red-100 hover:border-red-200"
          : "bg-orange-50 border-orange-100 hover:border-orange-200"
      )}
    >
      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
        type === 'out' ? "bg-error-container text-error" : "bg-orange-100 text-orange-600"
      )}>
        {type === 'out' ? <XCircle size={16} /> : <AlertTriangle size={16} />}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-bold text-on-surface truncate">{item.name}</p>
        <p className={cn("text-[11px] font-medium", type === 'out' ? "text-error" : "text-orange-600")}>
          {type === 'out' ? 'نفذ المخزون' : `متبقي: ${item.quantity} وحدة`}
        </p>
      </div>
    </div>
  );
}
