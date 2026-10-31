import React from 'react';
import Card from '../ui/Card';
import StatusBadge from '../ui/StatusBadge';
import Money from '../ui/Money';
import DateText from '../ui/DateText';

export function InvoiceDetailView({ invoice, onPayNow }) {
  if (!invoice) return null;

  return (
    <Card className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-900">{invoice.number}</h2>
            <StatusBadge status={invoice.status} isOverdue={invoice.isOverdue} />
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Period: <DateText date={invoice.periodStart} /> to <DateText date={invoice.periodEnd} />
          </p>
        </div>
        <div className="flex items-center gap-3">
          {invoice.status === 'confirmed' && onPayNow && (
            <button
              onClick={onPayNow}
              className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm"
            >
              Pay Now (Simulated)
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold border-b">
            <tr>
              <th className="py-3 px-4">Description</th>
              <th className="py-3 px-4 text-center">Qty</th>
              <th className="py-3 px-4 text-right">Unit Price</th>
              <th className="py-3 px-4 text-right">Discount</th>
              <th className="py-3 px-4 text-right">Tax</th>
              <th className="py-3 px-4 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(invoice.lines || []).map((line, idx) => (
              <tr key={idx}>
                <td className="py-3 px-4 font-medium text-slate-900">{line.description}</td>
                <td className="py-3 px-4 text-center">{line.quantity}</td>
                <td className="py-3 px-4 text-right"><Money amount={line.unitPrice} /></td>
                <td className="py-3 px-4 text-right text-emerald-600">
                  {line.discountAmount ? `-` : ''}<Money amount={line.discountAmount || 0} />
                </td>
                <td className="py-3 px-4 text-right"><Money amount={line.taxAmount || 0} /></td>
                <td className="py-3 px-4 text-right font-medium text-slate-900"><Money amount={line.lineTotal} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end pt-4 border-t border-slate-200">
        <div className="w-72 space-y-2 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal</span>
            <Money amount={invoice.subtotal} />
          </div>
          {Number(invoice.discountTotal) > 0 && (
            <div className="flex justify-between text-emerald-600 font-medium">
              <span>Discounts</span>
              <span>-<Money amount={invoice.discountTotal} /></span>
            </div>
          )}
          <div className="flex justify-between text-slate-600">
            <span>Taxes</span>
            <Money amount={invoice.taxTotal} />
          </div>
          <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
            <span>Total</span>
            <Money amount={invoice.total} />
          </div>
          <div className="flex justify-between text-sm text-slate-600">
            <span>Amount Paid</span>
            <Money amount={invoice.amountPaid || 0} />
          </div>
          {Number(invoice.total) - Number(invoice.amountPaid || 0) > 0 && (
            <div className="flex justify-between text-sm font-semibold text-rose-600">
              <span>Outstanding</span>
              <Money amount={Number(invoice.total) - Number(invoice.amountPaid || 0)} />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

export default InvoiceDetailView;
