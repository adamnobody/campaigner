import { Router } from 'express';
import { z } from 'zod';
import { DogmaController } from '../controllers/dogma.controller.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { createDogmaSchema, updateDogmaSchema } from '@campaigner/shared';
import { idParamsSchema, setTagsBodySchema } from './commonSchemas.js';

const router = Router();

const getAllQuerySchema = z.object({
  projectId: z.coerce.number().int().positive(),
  branchId: z.coerce.number().int().positive().optional(),
  category: z.string().optional(),
  importance: z.string().optional(),
  status: z.string().optional(),
  search: z.string().optional(),
  limit: z.coerce.number().int().positive().optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

const branchQuerySchema = z.object({
  branchId: z.coerce.number().int().positive().optional(),
});

const reorderSchema = z.object({
  projectId: z.number().int().positive(),
  orderedIds: z.array(z.number().int().positive()),
  branchId: z.number().int().positive().optional(),
});

router.get(
  '/',
  validateRequest({ query: getAllQuerySchema }),
  DogmaController.getAll
);

router.get(
  '/:id',
  validateRequest({ params: idParamsSchema, query: branchQuerySchema }),
  DogmaController.getById
);

router.post(
  '/',
  validateRequest({ body: createDogmaSchema.extend({ branchId: z.number().int().positive().optional() }) }),
  DogmaController.create
);

router.put(
  '/:id',
  validateRequest({
    params: idParamsSchema,
    body: updateDogmaSchema.extend({ branchId: z.number().int().positive().optional() }),
  }),
  DogmaController.update
);

router.delete(
  '/:id',
  validateRequest({ params: idParamsSchema, query: branchQuerySchema }),
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
    query: branchQuerySchema,
    body: setTagsBodySchema,
  }),
  DogmaController.setTags
);

export default router;