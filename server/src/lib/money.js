export function toPaise(value) {
  if (typeof value === 'number' && !Number.isFinite(value)) throw new TypeError('Invalid money value');
  const text = String(value ?? '0').trim();
  if (!/^-?\d+(?:\.\d{1,2})?$/.test(text)) throw new TypeError(`Invalid money value: ${value}`);
  const [whole, fraction = ''] = text.split('.');
  return Number(whole) * 100 + Number((fraction + '00').slice(0, 2));
}

export function fromPaise(paise) {
  if (!Number.isInteger(paise)) throw new TypeError('Paise must be an integer');
  return (paise / 100).toFixed(2);
}

export function pct(paise, rate) {
  return Math.floor((paise * Number(rate) + 50) / 100);
}

export function format(paise, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(paise / 100);
}
