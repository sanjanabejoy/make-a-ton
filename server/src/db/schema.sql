CREATE SEQUENCE IF NOT EXISTS subscription_seq START 1;
CREATE SEQUENCE IF NOT EXISTS invoice_seq START 1;

CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin','staff','customer')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by BIGINT REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_uq ON users (lower(email));

CREATE TABLE IF NOT EXISTS password_resets (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,            -- sha256 of token
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS password_resets_token_idx ON password_resets(token_hash);

CREATE TABLE IF NOT EXISTS customers (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT UNIQUE REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  billing_address TEXT,
  legacy_id TEXT,                       -- id from imported spreadsheet
  migration_job_id BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS customers_email_uq ON customers (lower(email));
CREATE INDEX IF NOT EXISTS customers_legacy_idx ON customers(legacy_id);

CREATE TABLE IF NOT EXISTS products (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,                   -- e.g. 'software','addon','service'
  sales_price NUMERIC(12,2) NOT NULL CHECK (sales_price >= 0),
  cost_price NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (cost_price >= 0),
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS product_variants (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  attribute TEXT NOT NULL,              -- e.g. 'Brand'
  value TEXT NOT NULL,                  -- e.g. 'Odoo'
  extra_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  UNIQUE (product_id, attribute, value)
);

CREATE TABLE IF NOT EXISTS plans (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  billing_period TEXT NOT NULL CHECK (billing_period IN ('daily','weekly','monthly','yearly')),
  min_quantity INT NOT NULL DEFAULT 1 CHECK (min_quantity >= 1),
  valid_from DATE,
  valid_to DATE,
  auto_close BOOLEAN NOT NULL DEFAULT FALSE,
  closable BOOLEAN NOT NULL DEFAULT TRUE,
  pausable BOOLEAN NOT NULL DEFAULT FALSE,
  renewable BOOLEAN NOT NULL DEFAULT TRUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (valid_to IS NULL OR valid_from IS NULL OR valid_to >= valid_from)
);

CREATE TABLE IF NOT EXISTS tax_rules (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  rate NUMERIC(5,2) NOT NULL CHECK (rate >= 0 AND rate <= 100),
  applies_to TEXT NOT NULL CHECK (applies_to IN ('all','product_type','product')),
  product_type TEXT,
  product_id BIGINT REFERENCES products(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS discounts (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('fixed','percent')),
  value NUMERIC(12,2) NOT NULL CHECK (value > 0),
  min_purchase NUMERIC(12,2) NOT NULL DEFAULT 0,
  min_quantity INT NOT NULL DEFAULT 0,
  start_date DATE,
  end_date DATE,
  usage_limit INT,                      -- null = unlimited
  used_count INT NOT NULL DEFAULT 0,
  applies_to TEXT NOT NULL CHECK (applies_to IN ('product','subscription')),
  product_id BIGINT REFERENCES products(id) ON DELETE CASCADE,   -- required when applies_to='product'
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by BIGINT REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payment_terms (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,                   -- 'Immediate','Net 15','Net 30'
  days INT NOT NULL CHECK (days >= 0)
);

CREATE TABLE IF NOT EXISTS quote_templates (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  plan_id BIGINT NOT NULL REFERENCES plans(id),
  validity_days INT NOT NULL CHECK (validity_days > 0),
  payment_term_id BIGINT REFERENCES payment_terms(id),
  term_months INT NOT NULL DEFAULT 12,  -- default subscription length
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS quote_template_lines (
  id BIGSERIAL PRIMARY KEY,
  template_id BIGINT NOT NULL REFERENCES quote_templates(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES products(id),
  variant_id BIGINT REFERENCES product_variants(id),
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0)
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id BIGSERIAL PRIMARY KEY,
  number TEXT NOT NULL UNIQUE,          -- SUB-000001
  customer_id BIGINT NOT NULL REFERENCES customers(id),
  plan_id BIGINT NOT NULL REFERENCES plans(id),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','quotation','confirmed','active','closed')),
  start_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  payment_term_id BIGINT REFERENCES payment_terms(id),
  template_id BIGINT REFERENCES quote_templates(id),
  quote_sent_on DATE,
  quote_valid_until DATE,
  next_billing_date DATE,
  billing_anchor_day INT,
  paused_at DATE,
  close_reason TEXT,                    -- 'early_close','expired','quote_expired','cancelled','churned'
  notes TEXT,
  is_historical BOOLEAN NOT NULL DEFAULT FALSE,
  legacy_id TEXT,
  migration_job_id BIGINT,
  created_by BIGINT REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  activated_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  CHECK (expiry_date >= start_date)
);

CREATE TABLE IF NOT EXISTS subscription_lines (
  id BIGSERIAL PRIMARY KEY,
  subscription_id BIGINT NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES products(id),
  variant_id BIGINT REFERENCES product_variants(id),
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(12,2) NOT NULL,    -- product + variant extra, snapshot at save
  tax_rate NUMERIC(5,2) NOT NULL DEFAULT 0,   -- resolved at save (preview only; invoice re-resolves)
  amount NUMERIC(12,2) NOT NULL         -- quantity * unit_price (pre-tax, pre-discount)
);

CREATE TABLE IF NOT EXISTS billing_runs (
  id BIGSERIAL PRIMARY KEY,
  as_of_date DATE NOT NULL,
  dry_run BOOLEAN NOT NULL,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running','completed','failed')),
  scanned INT NOT NULL DEFAULT 0,
  invoices_created INT NOT NULL DEFAULT 0,
  total_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  errors JSONB NOT NULL DEFAULT '[]',
  started_by BIGINT REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS invoices (
  id BIGSERIAL PRIMARY KEY,
  number TEXT NOT NULL UNIQUE,          -- INV-000001
  subscription_id BIGINT NOT NULL REFERENCES subscriptions(id),
  customer_id BIGINT NOT NULL REFERENCES customers(id),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','confirmed','paid','cancelled')),
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  subtotal NUMERIC(12,2) NOT NULL,      -- sum of line pre-discount amounts
  discount_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL,
  amount_paid NUMERIC(12,2) NOT NULL DEFAULT 0,   -- denormalised, maintained in payment txn
  currency TEXT NOT NULL DEFAULT 'INR',
  payment_term_name TEXT,
  calc_trail JSONB,                     -- explainability, see Section 9
  billing_run_id BIGINT REFERENCES billing_runs(id),
  is_historical BOOLEAN NOT NULL DEFAULT FALSE,
  legacy_id TEXT,
  sent_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT invoices_sub_period_uq UNIQUE (subscription_id, period_start),  -- NO DUPLICATE BILLING
  CHECK (amount_paid >= 0 AND amount_paid <= total)
);

CREATE TABLE IF NOT EXISTS invoice_lines (
  id BIGSERIAL PRIMARY KEY,
  invoice_id BIGINT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  kind TEXT NOT NULL DEFAULT 'product' CHECK (kind IN ('product','plan_fee')),
  product_id BIGINT REFERENCES products(id),
  variant_id BIGINT REFERENCES product_variants(id),
  description TEXT NOT NULL,
  quantity INT NOT NULL,
  unit_price NUMERIC(12,2) NOT NULL,
  line_subtotal NUMERIC(12,2) NOT NULL,
  discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_id BIGINT REFERENCES discounts(id),
  sub_discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0,   -- allocated subscription-level discount
  sub_discount_id BIGINT REFERENCES discounts(id),
  tax_rule_id BIGINT REFERENCES tax_rules(id),
  tax_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  line_total NUMERIC(12,2) NOT NULL,
  calc_trail JSONB
);

CREATE TABLE IF NOT EXISTS payments (
  id BIGSERIAL PRIMARY KEY,
  invoice_id BIGINT NOT NULL REFERENCES invoices(id),
  method TEXT NOT NULL CHECK (method IN ('cash','bank_transfer','card','upi','cheque','online_simulated','other')),
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  paid_on DATE NOT NULL,
  note TEXT,
  reference TEXT,
  recorded_by BIGINT REFERENCES users(id),
  voided_at TIMESTAMPTZ,
  is_historical BOOLEAN NOT NULL DEFAULT FALSE,
  reconcile_line_id BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS events (                   -- timeline + activity log
  id BIGSERIAL PRIMARY KEY,
  entity_type TEXT NOT NULL,            -- 'subscription','invoice','payment','customer','billing_run',...
  entity_id BIGINT,
  subscription_id BIGINT REFERENCES subscriptions(id) ON DELETE CASCADE,
  customer_id BIGINT REFERENCES customers(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,             -- 'created','quotation_sent','confirmed','activated','invoice_generated','payment_received','paused','resumed','renewed','closed','reminder_sent',...
  message TEXT NOT NULL,
  meta JSONB,
  actor_id BIGINT REFERENCES users(id),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sim_date DATE                         -- getToday() at the time (Time Machine aware)
);

CREATE TABLE IF NOT EXISTS reminders (
  id BIGSERIAL PRIMARY KEY,
  invoice_id BIGINT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  step INT NOT NULL,
  offset_days INT NOT NULL,
  scheduled_for DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','sent','simulated','skipped')),
  sent_at TIMESTAMPTZ,
  message TEXT,
  sent_by BIGINT REFERENCES users(id),
  UNIQUE (invoice_id, step)
);

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS email_log (                -- dev mailbox
  id BIGSERIAL PRIMARY KEY,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  kind TEXT,
  delivered BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mrr_snapshots (            -- Tier 3 waterfall
  month DATE NOT NULL,
  subscription_id BIGINT NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  mrr NUMERIC(12,2) NOT NULL,
  PRIMARY KEY (month, subscription_id)
);

CREATE TABLE IF NOT EXISTS migration_jobs (
  id BIGSERIAL PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('customers','subscriptions')),
  file_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded','mapped','validated','importing','completed','failed','rolled_back')),
  headers JSONB,
  mapping JSONB,
  options JSONB,
  summary JSONB,
  created_by BIGINT REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS migration_rows (
  id BIGSERIAL PRIMARY KEY,
  job_id BIGINT NOT NULL REFERENCES migration_jobs(id) ON DELETE CASCADE,
  row_number INT NOT NULL,
  raw JSONB NOT NULL,
  mapped JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','valid','warning','error','duplicate','imported','skipped')),
  messages JSONB NOT NULL DEFAULT '[]',
  target_id BIGINT
);
CREATE INDEX IF NOT EXISTS migration_rows_job_idx ON migration_rows(job_id, status);

CREATE TABLE IF NOT EXISTS reconcile_batches (
  id BIGSERIAL PRIMARY KEY,
  file_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'review',
  summary JSONB,
  created_by BIGINT REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reconcile_lines (
  id BIGSERIAL PRIMARY KEY,
  batch_id BIGINT NOT NULL REFERENCES reconcile_batches(id) ON DELETE CASCADE,
  line_hash TEXT NOT NULL UNIQUE,       -- sha256(date|amount|description|reference) -> idempotent re-upload
  txn_date DATE NOT NULL,
  description TEXT,
  reference TEXT,
  amount NUMERIC(12,2) NOT NULL,
  suggested_invoice_id BIGINT REFERENCES invoices(id),
  confidence TEXT CHECK (confidence IN ('high','medium','low')),
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'suggested' CHECK (status IN ('suggested','unmatched','confirmed','rejected')),
  payment_id BIGINT REFERENCES payments(id)
);

-- PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS subs_active_billing_idx ON subscriptions (next_billing_date) WHERE status='active' AND paused_at IS NULL;
CREATE INDEX IF NOT EXISTS subs_status_idx ON subscriptions (status, expiry_date);
CREATE INDEX IF NOT EXISTS subs_customer_idx ON subscriptions (customer_id);
CREATE INDEX IF NOT EXISTS subs_plan_idx ON subscriptions (plan_id);
CREATE INDEX IF NOT EXISTS subs_legacy_idx ON subscriptions (legacy_id);
CREATE INDEX IF NOT EXISTS sublines_sub_idx ON subscription_lines (subscription_id);
CREATE INDEX IF NOT EXISTS invoices_status_due_idx ON invoices (status, due_date);
CREATE INDEX IF NOT EXISTS invoices_overdue_idx ON invoices (due_date) WHERE status='confirmed';
CREATE INDEX IF NOT EXISTS invoices_customer_idx ON invoices (customer_id, status);
CREATE INDEX IF NOT EXISTS invoices_sub_idx ON invoices (subscription_id);
CREATE INDEX IF NOT EXISTS invoices_date_idx ON invoices (invoice_date);
CREATE INDEX IF NOT EXISTS invlines_inv_idx ON invoice_lines (invoice_id);
CREATE INDEX IF NOT EXISTS payments_invoice_idx ON payments (invoice_id);
CREATE INDEX IF NOT EXISTS payments_paid_on_idx ON payments (paid_on) WHERE voided_at IS NULL;
CREATE INDEX IF NOT EXISTS events_sub_idx ON events (subscription_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS reminders_status_idx ON reminders (status, scheduled_for);
