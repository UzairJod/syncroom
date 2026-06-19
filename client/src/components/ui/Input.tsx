'use client';

import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export default function Input({ label, error, icon, className = '', ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-text-secondary mb-1.5">{label}</label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">{icon}</span>
        )}
        <input
          className={`
            w-full bg-bg-secondary/80 backdrop-blur-sm
            border border-border-glass rounded-xl
            px-4 py-2.5 text-sm text-text-primary
            placeholder:text-text-muted
            focus:outline-none focus:ring-2 focus:ring-accent-blue/40 focus:border-accent-blue/40
            transition-all duration-200
            ${error ? 'border-red-500/50 focus:ring-red-500/40 focus:border-red-500/40' : ''}
            ${icon ? 'pl-10' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}
