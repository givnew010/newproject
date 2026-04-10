import React from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../ui';

type StatementRow = {
  type: string;
  id: number;
  reference: string;
  transaction_date: string;
  debit: number;
  credit: number;
  balance?: number;
  notes?: string | null;
};

interface StatementModalProps {
  mode: 'customer' | 'supplier';
  entityName: string;
  rows: StatementRow[];
  onClose: () => void;
}

export function StatementModal({ mode, entityName, rows, onClose }: StatementModalProps) {
  const isCustomer = mode === 'customer';
  const title = isCustomer ? 'كشف حساب العميل' : 'كشف حساب المورد';

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
          className="relative z-[70] w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden"
        >
          <div className="p-4 border-b border-surface-container-low flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-on-surface">{title}</h3>
              <p className="text-xs text-on-surface-variant mt-0.5">{entityName}</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-surface-container-low transition-colors">
              <X size={16} />
            </button>
          </div>

          <div className="p-5 max-h-[60vh] overflow-y-auto">
            {rows.length === 0 ? (
              <div className="py-10 text-center text-on-surface-variant text-sm">لا توجد حركات مالية</div>
            ) : (
              <table className="w-full text-right">
                <thead>
                  <tr className="text-xs text-on-surface-variant border-b border-surface-container-high">
                    <th className="px-3 py-2 font-bold">التاريخ</th>
                    <th className="px-3 py-2 font-bold">المرجع</th>
                    <th className="px-3 py-2 font-bold">مدين</th>
                    <th className="px-3 py-2 font-bold">دائن</th>
                    <th className="px-3 py-2 font-bold">الرصيد</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className="border-b border-surface-container-low last:border-0 hover:bg-surface-container-low/30">
                      <td className="px-3 py-2.5 text-sm">{r.transaction_date}</td>
                      <td className="px-3 py-2.5 text-sm font-medium text-primary">{r.reference}</td>
                      <td className="px-3 py-2.5 text-sm text-error">
                        {r.debit ? r.debit.toLocaleString('ar-SA') : '—'}
                      </td>
                      <td className="px-3 py-2.5 text-sm text-success">
                        {r.credit ? r.credit.toLocaleString('ar-SA') : '—'}
                      </td>
                      <td className="px-3 py-2.5 text-sm font-bold">
                        {r.balance !== undefined ? r.balance.toLocaleString('ar-SA') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="p-4 border-t border-surface-container-low flex items-center justify-end">
            <Button variant={isCustomer ? 'secondary' : 'outline'} onClick={onClose}>إغلاق</Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default StatementModal;
