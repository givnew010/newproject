import React from 'react';
import { FileText, ShoppingBag, ShoppingCart, Clock, ChevronLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ActivityItem {
  id: string;
  type: 'sale' | 'purchase';
  invoice_number: string;
  customer_name?: string;
  supplier_name?: string;
  total: number;
  date: string;
}

interface RecentActivityProps {
  activities: ActivityItem[];
  onNavigate: (page: string) => void;
}

export function RecentActivity({ activities, onNavigate }: RecentActivityProps) {
  return (
    <div className="lg:col-span-2 bg-white rounded-2xl border border-surface-container-high shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-surface-container-low flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock size={15} className="text-primary" />
          <h4 className="font-extrabold text-on-surface text-sm">آخر النشاطات</h4>
        </div>
        <span className="text-xs bg-surface-container-low text-on-surface-variant px-2.5 py-1 rounded-full font-medium">
          {activities.length} عملية
        </span>
      </div>

      {activities.length === 0 ? (
        <div className="p-12 text-center text-on-surface-variant">
          <div className="w-14 h-14 bg-surface-container-low rounded-2xl flex items-center justify-center mx-auto mb-3">
            <FileText size={24} className="opacity-30" />
          </div>
          <p className="text-sm font-medium">لا توجد نشاطات بعد</p>
          <p className="text-xs mt-1 opacity-60">ابدأ بإضافة فاتورة مبيعات أو مشتريات</p>
        </div>
      ) : (
        <div className="divide-y divide-surface-container-low/70">
          {activities.map((act, idx) => (
            <motion.div
              key={act.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="flex items-center justify-between px-5 py-3.5 hover:bg-surface-container-low/40 transition-colors cursor-pointer group"
              onClick={() => onNavigate(act.type === 'sale' ? 'sales' : 'purchases')}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
                  act.type === 'sale' ? 'bg-emerald-50 text-emerald-700' : 'bg-violet-50 text-violet-700'
                )}>
                  {act.type === 'sale' ? <ShoppingBag size={16} /> : <ShoppingCart size={16} />}
                </div>
                <div>
                  <p className="text-sm font-bold text-on-surface font-mono">{act.invoice_number}</p>
                  <p className="text-[11px] text-on-surface-variant">{act.customer_name || act.supplier_name}</p>
                </div>
              </div>
              <div className="text-left flex items-center gap-2">
                <div>
                  <p className={cn('text-sm font-extrabold', act.type === 'sale' ? 'text-emerald-700' : 'text-violet-700')}>
                    {act.type === 'sale' ? '+' : '-'}{act.total.toLocaleString('ar-SA')} ر.س
                  </p>
                  <p className="text-[11px] text-on-surface-variant text-left">{act.date}</p>
                </div>
                <ChevronLeft size={14} className="text-on-surface-variant/30 group-hover:text-primary transition-colors" />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

export default RecentActivity;
