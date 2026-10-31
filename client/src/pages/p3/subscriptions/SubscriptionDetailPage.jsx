import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Calendar,
  Send,
  CheckCircle,
  Play,
  Pause,
  XCircle,
  RotateCw,
  Sparkles,
  Layers,
  FileText,
  History,
  Info,
  Clock,
  AlertCircle,
  Building2,
} from 'lucide-react';
import http from '../../../api/http';
import { useToast } from '../../../components/ui/Toast';
import PageHeader from '../../../components/ui/PageHeader';
import Card, { CardHeader } from '../../../components/ui/Card';
import Stepper from '../../../components/ui/Stepper';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import StatusBadge from '../../../components/ui/StatusBadge';
import Money from '../../../components/ui/Money';
import DateText from '../../../components/ui/DateText';
import Tabs from '../../../components/ui/Tabs';
import Modal, { ConfirmModal } from '../../../components/ui/Modal';
import FormField from '../../../components/ui/FormField';
import Select from '../../../components/ui/Select';
import Input from '../../../components/ui/Input';
import { Skeleton } from '../../../components/ui/Skeleton';
import EmptyState from '../../../components/ui/EmptyState';

export function SubscriptionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('lines');

  // Action Modals State
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [closeReason, setCloseReason] = useState('early_close');

  const [renewModalOpen, setRenewModalOpen] = useState(false);
  const [newExpiryDate, setNewExpiryDate] = useState('');

  // Fetch Subscription
  const { data: subData, isLoading, error } = useQuery({
    queryKey: ['subscription', id],
    queryFn: async () => {
      const res = await http.get(`/subscriptions/${id}`);
      return res.data || res;
    },
  });

  // Fetch Invoices for this subscription
  const { data: invoicesData } = useQuery({
    queryKey: ['subscriptionInvoices', id],
    queryFn: async () => {
      const res = await http.get(`/invoices?subscriptionId=${id}`);
      return res.data || res;
    },
    enabled: activeTab === 'invoices',
  });

  // Fetch Timeline Events for this subscription
  const { data: timelineData } = useQuery({
    queryKey: ['subscriptionTimeline', id],
    queryFn: async () => {
      const res = await http.get(`/customers/${subData?.customerId}/timeline`);
      const events = res.data || res || [];
      return events.filter((e) => e.subscriptionId === Number(id));
    },
    enabled: !!subData?.customerId && activeTab === 'timeline',
  });

  // Fetch Upcoming Invoice Preview
  const { data: upcomingInvoiceData } = useQuery({
    queryKey: ['upcomingInvoice', id],
    queryFn: async () => {
      const res = await http.get(`/subscriptions/${id}/upcoming-invoice`);
      return res.data || res;
    },
    enabled: subData?.status === 'active',
  });

  const sub = subData;
  const invoices = Array.isArray(invoicesData) ? invoicesData : invoicesData?.data || [];
  const timeline = Array.isArray(timelineData) ? timelineData : [];
  const upcomingInvoice = upcomingInvoiceData?.data || upcomingInvoiceData;

  // Transition Mutation
  const transitionMutation = useMutation({
    mutationFn: async (to) => {
      return await http.post(`/subscriptions/${id}/transition`, { to });
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['subscription', id] });
      toast.success(`Subscription moved to ${updated.status.toUpperCase()}`);
    },
    onError: (err) => {
      toast.error(err.message || 'Transition rejected');
    },
  });

  // Pause Mutation
  const pauseMutation = useMutation({
    mutationFn: async () => {
      return await http.post(`/subscriptions/${id}/pause`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription', id] });
      toast.success('Subscription paused');
    },
    onError: (err) => {
      toast.error(err.message || 'Cannot pause subscription');
    },
  });

  // Resume Mutation
  const resumeMutation = useMutation({
    mutationFn: async () => {
      return await http.post(`/subscriptions/${id}/resume`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription', id] });
      toast.success('Subscription resumed');
    },
    onError: (err) => {
      toast.error(err.message || 'Cannot resume subscription');
    },
  });

  // Close Mutation
  const closeMutation = useMutation({
    mutationFn: async (reason) => {
      return await http.post(`/subscriptions/${id}/close`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription', id] });
      toast.success('Subscription closed');
      setCloseModalOpen(false);
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to close subscription');
    },
  });

  // Renew Mutation
  const renewMutation = useMutation({
    mutationFn: async (expiry) => {
      return await http.post(`/subscriptions/${id}/renew`, { newExpiryDate: expiry });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription', id] });
      toast.success('Subscription renewed successfully');
      setRenewModalOpen(false);
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to renew subscription');
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error || !sub) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-bold text-slate-800">Subscription not found</h3>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/subscriptions')}>
          Back to Subscriptions
        </Button>
      </div>
    );
  }

  const tabs = [
    { id: 'lines', label: 'Line Items', count: sub.lines?.length || 0 },
    { id: 'invoices', label: 'Invoices', count: invoices.length },
    { id: 'timeline', label: 'Timeline & History' },
    { id: 'details', label: 'Subscription Details' },
  ];

  const allowedTransitions = sub.allowedTransitions || [];
  const actions = sub.actions || {};
  const reasons = actions.reasons || {};

  return (
    <div className="space-y-6">
      {/* Top back link */}
      <div>
        <button
          onClick={() => navigate('/subscriptions')}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 mb-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to subscriptions
        </button>

        {/* Header with Title & Action Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">{sub.number}</h1>
              <StatusBadge status={sub.status} pausedAt={sub.pausedAt} />
            </div>
            <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
              <span>Customer:</span>
              <Link
                to={`/customers/${sub.customerId}`}
                className="font-medium text-indigo-600 hover:underline inline-flex items-center gap-1"
              >
                <Building2 className="h-3.5 w-3.5" />
                {sub.customerName}
              </Link>
              <span>· Plan: <strong>{sub.planName}</strong></span>
            </p>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Draft -> Send Quotation */}
            {allowedTransitions.includes('quotation') && (
              <Button
                variant="primary"
                size="sm"
                icon={Send}
                onClick={() => transitionMutation.mutate('quotation')}
                isLoading={transitionMutation.isPending}
              >
                Send Quotation
              </Button>
            )}

            {/* Quotation -> Confirm */}
            {allowedTransitions.includes('confirmed') && (
              <Button
                variant="primary"
                size="sm"
                icon={CheckCircle}
                onClick={() => transitionMutation.mutate('confirmed')}
                isLoading={transitionMutation.isPending}
              >
                Confirm Quotation
              </Button>
            )}

            {/* Confirmed -> Activate */}
            {allowedTransitions.includes('active') && (
              <Button
                variant="primary"
                size="sm"
                icon={Play}
                onClick={() => transitionMutation.mutate('active')}
                isLoading={transitionMutation.isPending}
              >
                Activate Subscription
              </Button>
            )}

            {/* Active -> Pause */}
            {sub.status === 'active' && !sub.pausedAt && (
              <Button
                variant="outline"
                size="sm"
                icon={Pause}
                disabled={!actions.canPause}
                title={reasons.pause || 'Pause recurring billing cycles'}
                onClick={() => pauseMutation.mutate()}
                isLoading={pauseMutation.isPending}
              >
                Pause
              </Button>
            )}

            {/* Active -> Resume */}
            {sub.status === 'active' && sub.pausedAt && (
              <Button
                variant="primary"
                size="sm"
                icon={Play}
                onClick={() => resumeMutation.mutate()}
                isLoading={resumeMutation.isPending}
              >
                Resume Billing
              </Button>
            )}

            {/* Active -> Renew */}
            {sub.status === 'active' && (
              <Button
                variant="outline"
                size="sm"
                icon={RotateCw}
                disabled={!actions.canRenew}
                title={reasons.renew || 'Extend subscription term'}
                onClick={() => {
                  const d = new Date(sub.expiryDate);
                  d.setFullYear(d.getFullYear() + 1);
                  setNewExpiryDate(d.toISOString().split('T')[0]);
                  setRenewModalOpen(true);
                }}
              >
                Renew
              </Button>
            )}

            {/* Close Early */}
            {sub.status !== 'closed' && (
              <Button
                variant="ghost"
                size="sm"
                icon={XCircle}
                disabled={!actions.canClose}
                title={reasons.close || 'Terminate subscription'}
                onClick={() => setCloseModalOpen(true)}
                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
              >
                Close
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Lifecycle Stepper Card */}
      <Card className="py-4">
        <Stepper currentStatus={sub.status} pausedAt={sub.pausedAt} />
        {sub.status === 'quotation' && sub.quoteValidUntil && (
          <div className="mt-3 pt-3 border-t text-xs text-center text-amber-700 font-medium flex items-center justify-center gap-1.5">
            <Clock className="h-4 w-4" />
            <span>
              Quotation valid until <DateText date={sub.quoteValidUntil} />. Must be confirmed before expiry.
            </span>
          </div>
        )}
      </Card>

      {/* Upcoming Invoice Banner (if Active) */}
      {sub.status === 'active' && upcomingInvoice && (
        <Card className="bg-indigo-50/50 border-indigo-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Upcoming Recurring Billing</h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Scheduled for <DateText date={upcomingInvoice.periodStart} /> · {upcomingInvoice.linesSummary}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 uppercase tracking-wider block font-medium">
                Estimated Invoice Amount
              </span>
              <span className="text-xl font-bold font-mono text-indigo-700">
                <Money amount={upcomingInvoice.estimatedAmount} />
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* TAB 1: LINE ITEMS */}
      {activeTab === 'lines' && (
        <Card className="p-0 overflow-hidden">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold border-b">
              <tr>
                <th className="py-3 px-4">Line Item / Product</th>
                <th className="py-3 px-4 text-center">Qty</th>
                <th className="py-3 px-4 text-right">Unit Price</th>
                <th className="py-3 px-4 text-right">Tax Rate</th>
                <th className="py-3 px-4 text-right">Amount / Cycle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(sub.lines || []).map((line, idx) => (
                <tr key={idx}>
                  <td className="py-3.5 px-4 font-medium text-slate-900">
                    Product #{line.productId}
                    {line.variantId ? ` (Variant #${line.variantId})` : ''}
                  </td>
                  <td className="py-3.5 px-4 text-center">{line.quantity}</td>
                  <td className="py-3.5 px-4 text-right"><Money amount={line.unitPrice} /></td>
                  <td className="py-3.5 px-4 text-right">{line.taxRate || 18}%</td>
                  <td className="py-3.5 px-4 text-right font-medium text-slate-900">
                    <Money amount={line.amount || line.unitPrice * line.quantity} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-sm font-semibold text-slate-800">
            <span>Recurring Cycle Total</span>
            <span className="text-base font-bold text-slate-900 font-mono">
              <Money amount={sub.recurringAmount || 0} />
            </span>
          </div>
        </Card>
      )}

      {/* TAB 2: INVOICES */}
      {activeTab === 'invoices' && (
        <Card className="p-0 overflow-hidden">
          <div className="divide-y divide-slate-100">
            {invoices.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No invoices generated yet"
                description="Invoices will be automatically created on each recurring billing date."
              />
            ) : (
              invoices.map((inv) => (
                <div
                  key={inv.id}
                  onClick={() => navigate(`/invoices/${inv.id}`)}
                  className="p-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition"
                >
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-sm text-indigo-600">{inv.number}</span>
                      <StatusBadge status={inv.status} isOverdue={inv.isOverdue} daysOverdue={inv.daysOverdue} />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Due: <DateText date={inv.dueDate} /> · Period: <DateText date={inv.periodStart} /> to <DateText date={inv.periodEnd} />
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-900 text-sm">
                      <Money amount={inv.total} />
                    </div>
                    <span className="text-xs text-slate-500">
                      Paid: <Money amount={inv.amountPaid || 0} />
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {/* TAB 3: TIMELINE */}
      {activeTab === 'timeline' && (
        <Card className="p-6">
          {timeline.length === 0 ? (
            <EmptyState
              icon={History}
              title="No events for this subscription"
              description="Actions taken on this subscription will appear chronologically here."
            />
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {timeline.map((ev, idx) => (
                <div key={idx} className="relative group">
                  <div className="absolute -left-6 top-1 h-3 w-3 rounded-full border-2 border-white bg-indigo-600 ring-2 ring-indigo-50 shadow-xs" />
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                    <p className="text-xs font-semibold text-slate-900">{ev.message}</p>
                    <div className="flex items-center gap-2">
                      {ev.simDate && (
                        <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-medium">
                          Simulated: {ev.simDate}
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400">
                        <DateText date={ev.occurredAt} />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* TAB 4: DETAILS */}
      {activeTab === 'details' && (
        <Card className="space-y-4">
          <CardHeader title="Subscription Agreement Parameters" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-xs text-slate-400 block">Start Date</span>
              <DateText date={sub.startDate} className="font-medium text-slate-800" />
            </div>

            <div>
              <span className="text-xs text-slate-400 block">Expiry Date</span>
              <DateText date={sub.expiryDate} className="font-medium text-slate-800" />
            </div>

            <div>
              <span className="text-xs text-slate-400 block">Billing Anchor Day</span>
              <span className="font-medium text-slate-800">
                Day {sub.billingAnchorDay || '1'} of billing cycle
              </span>
            </div>

            <div>
              <span className="text-xs text-slate-400 block">Close Reason</span>
              <span className="font-medium text-slate-800 capitalize">
                {sub.closeReason || '—'}
              </span>
            </div>

            {sub.notes && (
              <div className="col-span-2">
                <span className="text-xs text-slate-400 block">Notes & Terms</span>
                <p className="font-medium text-slate-800 mt-0.5">{sub.notes}</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Close Early Modal */}
      <ConfirmModal
        isOpen={closeModalOpen}
        onClose={() => setCloseModalOpen(false)}
        onConfirm={() => closeMutation.mutate(closeReason)}
        title="Close Subscription Early"
        message="Closing an active subscription halts all future recurring billing cycles."
        confirmText="Confirm Closure"
        variant="danger"
        isLoading={closeMutation.isPending}
      >
        <FormField label="Reason for Closure" required className="mt-3">
          <Select
            value={closeReason}
            onChange={(e) => setCloseReason(e.target.value)}
          >
            <option value="early_close">Customer Requested Early Termination</option>
            <option value="churned">Customer Churned / Competitor Switch</option>
            <option value="cancelled">Cancelled by Admin</option>
          </Select>
        </FormField>
      </ConfirmModal>

      {/* Renew Modal */}
      <Modal
        isOpen={renewModalOpen}
        onClose={() => setRenewModalOpen(false)}
        title="Renew Subscription"
        description="Extend the subscription lifecycle by specifying a new expiry date."
        size="sm"
      >
        <div className="space-y-4">
          <FormField label="New Expiry Date" required>
            <Input
              type="date"
              value={newExpiryDate}
              onChange={(e) => setNewExpiryDate(e.target.value)}
            />
          </FormField>
          <div className="flex justify-end gap-2.5 pt-4 border-t">
            <Button variant="outline" onClick={() => setRenewModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => renewMutation.mutate(newExpiryDate)}
              isLoading={renewMutation.isPending}
            >
              Extend Subscription
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default SubscriptionDetailPage;
