import { Router } from 'express';
import { DynastyController } from '../controllers/dynasty.controller';

const router = Router();

router.get('/', DynastyController.getAll);
router.get('/:id', DynastyController.getById);
router.post('/', DynastyController.create);
router.put('/:id', DynastyController.update);
router.delete('/:id', DynastyController.delete);

router.post('/:id/image', DynastyController.uploadImage);

router.put('/:id/tags', DynastyController.setTags);

router.post('/:id/members', DynastyController.addMember);
router.put('/:id/members/:memberId', DynastyController.updateMember);
router.delete('/:id/members/:memberId', DynastyController.removeMember);

router.put('/:id/graph-positions', DynastyController.saveGraphPositions);

router.post('/:id/family-links', DynastyController.addFamilyLink);
router.delete('/:id/family-links/:linkId', DynastyController.deleteFamilyLink);

router.post('/:id/events', DynastyController.addEvent);
router.put('/:id/events/:eventId', DynastyController.updateEvent);
router.delete('/:id/events/:eventId', DynastyController.deleteEvent);

export default router;