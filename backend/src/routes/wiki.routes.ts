import { Router } from 'express';
import { z } from 'zod';
import { WikiController } from '../controllers/wiki.controller';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();

const getLinksQuerySchema = z.object({
  projectId: z.coerce.number().int().positive(),
  noteId: z.coerce.number().int().positive().optional(),
});

const getCategoriesQuerySchema = z.object({
  projectId: z.coerce.number().int().positive(),
});

const idParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const createWikiLinkSchema = z.object({
  projectId: z.number().int().positive(),
  sourceNoteId: z.number().int().positive(),
  targetNoteId: z.number().int().positive(),
  label: z.string().max(200).optional().default(''),
});

router.get(
  '/links',
  validateRequest({ query: getLinksQuerySchema }),
  WikiController.getLinks
);

router.post(
  '/links',
  validateRequest({ body: createWikiLinkSchema }),
  WikiController.createLink
);

router.delete(
  '/links/:id',
  validateRequest({ params: idParamsSchema }),
  WikiController.deleteLink
);

router.get(
  '/categories',
  validateRequest({ query: getCategoriesQuerySchema }),
  WikiController.getCategories
);

export default router;