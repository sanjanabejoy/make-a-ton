import React from 'react';
import routesP3 from './routes.p3';

// Remove fallback dashboard from P3 now that P4 FinanceDashboard is active
const dashboardFallbackIndex = routesP3.findIndex((r) => r.path === '/dashboard');
if (dashboardFallbackIndex !== -1) {
  routesP3.splice(dashboardFallbackIndex, 1);
}

// P4 Pages
import InvoicesListPage from './pages/p4/invoices/InvoicesListPage';
import InvoiceDetailPage from './pages/p4/invoices/InvoiceDetailPage';
import InvoicePrintPage from './pages/p4/invoices/InvoicePrintPage';
import PaymentsListPage from './pages/p4/payments/PaymentsListPage';
import FinanceDashboardPage from './pages/p4/dashboard/FinanceDashboardPage';
import TimeMachinePage from './pages/p4/billing/TimeMachinePage';
import CollectionsPage from './pages/p4/collections/CollectionsPage';
import InsightsPage from './pages/p4/insights/InsightsPage';
import ReconcilePage from './pages/p4/reconcile/ReconcilePage';
import DevMailboxPage from './pages/p4/dev/DevMailboxPage';

export default [
  // Finance Dashboard
  {
    path: '/dashboard',
    element: <FinanceDashboardPage />,
    roles: ['admin', 'staff'],
  },

  // Invoices
  {
    path: '/invoices',
    element: <InvoicesListPage />,
    roles: ['admin', 'staff'],
  },
  {
    path: '/invoices/:id',
    element: <InvoiceDetailPage />,
    roles: ['admin', 'staff'],
  },
  {
    path: '/invoices/:id/print',
    element: <InvoicePrintPage />,
    public: true, // Render standalone without AppLayout sidebar for printing
  },

  // Payments
  {
    path: '/payments',
    element: <PaymentsListPage />,
    roles: ['admin', 'staff'],
  },

  // Billing Time Machine
  {
    path: '/billing',
    element: <TimeMachinePage />,
    roles: ['admin', 'staff'],
  },

  // Collections Cockpit
  {
    path: '/collections',
    element: <CollectionsPage />,
    roles: ['admin', 'staff'],
  },

  // Revenue Intelligence & Insights
  {
    path: '/insights',
    element: <InsightsPage />,
    roles: ['admin', 'staff'],
  },

  // Bank Reconciliation
  {
    path: '/reconcile',
    element: <ReconcilePage />,
    roles: ['admin', 'staff'],
  },

  // Developer Mailbox (Admin Only)
  {
    path: '/dev/mailbox',
    element: <DevMailboxPage />,
    roles: ['admin'],
  },
];
