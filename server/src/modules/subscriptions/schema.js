import { z } from 'zod';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const lineItemSchema = z.object({
  productId: z.number().int().positive('Product ID is required'),
  variantId: z.number().int().positive().nullable().optional(),
  quantity: z.number().int().positive('Quantity must be greater than 0')
});

export const createSubscriptionSchema = z.object({
  customerId: z.number().int().positive('Customer ID is required'),
  planId: z.number().int().positive('Plan ID is required'),
  startDate: z.string().regex(dateRegex, 'startDate must be YYYY-MM-DD'),
  expiryDate: z.string().regex(dateRegex, 'expiryDate must be YYYY-MM-DD'),
  paymentTermId: z.number().int().positive().nullable().optional(),
  notes: z.string().nullable().optional(),
  lines: z.array(lineItemSchema).min(1, 'At least one line is required')
}).refine(data => data.expiryDate >= data.startDate, {
  message: 'expiryDate must be greater than or equal to startDate',
  path: ['expiryDate']
});

export const createFromTemplateSchema = z.object({
  templateId: z.number().int().positive('Template ID is required'),
  customerId: z.number().int().positive('Customer ID is required'),
  startDate: z.string().regex(dateRegex, 'startDate must be YYYY-MM-DD')
});

export const updateSubscriptionSchema = z.object({
  paymentTermId: z.number().int().positive().nullable().optional(),
  notes: z.string().nullable().optional(),
  lines: z.array(lineItemSchema).min(1).optional()
});

export const transitionSchema = z.object({
  to: z.enum(['draft', 'quotation', 'confirmed', 'active', 'closed'])
});

export const closeSchema = z.object({
  reason: z.enum(['cancelled', 'early_close', 'expired', 'quote_expired', 'churned']).default('early_close')
});

export const renewSchema = z.object({
  newExpiryDate: z.string().regex(dateRegex, 'newExpiryDate must be YYYY-MM-DD').optional()
});

