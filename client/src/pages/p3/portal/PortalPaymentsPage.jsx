import React from 'react';
import { useQuery } from '@tanstack/react-query';
import http from '../../../api/http';
import Card from '../../../components/ui/Card';
import Money from '../../../components/ui/Money';
import DateText from '../../../components/ui/DateText';
import Badge from '../../../components/ui/Badge';
import { Skeleton } from '../../../components/ui/Skeleton';
import EmptyState from '../../../components/ui/EmptyState';

export function PortalPaymentsPage() {
  const { data: paymentsData, isLoading } = useQuery({
    queryKey: ['portalPayments'],
    queryFn: async () => {
      const res = await http.get('/portal/payments');
      return res.data || res;
    },
  });

  const payments = Array.isArray(paymentsData) ? paymentsData : paymentsData?.data || [];

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Payment History</h1>
        <p className="text-sm text-slate-500 mt-1">
          Review all confirmed payment transactions and receipts credited to your account.
        </p>
      </div>

      <Card className="p-0 overflow-hidden">
        {payments.length === 0 ? (
          <EmptyState
            title="No payment records found"
            description="Payments credited against your invoices will appear here."
          />
        ) : (
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold border-b">
              <tr>
                <th className="py-3.5 px-4">Invoice #</th>
                <th className="py-3.5 px-4">Paid On</th>
                <th className="py-3.5 px-4">Method</th>
                <th className="py-3.5 px-4">Reference / UTR</th>
                <th className="py-3.5 px-4 text-right">Amount Paid</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3.5 px-4 font-bold text-indigo-600">{p.invoiceNumber}</td>
                  <td className="py-3.5 px-4"><DateText date={p.paidOn} /></td>
                  <td className="py-3.5 px-4 capitalize">
                    <Badge variant="slate" size="sm">{p.method?.replace('_', ' ')}</Badge>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-slate-500">{p.reference || '—'}</td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                    <Money amount={p.amount} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

export default PortalPaymentsPage;
