import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus, Search, X, Edit2, Trash2, Eye, Shield, Users,
  UserCheck, UserX, UserMinus, Mail, Phone, Building2,
  ChevronLeft, ChevronRight, MoreVertical, CheckCircle2,
  Clock, AlertCircle, Filter, Download, Key, RefreshCw,
  Lock, Unlock, User as UserIcon, Crown, BookOpen,
  Warehouse, ShoppingBag, CalendarDays
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { SystemUser, UserRole, UserStatus } from './types';
import { authToSystemUser } from './lib/user';
import { Button, Input, Badge, KPICard } from './components/ui';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const TODAY = new Date().toISOString().split('T')[0];

/* ─── Seed Data ─────────────────────────────────────────── */
const INITIAL_USERS: SystemUser[] = [
  {
    id: 'usr-001',
    fullName: 'أحمد محمد العمري',
    email: 'ahmed.omari@almunassiq.com',
    phone: '0501234567',
    role: 'admin',
    status: 'active',
    department: 'تقنية المعلومات',
    createdAt: '2024-01-10',
    lastLogin: '2025-03-29',
    notes: 'مدير النظام الرئيسي',
  },
  {
    id: 'usr-002',
    fullName: 'سارة عبدالله المالكي',
    email: 'sara.maliki@almunassiq.com',
    phone: '0557654321',
    role: 'manager',
    status: 'active',
    department: 'الإدارة العامة',
    createdAt: '2024-02-15',
    lastLogin: '2025-03-28',
  },
  {
    id: 'usr-003',
    fullName: 'خالد ناصر الزهراني',
    email: 'khalid.zahrani@almunassiq.com',
    phone: '0509876543',
    role: 'accountant',
    status: 'active',
    department: 'المالية والمحاسبة',
    createdAt: '2024-03-01',
    lastLogin: '2025-03-27',
  },
  {
    id: 'usr-004',
    fullName: 'فاطمة يوسف القحطاني',
    email: 'fatima.qahtani@almunassiq.com',
    phone: '0554321098',
    role: 'sales',
    status: 'active',
    department: 'المبيعات',
    createdAt: '2024-04-12',
    lastLogin: '2025-03-26',
  },
  {
    id: 'usr-005',
    fullName: 'عمر سعد البلوي',
    email: 'omar.balawi@almunassiq.com',
    phone: '0561234567',
    role: 'warehouse',
    status: 'active',
    department: 'المستودعات',
    createdAt: '2024-05-20',
    lastLogin: '2025-03-25',
  },
  {
    id: 'usr-006',
    fullName: 'نور حسن العتيبي',
    email: 'nour.otibi@almunassiq.com',
    phone: '0507654321',
    role: 'viewer',
    status: 'inactive',
    department: 'المراجعة الداخلية',
    createdAt: '2024-06-08',
    lastLogin: '2025-02-14',
    notes: 'في إجازة حتى نهاية الشهر',
  },
  {
    id: 'usr-007',
    fullName: 'محمد إبراهيم الدوسري',
    email: 'mo.dosari@almunassiq.com',
    phone: '0503456789',
    role: 'sales',
    status: 'suspended',
    department: 'المبيعات',
    createdAt: '2024-07-15',
    lastLogin: '2025-01-10',
    notes: 'موقوف بسبب مخالفة السياسات',
  },
];

