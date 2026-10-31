import React from 'react';
import { formatCurrency } from '../../lib/formatters';
import { cn } from '../../lib/utils';

export function Money({ amount, currency = 'INR', className }) {
  return (
    <span className={cn('tabular-nums font-mono text-inherit', className)}>
      {formatCurrency(amount, currency)}
    </span>
  );
}

export default Money;
