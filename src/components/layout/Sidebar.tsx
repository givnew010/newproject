import React from 'react';
import {
  LayoutDashboard,
  Package,
  Warehouse,
  BarChart3,
  ShoppingBag,
  ShoppingCart,
  User,
  Truck,
  Users,
  Settings,
  LogOut,
  X,
  Menu,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'motion/react';
import { twMerge } from 'tailwind-merge';

type Page = 'dashboard' | 'inventory' | 'purchases' | 'sales' | 'reports' | 'warehouses' | 'customers' | 'suppliers' | 'users' | 'settings';

interface SidebarProps {
  currentPage: Page;
  navigateTo: (p: Page) => void;
  isOpen: boolean;
  onClose: () => void;
  toggleSidebar: () => void;
  outOfStockCount?: number;
  lowStockCount?: number;
}

function cn(...classes: Array<string | false | null | undefined>) {
  return twMerge(classes.filter(Boolean).join(' '));
}

function NavItem({ icon, label, active, onClick, badge, collapsed }: { icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void; badge?: number; collapsed?: boolean }) {
  const compact = !!collapsed;
  return (
    <button
      onClick={onClick}
      className={cn(
        compact
          ? 'w-full flex items-center justify-center h-10 transition-colors rounded-lg'
          : 'w-full flex items-center gap-3 px-3 h-10 rounded-xl text-sm font-medium transition-all text-right group relative',
        active ? (compact ? 'bg-white/10 text-white' : 'bg-white text-primary shadow-sm font-bold') : 'text-blue-100 hover:bg-white/15 hover:text-white'
      )}
      title={label}
    >
      <span className={cn('flex-shrink-0 transition-colors', active ? 'text-primary' : 'text-blue-200 group-hover:text-white')}>
        {icon}
      </span>
      {!compact && <span className="flex-1">{label}</span>}
      {!compact && badge !== undefined && badge > 0 && (
        <span className="flex-shrink-0 bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1">{badge}</span>
      )}
      {active && !compact && (
        <motion.div
          layoutId="activeIndicator"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-full"
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      )}
    </button>
  );
}

export default function Sidebar({ currentPage, navigateTo, isOpen, onClose, toggleSidebar, outOfStockCount = 0 }: SidebarProps) {
  const { logout } = useAuth();
  const lowStockCount = 0;
  const outCount = outOfStockCount || 0;

  const [openGroups, setOpenGroups] = React.useState({ contacts: false, invoices: false, analytics: false, system: false });

  const collapsed = !isOpen;

  const toggleGroup = (key: keyof typeof openGroups) => {
    setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <aside
      className={cn(
        'fixed inset-y-0 right-0 z-50 flex flex-col transition-all duration-300 text-white',
        isOpen ? 'w-64 translate-x-0' : 'w-16 lg:translate-x-0 translate-x-full'
      )}
      style={{ background: 'var(--gradient-sidebar)' }}
    >
      <div className={cn('flex items-center', collapsed ? 'justify-center p-2.5' : 'justify-between p-5')}>
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/20">
              <Package size={22} className="text-white" />
            </div>
            <div>
              <h1 className="font-headline font-extrabold text-white text-base tracking-wide">المُنسق</h1>
              <p className="text-[10px] text-blue-300 font-medium mt-px">نظام إدارة المخزون</p>
            </div>
          </div>
        )}

        <div className={cn('flex items-center', collapsed ? 'justify-center w-full' : 'gap-2')}>
          <button
            onClick={toggleSidebar}
            aria-label={isOpen ? 'إغلاق الشريط الجانبي' : 'فتح الشريط الجانبي'}
            title={isOpen ? 'إغلاق' : 'فتح'}
            className="hidden lg:flex w-9 h-9 rounded-lg items-center justify-center text-white hover:bg-white/10 transition-colors"
          >
            {isOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <button
            onClick={onClose}
            aria-label="إغلاق القائمة"
            className="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="mx-4 h-px bg-white/10 mb-3" />

      <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
        <div className="space-y-1">
          <NavItem icon={<LayoutDashboard size={18} />} label="لوحة التحكم" active={currentPage === 'dashboard'} onClick={() => navigateTo('dashboard')} collapsed={collapsed} />
          <NavItem icon={<Package size={18} />} label="الأصناف" active={currentPage === 'inventory'} onClick={() => navigateTo('inventory')} badge={outCount} collapsed={collapsed} />

          <div className="px-1">
            <button onClick={() => toggleGroup('contacts')} className={cn('w-full flex items-center gap-3 px-2 h-10 rounded-md text-sm font-semibold transition-all', openGroups.contacts && !collapsed ? 'text-primary' : 'text-blue-100 hover:bg-white/5')}>
              <span className={cn('flex-shrink-0')}>{/* icon */}<Users size={18} /></span>
              {!collapsed && <span className="flex-1 text-right">جهات الاتصال</span>}
              {!collapsed && <ChevronDown className={cn('transition-transform', openGroups.contacts && 'rotate-180')} />}
            </button>
            {!collapsed && openGroups.contacts && (
              <div className="mt-1 space-y-1">
                <NavItem icon={<User size={16} />} label="العملاء" active={currentPage === 'customers'} onClick={() => navigateTo('customers')} />
                <NavItem icon={<Truck size={16} />} label="الموردون" active={currentPage === 'suppliers'} onClick={() => navigateTo('suppliers')} />
              </div>
            )}
          </div>

          <div className="px-1">
            <button onClick={() => toggleGroup('invoices')} className={cn('w-full flex items-center gap-3 px-2 h-10 rounded-md text-sm font-semibold transition-all', openGroups.invoices && !collapsed ? 'text-primary' : 'text-blue-100 hover:bg-white/5')}>
              <span className={cn('flex-shrink-0')}><ShoppingBag size={18} /></span>
              {!collapsed && <span className="flex-1 text-right">الفواتير</span>}
              {!collapsed && <ChevronDown className={cn('transition-transform', openGroups.invoices && 'rotate-180')} />}
            </button>
            {!collapsed && openGroups.invoices && (
              <div className="mt-1 space-y-1">
                <NavItem icon={<ShoppingBag size={16} />} label="فواتير المبيعات" active={currentPage === 'sales'} onClick={() => navigateTo('sales')} />
                <NavItem icon={<ShoppingCart size={16} />} label="فواتير المشتريات" active={currentPage === 'purchases'} onClick={() => navigateTo('purchases')} />
              </div>
            )}
          </div>

          <div className="px-1">
            <button onClick={() => toggleGroup('analytics')} className={cn('w-full flex items-center gap-3 px-2 h-10 rounded-md text-sm font-semibold transition-all', openGroups.analytics && !collapsed ? 'text-primary' : 'text-blue-100 hover:bg-white/5')}>
              <span className={cn('flex-shrink-0')}><BarChart3 size={18} /></span>
              {!collapsed && <span className="flex-1 text-right">تحليلات</span>}
              {!collapsed && <ChevronDown className={cn('transition-transform', openGroups.analytics && 'rotate-180')} />}
            </button>
            {!collapsed && openGroups.analytics && (
              <div className="mt-1 space-y-1">
                <NavItem icon={<BarChart3 size={16} />} label="التقارير" active={currentPage === 'reports'} onClick={() => navigateTo('reports')} />
                <NavItem icon={<Warehouse size={16} />} label="المخازن" active={currentPage === 'warehouses'} onClick={() => navigateTo('warehouses')} />
              </div>
            )}
          </div>

          <div className="px-1">
            <button onClick={() => toggleGroup('system')} className={cn('w-full flex items-center gap-3 px-2 h-10 rounded-md text-sm font-semibold transition-all', openGroups.system && !collapsed ? 'text-primary' : 'text-blue-100 hover:bg-white/5')}>
              <span className={cn('flex-shrink-0')}><Settings size={18} /></span>
              {!collapsed && <span className="flex-1 text-right">النظام</span>}
              {!collapsed && <ChevronDown className={cn('transition-transform', openGroups.system && 'rotate-180')} />}
            </button>
            {!collapsed && openGroups.system && (
              <div className="mt-1 space-y-1">
                <NavItem icon={<Users size={16} />} label="إدارة المستخدمين" active={currentPage === 'users'} onClick={() => navigateTo('users')} />
                <NavItem icon={<Settings size={16} />} label="الإعدادات" active={currentPage === 'settings'} onClick={() => navigateTo('settings')} />
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="p-3 border-t border-white/10">
        <div className={cn('px-3 h-10 rounded-xl hover:bg-white/10 transition-colors', collapsed ? 'flex flex-col items-center' : 'flex items-center gap-3')}>
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">م</span>
          </div>

          {!collapsed ? (
            <>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">مدير النظام</p>
                <p className="text-[10px] text-blue-300 truncate">admin@almunassiq.com</p>
              </div>
              <button
                onClick={() => { logout(); }}
                aria-label="تسجيل الخروج"
                title="تسجيل الخروج"
                className={cn('rounded-full flex items-center justify-center text-white hover:bg-white/10 transition-colors', 'w-9 h-9')}
              >
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => { logout(); }}
                aria-label="تسجيل الخروج"
                title="تسجيل الخروج"
                className={cn('mt-2 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition-colors', 'w-8 h-8')}
              >
                <LogOut size={16} />
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
