import React, { useMemo } from 'react';
import {
  TrendingUp, TrendingDown, Package, ShoppingBag, ShoppingCart,
  AlertTriangle, XCircle, ArrowLeft, DollarSign, BarChart3,
  FileText, Layers, Activity, Clock, Zap, ChevronLeft, RefreshCw
} from 'lucide-react';
import { motion } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { InventoryItem, PurchaseInvoice, SalesInvoice } from './types';

// Import API hooks
import { useDashboard } from './hooks/useApi';
import { KPICard } from './components/ui';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Skeleton Loader Component
function SkeletonLoader({ className }: { className: string }) {
  return (
    <div className={cn('animate-pulse bg-surface-container-low rounded', className)} />
  );
}

interface Props {
  onNavigate: (page: string) => void;
}

export default function Dashboard({ onNavigate }: Props) {
  const { dashboard, loading, error, refetch } = useDashboard();

  // Extract data from API response
  const totalInventoryValue = dashboard?.inventory_value || 0;
  const totalSales = dashboard?.sales_today || 0;
  const totalPurchases = dashboard?.purchases_today || 0;
  const grossProfit = totalSales - totalPurchases;
  const profitMargin = totalSales > 0 ? Math.round((grossProfit / totalSales) * 100) : 0;

  const lowStockItems = dashboard?.low_stock_items || [];
  const outOfStockItems = dashboard?.out_of_stock_items || [];
  const recentActivity = dashboard?.recent_activity || [];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'صباح الخير' : hour < 17 ? 'مساء الخير' : 'مساء النور';

  // Show loading state
  if (loading) {
    return (
      <div className="p-4 lg:p-6 space-y-5">
        {/* Welcome Banner Skeleton */}
        <SkeletonLoader className="h-32 rounded-2xl" />

        {/* KPI Cards Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonLoader key={i} className="h-24 rounded-2xl" />
          ))}
        </div>

        {/* Main Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="space-y-3">
            <SkeletonLoader className="h-6 w-32" />
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonLoader key={i} className="h-16 rounded-xl" />
            ))}
          </div>
          <div className="lg:col-span-2">
            <SkeletonLoader className="h-80 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="p-4 lg:p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <XCircle size={32} className="text-red-600" />
          </div>
          <h3 className="text-lg font-bold text-on-surface mb-2">فشل في تحميل البيانات</h3>
          <p className="text-on-surface-variant mb-4">{error}</p>
          <button
            onClick={refetch}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl hover:bg-primary-hover transition-colors mx-auto"
          >
            <RefreshCw size={16} />
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-5">

      {/* Welcome Banner */}
      <div className="bg-gradient-to-l from-blue-600 to-blue-800 rounded-2xl p-5 lg:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 overflow-hidden relative">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }}
        />
        <div className="relative">
          <p className="text-blue-200 text-sm font-medium mb-1">{greeting} 👋</p>
          <h3 className="text-xl lg:text-2xl font-extrabold text-white">مرحباً بك في المُنسق</h3>
          <p className="text-blue-200 text-sm mt-1.5">إليك ملخص شامل لنشاط عملك اليوم</p>
        </div>
        <div className="relative flex items-center gap-2">
          <button
            onClick={refetch}
            disabled={loading}
            className="flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-xl px-3 py-2 text-xs font-bold text-white hover:bg-white/20 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            تحديث
          </button>
          <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-2.5 w-fit">
            <Activity size={15} className="text-emerald-300" />
            <span className="text-xs font-bold text-white">النظام يعمل بشكل طبيعي</span>
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard
          title="قيمة المخزون"
          value={`${totalInventoryValue.toLocaleString('ar-SA')} ر.س`}
          subtitle={`${dashboard?.inventory_count || 0} صنف في المخزون`}
          icon={<Layers size={20} />}
          gradient="blue"
          onClick={() => onNavigate('inventory')}
        />
        <KPICard
          title="إجمالي المبيعات"
          value={`${totalSales.toLocaleString('ar-SA')} ر.س`}
          subtitle={`${dashboard?.sales_count_today || 0} فاتورة مبيعات`}
          icon={<TrendingUp size={20} />}
          gradient="emerald"
          onClick={() => onNavigate('sales')}
        />
        <KPICard
          title="إجمالي المشتريات"
          value={`${totalPurchases.toLocaleString('ar-SA')} ر.س`}
          subtitle={`${dashboard?.purchases_count_today || 0} فاتورة مشتريات`}
          icon={<ShoppingCart size={20} />}
          gradient="purple"
          onClick={() => onNavigate('purchases')}
        />
        <KPICard
          title={grossProfit >= 0 ? 'صافي الربح' : 'صافي الخسارة'}
          value={`${grossProfit < 0 ? '−' : ''}${Math.abs(grossProfit).toLocaleString('ar-SA')} ر.س`}
          subtitle={`هامش ${Math.abs(profitMargin)}%`}
          icon={grossProfit >= 0 ? <DollarSign size={20} /> : <TrendingDown size={20} />}
          gradient={grossProfit >= 0 ? 'amber' : 'red'}
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Quick Actions */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Zap size={15} className="text-primary" />
            <h4 className="text-sm font-extrabold text-on-surface">اختصارات سريعة</h4>
          </div>
          <QuickLink
            icon={<Package size={18} />}
            label="إدارة الأصناف"
            sub={`${dashboard?.inventory_count || 0} صنف في المخزون`}
            color="bg-blue-50 text-blue-700"
            hoverColor="hover:bg-blue-100"
            onClick={() => onNavigate('inventory')}
          />
          <QuickLink
            icon={<ShoppingBag size={18} />}
            label="فواتير المبيعات"
            sub={`${dashboard?.sales_count_today || 0} فاتورة – ${totalSales.toLocaleString('ar-SA')} ر.س`}
            color="bg-emerald-50 text-emerald-700"
            hoverColor="hover:bg-emerald-100"
            onClick={() => onNavigate('sales')}
          />
          <QuickLink
            icon={<ShoppingCart size={18} />}
            label="فواتير المشتريات"
            sub={`${dashboard?.purchases_count_today || 0} فاتورة – ${totalPurchases.toLocaleString('ar-SA')} ر.س`}
            color="bg-violet-50 text-violet-700"
            hoverColor="hover:bg-violet-100"
            onClick={() => onNavigate('purchases')}
          />
          <QuickLink
            icon={<BarChart3 size={18} />}
            label="التقارير والتحليلات"
            sub="ملخص مالي شامل وتفصيلي"
            color="bg-amber-50 text-amber-700"
            hoverColor="hover:bg-amber-100"
            onClick={() => onNavigate('reports')}
          />
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-surface-container-high shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-surface-container-low flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={15} className="text-primary" />
              <h4 className="font-extrabold text-on-surface text-sm">آخر النشاطات</h4>
            </div>
            <span className="text-xs bg-surface-container-low text-on-surface-variant px-2.5 py-1 rounded-full font-medium">
              {recentActivity.length} عملية
            </span>
          </div>
          {recentActivity.length === 0 ? (
            <div className="p-12 text-center text-on-surface-variant">
              <div className="w-14 h-14 bg-surface-container-low rounded-2xl flex items-center justify-center mx-auto mb-3">
                <FileText size={24} className="opacity-30" />
              </div>
              <p className="text-sm font-medium">لا توجد نشاطات بعد</p>
              <p className="text-xs mt-1 opacity-60">ابدأ بإضافة فاتورة مبيعات أو مشتريات</p>
            </div>
          ) : (
            <div className="divide-y divide-surface-container-low/70">
              {recentActivity.map((act, idx) => (
                <motion.div
                  key={act.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-surface-container-low/40 transition-colors cursor-pointer group"
                  onClick={() => onNavigate(act.type === 'sale' ? 'sales' : 'purchases')}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
                      act.type === 'sale' ? 'bg-emerald-50 text-emerald-700' : 'bg-violet-50 text-violet-700'
                    )}>
                      {act.type === 'sale' ? <ShoppingBag size={16} /> : <ShoppingCart size={16} />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-on-surface font-mono">{act.invoice_number}</p>
                      <p className="text-[11px] text-on-surface-variant">{act.customer_name || act.supplier_name}</p>
                    </div>
                  </div>
                  <div className="text-left flex items-center gap-2">
                    <div>
                      <p className={cn('text-sm font-extrabold', act.type === 'sale' ? 'text-emerald-700' : 'text-violet-700')}>
                        {act.type === 'sale' ? '+' : '-'}{act.total.toLocaleString('ar-SA')} ر.س
                      </p>
                      <p className="text-[11px] text-on-surface-variant text-left">{act.date}</p>
                    </div>
                    <ChevronLeft size={14} className="text-on-surface-variant/30 group-hover:text-primary transition-colors" />
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
          <div className="px-5 py-4 border-b border-surface-container-low flex items-center justify-between bg-gradient-to-l from-amber-50 to-white">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center">
                <AlertTriangle size={16} className="text-amber-600" />
              </div>
              <div>
                <h4 className="font-extrabold text-on-surface text-sm">تنبيهات المخزون</h4>
                <p className="text-[11px] text-on-surface-variant">{outOfStockItems.length} نفذت + {lowStockItems.length} منخفضة</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('inventory')}
              className="flex items-center gap-1 text-xs text-primary font-bold hover:underline px-3 py-1.5 rounded-lg hover:bg-primary-fixed/30 transition-colors"
            >
              عرض الكل <ChevronLeft size={13} />
            </button>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {outOfStockItems.slice(0, 6).map(item => (
              <AlertItem key={item.id} item={item} type="out" onClick={() => onNavigate('inventory')} />
            ))}
            {lowStockItems.slice(0, 6 - Math.min(6, outOfStockItems.length)).map(item => (
              <AlertItem key={item.id} item={item} type="low" onClick={() => onNavigate('inventory')} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function QuickLink({
  icon, label, sub, color, hoverColor, onClick
}: {
  icon: React.ReactNode; label: string; sub: string;
  color: string; hoverColor: string; onClick: () => void;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.01, x: -3 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        'w-full rounded-xl p-3.5 border border-surface-container-high shadow-sm transition-all flex items-center justify-between text-right bg-white',
        hoverColor
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', color)}>
          {icon}
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-on-surface">{label}</p>
          <p className="text-[11px] text-on-surface-variant">{sub}</p>
        </div>
      </div>
      <ChevronLeft size={15} className="text-on-surface-variant/30 flex-shrink-0" />
    </motion.button>
  );
}

function AlertItem({ item, type, onClick }: { item: InventoryItem; type: 'low' | 'out'; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 p-3 rounded-xl border cursor-pointer hover:shadow-sm transition-all',
        type === 'out'
          ? 'bg-red-50 border-red-200 hover:border-red-300'
          : 'bg-amber-50 border-amber-200 hover:border-amber-300'
      )}
    >
      <div className={cn(
        'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
        type === 'out' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
      )}>
        {type === 'out' ? <XCircle size={15} /> : <AlertTriangle size={15} />}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-bold text-on-surface truncate">{item.name}</p>
        <p className={cn('text-[11px] font-medium', type === 'out' ? 'text-red-600' : 'text-amber-600')}>
          {type === 'out' ? 'نفذ المخزون' : `متبقي: ${item.quantity} وحدة`}
        </p>
      </div>
    </div>
  );
}
