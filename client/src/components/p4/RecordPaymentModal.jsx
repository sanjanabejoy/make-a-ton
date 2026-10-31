import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import http from '../../api/http';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import FormField from '../ui/FormField';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Textarea from '../ui/Textarea';
import { useToast } from '../ui/Toast';

export function RecordPaymentModal({ isOpen, onClose, invoice, onSuccess }) {
  const toast = useToast();
  const queryClient = useQueryClient();

  const outstanding = Math.max(
    0,
    Number(invoice?.total || 0) - Number(invoice?.amountPaid || 0)
  );

  // Fetch virtual date / clock
  const { data: clockData } = useQuery({
    queryKey: ['clock'],
    queryFn: async () => {
      try {
        const res = await http.get('/clock');
        return res.data || res;
      } catch {
        return { date: new Date().toISOString().split('T')[0] };
      }
    },
  });

  const [method, setMethod] = useState('bank_transfer');
  const [amount, setAmount] = useState('');
  const [paidOn, setPaidOn] = useState('');
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen && invoice) {
      setAmount(String(outstanding));
      setPaidOn(clockData?.date || new Date().toISOString().split('T')[0]);
      setMethod('bank_transfer');
      setReference('');
      setNote('');
      setErrors({});
    }
  }, [isOpen, invoice, clockData, outstanding]);

  const recordMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await http.post(`/invoices/${invoice.id}/payments`, payload);
      return res.data || res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', String(invoice?.id)] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      queryClient.invalidateQueries({ queryKey: ['portalInvoice'] });
      queryClient.invalidateQueries({ queryKey: ['portalInvoices'] });
      toast.success('Payment recorded successfully');
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (err) => {
      const respData = err.response?.data;
      if (respData?.error?.details) {
        setErrors(respData.error.details);
      } else {
        setErrors({ general: err.message || 'Failed to record payment' });
      }
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      newErrors.amount = 'Amount must be greater than zero';
    } else if (numAmount > outstanding) {
      newErrors.amount = `Amount cannot exceed outstanding balance of ₹${outstanding}`;
    }

    if (!paidOn) {
      newErrors.paidOn = 'Payment date is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    recordMutation.mutate({
      method,
      amount: numAmount,
      paid_on: paidOn,
      reference,
      note,
    });
  };

  if (!invoice) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Record Payment for ${invoice.number}`}
      description={`Customer: ${invoice.customerName} • Outstanding: ₹${outstanding}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.general && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
            {errors.general}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Payment Method" required error={errors.method}>
            <Select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              options={[
                { value: 'bank_transfer', label: 'Bank Transfer (NEFT/RTGS/IMPS)' },
                { value: 'card', label: 'Credit / Debit Card' },
                { value: 'upi', label: 'UPI / QR Code' },
                { value: 'cash', label: 'Cash' },
                { value: 'cheque', label: 'Cheque' },
                { value: 'other', label: 'Other' },
              ]}
            />
          </FormField>

          <FormField label="Amount (₹)" required error={errors.amount}>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              max={outstanding}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Payment Date" required error={errors.paidOn}>
            <Input
              type="date"
              value={paidOn}
              onChange={(e) => setPaidOn(e.target.value)}
            />
          </FormField>

          <FormField label="Transaction Reference" error={errors.reference}>
            <Input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="UTR / Check # / Ref ID"
            />
          </FormField>
        </div>

        <FormField label="Internal Notes (Optional)" error={errors.note}>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Remarks or bank confirmation notes"
          />
        </FormField>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={recordMutation.isPending}
          >
            Record Payment
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default RecordPaymentModal;
