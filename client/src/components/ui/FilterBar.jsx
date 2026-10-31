import React from 'react';
import { cn } from '../../lib/utils';

export function FilterBar({ children, className }) {
  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs mb-4',
        className
      )}
    >
      {children}
    </div>
  );
}

export default FilterBar;
