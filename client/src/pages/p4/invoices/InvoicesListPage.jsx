import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileText,
  Search,
  CheckSquare,
  AlertCircle,
  Plus,
  Filter,
  ArrowRight,
  Eye,
  CheckCircle,
} from 'lucide-react';
import http from '../../../api/http';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import StatusBadge from '../../../components/ui/StatusBadge';
import Money from '../../../components/ui/Money';
import DateText from '../../../components/ui/DateText';
import Badge from '../../../components/ui/Badge';
import { Skeleton } from '../../../components/ui/Skeleton';
import Pagination from '../../../components/ui/Pagination';
import { useToast } from '../../../components/ui/Toast';

const STATUS_TABS = [
  { id: 'all', label: 'All Invoices' },
  { id: 'draft', label: 'Draft' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'paid', label: 'Paid' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'cancelled', label: 'Cancelled' },
];

export function InvoicesListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();
  const queryClient = useQueryClient();

  const currentTab = searchParams.get('status') || 'all';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const searchQuery = searchParams.get('q') || '';
  const customerFilter = searchParams.get('customer') || '';
  const fromDate = searchParams.get('from') || '';
  const toDate = searchParams.get('to') || '';

  const [selectedIds, setSelectedIds] = useState([]);

  // Fetch invoices query
  const { data, isLoading, error } = useQuery({
    queryKey: ['invoices', { currentTab, currentPage, searchQuery, customerFilter, fromDate, toDate }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (currentTab !== 'all') params.set('status', currentTab);
      if (searchQuery) params.set('q', searchQuery);
      if (customerFilter) params.set('customer', customerFilter);
      if (fromDate) params.set('from', fromDate);
      if (toDate) params.set('to', toDate);
      params.set('page', String(currentPage));
      params.set('pageSize', '15');

      const res = await http.get(`/invoices?${params.toString()}`);
      return res.data || res;
    },
  });

  const invoices = data?.data || [];
  const meta = data?.meta || { page: 1, pageSize: 15, total: invoices.length };
  const totalPages = Math.ceil((meta.total || 1) / (meta.pageSize || 15));

  // Bulk confirm mutation for drafts
  const bulkConfirmMutation = useMutation({
    mutationFn: async (ids) => {
      const res = await http.post('/invoices/bulk-confirm', { ids });
      return res.data || res;
    },
    onSuccess: (resData) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(resData?.message || `Successfully confirmed ${selectedIds.length} invoice(s)`);
      setSelectedIds([]);
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to confirm selected invoices');
    },
  });

  const handleTabChange = (tabId) => {
    const next = new URLSearchParams(searchParams);
    if (tabId === 'all') {
      next.delete('status');
    } else {
      next.set('status', tabId);
    }
    next.set('page', '1');
    setSearchParams(next);
    setSelectedIds([]);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const next = new URLSearchParams(searchParams);
    if (searchQuery) {
      next.set('q', searchQuery);
    } else {
      next.delete('q');
    }
    next.set('page', '1');
    setSearchParams(next);
  };

  const toggleSelectAll = () => {
    const draftInvoices = invoices.filter((inv) => inv.status === 'draft');
    if (selectedIds.length === draftInvoices.length && draftInvoices.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(draftInvoices.map((inv) => inv.id));
    }
  };

  const toggleSelectOne = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const draftCount = invoices.filter((inv) => inv.status === 'draft').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Invoices</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage recurring billing records, payments, and overdue follow-ups
          </p>
        </div>

        {selectedIds.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-600 font-medium">
              {selectedIds.length} draft(s) selected
            </span>
            <Button
              variant="primary"
              size="sm"
              icon={CheckCircle}
              onClick={() => bulkConfirmMutation.mutate(selectedIds)}
              isLoading={bulkConfirmMutation.isPending}
            >
              Bulk Confirm Selected
            </Button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-6 overflow-x-auto pb-px">
          {STATUS_TABS.map((tab) => {
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Filters Bar */}
      <Card className="p-4">
        <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                const next = new URLSearchParams(searchParams);
                if (e.target.value) {
                  next.set('q', e.target.value);
                } else {
                  next.delete('q');
                }
                setSearchParams(next);
              }}
              placeholder="Search by invoice number (INV-...) or customer name..."
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 rounded-lg border border-slate-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                const next = new URLSearchParams(searchParams);
                if (e.target.value) next.set('from', e.target.value);
                else next.delete('from');
                next.set('page', '1');
                setSearchParams(next);
              }}
              title="From Date"
              className="py-1.5 px-2.5 text-xs bg-slate-50 rounded-lg border border-slate-200 focus:bg-white"
            />
            <span className="text-slate-400 text-xs">to</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                const next = new URLSearchParams(searchParams);
                if (e.target.value) next.set('to', e.target.value);
                else next.delete('to');
                next.set('page', '1');
                setSearchParams(next);
              }}
              title="To Date"
              className="py-1.5 px-2.5 text-xs bg-slate-50 rounded-lg border border-slate-200 focus:bg-white"
            />
          </div>

          {(searchQuery || fromDate || toDate || currentTab !== 'all') && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchParams(new URLSearchParams());
                setSelectedIds([]);
              }}
            >
              Reset Filters
            </Button>
          )}
        </form>
      </Card>

      {/* Invoices DataTable */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="h-12 w-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">No Invoices Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              There are no invoices matching the selected filters or current billing status.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 uppercase text-[11px] text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={
                        draftCount > 0 &&
                        selectedIds.length === draftCount
                      }
                      disabled={draftCount === 0}
                      onChange={toggleSelectAll}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      title="Select all draft invoices for bulk confirmation"
                    />
                  </th>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Subscription</th>
                  <th className="py-3 px-4">Invoice Date</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4 text-right">Paid</th>
                  <th className="py-3 px-4 text-right">Outstanding</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center w-16">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => {
                  const isDraft = inv.status === 'draft';
                  const isSelected = selectedIds.includes(inv.id);
                  const outstanding = Math.max(
                    0,
                    Number(inv.total || 0) - Number(inv.amountPaid || 0)
                  );
                  const isPartiallyPaid =
                    inv.status === 'confirmed' &&
                    Number(inv.amountPaid || 0) > 0 &&
                    outstanding > 0;
                  const paidPercentage = Math.min(
                    100,
                    Math.round(((inv.amountPaid || 0) / (inv.total || 1)) * 100)
                  );

                  return (
                    <tr
                      key={inv.id}
                      className={`hover:bg-slate-50/70 transition ${
                        isSelected ? 'bg-indigo-50/40' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={!isDraft}
                          onChange={() => toggleSelectOne(inv.id)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:opacity-30"
                        />
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <Link
                          to={`/invoices/${inv.id}`}
                          className="text-indigo-600 hover:text-indigo-900 hover:underline flex items-center gap-1 font-mono"
                        >
                          {inv.number}
                        </Link>
                      </td>

                      <td className="py-3.5 px-4 font-medium text-slate-900">
                        <div>
                          <span>{inv.customerName}</span>
                          {inv.customerEmail && (
                            <span className="block text-[10px] text-slate-400">
                              {inv.customerEmail}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">
                        <Link
                          to={`/subscriptions/${inv.subscriptionId}`}
                          className="hover:underline hover:text-indigo-600 font-mono text-[11px]"
                        >
                          {inv.subscriptionNumber || `SUB-${inv.subscriptionId}`}
                        </Link>
                      </td>

                      <td className="py-3.5 px-4">
                        <DateText date={inv.invoiceDate} />
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1">
                          <DateText date={inv.dueDate} />
                          {inv.isOverdue && (
                            <span className="text-[10px] font-bold text-rose-600">
                              !
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                        <Money amount={inv.total} />
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <span className="text-slate-700 font-medium">
                          <Money amount={inv.amountPaid || 0} />
                        </span>
                        {/* Progress sliver for partial payments */}
                        {isPartiallyPaid && (
                          <div className="w-16 ml-auto mt-1 h-1 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500"
                              style={{ width: `${paidPercentage}%` }}
                            />
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {outstanding > 0 ? (
                          <span
                            className={`font-semibold ${
                              inv.isOverdue ? 'text-rose-600' : 'text-slate-800'
                            }`}
                          >
                            <Money amount={outstanding} />
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <StatusBadge
                          status={inv.status}
                          isOverdue={inv.isOverdue}
                          daysOverdue={inv.daysOverdue}
                        />
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <Link
                          to={`/invoices/${inv.id}`}
                          className="inline-flex items-center justify-center p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition"
                          title="View Invoice Detail"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {meta.total > 0 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Showing {(meta.page - 1) * meta.pageSize + 1} to{' '}
              {Math.min(meta.page * meta.pageSize, meta.total)} of {meta.total} invoices
            </span>
            <Pagination
              currentPage={meta.page}
              totalPages={totalPages}
              onPageChange={(p) => {
                const next = new URLSearchParams(searchParams);
                next.set('page', String(p));
                setSearchParams(next);
              }}
            />
          </div>
        )}
      </Card>
    </div>
  );
}

export default InvoicesListPage;
