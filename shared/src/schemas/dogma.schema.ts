import { z } from 'zod';
import { LIMITS, DOGMA_CATEGORIES, DOGMA_IMPORTANCE, DOGMA_STATUSES } from '../constants.js';
import { idSchema, tagSchema } from './common.schema.js';

export const dogmaSchema = z.object({
  id: idSchema,
  projectId: idSchema,
  title: z.string().min(LIMITS.DOGMA_TITLE_MIN).max(LIMITS.DOGMA_TITLE_MAX).trim(),
  category: z.enum(DOGMA_CATEGORIES),
  description: z.string().max(LIMITS.DOGMA_DESCRIPTION_MAX).optional().default(''),
  impact: z.string().max(LIMITS.DOGMA_IMPACT_MAX).optional().default(''),
  exceptions: z.string().max(LIMITS.DOGMA_EXCEPTIONS_MAX).optional().default(''),
  isPublic: z.boolean().default(true),
  importance: z.enum(DOGMA_IMPORTANCE).default('major'),
  status: z.enum(DOGMA_STATUSES).default('active'),
  sortOrder: z.number().int().default(0),
  icon: z.string().max(10).optional().default(''),
  color: z.string().max(20).optional().default(''),
  tags: z.array(tagSchema).max(LIMITS.MAX_TAGS_PER_ENTITY).optional().default([]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const createDogmaSchema = dogmaSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  tags: true,
});

export const updateDogmaSchema = dogmaSchema
  .omit({ id: true, projectId: true, createdAt: true, updatedAt: true, tags: true })
  .partial();