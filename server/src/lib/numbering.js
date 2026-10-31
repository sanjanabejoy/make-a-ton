/**
 * Generates sequential formatted numbers via Postgres sequences.
 * e.g. SUB-000001, INV-000001
 */

import { pool } from '../db/pool.js';

export async function getNextSubscriptionNumber(client = pool) {
  const res = await client.query("SELECT nextval('subscription_seq') AS seq");
  const num = res.rows[0].seq;
  return `SUB-${String(num).padStart(6, '0')}`;
}

export async function getNextInvoiceNumber(client = pool) {
  const res = await client.query("SELECT nextval('invoice_seq') AS seq");
  const num = res.rows[0].seq;
  return `INV-${String(num).padStart(6, '0')}`;
}
