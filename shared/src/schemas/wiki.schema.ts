import { z } from 'zod';
import { idSchema } from './common.schema.js';

export const wikiLinkSchema = z.object({
  id: idSchema,
  projectId: idSchema,
  sourceNoteId: idSchema,
  targetNoteId: idSchema,
  label: z.string().max(200).default(''),
  createdAt: z.string().datetime(),
  sourceTitle: z.string().optional(),
  targetTitle: z.string().optional(),
});

export const createWikiLinkSchema = wikiLinkSchema
  .omit({ id: true, createdAt: true, sourceTitle: true, targetTitle: true });

export const getWikiLinksQuerySchema = z.object({
  projectId: z.coerce.number().int().positive(),
  noteId: z.coerce.number().int().positive().optional(),
});
