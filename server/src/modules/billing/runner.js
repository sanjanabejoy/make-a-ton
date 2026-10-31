import { pool } from '../../db/pool.js';
import { getToday } from '../../lib/clock.js';
import { getSetting } from '../../lib/settings.js';
import { getNextInvoiceNumber } from '../../lib/numbering.js';
import { logEvent } from '../../lib/events.js';
import { addPeriod } from '../../lib/dates.js';
import { toPaise, fromPaise } from '../../lib/money.js';
import { computeInvoice } from './engine.js';

export async function runBilling({ asOfDate, dryRun = false, actorId = null }) {
  const effectiveAsOf = asOfDate || (await getToday());
  const autoConfirm = await getSetting('auto_confirm_invoices', false);

  let billingRunId = null;
  if (!dryRun) {
    const runRes = await pool.query(
      `INSERT INTO billing_runs (as_of_date, dry_run, status, started_by)
       VALUES ($1, false, 'running', $2)
       RETURNING id`,
      [effectiveAsOf, actorId]
    );
    billingRunId = runRes.rows[0].id;
  }

  // Pre-load catalog data
  const [plansRes, prodsRes, varsRes, taxesRes, discRes, termsRes] = await Promise.all([
    pool.query('SELECT * FROM plans'),
    pool.query('SELECT * FROM products'),
    pool.query('SELECT * FROM product_variants'),
    pool.query('SELECT * FROM tax_rules WHERE is_active = true'),
    pool.query('SELECT * FROM discounts WHERE is_active = true'),
    pool.query('SELECT * FROM payment_terms')
  ]);

  const planMap = new Map(plansRes.rows.map(p => [Number(p.id), p]));
  const prodMap = new Map(prodsRes.rows.map(p => [Number(p.id), p]));
  const varMap = new Map(varsRes.rows.map(v => [Number(v.id), v]));
  const taxRules = taxesRes.rows;
  const discounts = discRes.rows;
  const termMap = new Map(termsRes.rows.map(t => [Number(t.id), t]));

  // In-memory usage counter
  const usage = new Map(discounts.map(d => [Number(d.id), d.used_count || 0]));

  // Find all active, unpaused candidate subscriptions where next_billing_date <= asOfDate
  const candRes = await pool.query(
    `SELECT id, number, customer_id, plan_id, start_date, expiry_date,
            next_billing_date, billing_anchor_day, payment_term_id
     FROM subscriptions
     WHERE status = 'active'
       AND paused_at IS NULL
       AND next_billing_date <= $1
     ORDER BY id ASC`,
    [effectiveAsOf]
  );
  const candidates = candRes.rows;

  let scanned = candidates.length;
  let invoicesCreated = 0;
  let totalAmountPaise = 0;
  const errors = [];
  const createdSample = [];
  const byPlanMap = new Map();
  const byDateMap = new Map();

  // Process in batches
  const BATCH_SIZE = 50;
  for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
    const batch = candidates.slice(i, i + BATCH_SIZE);
    const subIds = batch.map(s => s.id);

    // Batch load lines
    const linesRes = await pool.query(
      `SELECT id, subscription_id, product_id, variant_id, quantity
       FROM subscription_lines
       WHERE subscription_id = ANY($1)
       ORDER BY id ASC`,
      [subIds]
    );

    const linesBySub = new Map();
    for (const l of linesRes.rows) {
      const sId = Number(l.subscription_id);
      if (!linesBySub.has(sId)) linesBySub.set(sId, []);
      linesBySub.get(sId).push(l);
    }

    for (const cand of batch) {
      const plan = planMap.get(Number(cand.plan_id));
      if (!plan) continue;

      const subLines = linesBySub.get(Number(cand.id)) || [];
      const paymentTerm = cand.payment_term_id ? termMap.get(Number(cand.payment_term_id)) : null;
      const anchorDay = cand.billing_anchor_day || parseInt(cand.start_date.split('-')[2], 10);

      const client = dryRun ? null : await pool.connect();
      try {
        if (!dryRun) {
          await client.query('BEGIN');
          // Lock subscription
          const lockRes = await client.query(
            'SELECT * FROM subscriptions WHERE id = $1 FOR UPDATE SKIP LOCKED',
            [cand.id]
          );
          if (lockRes.rows.length === 0) {
            // Held by another transaction, skip
            await client.query('ROLLBACK');
            continue;
          }
        }

        let currentNextBilling = cand.next_billing_date;

        // Catch-up loop: up to 36 periods
        for (let period = 0; period < 36; period++) {
          const periodStart = currentNextBilling;
          if (periodStart > effectiveAsOf || periodStart > cand.expiry_date) {
            break;
          }

          // Check if invoice already exists
          const existingInv = await (dryRun ? pool : client).query(
            'SELECT id FROM invoices WHERE subscription_id = $1 AND period_start = $2',
            [cand.id, periodStart]
          );
          if (existingInv.rows.length > 0) {
            // Advance pointer only
            currentNextBilling = addPeriod(periodStart, plan.billing_period, anchorDay);
            if (!dryRun) {
              await client.query(
                'UPDATE subscriptions SET next_billing_date = $1 WHERE id = $2',
                [currentNextBilling, cand.id]
              );
            }
            continue;
          }

          // Compute invoice
          let inv;
          try {
            inv = computeInvoice({
              subscription: cand,
              plan,
              lines: subLines,
              periodStart,
              products: prodMap,
              variants: varMap,
              taxRules,
              discounts,
              paymentTerm,
              usageOverrides: usage
            });
          } catch (compErr) {
            errors.push({ subscriptionId: cand.id, message: compErr.message });
            break;
          }

          // Update in-memory usage
          for (const dId of inv.discountsUsed) {
            usage.set(dId, (usage.get(dId) || 0) + 1);
          }

          const invTotalPaise = toPaise(inv.total);
          totalAmountPaise += invTotalPaise;
          invoicesCreated++;

          // Aggregate by plan & by date
          const planName = plan.name;
          const prevPlan = byPlanMap.get(planName) || { plan: planName, count: 0, total: 0 };
          prevPlan.count++;
          prevPlan.total += inv.total;
          byPlanMap.set(planName, prevPlan);

          const invDate = inv.invoiceDate;
          const prevDate = byDateMap.get(invDate) || { date: invDate, count: 0, total: 0 };
          prevDate.count++;
          prevDate.total += inv.total;
          byDateMap.set(invDate, prevDate);

          if (dryRun) {
            currentNextBilling = addPeriod(periodStart, plan.billing_period, anchorDay);
            if (createdSample.length < 50) {
              createdSample.push({
                number: `INV-DRY-${invoicesCreated}`,
                subscription: { id: cand.id, number: cand.number },
                customer: { id: cand.customer_id },
                invoiceDate: inv.invoiceDate,
                dueDate: inv.dueDate,
                periodStart: inv.periodStart,
                periodEnd: inv.periodEnd,
                total: inv.total,
                lines: inv.lines,
                calcTrail: inv.calcTrail
              });
            }
            continue;
          }

          // REAL PERSISTENCE:
          await client.query('SAVEPOINT sp_inv');

          const number = await getNextInvoiceNumber(client);
          const invStatus = autoConfirm ? 'confirmed' : 'draft';
          const confirmedAt = autoConfirm ? new Date() : null;

          const invRes = await client.query(
            `INSERT INTO invoices (
              number, subscription_id, customer_id, status,
              invoice_date, due_date, period_start, period_end,
              subtotal, discount_total, tax_total, total, amount_paid,
              currency, payment_term_name, calc_trail, billing_run_id,
              confirmed_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 0, 'INR', $13, $14, $15, $16)
            ON CONFLICT (subscription_id, period_start) DO NOTHING
            RETURNING id`,
            [
              number,
              cand.id,
              cand.customer_id,
              invStatus,
              inv.invoiceDate,
              inv.dueDate,
              inv.periodStart,
              inv.periodEnd,
              inv.subtotal,
              inv.discountTotal,
              inv.taxTotal,
              inv.total,
              paymentTerm?.name || 'Immediate',
              JSON.stringify(inv.calcTrail),
              billingRunId,
              confirmedAt
            ]
          );

          if (invRes.rows.length === 0) {
            await client.query('ROLLBACK TO SAVEPOINT sp_inv');
            currentNextBilling = addPeriod(periodStart, plan.billing_period, anchorDay);
            continue;
          }

          const invoiceId = invRes.rows[0].id;

          // Atomic discount reservation
          let discountExhausted = false;
          for (const dId of inv.discountsUsed) {
            const discUpd = await client.query(
              `UPDATE discounts
               SET used_count = used_count + 1
               WHERE id = $1 AND (usage_limit IS NULL OR used_count < usage_limit)
               RETURNING id`,
              [dId]
            );
            if (discUpd.rows.length === 0) {
              discountExhausted = true;
              break;
            }
          }

          if (discountExhausted) {
            await client.query('ROLLBACK TO SAVEPOINT sp_inv');
            // Recompute once with that discount excluded
            const updatedDiscounts = discounts.map(d => inv.discountsUsed.includes(d.id) ? { ...d, is_active: false } : d);
            inv = computeInvoice({
              subscription: cand,
              plan,
              lines: subLines,
              periodStart,
              products: prodMap,
              variants: varMap,
              taxRules,
              discounts: updatedDiscounts,
              paymentTerm
            });
            // Retry insert
            const retryNum = await getNextInvoiceNumber(client);
            const retryRes = await client.query(
              `INSERT INTO invoices (
                number, subscription_id, customer_id, status,
                invoice_date, due_date, period_start, period_end,
                subtotal, discount_total, tax_total, total, amount_paid,
                currency, payment_term_name, calc_trail, billing_run_id,
                confirmed_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 0, 'INR', $13, $14, $15, $16)
              RETURNING id`,
              [
                retryNum, cand.id, cand.customer_id, invStatus,
                inv.invoiceDate, inv.dueDate, inv.periodStart, inv.periodEnd,
                inv.subtotal, inv.discountTotal, inv.taxTotal, inv.total,
                paymentTerm?.name || 'Immediate', JSON.stringify(inv.calcTrail),
                billingRunId, confirmedAt
              ]
            );
            const retryId = retryRes.rows[0].id;
            for (const l of inv.lines) {
              await client.query(
                `INSERT INTO invoice_lines (
                  invoice_id, kind, product_id, variant_id, description,
                  quantity, unit_price, line_subtotal, discount_amount, discount_id,
                  sub_discount_amount, sub_discount_id, tax_rule_id, tax_rate, tax_amount,
                  line_total, calc_trail
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
                [
                  retryId, l.kind, l.productId, l.variantId, l.description,
                  l.quantity, l.unitPrice, l.lineSubtotal, l.discountAmount, l.discountId,
                  l.subDiscountAmount, l.subDiscountId, l.taxRuleId, l.taxRate, l.taxAmount,
                  l.lineTotal, JSON.stringify(l.calcTrail)
                ]
              );
            }
          } else {
            // Insert lines normally
            for (const l of inv.lines) {
              await client.query(
                `INSERT INTO invoice_lines (
                  invoice_id, kind, product_id, variant_id, description,
                  quantity, unit_price, line_subtotal, discount_amount, discount_id,
                  sub_discount_amount, sub_discount_id, tax_rule_id, tax_rate, tax_amount,
                  line_total, calc_trail
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
                [
                  invoiceId, l.kind, l.productId, l.variantId, l.description,
                  l.quantity, l.unitPrice, l.lineSubtotal, l.discountAmount, l.discountId,
                  l.subDiscountAmount, l.subDiscountId, l.taxRuleId, l.taxRate, l.taxAmount,
                  l.lineTotal, JSON.stringify(l.calcTrail)
                ]
              );
            }
          }

          // Advance subscription pointer
          currentNextBilling = addPeriod(periodStart, plan.billing_period, anchorDay);
          await client.query(
            'UPDATE subscriptions SET next_billing_date = $1 WHERE id = $2',
            [currentNextBilling, cand.id]
          );

          await logEvent({
            entityType: 'invoice',
            entityId: invoiceId,
            subscriptionId: cand.id,
            customerId: cand.customer_id,
            eventType: 'invoice_generated',
            message: `Invoice ${number} generated for period ${inv.periodStart} to ${inv.periodEnd}`,
            actorId
          }, client);

          if (createdSample.length < 50) {
            createdSample.push({
              id: invoiceId,
              number,
              subscription: { id: cand.id, number: cand.number },
              customer: { id: cand.customer_id },
              invoiceDate: inv.invoiceDate,
              dueDate: inv.dueDate,
              periodStart: inv.periodStart,
              periodEnd: inv.periodEnd,
              total: inv.total,
              amountPaid: 0,
              outstanding: inv.total,
              status: invStatus,
              isHistorical: false
            });
          }
        }

        if (!dryRun) {
          await client.query('COMMIT');
        }
      } catch (err) {
        if (!dryRun && client) {
          try { await client.query('ROLLBACK'); } catch (_) {}
        }
        errors.push({ subscriptionId: cand.id, message: err.message });
      } finally {
        if (!dryRun && client) {
          client.release();
        }
      }
    }
  }

  const finalTotal = fromPaise(totalAmountPaise);

  if (!dryRun && billingRunId) {
    await pool.query(
      `UPDATE billing_runs
       SET status = 'completed',
           scanned = $1,
           invoices_created = $2,
           total_amount = $3,
           errors = $4,
           finished_at = now()
       WHERE id = $5`,
      [scanned, invoicesCreated, finalTotal, JSON.stringify(errors), billingRunId]
    );
  }

  return {
    billingRunId,
    asOfDate: effectiveAsOf,
    dryRun,
    scanned,
    invoicesCreated,
    totalAmount: finalTotal,
    byPlan: Array.from(byPlanMap.values()),
    byDate: Array.from(byDateMap.values()),
    sample: createdSample,
    errors
  };
}

