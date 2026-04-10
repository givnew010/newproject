import React from 'react';
import { Eye, Edit2, Power } from 'lucide-react';
import { motion } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  lastLogin?: string;
  phone?: string;
  department?: string;
  joinDate?: string;
  avatar?: string;
}

const ROLE_CONFIG: Record<string, { label: string; color: string }> = {
  admin: { label: 'مسؤول', color: 'bg-red-100 text-red-700' },
  manager: { label: 'مدير', color: 'bg-amber-100 text-amber-700' },
  accountant: { label: 'محاسب', color: 'bg-blue-100 text-blue-700' },
  warehouse_keeper: { label: 'أمين مستودع', color: 'bg-emerald-100 text-emerald-700' },
  viewer: { label: 'مشاهد', color: 'bg-slate-100 text-slate-700' },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  active: { label: 'نشط', color: 'text-emerald-700', dot: 'bg-emerald-500' },
  inactive: { label: 'غير نشط', color: 'text-slate-500', dot: 'bg-slate-400' },
  suspended: { label: 'معلق', color: 'text-red-600', dot: 'bg-red-500' },
};

function getInitials(name: string) {
  return name.trim().split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('');
}

const AVATAR_COLORS = ['from-blue-500 to-blue-700','from-emerald-500 to-emerald-700','from-violet-500 to-violet-700','from-amber-500 to-amber-700','from-pink-500 to-pink-700'];

interface UserTableProps {
  users: User[];
  onView: (u: User) => void;
  onEdit: (u: User) => void;
  onToggle: (id: string) => void;
}

export function UserTable({ users, onView, onEdit, onToggle }: UserTableProps) {
  return (
    <div className="bg-white rounded-2xl border border-surface-container-high shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-right">
          <thead>
            <tr className="bg-surface-container-low/80 border-b border-surface-container-high">
              <th className="px-5 py-3.5 text-[11px] font-bold text-on-surface-variant uppercase">المستخدم</th>
              <th className="px-5 py-3.5 text-[11px] font-bold text-on-surface-variant uppercase hidden md:table-cell">الدور</th>
              <th className="px-5 py-3.5 text-[11px] font-bold text-on-surface-variant uppercase">الحالة</th>
              <th className="px-5 py-3.5 text-[11px] font-bold text-on-surface-variant uppercase hidden lg:table-cell">آخر تسجيل</th>
              <th className="px-5 py-3.5 text-[11px] font-bold text-on-surface-variant uppercase text-left">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr><td colSpan={5} className="py-16 text-center text-on-surface-variant text-sm">لا توجد نتائج</td></tr>
            ) : users.map((u, idx) => {
              const role = ROLE_CONFIG[u.role] ?? { label: u.role, color: 'bg-slate-100 text-slate-700' };
              const status = STATUS_CONFIG[u.status] ?? { label: u.status, color: 'text-slate-500', dot: 'bg-slate-400' };
              const colorIdx = idx % AVATAR_COLORS.length;
              return (
                <motion.tr
                  key={u.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.02 }}
                  className="border-b border-surface-container-low last:border-0 hover:bg-surface-container-low/40 transition-colors group"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-extrabold bg-gradient-to-br flex-shrink-0', AVATAR_COLORS[colorIdx])}>
                        {getInitials(u.name)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-on-surface">{u.name}</p>
                        <p className="text-[11px] text-on-surface-variant">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    <span className={cn('text-[11px] font-bold px-2.5 py-1 rounded-full', role.color)}>{role.label}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className={cn('w-2 h-2 rounded-full', status.dot)} />
                      <span className={cn('text-xs font-bold', status.color)}>{status.label}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 hidden lg:table-cell">
                    <p className="text-xs text-on-surface-variant">{u.lastLogin || '—'}</p>
                  </td>
                  <td className="px-5 py-3.5 text-left">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => onView(u)} className="p-2 rounded-xl text-on-surface-variant/40 hover:text-primary hover:bg-primary/10 transition-all">
                        <Eye size={15} />
                      </button>
                      <button onClick={() => onEdit(u)} className="p-2 rounded-xl text-on-surface-variant/40 hover:text-on-surface hover:bg-surface-container-low transition-all">
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => onToggle(u.id)}
                        title={u.status === 'active' ? 'تعطيل المستخدم' : 'تفعيل المستخدم'}
                        className={cn('p-2 rounded-xl transition-all', u.status === 'active' ? 'text-error/60 hover:text-error hover:bg-error/10' : 'text-success/60 hover:text-success hover:bg-success/10')}
                      >
                        <Power size={15} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default UserTable;
