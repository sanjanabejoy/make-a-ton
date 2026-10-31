// SubscriptIQ - P4 Stateful Mocks
// Invoices, Payments, Billing Time Machine, Collections Cockpit, Insights, Reconcile, Clock, Dev Mailbox

let virtualDate = null;
const getToday = () => virtualDate || '2026-10-31';

// Seeded Invoices
let invoices = [
  {
    id: 1,
    number: 'INV-000001',
    subscriptionId: 1,
    subscriptionNumber: 'SUB-000001',
    customerId: 1,
    customerName: 'Acme Corporation',
    customerEmail: 'customer@brightloop.test',
    customerPhone: '+91 98765 43210',
    customerAddress: '42 Industrial Park, Sector 5, Bengaluru 560001',
    invoiceDate: '2026-10-01',
    dueDate: '2026-10-31',
    periodStart: '2026-10-01',
    periodEnd: '2026-10-31',
    currency: 'INR',
    paymentTermName: 'Net 30',
    subtotal: 16299.0,
    discountTotal: 1280.0,
    taxTotal: 2703.42,
    total: 17722.42,
    amountPaid: 0.0,
    status: 'confirmed',
    isOverdue: false,
    daysOverdue: 0,
    calcTrail: {
      period: '2026-10-01 to 2026-10-31',
      paymentTermRule: 'Net 30 days from period start',
      plan: 'Monthly Pro',
      billingRunId: 1,
      rejectedDiscounts: [
        { name: 'Spring 15% Promotional Code', reason: 'Promotion expired on 2026-06-30' },
        { name: 'Yearly 15% Enterprise Saver', reason: 'Usage cap limit of 20/20 redemptions reached' },
      ],
    },
    lines: [
      {
        id: 1,
        kind: 'plan_fee',
        productId: null,
        variantId: null,
        description: 'Monthly Pro Plan Recurring Fee',
        quantity: 1,
        unitPrice: 3499.0,
        lineSubtotal: 3499.0,
        discountAmount: 0.0,
        subDiscountAmount: 0.0,
        taxRate: 18.0,
        taxAmount: 629.82,
        lineTotal: 4128.82,
        calcTrail: [
          { step: 'plan_fee', label: 'Monthly Pro Plan Fee', detail: 'Base platform recurring license', amount: 3499.0 },
          { step: 'tax', label: 'GST 18% (Tax Rule #1, matched: all)', detail: '18% on ₹3,499.00', amount: 629.82 },
          { step: 'total', label: 'Line total', amount: 4128.82 },
        ],
      },
      {
        id: 2,
        kind: 'product',
        productId: 1,
        variantId: 101,
        description: 'Brightloop ERP (Brand: Odoo) × 5 seats',
        quantity: 5,
        unitPrice: 2560.0, // 2000 + 560
        lineSubtotal: 12800.0,
        discountAmount: 1280.0, // 10% volume discount
        discountId: 1,
        subDiscountAmount: 0.0,
        taxRate: 18.0,
        taxAmount: 2073.6,
        lineTotal: 13593.6,
        calcTrail: [
          { step: 'base', label: 'Brightloop ERP × 5', detail: '₹2,000.00 each base sales price', amount: 10000.0 },
          { step: 'variant', label: 'Brand: Odoo (+₹560/unit)', detail: '+₹560.00 variant surcharge per unit × 5', amount: 2800.0 },
          { step: 'discount', label: 'Volume 10% (Discount #1)', detail: '10% on ₹12,800.00 (min quantity 5 satisfied)', amount: -1280.0 },
          { step: 'tax', label: 'GST 18% (Tax Rule #1, matched: all)', detail: '18% on post-discount ₹11,520.00', amount: 2073.6 },
          { step: 'total', label: 'Line total', amount: 13593.6 },
        ],
      },
    ],
    payments: [],
    reminders: [
      { id: 1, step: 1, offsetDays: -3, scheduledFor: '2026-10-28', status: 'sent', sentAt: '2026-10-28T09:00:00Z', message: 'Upcoming payment due in 3 days for INV-000001' },
      { id: 2, step: 2, offsetDays: 0, scheduledFor: '2026-10-31', status: 'simulated', sentAt: '2026-10-31T09:00:00Z', message: 'Payment due today for INV-000001' },
      { id: 3, step: 3, offsetDays: 3, scheduledFor: '2026-11-03', status: 'queued', sentAt: null, message: 'Friendly reminder: payment overdue for INV-000001' },
    ],
    availableActions: ['cancel', 'send', 'print', 'record_payment'],
  },
  {
    id: 2,
    number: 'INV-000002',
    subscriptionId: 2,
    subscriptionNumber: 'SUB-000002',
    customerId: 2,
    customerName: 'Globex Inc',
    customerEmail: 'billing@globex.test',
    customerPhone: '+91 91234 56789',
    customerAddress: 'Tech City, Tower B, Hyderabad 500081',
    invoiceDate: '2026-09-01',
    dueDate: '2026-09-15',
    periodStart: '2026-09-01',
    periodEnd: '2026-09-30',
    currency: 'INR',
    paymentTermName: 'Net 15',
    subtotal: 20000.0,
    discountTotal: 0.0,
    taxTotal: 3600.0,
    total: 23600.0,
    amountPaid: 0.0,
    status: 'confirmed',
    isOverdue: true,
    daysOverdue: 46,
    calcTrail: {
      period: '2026-09-01 to 2026-09-30',
      paymentTermRule: 'Net 15 days',
      plan: 'Monthly Pro',
      rejectedDiscounts: [],
    },
    lines: [
      {
        id: 3,
        kind: 'product',
        productId: 1,
        variantId: null,
        description: 'Brightloop ERP Standard × 10 seats',
        quantity: 10,
        unitPrice: 2000.0,
        lineSubtotal: 20000.0,
        discountAmount: 0.0,
        subDiscountAmount: 0.0,
        taxRate: 18.0,
        taxAmount: 3600.0,
        lineTotal: 23600.0,
        calcTrail: [
          { step: 'base', label: 'Brightloop ERP × 10', detail: '₹2,000.00 each', amount: 20000.0 },
          { step: 'tax', label: 'GST 18%', detail: '18% on ₹20,000.00', amount: 3600.0 },
          { step: 'total', label: 'Line total', amount: 23600.0 },
        ],
      },
    ],
    payments: [],
    reminders: [
      { id: 4, step: 1, offsetDays: -3, scheduledFor: '2026-09-12', status: 'sent', sentAt: '2026-09-12T10:00:00Z', message: 'Upcoming payment due' },
      { id: 5, step: 2, offsetDays: 0, scheduledFor: '2026-09-15', status: 'sent', sentAt: '2026-09-15T10:00:00Z', message: 'Payment due today' },
      { id: 6, step: 3, offsetDays: 3, scheduledFor: '2026-09-18', status: 'simulated', sentAt: '2026-09-18T10:00:00Z', message: 'Friendly reminder overdue' },
      { id: 7, step: 4, offsetDays: 7, scheduledFor: '2026-09-22', status: 'simulated', sentAt: '2026-09-22T10:00:00Z', message: 'Second notice overdue' },
      { id: 8, step: 5, offsetDays: 14, scheduledFor: '2026-09-29', status: 'simulated', sentAt: '2026-09-29T10:00:00Z', message: 'Final notice overdue' },
    ],
    availableActions: ['send', 'print', 'record_payment'],
  },
  {
    id: 3,
    number: 'INV-000003',
    subscriptionId: 3,
    subscriptionNumber: 'SUB-000003',
    customerId: 3,
    customerName: 'Soylent Industries',
    customerEmail: 'finance@soylent.test',
    customerPhone: '+91 99887 76655',
    customerAddress: 'Nariman Point, Mumbai 400021',
    invoiceDate: '2026-10-15',
    dueDate: '2026-11-15',
    periodStart: '2026-10-15',
    periodEnd: '2026-11-14',
    currency: 'INR',
    paymentTermName: 'Net 30',
    subtotal: 10000.0,
    discountTotal: 500.0,
    taxTotal: 1710.0,
    total: 11210.0,
    amountPaid: 5000.0, // Partially paid!
    status: 'confirmed',
    isOverdue: false,
    daysOverdue: 0,
    calcTrail: {
      period: '2026-10-15 to 2026-11-14',
      paymentTermRule: 'Net 30 days',
      rejectedDiscounts: [],
    },
    lines: [
      {
        id: 4,
        kind: 'product',
        productId: 2,
        variantId: null,
        description: 'Brightloop CRM Enterprise',
        quantity: 5,
        unitPrice: 2000.0,
        lineSubtotal: 10000.0,
        discountAmount: 500.0,
        taxRate: 18.0,
        taxAmount: 1710.0,
        lineTotal: 11210.0,
        calcTrail: [
          { step: 'base', label: 'CRM Base × 5', detail: '₹2,000.00 each', amount: 10000.0 },
          { step: 'discount', label: 'Loyalty Discount', detail: '₹500 fixed coupon', amount: -500.0 },
          { step: 'tax', label: 'GST 18%', detail: '18% on ₹9,500.00', amount: 1710.0 },
          { step: 'total', label: 'Line total', amount: 11210.0 },
        ],
      },
    ],
    payments: [
      {
        id: 1,
        invoiceId: 3,
        invoiceNumber: 'INV-000003',
        customerId: 3,
        customerName: 'Soylent Industries',
        method: 'bank_transfer',
        amount: 5000.0,
        paidOn: '2026-10-20',
        reference: 'HDFC98234710',
        note: 'Part payment installment 1',
        createdAt: '2026-10-20T11:00:00Z',
      },
    ],
    reminders: [],
    availableActions: ['send', 'print', 'record_payment'],
  },
  {
    id: 4,
    number: 'INV-000004',
    subscriptionId: 4,
    subscriptionNumber: 'SUB-000004',
    customerId: 4,
    customerName: 'Initech Labs',
    customerEmail: 'peter@initech.test',
    customerPhone: '+91 94444 12345',
    invoiceDate: '2026-09-10',
    dueDate: '2026-10-10',
    periodStart: '2026-09-10',
    periodEnd: '2026-10-09',
    currency: 'INR',
    paymentTermName: 'Net 30',
    subtotal: 5000.0,
    discountTotal: 0.0,
    taxTotal: 900.0,
    total: 5900.0,
    amountPaid: 5900.0,
    status: 'paid',
    isOverdue: false,
    daysOverdue: 0,
    lines: [
      {
        id: 5,
        kind: 'product',
        description: 'Brightloop ERP Basic',
        quantity: 2,
        unitPrice: 2500.0,
        lineSubtotal: 5000.0,
        discountAmount: 0.0,
        taxRate: 18.0,
        taxAmount: 900.0,
        lineTotal: 5900.0,
      },
    ],
    payments: [
      {
        id: 2,
        invoiceId: 4,
        invoiceNumber: 'INV-000004',
        customerId: 4,
        customerName: 'Initech Labs',
        method: 'card',
        amount: 5900.0,
        paidOn: '2026-10-05',
        reference: 'STRIPE-SIM-9823',
        note: 'Full settlement via card',
        createdAt: '2026-10-05T14:30:00Z',
      },
    ],
    availableActions: ['send', 'print'],
  },
  {
    id: 5,
    number: 'INV-000005',
    subscriptionId: 5,
    subscriptionNumber: 'SUB-000005',
    customerId: 5,
    customerName: 'Stark Industries',
    customerEmail: 'tony@stark.test',
    invoiceDate: '2026-10-31',
    dueDate: '2026-11-30',
    periodStart: '2026-10-31',
    periodEnd: '2026-11-30',
    currency: 'INR',
    paymentTermName: 'Net 30',
    subtotal: 35000.0,
    discountTotal: 3500.0,
    taxTotal: 5670.0,
    total: 37170.0,
    amountPaid: 0.0,
    status: 'draft',
    isOverdue: false,
    daysOverdue: 0,
    lines: [
      {
        id: 6,
        kind: 'product',
        description: 'Brightloop Enterprise Cloud Suite',
        quantity: 10,
        unitPrice: 3500.0,
        lineSubtotal: 35000.0,
        discountAmount: 3500.0,
        taxRate: 18.0,
        taxAmount: 5670.0,
        lineTotal: 37170.0,
      },
    ],
    payments: [],
    availableActions: ['confirm', 'cancel', 'print'],
  },
];

