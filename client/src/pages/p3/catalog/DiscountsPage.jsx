import React from 'react';
import { useQuery } from '@tanstack/react-query';
import CrudPage from './CrudPage';
import http from '../../../api/http';
import Money from '../../../components/ui/Money';
import Badge from '../../../components/ui/Badge';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Checkbox from '../../../components/ui/Checkbox';
import FormField from '../../../components/ui/FormField';
import DateText from '../../../components/ui/DateText';

export function DiscountsPage() {
  const { data: productsData } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await http.get('/products');
      return res.data || res;
    },
  });

  const products = Array.isArray(productsData) ? productsData : productsData?.data || [];

  const getDiscountState = (disc) => {
    const today = new Date().toISOString().split('T')[0];
    if (!disc.isActive) return { label: 'Inactive', variant: 'slate' };
    if (disc.usageLimit && disc.usedCount >= disc.usageLimit) {
      return { label: 'Exhausted', variant: 'red' };
    }
    if (disc.endDate && disc.endDate < today) {
      return { label: 'Expired', variant: 'slate' };
    }
    if (disc.startDate && disc.startDate > today) {
      return { label: 'Scheduled', variant: 'blue' };
    }
    return { label: 'Active', variant: 'green' };
  };

  const columns = [
    {
      header: 'Discount Name',
      accessor: 'name',
      sortable: true,
      cell: (row) => (
        <div>
          <span className="font-semibold text-slate-900">{row.name}</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-xs text-slate-500 capitalize">Scope: {row.appliesTo}</span>
            {row.appliesTo === 'product' && row.productId && (
              <span className="text-[11px] text-indigo-600 font-medium">
                ({products.find((p) => p.id === Number(row.productId))?.name || 'Product'})
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      header: 'Benefit Value',
      accessor: 'value',
      sortable: true,
      align: 'right',
      cell: (row) =>
        row.type === 'percent' ? (
          <span className="font-mono font-bold text-emerald-600">{row.value}% OFF</span>
        ) : (
          <span className="font-mono font-bold text-emerald-600">
            -<Money amount={row.value} />
          </span>
        ),
    },
    {
      header: 'Conditions',
      accessor: 'conditions',
      cell: (row) => (
        <div className="text-xs text-slate-600 space-y-0.5">
          {row.minPurchase > 0 && (
            <p>Min Purchase: <Money amount={row.minPurchase} /></p>
          )}
          {row.minQuantity > 0 && <p>Min Qty: {row.minQuantity}</p>}
          {!row.minPurchase && !row.minQuantity && <p className="text-slate-400">No restrictions</p>}
        </div>
      ),
    },
    {
      header: 'Usage Limit',
      accessor: 'usage',
      cell: (row) => {
        const limit = row.usageLimit;
        const used = row.usedCount || 0;
        const pct = limit ? Math.min(100, Math.round((used / limit) * 100)) : null;

        return (
          <div className="w-36 space-y-1">
            <div className="flex justify-between text-xs font-medium text-slate-700">
              <span>{used} used</span>
              <span>{limit ? `${limit} cap` : 'Unlimited'}</span>
            </div>
            {limit ? (
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    pct >= 100 ? 'bg-rose-500' : pct >= 80 ? 'bg-amber-500' : 'bg-indigo-600'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            ) : null}
          </div>
        );
      },
    },
    {
      header: 'State',
      accessor: 'state',
      cell: (row) => {
        const state = getDiscountState(row);
        return (
          <Badge variant={state.variant} dot>
            {state.label}
          </Badge>
        );
      },
    },
  ];

  const defaultValues = {
    name: '',
    type: 'percent',
    value: 10,
    minPurchase: 0,
    minQuantity: 0,
    startDate: '',
    endDate: '',
    usageLimit: '',
    appliesTo: 'subscription',
    productId: '',
    isActive: true,
  };

  const validateForm = (data) => {
    const errors = {};
    if (!data.name?.trim()) errors.name = 'Discount name is required';
    if (isNaN(Number(data.value)) || Number(data.value) <= 0) {
      errors.value = 'Value must be greater than 0';
    }
    if (data.type === 'percent' && Number(data.value) > 100) {
      errors.value = 'Percentage discount cannot exceed 100%';
    }
    if (data.appliesTo === 'product' && !data.productId) {
      errors.productId = 'Product selection is required for product-scoped discount';
    }
    return errors;
  };

  const renderForm = ({ formData, setFormData, formErrors }) => {
    return (
      <div className="space-y-4">
        <FormField label="Discount Name" required error={formErrors.name}>
          <Input
            value={formData.name || ''}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Volume 10% or Loyalty ₹500"
          />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Discount Type" required>
            <Select
              value={formData.type || 'percent'}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              <option value="percent">Percentage (%)</option>
              <option value="fixed">Fixed Amount (₹)</option>
            </Select>
          </FormField>

          <FormField label="Discount Value" required error={formErrors.value}>
            <Input
              type="number"
              step="0.01"
              value={formData.value ?? ''}
              onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
              placeholder={formData.type === 'percent' ? '15' : '500'}
            />
          </FormField>
        </div>

        <FormField label="Scope (Applies To)" required>
          <Select
            value={formData.appliesTo || 'subscription'}
            onChange={(e) =>
              setFormData({
                ...formData,
                appliesTo: e.target.value,
                productId: '',
              })
            }
          >
            <option value="subscription">Subscription Level (Allocated proportionally)</option>
            <option value="product">Product Level (Specific line item)</option>
          </Select>
        </FormField>

        {formData.appliesTo === 'product' && (
          <FormField label="Target Product" required error={formErrors.productId}>
            <Select
              value={formData.productId || ''}
              onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
            >
              <option value="">Select product to discount...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </FormField>
        )}

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Min Purchase Subtotal (₹)">
            <Input
              type="number"
              value={formData.minPurchase ?? ''}
              onChange={(e) => setFormData({ ...formData, minPurchase: Number(e.target.value) })}
              placeholder="0"
            />
          </FormField>

          <FormField label="Min Quantity">
            <Input
              type="number"
              value={formData.minQuantity ?? ''}
              onChange={(e) => setFormData({ ...formData, minQuantity: Number(e.target.value) })}
              placeholder="0"
            />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Start Date">
            <Input
              type="date"
              value={formData.startDate || ''}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            />
          </FormField>

          <FormField label="End Date">
            <Input
              type="date"
              value={formData.endDate || ''}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            />
          </FormField>
        </div>

        <FormField label="Usage Limit (Total Invoices Allowed)">
          <Input
            type="number"
            value={formData.usageLimit ?? ''}
            onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value ? Number(e.target.value) : '' })}
            placeholder="Leave blank for unlimited"
            helper="Discounts stop applying once usage cap is reached"
          />
        </FormField>

        <div className="pt-2">
          <Checkbox
            label="Active Discount"
            checked={formData.isActive !== false}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            helper="Auto-applied during recurring billing if criteria are satisfied"
          />
        </div>
      </div>
    );
  };

  return (
    <CrudPage
      title="Discounts"
      description="Manage automated product-level and invoice-level volume & loyalty discounts"
      entityName="Discount"
      endpoint="/discounts"
      queryKey="discounts"
      columns={columns}
      renderForm={renderForm}
      defaultValues={defaultValues}
      validateForm={validateForm}
    />
  );
}

export default DiscountsPage;
