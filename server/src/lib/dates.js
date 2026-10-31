/**
 * Date manipulation utilities for SubscriptIQ.
 * All dates are 'YYYY-MM-DD' strings.
 */

function parseYMD(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') {
    throw new Error(`Invalid date string: ${dateStr}`);
  }
  const parts = dateStr.split('-');
  if (parts.length !== 3) {
    throw new Error(`Invalid YYYY-MM-DD format: ${dateStr}`);
  }
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const d = parseInt(parts[2], 10);
  return { y, m, d };
}

function formatYMD(y, m, d) {
  const mm = String(m).padStart(2, '0');
  const dd = String(d).padStart(2, '0');
  return `${y}-${mm}-${dd}`;
}

function daysInMonth(year, month) {
  // month is 1-based (1..12)
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * Add days to YYYY-MM-DD string
 */
export function addDays(dateStr, days) {
  const { y, m, d } = parseYMD(dateStr);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return date.toISOString().slice(0, 10);
}

/**
 * Difference in days (dateA - dateB)
 */
export function diffDays(dateAStr, dateBStr) {
  const a = parseYMD(dateAStr);
  const b = parseYMD(dateBStr);
  const dateA = Date.UTC(a.y, a.m - 1, a.d);
  const dateB = Date.UTC(b.y, b.m - 1, b.d);
  const diffMs = dateA - dateB;
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Check if date is within [from, to] (inclusive).
 * Null or undefined bounds are open-ended.
 */
export function isBetween(dateStr, fromStr, toStr) {
  if (!dateStr) return false;
  if (fromStr && dateStr < fromStr) return false;
  if (toStr && dateStr > toStr) return false;
  return true;
}

/**
 * Adds a billing period to dateStr ('daily', 'weekly', 'monthly', 'yearly'),
 * using anchorDay to avoid month-end drift.
 * E.g., Jan 31 -> Feb 28 -> Mar 31
 */
export function addPeriod(dateStr, period, anchorDay) {
  const { y, m, d } = parseYMD(dateStr);
  const anchor = anchorDay !== undefined && anchorDay !== null ? anchorDay : d;

  switch (period) {
    case 'daily':
      return addDays(dateStr, 1);

    case 'weekly':
      return addDays(dateStr, 7);

    case 'monthly': {
      let nextYear = y;
      let nextMonth = m + 1;
      if (nextMonth > 12) {
        nextYear += Math.floor((nextMonth - 1) / 12);
        nextMonth = ((nextMonth - 1) % 12) + 1;
      }
      const maxDays = daysInMonth(nextYear, nextMonth);
      const nextDay = Math.min(anchor, maxDays);
      return formatYMD(nextYear, nextMonth, nextDay);
    }

    case 'yearly': {
      const nextYear = y + 1;
      const nextMonth = m;
      const maxDays = daysInMonth(nextYear, nextMonth);
      const nextDay = Math.min(anchor, maxDays);
      return formatYMD(nextYear, nextMonth, nextDay);
    }

    default:
      throw new Error(`Unsupported billing period: ${period}`);
  }
}

/**
 * Period end date is the day before the next period start.
 */
export function periodEnd(startStr, period, anchorDay) {
  const nextStart = addPeriod(startStr, period, anchorDay);
  return addDays(nextStart, -1);
}

