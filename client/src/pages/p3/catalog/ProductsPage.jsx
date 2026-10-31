import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import CrudPage from './CrudPage';
import Money from '../../../components/ui/Money';
import Badge from '../../../components/ui/Badge';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Textarea from '../../../components/ui/Textarea';
import Checkbox from '../../../components/ui/Checkbox';
import FormField from '../../../components/ui/FormField';
import Button from '../../../components/ui/Button';

export function ProductsPage() {
  const columns = [
    {
      header: 'Product Name',
      accessor: 'name',
      sortable: true,
      cell: (row) => (
        <div>
          <span className="font-semibold text-slate-900">{row.name}</span>
          {row.notes && <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{row.notes}</p>}
        </div>
      ),
    },
    {
      header: 'Type',
      accessor: 'type',
      sortable: true,
      cell: (row) => (
        <Badge variant={row.type === 'software' ? 'indigo' : row.type === 'service' ? 'purple' : 'slate'}>
          {row.type}
        </Badge>
      ),
    },
    {
      header: 'Sales Price',
      accessor: 'salesPrice',
      sortable: true,
      align: 'right',
      cell: (row) => <Money amount={row.salesPrice} />,
    },
    {
      header: 'Cost Price',
      accessor: 'costPrice',
      sortable: true,
      align: 'right',
      cell: (row) => <Money amount={row.costPrice} />,
    },
    {
      header: 'Variants',
      accessor: 'variants',
      align: 'center',
      cell: (row) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
          {row.variants?.length || 0}
        </span>
      ),
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
    type: 'software',
    salesPrice: 1000,
    costPrice: 0,
    notes: '',
    isActive: true,
    variants: [],
  };

  const validateForm = (data) => {
    const errors = {};
    if (!data.name?.trim()) errors.name = 'Product name is required';
    if (isNaN(Number(data.salesPrice)) || Number(data.salesPrice) < 0) {
      errors.salesPrice = 'Sales price must be greater than or equal to 0';
    }
    return errors;
  };

  const renderForm = ({ formData, setFormData, formErrors }) => {
    const variants = formData.variants || [];

    const addVariant = () => {
      setFormData({
        ...formData,
        variants: [
          ...variants,
          { attribute: 'Brand', value: '', extraPrice: 0 },
        ],
      });
    };

    const updateVariant = (index, field, value) => {
      const next = [...variants];
      next[index] = { ...next[index], [field]: value };
      setFormData({ ...formData, variants: next });
    };

    const removeVariant = (index) => {
      const next = variants.filter((_, i) => i !== index);
      setFormData({ ...formData, variants: next });
    };

    return (
      <div className="space-y-4">
        <FormField label="Product Name" required error={formErrors.name}>
          <Input
            value={formData.name || ''}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Brightloop ERP"
          />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Type" required>
            <Select
              value={formData.type || 'software'}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              <option value="software">Software</option>
              <option value="addon">Addon</option>
              <option value="service">Service</option>
              <option value="other">Other</option>
            </Select>
          </FormField>

          <FormField label="Sales Price (Base ₹)" required error={formErrors.salesPrice}>
            <Input
              type="number"
              step="0.01"
              value={formData.salesPrice ?? ''}
              onChange={(e) => setFormData({ ...formData, salesPrice: Number(e.target.value) })}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Cost Price (₹)">
            <Input
              type="number"
              step="0.01"
              value={formData.costPrice ?? ''}
              onChange={(e) => setFormData({ ...formData, costPrice: Number(e.target.value) })}
            />
          </FormField>

          <div className="flex items-center pt-6">
            <Checkbox
              label="Active Product"
              checked={formData.isActive !== false}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              helper="Available in quotation & subscription lines"
            />
          </div>
        </div>

        <FormField label="Internal Notes / Description">
          <Textarea
            value={formData.notes || ''}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Technical specs, implementation notes..."
            rows={2}
          />
        </FormField>

        {/* Product Variants Section */}
        <div className="pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                Product Variants
              </h4>
              <p className="text-[11px] text-slate-500">
                Attributes with additional pricing (e.g. Brand = Odoo adds +₹560)
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={addVariant} icon={Plus}>
              Add Variant
            </Button>
          </div>

          {variants.length === 0 ? (
            <div className="text-center py-4 bg-slate-50 rounded-lg border border-dashed border-slate-200 text-xs text-slate-400">
              No variants defined. Click "Add Variant" to configure options.
            </div>
          ) : (
            <div className="space-y-2.5 mt-3">
              {variants.map((v, idx) => {
                const totalUnit = (Number(formData.salesPrice) || 0) + (Number(v.extraPrice) || 0);
                return (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-1/3">
                        <Input
                          placeholder="Attribute (e.g. Brand)"
                          value={v.attribute || ''}
                          onChange={(e) => updateVariant(idx, 'attribute', e.target.value)}
                          className="text-xs py-1.5"
                        />
                      </div>
                      <div className="w-1/3">
                        <Input
                          placeholder="Value (e.g. Odoo)"
                          value={v.value || ''}
                          onChange={(e) => updateVariant(idx, 'value', e.target.value)}
                          className="text-xs py-1.5"
                        />
                      </div>
                      <div className="w-1/3">
                        <Input
                          type="number"
                          placeholder="Extra ₹"
                          value={v.extraPrice ?? ''}
                          onChange={(e) => updateVariant(idx, 'extraPrice', Number(e.target.value))}
                          className="text-xs py-1.5"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeVariant(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                        title="Remove Variant"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    {v.value && (
                      <p className="text-[11px] text-indigo-600 font-medium">
                        Helper: {v.attribute || 'Option'} = {v.value} → <Money amount={totalUnit} /> total unit price
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <CrudPage
      title="Products & Variants"
      description="Manage software catalog, standalone add-ons, and variant surcharges"
      entityName="Product"
      endpoint="/products"
      queryKey="products"
      columns={columns}
      renderForm={renderForm}
      defaultValues={defaultValues}
      validateForm={validateForm}
    />
  );
}

export default ProductsPage;
