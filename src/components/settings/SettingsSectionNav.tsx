import React from 'react';
import { Building2, Package, FileText, Bell, Database, ChevronLeft } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

export type SettingsSection = 'company' | 'inventory' | 'invoices' | 'notifications' | 'data';

interface SettingsSectionNavProps {
  active: SettingsSection;
  onChange: (s: SettingsSection) => void;
}

const NAV_ITEMS: { id: SettingsSection; label: string; sub: string; icon: React.ReactNode }[] = [
  { id: 'company', label: 'معلومات الشركة', sub: 'الاسم، العنوان، الشعار', icon: <Building2 size={17} /> },
  { id: 'inventory', label: 'إعدادات المخزون', sub: 'الحد الأدنى، التنبيهات', icon: <Package size={17} /> },
  { id: 'invoices', label: 'إعدادات الفواتير', sub: 'الترقيم، الضريبة', icon: <FileText size={17} /> },
  { id: 'notifications', label: 'الإشعارات', sub: 'قنوات التنبيه', icon: <Bell size={17} /> },
  { id: 'data', label: 'البيانات والنسخ الاحتياطية', sub: 'تصدير، استيراد، حذف', icon: <Database size={17} /> },
];

export function SettingsSectionNav({ active, onChange }: SettingsSectionNavProps) {
  return (
    <div className="bg-white rounded-2xl border border-surface-container-high shadow-sm overflow-hidden">
      {NAV_ITEMS.map((item, idx) => (
        <button
          key={item.id}
          onClick={() => onChange(item.id)}
          className={cn(
            'w-full flex items-center justify-between px-4 py-3.5 transition-all text-right',
            idx !== NAV_ITEMS.length - 1 && 'border-b border-surface-container-low',
            active === item.id ? 'bg-primary-fixed/20 text-primary' : 'hover:bg-surface-container-low/50'
          )}
        >
          <div className="flex items-center gap-3">
            <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', active === item.id ? 'bg-primary/10 text-primary' : 'bg-surface-container-low text-on-surface-variant')}>
              {item.icon}
            </div>
            <div className="text-right">
              <p className={cn('text-sm font-bold', active === item.id ? 'text-primary' : 'text-on-surface')}>{item.label}</p>
              <p className="text-[11px] text-on-surface-variant">{item.sub}</p>
            </div>
          </div>
          <ChevronLeft size={14} className={active === item.id ? 'text-primary' : 'text-on-surface-variant/30'} />
        </button>
      ))}
    </div>
  );
}

export default SettingsSectionNav;
