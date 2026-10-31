import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import http from '../../../api/http';
import Card from '../../../components/ui/Card';
import StatusBadge from '../../../components/ui/StatusBadge';
import Money from '../../../components/ui/Money';
import DateText from '../../../components/ui/DateText';
import { Skeleton } from '../../../components/ui/Skeleton';
import EmptyState from '../../../components/ui/EmptyState';

export function PortalSubscriptionsPage() {
  const navigate = useNavigate();

  const { data: subsData, isLoading } = useQuery({
    queryKey: ['portalSubscriptions'],
    queryFn: async () => {
      const res = await http.get('/portal/subscriptions');
      return res.data || res;
    },
  });

  const subsList = Array.isArray(subsData) ? subsData : subsData?.data || [];

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Subscriptions</h1>
        <p className="text-sm text-slate-500 mt-1">
          Track your active service contracts, accepted quotations, and upcoming renewals.
        </p>
      </div>

      <Card className="p-0 overflow-hidden">
        {subsList.length === 0 ? (
          <EmptyState
            title="No subscriptions active"
            description="You do not have any registered subscriptions under this account."
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {subsList.map((sub) => (
              <div
                key={sub.id}
                onClick={() => navigate(`/portal/subscriptions/${sub.id}`)}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 cursor-pointer transition"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-base text-indigo-600">{sub.number}</span>
                    <StatusBadge status={sub.status} pausedAt={sub.pausedAt} />
                    <span className="font-semibold text-slate-800">{sub.planName}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Coverage: <DateText date={sub.startDate} /> to <DateText date={sub.expiryDate} /> · Next billing: <DateText date={sub.nextBillingDate} />
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-xs text-slate-400 uppercase tracking-wider block">
                    Cycle Total
                  </span>
                  <span className="text-lg font-bold font-mono text-slate-900">
                    <Money amount={sub.recurringAmount || 0} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

export default PortalSubscriptionsPage;
