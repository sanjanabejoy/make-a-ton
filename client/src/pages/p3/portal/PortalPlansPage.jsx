import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sparkles, Check, ArrowRight } from 'lucide-react';
import http from '../../../api/http';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Money from '../../../components/ui/Money';
import { Skeleton } from '../../../components/ui/Skeleton';

export function PortalPlansPage() {
  const { data: plansData, isLoading } = useQuery({
    queryKey: ['portalPlans'],
    queryFn: async () => {
      const res = await http.get('/portal/plans');
      return res.data || res;
    },
  });

  const plans = Array.isArray(plansData) ? plansData : plansData?.data || [];

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Available Plans</h1>
        <p className="text-sm text-slate-500 mt-1">
          Review transparent pricing options and features tailored for your organization.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className="flex flex-col justify-between border-slate-200 hover:border-indigo-500 transition shadow-sm hover:shadow-soft"
          >
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900">{plan.name}</h3>
                <Badge variant="indigo" size="sm" className="capitalize">
                  {plan.billingPeriod}
                </Badge>
              </div>

              <div className="mt-4 pb-4 border-b">
                <span className="text-3xl font-extrabold font-mono text-slate-900">
                  <Money amount={plan.price} />
                </span>
                <span className="text-xs text-slate-500 font-medium ml-1">
                  / {plan.billingPeriod}
                </span>
              </div>

              <ul className="mt-4 space-y-2.5 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>
                    Min product quantity: <strong>{plan.minQuantity}</strong>
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>
                    {plan.pausable ? 'Flexible Pause & Resume' : 'Standard uninterrupted cycle'}
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>
                    {plan.renewable ? 'Auto-renewable extension' : 'Term-bound agreement'}
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>Automated invoice dispatch & email receipts</span>
                </li>
              </ul>
            </div>

            <div className="pt-6">
              <button
                disabled
                className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-slate-100 text-slate-600 text-center"
              >
                Included in Plan Catalog
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default PortalPlansPage;
