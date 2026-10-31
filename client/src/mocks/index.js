import http from '../api/http';
import axios from 'axios';
import p3Mocks from './p3';
import p4Mocks from './p4';

export function setupMocks() {
  if (import.meta.env.VITE_USE_MOCKS !== 'true') {
    console.log('[SubscriptIQ] Running with REAL backend');
    return;
  }

  console.log('[SubscriptIQ] Running with MOCKS active (VITE_USE_MOCKS=true)');
  const defaultAdapter = axios.defaults.adapter;

  http.defaults.adapter = async function mockAdapter(config) {
    const method = (config.method || 'get').toUpperCase();
    const url = config.url || '';

    // Strip baseURL /api if present, and query string
    let path = url.replace(/^\/api/, '');
    if (!path.startsWith('/')) path = '/' + path;
    const [pathname, search] = path.split('?');
    const searchParams = new URLSearchParams(search || '');

    // Parse body if JSON string
    let parsedData = config.data;
    if (typeof config.data === 'string') {
      try {
        parsedData = JSON.parse(config.data);
      } catch (e) {
        // keep as is
      }
    }

    const req = {
      method,
      url,
      path: pathname,
      params: searchParams,
      body: parsedData,
      headers: config.headers,
    };

    // Combine mocks from P3 and P4
    const allMocks = [...(Array.isArray(p3Mocks) ? p3Mocks : []), ...(Array.isArray(p4Mocks) ? p4Mocks : [])];

    for (const mock of allMocks) {
      if (mock.method.toUpperCase() === method) {
        const match = pathname.match(mock.match);
        if (match) {
          // Simulate latency
          await new Promise((r) => setTimeout(r, 150 + Math.random() * 150));

          try {
            const result = await mock.handler({ ...req, match });
            const status = result.status || 200;
            const data = result.data !== undefined ? result.data : result;

            if (status >= 400) {
              const err = new Error(data?.error?.message || 'Request failed with status ' + status);
              err.response = {
                status,
                data: data || { error: { code: 'ERROR', message: err.message } },
                headers: {},
                config,
              };
              return Promise.reject(err);
            }

            return {
              data,
              status,
              statusText: 'OK',
              headers: {},
              config,
            };
          } catch (handlerErr) {
            const status = handlerErr.status || 500;
            const err = new Error(handlerErr.message || 'Internal mock error');
            err.response = {
              status,
              data: {
                error: {
                  code: handlerErr.code || 'INTERNAL_ERROR',
                  message: handlerErr.message || 'Error executing mock handler',
                  details: handlerErr.details || null,
                },
              },
              headers: {},
              config,
            };
            return Promise.reject(err);
          }
        }
      }
    }

    // Unmatched: fallback to real network request
    if (typeof defaultAdapter === 'function') {
      return defaultAdapter(config);
    }
    return Promise.reject(new Error(`No mock handler matched for ${method} ${path}`));
  };
}

export default setupMocks;
