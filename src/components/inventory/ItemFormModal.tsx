import React from 'react';
import { X, TrendingUp, AlertTriangle, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Button, Input } from '../ui';
import type { InventoryItem } from '../../types';

function cn(...inputs: Parameters<typeof clsx>) {
  return twMerge(clsx(...inputs));
}

export type ItemFormData = Partial<InventoryItem>;

interface ItemFormModalProps {
  isOpen: boolean;
  isEditing: boolean;
  formData: ItemFormData;
  isSaving: boolean;
  onChange: (data: ItemFormData) => void;
  onSave: () => void;
  onClose: () => void;
}

interface FormFieldProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  colSpan?: boolean;
}

function FormField({ label, required, children, colSpan }: FormFieldProps) {
  return (
    <div className={cn('space-y-1.5', colSpan && 'sm:col-span-2')}>
      <label className="text-xs font-bold text-on-surface-variant">
        {label}
        {required && <span className="text-error mr-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function StockStatusHint({ quantity }: { quantity: number | undefined }) {
  if (quantity === undefined || quantity === null) return null;

  const qty = Number(quantity);
  if (qty === 0) {
    return (
      <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-medium border bg-red-50 text-red-700 border-red-200">
        <XCircle size={14} />
        الصنف سيُصنَّف كـ "نفذ المخزون"
      </div>
    );
  }
  if (qty <= 5) {
    return (
      <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-medium border bg-amber-50 text-amber-700 border-amber-200">
        <AlertTriangle size={14} />
        الصنف سيُصنَّف كـ "كمية منخفضة"
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-medium border bg-emerald-50 text-emerald-700 border-emerald-200">
      <TrendingUp size={14} />
      الصنف سيُصنَّف كـ "متوفر"
    </div>
  );
}

export function ItemFormModal({
  isOpen,
  isEditing,
  formData,
  isSaving,
  onChange,
  onSave,
  onClose,
}: ItemFormModalProps) {
  const isValid = !!(formData.name?.trim() && formData.sku?.trim());

  const set = (field: keyof ItemFormData, value: unknown) =>
    onChange({ ...formData, [field]: value });

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
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
            className="relative z-[70] w-full max-w-lg bg-white shadow-2xl rounded-3xl overflow-hidden flex flex-col max-h-[92vh]"
          >
            <div className="px-6 py-5 border-b border-surface-container-low bg-gradient-to-l from-primary-fixed/50 to-white flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="text-base font-extrabold text-on-surface">
                  {isEditing ? 'تعديل الصنف' : 'إضافة صنف جديد'}
                </h2>
                <p className="text-[11px] text-on-surface-variant mt-0.5">
                  أدخل بيانات الصنف بدقة
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-surface-container-low rounded-xl transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="اسم الصنف" required colSpan>
                  <Input
                    type="text"
                    placeholder="أدخل اسم الصنف"
                    value={formData.name || ''}
                    onChange={(e) => set('name', e.target.value)}
                  />
                </FormField>

                <FormField label="الرمز (SKU)" required>
                  <Input
                    type="text"
                    placeholder="مثال: PROD-001"
                    value={formData.sku || ''}
                    onChange={(e) => set('sku', e.target.value)}
                    className="font-mono"
                  />
                </FormField>

                <FormField label="التصنيف">
                  <Input
                    type="text"
                    placeholder="مثال: إلكترونيات"
                    value={formData.category || ''}
                    onChange={(e) => set('category', e.target.value)}
                  />
                </FormField>

                <FormField label="الكمية">
                  <Input
                    type="number"
                    min={0}
                    value={formData.quantity ?? 0}
                    onChange={(e) => set('quantity', Number(e.target.value))}
                  />
                </FormField>

                <FormField label="سعر البيع (ر.س)">
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={formData.selling_price ?? 0}
                    onChange={(e) => set('selling_price', Number(e.target.value))}
                  />
                </FormField>

                <FormField label="الباركود" colSpan>
                  <Input
                    type="text"
                    placeholder="أدخل رقم الباركود"
                    value={formData.barcode || ''}
                    onChange={(e) => set('barcode', e.target.value)}
                    className="font-mono"
                  />
                </FormField>

                <FormField label="ملاحظات" colSpan>
                  <textarea
                    rows={3}
                    placeholder="أي ملاحظات إضافية..."
                    value={formData.notes || ''}
                    onChange={(e) => set('notes', e.target.value)}
                    className="input-field resize-none w-full"
                  />
                </FormField>
              </div>

              <StockStatusHint quantity={formData.quantity} />
            </div>

            <div className="p-5 border-t border-surface-container-low flex-shrink-0 flex gap-3">
              <Button
                variant="outline"
                className="flex-1 py-3"
                onClick={onClose}
              >
                إلغاء
              </Button>
              <Button
                variant="primary"
                className="flex-1 py-3"
                disabled={!isValid || isSaving}
                onClick={onSave}
              >
                {isSaving
                  ? 'جاري الحفظ...'
                  : isEditing
                  ? 'حفظ التعديلات'
                  : 'إضافة الصنف'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default ItemFormModal;
