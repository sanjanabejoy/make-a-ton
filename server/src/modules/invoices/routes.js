import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/requireRole.js';
import { validate } from '../../middleware/validate.js';
import * as invoiceService from './service.js';

export const path = '/api/invoices';
export const router = Router();

router.use(authenticate, requireRole('admin', 'staff'));

const bulkConfirmSchema = z.object({
  ids: z.array(z.number().int().positive()).optional(),
  billingRunId: z.number().int().positive().optional()
});

router.get('/', async (req, res, next) => {
  try {
    const result = await invoiceService.listInvoices(req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/bulk-confirm', validate(bulkConfirmSchema), async (req, res, next) => {
  try {
    const result = await invoiceService.bulkConfirm(req.body, req.user);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const result = await invoiceService.getInvoiceDetail(req.params.id);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/confirm', async (req, res, next) => {
  try {
    const result = await invoiceService.confirm(req.params.id, req.user);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/cancel', async (req, res, next) => {
  try {
    const result = await invoiceService.cancel(req.params.id, req.user);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/send', async (req, res, next) => {
  try {
    const result = await invoiceService.send(req.params.id, req.user);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

