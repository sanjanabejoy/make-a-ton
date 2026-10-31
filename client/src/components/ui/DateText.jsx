import React from 'react';
import { formatDate } from '../../lib/dates';
import { cn } from '../../lib/utils';

export function DateText({ date, pattern = 'dd MMM yyyy', className }) {
  return (
    <span className={cn('text-inherit whitespace-nowrap', className)}>
      {formatDate(date, pattern)}
    </span>
  );
}

export default DateText;
