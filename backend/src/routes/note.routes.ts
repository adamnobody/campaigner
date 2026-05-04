import { Router } from 'express';
import { z } from 'zod';
import { NoteController } from '../controllers/note.controller.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { createNoteSchema, updateNoteSchema } from '@campaigner/shared';
import { idParamsSchema, setTagsBodySchema, optionalBranchIdQuerySchema } from './commonSchemas.js';
import { noteListQuerySchema } from './querySchemas.js';

const router = Router();

const branchDeleteQuerySchema = z.object({
  branchId: z.coerce.number().int().positive().optional(),
});

router.get(
  '/',
  validateRequest({ query: noteListQuerySchema }),
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
    query: optionalBranchIdQuerySchema,
    body: setTagsBodySchema,
  }),
  NoteController.setTags
);

export default router;