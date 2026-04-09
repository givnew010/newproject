import React from 'react';
import clsx from 'clsx';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  accentColor?: 'blue' | 'emerald' | 'violet' | 'amber' | 'cyan' | 'slate';
  actions?: React.ReactNode;
}

export function PageHeader({ title, subtitle, icon, accentColor = 'blue', actions }: PageHeaderProps) {
  const accent = {
    blue: 'text-blue-700',
    emerald: 'text-emerald-700',
    violet: 'text-violet-700',
    amber: 'text-amber-700',
    cyan: 'text-cyan-700',
    slate: 'text-slate-700',
  }[accentColor];

  return (
    <div className="flex items-center justify-between gap-4 px-4 lg:px-6 py-3">
      <div className="flex items-center gap-3 min-w-0">
        {icon && <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center', 'bg-surface-container-low')}>{icon}</div>}
        <div className="min-w-0">
          <h1 className={clsx('font-headline font-extrabold text-on-surface text-lg truncate', accent)}>{title}</h1>
          {subtitle && <p className="text-sm text-on-surface-variant truncate">{subtitle}</p>}
        </div>
      </div>
      <div>{actions}</div>
    </div>
  );
}

export default PageHeader;