/* ─── Config Maps ─────────────────────────────────────────── */
const ROLE_CONFIG: Record<UserRole, {
  label: string; icon: React.ReactNode;
  badge: string; row: string; dot: string;
}> = {
  admin:      { label: 'مدير النظام',  icon: <Crown size={13} />,     badge: 'bg-violet-100 text-violet-700 border-violet-200',   row: 'bg-violet-50/30', dot: 'bg-violet-500' },
  manager:    { label: 'مدير',          icon: <Shield size={13} />,    badge: 'bg-blue-100 text-blue-700 border-blue-200',         row: 'bg-blue-50/20',   dot: 'bg-blue-500' },
  accountant: { label: 'محاسب',         icon: <BookOpen size={13} />,  badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', row: '',                dot: 'bg-emerald-500' },
  warehouse:  { label: 'أمين مستودع',   icon: <Warehouse size={13} />, badge: 'bg-amber-100 text-amber-700 border-amber-200',      row: '',                dot: 'bg-amber-500' },
  sales:      { label: 'مبيعات',        icon: <ShoppingBag size={13}/>, badge: 'bg-cyan-100 text-cyan-700 border-cyan-200',        row: '',                dot: 'bg-cyan-500' },
  viewer:     { label: 'مشاهد',         icon: <Eye size={13} />,       badge: 'bg-slate-100 text-slate-600 border-slate-200',      row: '',                dot: 'bg-slate-400' },
};

const STATUS_CONFIG: Record<UserStatus, {
  label: string; icon: React.ReactNode;
  badge: string; dot: string;
}> = {
  active:    { label: 'نشط',     icon: <CheckCircle2 size={12} />, badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  inactive:  { label: 'غير نشط', icon: <Clock size={12} />,        badge: 'bg-slate-50 text-slate-600 border-slate-200',      dot: 'bg-slate-400' },
  suspended: { label: 'موقوف',   icon: <AlertCircle size={12} />, badge: 'bg-red-50 text-red-600 border-red-200',            dot: 'bg-red-500' },
};

const ROLE_OPTIONS: UserRole[] = ['admin', 'manager', 'accountant', 'warehouse', 'sales', 'viewer'];
const DEPT_OPTIONS = ['تقنية المعلومات', 'الإدارة العامة', 'المالية والمحاسبة', 'المبيعات', 'المستودعات', 'المراجعة الداخلية', 'الموارد البشرية', 'خدمة العملاء'];

/* ─── Avatar Helper ───────────────────────────────────────── */
function getInitials(name: string) {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return parts[0][0] + parts[1][0];
  return name.slice(0, 2);
}

const AVATAR_COLORS = [
  'from-violet-500 to-violet-600',
  'from-blue-500 to-blue-600',
  'from-emerald-500 to-emerald-600',
  'from-amber-500 to-orange-500',
  'from-cyan-500 to-cyan-600',
  'from-pink-500 to-rose-500',
  'from-indigo-500 to-indigo-600',
];

function getAvatarColor(id: string) {
  const sum = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

/* ─── Sub-components ─────────────────────────────────────── */
function Avatar({ user, size = 'md' }: { user: SystemUser; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const sz = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base', xl: 'w-16 h-16 text-xl' }[size];
  return (
    <div className={cn('rounded-full bg-gradient-to-br flex items-center justify-center font-extrabold text-white flex-shrink-0 shadow-sm', sz, getAvatarColor(user.id))}>
      {getInitials(user.fullName)}
    </div>
  );
}

function StatusBadge({ status }: { status: UserStatus }) {
  const cfg = STATUS_CONFIG[status];
  const variantMap: Record<UserStatus, any> = { active: 'in-stock', inactive: 'slate', suspended: 'red' };
  return (
    <Badge variant={variantMap[status]}>
      {cfg.icon}{cfg.label}
    </Badge>
  );
}

function RoleBadge({ role }: { role: UserRole }) {
  const cfg = ROLE_CONFIG[role];
  const map: Record<UserRole, any> = {
    admin: 'violet', manager: 'blue', accountant: 'emerald', warehouse: 'amber', sales: 'cyan', viewer: 'slate'
  };
  return (
    <Badge variant={map[role]}>
      {cfg.icon}{cfg.label}
    </Badge>
  );
}

interface FormState {
  fullName: string; email: string; phone: string;
  role: UserRole; status: UserStatus; department: string;
  notes: string;
}
const emptyForm = (): FormState => ({
  fullName: '', email: '', phone: '',
  role: 'viewer', status: 'active', department: '',
  notes: '',
});

/* ─── Main Component ─────────────────────────────────────── */
export default function UsersPage() {
  const [users, setUsers] = useState<SystemUser[]>(() => {
    try {
      const saved = localStorage.getItem('system_users');
      if (!saved) return INITIAL_USERS;
      const parsed = JSON.parse(saved) as any[];
      // Normalize any incoming objects (support older/auth shapes)
      return parsed.map(p => {
        // If already looks like SystemUser, keep as-is
        if (p && typeof p.fullName === 'string' && typeof p.email === 'string') return p as SystemUser;
        return authToSystemUser(p);
      });
    } catch {
      return INITIAL_USERS;
    }
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | UserRole>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | UserStatus>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());

  const [viewingUser, setViewingUser] = useState<SystemUser | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [showPasswordReset, setShowPasswordReset] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('system_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    const close = () => setMenuOpen(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  // Show success message briefly
  const flash = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 2500);
  };

  /* ─── Stats ─── */
  const totalUsers = users.length;
  const activeCount = users.filter(u => u.status === 'active').length;
  const inactiveCount = users.filter(u => u.status === 'inactive').length;
  const suspendedCount = users.filter(u => u.status === 'suspended').length;
  const adminCount = users.filter(u => u.role === 'admin').length;

  /* ─── Filtered List ─── */
  const displayed = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return users.filter(u => {
      const matchSearch = !q || u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.department.toLowerCase().includes(q);
      const matchRole = filterRole === 'all' || u.role === filterRole;
      const matchStatus = filterStatus === 'all' || u.status === filterStatus;
      return matchSearch && matchRole && matchStatus;
    });
  }, [users, searchQuery, filterRole, filterStatus]);

  /* ─── CRUD ─── */
  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm());
    setIsModalOpen(true);
  };

  const openEdit = (user: SystemUser) => {
    setEditingId(user.id);
    setForm({
      fullName: user.fullName, email: user.email, phone: user.phone,
      role: user.role, status: user.status, department: user.department,
      notes: user.notes ?? '',
    });
    setIsModalOpen(true);
    setMenuOpen(null);
    setViewingUser(null);
  };

  const handleSave = () => {
    if (!form.fullName || !form.email) return;
    if (editingId) {
      setUsers(us => us.map(u =>
        u.id === editingId ? { ...u, ...form } : u
      ));
      flash('تم تحديث بيانات المستخدم بنجاح');
    } else {
      const newUser: SystemUser = {
        id: 'usr-' + Math.random().toString(36).substr(2, 6),
        ...form,
        createdAt: TODAY,
      };
      setUsers(us => [newUser, ...us]);
      flash('تم إضافة المستخدم بنجاح');
    }
    setIsModalOpen(false);
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    setUsers(us => us.filter(u => u.id !== deleteId));
    if (viewingUser?.id === deleteId) setViewingUser(null);
    setDeleteId(null);
    flash('تم حذف المستخدم بنجاح');
  };

  const toggleStatus = (id: string, next: UserStatus) => {
    setUsers(us => us.map(u => u.id === id ? { ...u, status: next } : u));
    setMenuOpen(null);
    if (viewingUser?.id === id) setViewingUser(v => v ? { ...v, status: next } : null);
    flash('تم تحديث حالة المستخدم');
  };

  const clearFilters = () => { setSearchQuery(''); setFilterRole('all'); setFilterStatus('all'); };
  const hasFilters = searchQuery || filterRole !== 'all' || filterStatus !== 'all';

  /* ─── Render ─── */
  return (
    <div className="p-4 lg:p-6 space-y-5">

      {/* Success Flash */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] bg-success text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-sm font-bold"
          >
            <CheckCircle2 size={16} />
            {successMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Stats Cards ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard title="إجمالي المستخدمين" value={totalUsers} subtitle="مستخدم مسجّل" gradient="blue" icon={<Users size={18} />} />
        <KPICard title="المستخدمون النشطون" value={activeCount} subtitle={`${Math.round((activeCount / (totalUsers || 1)) * 100)}% من المجموع`} gradient="emerald" icon={<UserCheck size={18} />} />
        <KPICard title="المديرون والإداريون" value={adminCount + users.filter(u => u.role === 'manager').length} subtitle={`${adminCount} مدير نظام + ${users.filter(u => u.role === 'manager').length} مدير`} gradient="purple" icon={<Crown size={18} />} />
        <KPICard title="غير نشط / موقوف" value={inactiveCount + suspendedCount} subtitle={`${inactiveCount} غير نشط · ${suspendedCount} موقوف`} gradient="red" icon={<UserMinus size={18} />} />
      </div>

      {/* ─── Toolbar ─── */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        {/* Search */}
        <div className="flex items-center gap-2 flex-1 max-w-sm w-full">
          <div className="relative flex-1">
            <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60" />
            <input
              type="text"
              placeholder="بحث بالاسم أو البريد أو القسم..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="input-field pr-9"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-error">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter Dropdown */}
          <div className="relative">
            <button
              onClick={e => { e.stopPropagation(); setIsFilterOpen(!isFilterOpen); }}
              className={cn(
                'flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all shadow-sm',
                hasFilters
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-on-surface-variant border-surface-container-high hover:bg-surface-container-low'
              )}
            >
              <Filter size={15} />
              {hasFilters && <span className="w-1.5 h-1.5 bg-white/60 rounded-full" />}
            </button>
            <AnimatePresence>
              {isFilterOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  onClick={e => e.stopPropagation()}
                  className="absolute top-full mt-2 right-0 w-64 bg-white rounded-2xl shadow-xl border border-surface-container-high z-30 p-3 space-y-3"
                >
                  <p className="text-xs font-extrabold text-on-surface px-1">تصفية المستخدمين</p>
                  <div>
                    <p className="text-[11px] font-bold text-on-surface-variant mb-1.5 px-1">الدور الوظيفي</p>
                    <div className="grid grid-cols-2 gap-1">
                      {(['all', ...ROLE_OPTIONS] as const).map(role => (
                        <button
                          key={role}
                          onClick={() => setFilterRole(role)}
                          className={cn(
                            'text-right px-3 py-1.5 rounded-xl text-xs font-medium transition-all border',
                            filterRole === role
                              ? 'bg-primary text-white border-primary'
                              : 'border-surface-container-high hover:bg-surface-container-low text-on-surface'
                          )}
                        >
                          {role === 'all' ? 'الكل' : ROLE_CONFIG[role].label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-on-surface-variant mb-1.5 px-1">الحالة</p>
                    <div className="flex gap-1">
                      {(['all', 'active', 'inactive', 'suspended'] as const).map(s => (
                        <button
                          key={s}
                          onClick={() => setFilterStatus(s)}
                          className={cn(
                            'flex-1 py-1.5 rounded-xl text-xs font-medium transition-all border',
                            filterStatus === s
                              ? 'bg-primary text-white border-primary'
                              : 'border-surface-container-high hover:bg-surface-container-low text-on-surface'
                          )}
                        >
                          {s === 'all' ? 'الكل' : STATUS_CONFIG[s].label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {hasFilters && (
                    <button onClick={() => { clearFilters(); setIsFilterOpen(false); }}
                      className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-error hover:bg-red-50 rounded-xl transition-colors border border-red-200">
                      <X size={12} /> مسح الفلاتر
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button variant="secondary" size="sm" className="text-xs py-2 px-4">
            <Download size={15} />
            تصدير
          </Button>
          <Button variant="primary" size="sm" className="text-xs py-2 px-4" onClick={openAdd}>
            <Plus size={18} />
            إضافة مستخدم
          </Button>
        </div>
      </div>

      {/* ─── Results Info ─── */}
      {hasFilters && (
        <div className="flex items-center gap-2 text-xs text-on-surface-variant">
          <span>تعرض {displayed.length} من {totalUsers} مستخدم</span>
          <button onClick={clearFilters} className="text-primary font-bold hover:underline">· مسح الفلاتر</button>
        </div>
      )}

      {/* ─── Users Table ─── */}
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-surface-container-high">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-surface-container-low/80 border-b border-surface-container-high">
                <th className="px-5 py-3.5 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">المستخدم</th>
                <th className="px-5 py-3.5 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider hidden md:table-cell">القسم</th>
                <th className="px-5 py-3.5 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider hidden sm:table-cell">الدور</th>
                <th className="px-5 py-3.5 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">الحالة</th>
                <th className="px-5 py-3.5 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider hidden lg:table-cell">آخر تسجيل</th>
                <th className="px-5 py-3.5 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider text-left">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {displayed.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3 text-on-surface-variant">
                      <div className="w-16 h-16 rounded-2xl bg-surface-container-low flex items-center justify-center">
                        <Users size={32} className="opacity-25" />
                      </div>
                      <p className="text-sm font-medium">لا يوجد مستخدمون مطابقون</p>
                      {hasFilters && (
                        <button onClick={clearFilters} className="text-xs text-primary font-bold hover:underline">
                          مسح الفلاتر
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                displayed.map((user, idx) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.04 }}
                    className="border-b border-surface-container-low last:border-0 hover:bg-surface-container-low/30 transition-colors group cursor-pointer"
                    onClick={() => setViewingUser(user)}
                  >
                    {/* User Info */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar user={user} size="md" />
                            <span className={cn(
                              'absolute -bottom-0.5 -left-0.5 w-3 h-3 rounded-full border-2 border-white',
                              user.status === 'active' ? 'bg-success' : user.status === 'inactive' ? 'bg-slate-400' : 'bg-error'
                            )} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-on-surface truncate">{user.fullName}</p>
                          <p className="text-[11px] text-on-surface-variant truncate">{user.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Department */}
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <div className="flex items-center gap-1.5 text-on-surface-variant">
                        <Building2 size={13} className="flex-shrink-0 text-on-surface-variant/60" />
                        <span className="text-xs font-medium">{user.department || '—'}</span>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-5 py-3.5 hidden sm:table-cell">
                      <RoleBadge role={user.role} />
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5">
                      <StatusBadge status={user.status} />
                    </td>

                    {/* Last Login */}
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      {user.lastLogin ? (
                        <div className="flex items-center gap-1.5 text-on-surface-variant">
                          <CalendarDays size={12} className="flex-shrink-0" />
                          <span className="text-xs">{user.lastLogin}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-on-surface-variant/40">لم يسجل دخولاً</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-left" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setViewingUser(user)}
                          className="p-2 rounded-xl text-on-surface-variant/40 hover:text-primary hover:bg-primary-fixed/50 transition-all opacity-0 group-hover:opacity-100"
                          title="عرض"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => openEdit(user)}
                          className="p-2 rounded-xl text-on-surface-variant/40 hover:text-primary hover:bg-primary-fixed/50 transition-all opacity-0 group-hover:opacity-100"
                          title="تعديل"
                        >
                          <Edit2 size={15} />
                        </button>

                        {/* Three-dot menu */}
                        <div className="relative">
                          <button
                            onClick={e => { e.stopPropagation(); setMenuOpen(menuOpen === user.id ? null : user.id); }}
                            className="p-2 rounded-xl text-on-surface-variant/50 hover:text-on-surface hover:bg-surface-container-low transition-all"
                          >
                            <MoreVertical size={15} />
                          </button>
                          <AnimatePresence>
                            {menuOpen === user.id && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="absolute left-0 top-full mt-1 bg-white rounded-2xl shadow-xl border border-surface-container-high z-30 w-48 py-1 overflow-hidden"
                              >
                                <MenuItem icon={<Edit2 size={14} />} label="تعديل البيانات" color="text-primary" onClick={() => openEdit(user)} />
                                <MenuItem icon={<Key size={14} />} label="إعادة تعيين كلمة المرور" color="text-amber-600" onClick={() => { setShowPasswordReset(user.id); setMenuOpen(null); }} />
                                <div className="border-t border-surface-container-low my-1" />
                                {user.status !== 'active' && (
                                  <MenuItem icon={<Unlock size={14} />} label="تفعيل الحساب" color="text-emerald-700" onClick={() => toggleStatus(user.id, 'active')} />
                                )}
                                {user.status === 'active' && (
                                  <MenuItem icon={<Lock size={14} />} label="تعطيل الحساب" color="text-slate-600" onClick={() => toggleStatus(user.id, 'inactive')} />
                                )}
                                {user.status !== 'suspended' && (
                                  <MenuItem icon={<UserX size={14} />} label="تعليق الحساب" color="text-orange-600" onClick={() => toggleStatus(user.id, 'suspended')} />
                                )}
                                <div className="border-t border-surface-container-low my-1" />
                                <MenuItem icon={<Trash2 size={14} />} label="حذف المستخدم" color="text-error" onClick={() => { setDeleteId(user.id); setMenuOpen(null); }} />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        {displayed.length > 0 && (
          <div className="px-5 py-3.5 bg-surface-container-low/50 border-t border-surface-container-high flex items-center justify-between">
            <span className="text-xs text-on-surface-variant font-medium">
              {displayed.length} مستخدم من أصل {totalUsers}
            </span>
            <div className="flex items-center gap-1.5">
              <button className="p-1.5 rounded-lg border border-surface-container-high hover:bg-white transition-all disabled:opacity-40">
                <ChevronRight size={16} />
              </button>
              <span className="text-xs text-on-surface-variant px-2">1</span>
              <button className="p-1.5 rounded-lg border border-surface-container-high bg-white shadow-sm hover:bg-surface-container-low transition-all disabled:opacity-40">
                <ChevronLeft size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Role Cards Summary ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {ROLE_OPTIONS.map(role => {
          const count = users.filter(u => u.role === role).length;
          const cfg = ROLE_CONFIG[role];
          const roleMap: Record<UserRole, any> = { admin: 'violet', manager: 'blue', accountant: 'emerald', warehouse: 'amber', sales: 'cyan', viewer: 'slate' };
          return (
            <motion.button
              key={role}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setFilterRole(filterRole === role ? 'all' : role)}
              className={cn(
                'bg-white rounded-2xl border p-3.5 text-right transition-all shadow-sm',
                filterRole === role ? 'ring-2 ring-primary border-primary shadow-md' : 'border-surface-container-high hover:border-primary/30'
              )}
            >
              <div className="mb-2.5">
                <Badge variant={roleMap[role]} className="px-2 py-2">
                  {React.cloneElement(cfg.icon as React.ReactElement, { size: 16 })}
                </Badge>
              </div>
              <p className="text-2xl font-extrabold text-on-surface">{count}</p>
              <p className="text-[11px] text-on-surface-variant font-medium mt-0.5">{cfg.label}</p>
            </motion.button>
          );
        })}
      </div>

      {/* ─── View User Drawer ─── */}
      <AnimatePresence>
        {viewingUser && (
          <div className="fixed inset-0 z-[60] flex items-start justify-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setViewingUser(null)}
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="relative z-[70] w-full max-w-sm h-full bg-white shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Drawer Header */}
              <div className="bg-gradient-to-b from-blue-950 to-blue-900 px-5 py-6 flex flex-col items-center text-center relative">
                <button onClick={() => setViewingUser(null)}
                  className="absolute top-4 left-4 p-1.5 hover:bg-white/10 rounded-xl transition-colors">
                  <X size={18} className="text-white/70" />
                </button>
                <Avatar user={viewingUser} size="xl" />
                <h3 className="font-extrabold text-white text-base mt-3">{viewingUser.fullName}</h3>
                <p className="text-blue-300 text-xs mt-0.5">{viewingUser.email}</p>
                <div className="flex items-center gap-2 mt-3">
                  <RoleBadge role={viewingUser.role} />
                  <StatusBadge status={viewingUser.status} />
                </div>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                <InfoRow icon={<Building2 size={15} />} label="القسم" value={viewingUser.department || '—'} />
                <InfoRow icon={<Phone size={15} />} label="الهاتف" value={viewingUser.phone || '—'} mono />
                <InfoRow icon={<CalendarDays size={15} />} label="تاريخ الإنشاء" value={viewingUser.createdAt} />
                <InfoRow icon={<Clock size={15} />} label="آخر تسجيل دخول" value={viewingUser.lastLogin ?? 'لم يسجل بعد'} />
                {viewingUser.notes && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                    <p className="text-xs font-bold text-amber-700 mb-1">ملاحظات</p>
                    <p className="text-xs text-amber-800 leading-relaxed">{viewingUser.notes}</p>
                  </div>
                )}

                {/* Permissions Visual */}
                <div className="bg-surface-container-low rounded-2xl p-4">
                  <p className="text-xs font-extrabold text-on-surface mb-3 flex items-center gap-2">
                    <Shield size={13} className="text-primary" /> صلاحيات الدور
                  </p>
                  <div className="space-y-2">
                    {getPermissions(viewingUser.role).map(perm => (
                      <div key={perm.label} className="flex items-center justify-between">
                        <span className="text-xs text-on-surface-variant">{perm.label}</span>
                        <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', perm.allowed ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500')}>
                          {perm.allowed ? '✓ مسموح' : '✗ محظور'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-surface-container-low space-y-2">
                <button
                  onClick={() => openEdit(viewingUser)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-dark transition-all shadow-lg shadow-primary/20"
                >
                  <Edit2 size={15} /> تعديل البيانات
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowPasswordReset(viewingUser.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 text-xs font-bold transition-colors"
                  >
                    <Key size={13} /> إعادة تعيين كلمة المرور
                  </button>
                  <button
                    onClick={() => { setDeleteId(viewingUser.id); setViewingUser(null); }}
                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Add / Edit Modal ─── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative z-[70] w-full max-w-lg max-h-[92vh] bg-white shadow-2xl flex flex-col rounded-3xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="px-6 py-5 border-b border-surface-container-low flex items-center justify-between flex-shrink-0 bg-gradient-to-l from-blue-50 to-white">
                <div>
                  <h2 className="font-extrabold text-on-surface text-base">
                    {editingId ? 'تعديل بيانات المستخدم' : 'إضافة مستخدم جديد'}
                  </h2>
                  <p className="text-[11px] text-on-surface-variant mt-0.5">
                    {editingId ? 'عدّل المعلومات ثم احفظ' : 'أكمل البيانات لإنشاء الحساب'}
                  </p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-surface-container-low rounded-xl transition-colors">
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* Avatar Preview */}
                {form.fullName && (
                  <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-2xl">
                    <div className={cn('w-12 h-12 rounded-full bg-gradient-to-br flex items-center justify-center font-extrabold text-white text-base flex-shrink-0', AVATAR_COLORS[0])}>
                      {getInitials(form.fullName)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-on-surface">{form.fullName}</p>
                      <p className="text-xs text-on-surface-variant">{form.email || 'البريد الإلكتروني'}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-on-surface-variant">الاسم الكامل *</label>
                    <input type="text" placeholder="الاسم الثلاثي أو الرباعي" value={form.fullName}
                      onChange={e => setForm({ ...form, fullName: e.target.value })}
                      className="w-full bg-surface-container-low border border-surface-container-high rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-on-surface-variant">البريد الإلكتروني *</label>
                    <div className="relative">
                      <Mail size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60" />
                      <input type="email" placeholder="user@company.com" value={form.email} dir="ltr"
                        onChange={e => setForm({ ...form, email: e.target.value })}
                        className="w-full bg-surface-container-low border border-surface-container-high rounded-xl pr-9 pl-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-left"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-on-surface-variant">رقم الهاتف</label>
                    <div className="relative">
                      <Phone size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60" />
                      <input type="tel" placeholder="05XXXXXXXX" value={form.phone} dir="ltr"
                        onChange={e => setForm({ ...form, phone: e.target.value })}
                        className="w-full bg-surface-container-low border border-surface-container-high rounded-xl pr-9 pl-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                      />
                    </div>
                  </div>

                  {/* Role Select */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-on-surface-variant">الدور الوظيفي</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {ROLE_OPTIONS.map(role => (
                        <button
                          key={role}
                          onClick={() => setForm({ ...form, role })}
                          className={cn(
                            'flex items-center gap-1.5 px-2.5 py-2 rounded-xl border text-xs font-medium transition-all',
                            form.role === role
                              ? 'bg-primary text-white border-primary shadow-sm'
                              : 'border-surface-container-high hover:bg-surface-container-low text-on-surface-variant'
                          )}
                        >
                          {React.cloneElement(ROLE_CONFIG[role].icon as React.ReactElement, { size: 12 })}
                          {ROLE_CONFIG[role].label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Status Select */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-on-surface-variant">حالة الحساب</label>
                    <div className="space-y-1.5">
                      {(['active', 'inactive', 'suspended'] as const).map(s => (
                        <button
                          key={s}
                          onClick={() => setForm({ ...form, status: s })}
                          className={cn(
                            'w-full flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all text-right',
                            form.status === s
                              ? 'bg-primary text-white border-primary shadow-sm'
                              : 'border-surface-container-high hover:bg-surface-container-low text-on-surface-variant'
                          )}
                        >
                          <span className={cn('w-2 h-2 rounded-full flex-shrink-0', form.status === s ? 'bg-white' : STATUS_CONFIG[s].dot)} />
                          {STATUS_CONFIG[s].label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Department */}
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-on-surface-variant">القسم / الإدارة</label>
                    <select
                      value={form.department}
                      onChange={e => setForm({ ...form, department: e.target.value })}
                      className="w-full bg-surface-container-low border border-surface-container-high rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all appearance-none"
                    >
                      <option value="">— اختر القسم —</option>
                      {DEPT_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>

                  {/* Notes */}
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-on-surface-variant">ملاحظات</label>
                    <textarea
                      rows={2}
                      placeholder="أي ملاحظات تتعلق بالمستخدم..."
                      value={form.notes}
                      onChange={e => setForm({ ...form, notes: e.target.value })}
                      className="w-full bg-surface-container-low border border-surface-container-high rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-5 border-t border-surface-container-low flex gap-3 flex-shrink-0">
                <Button variant="outline" className="flex-1 py-3" onClick={() => setIsModalOpen(false)}>إلغاء</Button>
                <Button variant="primary" className="flex-1 py-3" onClick={handleSave} disabled={!form.fullName || !form.email}>
                  <CheckCircle2 size={16} />
                  {editingId ? 'حفظ التعديلات' : 'إضافة المستخدم'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Password Reset Modal ─── */}
      <AnimatePresence>
        {showPasswordReset && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowPasswordReset(null)}
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', damping: 25, stiffness: 400 }}
              className="relative z-[80] w-full max-w-sm bg-white shadow-2xl rounded-3xl p-6 text-center"
            >
              <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Key size={26} className="text-amber-600" />
              </div>
              <h3 className="text-base font-extrabold text-on-surface mb-2">إعادة تعيين كلمة المرور</h3>
              <p className="text-sm text-on-surface-variant mb-6">
                سيتم إرسال رابط إعادة تعيين كلمة المرور إلى بريد المستخدم الإلكتروني.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 py-3" onClick={() => setShowPasswordReset(null)}>إلغاء</Button>
                <Button variant="primary" className="flex-1 py-3" onClick={() => { setShowPasswordReset(null); flash('تم إرسال رابط إعادة التعيين بنجاح'); }}>إرسال الرابط</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Delete Confirmation ─── */}
      <AnimatePresence>
        {deleteId && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDeleteId(null)}
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', damping: 25, stiffness: 400 }}
              className="relative z-[80] w-full max-w-sm bg-white shadow-2xl rounded-3xl p-6 text-center"
            >
              {(() => {
                const u = users.find(u => u.id === deleteId);
                return u ? (
                  <>
                    <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Trash2 size={26} className="text-red-600" />
                    </div>
                    <h3 className="text-base font-extrabold text-on-surface mb-1">حذف المستخدم</h3>
                    <p className="text-sm text-on-surface-variant mb-1">
                      هل أنت متأكد من حذف <span className="font-bold text-on-surface">{u.fullName}</span>؟
                    </p>
                    <p className="text-xs text-on-surface-variant/70 mb-6">لا يمكن التراجع عن هذا الإجراء.</p>
                    <div className="flex gap-3">
                      <Button variant="outline" className="flex-1 py-3" onClick={() => setDeleteId(null)}>إلغاء</Button>
                      <Button variant="danger" className="flex-1 py-3" onClick={confirmDelete}>تأكيد الحذف</Button>
                    </div>
                  </>
                ) : null;
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Helper Components ──────────────────────────────────── */
function MenuItem({ icon, label, color, onClick }: { icon: React.ReactNode; label: string; color: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn('w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium hover:bg-surface-container-low transition-colors text-right', color)}
    >
      {icon}{label}
    </button>
  );
}

function InfoRow({ icon, label, value, mono }: { icon: React.ReactNode; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-surface-container-low last:border-0">
      <div className="flex items-center gap-2 text-on-surface-variant">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <span className={cn('text-sm font-bold text-on-surface', mono && 'font-mono')}>{value}</span>
    </div>
  );
}

/* ─── Permissions Map ────────────────────────────────────── */
function getPermissions(role: UserRole) {
  const all = [
    { label: 'إدارة المستخدمين',       admin: true,  manager: false, accountant: false, warehouse: false, sales: false, viewer: false },
    { label: 'إدارة الأصناف',           admin: true,  manager: true,  accountant: false, warehouse: true,  sales: false, viewer: false },
    { label: 'فواتير المبيعات',          admin: true,  manager: true,  accountant: true,  warehouse: false, sales: true,  viewer: false },
    { label: 'فواتير المشتريات',         admin: true,  manager: true,  accountant: true,  warehouse: true,  sales: false, viewer: false },
    { label: 'التقارير المالية',          admin: true,  manager: true,  accountant: true,  warehouse: false, sales: false, viewer: true  },
    { label: 'إعدادات النظام',           admin: true,  manager: false, accountant: false, warehouse: false, sales: false, viewer: false },
  ];
  return all.map(p => ({ label: p.label, allowed: p[role] }));
}
