import React from 'react';
import { Layers, TrendingUp, AlertTriangle, XCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { KPICard } from '../ui';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { ItemStatus } from '../../types';

function cn(...inputs: Parameters<typeof clsx>) {
  return twMerge(clsx(...inputs));
}

interface InventoryStatsRowProps {
  total: number;
  totalValue: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
  filterStatus: 'all' | ItemStatus;
  onFilterChange: (status: 'all' | ItemStatus) => void;
}

interface StatConfig {
  key: 'all' | ItemStatus;
  label: string;
  value: number;
  sub: string;
  icon: React.ReactNode;
  gradient: 'blue' | 'emerald' | 'amber' | 'red';
  clickable: boolean;
}

export function InventoryStatsRow({
  total,
  totalValue,
  inStock,
  lowStock,
  outOfStock,
  filterStatus,
  onFilterChange,
}: InventoryStatsRowProps) {
  const stats: StatConfig[] = [
    {
      key: 'all',
      label: 'إجمالي الأصناف',
      value: total,
      sub: `${totalValue.toLocaleString('ar-SA')} ر.س`,
      icon: <Layers size={20} />,
      gradient: 'blue',
      clickable: false,
    },
    {
      key: 'in-stock',
      label: 'متوفر',
      value: inStock,
      sub: `${Math.round((inStock / (total || 1)) * 100)}% من الأصناف`,
      icon: <TrendingUp size={20} />,
      gradient: 'emerald',
      clickable: true,
    },
    {
      key: 'low-stock',
      label: 'كمية منخفضة',
      value: lowStock,
      sub: 'تحتاج إعادة طلب',
      icon: <AlertTriangle size={20} />,
      gradient: 'amber',
      clickable: true,
    },
    {
      key: 'out-of-stock',
      label: 'نفذ المخزون',
      value: outOfStock,
      sub: 'غير متوفر حالياً',
      icon: <XCircle size={20} />,
      gradient: 'red',
      clickable: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((stat) => {
        const isActive = stat.clickable && filterStatus === stat.key;
        const handleClick = stat.clickable
          ? () => onFilterChange(filterStatus === stat.key ? 'all' : stat.key)
          : undefined;

        return (
          <motion.div
            key={stat.key}
            whileHover={stat.clickable ? { scale: 1.02, y: -2 } : {}}
            whileTap={stat.clickable ? { scale: 0.98 } : {}}
            onClick={handleClick}
            className={cn(stat.clickable && 'cursor-pointer')}
          >
            <KPICard
              title={stat.label}
              value={stat.value.toString()}
              subtitle={stat.sub}
              icon={stat.icon}
              gradient={stat.gradient}
              onClick={handleClick}
              className={cn(isActive && 'ring-2 ring-primary shadow-md')}
            />
          </motion.div>
        );
      })}
    </div>
  );
}

export default InventoryStatsRow;
