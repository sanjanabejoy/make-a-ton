# SubscriptIQ — Engineering Assumptions (P3 Frontend A)

1. **Stack & Tooling**: Client built with React 18, Vite, React Router 6, Tailwind CSS, `@tanstack/react-query`, `axios`, `react-hook-form`, `@hookform/resolvers`, `zod`, `lucide-react`, and `date-fns`.
2. **Mocking Mode**: When `VITE_USE_MOCKS=true`, an Axios adapter simulates backend responses with realistic network latency (200-300ms) and stateful in-memory stores for products, variants, plans, taxes, discounts, payment terms, quote templates, customers, subscriptions, timeline events, and migration jobs.
3. **P4 Ownership Separation**: Placeholders for `p4` (`routes.p4.jsx`, `nav.p4.js`, `mocks/p4.js`, `components/p4/*`, `pages/p4/*`) export empty structures or clean fallback placeholders (e.g. `InvoiceDetailView`) without stepping into P4's territory.
4. **Registration / Customer Linking**: Customer registration links to existing customer by email if unlinked, or creates a new customer profile.
5. **Currency and Formatting**: Fixed default currency is `INR` (₹), formatted with `Intl.NumberFormat('en-IN')` with tabular numerals.
6. **Date Handling**: Uses `YYYY-MM-DD` strings consistently; respects simulated clock date if set via `GET /api/clock`.
7. **Backend P1 scope**: The initial backend delivery uses raw PostgreSQL queries and exposes the Phase A-E foundation and core routes; advanced daily jobs, migration, reconciliation, and dashboard modules remain separate follow-up work.

## P4 (Frontend B + Demo Lead) Assumptions

1. **Explainable Invoices ("Why?")**: Stored as ordered step arrays (`calcTrail`) at invoice line generation time, covering base price, variant surcharges, product discounts, allocated subscription discounts, and taxes. Running subtotals are visualized as a vertical stepper with detailed explanations.
2. **Billing Time Machine Idempotency**: Successive runs against the same simulated target date return 0 duplicate invoices ("Nothing skipped, nothing duplicated"). The runner advances the subscription billing pointer without re-billing already generated periods.
3. **Collections Risk Model**: Risk score uses deterministic point thresholds (High ≥60, Medium 30-59, Low <30) derived from days overdue, upcoming expiry, and pause histories. Marked with the required regulatory footnote that it is a rule-based prioritisation tool, not a statistical prediction.
4. **Print Layout**: Standalone clean printable view rendered without navigation chrome (`public: true` in routes), with `@media print` rules hiding action buttons.
5. **Bank Reconciliation**: Statement CSV credit lines are matched using exact invoice number regexes (High confidence), customer narrative tokens (Medium confidence), and unique outstanding balances, recording payments only upon explicit user confirmation.
6. **Simulated Reminders & Emails**: In the absence of an external SMTP gateway, emails are transparently captured in the in-app Developer Mailbox (`/dev/mailbox`), clearly badged as "Simulated" in the user interface.
