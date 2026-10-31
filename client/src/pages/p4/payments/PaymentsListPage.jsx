import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CreditCard,
  Search,
  Plus,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import http from '../../../api/http';
import { useAuth } from '../../../auth/AuthContext';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Money from '../../../components/ui/Money';
import DateText from '../../../components/ui/DateText';
import Badge from '../../../components/ui/Badge';
import { Skeleton } from '../../../components/ui/Skeleton';
import Pagination from '../../../components/ui/Pagination';
import { ConfirmModal } from '../../../components/ui/Modal';
import Modal from '../../../components/ui/Modal';
import FormField from '../../../components/ui/FormField';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Textarea from '../../../components/ui/Textarea';
import { useToast } from '../../../components/ui/Toast';

export function PaymentsListPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const toast = useToast();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const methodFilter = searchParams.get('method') || '';
  const fromDate = searchParams.get('from') || '';
  const toDate = searchParams.get('to') || '';
  const searchQuery = searchParams.get('q') || '';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [voidPaymentModal, setVoidPaymentModal] = useState(null);

  // Payments query
  const { data: paymentsData, isLoading } = useQuery({
    queryKey: ['payments', { methodFilter, fromDate, toDate, searchQuery, currentPage }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (methodFilter) params.set('method', methodFilter);
      if (fromDate) params.set('from', fromDate);
      if (toDate) params.set('to', toDate);
      if (searchQuery) params.set('q', searchQuery);
      params.set('page', String(currentPage));
      params.set('pageSize', '15');

      const res = await http.get(`/payments?${params.toString()}`);
      return res.data || res;
    },
  });

  const payments = paymentsData?.data || [];
  const meta = paymentsData?.meta || { page: 1, pageSize: 15, total: payments.length };
  const totalPages = Math.ceil((meta.total || 1) / (meta.pageSize || 15));

  // Query unpaid confirmed invoices for the record modal
  const { data: unpaidInvoicesData } = useQuery({
    queryKey: ['unpaidConfirmedInvoices'],
    queryFn: async () => {
      const res = await http.get('/invoices?status=confirmed&pageSize=100');
      return res.data?.data || res.data || [];
    },
    enabled: recordModalOpen,
  });

  const unpaidInvoices = unpaidInvoicesData || [];

  // Void payment mutation
  const voidMutation = useMutation({
    mutationFn: async (paymentId) => {
      const res = await http.post(`/payments/${paymentId}/void`);
      return res.data || res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Payment voided successfully');
      setVoidPaymentModal(null);
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to void payment');
    },
  });

  // State for Record Payment Modal
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [newMethod, setNewMethod] = useState('bank_transfer');
  const [newAmount, setNewAmount] = useState('');
  const [newPaidOn, setNewPaidOn] = useState(new Date().toISOString().split('T')[0]);
  const [newRef, setNewRef] = useState('');
  const [newNote, setNewNote] = useState('');
  const [formErrors, setFormErrors] = useState({});

  const selectedInvoice = unpaidInvoices.find((i) => String(i.id) === String(selectedInvoiceId));
  const selectedOutstanding = selectedInvoice
    ? Math.max(0, Number(selectedInvoice.total || 0) - Number(selectedInvoice.amountPaid || 0))
    : 0;

  const handleInvoiceChange = (invId) => {
    setSelectedInvoiceId(invId);
    const inv = unpaidInvoices.find((i) => String(i.id) === String(invId));
    if (inv) {
      const out = Math.max(0, Number(inv.total || 0) - Number(inv.amountPaid || 0));
      setNewAmount(String(out));
    } else {
      setNewAmount('');
    }
  };

  const createPaymentMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await http.post(`/invoices/${selectedInvoiceId}/payments`, payload);
      return res.data || res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Payment recorded successfully');
      setRecordModalOpen(false);
      setSelectedInvoiceId('');
      setNewAmount('');
      setNewRef('');
      setNewNote('');
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to record payment');
    },
  });

  const handleRecordSubmit = (e) => {
    e.preventDefault();
    const errors = {};
    if (!selectedInvoiceId) errors.invoice = 'Please select an invoice';
    const num = parseFloat(newAmount);
    if (!newAmount || isNaN(num) || num <= 0) errors.amount = 'Valid amount is required';
    if (num > selectedOutstanding) errors.amount = `Amount cannot exceed ₹${selectedOutstanding}`;
    if (!newPaidOn) errors.paidOn = 'Date is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    createPaymentMutation.mutate({
      method: newMethod,
      amount: num,
      paid_on: newPaidOn,
      reference: newRef,
      note: newNote,
    });
  };

  const getMethodBadge = (m) => {
    switch (m) {
      case 'bank_transfer':
        return <Badge variant="blue" size="sm">Bank Transfer</Badge>;
      case 'card':
        return <Badge variant="purple" size="sm">Card</Badge>;
      case 'upi':
        return <Badge variant="green" size="sm">UPI</Badge>;
      case 'cash':
        return <Badge variant="amber" size="sm">Cash</Badge>;
      case 'cheque':
        return <Badge variant="slate" size="sm">Cheque</Badge>;
      case 'online_simulated':
        return <Badge variant="sky" size="sm">Simulated Online</Badge>;
      default:
        return <Badge variant="slate" size="sm">{m || 'Other'}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Payments</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track settlements, remittances, payment methods, and reconcile status
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={Plus}
          onClick={() => {
            setRecordModalOpen(true);
            setFormErrors({});
          }}
        >
          Record Payment
        </Button>
      </div>

      {/* Filters Bar */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                const next = new URLSearchParams(searchParams);
                if (e.target.value) next.set('q', e.target.value);
                else next.delete('q');
                next.set('page', '1');
                setSearchParams(next);
              }}
              placeholder="Search by reference, customer, or invoice..."
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 rounded-lg border border-slate-200 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="w-44">
            <select
              value={methodFilter}
              onChange={(e) => {
                const next = new URLSearchParams(searchParams);
                if (e.target.value) next.set('method', e.target.value);
                else next.delete('method');
                next.set('page', '1');
                setSearchParams(next);
              }}
              className="w-full py-1.5 px-3 text-xs bg-slate-50 rounded-lg border border-slate-200 focus:bg-white text-slate-800"
            >
              <option value="">All Payment Methods</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="card">Card</option>
              <option value="upi">UPI</option>
              <option value="cash">Cash</option>
              <option value="cheque">Cheque</option>
              <option value="online_simulated">Online Simulated</option>
              <option value="other">Other</option>
            </select>
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
              className="py-1.5 px-2.5 text-xs bg-slate-50 rounded-lg border border-slate-200"
              title="From Date"
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
              className="py-1.5 px-2.5 text-xs bg-slate-50 rounded-lg border border-slate-200"
              title="To Date"
            />
          </div>

          {(searchQuery || methodFilter || fromDate || toDate) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearchParams(new URLSearchParams())}
            >
              Reset
            </Button>
          )}
        </div>
      </Card>

      {/* Payments Table */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="h-12 w-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <CreditCard className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">No Payments Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No transactions match your search criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 uppercase text-[11px] text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-6">Payment Date</th>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Note</th>
                  {isAdmin && <th className="py-3 px-4 text-center w-20">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((pmt) => {
                  const isVoided = !!pmt.voidedAt;

                  return (
                    <tr
                      key={pmt.id}
                      className={
                        isVoided
                          ? 'bg-slate-50 opacity-60 line-through'
                          : 'hover:bg-slate-50/70 transition'
                      }
                    >
                      <td className="py-3.5 px-6 font-medium text-slate-900">
                        <DateText date={pmt.paidOn} />
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold">
                        <Link
                          to={`/invoices/${pmt.invoiceId}`}
                          className="text-indigo-600 hover:underline"
                        >
                          {pmt.invoiceNumber || `INV-${pmt.invoiceId}`}
                        </Link>
                      </td>

                      <td className="py-3.5 px-4 font-medium text-slate-900">
                        {pmt.customerName}
                      </td>

                      <td className="py-3.5 px-4">
                        {getMethodBadge(pmt.method)}
                      </td>

                      <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                        <Money amount={pmt.amount} />
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                        {pmt.reference || '—'}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">
                        {pmt.note || '—'}
                      </td>

                      {isAdmin && (
                        <td className="py-3.5 px-4 text-center">
                          {!isVoided && (
                            <button
                              type="button"
                              onClick={() => setVoidPaymentModal(pmt)}
                              title="Void Payment"
                              className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-slate-100 transition"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {isVoided && (
                            <span className="text-[10px] text-rose-500 font-semibold">
                              Voided
                            </span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {meta.total > 0 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Showing {(meta.page - 1) * meta.pageSize + 1} to{' '}
              {Math.min(meta.page * meta.pageSize, meta.total)} of {meta.total} payments
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

      {/* Record Payment Modal */}
      <Modal
        isOpen={recordModalOpen}
        onClose={() => setRecordModalOpen(false)}
        title="Record New Payment"
        description="Select an unpaid confirmed invoice and record customer remittance."
      >
        <form onSubmit={handleRecordSubmit} className="space-y-4">
          <FormField label="Select Invoice" required error={formErrors.invoice}>
            <select
              value={selectedInvoiceId}
              onChange={(e) => handleInvoiceChange(e.target.value)}
              className="w-full py-2 px-3 text-xs bg-slate-50 rounded-lg border border-slate-200 text-slate-900 focus:bg-white"
            >
              <option value="">-- Choose confirmed unpaid invoice --</option>
              {unpaidInvoices.map((inv) => {
                const out = Number(inv.total) - Number(inv.amountPaid || 0);
                return (
                  <option key={inv.id} value={inv.id}>
                    {inv.number} • {inv.customerName} • Outstanding: ₹{out.toLocaleString('en-IN')}
                  </option>
                );
              })}
            </select>
          </FormField>

          {selectedInvoice && (
            <div className="p-3 bg-indigo-50/70 border border-indigo-200/80 rounded-lg text-xs space-y-1">
              <p className="font-semibold text-indigo-950">
                Invoice: {selectedInvoice.number} ({selectedInvoice.customerName})
              </p>
              <p className="text-slate-600">
                Total: ₹{Number(selectedInvoice.total).toLocaleString('en-IN')} • Outstanding:{' '}
                <strong className="text-rose-600">
                  ₹{selectedOutstanding.toLocaleString('en-IN')}
                </strong>
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Method" required>
              <Select
                value={newMethod}
                onChange={(e) => setNewMethod(e.target.value)}
                options={[
                  { value: 'bank_transfer', label: 'Bank Transfer' },
                  { value: 'card', label: 'Credit / Debit Card' },
                  { value: 'upi', label: 'UPI' },
                  { value: 'cash', label: 'Cash' },
                  { value: 'cheque', label: 'Cheque' },
                  { value: 'other', label: 'Other' },
                ]}
              />
            </FormField>

            <FormField label="Amount (₹)" required error={formErrors.amount}>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                max={selectedOutstanding || 9999999}
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                placeholder="0.00"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Payment Date" required error={formErrors.paidOn}>
              <Input
                type="date"
                value={newPaidOn}
                onChange={(e) => setNewPaidOn(e.target.value)}
              />
            </FormField>

            <FormField label="Reference / UTR #">
              <Input
                value={newRef}
                onChange={(e) => setNewRef(e.target.value)}
                placeholder="Bank transaction ID or check #"
              />
            </FormField>
          </div>

          <FormField label="Internal Notes">
            <Textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              rows={2}
              placeholder="Notes regarding this settlement"
            />
          </FormField>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setRecordModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={createPaymentMutation.isPending}
            >
              Save Payment
            </Button>
          </div>
        </form>
      </Modal>

      {/* Void Payment Modal (Admin Only) */}
      <ConfirmModal
        isOpen={!!voidPaymentModal}
        onClose={() => setVoidPaymentModal(null)}
        onConfirm={() => voidMutation.mutate(voidPaymentModal?.id)}
        title="Void Payment Record"
        message={`Are you sure you want to void payment #${voidPaymentModal?.id} of ₹${voidPaymentModal?.amount}? The paid amount will be reversed from invoice ${voidPaymentModal?.invoiceNumber}, restoring its outstanding balance.`}
        confirmText="Void Payment"
        variant="danger"
        isLoading={voidMutation.isPending}
      />
    </div>
  );
}

export default PaymentsListPage;
