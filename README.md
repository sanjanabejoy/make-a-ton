# SubscriptIQ

> Subscription management and revenue operations for teams moving beyond spreadsheets.

SubscriptIQ is a role-aware web application for managing customers, products, recurring plans, subscriptions, invoices, payments, and migration from Excel or CSV files. It gives operations teams one place to manage the subscription lifecycle and gives customers a self-service portal for their own records.

This repository contains a React frontend prototype and a Node/Express backend core. The frontend still runs with a stateful in-memory mock API by default, while the backend provides the PostgreSQL-backed API foundation and billing primitives.

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
- Docker (for the PostgreSQL development database)

### Install

From the repository root:

```bash
npm run setup
```

This installs the frontend dependencies in `client/`.

The setup command also installs backend dependencies in `server/`.

### Start the backend

Start PostgreSQL and apply the schema:

```bash
docker compose up -d
npm run server:migrate
npm run server:dev
```

The API listens on [http://localhost:4000](http://localhost:4000), with a health check at `/api/health`.

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

For a real API integration, set `VITE_USE_MOCKS=false` and set `VITE_API_URL` to the backend URL, for example `https://your-backend.onrender.com/api`. The backend configuration is documented in [`server/.env.example`](./server/.env.example). Local development uses the Vite `/api` proxy when `VITE_API_URL` is omitted.

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
├── server/
│   ├── src/
│   │   ├── db/            PostgreSQL schema, pool, and migrations
│   │   ├── lib/           Money, date, clock, numbering, events, and mail helpers
│   │   ├── middleware/    Authentication, role checks, and validation
│   │   └── modules/       Auth, staff, subscriptions, billing, invoices, and payments
│   └── tests/             P1 backend unit tests
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
| API mode | Stateful Axios mock adapter or the Node/Express `/api` backend |

The broader target architecture is documented in [`ARCHITECTURE.md`](./ARCHITECTURE.md). The current backend uses raw PostgreSQL queries as required by the P1 contract; the remaining modules described in that document are staged implementation work.

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

This is a hackathon-stage implementation. The frontend flows and mock data are available for demonstration, and the backend core includes persistence, authentication, subscription transitions, invoice calculations, and payments. Payment-provider integrations, scheduled jobs, migration workflows, and production hardening remain planned work.

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
