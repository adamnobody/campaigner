import { Router } from 'express';
import { z } from 'zod';
import { TimelineController } from '../controllers/timeline.controller';
import { validateRequest } from '../middleware/validateRequest';
import {
  createTimelineEventSchema,
  updateTimelineEventSchema,
} from '@campaigner/shared';

const router = Router();

const idParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const getAllQuerySchema = z.object({
  projectId: z.coerce.number().int().positive(),
  era: z.string().optional(),
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
  TimelineController.getAll
);

router.get(
  '/:id',
  validateRequest({ params: idParamsSchema }),
  TimelineController.getById
);

router.post(
  '/',
  validateRequest({ body: createTimelineEventSchema }),
  TimelineController.create
);

router.put(
  '/:id',
  validateRequest({
    params: idParamsSchema,
    body: updateTimelineEventSchema,
  }),
  TimelineController.update
);

router.delete(
  '/:id',
  validateRequest({ params: idParamsSchema }),
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
    body: setTagsSchema,
  }),
  TimelineController.setTags
);

export default router;