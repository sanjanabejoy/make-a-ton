// SubscriptIQ - P3 Stateful Mocks

let virtualDate = null; // null means real today
const getToday = () => virtualDate || '2026-10-31';

// Seeded Users
let users = [
  { id: 1, name: 'Admin User', email: 'admin@brightloop.test', role: 'admin', isActive: true, createdAt: '2026-01-01' },
  { id: 2, name: 'Staff Member', email: 'staff@brightloop.test', role: 'staff', isActive: true, createdAt: '2026-01-05' },
  { id: 3, name: 'Acme Corp Contact', email: 'customer@brightloop.test', role: 'customer', customerId: 1, isActive: true, createdAt: '2026-02-01' },
];

// Seeded Products
let products = [
  {
    id: 1,
    name: 'Brightloop ERP',
    type: 'software',
    salesPrice: 2000.0,
    costPrice: 800.0,
    notes: 'Core ERP enterprise suite',
    isActive: true,
    variants: [
      { id: 101, attribute: 'Brand', value: 'Odoo', extraPrice: 560.0 },
      { id: 102, attribute: 'Brand', value: 'SAP', extraPrice: 900.0 },
      { id: 103, attribute: 'Brand', value: 'Tally', extraPrice: 300.0 },
    ],
  },
  {
    id: 2,
    name: 'Brightloop CRM',
    type: 'software',
    salesPrice: 1200.0,
    costPrice: 400.0,
    notes: 'Customer relationship pipeline tool',
    isActive: true,
    variants: [
      { id: 201, attribute: 'Edition', value: 'Pro', extraPrice: 400.0 },
    ],
  },
  {
    id: 3,
    name: 'Extra Seat',
    type: 'addon',
    salesPrice: 300.0,
    costPrice: 50.0,
    notes: 'Per-seat user expansion',
    isActive: true,
    variants: [],
  },
  {
    id: 4,
    name: 'Analytics Add-on',
    type: 'addon',
    salesPrice: 750.0,
    costPrice: 150.0,
    notes: 'Custom dashboards and metric drill-down',
    isActive: true,
    variants: [],
  },
  {
    id: 5,
    name: 'Onboarding Service',
    type: 'service',
    salesPrice: 5000.0,
    costPrice: 2000.0,
    notes: 'Dedicated technical setup & training',
    isActive: true,
    variants: [],
  },
  {
    id: 6,
    name: 'Priority Support',
    type: 'service',
    salesPrice: 1500.0,
    costPrice: 500.0,
    notes: '24/7 SLA with 1-hour ticket response',
    isActive: true,
    variants: [],
  },
];

// Seeded Plans
let plans = [
  {
    id: 1,
    name: 'Daily Trial',
    price: 0.0,
    billingPeriod: 'daily',
    minQuantity: 1,
    validFrom: null,
    validTo: null,
    autoClose: true,
    closable: true,
    pausable: false,
    renewable: false,
    isActive: true,
  },
  {
    id: 2,
    name: 'Weekly Starter',
    price: 499.0,
    billingPeriod: 'weekly',
    minQuantity: 1,
    validFrom: null,
    validTo: null,
    autoClose: false,
    closable: true,
    pausable: false,
    renewable: true,
    isActive: true,
  },
  {
    id: 3,
    name: 'Monthly Basic',
    price: 1999.0,
    billingPeriod: 'monthly',
    minQuantity: 1,
    validFrom: null,
    validTo: null,
    autoClose: false,
    closable: true,
    pausable: true,
    renewable: true,
    isActive: true,
  },
  {
    id: 4,
    name: 'Monthly Pro',
    price: 3499.0,
    billingPeriod: 'monthly',
    minQuantity: 1,
    validFrom: null,
    validTo: null,
    autoClose: false,
    closable: true,
    pausable: true,
    renewable: true,
    isActive: true,
  },
  {
    id: 5,
    name: 'Yearly Business',
    price: 34990.0,
    billingPeriod: 'yearly',
    minQuantity: 1,
    validFrom: null,
    validTo: null,
    autoClose: false,
    closable: true,
    pausable: true,
    renewable: true,
    isActive: true,
  },
  {
    id: 6,
    name: 'Yearly Enterprise',
    price: 79990.0,
    billingPeriod: 'yearly',
    minQuantity: 10,
    validFrom: null,
    validTo: null,
    autoClose: true,
    closable: false,
    pausable: false,
    renewable: true,
    isActive: true,
  },
  {
    id: 7,
    name: 'Legacy Plan',
    price: 1500.0,
    billingPeriod: 'monthly',
    minQuantity: 1,
    validFrom: '2024-01-01',
    validTo: '2025-12-31',
    autoClose: false,
    closable: false,
    pausable: false,
    renewable: false,
    isActive: false,
  },
];

// Seeded Taxes
let taxes = [
  { id: 1, name: 'GST 18%', rate: 18.0, appliesTo: 'all', productType: null, productId: null, isActive: true },
  { id: 2, name: 'GST 12% Services', rate: 12.0, appliesTo: 'product_type', productType: 'service', productId: null, isActive: true },
  { id: 3, name: 'GST 5% Extra Seat', rate: 5.0, appliesTo: 'product', productType: null, productId: 3, isActive: true },
];

// Seeded Discounts
let discounts = [
  {
    id: 1,
    name: 'Volume 10%',
    type: 'percent',
    value: 10.0,
    minPurchase: 0.0,
    minQuantity: 5,
    startDate: null,
    endDate: null,
    usageLimit: null,
    usedCount: 14,
    appliesTo: 'product',
    productId: 1,
    isActive: true,
  },
  {
    id: 2,
    name: 'Loyalty ₹500',
    type: 'fixed',
    value: 500.0,
    minPurchase: 5000.0,
    minQuantity: 0,
    startDate: null,
    endDate: null,
    usageLimit: null,
    usedCount: 42,
    appliesTo: 'subscription',
    productId: null,
    isActive: true,
  },
  {
    id: 3,
    name: 'Yearly 15%',
    type: 'percent',
    value: 15.0,
    minPurchase: 0.0,
    minQuantity: 0,
    startDate: null,
    endDate: null,
    usageLimit: 20,
    usedCount: 18,
    appliesTo: 'subscription',
    productId: null,
    isActive: true,
  },
  {
    id: 4,
    name: 'Expired Spring 20%',
    type: 'percent',
    value: 20.0,
    minPurchase: 0.0,
    minQuantity: 0,
    startDate: '2026-03-01',
    endDate: '2026-05-31',
    usageLimit: 50,
    usedCount: 30,
    appliesTo: 'subscription',
    productId: null,
    isActive: false,
  },
];

