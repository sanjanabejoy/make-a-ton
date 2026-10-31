/**
 * Pagination helper with column whitelist for SQL ORDER BY.
 */

export function parsePagination(query, allowedSortColumns = ['created_at'], defaultSort = 'created_at:desc') {
  const page = Math.max(1, parseInt(query.page || '1', 10) || 1);
  const requestedPageSize = parseInt(query.pageSize || '20', 10) || 20;
  const pageSize = Math.min(100, Math.max(1, requestedPageSize));
  const offset = (page - 1) * pageSize;
  const limit = pageSize;
  const q = typeof query.q === 'string' ? query.q.trim() : '';

  const sortParam = query.sort || defaultSort;
  const [field, direction] = sortParam.split(':');
  const dir = direction && direction.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  // Map camelCase to snake_case if user passed camelCase
  const snakeField = field.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);

  let orderByColumn = allowedSortColumns[0] || 'id';
  if (allowedSortColumns.includes(field)) {
    orderByColumn = field;
  } else if (allowedSortColumns.includes(snakeField)) {
    orderByColumn = snakeField;
  }

  const orderBy = `${orderByColumn} ${dir}`;

  return {
    page,
    pageSize,
    limit,
    offset,
    orderBy,
    orderByColumn,
    orderDirection: dir,
    q
  };
}

