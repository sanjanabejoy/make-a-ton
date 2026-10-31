import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Printer, CreditCard, CheckCircle2 } from 'lucide-react';
import http from '../../../api/http';
import { useToast } from '../../../components/ui/Toast';
import Button from '../../../components/ui/Button';
import { ConfirmModal } from '../../../components/ui/Modal';
import { Skeleton } from '../../../components/ui/Skeleton';
import InvoiceDetailView from '../../../components/p4/InvoiceDetailView';

export function PortalInvoiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [payModalOpen, setPayModalOpen] = useState(false);

  const { data: invData, isLoading, error } = useQuery({
    queryKey: ['portalInvoice', id],
    queryFn: async () => {
      const res = await http.get(`/portal/invoices/${id}`);
      return res.data || res;
    },
  });

  const invoice = invData;

  const payMutation = useMutation({
    mutationFn: async () => {
      return await http.post(`/portal/invoices/${id}/pay`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portalInvoice', id] });
      queryClient.invalidateQueries({ queryKey: ['portalInvoices'] });
      queryClient.invalidateQueries({ queryKey: ['portalOverview'] });
      toast.success('Simulated payment processed successfully');
      setPayModalOpen(false);
    },
    onError: (err) => {
      toast.error(err.message || 'Payment simulation failed');
    },
  });

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (error || !invoice) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-bold text-slate-800">Invoice Not Found</h3>
        <p className="text-xs text-slate-500 mt-1">This invoice does not exist or belongs to another customer.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/portal/invoices')}>
          Back to Invoices
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/portal/invoices')}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to my invoices
          </button>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Invoice {invoice.number}
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            icon={Printer}
            onClick={() => window.print()}
          >
            Print / Save PDF
          </Button>

          {invoice.status === 'confirmed' && (
            <Button
              variant="primary"
              size="sm"
              icon={CreditCard}
              onClick={() => setPayModalOpen(true)}
            >
              Pay Now (Simulated)
            </Button>
          )}
        </div>
      </div>

      <InvoiceDetailView
        invoice={invoice}
        onPayNow={() => setPayModalOpen(true)}
      />

      {/* Simulated Pay Modal */}
      <ConfirmModal
        isOpen={payModalOpen}
        onClose={() => setPayModalOpen(false)}
        onConfirm={() => payMutation.mutate()}
        title="Simulate Online Payment"
        message={`Authorize a simulated card/UPI settlement of ₹${Number(invoice.total) - Number(invoice.amountPaid || 0)} against invoice ${invoice.number}. This will immediately update the status to Paid.`}
        confirmText="Confirm Demo Payment"
        variant="primary"
        isLoading={payMutation.isPending}
      />
    </div>
  );
}

export default PortalInvoiceDetailPage;
