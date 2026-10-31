import { toPaise, fromPaise, pct, format } from '../../lib/money.js';
import { addDays, periodEnd, isBetween } from '../../lib/dates.js';

export function computeInvoice({
  subscription,
  plan,
  lines,
  periodStart,
  products,
  variants,
  taxRules = [],
  discounts = [],
  paymentTerm = null,
  usageOverrides = null
}) {
  const invoiceDate = periodStart;
  const pEnd = periodEnd(periodStart, plan.billing_period, subscription.billing_anchor_day);
  const paymentDays = paymentTerm?.days || 0;
  const dueDate = addDays(invoiceDate, paymentDays);

  const getUsedCount = (d) => {
    if (usageOverrides && usageOverrides.has(d.id)) {
      return usageOverrides.get(d.id);
    }
    return d.used_count || 0;
  };

  const rejectedDiscounts = [];
  const discountsUsed = [];

  // Index products and variants if arrays passed
  const prodMap = Array.isArray(products)
    ? new Map(products.map(p => [Number(p.id), p]))
    : (products instanceof Map ? products : new Map());

  const varMap = Array.isArray(variants)
    ? new Map(variants.map(v => [Number(v.id), v]))
    : (variants instanceof Map ? variants : new Map());

  // 1. Build initial lines (plan fee + product lines)
  const computedLines = [];

  // Plan fee line
  const planPricePaise = toPaise(plan.price || 0);
  if (planPricePaise > 0) {
    computedLines.push({
      kind: 'plan_fee',
      productId: null,
      variantId: null,
      description: `${plan.name} - Plan Fee`,
      quantity: 1,
      unitPricePaise: planPricePaise,
      lineSubtotalPaise: planPricePaise,
      discountAmountPaise: 0,
      discountId: null,
      subDiscountAmountPaise: 0,
      subDiscountId: null,
      taxRuleId: null,
      taxRate: 0,
      taxName: null,
      taxAmountPaise: 0,
      lineTotalPaise: planPricePaise,
      calcTrail: [
        {
          step: 'plan_fee',
          label: `${plan.name} - Plan Fee`,
          detail: 'Fixed periodic fee',
          amount: fromPaise(planPricePaise)
        }
      ]
    });
  }

  // Product lines
  for (const line of lines) {
    const prod = prodMap.get(Number(line.productId || line.product_id));
    if (!prod) {
      throw new Error(`Product ${line.productId || line.product_id} not found in catalog`);
    }

    const variantId = line.variantId || line.variant_id ? Number(line.variantId || line.variant_id) : null;
    const variant = variantId ? varMap.get(variantId) : null;

    const basePricePaise = toPaise(prod.sales_price);
    const extraPricePaise = variant ? toPaise(variant.extra_price) : 0;
    const unitPricePaise = basePricePaise + extraPricePaise;
    const qty = Number(line.quantity);
    const lineSubtotalPaise = unitPricePaise * qty;

    const trail = [
      {
        step: 'base',
        label: `${prod.name} × ${qty}`,
        detail: `${format(basePricePaise)} each`,
        amount: fromPaise(basePricePaise * qty)
      }
    ];

    if (extraPricePaise > 0 && variant) {
      trail.push({
        step: 'variant',
        label: `${variant.attribute}: ${variant.value}`,
        detail: `+${format(extraPricePaise)} per unit`,
        amount: fromPaise(extraPricePaise * qty)
      });
    }

    computedLines.push({
      kind: 'product',
      productId: Number(prod.id),
      productType: prod.type,
      productName: prod.name,
      variantId,
      description: variant ? `${prod.name} (${variant.attribute}: ${variant.value})` : prod.name,
      quantity: qty,
      unitPricePaise,
      lineSubtotalPaise,
      discountAmountPaise: 0,
      discountId: null,
      subDiscountAmountPaise: 0,
      subDiscountId: null,
      taxRuleId: null,
      taxRate: 0,
      taxName: null,
      taxAmountPaise: 0,
      lineTotalPaise: lineSubtotalPaise,
      calcTrail: trail
    });
  }

  // 2. Evaluate Product-Scope Discounts
  const eligibleProductDiscounts = [];
  for (const d of discounts) {
    if (!d.is_active) continue;
    if (d.applies_to !== 'product') continue;

    if (!isBetween(periodStart, d.start_date, d.end_date)) {
      rejectedDiscounts.push({
        name: d.name,
        reason: d.end_date && periodStart > d.end_date ? `expired ${d.end_date}` : `starts ${d.start_date}`
      });
      continue;
    }

    const currentUsed = getUsedCount(d);
    if (d.usage_limit !== null && d.usage_limit !== undefined && currentUsed >= d.usage_limit) {
      rejectedDiscounts.push({
        name: d.name,
        reason: `usage limit ${d.usage_limit}/${d.usage_limit} reached`
      });
      continue;
    }

    eligibleProductDiscounts.push(d);
  }

  // Apply best product discount per product line
  for (const line of computedLines) {
    if (line.kind !== 'product') continue;

    const matchingDiscounts = eligibleProductDiscounts.filter(
      d => String(d.product_id) === String(line.productId)
    );

    let bestDiscount = null;
    let bestDiscountPaise = 0;

    for (const d of matchingDiscounts) {
      const minPurchasePaise = toPaise(d.min_purchase || 0);
      if (line.lineSubtotalPaise < minPurchasePaise) {
        rejectedDiscounts.push({
          name: d.name,
          reason: `min purchase ${format(minPurchasePaise)} not met`
        });
        continue;
      }

      if (d.min_quantity && line.quantity < d.min_quantity) {
        rejectedDiscounts.push({
          name: d.name,
          reason: `min quantity ${d.min_quantity} not met`
        });
        continue;
      }

      let discountValPaise = 0;
      if (d.type === 'percent') {
        discountValPaise = pct(line.lineSubtotalPaise, d.value);
      } else {
        discountValPaise = Math.min(toPaise(d.value), line.lineSubtotalPaise);
      }

      if (discountValPaise > bestDiscountPaise) {
        bestDiscountPaise = discountValPaise;
        bestDiscount = d;
      }
    }

    if (bestDiscount && bestDiscountPaise > 0) {
      line.discountAmountPaise = bestDiscountPaise;
      line.discountId = Number(bestDiscount.id);
      line.calcTrail.push({
        step: 'discount',
        label: `${bestDiscount.name} (${bestDiscount.type === 'percent' ? bestDiscount.value + '%' : format(toPaise(bestDiscount.value))})`,
        detail: `used ${getUsedCount(bestDiscount)}/${bestDiscount.usage_limit || '∞'}`,
        amount: -fromPaise(bestDiscountPaise)
      });
      if (!discountsUsed.includes(Number(bestDiscount.id))) {
        discountsUsed.push(Number(bestDiscount.id));
      }
    }
  }

  // 3. Evaluate Subscription-Scope Discounts
  let netBeforeSubDiscountPaise = 0;
  let totalProductQuantity = 0;
  for (const line of computedLines) {
    netBeforeSubDiscountPaise += (line.lineSubtotalPaise - line.discountAmountPaise);
    if (line.kind === 'product') {
      totalProductQuantity += line.quantity;
    }
  }

  const eligibleSubDiscounts = [];
  for (const d of discounts) {
    if (!d.is_active) continue;
    if (d.applies_to !== 'subscription') continue;

    if (!isBetween(periodStart, d.start_date, d.end_date)) {
      rejectedDiscounts.push({
        name: d.name,
        reason: d.end_date && periodStart > d.end_date ? `expired ${d.end_date}` : `starts ${d.start_date}`
      });
      continue;
    }

    const currentUsed = getUsedCount(d);
    if (d.usage_limit !== null && d.usage_limit !== undefined && currentUsed >= d.usage_limit) {
      rejectedDiscounts.push({
        name: d.name,
        reason: `usage limit ${d.usage_limit}/${d.usage_limit} reached`
      });
      continue;
    }

    const minPurchasePaise = toPaise(d.min_purchase || 0);
    if (netBeforeSubDiscountPaise < minPurchasePaise) {
      rejectedDiscounts.push({
        name: d.name,
        reason: `min purchase ${format(minPurchasePaise)} not met`
      });
      continue;
    }

    if (d.min_quantity && totalProductQuantity < d.min_quantity) {
      rejectedDiscounts.push({
        name: d.name,
        reason: `min quantity ${d.min_quantity} not met`
      });
      continue;
    }

    eligibleSubDiscounts.push(d);
  }

  let bestSubDiscount = null;
  let bestSubDiscountPaise = 0;
  for (const d of eligibleSubDiscounts) {
    let valPaise = 0;
    if (d.type === 'percent') {
      valPaise = pct(netBeforeSubDiscountPaise, d.value);
    } else {
      valPaise = Math.min(toPaise(d.value), netBeforeSubDiscountPaise);
    }
    if (valPaise > bestSubDiscountPaise) {
      bestSubDiscountPaise = valPaise;
      bestSubDiscount = d;
    }
  }

  // Allocate subscription discount proportionally across lines (remainder to last line)
  if (bestSubDiscount && bestSubDiscountPaise > 0 && netBeforeSubDiscountPaise > 0) {
    discountsUsed.push(Number(bestSubDiscount.id));
    let allocatedSoFar = 0;

    for (let i = 0; i < computedLines.length; i++) {
      const line = computedLines[i];
      const lineBasePaise = line.lineSubtotalPaise - line.discountAmountPaise;

      let alloc = 0;
      if (i === computedLines.length - 1) {
        alloc = bestSubDiscountPaise - allocatedSoFar;
      } else {
        alloc = Math.floor((bestSubDiscountPaise * lineBasePaise) / netBeforeSubDiscountPaise);
        allocatedSoFar += alloc;
      }

      line.subDiscountAmountPaise = alloc;
      line.subDiscountId = Number(bestSubDiscount.id);

      if (alloc > 0) {
        const pctShare = Math.round((alloc / bestSubDiscountPaise) * 100);
        line.calcTrail.push({
          step: 'subscription_discount',
          label: `${bestSubDiscount.name}`,
          detail: `allocated ${pctShare}%`,
          amount: -fromPaise(alloc)
        });
      }
    }
  }

  // 4. Resolve Tax per line on Net Amount
  for (const line of computedLines) {
    const netPaise = line.lineSubtotalPaise - line.discountAmountPaise - line.subDiscountAmountPaise;

    let matchedRule = null;
    if (line.kind === 'plan_fee') {
      matchedRule = taxRules.find(r => r.is_active && r.applies_to === 'all');
    } else {
      matchedRule = taxRules.find(r => r.is_active && r.applies_to === 'product' && String(r.product_id) === String(line.productId))
        || taxRules.find(r => r.is_active && r.applies_to === 'product_type' && r.product_type === line.productType)
        || taxRules.find(r => r.is_active && r.applies_to === 'all');
    }

    const rate = matchedRule ? parseFloat(matchedRule.rate) : 0;
    const taxPaise = pct(netPaise, rate);

    line.taxRuleId = matchedRule ? Number(matchedRule.id) : null;
    line.taxRate = rate;
    line.taxName = matchedRule ? matchedRule.name : null;
    line.taxAmountPaise = taxPaise;
    line.lineTotalPaise = netPaise + taxPaise;

    if (rate > 0) {
      line.calcTrail.push({
        step: 'tax',
        label: `${line.taxName || 'Tax'} ${rate}%`,
        detail: `on ${format(netPaise)}`,
        amount: fromPaise(taxPaise)
      });
    }

    line.calcTrail.push({
      step: 'total',
      label: 'Line total',
      amount: fromPaise(line.lineTotalPaise)
    });
  }

  // 5. Compute Invoice Totals and Assert Math
  let subtotalPaise = 0;
  let discountTotalPaise = 0;
  let taxTotalPaise = 0;
  let totalPaise = 0;

  for (const line of computedLines) {
    subtotalPaise += line.lineSubtotalPaise;
    discountTotalPaise += (line.discountAmountPaise + line.subDiscountAmountPaise);
    taxTotalPaise += line.taxAmountPaise;
    totalPaise += line.lineTotalPaise;
  }

  const expectedTotal = subtotalPaise - discountTotalPaise + taxTotalPaise;
  if (totalPaise !== expectedTotal) {
    throw new Error(`Invoice math inconsistency: total (${totalPaise}) != subtotal (${subtotalPaise}) - discount (${discountTotalPaise}) + tax (${taxTotalPaise})`);
  }

  // Format final lines
  const finalLines = computedLines.map((l, index) => ({
    id: index + 1,
    kind: l.kind,
    productId: l.productId,
    variantId: l.variantId,
    description: l.description,
    quantity: l.quantity,
    unitPrice: fromPaise(l.unitPricePaise),
    lineSubtotal: fromPaise(l.lineSubtotalPaise),
    discountAmount: fromPaise(l.discountAmountPaise),
    discountId: l.discountId,
    subDiscountAmount: fromPaise(l.subDiscountAmountPaise),
    subDiscountId: l.subDiscountId,
    taxRuleId: l.taxRuleId,
    taxName: l.taxName,
    taxRate: l.taxRate,
    taxAmount: fromPaise(l.taxAmountPaise),
    lineTotal: fromPaise(l.lineTotalPaise),
    calcTrail: l.calcTrail
  }));

  const invoiceCalcTrail = {
    period: `${periodStart} to ${pEnd}`,
    dueDateRule: `${paymentDays} days (${paymentTerm?.name || 'Immediate'})`,
    planName: plan.name,
    billingPeriod: plan.billing_period,
    rejectedDiscounts,
    notes: []
  };

  return {
    invoiceDate,
    dueDate,
    periodStart,
    periodEnd: pEnd,
    subtotal: fromPaise(subtotalPaise),
    discountTotal: fromPaise(discountTotalPaise),
    taxTotal: fromPaise(taxTotalPaise),
    total: fromPaise(totalPaise),
    lines: finalLines,
    calcTrail: invoiceCalcTrail,
    discountsUsed
  };
}

