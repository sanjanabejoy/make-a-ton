import { pool } from '../../db/pool.js';
import { getNextSubscriptionNumber } from '../../lib/numbering.js';
import { getToday } from '../../lib/clock.js';
import { logEvent } from '../../lib/events.js';
import { isBetween, addDays, diffDays, addPeriod } from '../../lib/dates.js';
import { toPaise, fromPaise, pct } from '../../lib/money.js';
import { parsePagination } from '../../lib/pagination.js';
import { canTransition } from './transitions.js';

// Resolve tax rate for a product based on specificity rule: product > product_type > all
export async function resolveTaxRate(productId, productType, client = pool) {
  const taxRulesRes = await client.query(
    'SELECT id, name, rate, applies_to, product_type, product_id FROM tax_rules WHERE is_active = true'
  );
  const rules = taxRulesRes.rows;

  const productRule = rules.find(r => r.applies_to === 'product' && String(r.product_id) === String(productId));
  if (productRule) return { taxRuleId: productRule.id, taxRate: parseFloat(productRule.rate) };

  const typeRule = rules.find(r => r.applies_to === 'product_type' && r.product_type === productType);
  if (typeRule) return { taxRuleId: typeRule.id, taxRate: parseFloat(typeRule.rate) };

  const allRule = rules.find(r => r.applies_to === 'all');
  if (allRule) return { taxRuleId: allRule.id, taxRate: parseFloat(allRule.rate) };

  return { taxRuleId: null, taxRate: 0 };
}

