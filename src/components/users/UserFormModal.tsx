import React from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../ui';

export interface UserFormState {
  name: string;
  email: string;
  phone: string;
  department: string;
  role: string;
  status: string;
}

interface UserFormModalProps {
  isEditing: boolean;
  form: UserFormState;
  setForm: (f: UserFormState) => void;
  onSave: () => void;
  onClose: () => void;
}

const ROLES = [
  { value: 'admin', label: 'مسؤول النظام' },
  { value: 'manager', label: 'مدير' },
  { value: 'accountant', label: 'محاسب' },
  { value: 'warehouse_keeper', label: 'أمين مستودع' },
  { value: 'viewer', label: 'مشاهد' },
];

const STATUSES = [
  { value: 'active', label: 'نشط' },
  { value: 'inactive', label: 'غير نشط' },
  { value: 'suspended', label: 'معلق' },
];

export function UserFormModal({ isEditing, form, setForm, onSave, onClose }: UserFormModalProps) {
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ type: 'spring', damping: 25 }}
          className="relative z-[70] w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
        >
          <div className="p-4 border-b border-surface-container-low flex items-center justify-between">
            <h3 className="font-extrabold text-on-surface">{isEditing ? 'تعديل المستخدم' : 'إضافة مستخدم جديد'}</h3>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-surface-container-low"><X size={16} /></button>
          </div>

          <div className="p-5 space-y-3">
            {[
              { key: 'name', label: 'الاسم الكامل *', placeholder: 'أدخل الاسم الكامل' },
              { key: 'email', label: 'البريد الإلكتروني *', placeholder: 'user@example.com' },
              { key: 'phone', label: 'رقم الهاتف', placeholder: '05XXXXXXXX' },
              { key: 'department', label: 'القسم', placeholder: 'مثال: المحاسبة' },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="text-xs font-bold text-on-surface-variant mb-1 block">{label}</label>
                <input
                  value={(form as any)[key]}
                  onChange={e => setForm({ ...form, [key]: e.target.value })}
                  placeholder={placeholder}
                  className="w-full border border-surface-container-high rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>
            ))}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-on-surface-variant mb-1 block">الدور *</label>
                <select
                  value={form.role}
                  onChange={e => setForm({ ...form, role: e.target.value })}
                  className="w-full border border-surface-container-high rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-primary transition-all"
                >
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-on-surface-variant mb-1 block">الحالة</label>
                <select
                  value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value })}
                  className="w-full border border-surface-container-high rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-primary transition-all"
                >
                  {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-surface-container-low flex items-center justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>إلغاء</Button>
            <Button variant="primary" onClick={onSave} disabled={!form.name.trim() || !form.email.trim()}>
              {isEditing ? 'حفظ التعديلات' : 'إضافة المستخدم'}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default UserFormModal;
