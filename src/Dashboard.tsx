import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, Layers, ShoppingCart, XCircle, RefreshCw } from 'lucide-react';
import { useDashboard } from './hooks/useApi';
import { KPICard } from './components/ui';
import { WelcomeBanner, QuickLinks, RecentActivity, StockAlerts } from './components/dashboard';

interface Props {
  onNavigate: (page: string) => void;
}

function SkeletonLoader({ className }: { className: string }) {
  return <div className={`animate-pulse bg-surface-container-low rounded ${className}`} />;
}

export default function Dashboard({ onNavigate }: Props) {
  const { dashboard, loading, error, refetch } = useDashboard();

  const totalInventoryValue = dashboard?.inventory_value || 0;
  const totalSales = dashboard?.sales_today || 0;
  const totalPurchases = dashboard?.purchases_today || 0;
  const grossProfit = totalSales - totalPurchases;
  const profitMargin = totalSales > 0 ? Math.round((grossProfit / totalSales) * 100) : 0;

  const lowStockItems = dashboard?.low_stock_items || [];
  const outOfStockItems = dashboard?.out_of_stock_items || [];
  const recentActivity = dashboard?.recent_activity || [];

  if (loading) {
    return (
      <div className="p-4 lg:p-6 space-y-5">
        <SkeletonLoader className="h-32 rounded-2xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonLoader key={i} className="h-24 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="space-y-3">
            <SkeletonLoader className="h-6 w-32" />
            {Array.from({ length: 4 }).map((_, i) => <SkeletonLoader key={i} className="h-16 rounded-xl" />)}
          </div>
          <div className="lg:col-span-2"><SkeletonLoader className="h-80 rounded-2xl" /></div>
        </div>
      </div>
    );
  }

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
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors mx-auto"
          >
            <RefreshCw size={16} />إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <WelcomeBanner onRefresh={refetch} loading={loading} />

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <QuickLinks
          inventoryCount={dashboard?.inventory_count || 0}
          salesCount={dashboard?.sales_count_today || 0}
          salesTotal={totalSales}
          purchasesCount={dashboard?.purchases_count_today || 0}
          purchasesTotal={totalPurchases}
          onNavigate={onNavigate}
        />
        <RecentActivity activities={recentActivity} onNavigate={onNavigate} />
      </div>

      <StockAlerts
        lowStockItems={lowStockItems}
        outOfStockItems={outOfStockItems}
        onNavigate={onNavigate}
      />
    </div>
  );
}
