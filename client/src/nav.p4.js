import {
  FileText,
  CreditCard,
  Clock,
  LayoutDashboard,
  ShieldAlert,
  Sparkles,
  FileSpreadsheet,
  Mail,
} from 'lucide-react';

export default [
  {
    group: 'Billing',
    items: [
      {
        name: 'Invoices',
        href: '/invoices',
        icon: FileText,
        roles: ['admin', 'staff'],
      },
      {
        name: 'Payments',
        href: '/payments',
        icon: CreditCard,
        roles: ['admin', 'staff'],
      },
      {
        name: 'Time Machine',
        href: '/billing',
        icon: Clock,
        roles: ['admin', 'staff'],
      },
    ],
  },
  {
    group: 'Finance',
    items: [
      {
        name: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        roles: ['admin', 'staff'],
      },
      {
        name: 'Collections',
        href: '/collections',
        icon: ShieldAlert,
        roles: ['admin', 'staff'],
      },
      {
        name: 'Insights',
        href: '/insights',
        icon: Sparkles,
        roles: ['admin', 'staff'],
      },
      {
        name: 'Reconcile',
        href: '/reconcile',
        icon: FileSpreadsheet,
        roles: ['admin', 'staff'],
      },
    ],
  },
  {
    group: 'Developer',
    items: [
      {
        name: 'Dev Mailbox',
        href: '/dev/mailbox',
        icon: Mail,
        roles: ['admin'],
      },
    ],
  },
];
