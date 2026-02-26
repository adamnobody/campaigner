import { z } from 'zod';
import { LIMITS } from '../constants.js';
import { idSchema, tagSchema } from './common.schema.js';

export const timelineEventSchema = z.object({
  id: idSchema,
  projectId: idSchema,
  title: z.string().min(LIMITS.TIMELINE_EVENT_TITLE_MIN).max(LIMITS.TIMELINE_EVENT_TITLE_MAX).trim(),
  description: z.string().max(LIMITS.TIMELINE_EVENT_DESCRIPTION_MAX).optional().default(''),
  eventDate: z.string().max(100), // Свободный формат даты (игровой мир может иметь свой календарь)
  sortOrder: z.number().int().default(0), // Для ручной сортировки
  era: z.string().max(200).optional().default(''),
  tags: z.array(tagSchema).max(LIMITS.MAX_TAGS_PER_ENTITY).optional().default([]),
  linkedNoteId: idSchema.nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const createTimelineEventSchema = timelineEventSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  tags: true,
});

export const updateTimelineEventSchema = timelineEventSchema
  .omit({ id: true, projectId: true, createdAt: true, updatedAt: true })
  .partial();