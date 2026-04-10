import React from 'react';
import { FileText, User, Calendar, Package, Eye, CreditCard, Edit2, Trash2, ShoppingBag, ShoppingCart } from 'lucide-react';
import { motion } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Button } from '../ui';
import { SalesInvoice, PurchaseInvoice } from '../../types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type AnyInvoice = SalesInvoice | PurchaseInvoice;

function getParty(inv: AnyInvoice, mode: 'sale' | 'purchase') {
  if (mode === 'sale') return (inv as SalesInvoice).customer;
  return (inv as PurchaseInvoice).supplier;
}

interface InvoiceTableProps {
  mode: 'sale' | 'purchase';
  invoices: AnyInvoice[];
  onView: (inv: AnyInvoice) => void;
  onEdit: (inv: AnyInvoice) => void;
  onDelete: (id: string) => void;
  onPayment: (inv: AnyInvoice) => void;
  onAdd: () => void;
}

export function InvoiceTable({ mode, invoices, onView, onEdit, onDelete, onPayment, onAdd }: InvoiceTableProps) {
  const isSale = mode === 'sale';
  const color = isSale ? 'emerald' : 'violet';
  const partyLabel = isSale ? 'العميل' : 'المورد';
  const EmptyIcon = isSale ? ShoppingBag : ShoppingCart;
  const emptyLabel = isSale ? 'لا توجد فواتير مبيعات بعد' : 'لا توجد فواتير مشتريات بعد';
  const emptyAction = isSale ? 'أضف أول فاتورة مبيعات' : 'أضف أول فاتورة مشتريات';

  const colorMap = {
    emerald: {
      row: 'hover:bg-emerald-50/40',
      icon: 'bg-emerald-50',
      iconText: 'text-emerald-600',
      text: 'text-emerald-700',
      emptyBg: 'bg-emerald-50',
      emptyIcon: 'text-emerald-400',
      actionHover: 'hover:text-emerald-600 hover:bg-emerald-50',
    },
    violet: {
      row: 'hover:bg-violet-50/40',
      icon: 'bg-violet-50',
      iconText: 'text-violet-600',
      text: 'text-violet-700',
      emptyBg: 'bg-violet-50',
      emptyIcon: 'text-violet-400',
      actionHover: 'hover:text-violet-600 hover:bg-violet-50',
    },
  }[color];

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-surface-container-high">
      <div className="overflow-x-auto">
        <table className="w-full text-right">
          <thead>
            <tr className="bg-surface-container-low/80 border-b border-surface-container-high">
              <th className="px-5 py-3.5 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">رقم الفاتورة</th>
              <th className="px-5 py-3.5 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">{partyLabel}</th>
              <th className="px-5 py-3.5 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider hidden sm:table-cell">التاريخ</th>
              <th className="px-5 py-3.5 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider hidden md:table-cell">الأصناف</th>
              <th className="px-5 py-3.5 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">الإجمالي</th>
              <th className="px-5 py-3.5 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider text-left">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-20 text-center">
                  <div className="flex flex-col items-center gap-3 text-on-surface-variant">
                    <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center', colorMap.emptyBg)}>
                      <EmptyIcon size={28} className={colorMap.emptyIcon} />
                    </div>
                    <p className="text-sm font-medium">{emptyLabel}</p>
                    <Button variant="ghost" size="sm" onClick={onAdd} className={cn('font-bold', colorMap.text)}>
                      {emptyAction}
                    </Button>
                  </div>
                </td>
              </tr>
            ) : (
              invoices.map((inv, idx) => (
                <motion.tr
                  key={inv.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.04 }}
                  onClick={() => onView(inv)}
                  className={cn('border-b border-surface-container-low last:border-0 transition-colors group cursor-pointer', colorMap.row)}
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0', colorMap.icon)}>
                        <FileText size={14} className={colorMap.iconText} />
                      </div>
                      <span className={cn('text-sm font-bold font-mono', colorMap.text)}>{inv.invoiceNumber}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      {isSale && (
                        <div className="w-7 h-7 rounded-full bg-surface-container-high flex items-center justify-center flex-shrink-0">
                          <User size={13} className="text-on-surface-variant" />
                        </div>
                      )}
                      <span className="text-sm font-medium text-on-surface">{getParty(inv, mode)}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 hidden sm:table-cell">
                    <div className="flex items-center gap-1.5 text-on-surface-variant">
                      <Calendar size={12} />
                      <span className="text-sm">{inv.date}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    <span className="inline-flex items-center gap-1 bg-surface-container-low text-on-surface-variant text-xs font-bold px-2.5 py-1 rounded-full">
                      <Package size={11} />{(inv.items?.length ?? 0)} صنف
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={cn('text-sm font-extrabold font-mono', colorMap.text)}>
                      {Number(inv.totalAmount ?? 0).toLocaleString('ar-SA')}
                    </span>
                    <span className="text-xs text-on-surface-variant mr-1">ر.س</span>
                  </td>
                  <td className="px-5 py-3.5 text-left">
                    <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={e => { e.stopPropagation(); onView(inv); }}
                        className={cn('p-2 text-on-surface-variant/50 rounded-xl transition-all', colorMap.actionHover)}
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); onPayment(inv); }}
                        className="p-2 text-on-surface-variant/50 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                      >
                        <CreditCard size={15} />
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); onEdit(inv); }}
                        className="p-2 text-on-surface-variant/50 hover:text-primary hover:bg-primary-fixed/50 rounded-xl transition-all"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); onDelete(inv.id); }}
                        className="p-2 text-on-surface-variant/50 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {invoices.length > 0 && (
        <div className="px-5 py-3.5 bg-surface-container-low/50 border-t border-surface-container-high flex items-center justify-between">
          <span className="text-xs text-on-surface-variant font-medium">
            {invoices.length} {isSale ? 'فاتورة مبيعات' : 'فاتورة مشتريات'}
          </span>
        </div>
      )}
    </div>
  );
}

export default InvoiceTable;
