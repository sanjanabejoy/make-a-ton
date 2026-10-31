import { query } from '../db/pool.js';
import { getToday } from './clock.js';
export async function logEvent({ entityType, entityId, subscriptionId, customerId, eventType, message, meta, actorId }) {
  await query(`INSERT INTO events(entity_type,entity_id,subscription_id,customer_id,event_type,message,meta,actor_id,sim_date)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`, [entityType, entityId, subscriptionId || null, customerId || null, eventType, message, meta || null, actorId || null, await getToday()]);
}
