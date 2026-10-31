import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Zap, LogOut, User, Layers, FileText, CreditCard, Sparkles } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { cn } from '../lib/utils';
import Badge from '../components/ui/Badge';

export function PortalLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { name: 'Overview', href: '/portal', icon: Sparkles, exact: true },
    { name: 'Subscriptions', href: '/portal/subscriptions', icon: Layers },
    { name: 'Invoices', href: '/portal/invoices', icon: FileText },
    { name: 'Payments', href: '/portal/payments', icon: CreditCard },
    { name: 'Plans', href: '/portal/plans', icon: Sparkles },
    { name: 'Profile', href: '/portal/profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Customer Header */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <div
                onClick={() => navigate('/portal')}
                className="flex items-center gap-2.5 cursor-pointer"
              >
                <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-soft">
                  <Zap className="h-5 w-5 fill-current" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-bold text-lg text-slate-900 tracking-tight">SubscriptIQ</span>
                  <Badge variant="blue" size="sm">Customer Portal</Badge>
                </div>
              </div>

              {/* Desktop Nav */}
              <nav className="hidden md:flex items-center space-x-1">
                {navItems.map((item) => (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    end={item.exact}
                    className={({ isActive }) =>
                      cn(
                        'px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2',
                        isActive
                          ? 'bg-indigo-50 text-indigo-700 font-semibold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                      )
                    }
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </NavLink>
                ))}
              </nav>
            </div>

            {/* User Profile / Logout */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs uppercase">
                  {user?.name?.[0] || 'C'}
                </div>
                <div className="hidden sm:block text-right">
                  <p className="text-xs font-semibold text-slate-900">{user?.name}</p>
                  <p className="text-[11px] text-slate-500">{user?.email}</p>
                </div>
              </div>

              <button
                onClick={logout}
                title="Log out"
                className="text-slate-400 hover:text-rose-600 p-2 rounded-lg hover:bg-slate-100 transition"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Mobile Nav */}
          <div className="md:hidden flex space-x-1 overflow-x-auto py-2 border-t border-slate-100">
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                end={item.exact}
                className={({ isActive }) =>
                  cn(
                    'px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5',
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  )
                }
              >
                <item.icon className="h-3.5 w-3.5" />
                <span>{item.name}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400">
        <p>© Brightloop Software. Powered by SubscriptIQ.</p>
      </footer>
    </div>
  );
}

export default PortalLayout;
