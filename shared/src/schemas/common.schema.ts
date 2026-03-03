import { z } from 'zod';
import { LIMITS } from '../constants.js';

// Базовый ID
export const idSchema = z.number().int().positive();
export const uuidSchema = z.string().uuid();

// Пагинация
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(200).optional(),
  sortBy: z.string().max(50).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// Тег
export const tagSchema = z.object({
  id: idSchema.optional(),
  name: z.string().min(LIMITS.TAG_NAME_MIN).max(LIMITS.TAG_NAME_MAX).trim(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

export const createTagSchema = tagSchema.omit({ id: true });

// API ответ
export const apiResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.string().optional(),
    message: z.string().optional(),
  });

export const paginatedResponseSchema = <T extends z.ZodType>(itemSchema: T) =>
  z.object({
    success: z.boolean(),
    data: z.object({
      items: z.array(itemSchema),
      total: z.number(),
      page: z.number(),
      limit: z.number(),
      totalPages: z.number(),
    }),
  });