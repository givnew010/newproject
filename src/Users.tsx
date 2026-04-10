import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, X } from 'lucide-react';
import { SystemUser, UserRole, UserStatus } from './types';
import { authToSystemUser } from './lib/user';
import { Button } from './components/ui';
import { UserStatsRow, UserTable, UserFormModal, UserViewDrawer } from './components/users';
import type { User, UserFormState } from './components/users';

const TODAY = new Date().toISOString().split('T')[0];

const INITIAL_USERS: SystemUser[] = [
  { id: 'usr-001', fullName: 'أحمد محمد العمري', email: 'ahmed.omari@almunassiq.com', phone: '0501234567', role: 'admin', status: 'active', department: 'تقنية المعلومات', createdAt: '2024-01-10', lastLogin: '2025-03-29' },
  { id: 'usr-002', fullName: 'سارة عبدالله المالكي', email: 'sara.maliki@almunassiq.com', phone: '0557654321', role: 'manager', status: 'active', department: 'الإدارة العامة', createdAt: '2024-02-15', lastLogin: '2025-03-28' },
  { id: 'usr-003', fullName: 'خالد ناصر الزهراني', email: 'khalid.zahrani@almunassiq.com', phone: '0509876543', role: 'accountant', status: 'active', department: 'المالية والمحاسبة', createdAt: '2024-03-01', lastLogin: '2025-03-27' },
  { id: 'usr-004', fullName: 'فاطمة يوسف القحطاني', email: 'fatima.qahtani@almunassiq.com', phone: '0554321098', role: 'sales' as any, status: 'active', department: 'المبيعات', createdAt: '2024-04-12', lastLogin: '2025-03-26' },
  { id: 'usr-005', fullName: 'عمر سعد البلوي', email: 'omar.balawi@almunassiq.com', phone: '0561234567', role: 'warehouse' as any, status: 'active', department: 'المستودعات', createdAt: '2024-05-20', lastLogin: '2025-03-25' },
  { id: 'usr-006', fullName: 'نور حسن العتيبي', email: 'nour.otibi@almunassiq.com', phone: '0507654321', role: 'viewer', status: 'inactive', department: 'المراجعة الداخلية', createdAt: '2024-06-08', lastLogin: '2025-02-14' },
];

function systemUserToUser(su: SystemUser): User {
  return {
    id: su.id,
    name: su.fullName,
    email: su.email,
    role: su.role,
    status: su.status,
    lastLogin: su.lastLogin,
    phone: su.phone,
    department: su.department,
    joinDate: su.createdAt,
  };
}

const emptyForm = (): UserFormState => ({ name: '', email: '', phone: '', department: '', role: 'viewer', status: 'active' });

export default function UsersPage() {
  const [users, setUsers] = useState<SystemUser[]>(() => {
    try {
      const stored = localStorage.getItem('system_users');
      if (stored) {
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) && parsed.length > 0 ? parsed.map(authToSystemUser) : INITIAL_USERS;
      }
    } catch { /* ignore */ }
    return INITIAL_USERS;
  });

  useEffect(() => {
    localStorage.setItem('system_users', JSON.stringify(users));
  }, [users]);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<UserFormState>(emptyForm());
  const [viewingId, setViewingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return users.filter(u => {
      const q = search.trim().toLowerCase();
      const matchesSearch = !q || u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.department.toLowerCase().includes(q);
      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  const admins = users.filter(u => u.role === 'admin').length;
  const managers = users.filter(u => u.role === 'manager').length;
  const inactive = users.filter(u => u.status !== 'active').length;

  const viewingUser = viewingId ? users.find(u => u.id === viewingId) : null;
  const viewingIndex = viewingId ? users.findIndex(u => u.id === viewingId) : 0;

  const openAdd = () => { setEditingId(null); setForm(emptyForm()); setIsFormOpen(true); };
  const openEdit = (user: User) => {
    const su = users.find(u => u.id === user.id);
    if (!su) return;
    setEditingId(su.id);
    setForm({ name: su.fullName, email: su.email, phone: su.phone, department: su.department, role: su.role, status: su.status });
    setIsFormOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.email.trim()) return;
    if (editingId) {
      setUsers(prev => prev.map(u => u.id === editingId
        ? { ...u, fullName: form.name, email: form.email, phone: form.phone, department: form.department, role: form.role as UserRole, status: form.status as UserStatus }
        : u
      ));
    } else {
      const newUser: SystemUser = {
        id: 'usr-' + Date.now(),
        fullName: form.name,
        email: form.email,
        phone: form.phone,
        role: form.role as UserRole,
        status: form.status as UserStatus,
        department: form.department,
        createdAt: TODAY,
      };
      setUsers(prev => [newUser, ...prev]);
    }
    setIsFormOpen(false);
  };

  const handleToggle = (id: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id !== id) return u;
      return { ...u, status: u.status === 'active' ? ('inactive' as UserStatus) : ('active' as UserStatus) };
    }));
  };

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2 flex-1 max-w-lg w-full">
          <div className="relative flex-1">
            <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60" />
            <input
              type="text"
              placeholder="بحث بالاسم أو البريد أو القسم..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white border border-surface-container-high rounded-xl pr-9 pl-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary transition-all shadow-sm"
            />
            {search && <button onClick={() => setSearch('')} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-error"><X size={14} /></button>}
          </div>
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="border border-surface-container-high rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary bg-white"
          >
            <option value="all">كل الأدوار</option>
            <option value="admin">مسؤول</option>
            <option value="manager">مدير</option>
            <option value="accountant">محاسب</option>
            <option value="warehouse_keeper">أمين مستودع</option>
            <option value="viewer">مشاهد</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="primary" onClick={openAdd}><Plus size={18} />إضافة مستخدم</Button>
        </div>
      </div>

      <UserStatsRow total={users.length} admins={admins} managers={managers} inactive={inactive} />

      <UserTable
        users={filtered.map(systemUserToUser)}
        onView={u => setViewingId(u.id)}
        onEdit={openEdit}
        onToggle={handleToggle}
      />

      {isFormOpen && (
        <UserFormModal
          isEditing={!!editingId}
          form={form}
          setForm={setForm}
          onSave={handleSave}
          onClose={() => setIsFormOpen(false)}
        />
      )}

      <UserViewDrawer
        user={viewingUser ? systemUserToUser(viewingUser) : null}
        userIndex={viewingIndex}
        onClose={() => setViewingId(null)}
      />
    </div>
  );
}
