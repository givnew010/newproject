import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, Package, Users, ShoppingCart } from 'lucide-react';
import { motion } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

interface OverviewTabProps {
  data: {
    salesTotal: number;
    purchasesTotal: number;
    netProfit: number;
    inventoryValue: number;
    totalCustomers: number;
    totalSuppliers: number;
    salesCount: number;
    purchasesCount: number;
  };
}

function KpiCard({ icon, iconBg, iconText, label, value, sub, trend }: {
  icon: React.ReactNode; iconBg: string; iconText: string;
  label: string; value: string; sub?: string; trend?: 'up' | 'down';
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-5 border border-surface-container-high shadow-sm"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center', iconBg)}>
          <span className={iconText}>{icon}</span>
        </div>
        {trend && (
          <span className={cn('text-xs font-bold flex items-center gap-1', trend === 'up' ? 'text-success' : 'text-error')}>
            {trend === 'up' ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
          </span>
        )}
      </div>
      <p className="text-2xl font-extrabold text-on-surface">{value}</p>
      <p className="text-xs font-bold text-on-surface-variant mt-1">{label}</p>
      {sub && <p className="text-[11px] text-on-surface-variant/60 mt-0.5">{sub}</p>}
    </motion.div>
  );
}

export function OverviewTab({ data }: OverviewTabProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <KpiCard
        icon={<TrendingUp size={22} />} iconBg="bg-emerald-100" iconText="text-emerald-600"
        label="إجمالي المبيعات" value={`${data.salesTotal.toLocaleString('ar-SA')} ر.س`}
        sub={`${data.salesCount} فاتورة`} trend="up"
      />
      <KpiCard
        icon={<TrendingDown size={22} />} iconBg="bg-violet-100" iconText="text-violet-600"
        label="إجمالي المشتريات" value={`${data.purchasesTotal.toLocaleString('ar-SA')} ر.س`}
        sub={`${data.purchasesCount} فاتورة`}
      />
      <KpiCard
        icon={<DollarSign size={22} />} iconBg={data.netProfit >= 0 ? 'bg-blue-100' : 'bg-red-100'} iconText={data.netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}
        label="صافي الربح" value={`${data.netProfit.toLocaleString('ar-SA')} ر.س`}
        trend={data.netProfit >= 0 ? 'up' : 'down'}
      />
      <KpiCard
        icon={<Package size={22} />} iconBg="bg-amber-100" iconText="text-amber-600"
        label="قيمة المخزون" value={`${data.inventoryValue.toLocaleString('ar-SA')} ر.س`}
      />
      <KpiCard
        icon={<Users size={22} />} iconBg="bg-cyan-100" iconText="text-cyan-600"
        label="العملاء" value={data.totalCustomers.toString()}
      />
      <KpiCard
        icon={<ShoppingCart size={22} />} iconBg="bg-pink-100" iconText="text-pink-600"
        label="الموردون" value={data.totalSuppliers.toString()}
      />
    </div>
  );
}

export default OverviewTab;
