import type { ReactNode } from 'react';

export type BadgeVariant = 'brand' | 'success' | 'warning' | 'error' | 'info' | 'neutral';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  className?: string;
}

const variantClasses: Record<BadgeVariant, { bg: string; dot: string }> = {
  brand: {
    bg: 'bg-brand-primary-light text-brand-primary border-brand-primary/20',
    dot: 'bg-brand-primary',
  },
  success: {
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
  },
  warning: {
    bg: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
  },
  error: {
    bg: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-500',
  },
  info: {
    bg: 'bg-sky-50 text-sky-700 border-sky-200',
    dot: 'bg-sky-500',
  },
  neutral: {
    bg: 'bg-gray-100 text-gray-700 border-gray-200',
    dot: 'bg-gray-400',
  },
};

export function Badge({
  children,
  variant = 'brand',
  size = 'md',
  dot = false,
  className = '',
}: BadgeProps) {
  const { bg, dot: dotColor } = variantClasses[variant];
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-bold uppercase tracking-wider transition-colors ${bg} ${sizeClass} ${className}`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} aria-hidden="true" />}
      <span>{children}</span>
    </span>
  );
}

export default Badge;
