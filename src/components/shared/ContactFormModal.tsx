import React from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button, Input } from '../ui';

export interface ContactFormState {
  name: string;
  phone: string;
  email: string;
  address: string;
  credit_limit: number;
}

interface ContactFormModalProps {
  mode: 'customer' | 'supplier';
  isEditing: boolean;
  form: ContactFormState;
  setForm: (f: ContactFormState) => void;
  onSave: () => void;
  onClose: () => void;
  isSaving?: boolean;
}

export function ContactFormModal({ mode, isEditing, form, setForm, onSave, onClose, isSaving }: ContactFormModalProps) {
  const isCustomer = mode === 'customer';
  const title = isEditing
    ? (isCustomer ? 'تعديل العميل' : 'تعديل المورد')
    : (isCustomer ? 'إضافة عميل جديد' : 'إضافة مورد جديد');

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ type: 'spring', damping: 25 }}
          className="relative z-[70] w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
        >
          <div className="p-4 border-b border-surface-container-low flex items-center justify-between">
            <h3 className="font-extrabold text-on-surface">{title}</h3>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-surface-container-low transition-colors">
              <X size={16} />
            </button>
          </div>

          <div className="p-5 space-y-3">
            <div>
              <label className="text-xs font-bold mb-1 block text-on-surface-variant">
                {isCustomer ? 'اسم العميل' : 'اسم المورد'} *
              </label>
              <input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder={isCustomer ? 'أدخل اسم العميل' : 'أدخل اسم المورد'}
                className="w-full border border-surface-container-high rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold mb-1 block text-on-surface-variant">الهاتف</label>
                <input
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="05XXXXXXXX"
                  className="w-full border border-surface-container-high rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-bold mb-1 block text-on-surface-variant">البريد الإلكتروني</label>
                <input
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="mail@example.com"
                  className="w-full border border-surface-container-high rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-primary transition-all"
                  dir="ltr"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold mb-1 block text-on-surface-variant">العنوان</label>
              <input
                value={form.address}
                onChange={e => setForm({ ...form, address: e.target.value })}
                placeholder="المدينة، الحي، الشارع..."
                className="w-full border border-surface-container-high rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-bold mb-1 block text-on-surface-variant">الحد الائتماني (ر.س)</label>
              <input
                type="number"
                value={form.credit_limit}
                onChange={e => setForm({ ...form, credit_limit: Number(e.target.value) })}
                className="w-full border border-surface-container-high rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>
          </div>

          <div className="p-4 border-t border-surface-container-low flex items-center justify-end gap-2">
            <Button onClick={onClose} variant="secondary">إلغاء</Button>
            <Button
              onClick={onSave}
              variant={isCustomer ? 'success' : 'primary'}
              disabled={!form.name.trim() || isSaving}
            >
              {isEditing ? 'حفظ التعديلات' : (isCustomer ? 'إضافة العميل' : 'إضافة المورد')}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default ContactFormModal;
