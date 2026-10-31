/**
 * Case conversion utilities.
 * DB is snake_case; API responses are camelCase.
 */

function snakeToCamel(str) {
  return str.replace(/_([a-z0-9])/g, (_, letter) => letter.toUpperCase());
}

export function camelize(val) {
  if (val === null || val === undefined) return val;
  if (Array.isArray(val)) {
    return val.map(camelize);
  }
  if (typeof val === 'object' && !(val instanceof Date)) {
    const res = {};
    for (const key of Object.keys(val)) {
      const camelKey = snakeToCamel(key);
      res[camelKey] = camelize(val[key]);
    }
    return res;
  }
  return val;
}
