import React from 'react';
import { AlertTriangle, XCircle, ChevronLeft } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { InventoryItem } from '../../types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function AlertItem({ item, type, onClick }: { item: InventoryItem; type: 'low' | 'out'; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 p-3 rounded-xl border cursor-pointer hover:shadow-sm transition-all',
        type === 'out' ? 'bg-red-50 border-red-200 hover:border-red-300' : 'bg-amber-50 border-amber-200 hover:border-amber-300'
      )}
    >
      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', type === 'out' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600')}>
        {type === 'out' ? <XCircle size={15} /> : <AlertTriangle size={15} />}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-bold text-on-surface truncate">{item.name}</p>
        <p className={cn('text-[11px] font-medium', type === 'out' ? 'text-red-600' : 'text-amber-600')}>
          {type === 'out' ? 'نفذ المخزون' : `متبقي: ${item.quantity} وحدة`}
        </p>
      </div>
    </div>
  );
}

interface StockAlertsProps {
  lowStockItems: InventoryItem[];
  outOfStockItems: InventoryItem[];
  onNavigate: (page: string) => void;
}

export function StockAlerts({ lowStockItems, outOfStockItems, onNavigate }: StockAlertsProps) {
  if (lowStockItems.length === 0 && outOfStockItems.length === 0) return null;

  const displayedOut = outOfStockItems.slice(0, 6);
  const displayedLow = lowStockItems.slice(0, 6 - Math.min(6, outOfStockItems.length));

  return (
    <div className="bg-white rounded-2xl border border-surface-container-high shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-surface-container-low flex items-center justify-between bg-gradient-to-l from-amber-50 to-white">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center">
            <AlertTriangle size={16} className="text-amber-600" />
          </div>
          <div>
            <h4 className="font-extrabold text-on-surface text-sm">تنبيهات المخزون</h4>
            <p className="text-[11px] text-on-surface-variant">{outOfStockItems.length} نفذت + {lowStockItems.length} منخفضة</p>
          </div>
        </div>
        <button
          onClick={() => onNavigate('inventory')}
          className="flex items-center gap-1 text-xs text-primary font-bold hover:underline px-3 py-1.5 rounded-lg hover:bg-primary-fixed/30 transition-colors"
        >
          عرض الكل <ChevronLeft size={13} />
        </button>
      </div>
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {displayedOut.map(item => (
          <AlertItem key={item.id} item={item} type="out" onClick={() => onNavigate('inventory')} />
        ))}
        {displayedLow.map(item => (
          <AlertItem key={item.id} item={item} type="low" onClick={() => onNavigate('inventory')} />
        ))}
      </div>
    </div>
  );
}

export default StockAlerts;
