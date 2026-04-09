import React from 'react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export function Select({ label, className, children, ...rest }: SelectProps) {
  return (
    <div className={className}>
      {label && <label className="text-xs font-bold text-on-surface-variant mb-1 block">{label}</label>}
      <select {...rest} className="w-full bg-surface-container-low border border-surface-container-high rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all">{children}</select>
    </div>
  );
}

export default Select;
