import { z } from 'zod';
import { passwordRegex } from '../auth/schema.js';

export const createStaffSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().regex(
    passwordRegex,
    'Password must be at least 9 characters long and contain at least one uppercase letter, one lowercase letter, and one special character'
  )
});

export const updateStaffSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  isActive: z.boolean().optional()
});
