import { Router } from 'express';
import { z } from 'zod';
import { TimelineController } from '../controllers/timeline.controller';
import { validateRequest } from '../middleware/validateRequest';
import {
  createTimelineEventSchema,
  updateTimelineEventSchema,
} from '@campaigner/shared';
import { idParamsSchema, setTagsBodySchema } from './commonSchemas';

const router = Router();

const getAllQuerySchema = z.object({
  projectId: z.coerce.number().int().positive(),
  era: z.string().optional(),
  branchId: z.coerce.number().int().positive().optional(),
});

const deleteQuerySchema = z.object({
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
  TimelineController.getAll
);

router.get(
  '/:id',
  validateRequest({ params: idParamsSchema }),
  TimelineController.getById
);

router.post(
  '/',
  validateRequest({ body: createTimelineEventSchema.extend({ branchId: z.number().int().positive().optional() }) }),
  TimelineController.create
);

router.put(
  '/:id',
  validateRequest({
    params: idParamsSchema,
    body: updateTimelineEventSchema.extend({ branchId: z.number().int().positive().optional() }),
  }),
  TimelineController.update
);

router.delete(
  '/:id',
  validateRequest({ params: idParamsSchema, query: deleteQuerySchema }),
  TimelineController.delete
);

router.post(
  '/reorder',
  validateRequest({ body: reorderSchema }),
  TimelineController.reorder
);

router.put(
  '/:id/tags',
  validateRequest({
    params: idParamsSchema,
    body: setTagsBodySchema,
  }),
  TimelineController.setTags
);

export default router;