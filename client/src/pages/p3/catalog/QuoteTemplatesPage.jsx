import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import CrudPage from './CrudPage';
import http from '../../../api/http';
import Money from '../../../components/ui/Money';
import Badge from '../../../components/ui/Badge';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Textarea from '../../../components/ui/Textarea';
import Checkbox from '../../../components/ui/Checkbox';
import FormField from '../../../components/ui/FormField';
import Button from '../../../components/ui/Button';

export function QuoteTemplatesPage() {
  const { data: plansData } = useQuery({
    queryKey: ['plans'],
    queryFn: async () => {
      const res = await http.get('/plans');
      return res.data || res;
    },
  });

  const { data: productsData } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await http.get('/products');
      return res.data || res;
    },
  });

  const { data: termsData } = useQuery({
    queryKey: ['paymentTerms'],
    queryFn: async () => {
      const res = await http.get('/payment-terms');
      return res.data || res;
    },
  });

  const plans = Array.isArray(plansData) ? plansData : plansData?.data || [];
  const products = Array.isArray(productsData) ? productsData : productsData?.data || [];
  const terms = Array.isArray(termsData) ? termsData : termsData?.data || [];

  const columns = [
    {
      header: 'Template Name',
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
      header: 'Plan',
      accessor: 'planId',
      cell: (row) => {
        const p = plans.find((pl) => pl.id === Number(row.planId));
        return (
          <span className="text-sm font-medium text-slate-800">
            {p?.name || `Plan #${row.planId}`}
          </span>
        );
      },
    },
    {
      header: 'Duration',
      accessor: 'termMonths',
      cell: (row) => (
        <span className="text-xs text-slate-600">
          {row.termMonths} months (Validity: {row.validityDays}d)
        </span>
      ),
    },
    {
      header: 'Line Items',
      accessor: 'lines',
      align: 'center',
      cell: (row) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
          {row.lines?.length || 0} lines
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
    planId: '',
    validityDays: 15,
    paymentTermId: '',
    termMonths: 12,
    notes: '',
    isActive: true,
    lines: [],
  };

  const validateForm = (data) => {
    const errors = {};
    if (!data.name?.trim()) errors.name = 'Template name is required';
    if (!data.planId) errors.planId = 'Please select a base plan';
    if (Number(data.validityDays) <= 0) errors.validityDays = 'Validity days must be > 0';
    if (Number(data.termMonths) <= 0) errors.termMonths = 'Term months must be > 0';
    return errors;
  };

  const renderForm = ({ formData, setFormData, formErrors }) => {
    const lines = formData.lines || [];

    const addLine = () => {
      if (products.length === 0) return;
      const firstProd = products[0];
      setFormData({
        ...formData,
        lines: [
          ...lines,
          {
            productId: firstProd.id,
            variantId: firstProd.variants?.[0]?.id || null,
            quantity: 1,
          },
        ],
      });
    };

    const updateLine = (index, field, value) => {
      const next = [...lines];
      const updated = { ...next[index], [field]: value };
      if (field === 'productId') {
        // Reset variantId if product changes
        const prod = products.find((p) => p.id === Number(value));
        updated.variantId = prod?.variants?.[0]?.id || null;
      }
      next[index] = updated;
      setFormData({ ...formData, lines: next });
    };

    const removeLine = (index) => {
      const next = lines.filter((_, i) => i !== index);
      setFormData({ ...formData, lines: next });
    };

    return (
      <div className="space-y-4">
        <FormField label="Template Name" required error={formErrors.name}>
          <Input
            value={formData.name || ''}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="SMB Growth Pack"
          />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Base Plan" required error={formErrors.planId}>
            <Select
              value={formData.planId || ''}
              onChange={(e) => setFormData({ ...formData, planId: e.target.value })}
            >
              <option value="">Select plan...</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.billingPeriod})
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Payment Terms">
            <Select
              value={formData.paymentTermId || ''}
              onChange={(e) => setFormData({ ...formData, paymentTermId: e.target.value })}
            >
              <option value="">Select term...</option>
              {terms.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.days}d)
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Quote Validity (Days)" required error={formErrors.validityDays}>
            <Input
              type="number"
              value={formData.validityDays ?? 15}
              onChange={(e) => setFormData({ ...formData, validityDays: Number(e.target.value) })}
              helper="Quotation expires if not accepted within this window"
            />
          </FormField>

          <FormField label="Default Subscription Term (Months)" required error={formErrors.termMonths}>
            <Input
              type="number"
              value={formData.termMonths ?? 12}
              onChange={(e) => setFormData({ ...formData, termMonths: Number(e.target.value) })}
              helper="Auto-calculates expiry date from start date"
            />
          </FormField>
        </div>

        <FormField label="Notes / Terms">
          <Textarea
            value={formData.notes || ''}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Pre-approved package terms, discounts included..."
            rows={2}
          />
        </FormField>

        {/* Lines Editor */}
        <div className="pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                Pre-configured Product Lines
              </h4>
              <p className="text-[11px] text-slate-500">
                Default products copied to quotation upon creation
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={addLine} icon={Plus}>
              Add Line
            </Button>
          </div>

          {lines.length === 0 ? (
            <div className="text-center py-4 bg-slate-50 rounded-lg border border-dashed border-slate-200 text-xs text-slate-400">
              No products attached. Click "Add Line" to bundle items.
            </div>
          ) : (
            <div className="space-y-2.5 mt-3">
              {lines.map((l, idx) => {
                const prod = products.find((p) => p.id === Number(l.productId));
                const variant = prod?.variants?.find((v) => v.id === Number(l.variantId));
                const unitPrice = (prod?.salesPrice || 0) + (variant?.extraPrice || 0);

                return (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 space-y-2"
                  >
                    <div className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-5">
                        <Select
                          value={l.productId || ''}
                          onChange={(e) => updateLine(idx, 'productId', e.target.value)}
                          className="text-xs py-1.5"
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </Select>
                      </div>

                      <div className="col-span-4">
                        <Select
                          value={l.variantId || ''}
                          onChange={(e) => updateLine(idx, 'variantId', e.target.value ? Number(e.target.value) : null)}
                          className="text-xs py-1.5"
                          disabled={!prod?.variants || prod.variants.length === 0}
                        >
                          <option value="">Base Product</option>
                          {(prod?.variants || []).map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.attribute}: {v.value} (+₹{v.extraPrice})
                            </option>
                          ))}
                        </Select>
                      </div>

                      <div className="col-span-2">
                        <Input
                          type="number"
                          min="1"
                          value={l.quantity ?? 1}
                          onChange={(e) => updateLine(idx, 'quantity', Number(e.target.value))}
                          className="text-xs py-1.5 text-center"
                        />
                      </div>

                      <div className="col-span-1 text-right">
                        <button
                          type="button"
                          onClick={() => removeLine(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[11px] text-slate-500 font-medium px-1">
                      <span>Unit Price: <Money amount={unitPrice} /></span>
                      <span className="text-slate-900 font-semibold">
                        Subtotal: <Money amount={unitPrice * (Number(l.quantity) || 1)} />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="pt-2">
          <Checkbox
            label="Active Template"
            checked={formData.isActive !== false}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
          />
        </div>
      </div>
    );
  };

  return (
    <CrudPage
      title="Quote Templates"
      description="Bundle plans, terms, and pre-selected product line items into one-click quotation starters"
      entityName="Quote Template"
      endpoint="/quote-templates"
      queryKey="quoteTemplates"
      columns={columns}
      renderForm={renderForm}
      defaultValues={defaultValues}
      validateForm={validateForm}
    />
  );
}

export default QuoteTemplatesPage;
