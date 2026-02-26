import { z } from 'zod';
import { LIMITS, MARKER_COLORS, MARKER_ICONS } from '../constants.js';
import { idSchema } from './common.schema.js';

export const mapMarkerSchema = z.object({
  id: idSchema,
  projectId: idSchema,
  title: z.string().min(LIMITS.MARKER_TITLE_MIN).max(LIMITS.MARKER_TITLE_MAX).trim(),
  description: z.string().max(LIMITS.MARKER_DESCRIPTION_MAX).optional().default(''),
  positionX: z.number().min(0).max(1), // Нормализованные координаты 0-1
  positionY: z.number().min(0).max(1),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#FF6B6B'),
  icon: z.enum(MARKER_ICONS).default('custom'),
  linkedNoteId: z.number().int().positive().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const createMarkerSchema = mapMarkerSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateMarkerSchema = mapMarkerSchema
  .omit({ id: true, projectId: true, createdAt: true, updatedAt: true })
  .partial();