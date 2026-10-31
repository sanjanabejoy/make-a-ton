import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../../db/pool.js';
import { config } from '../../config.js';
import { sendMail } from '../../lib/mailer.js';

export async function registerCustomer({ name, email, password }) {
  const normalizedEmail = email.trim().toLowerCase();

  // Check unique email
  const existing = await pool.query('SELECT id FROM users WHERE lower(email) = $1', [normalizedEmail]);
  if (existing.rows.length > 0) {
    const err = new Error('Email already registered');
    err.code = 'CONFLICT';
    err.status = 409;
    err.details = { email: 'Already registered' };
    throw err;
  }

  const hash = bcrypt.hashSync(password, 10);

  // Insert user
  const userRes = await pool.query(
    `INSERT INTO users (name, email, password_hash, role, is_active)
     VALUES ($1, $2, $3, 'customer', true)
     RETURNING id, name, email, role, is_active`,
    [name.trim(), normalizedEmail, hash]
  );
  const user = userRes.rows[0];

  // Link existing customer or create new
  let customerId = null;
  const existingCustomer = await pool.query(
    'SELECT id FROM customers WHERE lower(email) = $1 AND user_id IS NULL',
    [normalizedEmail]
  );

  if (existingCustomer.rows.length > 0) {
    customerId = existingCustomer.rows[0].id;
    await pool.query('UPDATE customers SET user_id = $1, name = $2 WHERE id = $3', [user.id, user.name, customerId]);
  } else {
    const newCust = await pool.query(
      'INSERT INTO customers (user_id, name, email) VALUES ($1, $2, $3) RETURNING id',
      [user.id, user.name, user.email]
    );
    customerId = newCust.rows[0].id;
  }

  const token = jwt.sign(
    { sub: user.id, role: user.role, customerId },
    config.jwtSecret,
    { expiresIn: '8h' }
  );

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      customerId,
      isActive: user.is_active
    }
  };
}

export async function loginUser({ email, password }) {
  const normalizedEmail = email.trim().toLowerCase();

  const res = await pool.query(
    'SELECT id, name, email, password_hash, role, is_active FROM users WHERE lower(email) = $1',
    [normalizedEmail]
  );

  if (res.rows.length === 0) {
    const err = new Error('Invalid email or password');
    err.code = 'UNAUTHENTICATED';
    err.status = 401;
    throw err;
  }

  const user = res.rows[0];

  if (!user.is_active) {
    const err = new Error('Account is deactivated');
    err.code = 'UNAUTHENTICATED';
    err.status = 401;
    throw err;
  }

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) {
    const err = new Error('Invalid email or password');
    err.code = 'UNAUTHENTICATED';
    err.status = 401;
    throw err;
  }

  let customerId = null;
  if (user.role === 'customer') {
    const custRes = await pool.query('SELECT id FROM customers WHERE user_id = $1', [user.id]);
    if (custRes.rows.length > 0) {
      customerId = custRes.rows[0].id;
    }
  }

  const token = jwt.sign(
    { sub: user.id, role: user.role, customerId },
    config.jwtSecret,
    { expiresIn: '8h' }
  );

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      customerId,
      isActive: user.is_active
    }
  };
}

export async function forgotPassword({ email }) {
  const normalizedEmail = email.trim().toLowerCase();
  const res = await pool.query('SELECT id, email, name FROM users WHERE lower(email) = $1', [normalizedEmail]);

  let devResetLink = null;

  if (res.rows.length > 0) {
    const user = res.rows[0];
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await pool.query(
      `INSERT INTO password_resets (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, tokenHash, expiresAt]
    );

    const resetUrl = `${config.appUrl}/reset-password/${rawToken}`;
    devResetLink = resetUrl;

    await sendMail({
      to: user.email,
      subject: 'Reset your password - SubscriptIQ',
      body: `<p>Hello ${user.name},</p><p>Click <a href="${resetUrl}">here</a> to reset your password. This link is valid for 1 hour.</p>`,
      kind: 'password_reset'
    });
  }

  return {
    message: 'If this email is registered, a reset link has been sent.',
    ...(config.demoMode && devResetLink ? { devResetLink } : {})
  };
}

export async function resetPassword({ token, password }) {
  const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');

  const res = await pool.query(
    `SELECT id, user_id, expires_at, used_at
     FROM password_resets
     WHERE token_hash = $1`,
    [tokenHash]
  );

  if (res.rows.length === 0 || res.rows[0].used_at !== null || new Date(res.rows[0].expires_at) < new Date()) {
    const err = new Error('Invalid or expired password reset token');
    err.code = 'VALIDATION_ERROR';
    err.status = 422;
    throw err;
  }

  const resetRecord = res.rows[0];
  const newHash = bcrypt.hashSync(password, 10);

  await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, resetRecord.user_id]);
  await pool.query('UPDATE password_resets SET used_at = now() WHERE id = $1', [resetRecord.id]);

  return { message: 'Password has been reset successfully.' };
}

export async function getMe(userId) {
  const res = await pool.query(
    'SELECT id, name, email, role, is_active FROM users WHERE id = $1',
    [userId]
  );

  if (res.rows.length === 0) {
    const err = new Error('User not found');
    err.code = 'NOT_FOUND';
    err.status = 404;
    throw err;
  }

  const user = res.rows[0];
  let customerId = null;

  if (user.role === 'customer') {
    const custRes = await pool.query('SELECT id FROM customers WHERE user_id = $1', [user.id]);
    if (custRes.rows.length > 0) {
      customerId = custRes.rows[0].id;
    }
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    customerId,
    isActive: user.is_active
  };
}

