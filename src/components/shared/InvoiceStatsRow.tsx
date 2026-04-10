import React from 'react';
import { FileText, TrendingUp, TrendingDown, ShoppingBag, ShoppingCart } from 'lucide-react';
import { KPICard } from '../ui';

interface InvoiceStatsRowProps {
  mode: 'sale' | 'purchase';
  count: number;
  total: number;
  avg: number;
}

export function InvoiceStatsRow({ mode, count, total, avg }: InvoiceStatsRowProps) {
  const isSale = mode === 'sale';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <KPICard
        title={isSale ? 'إجمالي فواتير المبيعات' : 'إجمالي فواتير المشتريات'}
        value={`${count}`}
        subtitle="فاتورة مسجلة"
        icon={<FileText size={18} />}
        gradient={isSale ? 'emerald' : 'purple'}
      />
      <KPICard
        title={isSale ? 'إجمالي الإيرادات' : 'إجمالي التكاليف'}
        value={`${Number(total || 0).toLocaleString('ar-SA')} ر.س`}
        subtitle="ريال سعودي"
        icon={isSale ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
        gradient="blue"
      />
      <KPICard
        title="متوسط قيمة الفاتورة"
        value={`${Number(avg || 0).toLocaleString('ar-SA')} ر.س`}
        subtitle="ريال سعودي"
        icon={isSale ? <ShoppingBag size={18} /> : <ShoppingCart size={18} />}
        gradient={isSale ? 'purple' : 'emerald'}
      />
    </div>
  );
}

export default InvoiceStatsRow;
