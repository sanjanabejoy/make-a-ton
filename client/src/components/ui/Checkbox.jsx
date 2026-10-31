import React from 'react';
import { cn } from '../../lib/utils';

export const Checkbox = React.forwardRef(function Checkbox(
  { className, label, helper, error, ...props },
  ref
) {
  return (
    <label className="relative flex items-start gap-2.5 cursor-pointer select-none">
      <div className="flex h-5 items-center">
        <input
          type="checkbox"
          ref={ref}
          className={cn(
            'h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0 transition cursor-pointer',
            error && 'border-rose-500',
            className
          )}
          {...props}
        />
      </div>
      {(label || helper) && (
        <div className="text-sm">
          {label && <span className="font-medium text-slate-800">{label}</span>}
          {helper && <p className="text-xs text-slate-500 mt-0.5">{helper}</p>}
          {error && <p className="text-xs text-rose-500 mt-0.5">{error}</p>}
        </div>
      )}
    </label>
  );
});

export default Checkbox;
