import { addDays, periodEnd } from '../../lib/dates.js';
import { pct } from '../../lib/money.js';

const eligible = (discount, date) => discount.is_active !== false && (!discount.start_date || date >= discount.start_date) && (!discount.end_date || date <= discount.end_date) && (discount.usage_limit == null || discount.used_count < discount.usage_limit);
const discountValue = (discount, base) => discount.type === 'percent' ? pct(base, discount.value) : Math.min(base, Math.round(Number(discount.value) * 100));
const taxRule = (line, rules) => rules.filter((r) => r.is_active !== false && (r.applies_to === 'all' || (r.applies_to === 'product' && r.product_id === line.product_id) || (r.applies_to === 'product_type' && r.product_type === line.product_type))).sort((a, b) => ({ all: 0, product_type: 1, product: 2 }[b.applies_to] - ({ all: 0, product_type: 1, product: 2 }[a.applies_to])))[0];

export function computeInvoice({ subscription, plan, lines, products, variants = [], taxRules = [], discounts = [], paymentTerm = { days: 0 }, periodStart }) {
  const anchor = subscription.billing_anchor_day || Number(periodStart.slice(8));
  const baseLines = [];
  if (Number(plan.price || 0) > 0) baseLines.push({ kind: 'plan_fee', product_id: null, variant_id: null, product_type: null, description: `${plan.name} plan fee`, quantity: 1, unit_price: Math.round(Number(plan.price) * 100), line_subtotal: Math.round(Number(plan.price) * 100) });
  for (const line of lines) {
    const product = products.find((item) => item.id === line.product_id);
    if (!product) throw new Error(`Product ${line.product_id} not found`);
    const variant = variants.find((item) => item.id === line.variant_id);
    if (line.variant_id && (!variant || variant.product_id !== product.id)) throw new Error('Variant does not belong to product');
    const unitPrice = Math.round((Number(product.sales_price) + Number(variant?.extra_price || 0)) * 100);
    baseLines.push({ kind: 'product', product_id: product.id, variant_id: variant?.id || null, product_type: product.type, description: `${product.name}${variant ? ` (${variant.attribute}: ${variant.value})` : ''}`, quantity: line.quantity, unit_price: unitPrice, line_subtotal: unitPrice * line.quantity });
  }
  const rejectedDiscounts = [];
  const calcLines = baseLines.map((line) => {
    const candidates = discounts.filter((d) => d.applies_to === 'product' && d.product_id === line.product_id && line.quantity >= Number(d.min_quantity || 0) && line.line_subtotal >= Math.round(Number(d.min_purchase || 0) * 100));
    const usable = candidates.filter((d) => eligible(d, periodStart));
    for (const d of candidates.filter((d) => !eligible(d, periodStart))) rejectedDiscounts.push({ id: d.id, reason: d.end_date && periodStart > d.end_date ? `expired ${d.end_date}` : d.usage_limit != null ? `usage limit ${d.used_count}/${d.usage_limit} reached` : 'inactive or outside date range' });
    const selected = usable.sort((a, b) => discountValue(b, line.line_subtotal) - discountValue(a, line.line_subtotal))[0];
    const amount = selected ? discountValue(selected, line.line_subtotal) : 0;
    return { ...line, discount_amount: amount, discount_id: selected?.id || null, sub_discount_amount: 0, sub_discount_id: null };
  });
  const subtotal = calcLines.reduce((sum, line) => sum + line.line_subtotal, 0);
  const productQuantity = lines.reduce((sum, line) => sum + line.quantity, 0);
  const subCandidates = discounts.filter((d) => d.applies_to === 'subscription' && subtotal - calcLines.reduce((s, l) => s + l.discount_amount, 0) >= Math.round(Number(d.min_purchase || 0) * 100) && productQuantity >= Number(d.min_quantity || 0));
  const subBase = subtotal - calcLines.reduce((s, l) => s + l.discount_amount, 0);
  const selectedSub = subCandidates.filter((d) => eligible(d, periodStart)).sort((a, b) => discountValue(b, subBase) - discountValue(a, subBase))[0];
  const subDiscount = selectedSub ? discountValue(selectedSub, subBase) : 0;
  let allocated = 0;
  calcLines.forEach((line, index) => {
    const netBase = line.line_subtotal - line.discount_amount;
    const allocation = selectedSub ? (index === calcLines.length - 1 ? subDiscount - allocated : Math.floor(subDiscount * netBase / subBase)) : 0;
    allocated += allocation;
    line.sub_discount_amount = allocation;
    line.sub_discount_id = selectedSub?.id || null;
    const rule = taxRule(line, taxRules);
    line.tax_rule_id = rule?.id || null;
    line.tax_rate = Number(rule?.rate || 0);
    line.tax_amount = pct(netBase - allocation, line.tax_rate);
    line.line_total = netBase - allocation + line.tax_amount;
    line.calc_trail = [{ step: 'base', amount: line.line_subtotal }, ...(line.discount_id ? [{ step: 'discount', amount: -line.discount_amount }] : []), ...(allocation ? [{ step: 'subscription_discount', amount: -allocation }] : []), { step: 'tax', amount: line.tax_amount }, { step: 'total', amount: line.line_total }];
  });
  const discountTotal = calcLines.reduce((sum, line) => sum + line.discount_amount + line.sub_discount_amount, 0);
  const taxTotal = calcLines.reduce((sum, line) => sum + line.tax_amount, 0);
  const total = calcLines.reduce((sum, line) => sum + line.line_total, 0);
  if (total !== subtotal - discountTotal + taxTotal) throw new Error('Invoice calculation invariant failed');
  return { invoiceDate: periodStart, dueDate: addDays(periodStart, Number(paymentTerm.days || 0)), periodStart, periodEnd: periodEnd(periodStart, plan.billing_period, anchor), lines: calcLines, subtotal, discount_total: discountTotal, tax_total: taxTotal, total, calc_trail: { rejectedDiscounts, period: periodStart }, discountsUsed: [...new Set(calcLines.flatMap((l) => [l.discount_id, l.sub_discount_id]).filter(Boolean))] };
}
