import React from 'react';
import { Package, ShoppingBag, ShoppingCart, BarChart3, ChevronLeft, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface QuickLinkItem {
  icon: React.ReactNode;
  label: string;
  sub: string;
  color: string;
  hoverColor: string;
  page: string;
}

interface QuickLinksProps {
  inventoryCount: number;
  salesCount: number;
  salesTotal: number;
  purchasesCount: number;
  purchasesTotal: number;
  onNavigate: (page: string) => void;
}

function QuickLinkCard({ icon, label, sub, color, hoverColor, onClick }: {
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

export function QuickLinks({ inventoryCount, salesCount, salesTotal, purchasesCount, purchasesTotal, onNavigate }: QuickLinksProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Zap size={15} className="text-primary" />
        <h4 className="text-sm font-extrabold text-on-surface">اختصارات سريعة</h4>
      </div>
      <QuickLinkCard
        icon={<Package size={18} />}
        label="إدارة الأصناف"
        sub={`${inventoryCount} صنف في المخزون`}
        color="bg-blue-50 text-blue-700"
        hoverColor="hover:bg-blue-100"
        onClick={() => onNavigate('inventory')}
      />
      <QuickLinkCard
        icon={<ShoppingBag size={18} />}
        label="فواتير المبيعات"
        sub={`${salesCount} فاتورة – ${salesTotal.toLocaleString('ar-SA')} ر.س`}
        color="bg-emerald-50 text-emerald-700"
        hoverColor="hover:bg-emerald-100"
        onClick={() => onNavigate('sales')}
      />
      <QuickLinkCard
        icon={<ShoppingCart size={18} />}
        label="فواتير المشتريات"
        sub={`${purchasesCount} فاتورة – ${purchasesTotal.toLocaleString('ar-SA')} ر.س`}
        color="bg-violet-50 text-violet-700"
        hoverColor="hover:bg-violet-100"
        onClick={() => onNavigate('purchases')}
      />
      <QuickLinkCard
        icon={<BarChart3 size={18} />}
        label="التقارير والتحليلات"
        sub="ملخص مالي شامل وتفصيلي"
        color="bg-amber-50 text-amber-700"
        hoverColor="hover:bg-amber-100"
        onClick={() => onNavigate('reports')}
      />
    </div>
  );
}

export default QuickLinks;
