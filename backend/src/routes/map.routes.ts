import { Router } from 'express';
import { MapController } from '../controllers/map.controller';
import { validateRequest } from '../middleware/validateRequest';
import { createMarkerSchema, updateMarkerSchema } from '@campaigner/shared';

const router = Router();

router.get('/', MapController.getMarkers);
router.get('/:id', MapController.getById);
router.post('/', validateRequest({ body: createMarkerSchema }), MapController.create);
router.put('/:id', validateRequest({ body: updateMarkerSchema }), MapController.update);
router.delete('/:id', MapController.delete);

export { router as mapRoutes };