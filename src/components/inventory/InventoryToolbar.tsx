import React from 'react';
import {
  Filter, Download, Plus, X,
  ChevronDown, SortAsc, SortDesc, ArrowUpDown,
  Layers, TrendingUp, AlertTriangle, XCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Button } from '../ui';
import type { ItemStatus } from '../../types';

function cn(...inputs: Parameters<typeof clsx>) {
  return twMerge(clsx(...inputs));
}

export type SortKey = 'name' | 'quantity' | 'selling_price';
export type SortOrder = 'asc' | 'desc';

interface InventoryToolbarProps {
  searchQuery: string;
  filterStatus: 'all' | ItemStatus;
  sortBy: SortKey;
  sortOrder: SortOrder;
  onClearFilters: () => void;
  onFilterChange: (status: 'all' | ItemStatus) => void;
  onSortChange: (key: SortKey, order: SortOrder) => void;
  onAdd: () => void;
}

const FILTER_OPTIONS: { key: 'all' | ItemStatus; label: string; icon: React.ReactNode }[] = [
  { key: 'all', label: 'الكل', icon: <Layers size={14} /> },
  { key: 'in-stock', label: 'متوفر', icon: <TrendingUp size={14} className="text-success" /> },
  { key: 'low-stock', label: 'كمية منخفضة', icon: <AlertTriangle size={14} className="text-warning" /> },
  { key: 'out-of-stock', label: 'نفذ المخزون', icon: <XCircle size={14} className="text-error" /> },
];

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'name', label: 'الاسم' },
  { key: 'quantity', label: 'الكمية' },
  { key: 'selling_price', label: 'السعر' },
];

function DropdownMenu({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -6, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.97 }}
          className="absolute top-full mt-2 right-0 bg-white rounded-2xl shadow-xl border border-surface-container-high z-20 min-w-[180px] overflow-hidden py-1"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function InventoryToolbar({
  searchQuery,
  filterStatus,
  sortBy,
  sortOrder,
  onClearFilters,
  onFilterChange,
  onSortChange,
  onAdd,
}: InventoryToolbarProps) {
  const [isFilterOpen, setIsFilterOpen] = React.useState(false);
  const [isSortOpen, setIsSortOpen] = React.useState(false);

  const hasActiveFilters = searchQuery.trim() !== '' || filterStatus !== 'all';

  const handleSortClick = (key: SortKey) => {
    if (sortBy === key) {
      onSortChange(key, sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      onSortChange(key, 'asc');
    }
    setIsSortOpen(false);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative">
          <button
            onClick={() => { setIsFilterOpen(v => !v); setIsSortOpen(false); }}
            className="bg-white px-4 py-2 rounded-xl text-sm font-medium text-on-surface-variant flex items-center gap-2 border border-surface-container-high hover:bg-surface-container-low transition-all shadow-sm"
          >
            <Filter size={15} />
            <span>تصفية</span>
            {filterStatus !== 'all' && (
              <span className="w-2 h-2 rounded-full bg-primary" />
            )}
            <ChevronDown size={13} className={cn('transition-transform', isFilterOpen && 'rotate-180')} />
          </button>
          <DropdownMenu isOpen={isFilterOpen}>
            {FILTER_OPTIONS.map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => { onFilterChange(key); setIsFilterOpen(false); }}
                className={cn(
                  'w-full text-right px-4 py-2.5 text-sm transition-colors flex items-center gap-2',
                  filterStatus === key
                    ? 'bg-primary-fixed text-primary font-bold'
                    : 'hover:bg-surface-container-low text-on-surface'
                )}
              >
                {icon}
                {label}
              </button>
            ))}
          </DropdownMenu>
        </div>

        <div className="relative">
          <button
            onClick={() => { setIsSortOpen(v => !v); setIsFilterOpen(false); }}
            className="bg-white px-4 py-2 rounded-xl text-sm font-medium text-on-surface-variant flex items-center gap-2 border border-surface-container-high hover:bg-surface-container-low transition-all shadow-sm"
          >
            <ArrowUpDown size={15} />
            <span>ترتيب</span>
            <ChevronDown size={13} className={cn('transition-transform', isSortOpen && 'rotate-180')} />
          </button>
          <DropdownMenu isOpen={isSortOpen}>
            {SORT_OPTIONS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => handleSortClick(key)}
                className={cn(
                  'w-full text-right px-4 py-2.5 text-sm transition-colors flex items-center justify-between',
                  sortBy === key
                    ? 'bg-primary-fixed text-primary font-bold'
                    : 'hover:bg-surface-container-low text-on-surface'
                )}
              >
                <span>{label}</span>
                {sortBy === key && (
                  sortOrder === 'asc' ? <SortAsc size={14} /> : <SortDesc size={14} />
                )}
              </button>
            ))}
          </DropdownMenu>
        </div>

        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            className="text-error px-3 py-2 border-red-200 hover:bg-red-50"
            onClick={onClearFilters}
          >
            <X size={12} />
            مسح
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" className="text-xs py-2 px-4">
          <Download size={15} />
          تصدير
        </Button>
        <Button variant="primary" size="sm" className="py-2 px-4" onClick={onAdd}>
          <Plus size={15} />
          إضافة صنف
        </Button>
      </div>
    </div>
  );
}

export default InventoryToolbar;
