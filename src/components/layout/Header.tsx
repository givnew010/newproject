import React from 'react';
import { Search, Bell, Settings, Menu, X } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

type Page = 'dashboard' | 'inventory' | 'purchases' | 'sales' | 'reports' | 'warehouses' | 'customers' | 'suppliers' | 'users' | 'settings';

interface HeaderProps {
  currentPage: Page;
  pageTitle: string;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  searchQuery?: string;
  setSearchQuery?: (v: string) => void;
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

export default function Header({ currentPage, pageTitle, isSidebarOpen, toggleSidebar, searchQuery, setSearchQuery, alertsCount = 0, navigateTo }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 glass-panel border-b border-surface-container-high px-4 lg:px-6 py-3 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <button onClick={toggleSidebar} className="p-2 hover:bg-surface-container-low rounded-xl transition-colors flex-shrink-0">
          {isSidebarOpen ? <X size={22} className="text-on-surface-variant" /> : <Menu size={22} className="text-on-surface-variant" />}
        </button>

        <div className="min-w-0">
          <h2 className="font-headline font-extrabold text-on-surface text-lg lg:text-xl leading-tight">{pageTitle}</h2>
        </div>

        {currentPage === 'inventory' && (
          <div className="hidden md:flex relative ms-2">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60" />
            <input type="text" placeholder="بحث في الأصناف..." value={searchQuery} onChange={e => setSearchQuery?.(e.target.value)} className="bg-surface-container-low border border-surface-container-high rounded-xl pr-9 pl-10 py-2 w-64 focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm outline-none" />
            {searchQuery && (
              <button onClick={() => setSearchQuery?.('')} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-error transition-colors">✕</button>
            )}
          </div>
        )}
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
