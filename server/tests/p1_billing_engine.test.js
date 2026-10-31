import test from 'node:test';
import assert from 'node:assert/strict';
import { computeInvoice } from '../src/modules/billing/engine.js';

test('billing engine includes variant price, discount, tax and exact totals', () => {
  const result = computeInvoice({
    subscription: { billing_anchor_day: 31 },
    plan: { id: 1, name: 'Monthly', price: 100, billing_period: 'monthly' },
    lines: [{ product_id: 1, variant_id: 2, quantity: 5 }],
    products: [{ id: 1, name: 'ERP', type: 'software', sales_price: 2000 }],
    variants: [{ id: 2, product_id: 1, attribute: 'Brand', value: 'Odoo', extra_price: 560 }],
    taxRules: [{ id: 1, name: 'GST', applies_to: 'all', rate: 18 }],
    discounts: [{ id: 1, name: 'Volume', type: 'percent', value: 10, applies_to: 'product', product_id: 1, min_quantity: 5, is_active: true }],
    paymentTerm: { days: 15 },
    periodStart: '2026-01-31',
  });
  assert.equal(result.lines[1].unit_price, 256000);
  assert.equal(result.lines[1].discount_amount, 128000);
  assert.equal(result.total, result.subtotal - result.discount_total + result.tax_total);
  assert.equal(result.periodEnd, '2026-02-27');
});
