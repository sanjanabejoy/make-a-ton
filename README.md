# SubscriptIQ

> Subscription management and revenue operations for teams moving beyond spreadsheets.

SubscriptIQ is a role-aware web application for managing customers, products, recurring plans, subscriptions, invoices, payments, and migration from Excel or CSV files. It gives operations teams one place to manage the subscription lifecycle and gives customers a self-service portal for their own records.

This repository currently contains the **React frontend prototype**. It runs with a stateful in-memory mock API by default, so the main workflows can be explored without a separate backend.

## What you can do

- Sign in, register, reset passwords, and switch between Admin, Staff, and Customer experiences.
- Manage customers, products, product variants, plans, taxes, discounts, payment terms, and quotation templates.
- Create and manage subscriptions through their lifecycle.
- Review subscription timelines, invoices, payments, and outstanding balances.
- Import existing business records through a guided Excel/CSV migration workflow with mapping, validation, preview, and import steps.
- Use the customer portal to view plans, subscriptions, invoices, payments, and profile information.
- Configure company and billing settings from the Admin workspace.

## Screens and roles

| Role | Access |
| --- | --- |
| **Admin** | Full operations access, including staff, settings, catalog, migration, subscriptions, and customers |
| **Staff** | Customer, catalog, quotation, subscription, invoice, and payment workflows |
| **Customer** | Own portal profile, plans, subscriptions, invoices, and payment history |

The application protects routes by role and uses separate layouts for the operations workspace and customer portal.

## Quick start

### Requirements

- Node.js 18 or newer
- npm 9 or newer

### Install

From the repository root:

```bash
npm run setup
```

This installs the frontend dependencies in `client/`.

### Start the development server

```bash
npm run dev
```

Open the URL printed by Vite, usually [http://localhost:5173](http://localhost:5173).

The equivalent command from the `client/` directory is:

```bash
npm run dev
```

### Create a production build

```bash
npm run build
```

To preview the production build locally:

```bash
cd client
npm run preview
```

## Demo accounts

The default mock data includes these accounts:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@brightloop.test` | Any password with at least 6 characters |
| Staff | `staff@brightloop.test` | Any password with at least 6 characters |
| Customer | `customer@brightloop.test` | Any password with at least 6 characters |

The mock login checks the email against the seeded accounts and requires a password of six or more characters. New registrations use the stronger password rules shown in the UI: at least nine characters, one uppercase letter, one lowercase letter, and one special character.

## Configuration

The frontend uses the mock adapter when `VITE_USE_MOCKS=true`. The repository includes this default configuration in [`client/.env.example`](./client/.env.example).

To create a local environment file explicitly:

```bash
cp client/.env.example client/.env
```

For a real API integration, set `VITE_USE_MOCKS=false` and provide an API implementation that matches the routes used by [`client/src/api/http.js`](./client/src/api/http.js). Requests are made relative to `/api`, so configure a development proxy or serve the frontend behind the API host.

## Project structure

```text
.
├── client/
│   ├── src/
│   │   ├── api/          Axios client and API error handling
│   │   ├── auth/         Authentication context and route guards
│   │   ├── components/   Reusable UI components
│   │   ├── layouts/      Operations and customer portal layouts
│   │   ├── mocks/        Stateful mock API and seeded demo data
│   │   ├── pages/p3/     Authentication, catalog, billing, and portal screens
│   │   ├── App.jsx       Router, providers, and role-aware route composition
│   │   └── index.css     Global styles and Tailwind entry point
│   ├── package.json
│   └── vite.config.js
├── docs/
│   └── ASSUMPTIONS.md    Frontend implementation assumptions
├── ARCHITECTURE.md       Proposed domain and system architecture
└── package.json          Root scripts for setup, development, and builds
```

## Technology

| Area | Current implementation |
| --- | --- |
| UI | React 18 |
| Build tool | Vite 5 |
| Routing | React Router 6 |
| Styling | Tailwind CSS 3 |
| Data fetching | Axios and TanStack Query |
| Forms and validation | React Hook Form, Zod, and `@hookform/resolvers` |
| Icons | Lucide React |
| Date utilities | date-fns |
| API mode | Stateful Axios mock adapter or a relative `/api` backend |

The broader target architecture is documented in [`ARCHITECTURE.md`](./ARCHITECTURE.md). It describes a modular backend with PostgreSQL, Prisma, Redis/BullMQ, notifications, and analytics; those services are not included in the current frontend-only checkout.

## Main workflows

### Subscription lifecycle

```text
Customer → Product / Plan → Quotation → Subscription → Invoice → Payment → Revenue insight
```

The operations workspace exposes the catalog, customer, subscription, and migration workflows from the dashboard. Subscription details include lifecycle actions and a chronological activity timeline.

### Spreadsheet migration

```text
Upload Excel / CSV
        ↓
Analyze files
        ↓
Map columns
        ↓
Validate records
        ↓
Preview changes
        ↓
Confirm import
        ↓
Review migration report
```

The mock mode includes representative valid, warning, error, and duplicate rows so the migration UI can be evaluated without uploaded production data.

## Development notes

- Mock state is held in memory and resets when the page is reloaded or the mock data reset action is used.
- Currency formatting currently defaults to INR (`₹`) and uses the `en-IN` locale.
- Dates are represented consistently as `YYYY-MM-DD` strings in the frontend.
- Routes from `routes.p3.jsx` and the reserved P4 route surface are composed by [`client/src/App.jsx`](./client/src/App.jsx).
- Authentication state is stored in browser `localStorage` for the prototype. Do not use the mock credentials or storage approach for production authentication.

## Documentation

- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — proposed system design, module boundaries, data model, and security boundaries.
- [`docs/ASSUMPTIONS.md`](./docs/ASSUMPTIONS.md) — frontend stack and behavior assumptions.

## Project status

🚧 **Under active development**

This is a hackathon-stage prototype. The frontend flows and mock data are available for demonstration; backend persistence, payment-provider integrations, scheduled jobs, email delivery, and production authentication remain planned integration work.

## Contributing

Contributions and feedback are welcome:

1. Fork the repository.
2. Create a focused feature branch.
3. Make and test your changes.
4. Open a pull request describing the user-facing impact.

## License

No license has been specified yet. Contact the project maintainers before redistributing or using the project outside its intended development context.

---

<p align="center">
  <strong>SubscriptIQ</strong><br>
  Every subscription. Every payment. One intelligent platform.
</p>
