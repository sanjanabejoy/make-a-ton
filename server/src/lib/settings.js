import { pool } from '../db/pool.js';

export async function getSetting(key, fallback = null, client = pool) {
  try {
    const res = await client.query('SELECT value FROM app_settings WHERE key = $1', [key]);
    if (res.rows.length > 0) {
      return res.rows[0].value;
    }
  } catch (err) {
    // Return fallback if table not yet migrated or query fails
  }
  return fallback;
}

export async function setSetting(key, value, client = pool) {
  await client.query(
    `INSERT INTO app_settings (key, value)
     VALUES ($1, $2::jsonb)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
    [key, JSON.stringify(value)]
  );
  return value;
}
