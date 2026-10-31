import React, { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  DollarSign,
  TrendingUp,
  Layers,
  AlertTriangle,
  Receipt,
  CreditCard,
  Percent,
  Clock,
  Info,
  Calendar,
  Search,
  ArrowUpRight,
  Send,
  Eye,
  Activity,
} from 'lucide-react';
import http from '../../../api/http';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Money from '../../../components/ui/Money';
import DateText from '../../../components/ui/DateText';
import Badge from '../../../components/ui/Badge';
import StatusBadge from '../../../components/ui/StatusBadge';
import { Skeleton } from '../../../components/ui/Skeleton';
import BarChartCard from '../../../components/p4/charts/BarChartCard';
import DonutCard from '../../../components/p4/charts/DonutCard';
import StackedBarCard from '../../../components/p4/charts/StackedBarCard';

export function FinanceDashboardPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Filters from URL
  const rangePreset = searchParams.get('preset') || 'this_month';
  const planId = searchParams.get('planId') || '';
  const customerQuery = searchParams.get('customer') || '';
  const viewMode = searchParams.get('mode') || 'summary'; // 'summary' | 'detailed'

  // Clock query
  const { data: clockData } = useQuery({
    queryKey: ['clock'],
    queryFn: async () => {
      try {
        const res = await http.get('/clock');
        return res.data || res;
      } catch {
        return { isSimulated: false, date: new Date().toISOString().split('T')[0] };
      }
    },
  });

  // Plans list for filter
  const { data: plansData } = useQuery({
    queryKey: ['plans'],
    queryFn: async () => {
      try {
        const res = await http.get('/plans');
        return res.data?.data || res.data || [];
      } catch {
        return [];
      }
    },
  });

  // Dashboard summary metrics
  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ['dashboardSummary', { rangePreset, planId, customerQuery }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (rangePreset) params.set('preset', rangePreset);
      if (planId) params.set('planId', planId);
      if (customerQuery) params.set('customer', customerQuery);

      const res = await http.get(`/dashboard/summary?${params.toString()}`);
      return res.data || res;
    },
  });

  // Revenue by month chart
  const { data: revMonthData, isLoading: revMonthLoading } = useQuery({
    queryKey: ['dashboardRevenueByMonth', { rangePreset }],
    queryFn: async () => {
      const res = await http.get(`/dashboard/revenue-by-month?preset=${rangePreset}`);
      return res.data || res;
    },
  });

  // Revenue by plan chart
  const { data: revPlanData, isLoading: revPlanLoading } = useQuery({
    queryKey: ['dashboardRevenueByPlan', { rangePreset }],
    queryFn: async () => {
      const res = await http.get(`/dashboard/revenue-by-plan?preset=${rangePreset}`);
      return res.data || res;
    },
  });

  // Invoice status split chart
  const { data: invStatusData, isLoading: invStatusLoading } = useQuery({
    queryKey: ['dashboardInvoiceStatus', { rangePreset }],
    queryFn: async () => {
      const res = await http.get(`/dashboard/invoice-status?preset=${rangePreset}`);
      return res.data || res;
    },
  });

  // Payment methods split chart
  const { data: paymentMethodsData, isLoading: pmtMethodsLoading } = useQuery({
    queryKey: ['dashboardPaymentMethods', { rangePreset }],
    queryFn: async () => {
      const res = await http.get(`/dashboard/payment-methods?preset=${rangePreset}`);
      return res.data || res;
    },
  });

  // MRR waterfall chart (Tier 3)
  const { data: mrrWaterfallData, isLoading: mrrWaterfallLoading } = useQuery({
    queryKey: ['dashboardMrrWaterfall'],
    queryFn: async () => {
      try {
        const res = await http.get('/dashboard/mrr-waterfall');
        return res.data || res;
      } catch {
        return null;
      }
    },
  });

  // Overdue invoices table (Detailed mode)
  const { data: overdueData, isLoading: overdueLoading } = useQuery({
    queryKey: ['dashboardOverdue'],
    queryFn: async () => {
      const res = await http.get('/dashboard/overdue?pageSize=10');
      return res.data?.data || res.data || [];
    },
    enabled: viewMode === 'detailed',
  });

  // Recent payments table (Detailed mode)
  const { data: recentPaymentsData, isLoading: recentPaymentsLoading } = useQuery({
    queryKey: ['dashboardRecentPayments'],
    queryFn: async () => {
      const res = await http.get('/dashboard/recent-payments?limit=10');
      return res.data?.data || res.data || [];
    },
    enabled: viewMode === 'detailed',
  });

  const summary = summaryData || {};
  const plans = plansData || [];

  const handlePresetChange = (preset) => {
    const next = new URLSearchParams(searchParams);
    next.set('preset', preset);
    setSearchParams(next);
  };

  const handlePlanChange = (pId) => {
    const next = new URLSearchParams(searchParams);
    if (pId) next.set('planId', pId);
    else next.delete('planId');
    setSearchParams(next);
  };

  const handleModeToggle = (mode) => {
    const next = new URLSearchParams(searchParams);
    next.set('mode', mode);
    setSearchParams(next);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & As of Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Finance & Revenue Dashboard
            </h1>
            {clockData?.isSimulated && (
              <Badge variant="amber" size="sm" className="flex items-center gap-1 font-mono">
                <Clock className="h-3 w-3" />
                Simulated Date
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
            <span>As of:</span>
            <strong className="text-slate-800">{clockData?.date || 'Today'}</strong>
            <span>•</span>
            <span>All recurring figures normalised to monthly MRR</span>
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 bg-slate-200/80 p-1 rounded-xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => handleModeToggle('summary')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              viewMode === 'summary'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Summary View
          </button>
          <button
            type="button"
            onClick={() => handleModeToggle('detailed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              viewMode === 'detailed'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Detailed View
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Preset Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'this_month', label: 'This Month' },
              { id: 'last_3_months', label: 'Last 3 Months' },
              { id: 'last_12_months', label: 'Last 12 Months' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => handlePresetChange(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                  rangePreset === p.id
                    ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Plan Selector & Customer Search */}
          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={planId}
              onChange={(e) => handlePlanChange(e.target.value)}
              className="py-1.5 px-3 text-xs bg-slate-50 rounded-lg border border-slate-200 focus:bg-white text-slate-800"
            >
              <option value="">All Subscription Plans</option>
              {plans.map((pl) => (
                <option key={pl.id} value={pl.id}>
                  {pl.name}
                </option>
              ))}
            </select>

            <div className="relative w-48">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={customerQuery}
                onChange={(e) => {
                  const next = new URLSearchParams(searchParams);
                  if (e.target.value) next.set('customer', e.target.value);
                  else next.delete('customer');
                  setSearchParams(next);
                }}
                placeholder="Filter by customer..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 rounded-lg border border-slate-200 focus:bg-white"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Subscriptions */}
        <Card className="p-4 hover:border-indigo-300 transition group relative">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Active Subscriptions</span>
            <div
              className="text-slate-400 group-hover:text-indigo-600 cursor-help"
              title="status='active' (excluding paused); paused count shown separately."
            >
              <Info className="h-4 w-4" />
            </div>
          </div>
          {summaryLoading ? (
            <Skeleton className="h-8 w-24 mt-2" />
          ) : (
            <div className="mt-2">
              <div className="text-2xl font-extrabold text-slate-900">
                {summary.activeSubscriptions ?? 0}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                +{summary.pausedSubscriptions ?? 0} currently paused
              </p>
            </div>
          )}
        </Card>

        {/* MRR */}
        <Card className="p-4 hover:border-indigo-300 transition group relative">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Monthly Recurring Revenue (MRR)</span>
            <div
              className="text-slate-400 group-hover:text-indigo-600 cursor-help"
              title="Sum over active, non-paused subscriptions of net recurring amount excluding tax, normalised to monthly: monthly x1, yearly ÷12, weekly x52/12, daily x365/12."
            >
              <Info className="h-4 w-4" />
            </div>
          </div>
          {summaryLoading ? (
            <Skeleton className="h-8 w-24 mt-2" />
          ) : (
            <div className="mt-2">
              <div className="text-2xl font-extrabold text-indigo-600">
                <Money amount={summary.mrr ?? 0} />
              </div>
              <p className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Normalized run-rate
              </p>
            </div>
          )}
        </Card>

        {/* Revenue Collected */}
        <Card className="p-4 hover:border-indigo-300 transition group relative">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Revenue Collected</span>
            <div
              className="text-slate-400 group-hover:text-indigo-600 cursor-help"
              title="Sum of non-voided payments with paid_on within selected date range."
            >
              <Info className="h-4 w-4" />
            </div>
          </div>
          {summaryLoading ? (
            <Skeleton className="h-8 w-24 mt-2" />
          ) : (
            <div className="mt-2">
              <div className="text-2xl font-extrabold text-emerald-600">
                <Money amount={summary.revenueCollected ?? 0} />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Invoiced: <Money amount={summary.invoiced ?? 0} />
              </p>
            </div>
          )}
        </Card>

        {/* Collection Rate */}
        <Card className="p-4 hover:border-indigo-300 transition group relative">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Collection Rate</span>
            <div
              className="text-slate-400 group-hover:text-indigo-600 cursor-help"
              title="Collected ÷ Invoiced for the selected date range."
            >
              <Info className="h-4 w-4" />
            </div>
          </div>
          {summaryLoading ? (
            <Skeleton className="h-8 w-24 mt-2" />
          ) : (
            <div className="mt-2">
              <div className="text-2xl font-extrabold text-slate-900">
                {summary.collectionRate ?? 0}%
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, summary.collectionRate ?? 0)}%` }}
                />
              </div>
            </div>
          )}
        </Card>

        {/* Invoiced Total */}
        <Card className="p-4 hover:border-indigo-300 transition group relative">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Invoiced</span>
            <div
              className="text-slate-400 group-hover:text-indigo-600 cursor-help"
              title="Sum of confirmed + paid invoices with invoice_date in range (drafts and cancelled excluded)."
            >
              <Info className="h-4 w-4" />
            </div>
          </div>
          {summaryLoading ? (
            <Skeleton className="h-8 w-24 mt-2" />
          ) : (
            <div className="mt-2">
              <div className="text-2xl font-extrabold text-slate-900">
                <Money amount={summary.invoiced ?? 0} />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Confirmed & Paid</p>
            </div>
          )}
        </Card>

        {/* Outstanding Total */}
        <Card className="p-4 hover:border-indigo-300 transition group relative">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Outstanding Receivables</span>
            <div
              className="text-slate-400 group-hover:text-indigo-600 cursor-help"
              title="Sum of (total - amount_paid) for confirmed invoices."
            >
              <Info className="h-4 w-4" />
            </div>
          </div>
          {summaryLoading ? (
            <Skeleton className="h-8 w-24 mt-2" />
          ) : (
            <div className="mt-2">
              <div className="text-2xl font-extrabold text-amber-600">
                <Money amount={summary.outstanding?.amount ?? 0} />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {summary.outstanding?.count ?? 0} invoices awaiting settlement
              </p>
            </div>
          )}
        </Card>

        {/* Overdue Total & Avg Days */}
        <Card className="p-4 hover:border-rose-300 transition group relative sm:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-slate-500">Overdue Risk Exposure</span>
              <Badge variant="red" size="sm">Overdue</Badge>
            </div>
            <div
              className="text-slate-400 group-hover:text-rose-600 cursor-help"
              title="Confirmed invoices with due_date < today and amount_paid < total. Shows count, total unpaid balance, and average days past due."
            >
              <Info className="h-4 w-4" />
            </div>
          </div>
          {summaryLoading ? (
            <Skeleton className="h-8 w-24 mt-2" />
          ) : (
            <div className="mt-2 flex items-baseline justify-between gap-4">
              <div>
                <div className="text-2xl font-extrabold text-rose-600">
                  <Money amount={summary.overdue?.amount ?? 0} />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {summary.overdue?.count ?? 0} overdue invoice(s)
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-slate-700">Average Delay:</span>
                <p className="text-lg font-bold text-slate-900">
                  {summary.overdue?.avgDays ?? 0} days
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Collected vs Invoiced by Month */}
        <BarChartCard
          title="Revenue Collected vs. Invoiced"
          subtitle="Monthly cash collection performance vs. billings generated"
          data={revMonthData || []}
          xKey="month"
          bars={[
            { dataKey: 'invoiced', name: 'Invoiced', color: '#818cf8' },
            { dataKey: 'collected', name: 'Collected', color: '#10b981' },
          ]}
          isLoading={revMonthLoading}
          height={280}
        />

        {/* Revenue by Plan */}
        <BarChartCard
          title="Revenue by Subscription Plan"
          subtitle="Top contributing plan subscriptions across current cycle"
          data={revPlanData || []}
          xKey="plan"
          bars={[{ dataKey: 'revenue', name: 'Revenue', color: '#4f46e5' }]}
          layout="vertical"
          isLoading={revPlanLoading}
          height={280}
        />

        {/* Invoice Status Split */}
        <DonutCard
          title="Invoice Status Breakdown"
          subtitle="Current distribution across billing states"
          data={invStatusData || []}
          nameKey="status"
          valueKey="amount"
          isLoading={invStatusLoading}
          height={260}
        />

        {/* Payment Methods Split */}
        <DonutCard
          title="Payment Methods Distribution"
          subtitle="Settlement channels by collected volume"
          data={paymentMethodsData || []}
          nameKey="method"
          valueKey="amount"
          isLoading={pmtMethodsLoading}
          height={260}
        />
      </div>

      {/* MRR Waterfall Card (Tier 3) */}
      {mrrWaterfallData && mrrWaterfallData.length > 0 && (
        <StackedBarCard
          title="MRR Movement Waterfall"
          subtitle="Opening MRR, new additions, expansion, contraction, and churn movements"
          data={mrrWaterfallData}
          xKey="month"
          bars={[
            { dataKey: 'opening', name: 'Opening MRR', color: '#94a3b8' },
            { dataKey: 'newMrr', name: 'New MRR', color: '#10b981' },
            { dataKey: 'expansion', name: 'Expansion', color: '#06b6d4' },
            { dataKey: 'contraction', name: 'Contraction', color: '#f59e0b' },
            { dataKey: 'churn', name: 'Churn', color: '#ef4444' },
          ]}
          isLoading={mrrWaterfallLoading}
          height={260}
        />
      )}

      {/* Detailed Tables (When in Detailed Mode) */}
      {viewMode === 'detailed' && (
        <div className="space-y-6 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-rose-500" />
              Overdue Invoices Requiring Immediate Action
            </h2>
            <Link
              to="/collections"
              className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
            >
              Open Collections Cockpit <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Overdue Invoices Table */}
          <Card className="overflow-hidden">
            {overdueLoading ? (
              <div className="p-6 space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : (!overdueData || overdueData.length === 0) ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Great news! There are no overdue invoices at this time.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 uppercase text-[10px] text-slate-500 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-6">Invoice #</th>
                      <th className="py-2.5 px-4">Customer</th>
                      <th className="py-2.5 px-4">Due Date</th>
                      <th className="py-2.5 px-4 text-center">Days Overdue</th>
                      <th className="py-2.5 px-6 text-right">Outstanding</th>
                      <th className="py-2.5 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {overdueData.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-6 font-mono font-bold">
                          <Link to={`/invoices/${inv.id}`} className="text-indigo-600 hover:underline">
                            {inv.number}
                          </Link>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-900">
                          {inv.customerName}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          <DateText date={inv.dueDate} />
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full text-[11px]">
                            {inv.daysOverdue} days
                          </span>
                        </td>
                        <td className="py-3 px-6 text-right font-bold text-rose-600">
                          <Money amount={inv.outstanding} />
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs py-1 px-2.5"
                            onClick={() => navigate('/collections')}
                          >
                            Remind
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Recent Payments Table */}
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-emerald-600" />
              Recent Cash Collections
            </h2>

            <Card className="overflow-hidden">
              {recentPaymentsLoading ? (
                <div className="p-6 space-y-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : (!recentPaymentsData || recentPaymentsData.length === 0) ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No recent payment settlements recorded.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 uppercase text-[10px] text-slate-500 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-6">Date</th>
                        <th className="py-2.5 px-4">Invoice #</th>
                        <th className="py-2.5 px-4">Customer</th>
                        <th className="py-2.5 px-4">Method</th>
                        <th className="py-2.5 px-6 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {recentPaymentsData.map((pmt) => (
                        <tr key={pmt.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-6 font-medium text-slate-900">
                            <DateText date={pmt.paidOn} />
                          </td>
                          <td className="py-3 px-4 font-mono font-bold">
                            <Link to={`/invoices/${pmt.invoiceId}`} className="text-indigo-600 hover:underline">
                              {pmt.invoiceNumber}
                            </Link>
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-900">
                            {pmt.customerName}
                          </td>
                          <td className="py-3 px-4 capitalize">
                            {pmt.method?.replace('_', ' ')}
                          </td>
                          <td className="py-3 px-6 text-right font-bold text-emerald-600">
                            <Money amount={pmt.amount} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

export default FinanceDashboardPage;
