const DEFAULT_SORT = 'created_at:desc';
export function parsePagination(input = {}, whitelist = {}) {
  const page = Math.max(1, Number(input.page || 1));
  const pageSize = Math.min(100, Math.max(1, Number(input.pageSize || 20)));
  const [field, direction = 'asc'] = String(input.sort || DEFAULT_SORT).split(':');
  const column = whitelist[field] || whitelist.created_at || 'created_at';
  const order = direction.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
  return { page, pageSize, limit: pageSize, offset: (page - 1) * pageSize, orderBy: `${column} ${order}`, q: input.q?.trim() || '' };
}
