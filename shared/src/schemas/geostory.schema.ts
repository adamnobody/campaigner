import { z } from 'zod';
import { idSchema } from './common.schema.js';

export const geoStoryActionTypeSchema = z.enum([
  'claim',
  'split',
  'merge',
  'rename',
  'style_change',
  'marker_move',
  'territory_geometry',
]);

export const geoStoryEventSchema = z.object({
  id: idSchema,
  projectId: idSchema,
  branchId: idSchema,
  title: z.string().min(1).max(200).trim(),
  description: z.string().max(3000).optional().default(''),
  eventDate: z.string().max(100),
  sortOrder: z.number().int().default(0),
  mapId: idSchema.nullable().optional(),
  territoryId: idSchema.nullable().optional(),
  actionType: geoStoryActionTypeSchema,
  payloadJson: z.unknown(),
  linkedNoteId: idSchema.nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const createGeoStoryEventSchema = geoStoryEventSchema
  .omit({ id: true, createdAt: true, updatedAt: true });

export const updateGeoStoryEventSchema = geoStoryEventSchema
  .omit({ id: true, projectId: true, branchId: true, createdAt: true, updatedAt: true })
  .partial();

export const geoStoryListQuerySchema = z.object({
  projectId: z.coerce.number().int().positive(),
  branchId: z.coerce.number().int().positive(),
  mapId: z.coerce.number().int().positive().optional(),
  territoryId: z.coerce.number().int().positive().optional(),
});