export async function createSubscription(input, actor) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Verify customer exists
    const custRes = await client.query('SELECT id, name FROM customers WHERE id = $1', [input.customerId]);
    if (custRes.rows.length === 0) {
      const err = new Error('Customer not found');
      err.code = 'NOT_FOUND';
      err.status = 404;
      throw err;
    }

    // 2. Verify plan
    const planRes = await client.query('SELECT * FROM plans WHERE id = $1', [input.planId]);
    if (planRes.rows.length === 0 || !planRes.rows[0].is_active) {
      const err = new Error('Plan not found or inactive');
      err.code = 'NOT_FOUND';
      err.status = 404;
      throw err;
    }
    const plan = planRes.rows[0];

    // Check plan window
    if (!isBetween(input.startDate, plan.valid_from, plan.valid_to)) {
      const err = new Error(`Plan "${plan.name}" is not available for start date ${input.startDate}`);
      err.code = 'RULE_VIOLATION';
      err.status = 409;
      throw err;
    }

    // 3. Numbering
    const number = await getNextSubscriptionNumber(client);

    // 4. Create subscription in draft
    const subRes = await client.query(
      `INSERT INTO subscriptions (
        number, customer_id, plan_id, status, start_date, expiry_date,
        payment_term_id, template_id, notes, created_by
      ) VALUES ($1, $2, $3, 'draft', $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        number,
        input.customerId,
        input.planId,
        input.startDate,
        input.expiryDate,
        input.paymentTermId || null,
        input.templateId || null,
        input.notes || null,
        actor?.id || null
      ]
    );
    const sub = subRes.rows[0];

    // 5. Build and insert lines
    for (const line of input.lines) {
      const prodRes = await client.query(
        'SELECT id, name, type, sales_price, is_active FROM products WHERE id = $1',
        [line.productId]
      );
      if (prodRes.rows.length === 0 || !prodRes.rows[0].is_active) {
        const err = new Error(`Product ${line.productId} not found or inactive`);
        err.code = 'NOT_FOUND';
        err.status = 404;
        throw err;
      }
      const product = prodRes.rows[0];

      let extraPrice = 0;
      if (line.variantId) {
        const varRes = await client.query(
          'SELECT id, product_id, extra_price FROM product_variants WHERE id = $1 AND product_id = $2',
          [line.variantId, line.productId]
        );
        if (varRes.rows.length === 0) {
          const err = new Error(`Variant ${line.variantId} does not belong to product ${line.productId}`);
          err.code = 'VALIDATION_ERROR';
          err.status = 422;
          throw err;
        }
        extraPrice = parseFloat(varRes.rows[0].extra_price);
      }

      const unitPrice = parseFloat(product.sales_price) + extraPrice;
      const amount = unitPrice * line.quantity;
      const { taxRate } = await resolveTaxRate(product.id, product.type, client);

      await client.query(
        `INSERT INTO subscription_lines (
          subscription_id, product_id, variant_id, quantity, unit_price, tax_rate, amount
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [sub.id, line.productId, line.variantId || null, line.quantity, unitPrice, taxRate, amount]
      );
    }

    await logEvent({
      entityType: 'subscription',
      entityId: sub.id,
      subscriptionId: sub.id,
      customerId: sub.customer_id,
      eventType: 'created',
      message: `Subscription ${sub.number} created in draft`,
      actorId: actor?.id
    }, client);

    await client.query('COMMIT');
    return getSubscriptionDetail(sub.id, {}, client);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function createFromTemplate(input, actor) {
  const client = await pool.connect();
  try {
    const tmplRes = await client.query(
      'SELECT * FROM quote_templates WHERE id = $1 AND is_active = true',
      [input.templateId]
    );
    if (tmplRes.rows.length === 0) {
      const err = new Error('Quote template not found or inactive');
      err.code = 'NOT_FOUND';
      err.status = 404;
      throw err;
    }
    const tmpl = tmplRes.rows[0];

    // Compute expiry: start + term_months - 1 day
    const termMonths = tmpl.term_months || 12;
    const parts = input.startDate.split('-').map(Number);
    let endY = parts[0];
    let endM = parts[1] + termMonths;
    if (endM > 12) {
      endY += Math.floor((endM - 1) / 12);
      endM = ((endM - 1) % 12) + 1;
    }
    const maxDays = new Date(Date.UTC(endY, endM, 0)).getUTCDate();
    const endD = Math.min(parts[2], maxDays);
    const endStr = `${endY}-${String(endM).padStart(2, '0')}-${String(endD).padStart(2, '0')}`;
    const expiryDate = addDays(endStr, -1);

    const linesRes = await client.query(
      'SELECT product_id, variant_id, quantity FROM quote_template_lines WHERE template_id = $1',
      [tmpl.id]
    );

    const subInput = {
      customerId: input.customerId,
      planId: tmpl.plan_id,
      startDate: input.startDate,
      expiryDate,
      paymentTermId: tmpl.payment_term_id,
      templateId: tmpl.id,
      notes: tmpl.notes,
      lines: linesRes.rows.map(r => ({
        productId: Number(r.product_id),
        variantId: r.variant_id ? Number(r.variant_id) : null,
        quantity: r.quantity
      }))
    };

    return createSubscription(subInput, actor);
  } finally {
    client.release();
  }
}

