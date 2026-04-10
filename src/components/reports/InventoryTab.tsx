import React from 'react';
import { Package, AlertTriangle, XCircle } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { InventoryItem } from '../../types';

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

interface InventoryTabProps {
  items: InventoryItem[];
  lowStockThreshold: number;
}

export function InventoryTab({ items, lowStockThreshold }: InventoryTabProps) {
  const total = items.length;
  const outOfStock = items.filter(i => i.quantity === 0).length;
  const lowStock = items.filter(i => i.quantity > 0 && i.quantity <= lowStockThreshold).length;
  const inventoryValue = items.reduce((sum, i) => sum + i.quantity * (i.price ?? i.selling_price ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'إجمالي الأصناف', value: total, iconBg: 'bg-blue-100', iconText: 'text-blue-600', icon: <Package size={20} /> },
          { label: 'نفد من المخزون', value: outOfStock, iconBg: 'bg-red-100', iconText: 'text-red-600', icon: <XCircle size={20} /> },
          { label: 'مخزون منخفض', value: lowStock, iconBg: 'bg-amber-100', iconText: 'text-amber-600', icon: <AlertTriangle size={20} /> },
          { label: 'قيمة المخزون', value: `${inventoryValue.toLocaleString('ar-SA')} ر.س`, iconBg: 'bg-emerald-100', iconText: 'text-emerald-600', icon: <Package size={20} /> },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-2xl p-4 border border-surface-container-high shadow-sm flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', c.iconBg)}>
              <span className={c.iconText}>{c.icon}</span>
            </div>
            <div>
              <p className="font-extrabold text-on-surface text-sm">{c.value}</p>
              <p className="text-[11px] text-on-surface-variant">{c.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-surface-container-high shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-surface-container-low">
          <h4 className="font-extrabold text-on-surface text-sm">تفاصيل الأصناف</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead>
              <tr className="bg-surface-container-low/80 border-b border-surface-container-high text-[11px] text-on-surface-variant uppercase">
                <th className="px-5 py-3">الصنف</th>
                <th className="px-5 py-3">الرمز</th>
                <th className="px-5 py-3 text-center">الكمية</th>
                <th className="px-5 py-3 text-center">سعر الوحدة</th>
                <th className="px-5 py-3 text-center">القيمة الكلية</th>
                <th className="px-5 py-3 text-center">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low">
              {items.map(item => {
                const isOut = item.quantity === 0;
                const isLow = item.quantity > 0 && item.quantity <= lowStockThreshold;
                return (
                  <tr key={item.id} className={cn('hover:bg-surface-container-low/30 transition-colors', isOut && 'bg-red-50/40')}>
                    <td className="px-5 py-3 font-medium text-on-surface">{item.name}</td>
                    <td className="px-5 py-3 font-mono text-on-surface-variant">{item.sku}</td>
                    <td className={cn('px-5 py-3 text-center font-bold', isOut ? 'text-error' : isLow ? 'text-warning' : 'text-success')}>
                      {item.quantity}
                    </td>
                    <td className="px-5 py-3 text-center text-on-surface">{(item.price ?? item.selling_price ?? 0).toLocaleString('ar-SA')}</td>
                    <td className="px-5 py-3 text-center font-bold text-on-surface">
                      {(item.quantity * (item.price ?? item.selling_price ?? 0)).toLocaleString('ar-SA')}
                    </td>
                    <td className="px-5 py-3 text-center">
                      {isOut ? (
                        <span className="text-[11px] font-bold bg-red-100 text-red-700 px-2 py-1 rounded-full">نفذ</span>
                      ) : isLow ? (
                        <span className="text-[11px] font-bold bg-amber-100 text-amber-700 px-2 py-1 rounded-full">منخفض</span>
                      ) : (
                        <span className="text-[11px] font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">متاح</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default InventoryTab;
