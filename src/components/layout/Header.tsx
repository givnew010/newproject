import React from 'react';
import { Bell, Settings } from 'lucide-react';

type Page = 'dashboard' | 'inventory' | 'purchases' | 'sales' | 'reports' | 'warehouses' | 'customers' | 'suppliers' | 'users' | 'settings';

interface HeaderProps {
  currentPage: Page;
  pageTitle: string;
  alertsCount?: number;
  navigateTo?: (p: Page) => void;
}

function IconButton({ icon, onClick, badge }: { icon: React.ReactNode; onClick?: () => void; badge?: number }) {
  return (
    <button onClick={onClick} className="relative p-2.5 text-on-surface-variant hover:text-primary hover:bg-primary-fixed/50 rounded-xl transition-all">
      {icon}
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{badge}</span>
      )}
    </button>
  );
}

export default function Header({ currentPage, pageTitle, alertsCount = 0, navigateTo }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 glass-panel border-b border-surface-container-high px-4 lg:px-6 py-3 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        {/* sidebar toggle moved into Sidebar component */}
        <div className="min-w-0">
          <h2 className="font-headline font-extrabold text-on-surface text-lg lg:text-xl leading-tight">{pageTitle}</h2>
        </div>

        {/* search removed */}
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        <IconButton icon={<Bell size={19} />} badge={alertsCount} />
        <IconButton icon={<Settings size={19} />} onClick={() => navigateTo?.('settings')} />
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center ml-1 cursor-pointer shadow-sm">
          <span className="text-white font-extrabold text-sm">م</span>
        </div>
      </div>
    </header>
  );
}
