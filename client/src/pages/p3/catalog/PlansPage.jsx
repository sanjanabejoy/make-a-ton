import React from 'react';
import CrudPage from './CrudPage';
import Money from '../../../components/ui/Money';
import Badge from '../../../components/ui/Badge';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Checkbox from '../../../components/ui/Checkbox';
import FormField from '../../../components/ui/FormField';
import DateText from '../../../components/ui/DateText';

export function PlansPage() {
  const columns = [
    {
      header: 'Plan Name',
      accessor: 'name',
      sortable: true,
      cell: (row) => (
        <div>
          <span className="font-semibold text-slate-900">{row.name}</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-xs text-slate-500 capitalize">{row.billingPeriod}</span>
            {row.minQuantity > 1 && (
              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                Min Qty: {row.minQuantity}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      header: 'Plan Base Fee',
      accessor: 'price',
      sortable: true,
      align: 'right',
      cell: (row) => <Money amount={row.price} />,
    },
    {
      header: 'Lifecycle Rules',
      accessor: 'flags',
      cell: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.autoClose && <Badge variant="slate" size="sm">Auto-close</Badge>}
          {row.closable && <Badge variant="blue" size="sm">Closable</Badge>}
          {row.pausable && <Badge variant="amber" size="sm">Pausable</Badge>}
          {row.renewable && <Badge variant="green" size="sm">Renewable</Badge>}
        </div>
      ),
    },
    {
      header: 'Availability',
      accessor: 'validity',
      cell: (row) => {
        const today = new Date().toISOString().split('T')[0];
        const isPast = row.validTo && row.validTo < today;
        const isFuture = row.validFrom && row.validFrom > today;
        const isAvailable = !isPast && !isFuture && row.isActive;

        return (
          <div className="space-y-0.5">
            <Badge variant={isAvailable ? 'green' : 'slate'} dot size="sm">
              {isAvailable ? 'Available Today' : isPast ? 'Ended' : isFuture ? 'Upcoming' : 'Inactive'}
            </Badge>
            {(row.validFrom || row.validTo) && (
              <p className="text-[11px] text-slate-400">
                {row.validFrom ? <DateText date={row.validFrom} /> : 'Start'} to{' '}
                {row.validTo ? <DateText date={row.validTo} /> : 'Open'}
              </p>
            )}
          </div>
        );
      },
    },
    {
      header: 'Status',
      accessor: 'isActive',
      cell: (row) => (
        <Badge variant={row.isActive ? 'green' : 'slate'} dot>
          {row.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ];

  const defaultValues = {
    name: '',
    price: 1999,
    billingPeriod: 'monthly',
    minQuantity: 1,
    validFrom: '',
    validTo: '',
    autoClose: false,
    closable: true,
    pausable: true,
    renewable: true,
    isActive: true,
  };

  const validateForm = (data) => {
    const errors = {};
    if (!data.name?.trim()) errors.name = 'Plan name is required';
    if (isNaN(Number(data.price)) || Number(data.price) < 0) {
      errors.price = 'Base fee must be >= 0';
    }
    if (Number(data.minQuantity) < 1) {
      errors.minQuantity = 'Minimum quantity must be at least 1';
    }
    if (data.validFrom && data.validTo && data.validTo < data.validFrom) {
      errors.validTo = 'Valid To cannot be earlier than Valid From';
    }
    return errors;
  };

  const renderForm = ({ formData, setFormData, formErrors }) => {
    return (
      <div className="space-y-4">
        <FormField label="Plan Name" required error={formErrors.name}>
          <Input
            value={formData.name || ''}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Monthly Pro"
          />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Billing Period" required>
            <Select
              value={formData.billingPeriod || 'monthly'}
              onChange={(e) => setFormData({ ...formData, billingPeriod: e.target.value })}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </Select>
          </FormField>

          <FormField label="Plan Base Fee (₹)" required error={formErrors.price}>
            <Input
              type="number"
              step="0.01"
              value={formData.price ?? ''}
              onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
              helper="Billed once per period as a separate line (can be 0)"
            />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Min Total Product Quantity" required error={formErrors.minQuantity}>
            <Input
              type="number"
              min="1"
              value={formData.minQuantity ?? 1}
              onChange={(e) => setFormData({ ...formData, minQuantity: Number(e.target.value) })}
              helper="Sum of subscription line items must be >= this"
            />
          </FormField>

          <div className="flex items-center pt-6">
            <Checkbox
              label="Active Plan"
              checked={formData.isActive !== false}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              helper="Can be selected for new subscriptions"
            />
          </div>
        </div>

        {/* Validity Window */}
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 space-y-3">
          <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Availability Window (Optional)
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Valid From" error={formErrors.validFrom}>
              <Input
                type="date"
                value={formData.validFrom || ''}
                onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
              />
            </FormField>
            <FormField label="Valid To" error={formErrors.validTo}>
              <Input
                type="date"
                value={formData.validTo || ''}
                onChange={(e) => setFormData({ ...formData, validTo: e.target.value })}
              />
            </FormField>
          </div>
        </div>

        {/* Lifecycle Flags */}
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 space-y-3">
          <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Lifecycle Policy Flags
          </h4>

          <Checkbox
            label="Auto-close"
            checked={!!formData.autoClose}
            onChange={(e) => setFormData({ ...formData, autoClose: e.target.checked })}
            helper="Closes the subscription automatically on its expiry date after the final period is billed."
          />

          <Checkbox
            label="Closable"
            checked={formData.closable !== false}
            onChange={(e) => setFormData({ ...formData, closable: e.target.checked })}
            helper="Allows early closure of an active subscription before expiry."
          />

          <Checkbox
            label="Pausable"
            checked={!!formData.pausable}
            onChange={(e) => setFormData({ ...formData, pausable: e.target.checked })}
            helper="Allows pausing and resuming billing cycles without back-billing missed periods."
          />

          <Checkbox
            label="Renewable"
            checked={formData.renewable !== false}
            onChange={(e) => setFormData({ ...formData, renewable: e.target.checked })}
            helper="Allows extending the subscription expiry date upon renewal."
          />
        </div>
      </div>
    );
  };

  return (
    <CrudPage
      title="Subscription Plans"
      description="Define recurring frequencies, base fees, and lifecycle policies"
      entityName="Plan"
      endpoint="/plans"
      queryKey="plans"
      columns={columns}
      renderForm={renderForm}
      defaultValues={defaultValues}
      validateForm={validateForm}
    />
  );
}

export default PlansPage;
