import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_URL || '/api';

export const http = axios.create({
  baseURL: apiBaseUrl.replace(/\/$/, ''),
  headers: {
    'Content-Type': 'application/json',
  },
});

http.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('subscriptiq_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

http.interceptors.response.use(
  (response) => {
    // Unwraps {data, meta} if returned by API envelope
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return response.data;
    }
    return response.data;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear session and redirect to /login
      localStorage.removeItem('subscriptiq_token');
      localStorage.removeItem('subscriptiq_user');
      if (window.location.pathname !== '/login' && !window.location.pathname.startsWith('/reset-password')) {
        window.location.href = '/login';
      }
    }

    const payload = error.response?.data?.error || error.response?.data || {};
    const normalizedError = {
      status: error.response?.status || 500,
      code: payload.code || (error.response?.status === 409 ? 'CONFLICT' : 'INTERNAL_ERROR'),
      message: payload.message || error.message || 'An unexpected error occurred',
      details: payload.details || null,
    };

    return Promise.reject(normalizedError);
  }
);

export default http;
