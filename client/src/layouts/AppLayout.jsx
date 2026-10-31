import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Menu,
  X,
  LogOut,
  Search,
  Sparkles,
  ChevronDown,
  Clock,
  RotateCcw,
  Zap,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import http from '../api/http';
import navP3 from '../nav.p3';
import navP4 from '../nav.p4';
import { cn } from '../lib/utils';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Merge navigation groups
  const mergedNav = [...navP3, ...(Array.isArray(navP4) ? navP4 : [])];

  // Fetch clock / simulated date
  const { data: clockData } = useQuery({
    queryKey: ['clock'],
    queryFn: async () => {
      try {
        const res = await http.get('/clock');
        return res.data || res;
      } catch {
        return { isSimulated: false, date: null };
      }
    },
    refetchInterval: 10000,
  });

  // Reset clock mutation
  const resetClockMutation = useMutation({
    mutationFn: async () => {
      return await http.post('/clock/reset');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clock'] });
    },
  });

  const handleGlobalSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const q = searchQuery.trim();
    if (q.toUpperCase().startsWith('INV-')) {
      navigate(`/invoices?q=${encodeURIComponent(q)}`);
    } else if (q.toUpperCase().startsWith('SUB-')) {
      navigate(`/subscriptions?q=${encodeURIComponent(q)}`);
    } else {
      navigate(`/customers?q=${encodeURIComponent(q)}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Simulated Date Banner */}
      {clockData?.isSimulated && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-medium flex items-center justify-between shadow-xs sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 shrink-0 text-slate-950" />
            <span>
              <strong>Simulated Billing Date:</strong> {clockData.date}
            </span>
          </div>
          {user?.role === 'admin' && (
            <button
              onClick={() => resetClockMutation.mutate()}
              disabled={resetClockMutation.isPending}
              className="inline-flex items-center gap-1 bg-slate-950 text-white px-2.5 py-1 rounded-md text-xs hover:bg-slate-800 transition font-medium cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" />
              Reset to Real Date
            </button>
          )}
        </div>
      )}

      <div className="flex flex-1">
        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-200 lg:static lg:translate-x-0',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          {/* Logo & Brand */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-soft">
                <Zap className="h-5 w-5 fill-current" />
              </div>
              <span className="font-bold text-lg text-white tracking-tight">SubscriptIQ</span>
            </div>
            <button
              className="lg:hidden text-slate-400 hover:text-white p-1"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Nav Items */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
            {mergedNav.map((group, groupIdx) => {
              // Filter items by current user role
              const visibleItems = group.items.filter(
                (item) => !item.roles || item.roles.includes(user?.role)
              );
              if (visibleItems.length === 0) return null;

              return (
                <div key={groupIdx} className="space-y-1">
                  {group.group && (
                    <div className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      {group.group}
                    </div>
                  )}
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.href}
                        to={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={({ isActive }) =>
                          cn(
                            'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                            isActive
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                          )
                        }
                      >
                        {Icon && <Icon className="h-4 w-4 shrink-0" />}
                        <span>{item.name}</span>
                      </NavLink>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* User profile footer in sidebar */}
          <div className="p-4 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-8 w-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs uppercase border border-indigo-500/30">
                  {user?.name?.[0] || 'U'}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
                  <p className="text-[11px] text-slate-400 truncate capitalize">{user?.role}</p>
                </div>
              </div>
              <button
                onClick={logout}
                title="Log out"
                className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg transition hover:bg-slate-800"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Bar */}
          <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-30 shadow-xs">
            <div className="flex items-center gap-3">
              <button
                className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </button>

              {/* Global search */}
              <form onSubmit={handleGlobalSearch} className="relative w-64 sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search customers, SUB-..., INV-..."
                  className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 rounded-lg border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition"
                />
              </form>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2">
                <Badge variant={user?.role === 'admin' ? 'purple' : 'blue'}>
                  {user?.role?.toUpperCase()}
                </Badge>
              </div>

              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition text-slate-700"
                >
                  <div className="h-7 w-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs uppercase">
                    {user?.name?.[0] || 'U'}
                  </div>
                  <span className="text-xs font-medium hidden md:inline-block">{user?.name}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white shadow-soft-lg border border-slate-200 py-1.5 text-xs z-50 animate-in fade-in">
                    <div className="px-3 py-2 border-b border-slate-100">
                      <p className="font-semibold text-slate-900">{user?.name}</p>
                      <p className="text-slate-500 truncate">{user?.email}</p>
                    </div>
                    {user?.role === 'admin' && (
                      <NavLink
                        to="/settings"
                        onClick={() => setUserDropdownOpen(false)}
                        className="block px-3 py-2 text-slate-700 hover:bg-slate-50 font-medium"
                      >
                        App Settings
                      </NavLink>
                    )}
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        logout();
                      }}
                      className="w-full text-left px-3 py-2 text-rose-600 hover:bg-rose-50 font-medium flex items-center gap-2"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Page Outlet */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

export default AppLayout;