// Seeded Payments
let payments = [
  {
    id: 1,
    invoiceId: 3,
    invoiceNumber: 'INV-000003',
    customerId: 3,
    customerName: 'Soylent Industries',
    method: 'bank_transfer',
    amount: 5000.0,
    paidOn: '2026-10-20',
    reference: 'HDFC98234710',
    note: 'Part payment installment 1',
    voidedAt: null,
    createdAt: '2026-10-20T11:00:00Z',
  },
  {
    id: 2,
    invoiceId: 4,
    invoiceNumber: 'INV-000004',
    customerId: 4,
    customerName: 'Initech Labs',
    method: 'card',
    amount: 5900.0,
    paidOn: '2026-10-05',
    reference: 'STRIPE-SIM-9823',
    note: 'Full settlement via card',
    voidedAt: null,
    createdAt: '2026-10-05T14:30:00Z',
  },
  {
    id: 3,
    invoiceId: 1,
    invoiceNumber: 'INV-000001',
    customerId: 1,
    customerName: 'Acme Corporation',
    method: 'upi',
    amount: 8000.0,
    paidOn: '2026-10-12',
    reference: 'UPI/2839102839/ACME',
    note: 'Advance payment',
    voidedAt: '2026-10-13T10:00:00Z', // Voided demonstration!
    createdAt: '2026-10-12T16:00:00Z',
  },
];

