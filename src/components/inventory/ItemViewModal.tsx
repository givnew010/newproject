import React from 'react';
import { Package, X, Edit2, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button, Badge } from '../ui';
import type { InventoryItem } from '../../types';

interface ItemViewModalProps {
  item: InventoryItem | null;
  onClose: () => void;
  onEdit: (item: InventoryItem) => void;
  onDelete: (id: string) => void;
}

interface DetailRowProps {
  label: string;
  value: string;
  mono?: boolean;
}

function DetailRow({ label, value, mono }: DetailRowProps) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-surface-container-low last:border-0">
      <span className="text-xs text-on-surface-variant">{label}</span>
      <span className={`text-sm font-bold text-on-surface ${mono ? 'font-mono' : ''}`}>
        {value}
      </span>
    </div>
  );
}

export function ItemViewModal({ item, onClose, onEdit, onDelete }: ItemViewModalProps) {
  if (!item) return null;

  const details: DetailRowProps[] = [
    { label: 'الرمز (SKU)', value: item.sku, mono: true },
    { label: 'الباركود', value: item.barcode || '—', mono: true },
    { label: 'الكمية المتاحة', value: `${item.quantity || 0} وحدة` },
    { label: 'سعر الوحدة', value: `${(item.selling_price || 0).toLocaleString('ar-SA')} ر.س` },
    {
      label: 'القيمة الإجمالية',
      value: `${((item.selling_price || 0) * (item.quantity || 0)).toLocaleString('ar-SA')} ر.س`,
    },
  ];

  return (
    <AnimatePresence>
      {item && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative z-[70] w-full max-w-sm bg-white shadow-2xl rounded-3xl overflow-hidden"
          >
            <div className="bg-gradient-to-l from-primary-fixed to-white px-5 py-5 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center">
                  <Package size={24} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-on-surface text-base leading-tight">{item.name}</h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">{item.category}</p>
                  <div className="mt-1.5">
                    {item.status === 'in-stock' && (
                      <Badge variant="in-stock">
                        <span className="w-1.5 h-1.5 bg-success rounded-full inline-block ml-1" />
                        متوفر
                      </Badge>
                    )}
                    {item.status === 'low-stock' && (
                      <Badge variant="low-stock">
                        <span className="w-1.5 h-1.5 bg-warning rounded-full inline-block ml-1" />
                        منخفض
                      </Badge>
                    )}
                    {item.status === 'out-of-stock' && (
                      <Badge variant="out-of-stock">
                        <span className="w-1.5 h-1.5 bg-error rounded-full inline-block ml-1" />
                        نفذ
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-black/5 rounded-xl transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-0">
              {details.map((d) => (
                <DetailRow key={d.label} {...d} />
              ))}
              {item.notes && (
                <div className="bg-surface-container-low rounded-xl p-3 mt-3">
                  <p className="text-xs text-on-surface-variant font-medium mb-1">ملاحظات</p>
                  <p className="text-sm text-on-surface">{item.notes}</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-surface-container-low flex gap-2">
              <Button
                variant="primary"
                className="flex-1 justify-center py-2.5 text-sm"
                onClick={() => { onClose(); onEdit(item); }}
              >
                <Edit2 size={15} />
                تعديل
              </Button>
              <Button
                variant="outline"
                className="px-4 py-2.5 border-red-200 text-red-600 hover:bg-red-50 font-bold text-sm"
                onClick={() => { onDelete(item.id); onClose(); }}
              >
                <Trash2 size={15} />
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default ItemViewModal;
