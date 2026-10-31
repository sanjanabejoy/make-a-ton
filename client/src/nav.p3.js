import {
  Users,
  Layers,
  Box,
  Calendar,
  Receipt,
  Percent,
  Clock,
  FileText,
  UserCheck,
  Settings,
  UploadCloud,
} from 'lucide-react';

export default [
  {
    group: 'Main',
    items: [
      {
        name: 'Customers',
        href: '/customers',
        icon: Users,
        roles: ['admin', 'staff'],
      },
      {
        name: 'Subscriptions',
        href: '/subscriptions',
        icon: Layers,
        roles: ['admin', 'staff'],
      },
    ],
  },
  {
    group: 'Catalog',
    items: [
      {
        name: 'Products',
        href: '/products',
        icon: Box,
        roles: ['admin', 'staff'],
      },
      {
        name: 'Plans',
        href: '/plans',
        icon: Calendar,
        roles: ['admin', 'staff'],
      },
      {
        name: 'Taxes',
        href: '/taxes',
        icon: Receipt,
        roles: ['admin', 'staff'],
      },
      {
        name: 'Discounts',
        href: '/discounts',
        icon: Percent,
        roles: ['admin', 'staff'],
      },
      {
        name: 'Payment Terms',
        href: '/payment-terms',
        icon: Clock,
        roles: ['admin', 'staff'],
      },
      {
        name: 'Quote Templates',
        href: '/quote-templates',
        icon: FileText,
        roles: ['admin', 'staff'],
      },
    ],
  },
  {
    group: 'Administration',
    items: [
      {
        name: 'Migration Centre',
        href: '/migration',
        icon: UploadCloud,
        roles: ['admin'],
      },
      {
        name: 'Staff Accounts',
        href: '/staff',
        icon: UserCheck,
        roles: ['admin'],
      },
      {
        name: 'Settings',
        href: '/settings',
        icon: Settings,
        roles: ['admin'],
      },
    ],
  },
];