// Payment Terms
let paymentTerms = [
  { id: 1, name: 'Immediate', days: 0 },
  { id: 2, name: 'Net 15', days: 15 },
  { id: 3, name: 'Net 30', days: 30 },
];

// Quote Templates
let quoteTemplates = [
  {
    id: 1,
    name: 'SMB Starter',
    planId: 3,
    validityDays: 15,
    paymentTermId: 2,
    termMonths: 12,
    notes: 'Standard bundle for emerging businesses',
    isActive: true,
    lines: [
      { id: 1, productId: 1, variantId: 101, quantity: 2 },
      { id: 2, productId: 3, variantId: null, quantity: 5 },
    ],
  },
  {
    id: 2,
    name: 'Growth Pack',
    planId: 4,
    validityDays: 30,
    paymentTermId: 3,
    termMonths: 12,
    notes: 'Mid-market scaling pack with CRM and priority support',
    isActive: true,
    lines: [
      { id: 3, productId: 1, variantId: 102, quantity: 5 },
      { id: 4, productId: 2, variantId: 201, quantity: 5 },
      { id: 5, productId: 6, variantId: null, quantity: 1 },
    ],
  },
  {
    id: 3,
    name: 'Enterprise Annual',
    planId: 6,
    validityDays: 30,
    paymentTermId: 3,
    termMonths: 12,
    notes: 'Enterprise scale deployment with onboarding and dedicated SLA',
    isActive: true,
    lines: [
      { id: 6, productId: 1, variantId: 101, quantity: 15 },
      { id: 7, productId: 4, variantId: null, quantity: 1 },
      { id: 8, productId: 5, variantId: null, quantity: 1 },
    ],
  },
];

// Seeded Customers
let customers = [
  {
    id: 1,
    name: 'Acme Technologies Pvt Ltd',
    email: 'customer@brightloop.test',
    phone: '+91 98765 43210',
    company: 'Acme Group',
    billingAddress: '402, Cyber Heights, HITEC City, Hyderabad 500081',
    hasLogin: true,
    legacyId: 'CUST-001',
    createdAt: '2026-01-15',
  },
  {
    id: 2,
    name: 'Nexa Global Solutions',
    email: 'billing@nexaglobal.com',
    phone: '+91 91234 56789',
    company: 'Nexa Corp',
    billingAddress: '12th Floor, World Trade Centre, Bangalore 560055',
    hasLogin: false,
    legacyId: 'CUST-002',
    createdAt: '2026-02-10',
  },
  {
    id: 3,
    name: 'Zenith Logistics Ltd',
    email: 'accounts@zenithlogistics.in',
    phone: '+91 99887 76655',
    company: 'Zenith Group',
    billingAddress: 'B-88, Nariman Point, Mumbai 400021',
    hasLogin: false,
    legacyId: 'CUST-003',
    createdAt: '2026-03-01',
  },
  {
    id: 4,
    name: 'Pinnacle Retail Inc',
    email: 'finance@pinnacleretail.com',
    phone: '+91 97711 22334',
    company: 'Pinnacle',
    billingAddress: '88 Commercial Street, Chennai 600001',
    hasLogin: false,
    legacyId: null,
    createdAt: '2026-04-12',
  },
];

// Seeded Subscriptions
let subscriptions = [
  {
    id: 1,
    number: 'SUB-000001',
    customerId: 1,
    customerName: 'Acme Technologies Pvt Ltd',
    customerEmail: 'customer@brightloop.test',
    planId: 4,
    planName: 'Monthly Pro',
    status: 'active',
    startDate: '2026-01-01',
    expiryDate: '2027-01-01',
    nextBillingDate: '2026-11-01',
    billingAnchorDay: 1,
    pausedAt: null,
    paymentTermId: 2,
    quoteValidUntil: '2026-01-15',
    notes: 'Premium enterprise subscription',
    recurringAmount: 11215.0,
    lines: [
      { id: 1, productId: 1, variantId: 101, quantity: 3, unitPrice: 2560.0, amount: 7680.0, taxRate: 18.0 },
      { id: 2, productId: 4, variantId: null, quantity: 1, unitPrice: 750.0, amount: 750.0, taxRate: 18.0 },
    ],
  },
  {
    id: 2,
    number: 'SUB-000002',
    customerId: 1,
    customerName: 'Acme Technologies Pvt Ltd',
    customerEmail: 'customer@brightloop.test',
    planId: 2,
    planName: 'Weekly Starter',
    status: 'quotation',
    startDate: '2026-10-25',
    expiryDate: '2027-10-25',
    nextBillingDate: '2026-10-25',
    billingAnchorDay: 25,
    pausedAt: null,
    paymentTermId: 1,
    quoteValidUntil: '2026-11-10',
    notes: 'Draft proposal under review',
    recurringAmount: 2499.0,
    lines: [
      { id: 3, productId: 2, variantId: 201, quantity: 1, unitPrice: 1600.0, amount: 1600.0, taxRate: 18.0 },
    ],
  },
  {
    id: 3,
    number: 'SUB-000003',
    customerId: 1,
    customerName: 'Acme Technologies Pvt Ltd',
    customerEmail: 'customer@brightloop.test',
    planId: 3,
    planName: 'Monthly Basic',
    status: 'closed',
    startDate: '2025-01-01',
    expiryDate: '2026-01-01',
    nextBillingDate: null,
    billingAnchorDay: 1,
    pausedAt: null,
    paymentTermId: 2,
    closeReason: 'expired',
    notes: 'Previous year plan replaced with Monthly Pro',
    recurringAmount: 1999.0,
    lines: [
      { id: 4, productId: 3, variantId: null, quantity: 2, unitPrice: 300.0, amount: 600.0, taxRate: 5.0 },
    ],
  },
  {
    id: 4,
    number: 'SUB-000004',
    customerId: 2,
    customerName: 'Nexa Global Solutions',
    customerEmail: 'billing@nexaglobal.com',
    planId: 5,
    planName: 'Yearly Business',
    status: 'active',
    startDate: '2026-02-01',
    expiryDate: '2027-02-01',
    nextBillingDate: '2027-02-01',
    billingAnchorDay: 1,
    pausedAt: '2026-09-15',
    paymentTermId: 3,
    notes: 'Temporarily paused due to company restructuring',
    recurringAmount: 48900.0,
    lines: [
      { id: 5, productId: 1, variantId: 102, quantity: 4, unitPrice: 2900.0, amount: 11600.0, taxRate: 18.0 },
    ],
  },
];

