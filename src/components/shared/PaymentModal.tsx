import React from 'react';
import { X, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Button } from '../ui';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface PaymentState {
  amount: string;
  method: string;
  notes: string;
}

interface PaymentModalProps {
  mode: 'sale' | 'purchase';
  invoiceNumber: string;
  totalAmount: number;
  payment: PaymentState;
  setPayment: (p: PaymentState) => void;
  onSave: () => void;
  onClose: () => void;
  isSaving?: boolean;
}

const PAYMENT_METHODS = [
  { value: 'cash', label: 'نقداً' },
  { value: 'bank_transfer', label: 'تحويل بنكي' },
  { value: 'check', label: 'شيك' },
  { value: 'credit_card', label: 'بطاقة ائتمان' },
];

export function PaymentModal({ mode, invoiceNumber, totalAmount, payment, setPayment, onSave, onClose, isSaving }: PaymentModalProps) {
  const isSale = mode === 'sale';
  const title = isSale ? 'تسجيل دفعة من العميل' : 'تسجيل دفعة للمورد';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', damping: 25, stiffness: 400 }}
          className="relative z-[80] w-full max-w-sm bg-white shadow-2xl rounded-3xl overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-surface-container-low flex items-center justify-between bg-gradient-to-l from-blue-50 to-white">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
                <CreditCard size={17} className="text-blue-700" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-on-surface">{title}</h3>
                <p className="text-[10px] text-on-surface-variant">{invoiceNumber}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-surface-container-low rounded-xl">
              <X size={18} />
            </button>
          </div>

          <div className="p-5 space-y-4">
            {/* Invoice Total Reference */}
            <div className="bg-surface-container-low rounded-xl px-4 py-3 flex items-center justify-between">
              <span className="text-xs text-on-surface-variant">إجمالي الفاتورة</span>
              <span className="text-sm font-extrabold text-on-surface">{Number(totalAmount).toLocaleString('ar-SA')} ر.س</span>
            </div>

            {/* Amount */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-on-surface-variant">المبلغ المدفوع *</label>
              <input
                type="number"
                min={0}
                step={0.01}
                placeholder="0.00"
                value={payment.amount}
                onChange={e => setPayment({ ...payment, amount: e.target.value })}
                className="w-full bg-surface-container-high border-none rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold text-center"
                dir="ltr"
              />
            </div>

            {/* Method */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-on-surface-variant">طريقة الدفع</label>
              <div className="grid grid-cols-2 gap-1.5">
                {PAYMENT_METHODS.map(m => (
                  <button
                    key={m.value}
                    onClick={() => setPayment({ ...payment, method: m.value })}
                    className={cn(
                      'py-2 rounded-xl text-xs font-bold transition-all border',
                      payment.method === m.value
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'border-surface-container-high text-on-surface-variant hover:bg-surface-container-low'
                    )}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-on-surface-variant">ملاحظات</label>
              <textarea
                rows={2}
                placeholder="ملاحظات الدفعة (اختياري)..."
                value={payment.notes}
                onChange={e => setPayment({ ...payment, notes: e.target.value })}
                className="w-full bg-surface-container-high border-none rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
              />
            </div>
          </div>

          <div className="p-4 border-t border-surface-container-low flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>إلغاء</Button>
            <Button
              variant="primary"
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              onClick={onSave}
              disabled={!payment.amount || parseFloat(payment.amount) <= 0 || isSaving}
            >
              تسجيل الدفعة
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default PaymentModal;
