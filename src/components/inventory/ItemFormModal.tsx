import React from 'react';
import { X } from 'lucide-react';
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
  // pass a static Tailwind span class like "sm:col-span-2" or "sm:col-span-4"
  colSpanClass?: string;
}

function FormField({ label, required, children, colSpanClass }: FormFieldProps) {
  return (
    <div className={cn('space-y-1.5', colSpanClass)}>
      <label className="text-xs font-bold text-on-surface-variant">
        {label}
        {required && <span className="text-error mr-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

// Stock status hint removed per design request

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
            className="relative z-[70] w-full max-w-2xl bg-white shadow-2xl rounded-3xl overflow-hidden flex flex-col max-h-[92vh]"
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
              <div className="space-y-4">
                {/* Row 1: name (2 cols) | SKU | Barcode */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <FormField label="اسم الصنف" required colSpanClass="sm:col-span-2">
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

                  <FormField label="الباركود">
                    <Input
                      type="text"
                      placeholder="أدخل رقم الباركود"
                      value={formData.barcode || ''}
                      onChange={(e) => set('barcode', e.target.value)}
                      className="font-mono"
                    />
                  </FormField>
                </div>

                {/* Row 2: expiry, unit, category (equal widths) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormField label="تاريخ انتهاء الصنف">
                    <Input
                      type="date"
                      value={formData.expiry_date || ''}
                      onChange={(e) => set('expiry_date', e.target.value)}
                    />
                  </FormField>

                  <FormField label="وحدة الصنف">
                    <Input
                      type="text"
                      placeholder="مثال: pcs"
                      value={formData.unit || ''}
                      onChange={(e) => set('unit', e.target.value)}
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
                </div>

                {/* Row 3: quantity, cost_price, selling_price (equal widths) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormField label="الكمية">
                    <Input
                      type="number"
                      min={0}
                      value={formData.quantity ?? 0}
                      onChange={(e) => set('quantity', Number(e.target.value))}
                    />
                  </FormField>

                  <FormField label="سعر الشراء (ر.س)">
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={formData.cost_price ?? 0}
                      onChange={(e) => set('cost_price', Number(e.target.value))}
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
                </div>

                {/* Notes (full width) */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <FormField label="ملاحظات" colSpanClass="sm:col-span-4">
                    <textarea
                      rows={3}
                      placeholder="أي ملاحظات إضافية..."
                      value={formData.notes || ''}
                      onChange={(e) => set('notes', e.target.value)}
                      className="input-field resize-none w-full"
                    />
                  </FormField>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-surface-container-low flex items-center justify-end gap-3">
              <Button onClick={onClose} variant="secondary">إلغاء</Button>
              <Button onClick={onSave} variant="primary" disabled={!isValid || isSaving}>
                {isSaving ? 'جاري الحفظ...' : isEditing ? 'حفظ التعديلات' : 'إضافة الصنف'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default ItemFormModal;
