import { Router } from 'express';
import { z } from 'zod';
import { NoteController } from '../controllers/note.controller';
import { validateRequest } from '../middleware/validateRequest';
import { createNoteSchema, updateNoteSchema } from '@campaigner/shared';
import { idParamsSchema, setTagsBodySchema } from './commonSchemas';

const router = Router();

const listQuerySchema = z.object({
  projectId: z.coerce.number().int().positive(),
  branchId: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(200).optional(),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  noteType: z.string().optional(),
  folderId: z.union([z.coerce.number().int().positive(), z.literal('null')]).optional(),
});

const branchDeleteQuerySchema = z.object({
  branchId: z.coerce.number().int().positive().optional(),
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
  validateRequest({ body: createNoteSchema.extend({ branchId: z.number().int().positive().optional() }) }),
  NoteController.create
);

router.put(
  '/:id',
  validateRequest({
    params: idParamsSchema,
    body: updateNoteSchema.extend({ branchId: z.number().int().positive().optional() }),
  }),
  NoteController.update
);

router.delete(
  '/:id',
  validateRequest({ params: idParamsSchema, query: branchDeleteQuerySchema }),
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