import { Router } from 'express';
import { z } from 'zod';
import { NoteController } from '../controllers/note.controller';
import { validateRequest } from '../middleware/validateRequest';
import { createNoteSchema, updateNoteSchema } from '@campaigner/shared';
import { idParamsSchema, setTagsBodySchema } from './commonSchemas';

const router = Router();

const listQuerySchema = z.object({
  projectId: z.coerce.number().int().positive(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  noteType: z.string().optional(),
  folderId: z.union([z.coerce.number().int().positive(), z.literal('null')]).optional(),
});

router.get(
  '/',
  validateRequest({ query: listQuerySchema }),
  NoteController.getAll
);

router.get(
  '/:id',
  validateRequest({ params: idParamsSchema }),
  NoteController.getById
);

router.post(
  '/',
  validateRequest({ body: createNoteSchema }),
  NoteController.create
);

router.put(
  '/:id',
  validateRequest({
    params: idParamsSchema,
    body: updateNoteSchema,
  }),
  NoteController.update
);

router.delete(
  '/:id',
  validateRequest({ params: idParamsSchema }),
  NoteController.delete
);

router.put(
  '/:id/tags',
  validateRequest({
    params: idParamsSchema,
    body: setTagsBodySchema,
  }),
  NoteController.setTags
);

export default router;