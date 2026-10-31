import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Layers,
  FileText,
  Plus,
  Trash2,
  ArrowLeft,
  AlertTriangle,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import http from '../../../api/http';
import { useToast } from '../../../components/ui/Toast';
import PageHeader from '../../../components/ui/PageHeader';
import Card, { CardHeader } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import FormField from '../../../components/ui/FormField';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Textarea from '../../../components/ui/Textarea';
import Money from '../../../components/ui/Money';
import Badge from '../../../components/ui/Badge';
import { Skeleton } from '../../../components/ui/Skeleton';

export function SubscriptionFormPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toast = useToast();

  const preselectedCustomerId = searchParams.get('customerId') || '';

  // Mode: 'manual' or 'template'
  const [mode, setMode] = useState('manual');

  // Manual Form State
  const [customerId, setCustomerId] = useState(preselectedCustomerId);
  const [planId, setPlanId] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split('T')[0];
  });
  const [paymentTermId, setPaymentTermId] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState([]);

  // Template Form State
  const [templateId, setTemplateId] = useState('');
  const [templateCustomerId, setTemplateCustomerId] = useState(preselectedCustomerId);
  const [templateStartDate, setTemplateStartDate] = useState(new Date().toISOString().split('T')[0]);

  // Fetch catalogs
  const { data: customersData, isLoading: custLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const res = await http.get('/customers');
      return res.data || res;
    },
  });

  const { data: plansData, isLoading: plansLoading } = useQuery({
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

  const { data: templatesData } = useQuery({
    queryKey: ['quoteTemplates'],
    queryFn: async () => {
      const res = await http.get('/quote-templates');
      return res.data || res;
    },
  });

  const { data: taxesData } = useQuery({
    queryKey: ['taxes'],
    queryFn: async () => {
      const res = await http.get('/taxes');
      return res.data || res;
    },
  });

  const customers = Array.isArray(customersData) ? customersData : customersData?.data || [];
  const plans = Array.isArray(plansData) ? plansData : plansData?.data || [];
  const products = Array.isArray(productsData) ? productsData : productsData?.data || [];
  const terms = Array.isArray(termsData) ? termsData : termsData?.data || [];
  const templates = Array.isArray(templatesData) ? templatesData : templatesData?.data || [];
  const taxes = Array.isArray(taxesData) ? taxesData : taxesData?.data || [];

  // Filter available plans according to startDate (MASTER_SPEC §2.8)
  const availablePlans = useMemo(() => {
    return plans.filter((p) => {
      if (!p.isActive) return false;
      if (p.validFrom && startDate < p.validFrom) return false;
      if (p.validTo && startDate > p.validTo) return false;
      return true;
    });
  }, [plans, startDate]);

  const selectedPlan = plans.find((p) => p.id === Number(planId));

  // Add line
  const handleAddLine = () => {
    if (products.length === 0) return;
    const p = products[0];
    const unit = p.salesPrice;
    setLines([
      ...lines,
      {
        productId: p.id,
        variantId: null,
        quantity: 1,
        unitPrice: unit,
        taxRate: 18.0,
      },
    ]);
  };

  const handleUpdateLine = (idx, field, val) => {
    const next = [...lines];
    const line = { ...next[idx], [field]: val };

    if (field === 'productId') {
      const prod = products.find((p) => p.id === Number(val));
      line.variantId = null;
      line.unitPrice = prod?.salesPrice || 0;
    } else if (field === 'variantId') {
      const prod = products.find((p) => p.id === Number(line.productId));
      const v = prod?.variants?.find((vr) => vr.id === Number(val));
      line.unitPrice = (prod?.salesPrice || 0) + (v?.extraPrice || 0);
    }

    next[idx] = line;
    setLines(next);
  };

  const handleRemoveLine = (idx) => {
    setLines(lines.filter((_, i) => i !== idx));
  };

  // Calculations
  const totalQuantity = lines.reduce((acc, l) => acc + (Number(l.quantity) || 0), 0);
  const minQtySatisfied = !selectedPlan || totalQuantity >= (selectedPlan.minQuantity || 1);

  const planBaseFee = selectedPlan ? Number(selectedPlan.price || 0) : 0;
  const linesSubtotal = lines.reduce(
    (acc, l) => acc + (Number(l.unitPrice) || 0) * (Number(l.quantity) || 0),
    0
  );
  const taxSubtotal = lines.reduce((acc, l) => {
    const lineSub = (Number(l.unitPrice) || 0) * (Number(l.quantity) || 0);
    return acc + (lineSub * (Number(l.taxRate) || 0)) / 100;
  }, 0);
  const recurringTotal = planBaseFee + linesSubtotal + taxSubtotal;

  // Create Manual Mutation
  const createManualMutation = useMutation({
    mutationFn: async (payload) => {
      return await http.post('/subscriptions', payload);
    },
    onSuccess: (sub) => {
      toast.success(`Subscription ${sub.number} initialized in Draft`);
      navigate(`/subscriptions/${sub.id}`);
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to initialize subscription');
    },
  });

  // Create Template Mutation
  const createTemplateMutation = useMutation({
    mutationFn: async (payload) => {
      return await http.post('/subscriptions/from-template', payload);
    },
    onSuccess: (sub) => {
      toast.success(`Subscription ${sub.number} initialized from template`);
      navigate(`/subscriptions/${sub.id}`);
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to initialize from template');
    },
  });

  const handleSubmitManual = (e) => {
    e.preventDefault();
    if (!customerId) {
      toast.error('Please select a customer');
      return;
    }
    if (!planId) {
      toast.error('Please select a subscription plan');
      return;
    }
    if (expiryDate < startDate) {
      toast.error('Expiry date cannot precede start date');
      return;
    }
    if (!minQtySatisfied) {
      toast.error(`Minimum product quantity requirement is ${selectedPlan?.minQuantity}`);
      return;
    }

    createManualMutation.mutate({
      customerId,
      planId,
      startDate,
      expiryDate,
      paymentTermId: paymentTermId || null,
      notes,
      totalRecurring: recurringTotal,
      lines: lines.map((l, i) => ({
        id: i + 1,
        productId: Number(l.productId),
        variantId: l.variantId ? Number(l.variantId) : null,
        quantity: Number(l.quantity),
        unitPrice: Number(l.unitPrice),
        amount: Number(l.unitPrice) * Number(l.quantity),
        taxRate: Number(l.taxRate || 18),
      })),
    });
  };

  const handleSubmitTemplate = (e) => {
    e.preventDefault();
    if (!templateId) {
      toast.error('Please select a quote template');
      return;
    }
    if (!templateCustomerId) {
      toast.error('Please select a customer');
      return;
    }

    createTemplateMutation.mutate({
      templateId,
      customerId: templateCustomerId,
      startDate: templateStartDate,
    });
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <button
          onClick={() => navigate('/subscriptions')}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to subscriptions
        </button>
        <PageHeader
          title="Create Subscription"
          description="Initialize a new subscription agreement as Draft or start from a pre-configured Quote Template"
        />
      </div>

      {/* Mode Switcher */}
      <div className="flex bg-slate-200/70 p-1 rounded-xl max-w-sm">
        <button
          type="button"
          onClick={() => setMode('manual')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
            mode === 'manual'
              ? 'bg-white text-indigo-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Manual Configuration
        </button>
        <button
          type="button"
          onClick={() => setMode('template')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
            mode === 'template'
              ? 'bg-white text-indigo-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Start from Template
        </button>
      </div>

      {/* MODE 1: START FROM TEMPLATE */}
      {mode === 'template' ? (
        <Card className="max-w-2xl">
          <CardHeader
            title="Start from Quote Template"
            description="Quickly clones all predefined lines, base plan, and payment terms"
          />
          <form onSubmit={handleSubmitTemplate} className="space-y-4">
            <FormField label="Select Quote Template" required>
              <Select
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
              >
                <option value="">Choose a template...</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.termMonths} months · {t.lines?.length || 0} lines)
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="Target Customer" required>
              <Select
                value={templateCustomerId}
                onChange={(e) => setTemplateCustomerId(e.target.value)}
              >
                <option value="">Select customer...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.company ? `(${c.company})` : ''}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="Subscription Start Date" required>
              <Input
                type="date"
                value={templateStartDate}
                onChange={(e) => setTemplateStartDate(e.target.value)}
              />
            </FormField>

            <div className="flex justify-end pt-4 border-t">
              <Button
                type="submit"
                variant="primary"
                isLoading={createTemplateMutation.isPending}
                icon={Sparkles}
              >
                Generate Draft Subscription
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        /* MODE 2: MANUAL CONFIGURATION */
        <form onSubmit={handleSubmitManual} className="space-y-6">
          <Card>
            <CardHeader
              title="Customer & Plan Selection"
              description="Assign the subscriber and recurring cycle policy"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Customer" required>
                <Select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                >
                  <option value="">Select customer account...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.company ? `(${c.company})` : ''}
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField label="Plan" required>
                <Select
                  value={planId}
                  onChange={(e) => setPlanId(e.target.value)}
                >
                  <option value="">Select available plan...</option>
                  {availablePlans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.billingPeriod} · Base: ₹{p.price})
                    </option>
                  ))}
                </Select>
                {selectedPlan && (
                  <p className="text-[11px] text-slate-500 mt-1">
                    Min quantity: {selectedPlan.minQuantity} · {selectedPlan.pausable ? 'Pausable' : 'No pause'} · {selectedPlan.renewable ? 'Renewable' : 'Non-renewable'}
                  </p>
                )}
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <FormField label="Start Date" required>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </FormField>

              <FormField label="Expiry Date" required>
                <Input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                />
              </FormField>

              <FormField label="Payment Terms">
                <Select
                  value={paymentTermId}
                  onChange={(e) => setPaymentTermId(e.target.value)}
                >
                  <option value="">Default (Immediate)</option>
                  {terms.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.days}d)
                    </option>
                  ))}
                </Select>
              </FormField>
            </div>

            <div className="mt-4">
              <FormField label="Internal Notes / Terms">
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Special pricing agreement, custom SLA, etc."
                  rows={2}
                />
              </FormField>
            </div>
          </Card>

          {/* Product Lines Editor */}
          <Card>
            <div className="flex items-center justify-between pb-4 border-b mb-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Subscription Line Items
                </h3>
                <p className="text-xs text-slate-500">
                  Products and variant surcharges billed recurringly
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddLine}
                icon={Plus}
              >
                Add Line Item
              </Button>
            </div>

            {lines.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed">
                No product line items added. Click "Add Line Item" to configure.
              </div>
            ) : (
              <div className="space-y-3">
                {lines.map((line, idx) => {
                  const prod = products.find((p) => p.id === Number(line.productId));
                  const variants = prod?.variants || [];
                  const lineTotal = (Number(line.unitPrice) || 0) * (Number(line.quantity) || 1);

                  return (
                    <div
                      key={idx}
                      className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-3"
                    >
                      <div className="grid grid-cols-12 gap-3 items-center">
                        <div className="col-span-5">
                          <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                            Product
                          </label>
                          <Select
                            value={line.productId}
                            onChange={(e) => handleUpdateLine(idx, 'productId', e.target.value)}
                            className="text-xs"
                          >
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} (₹{p.salesPrice})
                              </option>
                            ))}
                          </Select>
                        </div>

                        <div className="col-span-4">
                          <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                            Variant (Surcharge)
                          </label>
                          <Select
                            value={line.variantId || ''}
                            onChange={(e) =>
                              handleUpdateLine(
                                idx,
                                'variantId',
                                e.target.value ? Number(e.target.value) : null
                              )
                            }
                            disabled={variants.length === 0}
                            className="text-xs"
                          >
                            <option value="">Base Product (+₹0)</option>
                            {variants.map((v) => (
                              <option key={v.id} value={v.id}>
                                {v.attribute}: {v.value} (+₹{v.extraPrice})
                              </option>
                            ))}
                          </Select>
                        </div>

                        <div className="col-span-2">
                          <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                            Quantity
                          </label>
                          <Input
                            type="number"
                            min="1"
                            value={line.quantity}
                            onChange={(e) =>
                              handleUpdateLine(idx, 'quantity', Number(e.target.value))
                            }
                            className="text-xs text-center"
                          />
                        </div>

                        <div className="col-span-1 pt-5 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveLine(idx)}
                            className="text-slate-400 hover:text-rose-600 p-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200/60 text-slate-600">
                        <div className="flex items-center gap-3">
                          <span>
                            Unit Price:{' '}
                            <strong className="text-slate-900">
                              <Money amount={line.unitPrice} />
                            </strong>
                          </span>
                          <span>Tax Rate: 18%</span>
                        </div>
                        <div className="font-semibold text-slate-900">
                          Line Subtotal: <Money amount={lineTotal} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Min Quantity Warning */}
            {selectedPlan && !minQtySatisfied && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-xs text-amber-800">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                <span>
                  <strong>Minimum Quantity Alert:</strong> {selectedPlan.name} requires a minimum product quantity of{' '}
                  <strong>{selectedPlan.minQuantity}</strong> (Current total: {totalQuantity}).
                </span>
              </div>
            )}

            {/* Price Breakdown Footer */}
            <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="text-xs text-slate-500 space-y-1">
                <p>Plan Recurring Base Fee: <Money amount={planBaseFee} /></p>
                <p>Products Subtotal: <Money amount={linesSubtotal} /></p>
                <p>Estimated Taxes (18%): <Money amount={taxSubtotal} /></p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500 block uppercase font-semibold">
                  Recurring Total / Cycle
                </span>
                <span className="text-2xl font-bold font-mono text-slate-900">
                  <Money amount={recurringTotal} />
                </span>
              </div>
            </div>
          </Card>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => navigate('/subscriptions')}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!minQtySatisfied || !customerId || !planId}
              isLoading={createManualMutation.isPending}
            >
              Create Draft Subscription
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

export default SubscriptionFormPage;
