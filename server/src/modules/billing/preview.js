import { pool } from '../../db/pool.js';
import { getToday } from '../../lib/clock.js';
import { runBilling } from './runner.js';

export async function previewBilling(asOfDate) {
  const targetDate = asOfDate || (await getToday());

  // 1. Run dry-run billing runner
  const dryResult = await runBilling({ asOfDate: targetDate, dryRun: true });

  // 2. Query projected overdue as of targetDate
  const overdueRes = await pool.query(
    `SELECT COUNT(*) AS count, COALESCE(SUM(total - amount_paid), 0) AS amount
     FROM invoices
     WHERE status = 'confirmed' AND due_date < $1 AND amount_paid < total`,
    [targetDate]
  );
  const overdueCount = parseInt(overdueRes.rows[0].count, 10);
  const overdueAmount = parseFloat(overdueRes.rows[0].amount);

  // 3. Query projected MRR (normalized to monthly)
  const mrrRes = await pool.query(
    `SELECT COALESCE(SUM(
      CASE p.billing_period
        WHEN 'monthly' THEN (COALESCE(lines_agg.net_amount, 0) + p.price)
        WHEN 'yearly' THEN (COALESCE(lines_agg.net_amount, 0) + p.price) / 12.0
        WHEN 'weekly' THEN (COALESCE(lines_agg.net_amount, 0) + p.price) * (52.0 / 12.0)
        WHEN 'daily' THEN (COALESCE(lines_agg.net_amount, 0) + p.price) * (365.0 / 12.0)
        ELSE 0
      END
    ), 0) AS mrr
    FROM subscriptions s
    JOIN plans p ON p.id = s.plan_id
    LEFT JOIN (
      SELECT subscription_id, SUM(amount) AS net_amount
      FROM subscription_lines
      GROUP BY subscription_id
    ) lines_agg ON lines_agg.subscription_id = s.id
    WHERE s.status = 'active' AND s.paused_at IS NULL`
  );
  const projectedMrr = Math.round(parseFloat(mrrRes.rows[0].mrr) * 100) / 100;

  // Compute net and tax totals from byPlan or sample
  let netTotal = 0;
  let taxTotal = 0;
  for (const s of dryResult.sample) {
    for (const l of (s.lines || [])) {
      netTotal += (l.lineSubtotal - l.discountAmount - l.subDiscountAmount);
      taxTotal += l.taxAmount;
    }
  }

  return {
    asOfDate: targetDate,
    invoicesToCreate: dryResult.invoicesCreated,
    net: Math.round(netTotal * 100) / 100,
    tax: Math.round(taxTotal * 100) / 100,
    total: dryResult.totalAmount,
    byPlan: dryResult.byPlan,
    byDate: dryResult.byDate,
    sample: dryResult.sample,
    projectedOverdue: {
      count: overdueCount,
      amount: Math.round(overdueAmount * 100) / 100
    },
    projectedMrr
  };
}

