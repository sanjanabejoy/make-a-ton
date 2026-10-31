import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import http from '../../../api/http';
import InvoiceDetailView from '../../../components/p4/InvoiceDetailView';
import { Skeleton } from '../../../components/ui/Skeleton';
import Button from '../../../components/ui/Button';

export function InvoiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ['invoice', id],
    queryFn: async () => {
      const res = await http.get(`/invoices/${id}`);
      return res.data || res;
    },
  });

  const invoice = data?.data || data;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-44 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="text-center py-16">
        <h3 className="text-lg font-bold text-slate-800">Invoice Not Found</h3>
        <p className="text-xs text-slate-500 mt-1">
          {error?.message || `Invoice with ID #${id} could not be located.`}
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => navigate('/invoices')}
        >
          Back to Invoices
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/invoices"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to all invoices
        </Link>
      </div>

      <InvoiceDetailView invoice={invoice} mode="staff" />
    </div>
  );
}

export default InvoiceDetailPage;
