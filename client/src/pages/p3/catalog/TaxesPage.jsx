import React from 'react';
import { useQuery } from '@tanstack/react-query';
import CrudPage from './CrudPage';
import http from '../../../api/http';
import Badge from '../../../components/ui/Badge';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Checkbox from '../../../components/ui/Checkbox';
import FormField from '../../../components/ui/FormField';

export function TaxesPage() {
  const { data: productsData } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await http.get('/products');
      return res.data || res;
    },
  });

  const products = Array.isArray(productsData) ? productsData : productsData?.data || [];

  const columns = [
    {
      header: 'Tax Rule Name',
      accessor: 'name',
      sortable: true,
      cell: (row) => <span className="font-semibold text-slate-900">{row.name}</span>,
    },
    {
      header: 'Tax Rate',
      accessor: 'rate',
      sortable: true,
      align: 'right',
      cell: (row) => <span className="font-mono font-medium">{row.rate}%</span>,
    },
    {
      header: 'Applies To',
      accessor: 'appliesTo',
      cell: (row) => {
        let detail = 'All Products & Plans';
        if (row.appliesTo === 'product_type') {
          detail = `Type: ${row.productType}`;
        } else if (row.appliesTo === 'product') {
          const matched = products.find((p) => p.id === Number(row.productId));
          detail = `Product: ${matched?.name || row.productId}`;
        }
        return (
          <div className="flex items-center gap-2">
            <Badge variant="indigo" size="sm">
              {row.appliesTo.replace('_', ' ')}
            </Badge>
            <span className="text-xs text-slate-600">{detail}</span>
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
    name: 'GST 18%',
    rate: 18.0,
    appliesTo: 'all',
    productType: '',
    productId: '',
    isActive: true,
  };

  const validateForm = (data) => {
    const errors = {};
    if (!data.name?.trim()) errors.name = 'Tax name is required';
    if (isNaN(Number(data.rate)) || Number(data.rate) < 0 || Number(data.rate) > 100) {
      errors.rate = 'Rate must be between 0% and 100%';
    }
    if (data.appliesTo === 'product_type' && !data.productType?.trim()) {
      errors.productType = 'Product type is required';
    }
    if (data.appliesTo === 'product' && !data.productId) {
      errors.productId = 'Please select a specific product';
    }
    return errors;
  };

  const renderForm = ({ formData, setFormData, formErrors }) => {
    return (
      <div className="space-y-4">
        <FormField label="Tax Name" required error={formErrors.name}>
          <Input
            value={formData.name || ''}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="GST 18%"
          />
        </FormField>

        <FormField label="Tax Rate (%)" required error={formErrors.rate}>
          <Input
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={formData.rate ?? ''}
            onChange={(e) => setFormData({ ...formData, rate: Number(e.target.value) })}
            placeholder="18"
          />
        </FormField>

        <FormField label="Scope Rule (Applies To)" required>
          <Select
            value={formData.appliesTo || 'all'}
            onChange={(e) =>
              setFormData({
                ...formData,
                appliesTo: e.target.value,
                productType: '',
                productId: '',
              })
            }
          >
            <option value="all">All Products and Services (Default)</option>
            <option value="product_type">Specific Product Type</option>
            <option value="product">Specific Product</option>
          </Select>
        </FormField>

        {formData.appliesTo === 'product_type' && (
          <FormField label="Product Type" required error={formErrors.productType}>
            <Select
              value={formData.productType || ''}
              onChange={(e) => setFormData({ ...formData, productType: e.target.value })}
            >
              <option value="">Select product type...</option>
              <option value="software">Software</option>
              <option value="addon">Addon</option>
              <option value="service">Service</option>
            </Select>
          </FormField>
        )}

        {formData.appliesTo === 'product' && (
          <FormField label="Product" required error={formErrors.productId}>
            <Select
              value={formData.productId || ''}
              onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
            >
              <option value="">Select target product...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.type})
                </option>
              ))}
            </Select>
          </FormField>
        )}

        <div className="pt-2">
          <Checkbox
            label="Active Rule"
            checked={formData.isActive !== false}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            helper="Most-specific rule wins during billing calculation"
          />
        </div>
      </div>
    );
  };

  return (
    <CrudPage
      title="Tax Rules"
      description="Define tax percentages and specificity rules (Product > Product Type > All)"
      entityName="Tax Rule"
      endpoint="/taxes"
      queryKey="taxes"
      columns={columns}
      renderForm={renderForm}
      defaultValues={defaultValues}
      validateForm={validateForm}
    />
  );
}

export default TaxesPage;
