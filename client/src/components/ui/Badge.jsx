import React from 'react';
import { cn } from '../../lib/utils';

const variantClasses = {
  slate: 'bg-slate-100 text-slate-700 border-slate-200',
  gray: 'bg-gray-100 text-gray-700 border-gray-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  red: 'bg-rose-50 text-rose-700 border-rose-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
  indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
};

export function Badge({
  children,
  variant = 'slate',
  size = 'md',
  className,
  dot = false,
}) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-xs font-medium',
    lg: 'px-3 py-1 text-sm font-medium',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border',
        variantClasses[variant] || variantClasses.slate,
        sizeClasses[size] || sizeClasses.md,
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            variant === 'green' && 'bg-emerald-500',
            variant === 'blue' && 'bg-blue-500',
            variant === 'amber' && 'bg-amber-500',
            variant === 'red' && 'bg-rose-500',
            variant === 'purple' && 'bg-purple-500',
            variant === 'indigo' && 'bg-indigo-500',
            (variant === 'slate' || variant === 'gray') && 'bg-slate-500'
          )}
        />
      )}
      {children}
    </span>
  );
}

export default Badge;
