import React from 'react';
import { cn } from '../../lib/utils';

export const Select = React.forwardRef(function Select(
  { className, children, error, ...props },
  ref
) {
  return (
    <select
      ref={ref}
      className={cn(
        'w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed',
        error && 'border-rose-500 focus:border-rose-500 focus:ring-rose-500',
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
});

export default Select;
