import { z } from 'zod';
import { idSchema } from './common.schema.js';

export const characterTraitSchema = z.object({
  id: idSchema,
  projectId: idSchema,
  name: z.string().min(1),
  description: z.string().default(''),
  imagePath: z.string().default(''),
  isPredefined: z.boolean(),
  exclusions: z.array(idSchema).default([]),
  sortOrder: z.number().int().default(0),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const createCharacterTraitBodySchema = z.object({
  projectId: idSchema,
  name: z.string().min(1).max(200).trim(),
  description: z.string().max(10000).optional().default(''),
  imagePath: z.string().max(2000).optional().default(''),
  excludedIds: z.array(idSchema).optional().default([]),
});

export const updateTraitExclusionsBodySchema = z.object({
  excludedIds: z.array(idSchema).default([]),
});

export const assignTraitBodySchema = z.object({
  characterId: idSchema,
  traitId: idSchema,
});

export const unassignTraitBodySchema = assignTraitBodySchema;
