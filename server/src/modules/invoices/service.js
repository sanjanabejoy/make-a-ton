import { pool } from '../../db/pool.js';
import { getToday } from '../../lib/clock.js';
import { logEvent } from '../../lib/events.js';
import { sendMail } from '../../lib/mailer.js';
import { config } from '../../config.js';
import { diffDays } from '../../lib/dates.js';
import { parsePagination } from '../../lib/pagination.js';

export async function listInvoices(query, options = {}) {
  const { limit, offset, orderBy, q } = parsePagination(
    query,
    ['id', 'number', 'status', 'invoice_date', 'due_date', 'total', 'created_at'],
    'created_at:desc'
  );

  const today = await getToday();
  const whereClauses = [];
  const params = [];

  if (options.scopeCustomerId) {
    params.push(options.scopeCustomerId);
    whereClauses.push(`i.customer_id = $${params.length}`);
  }

  if (query.customerId) {
    params.push(query.customerId);
    whereClauses.push(`i.customer_id = $${params.length}`);
  }

  if (query.subscriptionId) {
    params.push(query.subscriptionId);
    whereClauses.push(`i.subscription_id = $${params.length}`);
  }

  if (query.status) {
    params.push(query.status);
    whereClauses.push(`i.status = $${params.length}`);
  }

  if (query.from) {
    params.push(query.from);
    whereClauses.push(`i.invoice_date >= $${params.length}`);
  }

  if (query.to) {
    params.push(query.to);
    whereClauses.push(`i.invoice_date <= $${params.length}`);
  }

  if (query.overdue === 'true' || query.overdue === true) {
    params.push(today);
    whereClauses.push(`i.status = 'confirmed' AND i.due_date < $${params.length} AND i.amount_paid < i.total`);
  }

  if (q) {
    params.push(`%${q}%`);
    whereClauses.push(`(i.number ILIKE $${params.length} OR c.name ILIKE $${params.length})`);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const countRes = await pool.query(
    `SELECT COUNT(*) FROM invoices i
     JOIN customers c ON c.id = i.customer_id
     ${whereSql}`,
    params
  );
  const total = parseInt(countRes.rows[0].count, 10);

  const sql = `
    SELECT i.id, i.number, i.status, i.invoice_date, i.due_date,
           i.period_start, i.period_end, i.total, i.amount_paid,
           i.is_historical,
           c.id AS customer_id, c.name AS customer_name,
           s.id AS subscription_id, s.number AS subscription_number
    FROM invoices i
    JOIN customers c ON c.id = i.customer_id
    JOIN subscriptions s ON s.id = i.subscription_id
    ${whereSql}
    ORDER BY i.${orderBy}
    LIMIT $${params.length + 1} OFFSET $${params.length + 2}
  `;

  const rowsRes = await pool.query(sql, [...params, limit, offset]);

  const items = rowsRes.rows.map(r => {
    const totalAmt = parseFloat(r.total);
    const amtPaid = parseFloat(r.amount_paid);
    const outstanding = r.status === 'confirmed' ? Math.max(0, totalAmt - amtPaid) : 0;
    const isOverdue = r.status === 'confirmed' && r.due_date < today && amtPaid < totalAmt;
    const daysOverdue = isOverdue ? diffDays(today, r.due_date) : 0;

    return {
      id: Number(r.id),
      number: r.number,
      status: r.status,
      isOverdue,
      daysOverdue,
      customer: { id: Number(r.customer_id), name: r.customer_name },
      subscription: { id: Number(r.subscription_id), number: r.subscription_number },
      invoiceDate: r.invoice_date,
      dueDate: r.due_date,
      periodStart: r.period_start,
      periodEnd: r.period_end,
      total: totalAmt,
      amountPaid: amtPaid,
      outstanding: Math.round(outstanding * 100) / 100,
      isHistorical: Boolean(r.is_historical)
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

export async function getInvoiceDetail(id, options = {}) {
  const today = await getToday();

  const invRes = await pool.query(
    `SELECT i.*,
            c.id AS customer_id, c.name AS customer_name, c.email AS customer_email,
            c.billing_address AS customer_billing_address,
            s.id AS subscription_id, s.number AS subscription_number
     FROM invoices i
     JOIN customers c ON c.id = i.customer_id
     JOIN subscriptions s ON s.id = i.subscription_id
     WHERE i.id = $1`,
    [id]
  );

  if (invRes.rows.length === 0) {
    const err = new Error('Invoice not found');
    err.code = 'NOT_FOUND';
    err.status = 404;
    throw err;
  }
  const r = invRes.rows[0];

  if (options.scopeCustomerId && String(r.customer_id) !== String(options.scopeCustomerId)) {
    const err = new Error('Invoice not found');
    err.code = 'NOT_FOUND';
    err.status = 404;
    throw err;
  }

  // Load lines
  const linesRes = await pool.query(
    `SELECT il.*, tr.name AS tax_name
     FROM invoice_lines il
     LEFT JOIN tax_rules tr ON tr.id = il.tax_rule_id
     WHERE il.invoice_id = $1
     ORDER BY il.id ASC`,
    [id]
  );

  const lines = linesRes.rows.map(l => ({
    id: Number(l.id),
    kind: l.kind,
    description: l.description,
    quantity: l.quantity,
    unitPrice: parseFloat(l.unit_price),
    lineSubtotal: parseFloat(l.line_subtotal),
    discountAmount: parseFloat(l.discount_amount),
    subDiscountAmount: parseFloat(l.sub_discount_amount),
    taxName: l.tax_name || null,
    taxRate: parseFloat(l.tax_rate),
    taxAmount: parseFloat(l.tax_amount),
    lineTotal: parseFloat(l.line_total),
    calcTrail: l.calc_trail || []
  }));

  // Load payments
  const paymentsRes = await pool.query(
    `SELECT p.id, p.invoice_id, p.method, p.amount, p.paid_on,
            p.note, p.reference, p.voided_at, u.name AS recorded_by_name
     FROM payments p
     LEFT JOIN users u ON u.id = p.recorded_by
     WHERE p.invoice_id = $1
     ORDER BY p.paid_on DESC, p.id DESC`,
    [id]
  );

  const payments = paymentsRes.rows.map(p => ({
    id: Number(p.id),
    invoiceId: Number(p.invoice_id),
    invoiceNumber: r.number,
    customerName: r.customer_name,
    method: p.method,
    amount: parseFloat(p.amount),
    paidOn: p.paid_on,
    note: p.note,
    reference: p.reference,
    voidedAt: p.voided_at,
    recordedByName: p.recorded_by_name
  }));

  // Load reminders
  const remindersRes = await pool.query(
    `SELECT id, invoice_id, step, offset_days, scheduled_for, status, sent_at, message
     FROM reminders
     WHERE invoice_id = $1
     ORDER BY step ASC`,
    [id]
  );

  const reminders = remindersRes.rows.map(rem => ({
    id: Number(rem.id),
    invoiceId: Number(rem.invoice_id),
    step: rem.step,
    offsetDays: rem.offset_days,
    scheduledFor: rem.scheduled_for,
    status: rem.status,
    sentAt: rem.sent_at,
    message: rem.message
  }));

  const totalAmt = parseFloat(r.total);
  const amtPaid = parseFloat(r.amount_paid);
  const outstanding = r.status === 'confirmed' ? Math.max(0, totalAmt - amtPaid) : 0;
  const isOverdue = r.status === 'confirmed' && r.due_date < today && amtPaid < totalAmt;
  const daysOverdue = isOverdue ? diffDays(today, r.due_date) : 0;

  const canConfirm = r.status === 'draft';
  const canCancel = (r.status === 'draft' || r.status === 'confirmed') && amtPaid === 0;
  const canSend = r.status === 'confirmed' || r.status === 'paid';
  const canPay = r.status === 'confirmed' && outstanding > 0;

  return {
    id: Number(r.id),
    number: r.number,
    status: r.status,
    isOverdue,
    daysOverdue,
    customer: {
      id: Number(r.customer_id),
      name: r.customer_name,
      email: r.customer_email,
      billingAddress: r.customer_billing_address
    },
    subscription: {
      id: Number(r.subscription_id),
      number: r.subscription_number
    },
    invoiceDate: r.invoice_date,
    dueDate: r.due_date,
    periodStart: r.period_start,
    periodEnd: r.period_end,
    subtotal: parseFloat(r.subtotal),
    discountTotal: parseFloat(r.discount_total),
    taxTotal: parseFloat(r.tax_total),
    total: totalAmt,
    amountPaid: amtPaid,
    outstanding: Math.round(outstanding * 100) / 100,
    currency: r.currency || 'INR',
    paymentTermName: r.payment_term_name,
    isHistorical: Boolean(r.is_historical),
    sentAt: r.sent_at,
    confirmedAt: r.confirmed_at,
    paidAt: r.paid_at,
    cancelledAt: r.cancelled_at,
    lines,
    payments,
    reminders,
    calcTrail: r.calc_trail || { rejectedDiscounts: [], notes: [] },
    availableActions: {
      canConfirm,
      canCancel,
      canSend,
      canPay
    }
  };
}

export async function confirm(id, actor) {
  const invRes = await pool.query('SELECT * FROM invoices WHERE id = $1', [id]);
  if (invRes.rows.length === 0) {
    const err = new Error('Invoice not found');
    err.code = 'NOT_FOUND';
    err.status = 404;
    throw err;
  }
  const inv = invRes.rows[0];

  if (inv.status !== 'draft') {
    const err = new Error(`Only draft invoices can be confirmed (current status: ${inv.status})`);
    err.code = 'RULE_VIOLATION';
    err.status = 409;
    throw err;
  }

  await pool.query(
    `UPDATE invoices
     SET status = 'confirmed', confirmed_at = now()
     WHERE id = $1`,
    [id]
  );

  await logEvent({
    entityType: 'invoice',
    entityId: inv.id,
    subscriptionId: inv.subscription_id,
    customerId: inv.customer_id,
    eventType: 'confirmed',
    message: `Invoice ${inv.number} confirmed`,
    actorId: actor?.id
  });

  return getInvoiceDetail(id);
}

export async function cancel(id, actor) {
  const invRes = await pool.query('SELECT * FROM invoices WHERE id = $1', [id]);
  if (invRes.rows.length === 0) {
    const err = new Error('Invoice not found');
    err.code = 'NOT_FOUND';
    err.status = 404;
    throw err;
  }
  const inv = invRes.rows[0];

  if (parseFloat(inv.amount_paid) > 0) {
    const err = new Error('Cannot cancel an invoice with payments recorded');
    err.code = 'RULE_VIOLATION';
    err.status = 409;
    throw err;
  }

  if (!['draft', 'confirmed'].includes(inv.status)) {
    const err = new Error(`Cannot cancel invoice in status ${inv.status}`);
    err.code = 'RULE_VIOLATION';
    err.status = 409;
    throw err;
  }

  await pool.query(
    `UPDATE invoices
     SET status = 'cancelled', cancelled_at = now()
     WHERE id = $1`,
    [id]
  );

  await logEvent({
    entityType: 'invoice',
    entityId: inv.id,
    subscriptionId: inv.subscription_id,
    customerId: inv.customer_id,
    eventType: 'cancelled',
    message: `Invoice ${inv.number} cancelled`,
    actorId: actor?.id
  });

  return getInvoiceDetail(id);
}

export async function send(id, actor) {
  const inv = await getInvoiceDetail(id);

  if (!['confirmed', 'paid'].includes(inv.status)) {
    const err = new Error('Only confirmed or paid invoices can be sent');
    err.code = 'RULE_VIOLATION';
    err.status = 409;
    throw err;
  }

  const portalLink = `${config.appUrl}/portal/invoices/${id}`;
  const subject = `Your Invoice ${inv.number} from Brightloop Software`;
  const body = `
    <p>Dear ${inv.customer.name},</p>
    <p>Your invoice <strong>${inv.number}</strong> for ₹${inv.total.toFixed(2)} is ready.</p>
    <p>Due date: ${inv.dueDate}</p>
    <p>You can view and pay your invoice online at: <a href="${portalLink}">${portalLink}</a></p>
  `;

  await sendMail({
    to: inv.customer.email,
    subject,
    body,
    kind: 'invoice_send'
  });

  await pool.query('UPDATE invoices SET sent_at = now() WHERE id = $1', [id]);

  await logEvent({
    entityType: 'invoice',
    entityId: inv.id,
    subscriptionId: inv.subscription.id,
    customerId: inv.customer.id,
    eventType: 'sent',
    message: `Invoice ${inv.number} sent to ${inv.customer.email}`,
    actorId: actor?.id
  });

  return getInvoiceDetail(id);
}

export async function bulkConfirm({ ids, billingRunId }, actor) {
  let updatedIds = [];

  if (billingRunId) {
    const res = await pool.query(
      `UPDATE invoices
       SET status = 'confirmed', confirmed_at = now()
       WHERE billing_run_id = $1 AND status = 'draft'
       RETURNING id`,
      [billingRunId]
    );
    updatedIds = res.rows.map(r => r.id);
  } else if (ids && ids.length > 0) {
    const res = await pool.query(
      `UPDATE invoices
       SET status = 'confirmed', confirmed_at = now()
       WHERE id = ANY($1) AND status = 'draft'
       RETURNING id`,
      [ids]
    );
    updatedIds = res.rows.map(r => r.id);
  }

  for (const invId of updatedIds) {
    await logEvent({
      entityType: 'invoice',
      entityId: invId,
      eventType: 'confirmed',
      message: 'Invoice bulk-confirmed',
      actorId: actor?.id
    });
  }

  return { confirmedCount: updatedIds.length, ids: updatedIds };
}

