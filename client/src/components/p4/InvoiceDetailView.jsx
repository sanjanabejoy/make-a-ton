import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Info,
  Printer,
  Send,
  CheckCircle,
  XCircle,
  CreditCard,
  Building2,
  Calendar,
  Clock,
  Layers,
  AlertTriangle,
  Receipt,
  Mail,
  History,
} from 'lucide-react';
import Card from '../ui/Card';
import StatusBadge from '../ui/StatusBadge';
import Money from '../ui/Money';
import DateText from '../ui/DateText';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { ConfirmModal } from '../ui/Modal';
import { useToast } from '../ui/Toast';
import http from '../../api/http';
import WhyDrawer from './WhyDrawer';
import RecordPaymentModal from './RecordPaymentModal';

export function InvoiceDetailView({ invoice, mode = 'staff', onPayNow }) {
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [selectedLineForWhy, setSelectedLineForWhy] = useState(null);
  const [whyDrawerOpen, setWhyDrawerOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [recordPaymentModalOpen, setRecordPaymentModalOpen] = useState(false);

  if (!invoice) return null;

  const isStaff = mode === 'staff';
  const outstanding = Math.max(
    0,
    Number(invoice.total || 0) - Number(invoice.amountPaid || 0)
  );

  // Invalidate queries on actions
  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['invoice', String(invoice.id)] });
    queryClient.invalidateQueries({ queryKey: ['invoices'] });
    queryClient.invalidateQueries({ queryKey: ['payments'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['portalInvoice'] });
    queryClient.invalidateQueries({ queryKey: ['portalInvoices'] });
  };

  // Actions mutations
  const confirmMutation = useMutation({
    mutationFn: async () => {
      const res = await http.post(`/invoices/${invoice.id}/confirm`);
      return res.data || res;
    },
    onSuccess: () => {
      invalidateAll();
      toast.success(`Invoice ${invoice.number} confirmed`);
      setConfirmModalOpen(false);
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to confirm invoice');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const res = await http.post(`/invoices/${invoice.id}/cancel`);
      return res.data || res;
    },
    onSuccess: () => {
      invalidateAll();
      toast.success(`Invoice ${invoice.number} cancelled`);
      setCancelModalOpen(false);
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to cancel invoice');
    },
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      const res = await http.post(`/invoices/${invoice.id}/send`);
      return res.data || res;
    },
    onSuccess: (data) => {
      invalidateAll();
      if (data?.simulated) {
        toast.info('Invoice email saved to dev mailbox (simulated)');
      } else {
        toast.success(`Invoice email sent to ${invoice.customerEmail}`);
      }
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to send invoice');
    },
  });

  const handleOpenWhy = (line) => {
    setSelectedLineForWhy(line);
    setWhyDrawerOpen(true);
  };

  const availableActions = invoice.availableActions || [];
  const canConfirm = isStaff && (availableActions.includes('confirm') || invoice.status === 'draft');
  const canCancel = isStaff && (availableActions.includes('cancel') || (invoice.status !== 'cancelled' && Number(invoice.amountPaid || 0) === 0));
  const canSend = isStaff && (availableActions.includes('send') || ['confirmed', 'paid'].includes(invoice.status));
  const canRecordPayment = isStaff && (availableActions.includes('record_payment') || (invoice.status === 'confirmed' && outstanding > 0));

  return (
    <div className="space-y-6">
      {/* Top Header & Actions Bar */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {invoice.number}
              </h1>
              <StatusBadge
                status={invoice.status}
                isOverdue={invoice.isOverdue}
                daysOverdue={invoice.daysOverdue}
              />
              {invoice.status === 'confirmed' && Number(invoice.amountPaid) > 0 && (
                <Badge variant="blue" size="sm">
                  Partially Paid (₹{Number(invoice.amountPaid).toLocaleString('en-IN')})
                </Badge>
              )}
            </div>

            <p className="text-xs text-slate-500 mt-2 flex items-center gap-2 flex-wrap">
              <span>Customer:</span>
              <span className="font-semibold text-slate-800">{invoice.customerName}</span>
              <span>•</span>
              <span>Period:</span>
              <span className="font-medium text-slate-700">
                <DateText date={invoice.periodStart} /> to <DateText date={invoice.periodEnd} />
              </span>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              icon={Printer}
              onClick={() => {
                if (isStaff) {
                  navigate(`/invoices/${invoice.id}/print`);
                } else {
                  window.print();
                }
              }}
            >
              Print / PDF
            </Button>

            {/* Portal Pay Now */}
            {!isStaff && invoice.status === 'confirmed' && onPayNow && (
              <Button
                variant="primary"
                size="sm"
                icon={CreditCard}
                onClick={onPayNow}
              >
                Pay Now (Simulated)
              </Button>
            )}

            {/* Staff Actions */}
            {canSend && (
              <Button
                variant="outline"
                size="sm"
                icon={Send}
                onClick={() => sendMutation.mutate()}
                isLoading={sendMutation.isPending}
              >
                Send Email
              </Button>
            )}

            {canConfirm && (
              <Button
                variant="primary"
                size="sm"
                icon={CheckCircle}
                onClick={() => setConfirmModalOpen(true)}
              >
                Confirm Invoice
              </Button>
            )}

            {canRecordPayment && (
              <Button
                variant="primary"
                size="sm"
                icon={CreditCard}
                onClick={() => setRecordPaymentModalOpen(true)}
              >
                Record Payment
              </Button>
            )}

            {canCancel && (
              <Button
                variant="outline"
                size="sm"
                className="text-rose-600 hover:bg-rose-50 hover:border-rose-300"
                icon={XCircle}
                onClick={() => setCancelModalOpen(true)}
              >
                Cancel
              </Button>
            )}
          </div>
        </div>

        {/* Invoice Metadata Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 text-xs">
          <div>
            <span className="text-slate-400 font-medium">Invoice Date</span>
            <p className="font-semibold text-slate-900 mt-1">
              <DateText date={invoice.invoiceDate} />
            </p>
          </div>

          <div>
            <span className="text-slate-400 font-medium">Payment Due Date</span>
            <p className="font-semibold text-slate-900 mt-1 flex items-center gap-1.5">
              <DateText date={invoice.dueDate} />
              {invoice.isOverdue && (
                <span className="text-rose-600 font-bold">({invoice.daysOverdue}d overdue)</span>
              )}
            </p>
          </div>

          <div>
            <span className="text-slate-400 font-medium">Payment Terms</span>
            <p className="font-semibold text-slate-900 mt-1">
              {invoice.paymentTermName || 'Net 30'}
            </p>
          </div>

          <div>
            <span className="text-slate-400 font-medium">Subscription</span>
            <p className="font-semibold text-slate-900 mt-1">
              {isStaff ? (
                <Link
                  to={`/subscriptions/${invoice.subscriptionId}`}
                  className="text-indigo-600 hover:underline font-bold"
                >
                  {invoice.subscriptionNumber || `SUB-${invoice.subscriptionId}`}
                </Link>
              ) : (
                <span className="text-slate-800">
                  {invoice.subscriptionNumber || `SUB-${invoice.subscriptionId}`}
                </span>
              )}
            </p>
          </div>
        </div>
      </Card>

      {/* Invoice Lines Table */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Line Items & Calculations</h2>
          <span className="text-xs text-slate-500">
            Click ⓘ on any line for step-by-step price calculation breakdown
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-[11px] uppercase text-slate-500 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-6">Description</th>
                <th className="py-3 px-4 text-center">Qty</th>
                <th className="py-3 px-4 text-right">Unit Price</th>
                <th className="py-3 px-4 text-right">Subtotal</th>
                <th className="py-3 px-4 text-right">Discounts</th>
                <th className="py-3 px-4 text-right">Tax</th>
                <th className="py-3 px-6 text-right">Line Total</th>
                <th className="py-3 px-4 text-center w-16">Why?</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {(invoice.lines || []).map((line, idx) => {
                const totalDiscount =
                  Number(line.discountAmount || 0) + Number(line.subDiscountAmount || 0);

                return (
                  <tr key={line.id || idx} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-6 font-semibold text-slate-900">
                      <div>
                        {line.description}
                        {line.kind === 'plan_fee' && (
                          <span className="ml-2 text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-bold">
                            Plan Recurring Fee
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-medium">{line.quantity}</td>
                    <td className="py-3.5 px-4 text-right font-medium">
                      <Money amount={line.unitPrice} />
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium">
                      <Money amount={line.lineSubtotal || line.quantity * line.unitPrice} />
                    </td>
                    <td className="py-3.5 px-4 text-right text-emerald-600 font-medium">
                      {totalDiscount > 0 ? (
                        <span>-<Money amount={totalDiscount} /></span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {Number(line.taxAmount) > 0 ? (
                        <div>
                          <span className="font-medium text-slate-800">
                            <Money amount={line.taxAmount} />
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            ({line.taxRate}%)
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400">0%</span>
                      )}
                    </td>
                    <td className="py-3.5 px-6 text-right font-bold text-slate-900 text-sm">
                      <Money amount={line.lineTotal} />
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleOpenWhy(line)}
                        title="Why this amount? Click to view calculation trail"
                        className="p-1.5 rounded-lg text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 transition border border-transparent hover:border-indigo-200"
                      >
                        <Info className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div className="p-6 bg-slate-50/50 border-t border-slate-200 flex flex-col md:flex-row justify-between gap-6">
          {/* Invoice-Level Calc Trail / Rejected Discounts */}
          <div className="flex-1 max-w-md space-y-3">
            {invoice.calcTrail?.rejectedDiscounts && invoice.calcTrail.rejectedDiscounts.length > 0 && (
              <div className="p-3.5 bg-amber-50/70 rounded-xl border border-amber-200/80 text-xs">
                <p className="font-bold text-amber-900 flex items-center gap-1.5 mb-1.5">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  Discounts considered but not applied
                </p>
                <div className="space-y-1 text-slate-600">
                  {invoice.calcTrail.rejectedDiscounts.map((disc, i) => (
                    <div key={i} className="text-[11px] leading-relaxed">
                      <strong className="text-slate-800">{disc.name}:</strong> {disc.reason}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {invoice.calcTrail?.period && (
              <p className="text-[11px] text-slate-500">
                <strong>Period anchor:</strong> {invoice.calcTrail.period}
                {invoice.calcTrail.billingRunId && ` • Billing Run #${invoice.calcTrail.billingRunId}`}
              </p>
            )}
          </div>

          {/* Breakdown summary */}
          <div className="w-full md:w-80 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-900">
                <Money amount={invoice.subtotal} />
              </span>
            </div>

            {Number(invoice.discountTotal) > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Discounts Applied</span>
                <span>-<Money amount={invoice.discountTotal} /></span>
              </div>
            )}

            <div className="flex justify-between text-slate-600">
              <span>Taxes Breakdown (GST)</span>
              <span className="font-semibold text-slate-900">
                <Money amount={invoice.taxTotal} />
              </span>
            </div>

            <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2.5 border-t border-slate-200">
              <span>Total Amount</span>
              <span className="text-indigo-600">
                <Money amount={invoice.total} />
              </span>
            </div>

            <div className="flex justify-between text-slate-600 pt-1">
              <span>Amount Paid</span>
              <span className="font-semibold text-emerald-600">
                <Money amount={invoice.amountPaid || 0} />
              </span>
            </div>

            {outstanding > 0 && (
              <div className="flex justify-between text-sm font-bold text-rose-600 pt-1 border-t border-dashed border-slate-200">
                <span>Outstanding Balance</span>
                <span><Money amount={outstanding} /></span>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Payments History Table */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">Payment Transactions</h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Total Paid: ₹{Number(invoice.amountPaid || 0).toLocaleString('en-IN')}
          </span>
        </div>

        {(!invoice.payments || invoice.payments.length === 0) ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No payments have been recorded for this invoice yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 uppercase text-[10px] text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-6">Date</th>
                  <th className="py-2.5 px-4">Method</th>
                  <th className="py-2.5 px-4">Reference</th>
                  <th className="py-2.5 px-4">Notes</th>
                  <th className="py-2.5 px-6 text-right">Amount</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoice.payments.map((pmt) => {
                  const isVoided = !!pmt.voidedAt;
                  return (
                    <tr
                      key={pmt.id}
                      className={isVoided ? 'bg-slate-50 opacity-60 line-through' : 'hover:bg-slate-50/50'}
                    >
                      <td className="py-3 px-6 font-medium text-slate-900">
                        <DateText date={pmt.paidOn} />
                      </td>
                      <td className="py-3 px-4 font-semibold capitalize">
                        {pmt.method?.replace('_', ' ')}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {pmt.reference || '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-500">{pmt.note || '—'}</td>
                      <td className="py-3 px-6 text-right font-bold text-slate-900">
                        <Money amount={pmt.amount} />
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isVoided ? (
                          <Badge variant="red" size="sm">Voided</Badge>
                        ) : (
                          <Badge variant="green" size="sm">Settled</Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Reminder History (Staff Mode Only) */}
      {isStaff && invoice.reminders && invoice.reminders.length > 0 && (
        <Card className="overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-indigo-600" />
              <h2 className="text-sm font-bold text-slate-900">Reminder History & Schedule</h2>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 uppercase text-[10px] text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-6">Step</th>
                  <th className="py-2.5 px-4">Offset</th>
                  <th className="py-2.5 px-4">Scheduled For</th>
                  <th className="py-2.5 px-4">Sent At</th>
                  <th className="py-2.5 px-6">Message</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoice.reminders.map((r, i) => (
                  <tr key={r.id || i} className="hover:bg-slate-50/50">
                    <td className="py-3 px-6 font-semibold text-slate-800">
                      Step #{r.step}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {r.offsetDays >= 0 ? `+${r.offsetDays}d` : `${r.offsetDays}d`}
                    </td>
                    <td className="py-3 px-4 font-medium">
                      <DateText date={r.scheduledFor} />
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {r.sentAt ? <DateText date={r.sentAt} /> : '—'}
                    </td>
                    <td className="py-3 px-6 text-slate-700 max-w-xs truncate">
                      {r.message}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {r.status === 'sent' && <Badge variant="green" size="sm">Sent</Badge>}
                      {r.status === 'simulated' && <Badge variant="amber" size="sm">Simulated</Badge>}
                      {r.status === 'queued' && <Badge variant="blue" size="sm">Queued</Badge>}
                      {r.status === 'skipped' && <Badge variant="slate" size="sm">Skipped</Badge>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* "Why?" Drawer component */}
      <WhyDrawer
        isOpen={whyDrawerOpen}
        onClose={() => setWhyDrawerOpen(false)}
        line={selectedLineForWhy}
        invoiceNumber={invoice.number}
        rejectedDiscounts={invoice.calcTrail?.rejectedDiscounts}
      />

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={recordPaymentModalOpen}
        onClose={() => setRecordPaymentModalOpen(false)}
        invoice={invoice}
        onSuccess={() => invalidateAll()}
      />

      {/* Confirm Invoice Modal */}
      <ConfirmModal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={() => confirmMutation.mutate()}
        title="Confirm Invoice"
        message={`Are you sure you want to confirm draft invoice ${invoice.number}? This will lock the invoice lines and initiate payment collection.`}
        confirmText="Confirm Invoice"
        variant="primary"
        isLoading={confirmMutation.isPending}
      />

      {/* Cancel Invoice Modal */}
      <ConfirmModal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={() => cancelMutation.mutate()}
        title="Cancel Invoice"
        message={`Are you sure you want to cancel invoice ${invoice.number}? The billing period will stay consumed and will not automatically re-bill.`}
        confirmText="Cancel Invoice"
        variant="danger"
        isLoading={cancelMutation.isPending}
      />
    </div>
  );
}

export default InvoiceDetailView;