// Seeded Billing Runs
let billingRuns = [
  {
    id: 1,
    asOfDate: '2026-10-01',
    dryRun: false,
    status: 'completed',
    scanned: 15,
    invoicesCreated: 12,
    totalAmount: 142500.0,
    errors: [],
    startedBy: 'Admin User',
    createdAt: '2026-10-01T02:00:00Z',
  },
];

// Seeded Captured Emails
let emailLogs = [
  {
    id: 1,
    toEmail: 'customer@brightloop.test',
    subject: 'Your SubscriptIQ Invoice INV-000001 is ready',
    body: 'Dear Customer,\n\nYour recurring invoice INV-000001 for ₹17,722.42 is ready.\nView invoice online: http://localhost:5173/portal/invoices/1\n\nThank you,\nBrightloop Software Team',
    kind: 'invoice',
    delivered: false,
    createdAt: '2026-10-01T02:15:00Z',
  },
  {
    id: 2,
    toEmail: 'billing@globex.test',
    subject: 'URGENT: Outstanding payment reminder for Invoice INV-000002',
    body: 'Dear Globex Finance,\n\nInvoice INV-000002 of ₹23,600.00 is currently overdue by 46 days.\nPlease settle immediately or access your portal: http://localhost:5173/portal/invoices/2\n\nSubscriptIQ Collections Team',
    kind: 'reminder',
    delivered: false,
    createdAt: '2026-10-29T10:00:00Z',
  },
  {
    id: 3,
    toEmail: 'admin@brightloop.test',
    subject: 'SubscriptIQ Password Reset Request',
    body: 'You requested a password reset. Click below to choose a new password:\nhttp://localhost:5173/reset-password/a9f83b27c0128d94e\n\nLink valid for 1 hour.',
    kind: 'password_reset',
    delivered: false,
    createdAt: '2026-10-30T14:20:00Z',
  },
];

