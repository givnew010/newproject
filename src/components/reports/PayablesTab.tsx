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

interface PayablesTabProps {
  suppliers: ContactBalance[];
}

export function PayablesTab({ suppliers }: PayablesTabProps) {
  const total = suppliers.reduce((s, c) => s + c.total_due, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-surface-container-high shadow-sm">
          <p className="text-2xl font-extrabold text-warning">{total.toLocaleString('ar-SA')} ر.س</p>
          <p className="text-xs text-on-surface-variant">إجمالي المستحقات للموردين</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-surface-container-high shadow-sm">
          <p className="text-2xl font-extrabold text-on-surface">{suppliers.filter(s => s.total_due > 0).length}</p>
          <p className="text-xs text-on-surface-variant">موردون بديون</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-surface-container-high shadow-sm">
          <p className="text-2xl font-extrabold text-on-surface">{suppliers.length}</p>
          <p className="text-xs text-on-surface-variant">إجمالي الموردين</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-surface-container-high shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-surface-container-low">
          <h4 className="font-extrabold text-on-surface text-sm">تفاصيل ذمم الموردين</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead>
              <tr className="bg-surface-container-low/80 border-b border-surface-container-high text-[11px] text-on-surface-variant uppercase">
                <th className="px-5 py-3">المورد</th>
                <th className="px-5 py-3 text-center">الفواتير</th>
                <th className="px-5 py-3 text-center">المدفوع</th>
                <th className="px-5 py-3 text-center">المستحق</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low">
              {suppliers.map(s => (
                <tr key={s.id} className={cn('hover:bg-surface-container-low/30', s.total_due > 0 && 'bg-amber-50/40')}>
                  <td className="px-5 py-3 font-medium">{s.name}</td>
                  <td className="px-5 py-3 text-center">{s.total_invoices}</td>
                  <td className="px-5 py-3 text-center text-success font-bold">{s.total_paid.toLocaleString('ar-SA')}</td>
                  <td className={cn('px-5 py-3 text-center font-extrabold', s.total_due > 0 ? 'text-warning' : 'text-success')}>
                    {s.total_due.toLocaleString('ar-SA')} ر.س
                  </td>
                </tr>
              ))}
              {suppliers.length === 0 && (
                <tr><td colSpan={4} className="py-10 text-center text-on-surface-variant text-sm">لا توجد بيانات</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default PayablesTab;