export async function updateSubscription(id, input, actor) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const subRes = await client.query('SELECT * FROM subscriptions WHERE id = $1 FOR UPDATE', [id]);
    if (subRes.rows.length === 0) {
      const err = new Error('Subscription not found');
      err.code = 'NOT_FOUND';
      err.status = 404;
      throw err;
    }
    const sub = subRes.rows[0];

    if (!['draft', 'quotation'].includes(sub.status)) {
      const err = new Error(`Only draft or quotation subscriptions can be updated (current status: ${sub.status})`);
      err.code = 'RULE_VIOLATION';
      err.status = 409;
      throw err;
    }

    if (input.notes !== undefined) {
      await client.query('UPDATE subscriptions SET notes = $1 WHERE id = $2', [input.notes, id]);
    }

    if (input.paymentTermId !== undefined) {
      await client.query('UPDATE subscriptions SET payment_term_id = $1 WHERE id = $2', [input.paymentTermId, id]);
    }

    // Lines editable only in draft
    if (input.lines && input.lines.length > 0) {
      if (sub.status !== 'draft') {
        const err = new Error('Lines can only be edited in draft status');
        err.code = 'RULE_VIOLATION';
        err.status = 409;
        throw err;
      }

      await client.query('DELETE FROM subscription_lines WHERE subscription_id = $1', [id]);

      for (const line of input.lines) {
        const prodRes = await client.query(
          'SELECT id, name, type, sales_price, is_active FROM products WHERE id = $1',
          [line.productId]
        );
        if (prodRes.rows.length === 0 || !prodRes.rows[0].is_active) {
          const err = new Error(`Product ${line.productId} not found or inactive`);
          err.code = 'NOT_FOUND';
          err.status = 404;
          throw err;
        }
        const product = prodRes.rows[0];

        let extraPrice = 0;
        if (line.variantId) {
          const varRes = await client.query(
            'SELECT id, extra_price FROM product_variants WHERE id = $1 AND product_id = $2',
            [line.variantId, line.productId]
          );
          if (varRes.rows.length === 0) {
            const err = new Error(`Variant ${line.variantId} does not belong to product ${line.productId}`);
            err.code = 'VALIDATION_ERROR';
            err.status = 422;
            throw err;
          }
          extraPrice = parseFloat(varRes.rows[0].extra_price);
        }

        const unitPrice = parseFloat(product.sales_price) + extraPrice;
        const amount = unitPrice * line.quantity;
        const { taxRate } = await resolveTaxRate(product.id, product.type, client);

        await client.query(
          `INSERT INTO subscription_lines (
            subscription_id, product_id, variant_id, quantity, unit_price, tax_rate, amount
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [id, line.productId, line.variantId || null, line.quantity, unitPrice, taxRate, amount]
        );
      }
    }

    await logEvent({
      entityType: 'subscription',
      entityId: sub.id,
      subscriptionId: sub.id,
      customerId: sub.customer_id,
      eventType: 'updated',
      message: `Subscription ${sub.number} details updated`,
      actorId: actor?.id
    }, client);

    await client.query('COMMIT');
    return getSubscriptionDetail(id, {}, client);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function transition(id, to, actor) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const subRes = await client.query(
      `SELECT s.*, p.min_quantity, p.closable, p.auto_close, p.billing_period,
              qt.validity_days AS template_validity_days
       FROM subscriptions s
       JOIN plans p ON p.id = s.plan_id
       LEFT JOIN quote_templates qt ON qt.id = s.template_id
       WHERE s.id = $1 FOR UPDATE`,
      [id]
    );

    if (subRes.rows.length === 0) {
      const err = new Error('Subscription not found');
      err.code = 'NOT_FOUND';
      err.status = 404;
      throw err;
    }
    const sub = subRes.rows[0];
    const today = await getToday();

    if (!canTransition(sub.status, to)) {
      const err = new Error(`Cannot transition from ${sub.status} to ${to}`);
      err.code = 'INVALID_TRANSITION';
      err.status = 409;
      throw err;
    }

    // Line quantity sum validation helper
    const checkMinQuantity = async () => {
      const sumRes = await client.query(
        'SELECT COALESCE(SUM(quantity), 0) AS total_qty FROM subscription_lines WHERE subscription_id = $1',
        [id]
      );
      const totalQty = parseInt(sumRes.rows[0].total_qty, 10);
      if (totalQty < sub.min_quantity) {
        const err = new Error(`Minimum total quantity of ${sub.min_quantity} required by plan (current: ${totalQty})`);
        err.code = 'RULE_VIOLATION';
        err.status = 409;
        throw err;
      }
    };

    if (to === 'quotation') {
      await checkMinQuantity();
      const validityDays = sub.template_validity_days || 15;
      const quoteValidUntil = addDays(today, validityDays);

      await client.query(
        `UPDATE subscriptions
         SET status = 'quotation',
             quote_sent_on = $1,
             quote_valid_until = $2
         WHERE id = $3`,
        [today, quoteValidUntil, id]
      );

      await logEvent({
        entityType: 'subscription',
        entityId: sub.id,
        subscriptionId: sub.id,
        customerId: sub.customer_id,
        eventType: 'quotation_sent',
        message: `Quotation sent on ${today}, valid until ${quoteValidUntil}`,
        actorId: actor?.id
      }, client);
    } else if (to === 'confirmed') {
      if (sub.quote_valid_until && today > sub.quote_valid_until) {
        const err = new Error(`Quotation expired on ${sub.quote_valid_until}`);
        err.code = 'RULE_VIOLATION';
        err.status = 409;
        throw err;
      }
      await checkMinQuantity();

      await client.query("UPDATE subscriptions SET status = 'confirmed' WHERE id = $1", [id]);

      await logEvent({
        entityType: 'subscription',
        entityId: sub.id,
        subscriptionId: sub.id,
        customerId: sub.customer_id,
        eventType: 'confirmed',
        message: `Subscription quotation confirmed`,
        actorId: actor?.id
      }, client);
    } else if (to === 'active') {
      if (sub.start_date > today) {
        const err = new Error(`Starts on ${sub.start_date}, will activate automatically`);
        err.code = 'RULE_VIOLATION';
        err.status = 409;
        throw err;
      }

      const anchorDay = parseInt(sub.start_date.split('-')[2], 10);

      await client.query(
        `UPDATE subscriptions
         SET status = 'active',
             activated_at = now(),
             next_billing_date = start_date,
             billing_anchor_day = $1
         WHERE id = $2`,
        [anchorDay, id]
      );

      await logEvent({
        entityType: 'subscription',
        entityId: sub.id,
        subscriptionId: sub.id,
        customerId: sub.customer_id,
        eventType: 'activated',
        message: `Subscription activated with billing anchor day ${anchorDay}`,
        actorId: actor?.id
      }, client);
    } else if (to === 'closed') {
      await client.query(
        `UPDATE subscriptions
         SET status = 'closed',
             closed_at = now(),
             close_reason = 'cancelled'
         WHERE id = $1`,
        [id]
      );

      await logEvent({
        entityType: 'subscription',
        entityId: sub.id,
        subscriptionId: sub.id,
        customerId: sub.customer_id,
        eventType: 'closed',
        message: `Subscription closed (reason: cancelled)`,
        actorId: actor?.id
      }, client);
    }

    await client.query('COMMIT');
    return getSubscriptionDetail(id, {}, client);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function pause(id, actor) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const subRes = await client.query(
      `SELECT s.*, p.pausable
       FROM subscriptions s
       JOIN plans p ON p.id = s.plan_id
       WHERE s.id = $1 FOR UPDATE`,
      [id]
    );

    if (subRes.rows.length === 0) {
      const err = new Error('Subscription not found');
      err.code = 'NOT_FOUND';
      err.status = 404;
      throw err;
    }
    const sub = subRes.rows[0];

    if (sub.status !== 'active') {
      const err = new Error(`Only active subscriptions can be paused (current status: ${sub.status})`);
      err.code = 'RULE_VIOLATION';
      err.status = 409;
      throw err;
    }

    if (!sub.pausable) {
      const err = new Error('Plan does not allow pause');
      err.code = 'RULE_VIOLATION';
      err.status = 409;
      throw err;
    }

    if (sub.paused_at) {
      const err = new Error('Subscription is already paused');
      err.code = 'RULE_VIOLATION';
      err.status = 409;
      throw err;
    }

    const today = await getToday();
    await client.query('UPDATE subscriptions SET paused_at = $1 WHERE id = $2', [today, id]);

    await logEvent({
      entityType: 'subscription',
      entityId: sub.id,
      subscriptionId: sub.id,
      customerId: sub.customer_id,
      eventType: 'paused',
      message: `Subscription paused on ${today}`,
      actorId: actor?.id
    }, client);

    await client.query('COMMIT');
    return getSubscriptionDetail(id, {}, client);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function resume(id, actor) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const subRes = await client.query('SELECT * FROM subscriptions WHERE id = $1 FOR UPDATE', [id]);
    if (subRes.rows.length === 0) {
      const err = new Error('Subscription not found');
      err.code = 'NOT_FOUND';
      err.status = 404;
      throw err;
    }
    const sub = subRes.rows[0];

    if (sub.status !== 'active' || !sub.paused_at) {
      const err = new Error('Only paused active subscriptions can be resumed');
      err.code = 'RULE_VIOLATION';
      err.status = 409;
      throw err;
    }

    const today = await getToday();
    const pausedDays = Math.max(0, diffDays(today, sub.paused_at));
    const newExpiryDate = addDays(sub.expiry_date, pausedDays);
    const newNextBilling = sub.next_billing_date && sub.next_billing_date > today ? sub.next_billing_date : today;

    await client.query(
      `UPDATE subscriptions
       SET paused_at = NULL,
           expiry_date = $1,
           next_billing_date = $2
       WHERE id = $3`,
      [newExpiryDate, newNextBilling, id]
    );

    await logEvent({
      entityType: 'subscription',
      entityId: sub.id,
      subscriptionId: sub.id,
      customerId: sub.customer_id,
      eventType: 'resumed',
      message: `Subscription resumed after ${pausedDays} paused days; expiry extended to ${newExpiryDate}`,
      actorId: actor?.id
    }, client);

    await client.query('COMMIT');
    return getSubscriptionDetail(id, {}, client);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function close(id, reason = 'early_close', actor) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const subRes = await client.query(
      `SELECT s.*, p.closable
       FROM subscriptions s
       JOIN plans p ON p.id = s.plan_id
       WHERE s.id = $1 FOR UPDATE`,
      [id]
    );

    if (subRes.rows.length === 0) {
      const err = new Error('Subscription not found');
      err.code = 'NOT_FOUND';
      err.status = 404;
      throw err;
    }
    const sub = subRes.rows[0];

    if (sub.status === 'closed') {
      const err = new Error('Subscription is already closed');
      err.code = 'RULE_VIOLATION';
      err.status = 409;
      throw err;
    }

    if (sub.status === 'active' && !sub.closable && reason === 'early_close') {
      const err = new Error('Plan does not allow early closure');
      err.code = 'RULE_VIOLATION';
      err.status = 409;
      throw err;
    }

    await client.query(
      `UPDATE subscriptions
       SET status = 'closed',
           close_reason = $1,
           closed_at = now()
       WHERE id = $2`,
      [reason, id]
    );

    await logEvent({
      entityType: 'subscription',
      entityId: sub.id,
      subscriptionId: sub.id,
      customerId: sub.customer_id,
      eventType: 'closed',
      message: `Subscription closed with reason: ${reason}`,
      actorId: actor?.id
    }, client);

    await client.query('COMMIT');
    return getSubscriptionDetail(id, {}, client);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function renew(id, { newExpiryDate } = {}, actor) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const subRes = await client.query(
      `SELECT s.*, p.renewable
       FROM subscriptions s
       JOIN plans p ON p.id = s.plan_id
       WHERE s.id = $1 FOR UPDATE`,
      [id]
    );

    if (subRes.rows.length === 0) {
      const err = new Error('Subscription not found');
      err.code = 'NOT_FOUND';
      err.status = 404;
      throw err;
    }
    const sub = subRes.rows[0];

    if (sub.status !== 'active') {
      const err = new Error(`Only active subscriptions can be renewed (current status: ${sub.status})`);
      err.code = 'RULE_VIOLATION';
      err.status = 409;
      throw err;
    }

    if (!sub.renewable) {
      const err = new Error('Plan does not allow renewal');
      err.code = 'RULE_VIOLATION';
      err.status = 409;
      throw err;
    }

    const termDays = Math.max(1, diffDays(sub.expiry_date, sub.start_date));
    const targetExpiry = newExpiryDate || addDays(sub.expiry_date, termDays);

    if (targetExpiry <= sub.expiry_date) {
      const err = new Error(`New expiry date (${targetExpiry}) must be after current expiry date (${sub.expiry_date})`);
      err.code = 'VALIDATION_ERROR';
      err.status = 422;
      throw err;
    }

    await client.query('UPDATE subscriptions SET expiry_date = $1 WHERE id = $2', [targetExpiry, id]);

    await logEvent({
      entityType: 'subscription',
      entityId: sub.id,
      subscriptionId: sub.id,
      customerId: sub.customer_id,
      eventType: 'renewed',
      message: `Subscription renewed until ${targetExpiry}`,
      actorId: actor?.id
    }, client);

    await client.query('COMMIT');
    return getSubscriptionDetail(id, {}, client);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function listSubscriptions(query, options = {}) {
  const { limit, offset, orderBy, q } = parsePagination(
    query,
    ['id', 'number', 'status', 'start_date', 'expiry_date', 'created_at', 'next_billing_date'],
    'created_at:desc'
  );

  const whereClauses = [];
  const params = [];

  if (options.scopeCustomerId) {
    params.push(options.scopeCustomerId);
    whereClauses.push(`s.customer_id = $${params.length}`);
  }

  if (query.status) {
    params.push(query.status);
    whereClauses.push(`s.status = $${params.length}`);
  }

  if (query.customerId) {
    params.push(query.customerId);
    whereClauses.push(`s.customer_id = $${params.length}`);
  }

  if (query.planId) {
    params.push(query.planId);
    whereClauses.push(`s.plan_id = $${params.length}`);
  }

  const today = await getToday();
  if (query.expiringInDays) {
    const days = parseInt(query.expiringInDays, 10);
    const targetDate = addDays(today, days);
    params.push(today, targetDate);
    whereClauses.push(`s.expiry_date >= $${params.length - 1} AND s.expiry_date <= $${params.length} AND s.status = 'active'`);
  }

  if (q) {
    params.push(`%${q}%`);
    whereClauses.push(`(s.number ILIKE $${params.length} OR c.name ILIKE $${params.length})`);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const countSql = `
    SELECT COUNT(*) AS count
    FROM subscriptions s
    JOIN customers c ON c.id = s.customer_id
    ${whereSql}
  `;
  const countRes = await pool.query(countSql, params);
  const total = parseInt(countRes.rows[0].count, 10);

  // Single join query, recurring amount pre-aggregated
  const sql = `
    SELECT
      s.id, s.number, s.status, s.start_date, s.expiry_date,
      s.next_billing_date, s.paused_at,
      c.id AS customer_id, c.name AS customer_name,
      p.id AS plan_id, p.name AS plan_name, p.billing_period, p.price AS plan_price,
      COALESCE(lines_agg.lines_amount, 0) AS lines_amount
    FROM subscriptions s
    JOIN customers c ON c.id = s.customer_id
    JOIN plans p ON p.id = s.plan_id
    LEFT JOIN (
      SELECT subscription_id, SUM(amount) AS lines_amount
      FROM subscription_lines
      GROUP BY subscription_id
    ) lines_agg ON lines_agg.subscription_id = s.id
    ${whereSql}
    ORDER BY s.${orderBy}
    LIMIT $${params.length + 1} OFFSET $${params.length + 2}
  `;

  const rowsRes = await pool.query(sql, [...params, limit, offset]);

  const items = rowsRes.rows.map(r => {
    const planFee = parseFloat(r.plan_price || 0);
    const linesSubtotal = parseFloat(r.lines_amount || 0);
    const recurringAmount = planFee + linesSubtotal;
    const isExpired = r.status === 'active' && r.expiry_date < today;

    return {
      id: Number(r.id),
      number: r.number,
      status: r.status,
      customer: { id: Number(r.customer_id), name: r.customer_name },
      plan: { id: Number(r.plan_id), name: r.plan_name, billingPeriod: r.billing_period },
      startDate: r.start_date,
      expiryDate: r.expiry_date,
      nextBillingDate: r.next_billing_date,
      pausedAt: r.paused_at,
      needsRenewal: isExpired,
      recurringAmount
    };
  });

  return {
    data: items,
    meta: {
      page: Math.floor(offset / limit) + 1,
      pageSize: limit,
      total
    }
  };
}

export async function getSubscriptionDetail(id, options = {}, client = pool) {
  const subRes = await client.query(
    `SELECT s.*,
            c.id AS customer_id, c.name AS customer_name,
            p.id AS plan_id, p.name AS plan_name, p.billing_period, p.price AS plan_price,
            p.pausable, p.closable, p.renewable, p.auto_close,
            pt.id AS payment_term_id, pt.name AS payment_term_name, pt.days AS payment_term_days
     FROM subscriptions s
     JOIN customers c ON c.id = s.customer_id
     JOIN plans p ON p.id = s.plan_id
     LEFT JOIN payment_terms pt ON pt.id = s.payment_term_id
     WHERE s.id = $1`,
    [id]
  );

  if (subRes.rows.length === 0) {
    const err = new Error('Subscription not found');
    err.code = 'NOT_FOUND';
    err.status = 404;
    throw err;
  }
  const r = subRes.rows[0];

  if (options.scopeCustomerId && String(r.customer_id) !== String(options.scopeCustomerId)) {
    const err = new Error('Subscription not found');
    err.code = 'NOT_FOUND';
    err.status = 404;
    throw err;
  }

  // Load lines
  const linesRes = await client.query(
    `SELECT sl.id, sl.product_id, p.name AS product_name,
            sl.variant_id, pv.attribute, pv.value AS variant_value,
            sl.quantity, sl.unit_price, sl.tax_rate, sl.amount
     FROM subscription_lines sl
     JOIN products p ON p.id = sl.product_id
     LEFT JOIN product_variants pv ON pv.id = sl.variant_id
     WHERE sl.subscription_id = $1
     ORDER BY sl.id ASC`,
    [id]
  );

  const lines = linesRes.rows.map(l => ({
    id: Number(l.id),
    productId: Number(l.product_id),
    productName: l.product_name,
    variantId: l.variant_id ? Number(l.variant_id) : null,
    variantLabel: l.variant_id ? `${l.attribute}: ${l.variant_value}` : null,
    quantity: l.quantity,
    unitPrice: parseFloat(l.unit_price),
    taxRate: parseFloat(l.tax_rate),
    amount: parseFloat(l.amount)
  }));

  const today = await getToday();
  const planFeePaise = toPaise(r.plan_price || 0);

  let subtotalPaise = 0;
  let taxPaise = 0;
  for (const line of lines) {
    const lineAmtPaise = toPaise(line.amount);
    subtotalPaise += lineAmtPaise;
    taxPaise += pct(lineAmtPaise, line.taxRate);
  }

  const totalPaise = planFeePaise + subtotalPaise + taxPaise;
  const isExpired = r.status === 'active' && r.expiry_date < today;
  const allowedTransitions = (TRANSITIONS[r.status] || []);

  const canPause = r.status === 'active' && !r.paused_at && Boolean(r.pausable);
  const canResume = r.status === 'active' && Boolean(r.paused_at);
  const canClose = r.status !== 'closed' && (r.status !== 'active' || Boolean(r.closable));
  const canRenew = r.status === 'active' && Boolean(r.renewable);
  const canActivate = r.status === 'confirmed' && r.start_date <= today;

  return {
    id: Number(r.id),
    number: r.number,
    status: r.status,
    customer: { id: Number(r.customer_id), name: r.customer_name },
    plan: { id: Number(r.plan_id), name: r.plan_name, billingPeriod: r.billing_period },
    startDate: r.start_date,
    expiryDate: r.expiry_date,
    nextBillingDate: r.next_billing_date,
    pausedAt: r.paused_at,
    needsRenewal: isExpired,
    recurringAmount: fromPaise(planFeePaise + subtotalPaise),
    paymentTerm: r.payment_term_id ? {
      id: Number(r.payment_term_id),
      name: r.payment_term_name,
      days: r.payment_term_days
    } : undefined,
    quoteValidUntil: r.quote_valid_until,
    quoteSentOn: r.quote_sent_on,
    notes: r.notes,
    closeReason: r.close_reason,
    lines,
    totals: {
      planFee: fromPaise(planFeePaise),
      subtotal: fromPaise(subtotalPaise),
      tax: fromPaise(taxPaise),
      total: fromPaise(totalPaise)
    },
    allowedTransitions,
    actions: {
      canPause,
      canResume,
      canClose,
      canRenew,
      canActivate,
      reasons: {
        pause: !r.pausable ? 'Plan does not allow pause' : (r.paused_at ? 'Already paused' : (r.status !== 'active' ? 'Only active subscriptions can be paused' : undefined)),
        close: !r.closable && r.status === 'active' ? 'Plan does not allow early closure' : undefined,
        renew: !r.renewable ? 'Plan does not allow renewal' : (r.status !== 'active' ? 'Only active subscriptions can be renewed' : undefined),
        activate: r.status === 'confirmed' && r.start_date > today ? `Starts on ${r.start_date}, will activate automatically` : undefined
      }
    }
  };
}

export async function getTimeline(id) {
  const res = await pool.query(
    `SELECT e.id, e.event_type AS "eventType", e.message,
            e.occurred_at AS "occurredAt", e.sim_date AS "simDate",
            e.meta, u.name AS "actorName"
     FROM events e
     LEFT JOIN users u ON u.id = e.actor_id
     WHERE e.subscription_id = $1
     ORDER BY e.occurred_at DESC`,
    [id]
  );
  return res.rows;
}

export async function getUpcomingInvoice(id) {
  const subRes = await pool.query('SELECT * FROM subscriptions WHERE id = $1', [id]);
  if (subRes.rows.length === 0) return null;
  const sub = subRes.rows[0];

  if (!['active', 'confirmed'].includes(sub.status)) return null;

  const planRes = await pool.query('SELECT * FROM plans WHERE id = $1', [sub.plan_id]);
  if (planRes.rows.length === 0) return null;
  const plan = planRes.rows[0];

  const [linesRes, prodsRes, varsRes, taxesRes, discRes, termRes] = await Promise.all([
    pool.query('SELECT * FROM subscription_lines WHERE subscription_id = $1', [id]),
    pool.query('SELECT * FROM products'),
    pool.query('SELECT * FROM product_variants'),
    pool.query('SELECT * FROM tax_rules WHERE is_active = true'),
    pool.query('SELECT * FROM discounts WHERE is_active = true'),
    sub.payment_term_id ? pool.query('SELECT * FROM payment_terms WHERE id = $1', [sub.payment_term_id]) : { rows: [] }
  ]);

  const { computeInvoice } = await import('../billing/engine.js');
  const periodStart = sub.next_billing_date || sub.start_date;

  try {
    const inv = computeInvoice({
      subscription: sub,
      plan,
      lines: linesRes.rows,
      periodStart,
      products: prodsRes.rows,
      variants: varsRes.rows,
      taxRules: taxesRes.rows,
      discounts: discRes.rows,
      paymentTerm: termRes.rows[0] || null
    });
    return inv;
  } catch (err) {
    return null;
  }
}