// Timeline events
let events = [
  { id: 1, entityType: 'subscription', entityId: 1, subscriptionId: 1, customerId: 1, eventType: 'created', message: 'Subscription draft initialized', occurredAt: '2026-01-01T10:00:00Z', simDate: '2026-01-01' },
  { id: 2, entityType: 'subscription', entityId: 1, subscriptionId: 1, customerId: 1, eventType: 'quotation_sent', message: 'Quotation sent to customer (valid until 2026-01-15)', occurredAt: '2026-01-02T11:30:00Z', simDate: '2026-01-02' },
  { id: 3, entityType: 'subscription', entityId: 1, subscriptionId: 1, customerId: 1, eventType: 'confirmed', message: 'Quotation accepted and confirmed', occurredAt: '2026-01-05T14:15:00Z', simDate: '2026-01-05' },
  { id: 4, entityType: 'subscription', entityId: 1, subscriptionId: 1, customerId: 1, eventType: 'activated', message: 'Subscription activated. Recurring billing scheduled.', occurredAt: '2026-01-05T14:15:10Z', simDate: '2026-01-05' },
  { id: 5, entityType: 'invoice', entityId: 101, subscriptionId: 1, customerId: 1, eventType: 'invoice_generated', message: 'Recurring Invoice INV-000101 created for period Jan 2026', occurredAt: '2026-01-05T14:15:12Z', simDate: '2026-01-05' },
  { id: 6, entityType: 'payment', entityId: 201, subscriptionId: 1, customerId: 1, eventType: 'payment_received', message: 'Payment ₹13,233.70 recorded via Bank Transfer', occurredAt: '2026-01-08T09:00:00Z', simDate: '2026-01-08' },
];

// Invoices for P3 detail tabs & portal
let invoices = [
  {
    id: 101,
    number: 'INV-000101',
    subscriptionId: 1,
    customerId: 1,
    status: 'paid',
    invoiceDate: '2026-09-01',
    dueDate: '2026-09-16',
    periodStart: '2026-09-01',
    periodEnd: '2026-09-30',
    subtotal: 10000.0,
    discountTotal: 1280.0,
    taxTotal: 1569.6,
    total: 10289.6,
    amountPaid: 10289.6,
    isOverdue: false,
    currency: 'INR',
    lines: [
      {
        id: 1,
        description: 'Brightloop ERP (Brand: Odoo) x 3',
        quantity: 3,
        unitPrice: 2560.0,
        discountAmount: 768.0,
        taxAmount: 1222.56,
        lineTotal: 8134.56,
      },
      {
        id: 2,
        description: 'Monthly Pro Plan Base Fee',
        quantity: 1,
        unitPrice: 2320.0,
        discountAmount: 512.0,
        taxAmount: 347.04,
        lineTotal: 2155.04,
      },
    ],
  },
  {
    id: 102,
    number: 'INV-000102',
    subscriptionId: 1,
    customerId: 1,
    status: 'confirmed',
    invoiceDate: '2026-10-01',
    dueDate: '2026-10-16',
    periodStart: '2026-10-01',
    periodEnd: '2026-10-31',
    subtotal: 10000.0,
    discountTotal: 1280.0,
    taxTotal: 1569.6,
    total: 10289.6,
    amountPaid: 0.0,
    isOverdue: true,
    daysOverdue: 15,
    currency: 'INR',
    lines: [
      {
        id: 3,
        description: 'Brightloop ERP (Brand: Odoo) x 3',
        quantity: 3,
        unitPrice: 2560.0,
        discountAmount: 768.0,
        taxAmount: 1222.56,
        lineTotal: 8134.56,
      },
      {
        id: 4,
        description: 'Monthly Pro Plan Base Fee',
        quantity: 1,
        unitPrice: 2320.0,
        discountAmount: 512.0,
        taxAmount: 347.04,
        lineTotal: 2155.04,
      },
    ],
  },
];

// App Settings
let appSettings = {
  currency: 'INR',
  reminder_offsets: [-3, 0, 3, 7, 14],
  auto_confirm_invoices: false,
  auto_send_reminders: false,
  company: {
    name: 'Brightloop Software Pvt Ltd',
    address: 'Indiranagar 100ft Road, Bangalore, Karnataka 560038',
    gstin: '29ABCDE1234F1Z5',
  },
};

// Migration jobs
let migrationJobs = [
  {
    id: 1,
    kind: 'customers',
    fileName: 'customers_messy.csv',
    status: 'completed',
    createdAt: '2026-10-20T10:00:00Z',
    finishedAt: '2026-10-20T10:01:30Z',
    summary: { total: 60, imported: 52, duplicates: 5, errors: 3 },
  },
];

