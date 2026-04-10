import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

interface ContactBalance {
  id: number;
  name: string;
  total_invoices: number;
  total_paid: number;
  total_due: number;
}

interface ReceivablesTabProps {
  customers: ContactBalance[];
}

export function ReceivablesTab({ customers }: ReceivablesTabProps) {
  const total = customers.reduce((s, c) => s + c.total_due, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-surface-container-high shadow-sm">
          <p className="text-2xl font-extrabold text-error">{total.toLocaleString('ar-SA')} ر.س</p>
          <p className="text-xs text-on-surface-variant">إجمالي المستحقات</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-surface-container-high shadow-sm">
          <p className="text-2xl font-extrabold text-on-surface">{customers.filter(c => c.total_due > 0).length}</p>
          <p className="text-xs text-on-surface-variant">عملاء بديون</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-surface-container-high shadow-sm">
          <p className="text-2xl font-extrabold text-on-surface">{customers.length}</p>
          <p className="text-xs text-on-surface-variant">إجمالي العملاء</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-surface-container-high shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-surface-container-low">
          <h4 className="font-extrabold text-on-surface text-sm">تفاصيل ذمم العملاء</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead>
              <tr className="bg-surface-container-low/80 border-b border-surface-container-high text-[11px] text-on-surface-variant uppercase">
                <th className="px-5 py-3">العميل</th>
                <th className="px-5 py-3 text-center">الفواتير</th>
                <th className="px-5 py-3 text-center">المدفوع</th>
                <th className="px-5 py-3 text-center">المستحق</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low">
              {customers.map(c => (
                <tr key={c.id} className={cn('hover:bg-surface-container-low/30', c.total_due > 0 && 'bg-red-50/30')}>
                  <td className="px-5 py-3 font-medium">{c.name}</td>
                  <td className="px-5 py-3 text-center">{c.total_invoices}</td>
                  <td className="px-5 py-3 text-center text-success font-bold">{c.total_paid.toLocaleString('ar-SA')}</td>
                  <td className={cn('px-5 py-3 text-center font-extrabold', c.total_due > 0 ? 'text-error' : 'text-success')}>
                    {c.total_due.toLocaleString('ar-SA')} ر.س
                  </td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr><td colSpan={4} className="py-10 text-center text-on-surface-variant text-sm">لا توجد بيانات</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ReceivablesTab;
