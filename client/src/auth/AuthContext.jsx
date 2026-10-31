import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import http from '../api/http';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('subscriptiq_token'));
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('subscriptiq_user');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(false);

  const getHomeRoute = (role) => {
    if (role === 'customer') return '/portal';
    return '/dashboard';
  };

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const res = await http.post('/auth/login', { email, password });
      // res unwrapped by http interceptor contains { token, user } or { data: { token, user } }
      const payload = res.data || res;
      const { token: authToken, user: userData } = payload;
      setToken(authToken);
      setUser(userData);
      localStorage.setItem('subscriptiq_token', authToken);
      localStorage.setItem('subscriptiq_user', JSON.stringify(userData));
      return userData;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async ({ name, email, password }) => {
    setIsLoading(true);
    try {
      const res = await http.post('/auth/register', { name, email, password });
      const payload = res.data || res;
      if (payload.token && payload.user) {
        setToken(payload.token);
        setUser(payload.user);
        localStorage.setItem('subscriptiq_token', payload.token);
        localStorage.setItem('subscriptiq_user', JSON.stringify(payload.user));
      }
      return payload;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('subscriptiq_token');
    localStorage.removeItem('subscriptiq_user');
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        logout,
        getHomeRoute,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
