import React from 'react';
import clsx from 'clsx';

export type BadgeVariant = 'in-stock' | 'low-stock' | 'out-of-stock' | 'emerald' | 'amber' | 'red' | 'slate';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const mapVariant: Record<BadgeVariant, string> = {
  'in-stock': 'badge-in-stock',
  'low-stock': 'badge-low-stock',
  'out-of-stock': 'badge-out-of-stock',
  emerald: 'badge-in-stock',
  amber: 'badge-low-stock',
  red: 'badge-out-of-stock',
  slate: 'bg-slate-50 text-slate-600 border border-slate-100 text-[11px] font-bold px-2.5 py-1 rounded-full',
};

export function Badge({ variant = 'emerald', className, children, ...rest }: BadgeProps) {
  return (
    <span className={clsx(mapVariant[variant], className)} {...rest}>
      {children}
    </span>
  );
}

export default Badge;
