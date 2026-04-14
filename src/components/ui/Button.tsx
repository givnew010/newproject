import React from 'react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClass: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'bg-transparent hover:bg-surface-container-low text-on-surface-variant',
  danger: 'btn-danger',
  success: 'btn-success',
  outline: 'bg-white border border-surface-container-high text-on-surface-variant',
};

const sizeClass: Record<ButtonSize, string> = {
  sm: 'text-sm px-3 h-10',
  md: 'text-sm px-5 h-10',
  lg: 'text-base px-6 h-10',
};

export function Button({ variant = 'primary', size = 'md', className, children, ...rest }: ButtonProps) {
  const cls = twMerge(clsx(variantClass[variant] ?? variantClass.primary, sizeClass[size], className));
  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  );
}

export default Button;
