import { format } from 'date-fns';
import { query } from '../db/pool.js';

let cache = { expires: 0, value: undefined };
export async function getToday() {
  if (cache.expires > Date.now()) return cache.value || format(new Date(), 'yyyy-MM-dd');
  const result = await query("SELECT value->>'value' AS value FROM app_settings WHERE key='virtual_date'");
  cache = { expires: Date.now() + 2000, value: result.rows[0]?.value || null };
  return cache.value || format(new Date(), 'yyyy-MM-dd');
}
export async function setVirtualDate(date) {
  await query("INSERT INTO app_settings(key,value) VALUES ('virtual_date', $1::jsonb) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value", [JSON.stringify({ value: date })]);
  cache = { expires: 0 };
}
export async function clearVirtualDate() {
  await query("INSERT INTO app_settings(key,value) VALUES ('virtual_date', 'null'::jsonb) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value");
  cache = { expires: 0 };
}
