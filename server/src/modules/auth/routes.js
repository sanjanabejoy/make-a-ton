import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/auth.js';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from './schema.js';
import * as authService from './service.js';

export const path = '/api/auth';
export const router = Router();

// Rate limit login: 10 per minute per IP
const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: {
    error: {
      code: 'FORBIDDEN',
      message: 'Too many login attempts, please try again later.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

router.post('/register', validate(registerSchema), async (req, res, next) => {
  try {
    const result = await authService.registerCustomer(req.body);
    res.status(201).json({ data: result });
  } catch (err) {
    next(err);
  }
});

router.post('/login', loginLimiter, validate(loginSchema), async (req, res, next) => {
  try {
    const result = await authService.loginUser(req.body);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

router.post('/forgot-password', validate(forgotPasswordSchema), async (req, res, next) => {
  try {
    const result = await authService.forgotPassword(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/reset-password', validate(resetPasswordSchema), async (req, res, next) => {
  try {
    const result = await authService.resetPassword(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get('/me', authenticate, async (req, res, next) => {
  try {
    const result = await authService.getMe(req.user.id);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

