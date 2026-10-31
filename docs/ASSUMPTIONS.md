# SubscriptIQ — Engineering Assumptions (P3 Frontend A)

1. **Stack & Tooling**: Client built with React 18, Vite, React Router 6, Tailwind CSS, `@tanstack/react-query`, `axios`, `react-hook-form`, `@hookform/resolvers`, `zod`, `lucide-react`, and `date-fns`.
2. **Mocking Mode**: When `VITE_USE_MOCKS=true`, an Axios adapter simulates backend responses with realistic network latency (200-300ms) and stateful in-memory stores for products, variants, plans, taxes, discounts, payment terms, quote templates, customers, subscriptions, timeline events, and migration jobs.
3. **P4 Ownership Separation**: Placeholders for `p4` (`routes.p4.jsx`, `nav.p4.js`, `mocks/p4.js`, `components/p4/*`, `pages/p4/*`) export empty structures or clean fallback placeholders (e.g. `InvoiceDetailView`) without stepping into P4's territory.
4. **Registration / Customer Linking**: Customer registration links to existing customer by email if unlinked, or creates a new customer profile.
5. **Currency and Formatting**: Fixed default currency is `INR` (₹), formatted with `Intl.NumberFormat('en-IN')` with tabular numerals.
6. **Date Handling**: Uses `YYYY-MM-DD` strings consistently; respects simulated clock date if set via `GET /api/clock`.
