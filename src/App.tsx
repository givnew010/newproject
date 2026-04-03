import React, { useState, useEffect } from 'react';
import {
  Search, Bell, Settings, LayoutDashboard, Package, Warehouse,
  BarChart3, Plus, ShoppingCart, ShoppingBag,
  X, Menu, LogOut, Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { InventoryItem } from './types';
import PurchaseInvoices from './PurchaseInvoices';
import SalesInvoices from './SalesInvoices';
import Dashboard from './Dashboard';
import Reports from './Reports';
import Warehouses from './Warehouses';
import Inventory from './Inventory';
import SettingsPage from './Settings';
import UsersPage from './Users';

// Import auth components
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './Login';

// Import API hooks
import { useInventory } from './hooks/useApi';

type Page = 'dashboard' | 'inventory' | 'purchases' | 'sales' | 'reports' | 'warehouses' | 'users' | 'settings';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
  badge?: number;
}

function NavItem({ icon, label, active, onClick, badge }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-right group relative',
        active
          ? 'bg-white text-primary shadow-sm font-bold'
          : 'text-blue-100 hover:bg-white/15 hover:text-white'
      )}
    >
      <span className={cn('flex-shrink-0 transition-colors', active ? 'text-primary' : 'text-blue-200 group-hover:text-white')}>
        {icon}
      </span>
      <span className="flex-1">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="flex-shrink-0 bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1">
          {badge}
        </span>
      )}
      {active && (
        <motion.div
          layoutId="activeIndicator"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-full"
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      )}
    </button>
  );
}

function IconButton({ icon, onClick, badge }: { icon: React.ReactNode; onClick?: () => void; badge?: number }) {
  return (
    <button
      onClick={onClick}
      className="relative p-2.5 text-on-surface-variant hover:text-primary hover:bg-primary-fixed/50 rounded-xl transition-all"
    >
      {icon}
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
          {badge}
        </span>
      )}
    </button>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  color: 'primary' | 'green' | 'orange' | 'red';
  onClick?: () => void;
  active?: boolean;
}

