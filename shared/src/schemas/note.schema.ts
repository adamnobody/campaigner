import { z } from 'zod';
import { LIMITS, NOTE_TYPES, ALLOWED_NOTE_FORMATS } from '../constants.js';
import { idSchema, tagSchema } from './common.schema.js';

export const noteSchema = z.object({
  id: idSchema,
  projectId: idSchema,
  folderId: idSchema.nullable().optional(),
  title: z.string().min(LIMITS.NOTE_TITLE_MIN).max(LIMITS.NOTE_TITLE_MAX).trim(),
  content: z.string().max(LIMITS.NOTE_CONTENT_MAX).default(''),
  format: z.enum(ALLOWED_NOTE_FORMATS).default('md'),
  noteType: z.enum(NOTE_TYPES).default('note'),
  tags: z.array(tagSchema).max(LIMITS.MAX_TAGS_PER_ENTITY).optional().default([]),
  isPinned: z.boolean().default(false),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const createNoteSchema = noteSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  tags: true,
});

export const updateNoteSchema = noteSchema
  .omit({ id: true, projectId: true, createdAt: true, updatedAt: true })
  .partial();