export function camelize(value) {
  if (Array.isArray(value)) return value.map(camelize);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).map(([key, val]) => [
    key.replace(/_([a-z])/g, (_, c) => c.toUpperCase()), camelize(val),
  ]));
}
