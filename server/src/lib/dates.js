import { addDays as dateAddDays, differenceInCalendarDays, getDaysInMonth, parseISO, format as formatDate } from 'date-fns';

const iso = (date) => typeof date === 'string' ? parseISO(date) : date;
const out = (date) => formatDate(date, 'yyyy-MM-dd');

export function addDays(date, days) { return out(dateAddDays(iso(date), days)); }
export function diffDays(from, to) { return differenceInCalendarDays(iso(to), iso(from)); }
export function isBetween(date, from, to) { return (!from || date >= from) && (!to || date <= to); }

export function addPeriod(date, period, anchorDay) {
  const value = iso(date);
  if (period === 'daily') return addDays(date, 1);
  if (period === 'weekly') return addDays(date, 7);
  const months = period === 'yearly' ? 12 : 1;
  const target = new Date(value.getFullYear(), value.getMonth() + months, 1);
  const day = Math.min(anchorDay || value.getDate(), getDaysInMonth(target));
  target.setDate(day);
  return out(target);
}

export function periodEnd(start, period, anchorDay) {
  const next = addPeriod(start, period, anchorDay);
  return addDays(next, -1);
}
