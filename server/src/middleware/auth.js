import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export function authenticate(req, res, next) {
  // 1. Dev auth bypass (Contract §3.2) - dev only!
  if (config.devAuthBypass && config.nodeEnv !== 'production') {
    const devRole = req.headers['x-dev-role'];
    if (devRole && ['admin', 'staff', 'customer'].includes(devRole)) {
      const devCustomerId = req.headers['x-dev-customer-id']
        ? parseInt(req.headers['x-dev-customer-id'], 10)
        : (devRole === 'customer' ? 1 : null);

      req.user = {
        id: devRole === 'admin' ? 1 : devRole === 'staff' ? 2 : 3,
        role: devRole,
        customerId: devCustomerId
      };
      return next();
    }
  }

  // 2. JWT verification
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHENTICATED',
        message: 'Authentication token required'
      }
    });
  }

  const token = authHeader.slice(7).trim();
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.user = {
      id: payload.sub,
      role: payload.role,
      customerId: payload.customerId || null
    };
    return next();
  } catch (err) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHENTICATED',
        message: 'Invalid or expired token'
      }
    });
  }
}
