import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/requireRole.js';
import { pool } from '../../db/pool.js';
import { camelize } from '../../lib/case.js';

export const path = '/api/dev';
export const router = Router();

router.get('/emails', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const rows = await pool.query(
      `SELECT id, to_email, subject, body, kind, delivered, created_at
       FROM email_log
       ORDER BY created_at DESC
       LIMIT 100`
    );
    res.json({ data: camelize(rows.rows) });
  } catch (err) {
    next(err);
  }
});

