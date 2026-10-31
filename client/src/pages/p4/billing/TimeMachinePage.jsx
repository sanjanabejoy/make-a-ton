import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Clock,
  FastForward,
  RotateCcw,
  Play,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Check,
  TrendingUp,
  FileText,
  ShieldCheck,
  ArrowRight,
  Info,
  Layers,
  Sparkles,
} from 'lucide-react';
import { addDays, addMonths, format, parseISO, differenceInDays } from 'date-fns';
import http from '../../../api/http';
import { useAuth } from '../../../auth/AuthContext';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Money from '../../../components/ui/Money';
import DateText from '../../../components/ui/DateText';
import Badge from '../../../components/ui/Badge';
import { Skeleton } from '../../../components/ui/Skeleton';
import { ConfirmModal } from '../../../components/ui/Modal';
import { useToast } from '../../../components/ui/Toast';
import BarChartCard from '../../../components/p4/charts/BarChartCard';
import WhyDrawer from '../../../components/p4/WhyDrawer';

export function TimeMachinePage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const toast = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Active clock query
  const { data: clockData, isLoading: clockLoading } = useQuery({
    queryKey: ['clock'],
    queryFn: async () => {
      try {
        const res = await http.get('/clock');
        return res.data || res;
      } catch {
        return { isSimulated: false, date: '2026-10-31', realDate: '2026-10-31' };
      }
    },
  });

  const currentDateStr = clockData?.date || '2026-10-31';
  const currentDate = useMemo(() => {
    try {
      return parseISO(currentDateStr);
    } catch {
      return new Date();
    }
  }, [currentDateStr]);

  // Target simulation date state
  const [targetDateStr, setTargetDateStr] = useState(currentDateStr);
  const [sliderOffsetDays, setSliderOffsetDays] = useState(0);

  // Sync targetDate when clock loads
  useEffect(() => {
    if (clockData?.date) {
      setTargetDateStr(clockData.date);
      setSliderOffsetDays(0);
    }
  }, [clockData?.date]);

  // Advance clock mutation
  const resetClockMutation = useMutation({
    mutationFn: async () => {
      const res = await http.post('/clock/reset');
      return res.data || res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast.success('Simulation clock reset to actual system date');
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to reset clock');
    },
  });

  // Debounced target date for preview
  const [debouncedTargetDate, setDebouncedTargetDate] = useState(targetDateStr);
  const debounceTimerRef = useRef(null);

  const handleDateChange = (newDateStr) => {
    setTargetDateStr(newDateStr);
    try {
      const d = parseISO(newDateStr);
      const diff = Math.max(0, differenceInDays(d, currentDate));
      setSliderOffsetDays(Math.min(365, diff));
    } catch {
      // ignore
    }

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedTargetDate(newDateStr);
    }, 400);
  };

  const handleSliderChange = (e) => {
    const days = parseInt(e.target.value, 10);
    setSliderOffsetDays(days);
    const newDate = addDays(currentDate, days);
    const newDateStr = format(newDate, 'yyyy-MM-dd');
    setTargetDateStr(newDateStr);

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedTargetDate(newDateStr);
    }, 400);
  };

  const handleQuickJump = (type, count = 1) => {
    let nextDate = currentDate;
    if (type === 'day') nextDate = addDays(currentDate, count);
    if (type === 'week') nextDate = addDays(currentDate, count * 7);
    if (type === 'month') nextDate = addMonths(currentDate, count);

    const newDateStr = format(nextDate, 'yyyy-MM-dd');
    handleDateChange(newDateStr);
  };

  // Preview query
  const { data: previewData, isFetching: previewLoading } = useQuery({
    queryKey: ['billingPreview', debouncedTargetDate],
    queryFn: async () => {
      const res = await http.post('/billing/preview', { asOfDate: debouncedTargetDate });
      return res.data || res;
    },
    enabled: !!debouncedTargetDate,
  });

  // Run billing for today mutation
  const runBillingTodayMutation = useMutation({
    mutationFn: async () => {
      const res = await http.post('/billing/run');
      return res.data || res;
    },
    onSuccess: (resData) => {
      queryClient.invalidateQueries();
      setRunResult(resData);
      toast.success(`Billing run completed. ${resData?.run?.invoicesCreated ?? resData?.created?.length ?? 0} invoice(s) generated.`);
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to run billing');
    },
  });

  // Advance clock & run billing mutation
  const [advanceModalOpen, setAdvanceModalOpen] = useState(false);
  const [runResult, setRunResult] = useState(null);

  const advanceClockMutation = useMutation({
    mutationFn: async () => {
      const res = await http.post('/clock/advance', {
        toDate: debouncedTargetDate,
        runBilling: true,
      });
      return res.data || res;
    },
    onSuccess: (resData) => {
      queryClient.invalidateQueries();
      setAdvanceModalOpen(false);
      setRunResult(resData);
      toast.success(
        `Clock advanced to ${debouncedTargetDate}. ${
          resData?.run?.invoicesCreated ?? resData?.created?.length ?? 0
        } invoices created.`
      );
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to advance clock and bill');
    },
  });

  // Bulk confirm newly created drafts
  const bulkConfirmRunMutation = useMutation({
    mutationFn: async (billingRunId) => {
      const res = await http.post('/invoices/bulk-confirm', { billingRunId });
      return res.data || res;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(data?.message || 'All newly generated draft invoices have been confirmed!');
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to confirm invoices');
    },
  });

  // Billing runs history query
  const { data: runsData, isLoading: runsLoading } = useQuery({
    queryKey: ['billingRuns'],
    queryFn: async () => {
      try {
        const res = await http.get('/billing/runs');
        return res.data || res;
      } catch {
        return [];
      }
    },
  });

  const billingRuns = Array.isArray(runsData) ? runsData : runsData?.data || [];

  // Why drawer state for preview sample invoices
  const [selectedSampleLine, setSelectedSampleLine] = useState(null);
  const [whyDrawerOpen, setWhyDrawerOpen] = useState(false);

  const preview = previewData || {};
  const sampleInvoices = preview.sample || [];
  const invoicesToCreate = preview.invoicesToCreate || 0;

  return (
    <div className="space-y-6">
      {/* Signature Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold shadow-soft">
              <FastForward className="h-4 w-4" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              Billing Time Machine
            </h1>
            <Badge variant="purple" size="sm">Signature Engine</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Project, advance, and audit recurring invoice cycles. Simulate forward billing up to 12 months with deterministic idempotency — zero skips, zero duplicates.
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            icon={Play}
            onClick={() => runBillingTodayMutation.mutate()}
            isLoading={runBillingTodayMutation.isPending}
          >
            Run Billing for Today
          </Button>

          {clockData?.isSimulated && isAdmin && (
            <Button
              variant="outline"
              size="sm"
              icon={RotateCcw}
              onClick={() => resetClockMutation.mutate()}
              isLoading={resetClockMutation.isPending}
              className="text-amber-700 hover:bg-amber-50 border-amber-300"
            >
              Reset to Real Date
            </Button>
          )}
        </div>
      </div>

      {/* Clock Status & Simulation Target Card */}
      <Card className="p-6 bg-linear-to-br from-indigo-950 via-slate-900 to-slate-900 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10 pb-6 border-b border-slate-800">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Active System Clock
            </span>
            <div className="flex items-baseline gap-3 mt-1.5 flex-wrap">
              <span className="text-3xl font-extrabold font-mono tracking-tight text-white">
                {currentDateStr}
              </span>
              {clockData?.isSimulated ? (
                <Badge variant="amber" size="sm" className="font-semibold">
                  Simulated Forward
                </Badge>
              ) : (
                <Badge variant="green" size="sm" className="font-semibold">
                  Real System Time
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Base date: {clockData?.realDate || 'Real calendar date'}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Advance Target
              </span>
              <p className="text-xl font-bold font-mono text-indigo-300 mt-0.5">
                {targetDateStr}
              </p>
              <p className="text-[11px] text-slate-400">
                +{sliderOffsetDays} day(s) from current
              </p>
            </div>

            {isAdmin && (
              <Button
                variant="primary"
                size="lg"
                icon={FastForward}
                disabled={targetDateStr <= currentDateStr}
                onClick={() => setAdvanceModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/30"
              >
                Advance & Run Billing
              </Button>
            )}
          </div>
        </div>

        {/* Date Slider & Quick Jump Controls */}
        <div className="pt-6 relative z-10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-300">
              Simulation Horizon: Drag date forward to preview future billings
            </span>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Specific Date:</span>
              <input
                type="date"
                min={currentDateStr}
                value={targetDateStr}
                onChange={(e) => handleDateChange(e.target.value)}
                className="py-1 px-2 text-xs bg-slate-800 text-white rounded-lg border border-slate-700 focus:outline-none focus:border-indigo-400 font-mono"
              />
            </div>
          </div>

          {/* Range Slider */}
          <div className="relative py-2">
            <input
              type="range"
              min="0"
              max="365"
              step="1"
              value={sliderOffsetDays}
              onChange={handleSliderChange}
              className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
              <span>Today</span>
              <span>+1 Month</span>
              <span>+3 Months</span>
              <span>+6 Months</span>
              <span>+12 Months (+365d)</span>
            </div>
          </div>

          {/* Quick Jump Buttons */}
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <span className="text-[11px] text-slate-400 mr-1 font-medium">Quick Jumps:</span>
            {[
              { label: '+1 Day', fn: () => handleQuickJump('day', 1) },
              { label: '+1 Week', fn: () => handleQuickJump('week', 1) },
              { label: '+1 Month', fn: () => handleQuickJump('month', 1) },
              { label: '+3 Months', fn: () => handleQuickJump('month', 3) },
              { label: '+12 Months', fn: () => handleQuickJump('month', 12) },
            ].map((btn, i) => (
              <button
                key={i}
                type="button"
                onClick={btn.fn}
                className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition border border-slate-700 cursor-pointer"
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Latest Run Result Card (if just executed) */}
      {runResult && (
        <Card className="p-6 border-indigo-200 bg-indigo-50/60 shadow-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-indigo-200/80">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <Check className="h-6 w-6 stroke-[3]" />
              </div>
              <div>
                <h3 className="font-extrabold text-indigo-950 text-base">
                  Billing Run Completed Successfully
                </h3>
                <p className="text-xs text-indigo-900 mt-0.5">
                  As of date: <strong>{runResult.run?.asOfDate || debouncedTargetDate}</strong> • Run ID #{runResult.run?.id || 'Latest'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="primary"
                size="sm"
                icon={CheckCircle2}
                onClick={() => bulkConfirmRunMutation.mutate(runResult.run?.id)}
                isLoading={bulkConfirmRunMutation.isPending}
              >
                Confirm All Drafts
              </Button>

              <Link to="/invoices">
                <Button variant="outline" size="sm">
                  View New Invoices
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 text-xs">
            <div>
              <span className="text-indigo-900/70 font-medium">Invoices Created</span>
              <p className="text-2xl font-black text-indigo-950 mt-1">
                {runResult.run?.invoicesCreated ?? runResult.created?.length ?? 0}
              </p>
            </div>

            <div>
              <span className="text-indigo-900/70 font-medium">Total Billed</span>
              <p className="text-xl font-bold text-indigo-950 mt-1">
                <Money amount={runResult.run?.totalAmount || runResult.total || 0} />
              </p>
            </div>

            <div>
              <span className="text-indigo-900/70 font-medium">Subscriptions Scanned</span>
              <p className="text-xl font-bold text-indigo-950 mt-1">
                {runResult.run?.scanned || preview.invoicesToCreate || 0}
              </p>
            </div>

            {/* Idempotency Proof Link */}
            <div className="flex flex-col justify-center">
              <div className="p-2.5 rounded-lg bg-white border border-indigo-200 shadow-xs">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  Idempotency Guarantee
                </span>
                <button
                  type="button"
                  onClick={() => runBillingTodayMutation.mutate()}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-900 hover:underline flex items-center gap-1 mt-0.5"
                >
                  Run again for this date <ArrowRight className="h-3 w-3" />
                </button>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  (Second run proves 0 duplicates created)
                </span>
              </div>
            </div>
          </div>

          {/* Errors list if any */}
          {runResult.run?.errors && runResult.run.errors.length > 0 && (
            <div className="mt-4 pt-4 border-t border-indigo-200">
              <p className="text-xs font-bold text-rose-700 mb-1">
                Warnings / Skipped Subscriptions:
              </p>
              <ul className="text-xs text-rose-600 list-disc list-inside space-y-0.5">
                {runResult.run.errors.map((err, i) => (
                  <li key={i}>{typeof err === 'string' ? err : JSON.stringify(err)}</li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}

      {/* Dry Run Preview Metrics Strip */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Dry-Run Simulation Output (Through {debouncedTargetDate})
            </h2>
          </div>
          {previewLoading && (
            <span className="text-xs text-indigo-600 font-medium animate-pulse">
              Computing dry-run preview...
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Invoices to generate */}
          <Card className="p-4 bg-white border-indigo-100 shadow-xs">
            <span className="text-xs font-medium text-slate-500">Invoices to Create</span>
            {previewLoading ? (
              <Skeleton className="h-8 w-20 mt-2" />
            ) : (
              <div className="mt-2">
                <div className="text-3xl font-extrabold text-indigo-600">
                  {invoicesToCreate}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Due by target date</p>
              </div>
            )}
          </Card>

          {/* Projected Net Amount */}
          <Card className="p-4 bg-white shadow-xs">
            <span className="text-xs font-medium text-slate-500">Projected Net Subtotal</span>
            {previewLoading ? (
              <Skeleton className="h-8 w-24 mt-2" />
            ) : (
              <div className="mt-2">
                <div className="text-2xl font-bold text-slate-900">
                  <Money amount={preview.net || 0} />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Pre-tax receivables</p>
              </div>
            )}
          </Card>

          {/* Projected Tax Total */}
          <Card className="p-4 bg-white shadow-xs">
            <span className="text-xs font-medium text-slate-500">Projected Tax (GST)</span>
            {previewLoading ? (
              <Skeleton className="h-8 w-24 mt-2" />
            ) : (
              <div className="mt-2">
                <div className="text-2xl font-bold text-slate-900">
                  <Money amount={preview.tax || 0} />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Auto-applied taxes</p>
              </div>
            )}
          </Card>

          {/* Projected Total Gross */}
          <Card className="p-4 bg-white shadow-xs">
            <span className="text-xs font-medium text-slate-500">Projected Gross Total</span>
            {previewLoading ? (
              <Skeleton className="h-8 w-24 mt-2" />
            ) : (
              <div className="mt-2">
                <div className="text-2xl font-extrabold text-emerald-600">
                  <Money amount={preview.total || 0} />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Total invoice volume</p>
              </div>
            )}
          </Card>

          {/* Projected Overdue Exposure */}
          <Card className="p-4 bg-white shadow-xs">
            <span className="text-xs font-medium text-slate-500">Projected Overdue Risk</span>
            {previewLoading ? (
              <Skeleton className="h-8 w-24 mt-2" />
            ) : (
              <div className="mt-2">
                <div className="text-2xl font-bold text-rose-600">
                  <Money amount={preview.projectedOverdue?.amount || 0} />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {preview.projectedOverdue?.count || 0} past due invoices
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Projection Charts & Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Invoices by Date Chart */}
        <BarChartCard
          title="Projected Billing Run by Date"
          subtitle="Chronological distribution of invoices generated across the simulated timeline"
          data={preview.byDate || []}
          xKey="date"
          bars={[{ dataKey: 'count', name: 'Invoices', color: '#6366f1' }]}
          isMoney={false}
          isLoading={previewLoading}
          height={260}
        />

        {/* Projected Volume by Plan */}
        <Card className="p-5 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-slate-900 text-sm tracking-tight">
              Projected Generation by Plan
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Breakdown of scheduled invoices by tier
            </p>
          </div>

          <div className="h-[260px] overflow-y-auto mt-4">
            {previewLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : (!preview.byPlan || preview.byPlan.length === 0) ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No invoices due by the selected date.
              </div>
            ) : (
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 uppercase text-[10px] text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3">Plan Name</th>
                    <th className="py-2 px-3 text-center">Invoices</th>
                    <th className="py-2 px-3 text-right">Projected Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {preview.byPlan.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        {p.plan}
                      </td>
                      <td className="py-2.5 px-3 text-center font-medium">
                        {p.count}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-indigo-600">
                        <Money amount={p.total} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      </div>

      {/* Sample Invoices Preview Table with "Why?" Popover trigger */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Sample Invoices Preview (Up to 50 items)
            </h2>
            <p className="text-xs text-slate-500">
              Click any row or the ⓘ button to inspect the exact line calculation trail and discounts
            </p>
          </div>
          <Badge variant="blue" size="sm">
            {sampleInvoices.length} sample items
          </Badge>
        </div>

        {previewLoading ? (
          <div className="p-6 space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : sampleInvoices.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            Nothing due by this target date. Advance the slider further to reach the next billing cycle.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 uppercase text-[10px] text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-6">Customer</th>
                  <th className="py-2.5 px-4">Period</th>
                  <th className="py-2.5 px-4 text-right">Subtotal</th>
                  <th className="py-2.5 px-4 text-right">Discounts</th>
                  <th className="py-2.5 px-4 text-right">Tax</th>
                  <th className="py-2.5 px-6 text-right">Total</th>
                  <th className="py-2.5 px-4 text-center">Why?</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sampleInvoices.slice(0, 50).map((inv, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-indigo-50/40 transition cursor-pointer"
                    onClick={() => {
                      if (inv.lines?.[0]) {
                        setSelectedSampleLine(inv.lines[0]);
                        setWhyDrawerOpen(true);
                      }
                    }}
                  >
                    <td className="py-3 px-6 font-semibold text-slate-900">
                      <div>
                        <span>{inv.customerName}</span>
                        <span className="block text-[10px] text-slate-400 font-mono">
                          {inv.subscriptionNumber}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-600">
                      <DateText date={inv.periodStart} /> to <DateText date={inv.periodEnd} />
                    </td>

                    <td className="py-3 px-4 text-right font-medium">
                      <Money amount={inv.subtotal} />
                    </td>

                    <td className="py-3 px-4 text-right text-emerald-600 font-medium">
                      {Number(inv.discountTotal) > 0 ? (
                        <span>-<Money amount={inv.discountTotal} /></span>
                      ) : (
                        '—'
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <Money amount={inv.taxTotal} />
                    </td>

                    <td className="py-3 px-6 text-right font-bold text-slate-900">
                      <Money amount={inv.total} />
                    </td>

                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (inv.lines?.[0]) {
                            setSelectedSampleLine(inv.lines[0]);
                            setWhyDrawerOpen(true);
                          }
                        }}
                        className="p-1 rounded text-indigo-600 hover:bg-indigo-100 transition"
                      >
                        <Info className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Billing Runs History Table */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Billing Run Executions History</h2>
          <span className="text-xs text-slate-500">
            Immutable audit record of all scheduled and manual billing jobs
          </span>
        </div>

        {runsLoading ? (
          <div className="p-6 space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : billingRuns.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No past billing runs recorded.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 uppercase text-[10px] text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-6">Run #</th>
                  <th className="py-2.5 px-4">As of Date</th>
                  <th className="py-2.5 px-4">Mode</th>
                  <th className="py-2.5 px-4 text-center">Invoices Created</th>
                  <th className="py-2.5 px-6 text-right">Total Amount</th>
                  <th className="py-2.5 px-4">Started By</th>
                  <th className="py-2.5 px-6">Execution Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {billingRuns.map((run) => (
                  <tr key={run.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-6 font-mono font-bold text-slate-900">
                      #{run.id}
                    </td>
                    <td className="py-3 px-4 font-medium">
                      <DateText date={run.asOfDate} />
                    </td>
                    <td className="py-3 px-4">
                      {run.dryRun ? (
                        <Badge variant="slate" size="sm">Dry Run</Badge>
                      ) : (
                        <Badge variant="green" size="sm">Real Run</Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-900">
                      {run.invoicesCreated}
                    </td>
                    <td className="py-3 px-6 text-right font-bold text-slate-900">
                      <Money amount={run.totalAmount} />
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {run.startedBy || 'System Cron'}
                    </td>
                    <td className="py-3 px-6 text-slate-500">
                      <DateText date={run.createdAt} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Why Drawer for sample lines */}
      <WhyDrawer
        isOpen={whyDrawerOpen}
        onClose={() => setWhyDrawerOpen(false)}
        line={selectedSampleLine}
        invoiceNumber="Preview Invoice"
      />

      {/* Confirm Advance Modal */}
      <ConfirmModal
        isOpen={advanceModalOpen}
        onClose={() => setAdvanceModalOpen(false)}
        onConfirm={() => advanceClockMutation.mutate()}
        title="Advance Clock & Run Real Billing"
        message={`Advance simulated billing clock to ${debouncedTargetDate}? This will scan active subscriptions and generate approximately ${invoicesToCreate} recurring invoice(s) totaling ₹${Number(preview.total || 0).toLocaleString('en-IN')}.`}
        confirmText="Confirm Advance & Run Billing"
        variant="primary"
        isLoading={advanceClockMutation.isPending}
      />
    </div>
  );
}

export default TimeMachinePage;
