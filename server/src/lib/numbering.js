import { query } from '../db/pool.js';
export async function nextNumber(kind) {
  const sequence = kind === 'invoice' ? 'invoice_seq' : 'subscription_seq';
  const prefix = kind === 'invoice' ? 'INV' : 'SUB';
  const { rows } = await query(`SELECT nextval('${sequence}') AS value`);
  return `${prefix}-${String(rows[0].value).padStart(6, '0')}`;
}
