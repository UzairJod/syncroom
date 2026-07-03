'use client';

import React from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
  iconOnly?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-gradient-to-r from-accent-purple to-accent-blue text-white shadow-[0_0_15px_rgba(124,92,252,0.3)] hover:shadow-[0_0_20px_rgba(78,168,255,0.4)]',
  secondary:
    'bg-bg-tertiary border border-border-glass text-text-primary hover:bg-white/10 hover:border-white/15 shadow-sm',
  ghost: 'bg-transparent text-text-secondary hover:text-text-primary hover:bg-white/5',
  danger:
    'bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20 hover:border-danger/30',
};

const sizeClasses: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 text-base gap-2.5 rounded-xl',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconOnly = false,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center font-medium
        transition-all duration-200 ease-out
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary
        hover:scale-[1.02] active:scale-[0.97]
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:active:scale-100
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${iconOnly ? '!px-2 !py-2 aspect-square' : ''}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {!iconOnly && children}
    </button>
  );
}
