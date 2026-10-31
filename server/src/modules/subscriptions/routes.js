import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/requireRole.js';
import { validate } from '../../middleware/validate.js';
import {
  createSubscriptionSchema,
  createFromTemplateSchema,
  updateSubscriptionSchema,
  transitionSchema,
  closeSchema,
  renewSchema
} from './schema.js';
import * as subService from './service.js';

export const path = '/api/subscriptions';
export const router = Router();

router.use(authenticate, requireRole('admin', 'staff'));

router.get('/', async (req, res, next) => {
  try {
    const result = await subService.listSubscriptions(req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/', validate(createSubscriptionSchema), async (req, res, next) => {
  try {
    const result = await subService.createSubscription(req.body, req.user);
    res.status(201).json({ data: result });
  } catch (err) {
    next(err);
  }
});

router.post('/from-template', validate(createFromTemplateSchema), async (req, res, next) => {
  try {
    const result = await subService.createFromTemplate(req.body, req.user);
    res.status(201).json({ data: result });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const result = await subService.getSubscriptionDetail(req.params.id);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', validate(updateSubscriptionSchema), async (req, res, next) => {
  try {
    const result = await subService.updateSubscription(req.params.id, req.body, req.user);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/transition', validate(transitionSchema), async (req, res, next) => {
  try {
    const result = await subService.transition(req.params.id, req.body.to, req.user);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/pause', async (req, res, next) => {
  try {
    const result = await subService.pause(req.params.id, req.user);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/resume', async (req, res, next) => {
  try {
    const result = await subService.resume(req.params.id, req.user);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/close', validate(closeSchema), async (req, res, next) => {
  try {
    const result = await subService.close(req.params.id, req.body.reason, req.user);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/renew', validate(renewSchema), async (req, res, next) => {
  try {
    const result = await subService.renew(req.params.id, req.body, req.user);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

router.get('/:id/timeline', async (req, res, next) => {
  try {
    const result = await subService.getTimeline(req.params.id);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

router.get('/:id/upcoming-invoice', async (req, res, next) => {
  try {
    const result = await subService.getUpcomingInvoice(req.params.id);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});
