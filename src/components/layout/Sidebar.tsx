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
  outOfStockCount?: number;
  lowStockCount?: number;
}

function cn(...classes: Array<string | false | null | undefined>) {
  return twMerge(classes.filter(Boolean).join(' '));
}

function NavItem({ icon, label, active, onClick, badge }: { icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void; badge?: number }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-right group relative',
        active ? 'bg-white text-primary shadow-sm font-bold' : 'text-blue-100 hover:bg-white/15 hover:text-white'
      )}
    >
      <span className={cn('flex-shrink-0 transition-colors', active ? 'text-primary' : 'text-blue-200 group-hover:text-white')}>
        {icon}
      </span>
      <span className="flex-1">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="flex-shrink-0 bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1">{badge}</span>
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

export default function Sidebar({ currentPage, navigateTo, isOpen, onClose, outOfStockCount = 0 }: SidebarProps) {
  const { logout } = useAuth();
  const lowStockCount = 0;
  const outCount = outOfStockCount || 0;

  return (
    <aside
      className={cn('fixed inset-y-0 right-0 z-50 w-64 flex flex-col transition-transform duration-300 text-white', isOpen ? 'translate-x-0' : 'translate-x-full')}
      style={{ background: 'var(--gradient-sidebar)' }}
    >
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
        <button onClick={onClose} className="lg:hidden p-1.5 hover:bg-white/10 rounded-lg transition-colors">
          <X size={18} className="text-blue-200" />
        </button>
      </div>

      <div className="mx-4 h-px bg-white/10 mb-3" />

      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        <NavItem icon={<LayoutDashboard size={18} />} label="لوحة التحكم" active={currentPage === 'dashboard'} onClick={() => navigateTo('dashboard')} />
        <NavItem icon={<Package size={18} />} label="الأصناف" active={currentPage === 'inventory'} onClick={() => navigateTo('inventory')} badge={outCount} />

        <div className="px-3 pt-4 pb-1">
          <p className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">جهات الاتصال</p>
        </div>
        <NavItem icon={<User size={18} />} label="العملاء" active={currentPage === 'customers'} onClick={() => navigateTo('customers')} />
        <NavItem icon={<Truck size={18} />} label="الموردون" active={currentPage === 'suppliers'} onClick={() => navigateTo('suppliers')} />

        <div className="px-3 pt-4 pb-1">
          <p className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">الفواتير</p>
        </div>
        <NavItem icon={<ShoppingBag size={18} />} label="فواتير المبيعات" active={currentPage === 'sales'} onClick={() => navigateTo('sales')} />
        <NavItem icon={<ShoppingCart size={18} />} label="فواتير المشتريات" active={currentPage === 'purchases'} onClick={() => navigateTo('purchases')} />

        <div className="px-3 pt-4 pb-1">
          <p className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">تحليلات</p>
        </div>
        <NavItem icon={<BarChart3 size={18} />} label="التقارير" active={currentPage === 'reports'} onClick={() => navigateTo('reports')} />
        <NavItem icon={<Warehouse size={18} />} label="المخازن" active={currentPage === 'warehouses'} onClick={() => navigateTo('warehouses')} />

        <div className="px-3 pt-4 pb-1">
          <p className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">النظام</p>
        </div>
        <NavItem icon={<Users size={18} />} label="إدارة المستخدمين" active={currentPage === 'users'} onClick={() => navigateTo('users')} />
        <NavItem icon={<Settings size={18} />} label="الإعدادات" active={currentPage === 'settings'} onClick={() => navigateTo('settings')} />
      </nav>

      <div className="p-3 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 transition-colors">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">م</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-white truncate">مدير النظام</p>
            <p className="text-[10px] text-blue-300 truncate">admin@almunassiq.com</p>
          </div>
          <button
            onClick={() => { logout(); }}
            aria-label="تسجيل الخروج"
            className="flex items-center gap-2 btn-secondary text-sm px-3 py-2.5 rounded-xl"
          >
            <LogOut size={16} />
            خروج
          </button>
        </div>
      </div>
    </aside>
  );
}
