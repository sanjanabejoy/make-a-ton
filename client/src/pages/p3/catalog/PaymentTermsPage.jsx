import React from 'react';
import CrudPage from './CrudPage';
import Input from '../../../components/ui/Input';
import FormField from '../../../components/ui/FormField';

export function PaymentTermsPage() {
  const columns = [
    {
      header: 'Payment Term',
      accessor: 'name',
      sortable: true,
      cell: (row) => <span className="font-semibold text-slate-900">{row.name}</span>,
    },
    {
      header: 'Days Allowed',
      accessor: 'days',
      sortable: true,
      align: 'right',
      cell: (row) => (
        <span className="font-mono text-sm font-medium text-slate-700">
          {row.days === 0 ? 'Due Immediately' : `+${row.days} days`}
        </span>
      ),
    },
  ];

  const defaultValues = {
    name: 'Net 15',
    days: 15,
  };

  const validateForm = (data) => {
    const errors = {};
    if (!data.name?.trim()) errors.name = 'Term name is required';
    if (isNaN(Number(data.days)) || Number(data.days) < 0) {
      errors.days = 'Days must be greater than or equal to 0';
    }
    return errors;
  };

  const renderForm = ({ formData, setFormData, formErrors }) => {
    return (
      <div className="space-y-4">
        <FormField label="Term Name" required error={formErrors.name}>
          <Input
            value={formData.name || ''}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Net 15"
          />
        </FormField>

        <FormField label="Offset Days to Due Date" required error={formErrors.days}>
          <Input
            type="number"
            min="0"
            value={formData.days ?? ''}
            onChange={(e) => setFormData({ ...formData, days: Number(e.target.value) })}
            placeholder="15"
            helper="Due date = invoice period start date + days"
          />
        </FormField>
      </div>
    );
  };

  return (
    <CrudPage
      title="Payment Terms"
      description="Configure invoice payment grace periods and due date calculations"
      entityName="Payment Term"
      endpoint="/payment-terms"
      queryKey="paymentTerms"
      columns={columns}
      renderForm={renderForm}
      defaultValues={defaultValues}
      validateForm={validateForm}
    />
  );
}

export default PaymentTermsPage;
