import React, { useState, useEffect } from 'react';
import {
  Search, Bell, Settings, LayoutDashboard, Package, Warehouse,
  BarChart3, Plus, ShoppingCart, ShoppingBag,
  X, Menu, LogOut, Users, User, Truck
} from 'lucide-react';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
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
import Customers from './Customers';
import Suppliers from './Suppliers';

// Import auth components
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './Login';

// Import API hooks
import { useInventory } from './hooks/useApi';

type Page = 'dashboard' | 'inventory' | 'purchases' | 'sales' | 'reports' | 'warehouses' | 'customers' | 'suppliers' | 'users' | 'settings';

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

// Sidebar and Header extracted to components/layout

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
  const { items: inventoryItems = [], loading: inventoryLoading, refetch: refetchInventory } = useInventory();

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
    customers: 'إدارة العملاء',
    suppliers: 'إدارة الموردين',
    users: 'إدارة المستخدمين',
    settings: 'الإعدادات',
  };

  return (
    <div className="min-h-screen bg-background text-on-surface font-body">
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

      {/* Sidebar (extracted) */}
      <Sidebar currentPage={currentPage} navigateTo={(p) => navigateTo(p as Page)} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} outOfStockCount={outOfStockCount} />

      {/* Main Content */}
      <main className={cn(
        'min-h-screen flex flex-col transition-all duration-300',
        isSidebarOpen ? 'lg:mr-64' : 'mr-0'
      )}>
        {/* Header (extracted) */}
        <Header currentPage={currentPage} pageTitle={pageTitle[currentPage]} isSidebarOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(s => !s)} searchQuery={searchQuery} setSearchQuery={setSearchQuery} alertsCount={alertsCount} navigateTo={(p) => navigateTo(p as Page)} />

        {/* Page Content */}
        <div className="flex-1">
          <AnimatePresence mode="wait">
            {currentPage === 'dashboard' && (
              <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                <Dashboard onNavigate={(page) => setCurrentPage(page as Page)} />
              </motion.div>
            )}
            {currentPage === 'purchases' && (
              <motion.div key="purchases" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                <PurchaseInvoices />
              </motion.div>
            )}
            {currentPage === 'sales' && (
              <motion.div key="sales" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                <SalesInvoices />
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
            {currentPage === 'customers' && (
              <motion.div key="customers" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                <Customers />
              </motion.div>
            )}
            {currentPage === 'suppliers' && (
              <motion.div key="suppliers" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                <Suppliers />
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

