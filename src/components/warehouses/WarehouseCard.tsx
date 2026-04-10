import React from 'react';
import { Building2, MapPin, Package, Edit2, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Badge } from '../ui';

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

export interface WarehouseItem {
  id: number;
  name: string;
  location?: string | null;
  capacity?: number | null;
  is_active: number;
  total_items?: number;
}

interface WarehouseCardProps {
  warehouse: WarehouseItem;
  index: number;
  onEdit: (w: WarehouseItem) => void;
  onDelete: (id: number) => void;
}

const BG_COLORS = ['from-blue-500 to-blue-700','from-emerald-500 to-emerald-700','from-violet-500 to-violet-700','from-amber-500 to-amber-700','from-pink-500 to-pink-700','from-cyan-500 to-cyan-700'];

export function WarehouseCard({ warehouse, index, onEdit, onDelete }: WarehouseCardProps) {
  const gradient = BG_COLORS[index % BG_COLORS.length];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.06 }}
      className="bg-white rounded-2xl border border-surface-container-high shadow-sm overflow-hidden group hover:shadow-md transition-all"
    >
      <div className={cn('h-24 bg-gradient-to-l flex items-end p-4', gradient)}>
        <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center">
          <Building2 size={22} className="text-white" />
        </div>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-extrabold text-on-surface">{warehouse.name}</h3>
            {warehouse.location && (
              <div className="flex items-center gap-1 text-[11px] text-on-surface-variant mt-0.5">
                <MapPin size={11} /><span>{warehouse.location}</span>
              </div>
            )}
          </div>
          {warehouse.is_active ? <Badge variant="in-stock">نشط</Badge> : <Badge variant="slate">غير نشط</Badge>}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {warehouse.capacity != null && (
            <div className="bg-surface-container-low rounded-xl p-2.5 text-center">
              <p className="text-sm font-extrabold text-on-surface">{warehouse.capacity.toLocaleString('ar-SA')}</p>
              <p className="text-[10px] text-on-surface-variant">السعة</p>
            </div>
          )}
          <div className="bg-surface-container-low rounded-xl p-2.5 text-center">
            <div className="flex items-center justify-center gap-1">
              <Package size={12} className="text-on-surface-variant" />
              <p className="text-sm font-extrabold text-on-surface">{warehouse.total_items ?? 0}</p>
            </div>
            <p className="text-[10px] text-on-surface-variant">الأصناف</p>
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            onClick={() => onEdit(warehouse)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors"
          >
            <Edit2 size={13} />تعديل
          </button>
          <button
            onClick={() => onDelete(warehouse.id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-error/10 text-error text-xs font-bold hover:bg-error/20 transition-colors"
          >
            <Trash2 size={13} />حذف
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default WarehouseCard;
