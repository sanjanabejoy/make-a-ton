import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { config } from './config.js';
import authRoutes from './modules/auth/routes.js';
import staffRoutes from './modules/staff/routes.js';
import invoiceRoutes from './modules/invoices/routes.js';
import paymentRoutes from './modules/payments/routes.js';
import subscriptionRoutes from './modules/subscriptions/routes.js';

export const app = express();
app.use(helmet());
app.use(cors({ origin: config.appUrl }));
app.use(express.json({ limit: '1mb' }));
app.use((req, res, next) => {
  const started = Date.now();
  const originalEnd = res.end;
  res.end = function end(...args) {
    const elapsed = Date.now() - started;
    if (!res.headersSent) res.setHeader('X-Response-Time', `${elapsed}ms`);
    if (elapsed > 1500) console.warn(`Slow request ${req.method} ${req.originalUrl}: ${elapsed}ms`);
    return originalEnd.apply(this, args);
  };
  next();
});
app.get('/api/health', (_req, res) => res.json({ data: { ok: true } }));
app.use('/api/auth', authRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/payments', paymentRoutes);
app.use((_req, _res, next) => next(Object.assign(new Error('Route not found'), { code: 'NOT_FOUND', status: 404 })));
app.use((err, _req, res, _next) => {
  const status = err.status || (err.code === 'VALIDATION_ERROR' ? 422 : 500);
  const details = err.issues?.map((issue) => ({ path: issue.path.join('.'), message: issue.message }));
  res.status(status).json({ error: { code: err.code || 'INTERNAL_ERROR', message: status === 500 ? 'Internal server error' : err.message, ...(details ? { details } : {}) } });
});
