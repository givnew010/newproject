import React from 'react';
import {
  Package, Edit2, Trash2, SortAsc, SortDesc, ArrowUpDown,
} from 'lucide-react';
import { motion } from 'motion/react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Badge } from '../ui';
import type { InventoryItem } from '../../types';
import type { SortKey, SortOrder } from './InventoryToolbar';

function cn(...inputs: Parameters<typeof clsx>) {
  return twMerge(clsx(...inputs));
}

interface InventoryTableProps {
  items: InventoryItem[];
  totalCount: number;
  sortBy: SortKey;
  sortOrder: SortOrder;
  searchQuery: string;
  filterStatus: string;
  onSortChange: (key: SortKey, order: SortOrder) => void;
  onRowClick: (item: InventoryItem) => void;
  onEdit: (item: InventoryItem) => void;
  onDelete: (id: string) => void;
  onClearFilters: () => void;
}

function SortButton({
  column,
  label,
  sortBy,
  sortOrder,
  onSort,
}: {
  column: SortKey;
  label: string;
  sortBy: SortKey;
  sortOrder: SortOrder;
  onSort: (key: SortKey, order: SortOrder) => void;
}) {
  const isActive = sortBy === column;
  return (
    <button
      onClick={() => onSort(column, isActive ? (sortOrder === 'asc' ? 'desc' : 'asc') : 'asc')}
      className="flex items-center gap-1 hover:text-primary transition-colors"
    >
      {label}
      {isActive
        ? (sortOrder === 'asc' ? <SortAsc size={13} /> : <SortDesc size={13} />)
        : <ArrowUpDown size={11} className="opacity-40" />}
    </button>
  );
}

function EmptyState({
  hasFilters,
  onClearFilters,
}: {
  hasFilters: boolean;
  onClearFilters: () => void;
}) {
  return (
    <tr>
      <td colSpan={6} className="px-5 py-20 text-center">
        <div className="flex flex-col items-center gap-3 text-on-surface-variant">
          <div className="w-16 h-16 rounded-2xl bg-surface-container-low flex items-center justify-center">
            <Package size={32} className="opacity-30" />
          </div>
          <p className="text-sm font-medium">لا توجد أصناف مطابقة</p>
          {hasFilters && (
            <button
              onClick={onClearFilters}
              className="text-xs text-primary hover:underline font-bold"
            >
              مسح الفلاتر
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

function QuantityCell({ quantity }: { quantity: number }) {
  const colorClass = quantity === 0
    ? 'text-error'
    : quantity <= 5
    ? 'text-warning'
    : 'text-on-surface';

  return (
    <td className="px-5 py-3.5 hidden sm:table-cell">
      <span className={cn('text-sm font-bold font-mono', colorClass)}>
        {quantity.toLocaleString('ar-SA')}
      </span>
      <span className="text-xs text-on-surface-variant mr-1">وحدة</span>
    </td>
  );
}

function StatusCell({ status }: { status: InventoryItem['status'] }) {
  return (
    <td className="px-5 py-3.5">
      {status === 'in-stock' && (
        <Badge variant="in-stock">
          <span className="w-1.5 h-1.5 bg-success rounded-full inline-block ml-1" />
          متوفر
        </Badge>
      )}
      {status === 'low-stock' && (
        <Badge variant="low-stock">
          <span className="w-1.5 h-1.5 bg-warning rounded-full inline-block ml-1" />
          منخفض
        </Badge>
      )}
      {status === 'out-of-stock' && (
        <Badge variant="out-of-stock">
          <span className="w-1.5 h-1.5 bg-error rounded-full inline-block ml-1" />
          نفذ
        </Badge>
      )}
    </td>
  );
}

export function InventoryTable({
  items,
  totalCount,
  sortBy,
  sortOrder,
  searchQuery,
  filterStatus,
  onSortChange,
  onRowClick,
  onEdit,
  onDelete,
  onClearFilters,
}: InventoryTableProps) {
  const hasFilters = searchQuery.trim() !== '' || filterStatus !== 'all';

  return (
    <div className="bg-white rounded-2xl border border-surface-container-high shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-surface-container-low/80 border-b border-surface-container-high text-right">
              <th className="px-5 py-3.5 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                الصنف
              </th>
              <th className="px-5 py-3.5 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider hidden md:table-cell">
                الرمز (SKU)
              </th>
              <th className="px-5 py-3.5 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider hidden sm:table-cell">
                <SortButton
                  column="quantity"
                  label="الكمية"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={onSortChange}
                />
              </th>
              <th className="px-5 py-3.5 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                <SortButton
                  column="selling_price"
                  label="السعر"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={onSortChange}
                />
              </th>
              <th className="px-5 py-3.5 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                الحالة
              </th>
              <th className="px-5 py-3.5 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider text-left">
                إجراءات
              </th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <EmptyState hasFilters={hasFilters} onClearFilters={onClearFilters} />
            ) : (
              items.map((item, idx) => (
                <motion.tr
                  key={item.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.03 }}
                  className="border-b border-surface-container-low last:border-0 hover:bg-surface-container-low/40 transition-colors cursor-pointer"
                  onClick={() => onRowClick(item)}
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-primary-fixed flex items-center justify-center flex-shrink-0">
                        <Package size={16} className="text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-on-surface truncate">{item.name}</p>
                        <p className="text-[11px] text-on-surface-variant truncate">{item.category}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    <span className="text-xs font-mono bg-surface-container-low px-2 py-1 rounded-lg text-on-surface-variant font-medium">
                      {item.sku}
                    </span>
                  </td>
                  <QuantityCell quantity={item.quantity || 0} />
                  <td className="px-5 py-3.5">
                    <span className="text-sm font-bold text-on-surface font-mono">
                      {(item.selling_price || 0).toLocaleString('ar-SA')}
                    </span>
                    <span className="text-xs text-on-surface-variant mr-1">ر.س</span>
                  </td>
                  <StatusCell status={item.status} />
                  <td className="px-5 py-3.5 text-left">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={(e) => { e.stopPropagation(); onEdit(item); }}
                        className="p-2 rounded-xl text-on-surface-variant/50 hover:text-primary hover:bg-primary-fixed/50 transition-all"
                        title="تعديل"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                        className="p-2 rounded-xl text-on-surface-variant/50 hover:text-red-600 hover:bg-red-50 transition-all"
                        title="حذف"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {items.length > 0 && (
        <div className="px-5 py-3.5 bg-surface-container-low/50 border-t border-surface-container-high flex items-center justify-between">
          <span className="text-xs text-on-surface-variant font-medium">
            {items.length} صنف من أصل {totalCount}
          </span>
        </div>
      )}
    </div>
  );
}

export default InventoryTable;