export default [
  // 1. CLOCK ENDPOINTS
  {
    method: 'GET',
    match: /^\/clock$/,
    handler: async () => {
      return {
        isSimulated: !!virtualDate,
        date: getToday(),
        realDate: '2026-10-31',
      };
    },
  },
  {
    method: 'POST',
    match: /^\/clock\/advance$/,
    handler: async (req) => {
      const { toDate, days, runBilling } = req.body || {};
      let nextDate = toDate;
      if (!nextDate && days) {
        const d = new Date(getToday());
        d.setDate(d.getDate() + parseInt(days, 10));
        nextDate = d.toISOString().split('T')[0];
      }
      virtualDate = nextDate || '2026-11-30';

      let run = null;
      let created = [];
      if (runBilling) {
        // Run billing engine
        const runId = billingRuns.length + 1;
        const newInvCount = 4;
        const totalAmt = 68400.0;
        run = {
          id: runId,
          asOfDate: virtualDate,
          dryRun: false,
          status: 'completed',
          scanned: 25,
          invoicesCreated: newInvCount,
          totalAmount: totalAmt,
          errors: [],
          startedBy: 'Admin User',
          createdAt: new Date().toISOString(),
        };
        billingRuns.unshift(run);

        // Add 2 new sample draft invoices
        const newInv = {
          id: invoices.length + 1,
          number: `INV-00000${invoices.length + 1}`,
          subscriptionId: 1,
          subscriptionNumber: 'SUB-000001',
          customerId: 1,
          customerName: 'Acme Corporation',
          customerEmail: 'customer@brightloop.test',
          invoiceDate: virtualDate,
          dueDate: virtualDate,
          periodStart: virtualDate,
          periodEnd: virtualDate,
          currency: 'INR',
          subtotal: 15000.0,
          discountTotal: 1000.0,
          taxTotal: 2520.0,
          total: 16520.0,
          amountPaid: 0.0,
          status: 'draft',
          isOverdue: false,
          daysOverdue: 0,
          lines: [
            {
              id: 10,
              kind: 'product',
              description: 'Brightloop ERP Next Cycle',
              quantity: 5,
              unitPrice: 2000.0,
              lineSubtotal: 10000.0,
              discountAmount: 1000.0,
              taxRate: 18.0,
              taxAmount: 1620.0,
              lineTotal: 10620.0,
            },
          ],
        };
        invoices.unshift(newInv);
        created.push(newInv);
      }

      return {
        success: true,
        virtualDate,
        run,
        created,
      };
    },
  },
  {
    method: 'POST',
    match: /^\/clock\/reset$/,
    handler: async () => {
      virtualDate = null;
      return { success: true, date: getToday() };
    },
  },

  // 2. INVOICES ENDPOINTS
  {
    method: 'GET',
    match: /^\/invoices$/,
    handler: async (req) => {
      const status = req.params.get('status');
      const q = req.params.get('q');
      const page = parseInt(req.params.get('page') || '1', 10);
      const pageSize = parseInt(req.params.get('pageSize') || '15', 10);

      // Re-evaluate overdue dynamically based on current today
      const today = getToday();
      invoices.forEach((inv) => {
        if (inv.status === 'confirmed' && inv.dueDate < today && inv.amountPaid < inv.total) {
          inv.isOverdue = true;
          const diffMs = new Date(today) - new Date(inv.dueDate);
          inv.daysOverdue = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
        } else {
          inv.isOverdue = false;
          inv.daysOverdue = 0;
        }
      });

      let list = [...invoices];
      if (status) {
        if (status === 'overdue') {
          list = list.filter((i) => i.isOverdue);
        } else {
          list = list.filter((i) => i.status === status);
        }
      }
      if (q) {
        const query = q.toLowerCase();
        list = list.filter(
          (i) =>
            i.number.toLowerCase().includes(query) ||
            i.customerName?.toLowerCase().includes(query) ||
            i.subscriptionNumber?.toLowerCase().includes(query)
        );
      }

      const total = list.length;
      const start = (page - 1) * pageSize;
      const paginated = list.slice(start, start + pageSize);

      return {
        data: paginated,
        meta: { page, pageSize, total },
      };
    },
  },
  {
    method: 'GET',
    match: /^\/invoices\/(\d+)$/,
    handler: async (req) => {
      const id = parseInt(req.match[1], 10);
      const inv = invoices.find((i) => i.id === id);
      if (!inv) return { status: 404, data: { error: { message: 'Invoice not found' } } };
      return { data: inv };
    },
  },
  {
    method: 'POST',
    match: /^\/invoices\/(\d+)\/confirm$/,
    handler: async (req) => {
      const id = parseInt(req.match[1], 10);
      const inv = invoices.find((i) => i.id === id);
      if (!inv) return { status: 404, data: { error: { message: 'Invoice not found' } } };
      inv.status = 'confirmed';
      inv.confirmedAt = new Date().toISOString();
      return { success: true, invoice: inv };
    },
  },
  {
    method: 'POST',
    match: /^\/invoices\/(\d+)\/cancel$/,
    handler: async (req) => {
      const id = parseInt(req.match[1], 10);
      const inv = invoices.find((i) => i.id === id);
      if (!inv) return { status: 404, data: { error: { message: 'Invoice not found' } } };
      if (Number(inv.amountPaid) > 0) {
        return { status: 422, data: { error: { message: 'Cannot cancel invoice with recorded payments' } } };
      }
      inv.status = 'cancelled';
      inv.cancelledAt = new Date().toISOString();
      return { success: true, invoice: inv };
    },
  },
  {
    method: 'POST',
    match: /^\/invoices\/(\d+)\/send$/,
    handler: async (req) => {
      const id = parseInt(req.match[1], 10);
      const inv = invoices.find((i) => i.id === id);
      if (!inv) return { status: 404, data: { error: { message: 'Invoice not found' } } };
      emailLogs.unshift({
        id: emailLogs.length + 1,
        toEmail: inv.customerEmail || 'customer@brightloop.test',
        subject: `Your Invoice ${inv.number} is ready`,
        body: `Hello,\n\nPlease find your invoice ${inv.number} for ₹${inv.total}.\nView: http://localhost:5173/portal/invoices/${inv.id}`,
        kind: 'invoice',
        delivered: false,
        createdAt: new Date().toISOString(),
      });
      return { success: true, simulated: true };
    },
  },
  {
    method: 'POST',
    match: /^\/invoices\/bulk-confirm$/,
    handler: async (req) => {
      const { ids, billingRunId } = req.body || {};
      let count = 0;
      invoices.forEach((inv) => {
        if (inv.status === 'draft') {
          if ((ids && ids.includes(inv.id)) || billingRunId) {
            inv.status = 'confirmed';
            inv.confirmedAt = new Date().toISOString();
            count++;
          }
        }
      });
      return { success: true, message: `Confirmed ${count} draft invoices` };
    },
  },
  {
    method: 'POST',
    match: /^\/invoices\/(\d+)\/payments$/,
    handler: async (req) => {
      const id = parseInt(req.match[1], 10);
      const inv = invoices.find((i) => i.id === id);
      if (!inv) return { status: 404, data: { error: { message: 'Invoice not found' } } };

      const { method, amount, paid_on, reference, note } = req.body || {};
      const numAmount = parseFloat(amount);
      const outstanding = Number(inv.total) - Number(inv.amountPaid || 0);

      if (numAmount <= 0 || numAmount > outstanding) {
        return { status: 422, data: { error: { message: 'Invalid payment amount', details: { amount: 'Amount exceeds balance' } } } };
      }

      const pmt = {
        id: payments.length + 1,
        invoiceId: inv.id,
        invoiceNumber: inv.number,
        customerId: inv.customerId,
        customerName: inv.customerName,
        method: method || 'bank_transfer',
        amount: numAmount,
        paidOn: paid_on || getToday(),
        reference: reference || '',
        note: note || '',
        voidedAt: null,
        createdAt: new Date().toISOString(),
      };
      payments.unshift(pmt);
      inv.payments = inv.payments || [];
      inv.payments.unshift(pmt);

      inv.amountPaid = Number(inv.amountPaid || 0) + numAmount;
      if (inv.amountPaid >= inv.total) {
        inv.status = 'paid';
        inv.paidAt = new Date().toISOString();
        inv.isOverdue = false;
        inv.daysOverdue = 0;
      }

      return { success: true, payment: pmt, invoice: inv };
    },
  },

  // 3. PAYMENTS ENDPOINTS
  {
    method: 'GET',
    match: /^\/payments$/,
    handler: async (req) => {
      const method = req.params.get('method');
      const q = req.params.get('q');
      const page = parseInt(req.params.get('page') || '1', 10);
      const pageSize = parseInt(req.params.get('pageSize') || '15', 10);

      let list = [...payments];
      if (method) list = list.filter((p) => p.method === method);
      if (q) {
        const query = q.toLowerCase();
        list = list.filter(
          (p) =>
            p.invoiceNumber?.toLowerCase().includes(query) ||
            p.customerName?.toLowerCase().includes(query) ||
            p.reference?.toLowerCase().includes(query)
        );
      }

      const total = list.length;
      const start = (page - 1) * pageSize;
      return {
        data: list.slice(start, start + pageSize),
        meta: { page, pageSize, total },
      };
    },
  },
  {
    method: 'POST',
    match: /^\/payments\/(\d+)\/void$/,
    handler: async (req) => {
      const id = parseInt(req.match[1], 10);
      const pmt = payments.find((p) => p.id === id);
      if (!pmt) return { status: 404, data: { error: { message: 'Payment not found' } } };

      pmt.voidedAt = new Date().toISOString();
      const inv = invoices.find((i) => i.id === pmt.invoiceId);
      if (inv) {
        inv.amountPaid = Math.max(0, Number(inv.amountPaid) - Number(pmt.amount));
        if (inv.status === 'paid' && inv.amountPaid < inv.total) {
          inv.status = 'confirmed';
        }
      }
      return { success: true, payment: pmt };
    },
  },

  // 4. DASHBOARD ENDPOINTS
  {
    method: 'GET',
    match: /^\/dashboard\/summary$/,
    handler: async () => {
      const today = getToday();
      const activeSubs = 42;
      const pausedSubs = 3;
      const mrr = 184500.0;
      const collected = 165200.0;
      const invoiced = 210000.0;

      let outstandingAmt = 0;
      let outstandingCount = 0;
      let overdueAmt = 0;
      let overdueCount = 0;

      invoices.forEach((inv) => {
        if (inv.status === 'confirmed') {
          const out = Number(inv.total) - Number(inv.amountPaid || 0);
          if (out > 0) {
            outstandingAmt += out;
            outstandingCount++;
            if (inv.dueDate < today) {
              overdueAmt += out;
              overdueCount++;
            }
          }
        }
      });

      const collectionRate = invoiced > 0 ? Math.round((collected / invoiced) * 100) : 0;

      return {
        activeSubscriptions: activeSubs,
        pausedSubscriptions: pausedSubs,
        mrr,
        revenueCollected: collected,
        invoiced,
        outstanding: { count: outstandingCount, amount: outstandingAmt },
        overdue: { count: overdueCount, amount: overdueAmt, avgDays: 28 },
        collectionRate,
        asOf: today,
      };
    },
  },
  {
    method: 'GET',
    match: /^\/dashboard\/revenue-by-month$/,
    handler: async () => {
      return [
        { month: '2026-05', invoiced: 110000, collected: 95000 },
        { month: '2026-06', invoiced: 125000, collected: 118000 },
        { month: '2026-07', invoiced: 140000, collected: 135000 },
        { month: '2026-08', invoiced: 155000, collected: 148000 },
        { month: '2026-09', invoiced: 180000, collected: 162000 },
        { month: '2026-10', invoiced: 210000, collected: 165200 },
      ];
    },
  },
  {
    method: 'GET',
    match: /^\/dashboard\/revenue-by-plan$/,
    handler: async () => {
      return [
        { plan: 'Monthly Pro', revenue: 98000 },
        { plan: 'Yearly Business', revenue: 54000 },
        { plan: 'Monthly Basic', revenue: 32000 },
        { plan: 'Weekly Starter', revenue: 16000 },
      ];
    },
  },
  {
    method: 'GET',
    match: /^\/dashboard\/payment-methods$/,
    handler: async () => {
      return [
        { method: 'Bank Transfer', amount: 85000 },
        { method: 'UPI / QR', amount: 48000 },
        { method: 'Card (Online)', amount: 26200 },
        { method: 'Cheque', amount: 6000 },
      ];
    },
  },
  {
    method: 'GET',
    match: /^\/dashboard\/invoice-status$/,
    handler: async () => {
      return [
        { status: 'Paid', amount: 165200 },
        { status: 'Confirmed', amount: 28932.42 },
        { status: 'Overdue', amount: 23600 },
        { status: 'Draft', amount: 37170 },
      ];
    },
  },
  {
    method: 'GET',
    match: /^\/dashboard\/overdue$/,
    handler: async () => {
      const overdue = invoices.filter((i) => i.isOverdue);
      return {
        data: overdue.map((o) => ({
          id: o.id,
          number: o.number,
          customerName: o.customerName,
          dueDate: o.dueDate,
          daysOverdue: o.daysOverdue,
          outstanding: Number(o.total) - Number(o.amountPaid || 0),
        })),
      };
    },
  },
  {
    method: 'GET',
    match: /^\/dashboard\/recent-payments$/,
    handler: async () => {
      return {
        data: payments.slice(0, 5),
      };
    },
  },
  {
    method: 'GET',
    match: /^\/dashboard\/mrr-waterfall$/,
    handler: async () => {
      return [
        { month: '2026-06', opening: 130000, newMrr: 18000, expansion: 5000, contraction: 2000, churn: 4000 },
        { month: '2026-07', opening: 147000, newMrr: 22000, expansion: 6000, contraction: 1500, churn: 3500 },
        { month: '2026-08', opening: 170000, newMrr: 19000, expansion: 4000, contraction: 1000, churn: 2000 },
        { month: '2026-09', opening: 190000, newMrr: 25000, expansion: 8000, contraction: 3000, churn: 5000 },
        { month: '2026-10', opening: 215000, newMrr: 30000, expansion: 7000, contraction: 2000, churn: 4500 },
      ];
    },
  },

  // 5. BILLING TIME MACHINE PREVIEW & RUNS
  {
    method: 'POST',
    match: /^\/billing\/preview$/,
    handler: async (req) => {
      const { asOfDate } = req.body || {};
      const sample = [
        {
          id: 101,
          customerName: 'Acme Corporation',
          subscriptionNumber: 'SUB-000001',
          periodStart: asOfDate || '2026-11-01',
          periodEnd: '2026-11-30',
          subtotal: 16299.0,
          discountTotal: 1280.0,
          taxTotal: 2703.42,
          total: 17722.42,
          lines: [
            {
              description: 'Brightloop ERP (Brand: Odoo) × 5 seats',
              quantity: 5,
              unitPrice: 2560.0,
              lineSubtotal: 12800.0,
              discountAmount: 1280.0,
              taxRate: 18.0,
              taxAmount: 2073.6,
              lineTotal: 13593.6,
              calcTrail: [
                { step: 'base', label: 'Brightloop ERP × 5', detail: '₹2,000.00 each', amount: 10000.0 },
                { step: 'variant', label: 'Brand: Odoo (+560)', detail: '+₹560.00 per unit', amount: 2800.0 },
                { step: 'discount', label: 'Volume 10% (Discount #1)', detail: '10% on ₹12,800.00', amount: -1280.0 },
                { step: 'tax', label: 'GST 18%', detail: '18% on post-discount amount', amount: 2073.6 },
                { step: 'total', label: 'Line total', amount: 13593.6 },
              ],
            },
          ],
        },
        {
          id: 102,
          customerName: 'Globex Inc',
          subscriptionNumber: 'SUB-000002',
          periodStart: asOfDate || '2026-11-01',
          periodEnd: '2026-11-30',
          subtotal: 20000.0,
          discountTotal: 0.0,
          taxTotal: 3600.0,
          total: 23600.0,
          lines: [
            {
              description: 'Brightloop ERP Standard × 10 seats',
              quantity: 10,
              unitPrice: 2000.0,
              lineSubtotal: 20000.0,
              discountAmount: 0.0,
              taxRate: 18.0,
              taxAmount: 3600.0,
              lineTotal: 23600.0,
              calcTrail: [
                { step: 'base', label: 'Brightloop ERP × 10', detail: '₹2,000.00 each', amount: 20000.0 },
                { step: 'tax', label: 'GST 18%', detail: '18% on ₹20,000.00', amount: 3600.0 },
                { step: 'total', label: 'Line total', amount: 23600.0 },
              ],
            },
          ],
        },
      ];

      return {
        asOfDate: asOfDate || getToday(),
        invoicesToCreate: 14,
        net: 148500.0,
        tax: 26730.0,
        total: 175230.0,
        byPlan: [
          { plan: 'Monthly Pro', count: 8, total: 112000 },
          { plan: 'Monthly Basic', count: 4, total: 38400 },
          { plan: 'Yearly Business', count: 2, total: 24830 },
        ],
        byDate: [
          { date: '2026-11-01', count: 6, total: 84000 },
          { date: '2026-11-05', count: 4, total: 52000 },
          { date: '2026-11-15', count: 4, total: 39230 },
        ],
        projectedOverdue: { count: 3, amount: 48500.0 },
        projectedMrr: 192000.0,
        sample,
      };
    },
  },
  {
    method: 'POST',
    match: /^\/billing\/run$/,
    handler: async () => {
      // Idempotency check: if run for same date, return 0 created!
      const today = getToday();
      const existingTodayRun = billingRuns.find((r) => r.asOfDate === today && !r.dryRun);
      if (existingTodayRun) {
        return {
          run: {
            id: billingRuns.length + 1,
            asOfDate: today,
            dryRun: false,
            status: 'completed',
            scanned: 25,
            invoicesCreated: 0, // Idempotent 0 duplicates!
            totalAmount: 0.0,
            errors: [],
            startedBy: 'Admin User',
            createdAt: new Date().toISOString(),
          },
          created: [],
          message: 'Nothing skipped, nothing duplicated (0 created)',
        };
      }

      const run = {
        id: billingRuns.length + 1,
        asOfDate: today,
        dryRun: false,
        status: 'completed',
        scanned: 25,
        invoicesCreated: 3,
        totalAmount: 48200.0,
        errors: [],
        startedBy: 'Admin User',
        createdAt: new Date().toISOString(),
      };
      billingRuns.unshift(run);
      return { run, created: invoices.slice(0, 3) };
    },
  },
  {
    method: 'GET',
    match: /^\/billing\/runs$/,
    handler: async () => {
      return billingRuns;
    },
  },

  // 6. COLLECTIONS ENDPOINTS
  {
    method: 'GET',
    match: /^\/collections\/queue$/,
    handler: async () => {
      return {
        stats: {
          overdueAmount: 48500.0,
          remindersSentThisWeek: 14,
          recoveredThisMonth: 82000.0,
          highRiskCustomersCount: 2,
        },
        items: [
          {
            id: 1,
            reminderId: 101,
            customerId: 2,
            customerName: 'Globex Inc',
            customerEmail: 'billing@globex.test',
            customerPhone: '+91 91234 56789',
            invoices: [
              {
                id: 2,
                number: 'INV-000002',
                dueDate: '2026-09-15',
                total: 23600.0,
                outstanding: 23600.0,
                daysOverdue: 46,
              },
            ],
            totalOutstanding: 23600.0,
            maxDaysOverdue: 46,
            reminderStep: 'Step #3 (Final Notice)',
            nextReminderDate: getToday(),
            risk: {
              level: 'High',
              score: 75,
              reasons: [
                'Invoice overdue > 14 days (+40 pts)',
                'Active subscription expires in 12 days (+20 pts)',
                'Previous pause history recorded (+15 pts)',
              ],
              suggestedAction: 'Direct executive call; offer renewal discount or pause plan.',
            },
          },
          {
            id: 2,
            reminderId: 102,
            customerId: 3,
            customerName: 'Soylent Industries',
            customerEmail: 'finance@soylent.test',
            customerPhone: '+91 99887 76655',
            invoices: [
              {
                id: 3,
                number: 'INV-000003',
                dueDate: '2026-10-15',
                total: 11210.0,
                outstanding: 6210.0,
                daysOverdue: 16,
              },
            ],
            totalOutstanding: 6210.0,
            maxDaysOverdue: 16,
            reminderStep: 'Step #2 (Friendly Reminder)',
            nextReminderDate: getToday(),
            risk: {
              level: 'Medium',
              score: 45,
              reasons: ['Invoice overdue 1–14 days (+25 pts)', 'Partial payment shortfall (+20 pts)'],
              suggestedAction: 'Send friendly reminder with payment portal link.',
            },
          },
        ],
      };
    },
  },
  {
    method: 'GET',
    match: /^\/collections\/risk$/,
    handler: async (req) => {
      const level = req.params.get('level');
      const all = [
        {
          customerId: 2,
          customerName: 'Globex Inc',
          customerEmail: 'billing@globex.test',
          activeSubscriptions: 2,
          overdueInvoicesCount: 1,
          overdueAmount: 23600.0,
          risk: {
            level: 'High',
            score: 75,
            reasons: ['Overdue > 14 days (46d)', 'Expiry within 30 days', 'Past pause history'],
            suggestedAction: 'Phone contact with CFO; offer contract renewal.',
          },
        },
        {
          customerId: 3,
          customerName: 'Soylent Industries',
          customerEmail: 'finance@soylent.test',
          activeSubscriptions: 1,
          overdueInvoicesCount: 1,
          overdueAmount: 6210.0,
          risk: {
            level: 'Medium',
            score: 45,
            reasons: ['Overdue shortfall', 'Invoice delay 16d'],
            suggestedAction: 'Follow up on second installment promise.',
          },
        },
        {
          customerId: 1,
          customerName: 'Acme Corporation',
          customerEmail: 'customer@brightloop.test',
          activeSubscriptions: 3,
          overdueInvoicesCount: 0,
          overdueAmount: 0.0,
          risk: {
            level: 'Low',
            score: 10,
            reasons: ['Healthy payment track record'],
            suggestedAction: 'Regular relationship check-in.',
          },
        },
      ];
      if (level && level !== 'all') {
        return all.filter((r) => r.risk.level.toLowerCase() === level.toLowerCase());
      }
      return all;
    },
  },
  {
    method: 'POST',
    match: /^\/collections\/reminders\/(\d+)\/send$/,
    handler: async () => {
      return { success: true, simulated: true };
    },
  },
  {
    method: 'POST',
    match: /^\/collections\/reminders\/send-bulk$/,
    handler: async (req) => {
      const ids = req.body?.reminderIds || [];
      return { success: true, sentCount: ids.length, status: 'simulated' };
    },
  },
  {
    method: 'GET',
    match: /^\/collections\/invoices\/(\d+)\/history$/,
    handler: async (req) => {
      const id = parseInt(req.match[1], 10);
      const inv = invoices.find((i) => i.id === id);
      return inv?.reminders || [];
    },
  },

  // 7. INSIGHTS ENDPOINTS
  {
    method: 'GET',
    match: /^\/insights\/questions$/,
    handler: async () => {
      return [
        { id: 'active_subscriptions', question: 'How many active subscriptions do we have?' },
        { id: 'overdue_invoices', question: 'Which invoices are overdue?' },
        { id: 'outstanding_amount', question: 'How much money is outstanding?' },
        { id: 'top_plans_revenue', question: 'Which plans generate the most revenue?' },
        { id: 'upcoming_renewals', question: 'What renewals are coming up?' },
        { id: 'repeat_overdue_customers', question: 'Which customers repeatedly pay late?' },
      ];
    },
  },
  {
    method: 'POST',
    match: /^\/insights\/ask$/,
    handler: async (req) => {
      let { questionId, text } = req.body || {};

      if (!questionId && text) {
        const t = text.toLowerCase();
        if (t.includes('active') || t.includes('subscription')) questionId = 'active_subscriptions';
        else if (t.includes('overdue')) questionId = 'overdue_invoices';
        else if (t.includes('outstanding')) questionId = 'outstanding_amount';
        else if (t.includes('plan') || t.includes('revenue')) questionId = 'top_plans_revenue';
        else if (t.includes('renewal')) questionId = 'upcoming_renewals';
        else if (t.includes('repeat') || t.includes('late')) questionId = 'repeat_overdue_customers';
        else {
          return {
            status: 422,
            data: {
              error: {
                message:
                  'Query not understood. Supported questions: active subscriptions, overdue invoices, outstanding amount, top plans, upcoming renewals, repeat overdue.',
              },
            },
          };
        }
      }

      const today = getToday();

      switch (questionId) {
        case 'active_subscriptions':
          return {
            questionId: 'active_subscriptions',
            title: 'Active Subscriptions Portfolio Overview',
            answerText:
              'There are currently 42 active subscriptions generating a normalized monthly recurring revenue (MRR) of ₹1,84,500. 3 subscriptions are currently paused and will resume billing once reactivated.',
            metrics: [
              { label: 'Active Subscriptions', value: 42, isMoney: false, change: '+4 this month' },
              { label: 'Paused Subscriptions', value: 3, isMoney: false },
              { label: 'Total Portfolio MRR', value: 184500, isMoney: true, change: '+12.4% vs last month' },
            ],
            columns: [
              { key: 'plan', label: 'Subscription Plan', type: 'text' },
              { key: 'count', label: 'Active Count', type: 'number' },
              { key: 'paused', label: 'Paused', type: 'number' },
              { key: 'mrr', label: 'Net MRR (₹)', type: 'money' },
            ],
            rows: [
              { plan: 'Monthly Pro', count: 24, paused: 1, mrr: 83976 },
              { plan: 'Yearly Business', count: 10, paused: 1, mrr: 29158 },
              { plan: 'Monthly Basic', count: 6, paused: 1, mrr: 11994 },
              { plan: 'Weekly Starter', count: 2, paused: 0, mrr: 4324 },
            ],
            asOfDate: today,
            filtersUsed: "status='active'",
            links: [
              { label: 'View All Subscriptions', href: '/subscriptions' },
              { label: 'Finance Dashboard', href: '/dashboard' },
            ],
          };

        case 'overdue_invoices':
          return {
            questionId: 'overdue_invoices',
            title: 'Overdue Invoices Requiring Collections Action',
            answerText:
              'There is 1 overdue invoice totaling ₹23,600.00 across confirmed accounts. The oldest delay stands at 46 days past due.',
            metrics: [
              { label: 'Overdue Invoices', value: 1, isMoney: false },
              { label: 'Overdue Amount', value: 23600, isMoney: true },
              { label: 'Max Days Overdue', value: '46 days', isMoney: false },
            ],
            columns: [
              { key: 'number', label: 'Invoice #', type: 'text' },
              { key: 'customer', label: 'Customer', type: 'text' },
              { key: 'dueDate', label: 'Due Date', type: 'date' },
              { key: 'days', label: 'Days Overdue', type: 'number' },
              { key: 'outstanding', label: 'Outstanding (₹)', type: 'money' },
            ],
            rows: [
              { number: 'INV-000002', customer: 'Globex Inc', dueDate: '2026-09-15', days: 46, outstanding: 23600 },
            ],
            asOfDate: today,
            filtersUsed: "status='confirmed' AND due_date < today AND amount_paid < total",
            links: [
              { label: 'Open Collections Cockpit', href: '/collections' },
              { label: 'View Invoices List', href: '/invoices?status=overdue' },
            ],
          };

        case 'outstanding_amount':
          return {
            questionId: 'outstanding_amount',
            title: 'Top Outstanding Accounts & Receivables',
            answerText:
              'Total uncollected receivables across all confirmed invoices stand at ₹47,532.42 across 3 accounts.',
            metrics: [
              { label: 'Total Outstanding', value: 47532.42, isMoney: true },
              { label: 'Accounts Affected', value: 3, isMoney: false },
            ],
            columns: [
              { key: 'customer', label: 'Customer Name', type: 'text' },
              { key: 'invoices', label: 'Open Invoices', type: 'number' },
              { key: 'amount', label: 'Outstanding Balance (₹)', type: 'money' },
            ],
            rows: [
              { customer: 'Globex Inc', invoices: 1, amount: 23600.0 },
              { customer: 'Acme Corporation', invoices: 1, amount: 17722.42 },
              { customer: 'Soylent Industries', invoices: 1, amount: 6210.0 },
            ],
            asOfDate: today,
            filtersUsed: "status='confirmed' AND amount_paid < total",
            links: [{ label: 'View Unpaid Invoices', href: '/invoices?status=confirmed' }],
          };

        default:
          return {
            questionId: questionId || 'top_plans_revenue',
            title: 'Subscription Revenue by Plan (Last 90 Days)',
            answerText:
              'Monthly Pro continues to be the dominant tier, generating ₹98,000 across 24 subscriptions.',
            metrics: [{ label: 'Top Tier Revenue', value: 98000, isMoney: true }],
            columns: [
              { key: 'plan', label: 'Plan', type: 'text' },
              { key: 'collected', label: 'Collected Revenue', type: 'money' },
            ],
            rows: [
              { plan: 'Monthly Pro', collected: 98000 },
              { plan: 'Yearly Business', collected: 54000 },
              { plan: 'Monthly Basic', collected: 32000 },
            ],
            asOfDate: today,
            filtersUsed: 'paid_on >= today - 90d',
            links: [{ label: 'Dashboard', href: '/dashboard' }],
          };
      }
    },
  },

  // 8. RECONCILE ENDPOINTS
  {
    method: 'POST',
    match: /^\/reconcile\/upload$/,
    handler: async () => {
      return {
        batch: {
          id: 1,
          fileName: 'bank_statement.csv',
          status: 'review',
          totalLines: 5,
          matchedLines: 4,
          totalAmount: 77032.8,
        },
      };
    },
  },
  {
    method: 'GET',
    match: /^\/reconcile\/batches\/(\d+)$/,
    handler: async () => {
      return {
        batch: {
          id: 1,
          fileName: 'bank_statement.csv',
          status: 'review',
          totalLines: 5,
          matchedLines: 4,
          totalAmount: 77032.8,
        },
        lines: [
          {
            id: 101,
            txnDate: '2026-10-28',
            description: 'NEFT-AXIS-BRIGHTLOOP-INV-000001 ACME CORP',
            amount: 17722.42,
            suggestedInvoiceId: 1,
            suggestedInvoiceNumber: 'INV-000001',
            customerName: 'Acme Corporation',
            outstanding: 17722.42,
            confidence: 'high',
            reason: 'Invoice # INV-000001 in narrative & exact amount match',
            status: 'suggested',
          },
          {
            id: 102,
            txnDate: '2026-10-29',
            description: 'INFT GLOBEX CORP SOFTWARE SUBSCRIPTION',
            amount: 23600.0,
            suggestedInvoiceId: 2,
            suggestedInvoiceNumber: 'INV-000002',
            customerName: 'Globex Inc',
            outstanding: 23600.0,
            confidence: 'medium',
            reason: 'Customer name match in narrative and unique outstanding balance candidate',
            status: 'suggested',
          },
          {
            id: 103,
            txnDate: '2026-10-30',
            description: 'UPI/382910482910/REMITTANCE SOYLENT',
            amount: 6210.0,
            suggestedInvoiceId: 3,
            suggestedInvoiceNumber: 'INV-000003',
            customerName: 'Soylent Industries',
            outstanding: 6210.0,
            confidence: 'medium',
            reason: 'Customer token match and unique partial amount candidate',
            status: 'suggested',
          },
          {
            id: 104,
            txnDate: '2026-10-31',
            description: 'TRANSFER FROM UNKNOWN ENTITY 884729',
            amount: 12000.0,
            suggestedInvoiceId: null,
            confidence: 'low',
            reason: 'No customer tokens or invoice number detected in narrative',
            status: 'unmatched',
          },
        ],
      };
    },
  },
  {
    method: 'POST',
    match: /^\/reconcile\/batches\/(\d+)\/confirm$/,
    handler: async (req) => {
      const lineIds = req.body?.lineIds || [];
      // Mark matching invoices as Paid
      const createdPayments = [];
      lineIds.forEach((lId) => {
        if (lId === 101) {
          const inv = invoices.find((i) => i.id === 1);
          if (inv) {
            inv.amountPaid = inv.total;
            inv.status = 'paid';
            createdPayments.push({ id: 991, invoiceId: 1, amount: 17722.42 });
          }
        }
        if (lId === 102) {
          const inv = invoices.find((i) => i.id === 2);
          if (inv) {
            inv.amountPaid = inv.total;
            inv.status = 'paid';
            inv.isOverdue = false;
            createdPayments.push({ id: 992, invoiceId: 2, amount: 23600.0 });
          }
        }
        if (lId === 103) {
          const inv = invoices.find((i) => i.id === 3);
          if (inv) {
            inv.amountPaid = inv.total;
            inv.status = 'paid';
            createdPayments.push({ id: 993, invoiceId: 3, amount: 6210.0 });
          }
        }
      });
      return { success: true, paymentsCreated: createdPayments };
    },
  },

  // 9. DEV MAILBOX ENDPOINTS
  {
    method: 'GET',
    match: /^\/dev\/emails$/,
    handler: async () => {
      return emailLogs;
    },
  },

  // 10. CUSTOMER PORTAL INVOICES
  {
    method: 'GET',
    match: /^\/portal\/invoices$/,
    handler: async () => {
      // Customer sees own invoices (customerId: 1)
      const own = invoices.filter((i) => i.customerId === 1);
      return { data: own, meta: { page: 1, pageSize: 20, total: own.length } };
    },
  },
  {
    method: 'GET',
    match: /^\/portal\/invoices\/(\d+)$/,
    handler: async (req) => {
      const id = parseInt(req.match[1], 10);
      const inv = invoices.find((i) => i.id === id);
      if (!inv) return { status: 404, data: { error: { message: 'Invoice not found' } } };
      return inv;
    },
  },
  {
    method: 'POST',
    match: /^\/portal\/invoices\/(\d+)\/pay$/,
    handler: async (req) => {
      const id = parseInt(req.match[1], 10);
      const inv = invoices.find((i) => i.id === id);
      if (!inv) return { status: 404, data: { error: { message: 'Invoice not found' } } };

      const remaining = Number(inv.total) - Number(inv.amountPaid || 0);
      const pmt = {
        id: payments.length + 1,
        invoiceId: inv.id,
        invoiceNumber: inv.number,
        customerId: inv.customerId,
        customerName: inv.customerName,
        method: 'online_simulated',
        amount: remaining,
        paidOn: getToday(),
        reference: 'PORTAL-SIM-' + Math.floor(Math.random() * 900000 + 100000),
        note: 'Customer self-service online simulated payment',
        voidedAt: null,
        createdAt: new Date().toISOString(),
      };
      payments.unshift(pmt);
      inv.payments = inv.payments || [];
      inv.payments.unshift(pmt);
      inv.amountPaid = inv.total;
      inv.status = 'paid';
      inv.paidAt = new Date().toISOString();
      inv.isOverdue = false;
      inv.daysOverdue = 0;

      return { success: true, payment: pmt, invoice: inv };
    },
  },
];
