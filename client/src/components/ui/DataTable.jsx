import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '../../lib/utils';
import Pagination from './Pagination';
import { TableSkeleton } from './Skeleton';
import EmptyState from './EmptyState';
import ErrorState from './ErrorState';

export function DataTable({
  columns = [],
  data = [],
  total = 0,
  page: controlledPage,
  pageSize: controlledPageSize,
  onPageChange: controlledOnPageChange,
  onPageSizeChange: controlledOnPageSizeChange,
  isLoading = false,
  error = null,
  onRetry,
  onRowClick,
  rowActions,
  emptyTitle = 'No records found',
  emptyDescription = 'There are no items to display matching your criteria.',
  emptyActionLabel,
  onEmptyAction,
  className,
}) {
  const [searchParams, setSearchParams] = useSearchParams();

  // If page/pageSize are controlled from props, use them, otherwise read from URL searchParams
  const page = controlledPage ?? Number(searchParams.get('page') || 1);
  const pageSize = controlledPageSize ?? Number(searchParams.get('pageSize') || 20);
  const currentSort = searchParams.get('sort') || ''; // e.g. "name:asc"
  const [sortField, sortDir] = currentSort.split(':');

  const handlePageChange = (newPage) => {
    if (controlledOnPageChange) {
      controlledOnPageChange(newPage);
    } else {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set('page', String(newPage));
      setSearchParams(nextParams);
    }
  };

  const handlePageSizeChange = (newPageSize) => {
    if (controlledOnPageSizeChange) {
      controlledOnPageSizeChange(newPageSize);
    } else {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set('pageSize', String(newPageSize));
      nextParams.set('page', '1');
      setSearchParams(nextParams);
    }
  };

  const handleSort = (field) => {
    const nextParams = new URLSearchParams(searchParams);
    if (sortField === field) {
      if (sortDir === 'asc') {
        nextParams.set('sort', `${field}:desc`);
      } else {
        nextParams.delete('sort');
      }
    } else {
      nextParams.set('sort', `${field}:asc`);
    }
    nextParams.set('page', '1');
    setSearchParams(nextParams);
  };

  return (
    <div className={cn('bg-white rounded-xl border border-slate-200/80 shadow-soft overflow-hidden', className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50/80 text-xs uppercase text-slate-500 font-semibold border-b border-slate-200/80">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={cn(
                    'py-3.5 px-4 select-none',
                    col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                    col.sortable && 'cursor-pointer hover:bg-slate-100/70 transition-colors',
                    col.className
                  )}
                  onClick={() => col.sortable && handleSort(col.sortKey || col.accessor)}
                >
                  <div
                    className={cn(
                      'inline-flex items-center gap-1.5',
                      col.align === 'right' && 'justify-end w-full',
                      col.align === 'center' && 'justify-center w-full'
                    )}
                  >
                    <span>{col.header}</span>
                    {col.sortable && (
                      <span className="text-slate-400">
                        {sortField === (col.sortKey || col.accessor) ? (
                          sortDir === 'asc' ? (
                            <ArrowUp className="h-3.5 w-3.5 text-indigo-600" />
                          ) : (
                            <ArrowDown className="h-3.5 w-3.5 text-indigo-600" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              {rowActions && <th className="py-3.5 px-4 text-right w-24">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length + (rowActions ? 1 : 0)} className="p-0">
                  <TableSkeleton rows={pageSize > 10 ? 10 : pageSize} cols={columns.length} />
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={columns.length + (rowActions ? 1 : 0)} className="p-8">
                  <ErrorState
                    title="Failed to load items"
                    message={error.message || 'Error fetching records'}
                    onRetry={onRetry}
                  />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (rowActions ? 1 : 0)} className="p-8">
                  <EmptyState
                    title={emptyTitle}
                    description={emptyDescription}
                    actionLabel={emptyActionLabel}
                    onAction={onEmptyAction}
                  />
                </td>
              </tr>
            ) : (
              data.map((row, rowIdx) => (
                <tr
                  key={row.id || rowIdx}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={cn(
                    'transition-colors hover:bg-slate-50/70',
                    onRowClick && 'cursor-pointer'
                  )}
                >
                  {columns.map((col, colIdx) => (
                    <td
                      key={colIdx}
                      className={cn(
                        'py-3.5 px-4 text-slate-700',
                        col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                        col.cellClassName
                      )}
                    >
                      {col.cell ? col.cell(row) : row[col.accessor] ?? '—'}
                    </td>
                  ))}
                  {rowActions && (
                    <td
                      className="py-3.5 px-4 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {rowActions(row)}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!isLoading && !error && data.length > 0 && (
        <Pagination
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      )}
    </div>
  );
}

export default DataTable;
