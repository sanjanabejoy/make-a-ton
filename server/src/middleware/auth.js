import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { config } from '../config.js';

export function auth(req, _res, next) {
  const header = req.get('authorization');
  if (config.devAuthBypass && !header) {
    req.user = { id: 1, role: 'admin', customerId: null };
    return next();
  }
  if (!header?.startsWith('Bearer ')) return next(Object.assign(new Error('Authentication required'), { code: 'UNAUTHENTICATED', status: 401 }));
  try {
    const payload = jwt.verify(header.slice(7), config.jwtSecret);
    req.user = { id: Number(payload.sub), role: payload.role, customerId: payload.customerId ? Number(payload.customerId) : null };
    next();
  } catch {
    next(Object.assign(new Error('Authentication required'), { code: 'UNAUTHENTICATED', status: 401 }));
  }
}

export function requireRole(...roles) {
  return (req, _res, next) => roles.includes(req.user?.role)
    ? next()
    : next(Object.assign(new Error('You do not have permission to perform this action'), { code: req.user ? 'FORBIDDEN' : 'UNAUTHENTICATED', status: req.user ? 403 : 401 }));
}

export function validate(schema, source = 'body') {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) return next(Object.assign(result.error, { code: 'VALIDATION_ERROR', status: 422 }));
    req[source] = result.data;
    next();
  };
}

export const passwordSchema = z.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{9,}$/, 'Password must be at least 9 characters and include upper, lower, and special characters');
