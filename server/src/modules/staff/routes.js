import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/requireRole.js';
import { validate } from '../../middleware/validate.js';
import { createStaffSchema, updateStaffSchema } from './schema.js';
import * as staffService from './service.js';

export const path = '/api/staff';
export const router = Router();

router.use(authenticate, requireRole('admin'));

router.get('/', async (req, res, next) => {
  try {
    const result = await staffService.listStaff(req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/', validate(createStaffSchema), async (req, res, next) => {
  try {
    const result = await staffService.createStaff(req.body, req.user.id);
    res.status(201).json({ data: result });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', validate(updateStaffSchema), async (req, res, next) => {
  try {
    const result = await staffService.updateStaff(req.params.id, req.body);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

