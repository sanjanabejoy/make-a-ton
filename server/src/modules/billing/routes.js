import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/requireRole.js';
import { validate } from '../../middleware/validate.js';
import { pool } from '../../db/pool.js';
import { parsePagination } from '../../lib/pagination.js';
import { runBilling } from './runner.js';
import { previewBilling } from './preview.js';

export const path = '/api/billing';
export const router = Router();

router.use(authenticate, requireRole('admin', 'staff'));

const runSchema = z.object({
  asOfDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
});

const previewSchema = z.object({
  asOfDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});

router.post('/run', validate(runSchema), async (req, res, next) => {
  try {
    const result = await runBilling({
      asOfDate: req.body.asOfDate,
      dryRun: false,
      actorId: req.user.id
    });
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

router.post('/preview', validate(previewSchema), async (req, res, next) => {
  try {
    const result = await previewBilling(req.body.asOfDate);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

router.get('/runs', async (req, res, next) => {
  try {
    const { limit, offset, orderBy } = parsePagination(req.query, ['id', 'as_of_date', 'created_at'], 'created_at:desc');

    const countRes = await pool.query('SELECT COUNT(*) FROM billing_runs');
    const total = parseInt(countRes.rows[0].count, 10);

    const rowsRes = await pool.query(
      `SELECT r.id, r.as_of_date AS "asOfDate", r.dry_run AS "dryRun",
              r.status, r.scanned, r.invoices_created AS "invoicesCreated",
              r.total_amount AS "totalAmount", r.errors,
              r.created_at AS "createdAt", r.finished_at AS "finishedAt",
              u.name AS "startedByName"
       FROM billing_runs r
       LEFT JOIN users u ON u.id = r.started_by
       ORDER BY r.${orderBy}
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.json({
      data: rowsRes.rows,
      meta: {
        page: Math.floor(offset / limit) + 1,
        pageSize: limit,
        total
      }
    });
  } catch (err) {
    next(err);
  }
});

router.get('/runs/:id', async (req, res, next) => {
  try {
    const resRow = await pool.query(
      `SELECT r.id, r.as_of_date AS "asOfDate", r.dry_run AS "dryRun",
              r.status, r.scanned, r.invoices_created AS "invoicesCreated",
              r.total_amount AS "totalAmount", r.errors,
              r.created_at AS "createdAt", r.finished_at AS "finishedAt",
              u.name AS "startedByName"
       FROM billing_runs r
       LEFT JOIN users u ON u.id = r.started_by
       WHERE r.id = $1`,
      [req.params.id]
    );

    if (resRow.rows.length === 0) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Billing run not found' }
      });
    }

    res.json({ data: resRow.rows[0] });
  } catch (err) {
    next(err);
  }
});

