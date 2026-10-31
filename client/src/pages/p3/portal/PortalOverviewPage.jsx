import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Sparkles,
  Layers,
  Calendar,
  CreditCard,
  AlertTriangle,
  ArrowRight,
  FileText,
} from 'lucide-react';
import http from '../../../api/http';
import Card, { CardHeader } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Money from '../../../components/ui/Money';
import DateText from '../../../components/ui/DateText';
import StatusBadge from '../../../components/ui/StatusBadge';
import { Skeleton } from '../../../components/ui/Skeleton';

export function PortalOverviewPage() {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['portalOverview'],
    queryFn: async () => {
      const res = await http.get('/portal/overview');
      return res.data || res;
    },
  });

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  const overview = data || {};
  const recentInvoices = overview.recentInvoices || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Account Overview</h1>
        <p className="text-sm text-slate-500 mt-1">
          Welcome to your SubscriptIQ customer portal. Manage subscriptions, download invoices, and monitor billings.
        </p>
      </div>

      {/* Overdue Alert if applicable */}
      {overview.hasOverdue && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-rose-900">Outstanding Overdue Payment</h4>
              <p className="text-xs text-rose-700 mt-0.5">
                You have overdue invoices requiring settlement to prevent service interruption.
              </p>
            </div>
          </div>
          <Button
            variant="danger"
            size="sm"
            onClick={() => navigate('/portal/invoices')}
          >
            Review Invoices
          </Button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Active Subscriptions
              </p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {overview.activeSubscriptionsCount || 1}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Layers className="h-5 w-5" />
            </div>
          </div>
          <button
            onClick={() => navigate('/portal/subscriptions')}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-1 mt-3"
          >
            View Subscriptions <ArrowRight className="h-3 w-3" />
          </button>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Next Billing Date
              </p>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                <DateText date={overview.nextInvoiceDate} />
              </div>
            </div>
            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Calendar className="h-5 w-5" />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3 font-medium">
            Estimated: <Money amount={overview.nextInvoiceAmount} />
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Outstanding Balance
              </p>
              <div className={`text-2xl font-bold mt-1 font-mono ${overview.outstandingBalance > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                <Money amount={overview.outstandingBalance} />
              </div>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <CreditCard className="h-5 w-5" />
            </div>
          </div>
          <button
            onClick={() => navigate('/portal/invoices')}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-1 mt-3"
          >
            View Invoices <ArrowRight className="h-3 w-3" />
          </button>
        </Card>
      </div>

      {/* Recent Invoices Card */}
      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Recent Invoices</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/portal/invoices')}
          >
            View All
          </Button>
        </div>
        <div className="divide-y divide-slate-100">
          {recentInvoices.map((inv) => (
            <div
              key={inv.id}
              onClick={() => navigate(`/portal/invoices/${inv.id}`)}
              className="p-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition"
            >
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="font-bold text-sm text-slate-900">{inv.number}</span>
                  <StatusBadge status={inv.status} isOverdue={inv.isOverdue} daysOverdue={inv.daysOverdue} />
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Due: <DateText date={inv.dueDate} />
                </p>
              </div>
              <div className="text-right">
                <span className="font-bold text-sm font-mono text-slate-900">
                  <Money amount={inv.total} />
                </span>
                <span className="block text-xs text-slate-500">
                  Paid: <Money amount={inv.amountPaid || 0} />
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default PortalOverviewPage;
