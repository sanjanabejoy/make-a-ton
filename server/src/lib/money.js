/**
 * Money utilities in integer paise.
 * DB columns: NUMERIC(12,2)
 * In-memory calculation: integer paise
 */

export function toPaise(amount) {
  if (amount === null || amount === undefined) return 0;
  const num = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
  if (isNaN(num)) return 0;
  return Math.round(num * 100);
}

export function fromPaise(paise) {
  if (paise === null || paise === undefined) return 0;
  const num = typeof paise === 'string' ? parseInt(paise, 10) : Number(paise);
  if (isNaN(num)) return 0;
  return Math.round(num) / 100;
}

/**
 * Calculates percentage of paise using half-up rounding.
 * e.g. pct(10000, 18) => 1800 paise
 */
export function pct(paise, rate) {
  if (!paise || !rate) return 0;
  return Math.round((Number(paise) * Number(rate)) / 100);
}

/**
 * Formats integer paise or decimal into formatted currency string.
 */
export function format(paiseOrDecimal, isPaise = true, currency = 'INR') {
  const value = isPaise ? fromPaise(paiseOrDecimal) : Number(paiseOrDecimal);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

