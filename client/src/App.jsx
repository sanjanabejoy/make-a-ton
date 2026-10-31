import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './auth/AuthContext';
import RoleGuard from './auth/RoleGuard';
import ToastProvider from './components/ui/Toast';
import AppLayout from './layouts/AppLayout';
import PortalLayout from './layouts/PortalLayout';

import routesP3 from './routes.p3';
import routesP4 from './routes.p4';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5000,
    },
  },
});

function RootRedirect() {
  const { isAuthenticated, user, getHomeRoute } = useAuth();
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }
  return <Navigate to={getHomeRoute(user.role)} replace />;
}

export function App() {
  // Merge routes from P3 and P4
  const allRoutes = [...routesP3, ...(Array.isArray(routesP4) ? routesP4 : [])];

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              {/* Root redirect */}
              <Route path="/" element={<RootRedirect />} />

              {/* Render dynamic merged routes */}
              {allRoutes.map((route) => {
                if (route.public) {
                  return (
                    <Route
                      key={route.path}
                      path={route.path}
                      element={route.element}
                    />
                  );
                }

                // Customer Portal routes
                const isCustomerRoute =
                  route.roles?.includes('customer') ||
                  route.path.startsWith('/portal');

                if (isCustomerRoute) {
                  return (
                    <Route
                      key={route.path}
                      path={route.path}
                      element={
                        <RoleGuard roles={route.roles || ['customer']}>
                          <PortalLayout />
                        </RoleGuard>
                      }
                    >
                      <Route index element={route.element} />
                    </Route>
                  );
                }

                // Admin & Staff operations routes
                return (
                  <Route
                    key={route.path}
                    path={route.path}
                    element={
                      <RoleGuard roles={route.roles || ['admin', 'staff']}>
                        <AppLayout />
                      </RoleGuard>
                    }
                  >
                    <Route index element={route.element} />
                  </Route>
                );
              })}

              {/* 404 Fallback */}
              <Route
                path="*"
                element={
                  <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                    <div className="text-center">
                      <h1 className="text-6xl font-extrabold text-indigo-600">404</h1>
                      <h2 className="text-xl font-bold text-slate-900 mt-2">Page Not Found</h2>
                      <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                        The requested page could not be located or you may not have access to it.
                      </p>
                      <div className="mt-6">
                        <RootRedirect />
                      </div>
                    </div>
                  </div>
                }
              />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