function StatCard({ label, value, sub, icon, color, onClick, active }: StatCardProps) {
  const styles = {
    primary: {
      wrapper: 'stat-card-gradient-primary border-blue-200',
      icon: 'bg-blue-100 text-blue-700',
      value: 'text-blue-700',
    },
    green: {
      wrapper: 'stat-card-gradient-green border-emerald-200',
      icon: 'bg-emerald-100 text-emerald-700',
      value: 'text-emerald-700',
    },
    orange: {
      wrapper: 'stat-card-gradient-amber border-amber-200',
      icon: 'bg-amber-100 text-amber-700',
      value: 'text-amber-700',
    },
    red: {
      wrapper: 'stat-card-gradient-red border-red-200',
      icon: 'bg-red-100 text-red-600',
      value: 'text-red-600',
    },
  };

  const s = styles[color];

  return (
    <motion.div
      whileHover={onClick ? { scale: 1.02, y: -2 } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
      onClick={onClick}
      className={cn(
        'rounded-2xl p-4 border transition-all',
        s.wrapper,
        onClick && 'cursor-pointer',
        active && 'ring-2 ring-primary shadow-md'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-on-surface-variant/80 mb-1 truncate">{label}</p>
          <p className={cn('text-2xl font-extrabold leading-tight font-mono', s.value)}>{value}</p>
          <p className="text-[11px] text-on-surface-variant/70 mt-1.5">{sub}</p>
        </div>
        <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm', s.icon)}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
}

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-on-surface-variant">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return <>{children}</>;
}

// Main App Component (without auth logic)
function AppContent() {
  const { data: inventoryItems = [], isLoading: inventoryLoading, refetch: refetchInventory } = useInventory();

  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    document.documentElement.dir = 'rtl';
    document.documentElement.lang = 'ar';
  }, []);

  const lowStockCount = inventoryItems.filter(i => i.status === 'low-stock').length;
  const outOfStockCount = inventoryItems.filter(i => i.status === 'out-of-stock').length;

  const alertsCount = lowStockCount + outOfStockCount;

  const handleInventoryUpdate = () => {
    refetchInventory();
  };

  const navigateTo = (page: Page) => {
    setCurrentPage(page);
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  const pageTitle: Record<Page, string> = {
    dashboard: 'لوحة التحكم',
    inventory: 'إدارة الأصناف',
    purchases: 'فواتير المشتريات',
    sales: 'فواتير المبيعات',
    reports: 'التقارير والتحليلات',
    warehouses: 'إدارة المخازن',
    users: 'إدارة المستخدمين',
    settings: 'الإعدادات',
  };

  return (
    <div className="min-h-screen bg-background text-on-surface font-body">
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        'fixed inset-y-0 right-0 z-50 w-64 flex flex-col transition-transform duration-300',
        'bg-gradient-to-b from-blue-950 via-blue-900 to-blue-950',
        isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
      )}>
        {/* Logo */}
        <div className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/20">
              <Package size={22} className="text-white" />
            </div>
            <div>
              <h1 className="font-headline font-extrabold text-white text-base tracking-wide">المُنسق</h1>
              <p className="text-[10px] text-blue-300 font-medium mt-px">نظام إدارة المخزون</p>
            </div>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-1.5 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={18} className="text-blue-200" />
          </button>
        </div>

        {/* Divider */}
        <div className="mx-4 h-px bg-white/10 mb-3" />

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          <NavItem
            icon={<LayoutDashboard size={18} />}
            label="لوحة التحكم"
            active={currentPage === 'dashboard'}
            onClick={() => navigateTo('dashboard')}
          />
          <NavItem
            icon={<Package size={18} />}
            label="الأصناف"
            active={currentPage === 'inventory'}
            onClick={() => navigateTo('inventory')}
            badge={outOfStockCount > 0 ? outOfStockCount : undefined}
          />

          <div className="px-3 pt-4 pb-1">
            <p className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">الفواتير</p>
          </div>
          <NavItem
            icon={<ShoppingBag size={18} />}
            label="فواتير المبيعات"
            active={currentPage === 'sales'}
            onClick={() => navigateTo('sales')}
          />
          <NavItem
            icon={<ShoppingCart size={18} />}
            label="فواتير المشتريات"
            active={currentPage === 'purchases'}
            onClick={() => navigateTo('purchases')}
          />

          <div className="px-3 pt-4 pb-1">
            <p className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">تحليلات</p>
          </div>
          <NavItem
            icon={<BarChart3 size={18} />}
            label="التقارير"
            active={currentPage === 'reports'}
            onClick={() => navigateTo('reports')}
          />
          <NavItem
            icon={<Warehouse size={18} />}
            label="المخازن"
            active={currentPage === 'warehouses'}
            onClick={() => navigateTo('warehouses')}
          />

          <div className="px-3 pt-4 pb-1">
            <p className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">النظام</p>
          </div>
          <NavItem
            icon={<Users size={18} />}
            label="إدارة المستخدمين"
            active={currentPage === 'users'}
            onClick={() => navigateTo('users')}
          />
          <NavItem
            icon={<Settings size={18} />}
            label="الإعدادات"
            active={currentPage === 'settings'}
            onClick={() => navigateTo('settings')}
          />
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t border-white/10">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">م</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">مدير النظام</p>
              <p className="text-[10px] text-blue-300 truncate">admin@almunassiq.com</p>
            </div>
            <LogOut size={14} className="text-blue-300 flex-shrink-0" />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        'min-h-screen flex flex-col transition-all duration-300',
        isSidebarOpen ? 'lg:mr-64' : 'mr-0'
      )}>
        {/* Header */}
        <header className="sticky top-0 z-30 glass-panel border-b border-surface-container-high px-4 lg:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-surface-container-low rounded-xl transition-colors flex-shrink-0"
            >
              <Menu size={22} className="text-on-surface-variant" />
            </button>

            <div className="min-w-0">
              <h2 className="font-headline font-extrabold text-on-surface text-lg lg:text-xl leading-tight">
                {pageTitle[currentPage]}
              </h2>
            </div>

            {currentPage === 'inventory' && (
              <div className="hidden md:flex relative ml-2">
                <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60" />
                <input
                  type="text"
                  placeholder="بحث في الأصناف..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="bg-surface-container-low border border-surface-container-high rounded-xl pr-9 pl-10 py-2 w-64 focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm outline-none"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-error transition-colors">
                    <X size={14} />
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <IconButton icon={<Bell size={19} />} badge={alertsCount} />
            <IconButton icon={<Settings size={19} />} onClick={() => navigateTo('settings')} />
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center ml-1 cursor-pointer shadow-sm">
              <span className="text-white font-extrabold text-sm">م</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1">
          <AnimatePresence mode="wait">
            {currentPage === 'dashboard' && (
              <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                <Dashboard inventoryItems={inventoryItems} onNavigate={(page) => setCurrentPage(page as Page)} />
              </motion.div>
            )}
            {currentPage === 'purchases' && (
              <motion.div key="purchases" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                <PurchaseInvoices inventoryItems={inventoryItems} onInventoryUpdate={handleInventoryUpdate} />
              </motion.div>
            )}
            {currentPage === 'sales' && (
              <motion.div key="sales" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                <SalesInvoices inventoryItems={inventoryItems} onInventoryUpdate={handleInventoryUpdate} />
              </motion.div>
            )}
            {currentPage === 'reports' && (
              <motion.div key="reports" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                <Reports inventoryItems={inventoryItems} />
              </motion.div>
            )}
            {currentPage === 'warehouses' && (
              <motion.div key="warehouses" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                <Warehouses inventoryItems={inventoryItems} />
              </motion.div>
            )}
            {currentPage === 'users' && (
              <motion.div key="users" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                <UsersPage />
              </motion.div>
            )}
            {currentPage === 'settings' && (
              <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                <SettingsPage />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Inventory Page */}
          {currentPage === 'inventory' && <Inventory searchQuery={searchQuery} setSearchQuery={setSearchQuery} />}
        </div>
      </main>
    </div>
  );
}

// Main App Component with AuthProvider
export default function App() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <AppContent />
      </ProtectedRoute>
    </AuthProvider>
  );
}

