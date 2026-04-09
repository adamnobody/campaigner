import { Router } from 'express';
import { z } from 'zod';
import { getTags, createTag, deleteTag } from '../controllers/tag.controller.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = Router();

const getTagsQuerySchema = z.object({
  projectId: z.coerce.number().int().positive(),
});

const deleteTagParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const createTagBodySchema = z.object({
  projectId: z.number().int().positive(),
  name: z.string().min(1),
  color: z.string().optional(),
});

router.get(
  '/',
  validateRequest({ query: getTagsQuerySchema }),
  getTags
);

router.post(
  '/',
  validateRequest({ body: createTagBodySchema }),
  createTag
);

router.delete(
  '/:id',
  validateRequest({ params: deleteTagParamsSchema }),
  deleteTag
);

export default router;