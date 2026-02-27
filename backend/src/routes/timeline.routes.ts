import { Router } from 'express';
import { TimelineController } from '../controllers/timeline.controller';
import { validateRequest } from '../middleware/validateRequest';
import { createTimelineEventSchema, updateTimelineEventSchema } from '@campaigner/shared';

const router = Router();

router.get('/', TimelineController.getAll);
router.get('/:id', TimelineController.getById);
router.post('/', validateRequest({ body: createTimelineEventSchema }), TimelineController.create);
router.put('/:id', validateRequest({ body: updateTimelineEventSchema }), TimelineController.update);
router.delete('/:id', TimelineController.delete);
router.post('/reorder', TimelineController.reorder);
router.put('/:id/tags', TimelineController.setTags);

export { router as timelineRoutes };