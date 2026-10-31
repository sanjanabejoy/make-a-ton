import { pool } from '../db/pool.js';
import { getToday } from './clock.js';

export async function logEvent(
  {
    entityType,
    entityId = null,
    subscriptionId = null,
    customerId = null,
    eventType,
    message,
    meta = null,
    actorId = null
  },
  client = pool
) {
  const simDate = await getToday();
  const query = `
    INSERT INTO events (
      entity_type, entity_id, subscription_id, customer_id,
      event_type, message, meta, actor_id, sim_date
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING id
  `;
  const values = [
    entityType,
    entityId,
    subscriptionId,
    customerId,
    eventType,
    message,
    meta ? JSON.stringify(meta) : null,
    actorId,
    simDate
  ];

  const res = await client.query(query, values);
  return res.rows[0].id;
}