// Export route mocks
export default [
  // --- CLOCK ---
  {
    method: 'GET',
    match: /^\/clock$/,
    handler: () => ({
      data: {
        date: getToday(),
        isSimulated: virtualDate !== null,
        realDate: '2026-10-31',
      },
    }),
  },
  {
    method: 'POST',
    match: /^\/clock\/advance$/,
    handler: ({ body }) => {
      if (body?.toDate) {
        virtualDate = body.toDate;
      } else if (body?.days) {
        const d = new Date(getToday());
        d.setDate(d.getDate() + Number(body.days));
        virtualDate = d.toISOString().split('T')[0];
      }
      return { data: { date: getToday(), isSimulated: true } };
    },
  },
  {
    method: 'POST',
    match: /^\/clock\/reset$/,
    handler: () => {
      virtualDate = null;
      return { data: { date: '2026-10-31', isSimulated: false } };
    },
  },

  // --- AUTH ---
  {
    method: 'POST',
    match: /^\/auth\/login$/,
    handler: ({ body }) => {
      const { email, password } = body || {};
      const found = users.find((u) => u.email.toLowerCase() === (email || '').toLowerCase());
      if (!found) {
        return { status: 401, error: { code: 'UNAUTHENTICATED', message: 'Invalid email or password.' } };
      }
      // Demo validation: password must match expected pattern
      if (!password || password.length < 6) {
        return { status: 401, error: { code: 'UNAUTHENTICATED', message: 'Invalid email or password.' } };
      }
      return {
        data: {
          token: `mock-jwt-token-${found.id}-${Date.now()}`,
          user: found,
        },
      };
    },
  },
  {
    method: 'POST',
    match: /^\/auth\/register$/,
    handler: ({ body }) => {
      const { name, email, password } = body || {};
      const exists = users.find((u) => u.email.toLowerCase() === (email || '').toLowerCase());
      if (exists) {
        return { status: 409, error: { code: 'CONFLICT', message: 'Email already registered.' } };
      }
      // Password validation
      const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{9,}$/;
      if (!pwdRegex.test(password || '')) {
        return { status: 422, error: { code: 'VALIDATION_ERROR', message: 'Password does not meet requirements.' } };
      }

      // Check if existing unlinked customer exists
      let cust = customers.find((c) => c.email.toLowerCase() === email.toLowerCase());
      if (!cust) {
        cust = {
          id: customers.length + 1,
          name,
          email,
          phone: '',
          company: '',
          billingAddress: '',
          hasLogin: true,
          createdAt: getToday(),
        };
        customers.push(cust);
      } else {
        cust.hasLogin = true;
      }

      const newUser = {
        id: users.length + 1,
        name,
        email,
        role: 'customer',
        customerId: cust.id,
        isActive: true,
        createdAt: getToday(),
      };
      users.push(newUser);

      return {
        data: {
          token: `mock-jwt-token-${newUser.id}-${Date.now()}`,
          user: newUser,
        },
      };
    },
  },
  {
    method: 'POST',
    match: /^\/auth\/forgot-password$/,
    handler: ({ body }) => {
      return {
        data: {
          message: 'If the email exists, a password reset link has been dispatched.',
          devResetLink: `/reset-password/mock-token-${Date.now()}`,
        },
      };
    },
  },
  {
    method: 'POST',
    match: /^\/auth\/reset-password$/,
    handler: ({ body }) => {
      return { data: { message: 'Password has been successfully reset.' } };
    },
  },

  // --- CATALOG: PRODUCTS ---
  {
    method: 'GET',
    match: /^\/products$/,
    handler: () => ({ data: products }),
  },
  {
    method: 'POST',
    match: /^\/products$/,
    handler: ({ body }) => {
      const newProd = {
        id: products.length + 1,
        name: body.name,
        type: body.type,
        salesPrice: Number(body.salesPrice || 0),
        costPrice: Number(body.costPrice || 0),
        notes: body.notes || '',
        isActive: body.isActive !== false,
        variants: (body.variants || []).map((v, i) => ({
          id: (products.length + 1) * 100 + i + 1,
          attribute: v.attribute,
          value: v.value,
          extraPrice: Number(v.extraPrice || 0),
        })),
      };
      products.push(newProd);
      return { data: newProd };
    },
  },
  {
    method: 'PUT',
    match: /^\/products\/(\d+)$/,
    handler: ({ match, body }) => {
      const id = Number(match[1]);
      const idx = products.findIndex((p) => p.id === id);
      if (idx === -1) return { status: 404, error: { message: 'Product not found' } };
      products[idx] = {
        ...products[idx],
        ...body,
        salesPrice: Number(body.salesPrice ?? products[idx].salesPrice),
        costPrice: Number(body.costPrice ?? products[idx].costPrice),
      };
      return { data: products[idx] };
    },
  },
  {
    method: 'DELETE',
    match: /^\/products\/(\d+)$/,
    handler: ({ match }) => {
      const id = Number(match[1]);
      products = products.filter((p) => p.id !== id);
      return { data: { success: true } };
    },
  },

  // --- CATALOG: PLANS ---
  {
    method: 'GET',
    match: /^\/plans$/,
    handler: () => ({ data: plans }),
  },
  {
    method: 'POST',
    match: /^\/plans$/,
    handler: ({ body }) => {
      const newPlan = {
        id: plans.length + 1,
        name: body.name,
        price: Number(body.price || 0),
        billingPeriod: body.billingPeriod || 'monthly',
        minQuantity: Number(body.minQuantity || 1),
        validFrom: body.validFrom || null,
        validTo: body.validTo || null,
        autoClose: !!body.autoClose,
        closable: body.closable !== false,
        pausable: !!body.pausable,
        renewable: body.renewable !== false,
        isActive: body.isActive !== false,
      };
      plans.push(newPlan);
      return { data: newPlan };
    },
  },
  {
    method: 'PUT',
    match: /^\/plans\/(\d+)$/,
    handler: ({ match, body }) => {
      const id = Number(match[1]);
      const idx = plans.findIndex((p) => p.id === id);
      if (idx === -1) return { status: 404, error: { message: 'Plan not found' } };
      plans[idx] = { ...plans[idx], ...body };
      return { data: plans[idx] };
    },
  },
  {
    method: 'DELETE',
    match: /^\/plans\/(\d+)$/,
    handler: ({ match }) => {
      const id = Number(match[1]);
      plans = plans.filter((p) => p.id !== id);
      return { data: { success: true } };
    },
  },

  // --- CATALOG: TAXES ---
  {
    method: 'GET',
    match: /^\/taxes$/,
    handler: () => ({ data: taxes }),
  },
  {
    method: 'POST',
    match: /^\/taxes$/,
    handler: ({ body }) => {
      const newTax = {
        id: taxes.length + 1,
        name: body.name,
        rate: Number(body.rate || 0),
        appliesTo: body.appliesTo || 'all',
        productType: body.productType || null,
        productId: body.productId ? Number(body.productId) : null,
        isActive: body.isActive !== false,
      };
      taxes.push(newTax);
      return { data: newTax };
    },
  },
  {
    method: 'PUT',
    match: /^\/taxes\/(\d+)$/,
    handler: ({ match, body }) => {
      const id = Number(match[1]);
      const idx = taxes.findIndex((t) => t.id === id);
      if (idx === -1) return { status: 404, error: { message: 'Tax rule not found' } };
      taxes[idx] = { ...taxes[idx], ...body, rate: Number(body.rate ?? taxes[idx].rate) };
      return { data: taxes[idx] };
    },
  },
  {
    method: 'DELETE',
    match: /^\/taxes\/(\d+)$/,
    handler: ({ match }) => {
      const id = Number(match[1]);
      taxes = taxes.filter((t) => t.id !== id);
      return { data: { success: true } };
    },
  },

  // --- CATALOG: DISCOUNTS ---
  {
    method: 'GET',
    match: /^\/discounts$/,
    handler: () => ({ data: discounts }),
  },
  {
    method: 'POST',
    match: /^\/discounts$/,
    handler: ({ body }) => {
      const newDisc = {
        id: discounts.length + 1,
        name: body.name,
        type: body.type || 'percent',
        value: Number(body.value || 0),
        minPurchase: Number(body.minPurchase || 0),
        minQuantity: Number(body.minQuantity || 0),
        startDate: body.startDate || null,
        endDate: body.endDate || null,
        usageLimit: body.usageLimit ? Number(body.usageLimit) : null,
        usedCount: 0,
        appliesTo: body.appliesTo || 'subscription',
        productId: body.productId ? Number(body.productId) : null,
        isActive: body.isActive !== false,
      };
      discounts.push(newDisc);
      return { data: newDisc };
    },
  },
  {
    method: 'PUT',
    match: /^\/discounts\/(\d+)$/,
    handler: ({ match, body }) => {
      const id = Number(match[1]);
      const idx = discounts.findIndex((d) => d.id === id);
      if (idx === -1) return { status: 404, error: { message: 'Discount not found' } };
      discounts[idx] = { ...discounts[idx], ...body };
      return { data: discounts[idx] };
    },
  },
  {
    method: 'DELETE',
    match: /^\/discounts\/(\d+)$/,
    handler: ({ match }) => {
      const id = Number(match[1]);
      discounts = discounts.filter((d) => d.id !== id);
      return { data: { success: true } };
    },
  },

  // --- CATALOG: PAYMENT TERMS ---
  {
    method: 'GET',
    match: /^\/payment-terms$/,
    handler: () => ({ data: paymentTerms }),
  },
  {
    method: 'POST',
    match: /^\/payment-terms$/,
    handler: ({ body }) => {
      const newTerm = {
        id: paymentTerms.length + 1,
        name: body.name,
        days: Number(body.days || 0),
      };
      paymentTerms.push(newTerm);
      return { data: newTerm };
    },
  },
  {
    method: 'PUT',
    match: /^\/payment-terms\/(\d+)$/,
    handler: ({ match, body }) => {
      const id = Number(match[1]);
      const idx = paymentTerms.findIndex((t) => t.id === id);
      if (idx === -1) return { status: 404, error: { message: 'Payment term not found' } };
      paymentTerms[idx] = { ...paymentTerms[idx], ...body, days: Number(body.days ?? paymentTerms[idx].days) };
      return { data: paymentTerms[idx] };
    },
  },
  {
    method: 'DELETE',
    match: /^\/payment-terms\/(\d+)$/,
    handler: ({ match }) => {
      const id = Number(match[1]);
      paymentTerms = paymentTerms.filter((t) => t.id !== id);
      return { data: { success: true } };
    },
  },

  // --- CATALOG: QUOTE TEMPLATES ---
  {
    method: 'GET',
    match: /^\/quote-templates$/,
    handler: () => ({ data: quoteTemplates }),
  },
  {
    method: 'POST',
    match: /^\/quote-templates$/,
    handler: ({ body }) => {
      const newTmpl = {
        id: quoteTemplates.length + 1,
        name: body.name,
        planId: Number(body.planId),
        validityDays: Number(body.validityDays || 15),
        paymentTermId: body.paymentTermId ? Number(body.paymentTermId) : null,
        termMonths: Number(body.termMonths || 12),
        notes: body.notes || '',
        isActive: body.isActive !== false,
        lines: (body.lines || []).map((l, i) => ({
          id: i + 1,
          productId: Number(l.productId),
          variantId: l.variantId ? Number(l.variantId) : null,
          quantity: Number(l.quantity || 1),
        })),
      };
      quoteTemplates.push(newTmpl);
      return { data: newTmpl };
    },
  },
  {
    method: 'PUT',
    match: /^\/quote-templates\/(\d+)$/,
    handler: ({ match, body }) => {
      const id = Number(match[1]);
      const idx = quoteTemplates.findIndex((t) => t.id === id);
      if (idx === -1) return { status: 404, error: { message: 'Template not found' } };
      quoteTemplates[idx] = { ...quoteTemplates[idx], ...body };
      return { data: quoteTemplates[idx] };
    },
  },
  {
    method: 'DELETE',
    match: /^\/quote-templates\/(\d+)$/,
    handler: ({ match }) => {
      const id = Number(match[1]);
      quoteTemplates = quoteTemplates.filter((t) => t.id !== id);
      return { data: { success: true } };
    },
  },

  // --- CUSTOMERS ---
  {
    method: 'GET',
    match: /^\/customers$/,
    handler: ({ params }) => {
      const q = (params.get('q') || '').toLowerCase();
      let list = customers.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          (c.company && c.company.toLowerCase().includes(q))
      );
      return {
        data: list,
        meta: { page: 1, pageSize: 20, total: list.length },
      };
    },
  },
  {
    method: 'POST',
    match: /^\/customers$/,
    handler: ({ body }) => {
      const newCust = {
        id: customers.length + 1,
        name: body.name,
        email: body.email,
        phone: body.phone || '',
        company: body.company || '',
        billingAddress: body.billingAddress || '',
        hasLogin: false,
        createdAt: getToday(),
      };
      customers.push(newCust);
      return { data: newCust };
    },
  },
  {
    method: 'GET',
    match: /^\/customers\/(\d+)$/,
    handler: ({ match }) => {
      const id = Number(match[1]);
      const cust = customers.find((c) => c.id === id);
      if (!cust) return { status: 404, error: { message: 'Customer not found' } };
      return {
        data: {
          ...cust,
          stats: {
            activeSubscriptions: subscriptions.filter((s) => s.customerId === id && s.status === 'active').length,
            overdueInvoices: invoices.filter((inv) => inv.customerId === id && inv.isOverdue).length,
            totalRevenue: 23523.3,
          },
        },
      };
    },
  },
  {
    method: 'PUT',
    match: /^\/customers\/(\d+)$/,
    handler: ({ match, body }) => {
      const id = Number(match[1]);
      const idx = customers.findIndex((c) => c.id === id);
      if (idx === -1) return { status: 404, error: { message: 'Customer not found' } };
      customers[idx] = { ...customers[idx], ...body };
      return { data: customers[idx] };
    },
  },
  {
    method: 'GET',
    match: /^\/customers\/(\d+)\/timeline$/,
    handler: ({ match }) => {
      const id = Number(match[1]);
      const list = events.filter((e) => e.customerId === id);
      return { data: list };
    },
  },

  // --- SUBSCRIPTIONS ---
  {
    method: 'GET',
    match: /^\/subscriptions$/,
    handler: ({ params }) => {
      let list = [...subscriptions];
      const status = params.get('status');
      const customerId = params.get('customerId');
      const planId = params.get('planId');
      const q = (params.get('q') || '').toLowerCase();

      if (status && status !== 'all') {
        if (status === 'needs_renewal') {
          list = list.filter((s) => s.status === 'active' && s.expiryDate <= getToday());
        } else {
          list = list.filter((s) => s.status === status);
        }
      }
      if (customerId) {
        list = list.filter((s) => s.customerId === Number(customerId));
      }
      if (planId) {
        list = list.filter((s) => s.planId === Number(planId));
      }
      if (q) {
        list = list.filter(
          (s) =>
            s.number.toLowerCase().includes(q) ||
            s.customerName.toLowerCase().includes(q) ||
            s.planName.toLowerCase().includes(q)
        );
      }
      return {
        data: list,
        meta: { page: 1, pageSize: 20, total: list.length },
      };
    },
  },
  {
    method: 'GET',
    match: /^\/subscriptions\/(\d+)$/,
    handler: ({ match }) => {
      const id = Number(match[1]);
      const sub = subscriptions.find((s) => s.id === id);
      if (!sub) return { status: 404, error: { message: 'Subscription not found' } };

      const plan = plans.find((p) => p.id === sub.planId);
      // Allowed transitions rule map from MASTER_SPEC §2.3:
      // draft -> quotation | closed
      // quotation -> draft | confirmed | closed
      // confirmed -> active | closed
      // active -> closed
      // closed -> none
      let allowedTransitions = [];
      if (sub.status === 'draft') allowedTransitions = ['quotation', 'closed'];
      if (sub.status === 'quotation') allowedTransitions = ['draft', 'confirmed', 'closed'];
      if (sub.status === 'confirmed') allowedTransitions = ['active', 'closed'];
      if (sub.status === 'active') allowedTransitions = ['closed'];

      const actions = {
        canPause: sub.status === 'active' && !sub.pausedAt && !!plan?.pausable,
        canResume: sub.status === 'active' && !!sub.pausedAt,
        canClose: sub.status !== 'closed' && (plan ? plan.closable : true),
        canRenew: sub.status === 'active' && !!plan?.renewable,
        reasons: {
          pause: !plan?.pausable ? 'This plan does not permit pausing' : '',
          close: plan && !plan.closable ? 'This plan cannot be closed before term expiry' : '',
          renew: plan && !plan.renewable ? 'This plan cannot be renewed' : '',
        },
      };

      return {
        data: {
          ...sub,
          allowedTransitions,
          actions,
        },
      };
    },
  },
  {
    method: 'POST',
    match: /^\/subscriptions$/,
    handler: ({ body }) => {
      const cust = customers.find((c) => c.id === Number(body.customerId));
      const plan = plans.find((p) => p.id === Number(body.planId));
      const nextNum = `SUB-${String(subscriptions.length + 1).padStart(6, '0')}`;

      const newSub = {
        id: subscriptions.length + 1,
        number: nextNum,
        customerId: Number(body.customerId),
        customerName: cust?.name || 'Customer',
        customerEmail: cust?.email || '',
        planId: Number(body.planId),
        planName: plan?.name || 'Custom Plan',
        status: 'draft',
        startDate: body.startDate || getToday(),
        expiryDate: body.expiryDate || '2027-10-31',
        nextBillingDate: body.startDate || getToday(),
        billingAnchorDay: new Date(body.startDate || getToday()).getDate(),
        pausedAt: null,
        paymentTermId: body.paymentTermId ? Number(body.paymentTermId) : 1,
        notes: body.notes || '',
        recurringAmount: Number(body.totalRecurring || 5000),
        lines: body.lines || [],
      };
      subscriptions.push(newSub);
      events.push({
        id: events.length + 1,
        entityType: 'subscription',
        entityId: newSub.id,
        subscriptionId: newSub.id,
        customerId: newSub.customerId,
        eventType: 'created',
        message: `Subscription ${nextNum} created as Draft`,
        occurredAt: new Date().toISOString(),
        simDate: getToday(),
      });
      return { data: newSub };
    },
  },
  {
    method: 'POST',
    match: /^\/subscriptions\/from-template$/,
    handler: ({ body }) => {
      const tmpl = quoteTemplates.find((t) => t.id === Number(body.templateId));
      const cust = customers.find((c) => c.id === Number(body.customerId));
      const plan = plans.find((p) => p.id === tmpl?.planId);
      const nextNum = `SUB-${String(subscriptions.length + 1).padStart(6, '0')}`;

      const start = body.startDate || getToday();
      const expiry = new Date(start);
      expiry.setMonth(expiry.getMonth() + (tmpl?.termMonths || 12));
      const expiryStr = expiry.toISOString().split('T')[0];

      const newSub = {
        id: subscriptions.length + 1,
        number: nextNum,
        customerId: Number(body.customerId),
        customerName: cust?.name || 'Customer',
        customerEmail: cust?.email || '',
        planId: tmpl?.planId || 1,
        planName: plan?.name || 'Template Plan',
        status: 'draft',
        startDate: start,
        expiryDate: expiryStr,
        nextBillingDate: start,
        billingAnchorDay: new Date(start).getDate(),
        pausedAt: null,
        paymentTermId: tmpl?.paymentTermId || 2,
        notes: tmpl?.notes || '',
        recurringAmount: 6500.0,
        lines: (tmpl?.lines || []).map((tl, i) => {
          const prod = products.find((p) => p.id === tl.productId);
          const v = prod?.variants?.find((vr) => vr.id === tl.variantId);
          const uPrice = (prod?.salesPrice || 0) + (v?.extraPrice || 0);
          return {
            id: i + 1,
            productId: tl.productId,
            variantId: tl.variantId,
            quantity: tl.quantity,
            unitPrice: uPrice,
            amount: uPrice * tl.quantity,
            taxRate: 18.0,
          };
        }),
      };
      subscriptions.push(newSub);
      events.push({
        id: events.length + 1,
        entityType: 'subscription',
        entityId: newSub.id,
        subscriptionId: newSub.id,
        customerId: newSub.customerId,
        eventType: 'created',
        message: `Subscription ${nextNum} created from template ${tmpl?.name}`,
        occurredAt: new Date().toISOString(),
        simDate: getToday(),
      });
      return { data: newSub };
    },
  },
  {
    method: 'PATCH',
    match: /^\/subscriptions\/(\d+)$/,
    handler: ({ match, body }) => {
      const id = Number(match[1]);
      const idx = subscriptions.findIndex((s) => s.id === id);
      if (idx === -1) return { status: 404, error: { message: 'Subscription not found' } };
      subscriptions[idx] = { ...subscriptions[idx], ...body };
      return { data: subscriptions[idx] };
    },
  },
  {
    method: 'POST',
    match: /^\/subscriptions\/(\d+)\/transition$/,
    handler: ({ match, body }) => {
      const id = Number(match[1]);
      const to = body.to;
      const sub = subscriptions.find((s) => s.id === id);
      if (!sub) return { status: 404, error: { message: 'Subscription not found' } };

      sub.status = to;
      if (to === 'quotation') {
        const d = new Date(getToday());
        d.setDate(d.getDate() + 15);
        sub.quoteValidUntil = d.toISOString().split('T')[0];
      }
      if (to === 'active') {
        sub.nextBillingDate = sub.startDate;
      }
      events.push({
        id: events.length + 1,
        entityType: 'subscription',
        entityId: sub.id,
        subscriptionId: sub.id,
        customerId: sub.customerId,
        eventType: to,
        message: `Subscription status moved to ${to.toUpperCase()}`,
        occurredAt: new Date().toISOString(),
        simDate: getToday(),
      });
      return { data: sub };
    },
  },
  {
    method: 'POST',
    match: /^\/subscriptions\/(\d+)\/pause$/,
    handler: ({ match }) => {
      const id = Number(match[1]);
      const sub = subscriptions.find((s) => s.id === id);
      if (!sub) return { status: 404, error: { message: 'Subscription not found' } };
      sub.pausedAt = getToday();
      events.push({
        id: events.length + 1,
        entityType: 'subscription',
        entityId: sub.id,
        subscriptionId: sub.id,
        customerId: sub.customerId,
        eventType: 'paused',
        message: `Subscription paused on ${getToday()}`,
        occurredAt: new Date().toISOString(),
        simDate: getToday(),
      });
      return { data: sub };
    },
  },
  {
    method: 'POST',
    match: /^\/subscriptions\/(\d+)\/resume$/,
    handler: ({ match }) => {
      const id = Number(match[1]);
      const sub = subscriptions.find((s) => s.id === id);
      if (!sub) return { status: 404, error: { message: 'Subscription not found' } };
      sub.pausedAt = null;
      events.push({
        id: events.length + 1,
        entityType: 'subscription',
        entityId: sub.id,
        subscriptionId: sub.id,
        customerId: sub.customerId,
        eventType: 'resumed',
        message: `Subscription resumed on ${getToday()}`,
        occurredAt: new Date().toISOString(),
        simDate: getToday(),
      });
      return { data: sub };
    },
  },
  {
    method: 'POST',
    match: /^\/subscriptions\/(\d+)\/close$/,
    handler: ({ match, body }) => {
      const id = Number(match[1]);
      const sub = subscriptions.find((s) => s.id === id);
      if (!sub) return { status: 404, error: { message: 'Subscription not found' } };
      sub.status = 'closed';
      sub.closeReason = body.reason || 'early_close';
      events.push({
        id: events.length + 1,
        entityType: 'subscription',
        entityId: sub.id,
        subscriptionId: sub.id,
        customerId: sub.customerId,
        eventType: 'closed',
        message: `Subscription closed (${sub.closeReason})`,
        occurredAt: new Date().toISOString(),
        simDate: getToday(),
      });
      return { data: sub };
    },
  },
  {
    method: 'POST',
    match: /^\/subscriptions\/(\d+)\/renew$/,
    handler: ({ match, body }) => {
      const id = Number(match[1]);
      const sub = subscriptions.find((s) => s.id === id);
      if (!sub) return { status: 404, error: { message: 'Subscription not found' } };
      const currentExpiry = new Date(sub.expiryDate);
      currentExpiry.setFullYear(currentExpiry.getFullYear() + 1);
      sub.expiryDate = body.newExpiryDate || currentExpiry.toISOString().split('T')[0];
      events.push({
        id: events.length + 1,
        entityType: 'subscription',
        entityId: sub.id,
        subscriptionId: sub.id,
        customerId: sub.customerId,
        eventType: 'renewed',
        message: `Subscription renewed until ${sub.expiryDate}`,
        occurredAt: new Date().toISOString(),
        simDate: getToday(),
      });
      return { data: sub };
    },
  },
  {
    method: 'GET',
    match: /^\/subscriptions\/(\d+)\/upcoming-invoice$/,
    handler: ({ match }) => {
      const id = Number(match[1]);
      const sub = subscriptions.find((s) => s.id === id);
      if (!sub || sub.status !== 'active') return { data: null };
      return {
        data: {
          periodStart: sub.nextBillingDate || getToday(),
          periodEnd: '2026-11-30',
          estimatedAmount: sub.recurringAmount || 11215.0,
          linesSummary: `${sub.lines?.length || 1} product lines + plan recurring fee`,
        },
      };
    },
  },

  // --- INVOICES (FOR DETAIL TABS) ---
  {
    method: 'GET',
    match: /^\/invoices$/,
    handler: ({ params }) => {
      let list = [...invoices];
      const subId = params.get('subscriptionId');
      const custId = params.get('customerId');
      if (subId) list = list.filter((i) => i.subscriptionId === Number(subId));
      if (custId) list = list.filter((i) => i.customerId === Number(custId));
      return { data: list, meta: { total: list.length } };
    },
  },

  // --- STAFF ---
  {
    method: 'GET',
    match: /^\/staff$/,
    handler: () => {
      const staffList = users.filter((u) => u.role === 'admin' || u.role === 'staff');
      return { data: staffList };
    },
  },
  {
    method: 'POST',
    match: /^\/staff$/,
    handler: ({ body }) => {
      const newStaff = {
        id: users.length + 1,
        name: body.name,
        email: body.email,
        role: 'staff',
        isActive: true,
        createdAt: getToday(),
      };
      users.push(newStaff);
      return { data: newStaff };
    },
  },
  {
    method: 'PATCH',
    match: /^\/staff\/(\d+)\/toggle$/,
    handler: ({ match }) => {
      const id = Number(match[1]);
      const u = users.find((user) => user.id === id);
      if (u) u.isActive = !u.isActive;
      return { data: u };
    },
  },

  // --- SETTINGS ---
  {
    method: 'GET',
    match: /^\/settings$/,
    handler: () => ({ data: appSettings }),
  },
  {
    method: 'PUT',
    match: /^\/settings$/,
    handler: ({ body }) => {
      appSettings = { ...appSettings, ...body };
      return { data: appSettings };
    },
  },
  {
    method: 'POST',
    match: /^\/admin\/demo\/reset$/,
    handler: () => {
      virtualDate = null;
      return { data: { success: true, message: 'Demo environment reset completed.' } };
    },
  },

  // --- PORTAL ENDPOINTS ---
  {
    method: 'GET',
    match: /^\/portal\/overview$/,
    handler: () => {
      const mySubs = subscriptions.filter((s) => s.customerId === 1);
      const myInvs = invoices.filter((i) => i.customerId === 1);
      return {
        data: {
          activeSubscriptionsCount: mySubs.filter((s) => s.status === 'active').length,
          nextInvoiceDate: '2026-11-01',
          nextInvoiceAmount: 11215.0,
          outstandingBalance: 10289.6,
          hasOverdue: myInvs.some((i) => i.isOverdue),
          recentInvoices: myInvs,
        },
      };
    },
  },
  {
    method: 'GET',
    match: /^\/portal\/plans$/,
    handler: () => {
      return { data: plans.filter((p) => p.isActive) };
    },
  },
  {
    method: 'GET',
    match: /^\/portal\/subscriptions$/,
    handler: () => {
      const mySubs = subscriptions.filter((s) => s.customerId === 1);
      return { data: mySubs };
    },
  },
  {
    method: 'GET',
    match: /^\/portal\/subscriptions\/(\d+)$/,
    handler: ({ match }) => {
      const id = Number(match[1]);
      const sub = subscriptions.find((s) => s.id === id && s.customerId === 1);
      if (!sub) return { status: 404, error: { message: 'Subscription not found' } };
      return { data: sub };
    },
  },
  {
    method: 'GET',
    match: /^\/portal\/invoices$/,
    handler: () => {
      return { data: invoices.filter((i) => i.customerId === 1) };
    },
  },
  {
    method: 'GET',
    match: /^\/portal\/invoices\/(\d+)$/,
    handler: ({ match }) => {
      const id = Number(match[1]);
      const inv = invoices.find((i) => i.id === id && i.customerId === 1);
      if (!inv) return { status: 404, error: { message: 'Invoice not found' } };
      return { data: inv };
    },
  },
  {
    method: 'POST',
    match: /^\/portal\/invoices\/(\d+)\/pay$/,
    handler: ({ match }) => {
      const id = Number(match[1]);
      const inv = invoices.find((i) => i.id === id);
      if (inv) {
        inv.status = 'paid';
        inv.amountPaid = inv.total;
        inv.isOverdue = false;
      }
      return { data: { success: true, message: 'Simulated payment completed' } };
    },
  },
  {
    method: 'GET',
    match: /^\/portal\/payments$/,
    handler: () => {
      return {
        data: [
          {
            id: 1,
            invoiceNumber: 'INV-000101',
            amount: 10289.6,
            method: 'bank_transfer',
            paidOn: '2026-09-08',
            reference: 'UTR9817263541',
          },
        ],
      };
    },
  },
  {
    method: 'GET',
    match: /^\/portal\/profile$/,
    handler: () => {
      return { data: customers[0] };
    },
  },
  {
    method: 'PUT',
    match: /^\/portal\/profile$/,
    handler: ({ body }) => {
      customers[0] = { ...customers[0], ...body };
      return { data: customers[0] };
    },
  },

  // --- MIGRATION CENTRE ---
  {
    method: 'GET',
    match: /^\/migration\/jobs$/,
    handler: () => ({ data: migrationJobs }),
  },
  {
    method: 'POST',
    match: /^\/migration\/jobs$/,
    handler: ({ body }) => {
      const newJob = {
        id: migrationJobs.length + 1,
        kind: body.kind || 'customers',
        fileName: body.fileName || 'customers_messy.csv',
        status: 'uploaded',
        headers: ['Client_Name', 'E-mail', 'Mobile', 'Cust ID', 'Company'],
        mapping: {
          Client_Name: 'name',
          'E-mail': 'email',
          Mobile: 'phone',
          'Cust ID': 'legacyId',
          Company: 'company',
        },
        createdAt: new Date().toISOString(),
      };
      migrationJobs.unshift(newJob);
      return { data: newJob };
    },
  },
  {
    method: 'GET',
    match: /^\/migration\/jobs\/(\d+)$/,
    handler: ({ match }) => {
      const id = Number(match[1]);
      const j = migrationJobs.find((job) => job.id === id);
      return { data: j || migrationJobs[0] };
    },
  },
  {
    method: 'PUT',
    match: /^\/migration\/jobs\/(\d+)\/mapping$/,
    handler: ({ match, body }) => {
      return { data: { success: true, mapping: body.mapping } };
    },
  },
  {
    method: 'POST',
    match: /^\/migration\/jobs\/(\d+)\/validate$/,
    handler: () => {
      return {
        data: {
          validCount: 52,
          warningCount: 4,
          errorCount: 3,
          duplicateCount: 1,
        },
      };
    },
  },
  {
    method: 'GET',
    match: /^\/migration\/jobs\/(\d+)\/rows$/,
    handler: () => {
      return {
        data: [
          { rowNumber: 1, status: 'valid', mapped: { name: 'Acme Corp', email: 'acme@test.com' }, messages: [] },
          { rowNumber: 2, status: 'valid', mapped: { name: 'Globex Ltd', email: 'globex@test.com' }, messages: [] },
          { rowNumber: 3, status: 'warning', mapped: { name: 'Soylent Inc', email: 'soylent@test.com' }, messages: ['Renewal date is in the past'] },
          { rowNumber: 4, status: 'error', mapped: { name: '', email: 'invalid-email' }, messages: ['Name is required', 'Invalid email format'] },
          { rowNumber: 5, status: 'duplicate', mapped: { name: 'Acme Technologies Pvt Ltd', email: 'customer@brightloop.test' }, messages: ['Email matches existing customer in database'] },
        ],
      };
    },
  },
  {
    method: 'POST',
    match: /^\/migration\/jobs\/(\d+)\/import$/,
    handler: () => {
      return {
        data: {
          status: 'completed',
          summary: { total: 5, imported: 3, skipped: 1, failed: 1 },
        },
      };
    },
  },
];
