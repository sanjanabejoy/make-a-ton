import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

export function RoleGuard({ children, roles }) {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && roles.length > 0 && !roles.includes(user.role)) {
    // Redirect to the proper home for this user's role
    const dest = user.role === 'customer' ? '/portal' : '/dashboard';
    return <Navigate to={dest} replace />;
  }

  return children;
}

export default RoleGuard;
