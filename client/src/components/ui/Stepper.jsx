import React from 'react';
import { Check, PauseCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

const STEPS = [
  { id: 'draft', label: 'Draft' },
  { id: 'quotation', label: 'Quotation' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'active', label: 'Active' },
  { id: 'closed', label: 'Closed' },
];

export function Stepper({ currentStatus, pausedAt, className }) {
  const currentIndex = STEPS.findIndex(
    (s) => s.id === String(currentStatus || '').toLowerCase()
  );

  return (
    <div className={cn('w-full py-2', className)}>
      <div className="flex items-center justify-between relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 w-full bg-slate-200 z-0" />
        {STEPS.map((step, idx) => {
          const isCompleted = currentIndex > idx && currentStatus !== 'closed';
          const isCurrent = currentIndex === idx;
          const isPaused = isCurrent && currentStatus === 'active' && !!pausedAt;

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center group">
              <div
                className={cn(
                  'h-8 w-8 rounded-full flex items-center justify-center font-semibold text-xs transition-all shadow-xs',
                  isCompleted && 'bg-emerald-600 text-white ring-4 ring-emerald-50',
                  isCurrent && !isPaused && 'bg-indigo-600 text-white ring-4 ring-indigo-50',
                  isPaused && 'bg-amber-500 text-white ring-4 ring-amber-50',
                  !isCompleted && !isCurrent && 'bg-white border-2 border-slate-300 text-slate-400'
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4 stroke-[2.5]" />
                ) : isPaused ? (
                  <PauseCircle className="h-4 w-4" />
                ) : (
                  idx + 1
                )}
              </div>
              <span
                className={cn(
                  'text-xs font-medium mt-1.5 whitespace-nowrap',
                  isCurrent ? 'text-slate-900 font-semibold' : 'text-slate-500'
                )}
              >
                {step.label}
              </span>
              {isPaused && (
                <span className="text-[10px] text-amber-600 font-medium">Paused</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Stepper;
