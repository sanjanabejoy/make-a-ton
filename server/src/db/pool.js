import pg from 'pg';
import { config } from '../config.js';

const connectionString = config.nodeEnv === 'test' ? config.databaseUrlTest : config.databaseUrl;

export const pool = new pg.Pool({
  connectionString,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
});

pool.on('error', (err) => {
  console.error('[pg pool] Unexpected error on idle client:', err.message);
});

