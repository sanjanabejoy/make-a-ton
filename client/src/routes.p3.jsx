import React from 'react';
import { Link } from 'react-router-dom';
import { Layers, Users, Box, Calendar, UploadCloud, Settings } from 'lucide-react';
import Card from './components/ui/Card';

// Quick Fallback Dashboard if P4 is not yet merged
function DashboardFallback() {
  const cards = [
    { title: 'Subscriptions', desc: 'Manage lifecycle, quotations, and recurring cycles', href: '/subscriptions', icon: Layers, color: 'text-indigo-600 bg-indigo-50' },
    { title: 'Customers', desc: 'View customer accounts, contacts, and portfolios', href: '/customers', icon: Users, color: 'text-blue-600 bg-blue-50' },
    { title: 'Product Catalog', desc: 'Configure software, variants, and standalone add-ons', href: '/products', icon: Box, color: 'text-purple-600 bg-purple-50' },
    { title: 'Plans & Policies', desc: 'Configure recurring intervals, pause, and renewal rules', href: '/plans', icon: Calendar, color: 'text-emerald-600 bg-emerald-50' },
    { title: 'Migration Centre', desc: 'Upload spreadsheets and safely import existing data', href: '/migration', icon: UploadCloud, color: 'text-amber-600 bg-amber-50' },
    { title: 'Settings', desc: 'Company details, currency, and billing policies', href: '/settings', icon: Settings, color: 'text-slate-600 bg-slate-50' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">SubscriptIQ Management Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">
          Subscription Management & Revenue Intelligence Operations Platform
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((c, i) => (
          <Link key={i} to={c.href} className="group">
            <Card className="h-full hover:border-indigo-400 transition hover:shadow-soft">
              <div className="flex items-center gap-4">
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${c.color}`}>
                  <c.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 group-hover:text-indigo-600 transition">
                    {c.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{c.desc}</p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

// Auth Pages
import LoginPage from './pages/p3/auth/LoginPage';
import RegisterPage from './pages/p3/auth/RegisterPage';
import ForgotPasswordPage from './pages/p3/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/p3/auth/ResetPasswordPage';

// Catalog Pages
import ProductsPage from './pages/p3/catalog/ProductsPage';
import PlansPage from './pages/p3/catalog/PlansPage';
import TaxesPage from './pages/p3/catalog/TaxesPage';
import DiscountsPage from './pages/p3/catalog/DiscountsPage';
import PaymentTermsPage from './pages/p3/catalog/PaymentTermsPage';
import QuoteTemplatesPage from './pages/p3/catalog/QuoteTemplatesPage';

// Customers Pages
import CustomersListPage from './pages/p3/customers/CustomersListPage';
import CustomerDetailPage from './pages/p3/customers/CustomerDetailPage';

// Subscriptions Pages
import SubscriptionsListPage from './pages/p3/subscriptions/SubscriptionsListPage';
import SubscriptionFormPage from './pages/p3/subscriptions/SubscriptionFormPage';
import SubscriptionDetailPage from './pages/p3/subscriptions/SubscriptionDetailPage';

// Admin Administration Pages
import StaffPage from './pages/p3/staff/StaffPage';
import SettingsPage from './pages/p3/settings/SettingsPage';
import MigrationWizardPage from './pages/p3/migration/MigrationWizardPage';

// Customer Portal Pages
import PortalOverviewPage from './pages/p3/portal/PortalOverviewPage';
import PortalPlansPage from './pages/p3/portal/PortalPlansPage';
import PortalSubscriptionsPage from './pages/p3/portal/PortalSubscriptionsPage';
import PortalSubscriptionDetailPage from './pages/p3/portal/PortalSubscriptionDetailPage';
import PortalInvoicesPage from './pages/p3/portal/PortalInvoicesPage';
import PortalInvoiceDetailPage from './pages/p3/portal/PortalInvoiceDetailPage';
import PortalPaymentsPage from './pages/p3/portal/PortalPaymentsPage';
import PortalProfilePage from './pages/p3/portal/PortalProfilePage';

export default [
  // Fallback dashboard for admin & staff
  { path: '/dashboard', element: <DashboardFallback />, roles: ['admin', 'staff'] },

  // Public Auth
  { path: '/login', element: <LoginPage />, public: true },
  { path: '/register', element: <RegisterPage />, public: true },
  { path: '/forgot-password', element: <ForgotPasswordPage />, public: true },
  { path: '/reset-password/:token', element: <ResetPasswordPage />, public: true },

  // Admin & Staff Operations & Catalog
  { path: '/customers', element: <CustomersListPage />, roles: ['admin', 'staff'] },
  { path: '/customers/:id', element: <CustomerDetailPage />, roles: ['admin', 'staff'] },
  { path: '/products', element: <ProductsPage />, roles: ['admin', 'staff'] },
  { path: '/plans', element: <PlansPage />, roles: ['admin', 'staff'] },
  { path: '/taxes', element: <TaxesPage />, roles: ['admin', 'staff'] },
  { path: '/discounts', element: <DiscountsPage />, roles: ['admin', 'staff'] },
  { path: '/payment-terms', element: <PaymentTermsPage />, roles: ['admin', 'staff'] },
  { path: '/quote-templates', element: <QuoteTemplatesPage />, roles: ['admin', 'staff'] },
  { path: '/subscriptions', element: <SubscriptionsListPage />, roles: ['admin', 'staff'] },
  { path: '/subscriptions/new', element: <SubscriptionFormPage />, roles: ['admin', 'staff'] },
  { path: '/subscriptions/:id', element: <SubscriptionDetailPage />, roles: ['admin', 'staff'] },

  // Admin Only Operations
  { path: '/staff', element: <StaffPage />, roles: ['admin'] },
  { path: '/settings', element: <SettingsPage />, roles: ['admin'] },
  { path: '/migration', element: <MigrationWizardPage />, roles: ['admin'] },

  // Customer Portal
  { path: '/portal', element: <PortalOverviewPage />, roles: ['customer'] },
  { path: '/portal/plans', element: <PortalPlansPage />, roles: ['customer'] },
  { path: '/portal/subscriptions', element: <PortalSubscriptionsPage />, roles: ['customer'] },
  { path: '/portal/subscriptions/:id', element: <PortalSubscriptionDetailPage />, roles: ['customer'] },
  { path: '/portal/invoices', element: <PortalInvoicesPage />, roles: ['customer'] },
  { path: '/portal/invoices/:id', element: <PortalInvoiceDetailPage />, roles: ['customer'] },
  { path: '/portal/payments', element: <PortalPaymentsPage />, roles: ['customer'] },
  { path: '/portal/profile', element: <PortalProfilePage />, roles: ['customer'] },
];
