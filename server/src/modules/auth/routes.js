import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { query, pool } from '../../db/pool.js';
import { config } from '../../config.js';
import { auth, passwordSchema, validate } from '../../middleware/auth.js';
import { sendMail } from '../../lib/mailer.js';

const router = Router();
const credentials = z.object({ email: z.string().email().transform((v) => v.toLowerCase()), password: z.string() });
const registration = z.object({ name: z.string().min(1), email: z.string().email().transform((v) => v.toLowerCase()), password: passwordSchema });
const badCredentials = () => Object.assign(new Error('Invalid email or password'), { code: 'UNAUTHENTICATED', status: 401 });
const userShape = (row) => ({ id: Number(row.id), name: row.name, email: row.email, role: row.role, customerId: row.customer_id ? Number(row.customer_id) : null });
const tokenFor = (user) => jwt.sign({ sub: user.id, role: user.role, customerId: user.customerId }, config.jwtSecret, { expiresIn: '8h' });

router.post('/register', validate(registration), async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const existing = await client.query('SELECT id FROM users WHERE lower(email)=lower($1)', [req.body.email]);
    if (existing.rowCount) throw Object.assign(new Error('Email is already registered'), { code: 'CONFLICT', status: 409, details: { email: 'Email is already registered' } });
    const hash = await bcrypt.hash(req.body.password, 10);
    const user = await client.query("INSERT INTO users(email,password_hash,name,role) VALUES($1,$2,$3,'customer') RETURNING id,name,email,role", [req.body.email, hash, req.body.name]);
    const customer = await client.query('INSERT INTO customers(user_id,name,email) VALUES($1,$2,$3) RETURNING id', [user.rows[0].id, req.body.name, req.body.email]);
    await client.query('COMMIT');
    const shaped = { ...userShape({ ...user.rows[0], customer_id: customer.rows[0].id }) };
    res.status(201).json({ data: { token: tokenFor(shaped), user: shaped } });
  } catch (error) { await client.query('ROLLBACK'); next(error); } finally { client.release(); }
});

router.post('/login', rateLimit({ windowMs: 60_000, limit: 10, standardHeaders: true, legacyHeaders: false }), validate(credentials), async (req, res, next) => {
  try {
    const { rows } = await query('SELECT u.*, c.id AS customer_id FROM users u LEFT JOIN customers c ON c.user_id=u.id WHERE lower(u.email)=lower($1)', [req.body.email]);
    if (!rows[0] || !rows[0].is_active || !(await bcrypt.compare(req.body.password, rows[0].password_hash))) throw badCredentials();
    const user = userShape(rows[0]);
    res.json({ data: { token: tokenFor(user), user } });
  } catch (error) { next(error); }
});

router.get('/me', auth, async (req, res, next) => {
  try { const { rows } = await query('SELECT u.*, c.id AS customer_id FROM users u LEFT JOIN customers c ON c.user_id=u.id WHERE u.id=$1', [req.user.id]); if (!rows[0]) throw Object.assign(new Error('User not found'), { code: 'NOT_FOUND', status: 404 }); res.json({ data: { user: userShape(rows[0]) } }); } catch (error) { next(error); }
});

router.post('/forgot-password', async (req, res, next) => {
  try {
    const email = String(req.body.email || '').toLowerCase();
    const { rows } = await query('SELECT id FROM users WHERE lower(email)=lower($1) AND is_active=true', [email]);
    let devResetLink;
    if (rows[0]) {
      const raw = crypto.randomBytes(32).toString('hex');
      await query('INSERT INTO password_resets(user_id,token_hash,expires_at) VALUES($1,$2,now()+interval \'1 hour\')', [rows[0].id, crypto.createHash('sha256').update(raw).digest('hex')]);
      devResetLink = `${config.appUrl}/reset-password/${raw}`;
      await sendMail({ to: email, subject: 'Reset your SubscriptIQ password', text: `Reset your password: ${devResetLink}`, kind: 'password_reset' });
    }
    res.json({ data: { message: 'If the email exists, a password reset link has been dispatched.', ...(config.demoMode && devResetLink ? { devResetLink } : {}) } });
  } catch (error) { next(error); }
});

router.post('/reset-password', validate(z.object({ token: z.string().min(1), password: passwordSchema })), async (req, res, next) => {
  const client = await pool.connect();
  try {
    const hash = crypto.createHash('sha256').update(req.body.token).digest('hex');
    const { rows } = await client.query('SELECT * FROM password_resets WHERE token_hash=$1 AND used_at IS NULL AND expires_at>now()', [hash]);
    if (!rows[0]) throw Object.assign(new Error('Invalid or expired reset token'), { code: 'VALIDATION_ERROR', status: 422 });
    await client.query('BEGIN'); await client.query('UPDATE users SET password_hash=$1 WHERE id=$2', [await bcrypt.hash(req.body.password, 10), rows[0].user_id]); await client.query('UPDATE password_resets SET used_at=now() WHERE id=$1', [rows[0].id]); await client.query('COMMIT');
    res.json({ data: { message: 'Password reset successfully' } });
  } catch (error) { try { await client.query('ROLLBACK'); } catch {} next(error); } finally { client.release(); }
});
export default router;
