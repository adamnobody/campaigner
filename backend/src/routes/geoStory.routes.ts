import { Router } from 'express';
import { z } from 'zod';
import { validateRequest } from '../middleware/validateRequest';
import { GeoStoryController } from '../controllers/geoStory.controller';
import {
  createGeoStoryEventSchema,
  updateGeoStoryEventSchema,
  geoStoryListQuerySchema,
} from '@campaigner/shared';

const router = Router();

const idParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

router.get(
  '/',
  validateRequest({ query: geoStoryListQuerySchema }),
  GeoStoryController.list
);

router.post(
  '/',
  validateRequest({ body: createGeoStoryEventSchema }),
  GeoStoryController.create
);

router.put(
  '/:id',
  validateRequest({ params: idParamsSchema, body: updateGeoStoryEventSchema }),
  GeoStoryController.update
);

router.delete(
  '/:id',
  validateRequest({ params: idParamsSchema }),
  GeoStoryController.delete
);

export default router;
