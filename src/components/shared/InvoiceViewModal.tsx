import React from 'react';
import { X, FileText, Calendar, User, Package, Edit2, Trash2, CreditCard, Truck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { SalesInvoice, PurchaseInvoice } from '../../types';
import { Button } from '../ui';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type AnyInvoice = SalesInvoice | PurchaseInvoice;

interface InvoiceViewModalProps {
  mode: 'sale' | 'purchase';
  invoice: AnyInvoice | null;
  onClose: () => void;
  onEdit: (inv: AnyInvoice) => void;
  onDelete: (id: string) => void;
  onPayment: (inv: AnyInvoice) => void;
}

export function InvoiceViewModal({ mode, invoice, onClose, onEdit, onDelete, onPayment }: InvoiceViewModalProps) {
  if (!invoice) return null;

  const isSale = mode === 'sale';
  const color = isSale ? 'emerald' : 'violet';
  const party = isSale ? (invoice as SalesInvoice).customer : (invoice as PurchaseInvoice).supplier;
  const partyLabel = isSale ? 'العميل' : 'المورد';

  const colors = {
    emerald: { icon: 'bg-emerald-50', iconText: 'text-emerald-600', badge: 'bg-emerald-50 text-emerald-700', total: 'text-emerald-700', header: 'from-emerald-50' },
    violet: { icon: 'bg-violet-50', iconText: 'text-violet-600', badge: 'bg-violet-50 text-violet-700', total: 'text-violet-700', header: 'from-violet-50' },
  }[color];

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
          className="relative z-[70] w-full max-w-xl max-h-[92vh] bg-white shadow-2xl flex flex-col rounded-3xl overflow-hidden"
        >
          {/* Header */}
          <div className={cn('px-5 py-4 border-b border-surface-container-low flex items-center justify-between flex-shrink-0 bg-gradient-to-l to-white', colors.header)}>
            <div className="flex items-center gap-3">
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', colors.icon)}>
                <FileText size={18} className={colors.iconText} />
              </div>
              <div>
                <h2 className={cn('text-base font-extrabold font-mono', colors.total)}>{invoice.invoiceNumber}</h2>
                <p className="text-[11px] text-on-surface-variant">{isSale ? 'فاتورة مبيعات' : 'فاتورة مشتريات'}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-surface-container-low rounded-xl transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Meta */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface-container-low rounded-xl p-3 space-y-1">
                <div className="flex items-center gap-1.5 text-on-surface-variant mb-1">
                  {isSale ? <User size={12} /> : <Truck size={12} />}
                  <span className="text-[10px] font-bold uppercase">{partyLabel}</span>
                </div>
                <p className="text-sm font-bold text-on-surface">{party}</p>
              </div>
              <div className="bg-surface-container-low rounded-xl p-3 space-y-1">
                <div className="flex items-center gap-1.5 text-on-surface-variant mb-1">
                  <Calendar size={12} />
                  <span className="text-[10px] font-bold uppercase">التاريخ</span>
                </div>
                <p className="text-sm font-bold text-on-surface">{invoice.date}</p>
              </div>
            </div>

            {/* Items Table */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Package size={13} className="text-on-surface-variant" />
                <h4 className="text-xs font-bold text-on-surface-variant uppercase">الأصناف ({invoice.items?.length ?? 0})</h4>
              </div>
              <div className="rounded-xl border border-surface-container-high overflow-hidden">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="bg-surface-container-low/80 border-b border-surface-container-high">
                      <th className="px-3 py-2 font-bold text-on-surface-variant">الصنف</th>
                      <th className="px-3 py-2 font-bold text-on-surface-variant text-center">الكمية</th>
                      <th className="px-3 py-2 font-bold text-on-surface-variant text-center">السعر</th>
                      <th className="px-3 py-2 font-bold text-on-surface-variant text-center">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container-low">
                    {(invoice.items ?? []).map(item => (
                      <tr key={item.id} className="bg-white">
                        <td className="px-3 py-2 font-medium text-on-surface">{item.name}</td>
                        <td className="px-3 py-2 text-center text-on-surface-variant">{item.quantity}</td>
                        <td className="px-3 py-2 text-center text-on-surface-variant">{Number(item.price).toLocaleString('ar-SA')}</td>
                        <td className={cn('px-3 py-2 text-center font-bold', colors.total)}>{Number(item.total).toLocaleString('ar-SA')}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 border-surface-container-high bg-surface-container-low/50">
                    <tr>
                      <td colSpan={3} className="px-3 py-2.5 text-left font-extrabold text-on-surface text-xs">الإجمالي الكلي</td>
                      <td className={cn('px-3 py-2.5 text-center font-extrabold text-sm', colors.total)}>
                        {Number(invoice.totalAmount ?? 0).toLocaleString('ar-SA')} ر.س
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {invoice.notes && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                <p className="text-[10px] font-bold text-amber-700 mb-1">ملاحظات</p>
                <p className="text-xs text-amber-800">{invoice.notes}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-surface-container-low flex gap-2 flex-shrink-0">
            <button
              onClick={() => { onPayment(invoice); onClose(); }}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 text-xs font-bold hover:bg-blue-100 transition-colors"
            >
              <CreditCard size={14} /> تسجيل دفعة
            </button>
            <button
              onClick={() => { onEdit(invoice); onClose(); }}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-colors"
            >
              <Edit2 size={14} /> تعديل
            </button>
            <button
              onClick={() => { onDelete(invoice.id); onClose(); }}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default InvoiceViewModal;
