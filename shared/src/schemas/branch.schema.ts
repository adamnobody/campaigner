import { z } from 'zod';
import { idSchema, uuidSchema } from './common.schema.js';

export const branchEntityTypeSchema = z.enum([
  'map',
  'map_marker',
  'map_territory',
  'timeline_event',
  'note',
]);

export const branchOperationSchema = z.enum(['upsert', 'delete', 'create']);

export const scenarioBranchSchema = z.object({
  id: idSchema,
  projectId: idSchema,
  name: z.string().min(1).max(120).trim(),
  parentBranchId: idSchema.nullable().optional(),
  baseRevision: z.number().int().min(0).default(0),
  isMain: z.boolean().default(false),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const createScenarioBranchSchema = scenarioBranchSchema
  .pick({
    projectId: true,
    name: true,
    parentBranchId: true,
    baseRevision: true,
  })
  .partial({ parentBranchId: true, baseRevision: true });

export const updateScenarioBranchSchema = z.object({
  name: z.string().min(1).max(120).trim().optional(),
});

export const branchOverrideSchema = z.object({
  id: idSchema,
  branchId: idSchema,
  entityType: branchEntityTypeSchema,
  entityId: idSchema,
  op: branchOperationSchema,
  patchJson: z.unknown(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const branchLocalEntitySchema = z.object({
  id: idSchema,
  branchId: idSchema,
  entityType: branchEntityTypeSchema,
  localId: uuidSchema,
  payloadJson: z.unknown(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
