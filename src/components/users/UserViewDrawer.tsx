import React from 'react';
import { X, Mail, Phone, Building, Calendar, Shield, Activity, Key } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { User } from './UserTable';

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

const ROLE_CONFIG: Record<string, { label: string; color: string }> = {
  admin: { label: 'مسؤول', color: 'bg-red-100 text-red-700' },
  manager: { label: 'مدير', color: 'bg-amber-100 text-amber-700' },
  accountant: { label: 'محاسب', color: 'bg-blue-100 text-blue-700' },
  warehouse_keeper: { label: 'أمين مستودع', color: 'bg-emerald-100 text-emerald-700' },
  viewer: { label: 'مشاهد', color: 'bg-slate-100 text-slate-700' },
};

const PERMISSIONS: Record<string, string[]> = {
  admin: ['الوصول الكامل للنظام', 'إدارة المستخدمين', 'تعديل الإعدادات', 'عرض التقارير'],
  manager: ['إدارة المبيعات', 'إدارة المشتريات', 'إدارة المخزون', 'عرض التقارير'],
  accountant: ['إدارة الفواتير', 'تسجيل المدفوعات', 'عرض التقارير المالية'],
  warehouse_keeper: ['إدارة المخزون', 'إدارة المستودعات'],
  viewer: ['عرض البيانات فقط'],
};

function getInitials(name: string) {
  return name.trim().split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('');
}

const AVATAR_COLORS = ['from-blue-500 to-blue-700', 'from-emerald-500 to-emerald-700', 'from-violet-500 to-violet-700', 'from-amber-500 to-amber-700'];

interface UserViewDrawerProps {
  user: User | null;
  userIndex: number;
  onClose: () => void;
}

export function UserViewDrawer({ user, userIndex, onClose }: UserViewDrawerProps) {
  return (
    <AnimatePresence>
      {user && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: -350, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -350, opacity: 0 }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed top-0 left-0 bottom-0 z-[70] w-80 bg-white shadow-2xl flex flex-col overflow-hidden"
          >
            <div className={cn('h-28 bg-gradient-to-br flex items-end p-5', AVATAR_COLORS[userIndex % AVATAR_COLORS.length])}>
              <button onClick={onClose} className="absolute top-4 left-4 p-2 bg-white/20 rounded-xl hover:bg-white/30 transition-colors">
                <X size={14} className="text-white" />
              </button>
              <div className="flex items-end gap-3">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-base font-extrabold text-primary shadow-lg">
                  {getInitials(user.name)}
                </div>
                <div className="pb-0.5">
                  <p className="text-white font-extrabold text-base">{user.name}</p>
                  <span className={cn('text-[11px] font-bold px-2 py-0.5 rounded-full', ROLE_CONFIG[user.role]?.color ?? 'bg-slate-100 text-slate-700')}>
                    {ROLE_CONFIG[user.role]?.label ?? user.role}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Contact */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-extrabold text-on-surface-variant uppercase">معلومات التواصل</h4>
                {[
                  { icon: <Mail size={14} />, label: 'البريد', val: user.email },
                  { icon: <Phone size={14} />, label: 'الهاتف', val: user.phone || '—' },
                  { icon: <Building size={14} />, label: 'القسم', val: user.department || '—' },
                  { icon: <Calendar size={14} />, label: 'تاريخ الانضمام', val: user.joinDate || '—' },
                  { icon: <Activity size={14} />, label: 'آخر تسجيل', val: user.lastLogin || '—' },
                ].map(({ icon, label, val }) => (
                  <div key={label} className="flex items-center gap-3 p-3 bg-surface-container-low rounded-xl">
                    <span className="text-on-surface-variant">{icon}</span>
                    <div>
                      <p className="text-[10px] text-on-surface-variant">{label}</p>
                      <p className="text-xs font-bold text-on-surface">{val}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Permissions */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Key size={13} className="text-primary" />
                  <h4 className="text-[11px] font-extrabold text-on-surface-variant uppercase">الصلاحيات</h4>
                </div>
                <div className="space-y-2">
                  {(PERMISSIONS[user.role] ?? []).map(perm => (
                    <div key={perm} className="flex items-center gap-2 text-xs text-on-surface bg-emerald-50 text-emerald-700 px-3 py-2 rounded-lg">
                      <Shield size={11} />{perm}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default UserViewDrawer;
