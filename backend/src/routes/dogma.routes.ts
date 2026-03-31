import { Router } from 'express';
import { z } from 'zod';
import { DogmaController } from '../controllers/dogma.controller';
import { validateRequest } from '../middleware/validateRequest';
import { createDogmaSchema, updateDogmaSchema } from '@campaigner/shared';

const router = Router();

const idParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const getAllQuerySchema = z.object({
  projectId: z.coerce.number().int().positive(),
  category: z.string().optional(),
  importance: z.string().optional(),
  status: z.string().optional(),
  search: z.string().optional(),
  limit: z.coerce.number().int().positive().optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

const reorderSchema = z.object({
  projectId: z.number().int().positive(),
  orderedIds: z.array(z.number().int().positive()),
});

const setTagsSchema = z.object({
  tagIds: z.array(z.number().int().positive()),
});

router.get(
  '/',
  validateRequest({ query: getAllQuerySchema }),
  DogmaController.getAll
);

router.get(
  '/:id',
  validateRequest({ params: idParamsSchema }),
  DogmaController.getById
);

router.post(
  '/',
  validateRequest({ body: createDogmaSchema }),
  DogmaController.create
);

router.put(
  '/:id',
  validateRequest({
    params: idParamsSchema,
    body: updateDogmaSchema,
  }),
  DogmaController.update
);

router.delete(
  '/:id',
  validateRequest({ params: idParamsSchema }),
  DogmaController.delete
);

router.post(
  '/reorder',
  validateRequest({ body: reorderSchema }),
  DogmaController.reorder
);

router.put(
  '/:id/tags',
  validateRequest({
    params: idParamsSchema,
    body: setTagsSchema,
  }),
  DogmaController.setTags
);

export { router as dogmaRoutes };