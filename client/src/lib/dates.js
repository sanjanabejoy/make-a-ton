import { format, parseISO, isValid } from 'date-fns';

export function formatDate(dateVal, formatPattern = 'dd MMM yyyy') {
  if (!dateVal) return '—';
  try {
    const d = typeof dateVal === 'string' ? parseISO(dateVal) : new Date(dateVal);
    if (!isValid(d)) return String(dateVal);
    return format(d, formatPattern);
  } catch (err) {
    return String(dateVal);
  }
}

export function formatDateTime(dateVal) {
  return formatDate(dateVal, 'dd MMM yyyy, hh:mm a');
}
