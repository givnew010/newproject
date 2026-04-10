import React from 'react';
import { Building2, Package, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

interface StatCardProps {
  icon: React.ReactNode;
  iconBg: string;
  iconText: string;
  value: number | string;
  label: string;
  delay?: number;
}

function StatCard({ icon, iconBg, iconText, value, label, delay = 0 }: StatCardProps) {
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

interface WarehouseStatsRowProps {
  total: number;
  totalItems: number;
  active: number;
}

export function WarehouseStatsRow({ total, totalItems, active }: WarehouseStatsRowProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <StatCard icon={<Building2 size={20} />} iconBg="bg-blue-100" iconText="text-blue-600" value={total} label="إجمالي المستودعات" delay={0} />
      <StatCard icon={<Package size={20} />} iconBg="bg-amber-100" iconText="text-amber-600" value={totalItems.toLocaleString('ar-SA')} label="إجمالي الأصناف" delay={0.05} />
      <StatCard icon={<CheckCircle2 size={20} />} iconBg="bg-emerald-100" iconText="text-emerald-600" value={active} label="مستودعات نشطة" delay={0.1} />
    </div>
  );
}

export default WarehouseStatsRow;
