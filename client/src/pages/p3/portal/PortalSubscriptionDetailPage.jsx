import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  CheckCircle,
  Pause,
  Play,
  RotateCw,
  XCircle,
  Sparkles,
  Calendar,
  Layers,
} from 'lucide-react';
import http from '../../../api/http';
import { useToast } from '../../../components/ui/Toast';
import PageHeader from '../../../components/ui/PageHeader';
import Card, { CardHeader } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import StatusBadge from '../../../components/ui/StatusBadge';
import Money from '../../../components/ui/Money';
import DateText from '../../../components/ui/DateText';
import Stepper from '../../../components/ui/Stepper';
import Modal, { ConfirmModal } from '../../../components/ui/Modal';
import FormField from '../../../components/ui/FormField';
import Input from '../../../components/ui/Input';
import { Skeleton } from '../../../components/ui/Skeleton';

export function PortalSubscriptionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [renewModalOpen, setRenewModalOpen] = useState(false);
  const [newExpiryDate, setNewExpiryDate] = useState('');

  const { data: subData, isLoading, error } = useQuery({
    queryKey: ['portalSubscription', id],
    queryFn: async () => {
      const res = await http.get(`/portal/subscriptions/${id}`);
      return res.data || res;
    },
  });

  const { data: upcomingData } = useQuery({
    queryKey: ['portalUpcomingInvoice', id],
    queryFn: async () => {
      const res = await http.get(`/subscriptions/${id}/upcoming-invoice`);
      return res.data || res;
    },
    enabled: subData?.status === 'active',
  });

  const sub = subData;
  const upcomingInvoice = upcomingData?.data || upcomingData;

  // Accept Quotation Mutation
  const acceptQuotationMutation = useMutation({
    mutationFn: async () => {
      return await http.post(`/subscriptions/${id}/transition`, { to: 'confirmed' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portalSubscription', id] });
      toast.success('Quotation accepted and confirmed successfully');
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to accept quotation');
    },
  });

  // Pause Mutation
  const pauseMutation = useMutation({
    mutationFn: async () => {
      return await http.post(`/subscriptions/${id}/pause`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portalSubscription', id] });
      toast.success('Subscription billing paused');
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
      queryClient.invalidateQueries({ queryKey: ['portalSubscription', id] });
      toast.success('Subscription billing resumed');
    },
    onError: (err) => {
      toast.error(err.message || 'Cannot resume subscription');
    },
  });

  // Close Mutation
  const closeMutation = useMutation({
    mutationFn: async () => {
      return await http.post(`/subscriptions/${id}/close`, { reason: 'customer_portal_close' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portalSubscription', id] });
      toast.success('Subscription cancelled');
      setCloseModalOpen(false);
    },
    onError: (err) => {
      toast.error(err.message || 'Cannot close subscription');
    },
  });

  // Renew Mutation
  const renewMutation = useMutation({
    mutationFn: async (date) => {
      return await http.post(`/subscriptions/${id}/renew`, { newExpiryDate: date });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portalSubscription', id] });
      toast.success('Subscription renewed successfully');
      setRenewModalOpen(false);
    },
    onError: (err) => {
      toast.error(err.message || 'Cannot renew subscription');
    },
  });

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (error || !sub) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-bold text-slate-800">Subscription Not Found</h3>
        <p className="text-xs text-slate-500 mt-1">This record does not exist or belongs to another account.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/portal/subscriptions')}>
          Back to Subscriptions
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <button
          onClick={() => navigate('/portal/subscriptions')}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 mb-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to my subscriptions
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">{sub.number}</h1>
              <StatusBadge status={sub.status} pausedAt={sub.pausedAt} />
            </div>
            <p className="text-sm text-slate-500 mt-1">Plan: <strong>{sub.planName}</strong></p>
          </div>

          {/* Customer Allowed Actions */}
          <div className="flex items-center gap-2">
            {sub.status === 'quotation' && (
              <Button
                variant="primary"
                size="sm"
                icon={CheckCircle}
                onClick={() => acceptQuotationMutation.mutate()}
                isLoading={acceptQuotationMutation.isPending}
              >
                Accept Quotation
              </Button>
            )}

            {sub.status === 'active' && !sub.pausedAt && (
              <Button
                variant="outline"
                size="sm"
                icon={Pause}
                onClick={() => pauseMutation.mutate()}
                isLoading={pauseMutation.isPending}
              >
                Pause
              </Button>
            )}

            {sub.status === 'active' && sub.pausedAt && (
              <Button
                variant="primary"
                size="sm"
                icon={Play}
                onClick={() => resumeMutation.mutate()}
                isLoading={resumeMutation.isPending}
              >
                Resume
              </Button>
            )}

            {sub.status === 'active' && (
              <Button
                variant="outline"
                size="sm"
                icon={RotateCw}
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

            {sub.status !== 'closed' && (
              <Button
                variant="ghost"
                size="sm"
                icon={XCircle}
                onClick={() => setCloseModalOpen(true)}
                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
              >
                Cancel
              </Button>
            )}
          </div>
        </div>
      </div>

      <Card className="py-4">
        <Stepper currentStatus={sub.status} pausedAt={sub.pausedAt} />
      </Card>

      {/* Upcoming Invoice Card */}
      {sub.status === 'active' && upcomingInvoice && (
        <Card className="bg-indigo-50/50 border-indigo-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Next Upcoming Invoice</h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Scheduled for <DateText date={upcomingInvoice.periodStart} /> · {upcomingInvoice.linesSummary}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 uppercase tracking-wider block font-medium">
                Estimated Cycle Charge
              </span>
              <span className="text-xl font-bold font-mono text-indigo-700">
                <Money amount={upcomingInvoice.estimatedAmount} />
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* Lines Table */}
      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="text-sm font-bold text-slate-900">Included Subscriptions & Add-ons</h3>
        </div>
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold border-b">
            <tr>
              <th className="py-3 px-4">Item</th>
              <th className="py-3 px-4 text-center">Qty</th>
              <th className="py-3 px-4 text-right">Unit Price</th>
              <th className="py-3 px-4 text-right">Cycle Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(sub.lines || []).map((l, i) => (
              <tr key={i}>
                <td className="py-3.5 px-4 font-medium text-slate-900">Product #{l.productId}</td>
                <td className="py-3.5 px-4 text-center">{l.quantity}</td>
                <td className="py-3.5 px-4 text-right"><Money amount={l.unitPrice} /></td>
                <td className="py-3.5 px-4 text-right font-medium text-slate-900">
                  <Money amount={l.amount || l.unitPrice * l.quantity} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="p-4 bg-slate-50 border-t flex justify-between items-center text-sm font-semibold">
          <span>Recurring Total Per Billing Cycle</span>
          <span className="text-base font-bold text-slate-900 font-mono">
            <Money amount={sub.recurringAmount || 0} />
          </span>
        </div>
      </Card>

      {/* Confirm Close Modal */}
      <ConfirmModal
        isOpen={closeModalOpen}
        onClose={() => setCloseModalOpen(false)}
        onConfirm={() => closeMutation.mutate()}
        title="Cancel Subscription?"
        message="Are you sure you want to cancel this subscription? Your service coverage will terminate."
        confirmText="Confirm Cancellation"
        variant="danger"
        isLoading={closeMutation.isPending}
      />

      {/* Renew Modal */}
      <Modal
        isOpen={renewModalOpen}
        onClose={() => setRenewModalOpen(false)}
        title="Renew Subscription"
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
              Extend Term
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default PortalSubscriptionDetailPage;
