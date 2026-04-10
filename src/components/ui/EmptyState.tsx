import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  colSpan?: number;
  className?: string;
}

export function EmptyState({ icon, title, description, action, colSpan, className }: EmptyStateProps) {
  const content = (
    <div className={cn('flex flex-col items-center justify-center py-16 gap-3 text-on-surface-variant', className)}>
      {icon && (
        <div className="w-16 h-16 rounded-2xl bg-surface-container-low flex items-center justify-center opacity-60">
          {icon}
        </div>
      )}
      <p className="text-sm font-medium">{title}</p>
      {description && <p className="text-xs opacity-60">{description}</p>}
      {action}
    </div>
  );

  if (colSpan !== undefined) {
    return (
      <tr>
        <td colSpan={colSpan} className="p-0">
          {content}
        </td>
      </tr>
    );
  }

  return content;
}

export default EmptyState;
