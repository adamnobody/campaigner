import { z } from 'zod';
import { idSchema } from './common.schema.js';

export const ambitionSchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  description: z.string().default(''),
  iconPath: z.string().default(''),
  isCustom: z.boolean(),
  exclusions: z.array(idSchema).default([]),
  projectId: idSchema.nullable(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const createAmbitionBodySchema = z.object({
  projectId: idSchema,
  name: z.string().min(1).max(200).trim(),
  description: z.string().max(10000).optional().default(''),
  iconPath: z.string().max(2000).optional().default(''),
  excludedIds: z.array(idSchema).optional().default([]),
});

export const updateAmbitionBodySchema = z.object({
  name: z.string().min(1).max(200).trim().optional(),
  description: z.string().max(10000).optional(),
  iconPath: z.string().max(2000).optional(),
});

export const updateAmbitionExclusionsBodySchema = z.object({
  excludedIds: z.array(idSchema).default([]),
});

export const assignFactionAmbitionBodySchema = z.object({
  ambitionId: idSchema,
});
