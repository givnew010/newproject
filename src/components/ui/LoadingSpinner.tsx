import React from 'react';

interface LoadingSpinnerProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export function LoadingSpinner({ label = 'جاري التحميل...', size = 'md', color = 'border-primary' }: LoadingSpinnerProps) {
  const sizeClass = { sm: 'h-5 w-5', md: 'h-8 w-8', lg: 'h-12 w-12' }[size];

  return (
    <div className="flex items-center justify-center py-10 gap-3">
      <div className={`animate-spin rounded-full ${sizeClass} border-b-2 ${color}`} />
      {label && <span className="text-sm text-on-surface-variant">{label}</span>}
    </div>
  );
}

export default LoadingSpinner;
