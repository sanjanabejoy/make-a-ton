/**
 * Subscription Lifecycle Transitions Map (single source of truth).
 * draft      -> quotation | closed
 * quotation  -> draft | confirmed | closed
 * confirmed  -> active | closed
 * active     -> closed
 * closed     -> (none)
 */

export const TRANSITIONS = {
  draft: ['quotation', 'closed'],
  quotation: ['draft', 'confirmed', 'closed'],
  confirmed: ['active', 'closed'],
  active: ['closed'],
  closed: []
};

export function canTransition(from, to) {
  const allowed = TRANSITIONS[from] || [];
  return allowed.includes(to);
}
