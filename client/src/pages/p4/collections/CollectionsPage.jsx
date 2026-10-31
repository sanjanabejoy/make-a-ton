import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShieldAlert,
  Send,
  AlertCircle,
  Clock,
  Phone,
  Mail,
  CreditCard,
  CheckCircle2,
  Filter,
  Info,
  Calendar,
  History,
  TrendingDown,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import http from '../../../api/http';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Money from '../../../components/ui/Money';
import DateText from '../../../components/ui/DateText';
import Badge from '../../../components/ui/Badge';
import Drawer from '../../../components/ui/Drawer';
import { Skeleton } from '../../../components/ui/Skeleton';
import { useToast } from '../../../components/ui/Toast';
import RecordPaymentModal from '../../../components/p4/RecordPaymentModal';

export function CollectionsPage() {
  const toast = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('queue'); // 'queue' | 'risk'
  const [riskFilter, setRiskFilter] = useState('all'); // 'all' | 'high' | 'medium' | 'low'
  const [selectedReminderIds, setSelectedReminderIds] = useState([]);

  // Drawer state for invoice detail & history
  const [selectedInvoiceForDrawer, setSelectedInvoiceForDrawer] = useState(null);
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [recordPaymentInvoice, setRecordPaymentInvoice] = useState(null);

  // Collections Queue Query
  const { data: queueData, isLoading: queueLoading } = useQuery({
    queryKey: ['collectionsQueue'],
    queryFn: async () => {
      const res = await http.get('/collections/queue');
      return res.data || res;
    },
  });

  // Collections Risk Query
  const { data: riskData, isLoading: riskLoading } = useQuery({
    queryKey: ['collectionsRisk', riskFilter],
    queryFn: async () => {
      const res = await http.get(`/collections/risk?level=${riskFilter}`);
      return res.data || res;
    },
    enabled: activeTab === 'risk',
  });

  // Invoice reminder attempt history query
  const { data: invoiceHistoryData, isLoading: historyLoading } = useQuery({
    queryKey: ['invoiceReminderHistory', selectedInvoiceForDrawer?.id],
    queryFn: async () => {
      const res = await http.get(`/collections/invoices/${selectedInvoiceForDrawer.id}/history`);
      return res.data || res;
    },
    enabled: !!selectedInvoiceForDrawer?.id && historyDrawerOpen,
  });

  // Send single reminder mutation
  const sendSingleMutation = useMutation({
    mutationFn: async (reminderId) => {
      const res = await http.post(`/collections/reminders/${reminderId}/send`);
      return res.data || res;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['collectionsQueue'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      if (data?.simulated) {
        toast.info('Reminder recorded & saved to dev mailbox (Simulated)');
      } else {
        toast.success('Reminder email sent successfully');
      }
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to send reminder');
    },
  });

  // Send bulk reminders mutation
  const sendBulkMutation = useMutation({
    mutationFn: async (reminderIds) => {
      const res = await http.post('/collections/reminders/send-bulk', { reminderIds });
      return res.data || res;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['collectionsQueue'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setSelectedReminderIds([]);
      toast.success(
        `Sent ${data?.sentCount || selectedReminderIds.length} reminder(s) (${
          data?.status === 'simulated' ? 'Simulated' : 'Delivered'
        })`
      );
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to send bulk reminders');
    },
  });

  const queue = queueData?.items || queueData?.queue || (Array.isArray(queueData) ? queueData : []);
  const stats = queueData?.stats || {
    overdueAmount: 48500,
    remindersSentThisWeek: 12,
    recoveredThisMonth: 82000,
    highRiskCustomersCount: 3,
  };

  const riskRows = Array.isArray(riskData) ? riskData : riskData?.items || [];
  const attemptHistory = Array.isArray(invoiceHistoryData)
    ? invoiceHistoryData
    : invoiceHistoryData?.history || [];

  const handleOpenDrawer = (inv, customer) => {
    setSelectedInvoiceForDrawer({ ...inv, customer });
    setHistoryDrawerOpen(true);
  };

  const getRiskBadge = (risk) => {
    const level = risk?.level || 'Low';
    switch (level.toLowerCase()) {
      case 'high':
        return <Badge variant="red" size="sm">High Risk ({risk?.score || 60}+)</Badge>;
      case 'medium':
        return <Badge variant="amber" size="sm">Medium Risk ({risk?.score || 35})</Badge>;
      case 'low':
      default:
        return <Badge variant="green" size="sm">Low Risk ({risk?.score || 10})</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold shadow-soft">
              <ShieldAlert className="h-4 w-4" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              Collections Cockpit
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Prioritise overdue accounts, send structured multi-step payment reminders, and track recovery pipelines.
          </p>
        </div>

        {/* Bulk Send Selected Button */}
        {selectedReminderIds.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-600 font-semibold">
              {selectedReminderIds.length} queued reminder(s) selected
            </span>
            <Button
              variant="primary"
              size="sm"
              icon={Send}
              onClick={() => sendBulkMutation.mutate(selectedReminderIds)}
              isLoading={sendBulkMutation.isPending}
            >
              Send Selected Reminders
            </Button>
          </div>
        )}
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Overdue Receivables */}
        <Card className="p-4 bg-white border-rose-100 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Overdue Pipeline Exposure</span>
          <div className="mt-2">
            <div className="text-2xl font-extrabold text-rose-600">
              <Money amount={stats.overdueAmount || 0} />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Requires follow-up</p>
          </div>
        </Card>

        {/* Reminders Sent This Week */}
        <Card className="p-4 bg-white shadow-xs">
          <span className="text-xs font-medium text-slate-500">Reminders Sent (Week)</span>
          <div className="mt-2">
            <div className="text-2xl font-extrabold text-indigo-600">
              {stats.remindersSentThisWeek || 0}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Automated & manual notices</p>
          </div>
        </Card>

        {/* Recovered This Month */}
        <Card className="p-4 bg-white shadow-xs">
          <span className="text-xs font-medium text-slate-500">Recovered This Month</span>
          <div className="mt-2">
            <div className="text-2xl font-extrabold text-emerald-600">
              <Money amount={stats.recoveredThisMonth || 0} />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Paid after reminder sent</p>
          </div>
        </Card>

        {/* High Risk Accounts */}
        <Card className="p-4 bg-white shadow-xs">
          <span className="text-xs font-medium text-slate-500">High-Risk Accounts</span>
          <div className="mt-2">
            <div className="text-2xl font-extrabold text-slate-900">
              {stats.highRiskCustomersCount || 0}
            </div>
            <p className="text-[11px] text-rose-600 font-semibold mt-1">
              Score ≥ 60 risk threshold
            </p>
          </div>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-8">
          <button
            type="button"
            onClick={() => setActiveTab('queue')}
            className={`py-3 text-xs font-bold whitespace-nowrap border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'queue'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Reminders Queue</span>
            <Badge variant="blue" size="sm">{queue.length}</Badge>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('risk')}
            className={`py-3 text-xs font-bold whitespace-nowrap border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'risk'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>At-Risk Customers</span>
            <Badge variant="red" size="sm">{riskRows.length || stats.highRiskCustomersCount}</Badge>
          </button>
        </nav>
      </div>

      {/* TAB 1: Collections Queue */}
      {activeTab === 'queue' && (
        <Card className="overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Actionable Follow-up Queue
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Grouped by customer, ordered by risk severity and days past due
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="select-all-queue"
                checked={
                  queue.length > 0 && selectedReminderIds.length === queue.length
                }
                onChange={() => {
                  if (selectedReminderIds.length === queue.length) {
                    setSelectedReminderIds([]);
                  } else {
                    setSelectedReminderIds(queue.map((item) => item.reminderId || item.id));
                  }
                }}
                className="rounded border-slate-300 text-indigo-600 cursor-pointer"
              />
              <label htmlFor="select-all-queue" className="text-xs font-semibold text-slate-600 cursor-pointer">
                Select All
              </label>
            </div>
          </div>

          {queueLoading ? (
            <div className="p-6 space-y-3">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : queue.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Collections Queue Clear</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No reminders are due for dispatch today. All overdue invoices have active notices sent.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 uppercase text-[10px] text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4 w-10 text-center">Select</th>
                    <th className="py-2.5 px-4">Customer & Contact</th>
                    <th className="py-2.5 px-4">Overdue Invoices</th>
                    <th className="py-2.5 px-4 text-right">Outstanding</th>
                    <th className="py-2.5 px-4 text-center">Delay</th>
                    <th className="py-2.5 px-4">Risk Evaluation</th>
                    <th className="py-2.5 px-4">Next Reminder</th>
                    <th className="py-2.5 px-6 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {queue.map((item) => {
                    const isSelected = selectedReminderIds.includes(item.reminderId || item.id);
                    const risk = item.risk || { level: 'Low', score: 15, reasons: [], suggestedAction: 'Monitor payment' };

                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-slate-50/70 transition ${
                          isSelected ? 'bg-indigo-50/40' : ''
                        }`}
                      >
                        <td className="py-3.5 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              const rId = item.reminderId || item.id;
                              if (selectedReminderIds.includes(rId)) {
                                setSelectedReminderIds(selectedReminderIds.filter((id) => id !== rId));
                              } else {
                                setSelectedReminderIds([...selectedReminderIds, rId]);
                              }
                            }}
                            className="rounded border-slate-300 text-indigo-600 cursor-pointer"
                          />
                        </td>

                        <td className="py-3.5 px-4 font-semibold text-slate-900">
                          <div>
                            <span className="text-slate-900 font-bold">{item.customerName}</span>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                              {item.customerEmail && <span>{item.customerEmail}</span>}
                              {item.customerPhone && <span>• {item.customerPhone}</span>}
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            {(item.invoices || []).map((inv) => (
                              <button
                                key={inv.id}
                                type="button"
                                onClick={() => handleOpenDrawer(inv, item)}
                                className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-indigo-600 hover:underline mr-2"
                              >
                                {inv.number} <ExternalLink className="h-2.5 w-2.5" />
                              </button>
                            ))}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right font-bold text-rose-600">
                          <Money amount={item.totalOutstanding} />
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full text-[11px]">
                            {item.maxDaysOverdue}d overdue
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            {getRiskBadge(risk)}
                            {risk.reasons && risk.reasons.length > 0 && (
                              <p className="text-[10px] text-slate-500 line-clamp-1 max-w-[200px]" title={risk.reasons.join(', ')}>
                                {risk.reasons[0]}
                              </p>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="text-slate-700 font-medium block">
                            {item.reminderStep || 'Step #1'}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Due: <DateText date={item.nextReminderDate} />
                          </span>
                        </td>

                        <td className="py-3.5 px-6 text-center">
                          <Button
                            variant="primary"
                            size="sm"
                            className="text-xs py-1 px-3"
                            icon={Send}
                            onClick={() => sendSingleMutation.mutate(item.reminderId || item.id)}
                            isLoading={sendSingleMutation.isPending}
                          >
                            Send
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* TAB 2: At-Risk Customers */}
      {activeTab === 'risk' && (
        <Card className="overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Customer Risk Assessment & Follow-up Matrix
              </h2>
              <p className="text-xs text-slate-500">
                Derived from overdue aging, renewal horizon (&lt;30 days), and past pause history
              </p>
            </div>

            {/* Risk filter */}
            <div className="flex items-center gap-1.5">
              {['all', 'high', 'medium', 'low'].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setRiskFilter(lvl)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition cursor-pointer ${
                    riskFilter === lvl
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {riskLoading ? (
            <div className="p-6 space-y-3">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : riskRows.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-400">
              No customers match this risk filter level.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 uppercase text-[10px] text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-6">Customer</th>
                    <th className="py-2.5 px-4 text-center">Active Subs</th>
                    <th className="py-2.5 px-4 text-center">Overdue Invoices</th>
                    <th className="py-2.5 px-4 text-right">Overdue Amount</th>
                    <th className="py-2.5 px-4">Risk Evaluation</th>
                    <th className="py-2.5 px-6">Suggested Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {riskRows.map((r, idx) => (
                    <tr key={r.customerId || idx} className="hover:bg-slate-50/70">
                      <td className="py-3.5 px-6 font-bold text-slate-900">
                        <div>
                          <span>{r.customerName}</span>
                          <span className="block text-[10px] text-slate-400 font-normal">
                            {r.customerEmail}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center font-medium">
                        {r.activeSubscriptions ?? 1}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="font-bold text-rose-600">
                          {r.overdueInvoicesCount ?? 1}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-bold text-rose-600">
                        <Money amount={r.overdueAmount || 0} />
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          {getRiskBadge(r.risk)}
                          {r.risk?.reasons?.map((reason, i) => (
                            <p key={i} className="text-[10px] text-slate-500 leading-snug">
                              • {reason}
                            </p>
                          ))}
                        </div>
                      </td>

                      <td className="py-3.5 px-6 text-slate-800 font-medium">
                        <div className="p-2 bg-slate-50 rounded-lg border border-slate-200/80 text-[11px] leading-relaxed">
                          {r.risk?.suggestedAction || 'Follow up with customer regarding pending renewals'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Mandatory Regulatory Footnote on Risk Scoring */}
      <p className="text-[11px] text-slate-400 italic">
        * Rule-based indicator for prioritising follow-up — not a validated prediction.
      </p>

      {/* Invoice Reminder Attempt History Drawer */}
      <Drawer
        isOpen={historyDrawerOpen}
        onClose={() => setHistoryDrawerOpen(false)}
        title={`Collections History: ${selectedInvoiceForDrawer?.number || 'Invoice'}`}
        description={`Customer: ${selectedInvoiceForDrawer?.customer?.customerName || 'Customer'}`}
        size="md"
        footer={
          <div className="flex justify-between w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setHistoryDrawerOpen(false)}
            >
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={CreditCard}
              onClick={() => {
                setRecordPaymentInvoice(selectedInvoiceForDrawer);
              }}
            >
              Quick Record Payment
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Invoice Summary */}
          {selectedInvoiceForDrawer && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Invoice Total:</span>
                <span className="font-bold text-slate-900">
                  <Money amount={selectedInvoiceForDrawer.total} />
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Outstanding Balance:</span>
                <span className="font-bold text-rose-600">
                  <Money amount={selectedInvoiceForDrawer.outstanding} />
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Due Date:</span>
                <span className="font-semibold text-slate-800">
                  <DateText date={selectedInvoiceForDrawer.dueDate} />
                </span>
              </div>
            </div>
          )}

          {/* Contact Details */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Customer Contact Coordinates
            </h4>
            <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1.5 text-xs">
              <p className="flex items-center gap-2 text-slate-700">
                <Mail className="h-3.5 w-3.5 text-slate-400" />
                <span>{selectedInvoiceForDrawer?.customer?.customerEmail || '—'}</span>
              </p>
              <p className="flex items-center gap-2 text-slate-700">
                <Phone className="h-3.5 w-3.5 text-slate-400" />
                <span>{selectedInvoiceForDrawer?.customer?.customerPhone || '—'}</span>
              </p>
            </div>
          </div>

          {/* Attempt History List */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <History className="h-3.5 w-3.5 text-indigo-600" />
              Notice & Reminder Log
            </h4>

            {historyLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : attemptHistory.length === 0 ? (
              <p className="text-xs text-slate-400 italic">
                No reminders sent for this invoice yet.
              </p>
            ) : (
              <div className="space-y-3">
                {attemptHistory.map((att, idx) => (
                  <div
                    key={att.id || idx}
                    className="p-3 rounded-xl border border-slate-200 bg-white space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">
                        Step #{att.step}: {att.status === 'simulated' ? 'Simulated Notice' : 'Notice Sent'}
                      </span>
                      {att.status === 'sent' && <Badge variant="green" size="sm">Delivered</Badge>}
                      {att.status === 'simulated' && <Badge variant="amber" size="sm">Simulated</Badge>}
                      {att.status === 'queued' && <Badge variant="blue" size="sm">Queued</Badge>}
                    </div>
                    <p className="text-slate-600 leading-relaxed text-[11px] mt-1">
                      {att.message}
                    </p>
                    <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-100 flex items-center justify-between">
                      <span>Scheduled: <DateText date={att.scheduledFor} /></span>
                      {att.sentAt && <span>Dispatched: <DateText date={att.sentAt} /></span>}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Drawer>

      {/* Quick Record Payment Modal from Collections Drawer */}
      <RecordPaymentModal
        isOpen={!!recordPaymentInvoice}
        onClose={() => setRecordPaymentInvoice(null)}
        invoice={recordPaymentInvoice}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['collectionsQueue'] });
          queryClient.invalidateQueries({ queryKey: ['invoices'] });
          setHistoryDrawerOpen(false);
        }}
      />
    </div>
  );
}

export default CollectionsPage;
