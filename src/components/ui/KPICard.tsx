import React from 'react';

export interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  gradient?: 'blue' | 'emerald' | 'amber' | 'red' | 'purple';
  onClick?: () => void;
  className?: string;
}

export function KPICard({ title, value, subtitle, icon, gradient = 'blue', onClick, className }: KPICardProps) {
  const gradientClass = {
    blue: 'stat-card-gradient-blue border-blue-200',
    emerald: 'stat-card-gradient-green border-emerald-200',
    amber: 'stat-card-gradient-amber border-amber-200',
    red: 'stat-card-gradient-red border-red-200',
    purple: 'stat-card-gradient-purple border-purple-200',
  }[gradient];

  return (
    <div onClick={onClick} className={`${className ?? ''} rounded-2xl p-4 border ${gradientClass}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-on-surface-variant/80 mb-1 truncate">{title}</p>
          <p className="text-2xl font-extrabold leading-tight font-mono">{value}</p>
          {subtitle && <p className="text-[11px] text-on-surface-variant/70 mt-1.5">{subtitle}</p>}
        </div>
        {icon && <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm bg-white/60">{icon}</div>}
      </div>
    </div>
  );
}

export default KPICard;
