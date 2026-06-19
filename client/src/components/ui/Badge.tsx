'use client';

import React from 'react';

type BadgeVariant = 'host' | 'speaking' | 'muted' | 'sharing' | 'default';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  pulse?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  host: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  speaking: 'bg-green-500/20 text-green-400 border-green-500/30',
  muted: 'bg-red-500/20 text-red-400 border-red-500/30',
  sharing: 'bg-accent-blue/20 text-accent-blue border-accent-blue/30',
  default: 'bg-white/10 text-text-secondary border-white/10',
};

export default function Badge({ variant = 'default', children, pulse = false }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1 px-2 py-0.5
        text-[10px] font-semibold uppercase tracking-wider
        border rounded-full
        ${variantStyles[variant]}
        ${pulse ? 'animate-pulse' : ''}
      `}
    >
      {children}
    </span>
  );
}
