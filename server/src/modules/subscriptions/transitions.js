export const TRANSITIONS = {
  draft: ['quotation', 'closed'],
  quotation: ['draft', 'confirmed', 'closed'],
  confirmed: ['active', 'closed'],
  active: ['closed'],
  closed: [],
};
export const canTransition = (from, to) => TRANSITIONS[from]?.includes(to) ?? false;
