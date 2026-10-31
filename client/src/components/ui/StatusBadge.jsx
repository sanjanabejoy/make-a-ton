import React from 'react';
import Badge from './Badge';

export function StatusBadge({ status, isOverdue = false, daysOverdue = 0, pausedAt, className }) {
  if (isOverdue) {
    const text = daysOverdue > 0 ? `Overdue ${daysOverdue}d` : 'Overdue';
    return (
      <Badge variant="red" dot className={className}>
        {text}
      </Badge>
    );
  }

  const s = String(status || '').toLowerCase();

  switch (s) {
    case 'draft':
      return <Badge variant="slate" dot className={className}>Draft</Badge>;
    case 'quotation':
      return <Badge variant="amber" dot className={className}>Quotation</Badge>;
    case 'confirmed':
      return <Badge variant="blue" dot className={className}>Confirmed</Badge>;
    case 'active':
      if (pausedAt) {
        return <Badge variant="amber" dot className={className}>Paused</Badge>;
      }
      return <Badge variant="green" dot className={className}>Active</Badge>;
    case 'closed':
      return <Badge variant="slate" dot className={className}>Closed</Badge>;
    case 'paid':
      return <Badge variant="green" dot className={className}>Paid</Badge>;
    case 'partially_paid':
      return <Badge variant="blue" dot className={className}>Partially Paid</Badge>;
    case 'cancelled':
      return <Badge variant="red" dot className={className}>Cancelled</Badge>;
    case 'needs_renewal':
      return <Badge variant="amber" dot className={className}>Needs Renewal</Badge>;
    default:
      return <Badge variant="slate" className={className}>{status || '—'}</Badge>;
  }
}

export default StatusBadge;
