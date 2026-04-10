import React from 'react';
import { FileText, CreditCard, Edit2, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Badge } from '../ui';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type ContactRow = {
  id: number;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  credit_limit?: number;
  is_active?: number;
  total_invoices?: number;
  total_paid?: number;
  total_due?: number;
};

interface ContactTableProps {
  mode: 'customer' | 'supplier';
  rows: ContactRow[];
  onEdit: (row: ContactRow) => void;
  onDelete: (id: number) => void;
  onStatement: (row: ContactRow) => void;
}

export function ContactTable({ mode, rows, onEdit, onDelete, onStatement }: ContactTableProps) {
  const isCustomer = mode === 'customer';
  const nameHeader = isCustomer ? 'العميل' : 'المورد';
  const balanceHeader = isCustomer ? 'الرصيد' : 'المستحق';
  const hoverColor = isCustomer ? 'hover:bg-success/40' : 'hover:bg-primary/10';
  const btnHover = isCustomer ? 'hover:text-success hover:bg-success/10' : 'hover:text-primary hover:bg-surface-container-low';
  const emptyLabel = isCustomer ? 'لا يوجد عملاء مطابقون' : 'لا يوجد موردون مطابقون';
  const amountColor = (due: number) =>
    due > 0 ? 'text-error' : (isCustomer ? 'text-success' : 'text-warning');

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-surface-container-high">
      <div className="overflow-x-auto">
        <table className="w-full text-right">
          <thead>
            <tr className="bg-surface-container-low/80 border-b border-surface-container-high">
              <th className="px-5 py-3.5 text-[11px] font-bold text-on-surface-variant uppercase">{nameHeader}</th>
              <th className="px-5 py-3.5 text-[11px] font-bold text-on-surface-variant uppercase hidden sm:table-cell">الهاتف</th>
              <th className="px-5 py-3.5 text-[11px] font-bold text-on-surface-variant uppercase">{balanceHeader}</th>
              <th className="px-5 py-3.5 text-[11px] font-bold text-on-surface-variant uppercase hidden md:table-cell">عدد الفواتير</th>
              <th className="px-5 py-3.5 text-[11px] font-bold text-on-surface-variant uppercase">الحالة</th>
              <th className="px-5 py-3.5 text-[11px] font-bold text-on-surface-variant uppercase text-left">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-3 text-on-surface-variant">
                    <div className="w-16 h-16 rounded-2xl bg-surface-container-low flex items-center justify-center">
                      <FileText size={32} className="opacity-25" />
                    </div>
                    <p className="text-sm font-medium">{emptyLabel}</p>
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => (
                <motion.tr
                  key={row.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.02 }}
                  className={cn('border-b border-surface-container-low last:border-0 transition-colors group', hoverColor)}
                >
                  <td className="px-5 py-3.5">
                    <div>
                      <p className="text-sm font-bold text-on-surface">{row.name}</p>
                      <p className="text-[12px] text-on-surface-variant mt-0.5">{row.email || '—'}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 hidden sm:table-cell">
                    <p className="text-sm text-on-surface">{row.phone || '—'}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className={cn('text-sm font-bold', amountColor(row.total_due || 0))}>
                      {(row.total_due || 0).toLocaleString('ar-SA')} ر.س
                    </p>
                    <p className="text-[12px] text-on-surface-variant">مدفوع: {(row.total_paid || 0).toLocaleString('ar-SA')}</p>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    <p className="text-sm text-on-surface">{row.total_invoices ?? '—'}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    {row.is_active ? (
                      <Badge variant={isCustomer ? 'in-stock' : 'emerald'}>نشط</Badge>
                    ) : (
                      <Badge variant="slate">معطّل</Badge>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-left">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onStatement(row)}
                        title="كشف الحساب"
                        className={cn('p-2 rounded-xl text-on-surface-variant/40 transition-all', btnHover)}
                      >
                        <CreditCard size={15} />
                      </button>
                      <button
                        onClick={() => onEdit(row)}
                        title="تعديل"
                        className={cn('p-2 rounded-xl text-on-surface-variant/40 transition-all', btnHover)}
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => onDelete(row.id)}
                        title="تعطيل"
                        className="p-2 rounded-xl text-error/80 hover:text-error hover:bg-error/10 transition-all"
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
    </div>
  );
}

export default ContactTable;
