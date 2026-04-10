import React from 'react';
import { BarChart3, Package, Users, ShoppingCart } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

export type ReportTab = 'overview' | 'inventory' | 'receivables' | 'payables';

interface ReportsTabsProps {
  active: ReportTab;
  onChange: (tab: ReportTab) => void;
}

const TABS: { id: ReportTab; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'نظرة عامة', icon: <BarChart3 size={15} /> },
  { id: 'inventory', label: 'تقرير المخزون', icon: <Package size={15} /> },
  { id: 'receivables', label: 'المستحقات', icon: <Users size={15} /> },
  { id: 'payables', label: 'الدائنون', icon: <ShoppingCart size={15} /> },
];

export function ReportsTabs({ active, onChange }: ReportsTabsProps) {
  return (
    <div className="flex gap-1 bg-surface-container-low rounded-2xl p-1.5 overflow-x-auto">
      {TABS.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all',
            active === tab.id
              ? 'bg-white text-primary shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-white/50'
          )}
        >
          {tab.icon}{tab.label}
        </button>
      ))}
    </div>
  );
}

export default ReportsTabs;
