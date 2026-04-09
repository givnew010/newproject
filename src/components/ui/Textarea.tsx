import React from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export function Textarea({ label, className, ...rest }: TextareaProps) {
  return (
    <div className={className}>
      {label && <label className="text-xs font-bold text-on-surface-variant mb-1 block">{label}</label>}
      <textarea {...rest} className="w-full bg-surface-container-low border border-surface-container-high rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary transition-all resize-vertical" />
    </div>
  );
}

export default Textarea;
