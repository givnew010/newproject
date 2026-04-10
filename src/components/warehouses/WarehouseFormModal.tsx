import React from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../ui';

export interface WarehouseFormState {
  name: string;
  location: string;
  capacity: string;
  is_active: boolean;
}

interface WarehouseFormModalProps {
  isEditing: boolean;
  form: WarehouseFormState;
  setForm: (f: WarehouseFormState) => void;
  onSave: () => void;
  onClose: () => void;
  isSaving?: boolean;
}

export function WarehouseFormModal({ isEditing, form, setForm, onSave, onClose, isSaving }: WarehouseFormModalProps) {
  const title = isEditing ? 'تعديل المستودع' : 'إضافة مستودع جديد';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ type: 'spring', damping: 25 }}
          className="relative z-[70] w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
        >
          <div className="p-4 border-b border-surface-container-low flex items-center justify-between">
            <h3 className="font-extrabold text-on-surface">{title}</h3>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-surface-container-low">
              <X size={16} />
            </button>
          </div>

          <div className="p-5 space-y-3">
            <div>
              <label className="text-xs font-bold text-on-surface-variant mb-1 block">اسم المستودع *</label>
              <input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="مثال: المستودع الرئيسي"
                className="w-full border border-surface-container-high rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-on-surface-variant mb-1 block">الموقع</label>
              <input
                value={form.location}
                onChange={e => setForm({ ...form, location: e.target.value })}
                placeholder="مثال: الرياض، حي العليا"
                className="w-full border border-surface-container-high rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-on-surface-variant mb-1 block">السعة التخزينية</label>
              <input
                type="number"
                value={form.capacity}
                onChange={e => setForm({ ...form, capacity: e.target.value })}
                placeholder="عدد الوحدات القصوى"
                className="w-full border border-surface-container-high rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>
            <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container-low cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={e => setForm({ ...form, is_active: e.target.checked })}
                className="w-4 h-4 rounded text-primary"
              />
              <span className="text-sm text-on-surface">مستودع نشط</span>
            </label>
          </div>

          <div className="p-4 border-t border-surface-container-low flex items-center justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>إلغاء</Button>
            <Button variant="primary" onClick={onSave} disabled={!form.name.trim() || isSaving}>
              {isEditing ? 'حفظ التعديلات' : 'إضافة المستودع'}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default WarehouseFormModal;
