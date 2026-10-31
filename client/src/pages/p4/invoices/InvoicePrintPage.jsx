import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Printer, ArrowLeft, Zap } from 'lucide-react';
import http from '../../../api/http';
import Money from '../../../components/ui/Money';
import DateText from '../../../components/ui/DateText';
import { Skeleton } from '../../../components/ui/Skeleton';
import Button from '../../../components/ui/Button';

export function InvoicePrintPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Invoice query
  const { data: invData, isLoading: invLoading } = useQuery({
    queryKey: ['invoice', id],
    queryFn: async () => {
      const res = await http.get(`/invoices/${id}`);
      return res.data || res;
    },
  });

  // Settings query for company details
  const { data: settingsData } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      try {
        const res = await http.get('/settings');
        return res.data || res;
      } catch {
        return null;
      }
    },
  });

  const invoice = invData?.data || invData;

  const company = settingsData?.company || {
    name: 'Brightloop Software Solutions Pvt. Ltd.',
    address: 'Indiranagar 100ft Road, Bengaluru, Karnataka 560038, India',
    gstin: '29ABCDE1234F1Z5',
    email: 'billing@brightloop.test',
    phone: '+91 80 4123 4567',
  };

  if (invLoading) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-slate-500">Invoice not found.</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </div>
    );
  }

  const outstanding = Math.max(0, Number(invoice.total || 0) - Number(invoice.amountPaid || 0));

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white p-4 sm:p-8 font-sans">
      {/* Top action bar - hidden during print */}
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between print:hidden">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="sm"
            icon={Printer}
            onClick={() => window.print()}
          >
            Print / Save as PDF
          </Button>
        </div>
      </div>

      {/* Main Printable Document Sheet */}
      <div className="max-w-4xl mx-auto bg-white p-8 sm:p-12 shadow-sm rounded-xl print:shadow-none print:p-0 border border-slate-200 print:border-none text-slate-900">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pb-8 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
                <Zap className="h-5 w-5 fill-current" />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">
                {company.name}
              </span>
            </div>
            <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
              {company.address}
            </p>
            <p className="text-xs text-slate-600 font-medium mt-1">
              GSTIN: <span className="font-mono">{company.gstin}</span>
            </p>
            <p className="text-xs text-slate-500">
              Email: {company.email} • Tel: {company.phone}
            </p>
          </div>

          <div className="sm:text-right">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">TAX INVOICE</h2>
            <p className="text-sm font-mono font-bold text-indigo-600 mt-1">
              {invoice.number}
            </p>
            <div className="mt-3 text-xs space-y-1 text-slate-600">
              <p>
                <strong>Invoice Date:</strong> <DateText date={invoice.invoiceDate} />
              </p>
              <p>
                <strong>Due Date:</strong> <DateText date={invoice.dueDate} />
              </p>
              <p>
                <strong>Terms:</strong> {invoice.paymentTermName || 'Net 30'}
              </p>
              <p>
                <strong>Status:</strong>{' '}
                <span className="uppercase font-bold tracking-wider text-slate-900">
                  {invoice.status}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Customer & Billing Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-6 border-b border-slate-200 text-xs">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Billed To
            </p>
            <p className="text-sm font-bold text-slate-900">{invoice.customerName}</p>
            {invoice.customerEmail && <p className="text-slate-600 mt-0.5">{invoice.customerEmail}</p>}
            {invoice.customerAddress && (
              <p className="text-slate-500 mt-1 leading-relaxed">{invoice.customerAddress}</p>
            )}
            {invoice.customerPhone && <p className="text-slate-500">Phone: {invoice.customerPhone}</p>}
          </div>

          <div className="sm:text-right">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Subscription Reference
            </p>
            <p className="text-sm font-bold text-slate-900 font-mono">
              {invoice.subscriptionNumber || `SUB-${invoice.subscriptionId}`}
            </p>
            <p className="text-slate-600 mt-1">
              <strong>Billing Period:</strong> <DateText date={invoice.periodStart} /> to{' '}
              <DateText date={invoice.periodEnd} />
            </p>
            {invoice.currency && (
              <p className="text-slate-500">
                <strong>Currency:</strong> {invoice.currency} (₹)
              </p>
            )}
          </div>
        </div>

        {/* Line Items Table */}
        <div className="py-6">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="border-b-2 border-slate-200 text-[11px] uppercase font-bold text-slate-500">
              <tr>
                <th className="py-2.5 px-2">#</th>
                <th className="py-2.5 px-3">Item & Description</th>
                <th className="py-2.5 px-3 text-center">Qty</th>
                <th className="py-2.5 px-3 text-right">Unit Price</th>
                <th className="py-2.5 px-3 text-right">Discounts</th>
                <th className="py-2.5 px-3 text-right">Tax (GST)</th>
                <th className="py-2.5 px-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(invoice.lines || []).map((line, idx) => {
                const totalDisc =
                  Number(line.discountAmount || 0) + Number(line.subDiscountAmount || 0);

                return (
                  <tr key={idx}>
                    <td className="py-3 px-2 text-slate-400 font-medium">{idx + 1}</td>
                    <td className="py-3 px-3 font-semibold text-slate-900">
                      {line.description}
                    </td>
                    <td className="py-3 px-3 text-center">{line.quantity}</td>
                    <td className="py-3 px-3 text-right">
                      <Money amount={line.unitPrice} />
                    </td>
                    <td className="py-3 px-3 text-right text-emerald-600">
                      {totalDisc > 0 ? `-₹${totalDisc.toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {Number(line.taxAmount) > 0 ? (
                        <span>
                          ₹{Number(line.taxAmount).toLocaleString('en-IN')}{' '}
                          <span className="text-[10px] text-slate-400">({line.taxRate}%)</span>
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900">
                      <Money amount={line.lineTotal} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totals Block */}
        <div className="pt-4 border-t border-slate-200 flex justify-end">
          <div className="w-72 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-semibold text-slate-900">
                <Money amount={invoice.subtotal} />
              </span>
            </div>

            {Number(invoice.discountTotal) > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Discounts:</span>
                <span>-<Money amount={invoice.discountTotal} /></span>
              </div>
            )}

            <div className="flex justify-between text-slate-600">
              <span>Taxes (GST):</span>
              <span className="font-semibold text-slate-900">
                <Money amount={invoice.taxTotal} />
              </span>
            </div>

            <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t-2 border-slate-300">
              <span>Grand Total:</span>
              <span className="text-indigo-600">
                <Money amount={invoice.total} />
              </span>
            </div>

            <div className="flex justify-between text-slate-600 pt-1">
              <span>Amount Paid:</span>
              <span className="font-semibold text-emerald-600">
                <Money amount={invoice.amountPaid || 0} />
              </span>
            </div>

            {outstanding > 0 && (
              <div className="flex justify-between text-sm font-bold text-rose-600 pt-1 border-t border-dashed border-slate-300">
                <span>Balance Due:</span>
                <span><Money amount={outstanding} /></span>
              </div>
            )}
          </div>
        </div>

        {/* Payments Summary Section */}
        {invoice.payments && invoice.payments.length > 0 && (
          <div className="mt-8 pt-6 border-t border-slate-200">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              Payment Settlement History
            </h4>
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400">
                <tr>
                  <th className="py-1.5 px-3">Date</th>
                  <th className="py-1.5 px-3">Method</th>
                  <th className="py-1.5 px-3">Reference</th>
                  <th className="py-1.5 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoice.payments.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2 px-3"><DateText date={p.paidOn} /></td>
                    <td className="py-2 px-3 capitalize">{p.method?.replace('_', ' ')}</td>
                    <td className="py-2 px-3 font-mono">{p.reference || '—'}</td>
                    <td className="py-2 px-3 text-right font-semibold text-slate-900">
                      <Money amount={p.amount} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Bank & Remittance Instructions */}
        <div className="mt-10 pt-6 border-t border-slate-200 text-[11px] text-slate-500 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="font-bold text-slate-700 uppercase tracking-wider mb-1">
              Bank Remittance Details
            </p>
            <p><strong>Bank:</strong> HDFC Bank Ltd.</p>
            <p><strong>Account Name:</strong> {company.name}</p>
            <p><strong>Account Number:</strong> 50200012345678</p>
            <p><strong>IFSC Code:</strong> HDFC0000287</p>
          </div>

          <div className="sm:text-right">
            <p className="font-bold text-slate-700 uppercase tracking-wider mb-1">
              Important Terms
            </p>
            <p>Please cite invoice number <strong>{invoice.number}</strong> with all bank remittances.</p>
            <p>This is a computer-generated tax invoice and requires no physical signature.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InvoicePrintPage;
