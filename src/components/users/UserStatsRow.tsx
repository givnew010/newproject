import React from 'react';
import { Users, ShieldCheck, UserCog, UserX } from 'lucide-react';
import { motion } from 'motion/react';

interface UserStatsRowProps {
  total: number;
  admins: number;
  managers: number;
  inactive: number;
}

function StatCard({ icon, iconBg, iconText, value, label, delay }: {
  icon: React.ReactNode; iconBg: string; iconText: string; value: number; label: string; delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white rounded-2xl p-4 shadow-sm border border-surface-container-high flex items-center gap-4"
    >
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${iconBg}`}>
        <span className={iconText}>{icon}</span>
      </div>
      <div>
        <p className="text-xl font-extrabold text-on-surface">{value}</p>
        <p className="text-xs text-on-surface-variant">{label}</p>
      </div>
    </motion.div>
  );
}

export function UserStatsRow({ total, admins, managers, inactive }: UserStatsRowProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <StatCard icon={<Users size={20} />} iconBg="bg-blue-100" iconText="text-blue-600" value={total} label="إجمالي المستخدمين" delay={0} />
      <StatCard icon={<ShieldCheck size={20} />} iconBg="bg-red-100" iconText="text-red-600" value={admins} label="مسؤولون" delay={0.05} />
      <StatCard icon={<UserCog size={20} />} iconBg="bg-amber-100" iconText="text-amber-600" value={managers} label="مدراء" delay={0.1} />
      <StatCard icon={<UserX size={20} />} iconBg="bg-slate-100" iconText="text-slate-600" value={inactive} label="غير نشطين" delay={0.15} />
    </div>
  );
}

export default UserStatsRow;
