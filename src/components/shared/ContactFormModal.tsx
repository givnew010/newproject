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
  const color = isCustomer ? 'emerald' : 'violet';
  const title = isEditing
    ? (isCustomer ? 'تعديل العميل' : 'تعديل المورد')
    : (isCustomer ? 'إضافة عميل جديد' : 'إضافة مورد جديد');
  const subtitle = isCustomer ? 'أدخل بيانات العميل' : 'أدخل بيانات المورد';

  const colorCls = {
    emerald: {
      header: 'from-emerald-50',
      focus: 'focus:ring-emerald-500 focus:border-emerald-500',
    },
    violet: {
      header: 'from-violet-50',
      focus: 'focus:ring-primary',
    },
  } as const;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative z-[70] w-full max-w-2xl max-h-[92vh] bg-white shadow-2xl flex flex-col rounded-3xl overflow-hidden"
        >
          <div className={`px-5 py-4 border-b border-surface-container-low flex items-center justify-between flex-shrink-0 bg-gradient-to-l to-white ${colorCls[color].header}`}>
            <div>
              <h2 className="text-base font-extrabold text-on-surface">{title}</h2>
              <p className="text-[11px] text-on-surface-variant mt-0.5">{subtitle}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-surface-container-low rounded-xl transition-colors">
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label={isCustomer ? 'اسم العميل *' : 'اسم المورد *'}
                placeholder={isCustomer ? 'أدخل اسم العميل' : 'أدخل اسم المورد'}
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
              <Input
                label="الهاتف"
                placeholder="05XXXXXXXX"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
              />
              <Input
                label="البريد الإلكتروني"
                placeholder="mail@example.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                dir="ltr"
              />
              <Input
                label="الحد الائتماني (ر.س)"
                type="number"
                value={String(form.credit_limit ?? '')}
                onChange={e => setForm({ ...form, credit_limit: Number(e.target.value) })}
              />
            </div>

            <div>
              <Input
                label="العنوان"
                placeholder="المدينة، الحي، الشارع..."
                value={form.address}
                onChange={e => setForm({ ...form, address: e.target.value })}
              />
            </div>
          </div>

          <div className="p-4 border-t border-surface-container-low flex gap-3 flex-shrink-0 bg-surface-container-lowest justify-end">
            <Button onClick={onClose} variant="outline">إلغاء</Button>
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
