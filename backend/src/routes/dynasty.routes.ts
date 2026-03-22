import { Router } from 'express';
import { DynastyController } from '../controllers/dynasty.controller';

const router = Router();

// CRUD
router.get('/', DynastyController.getAll);
router.get('/:id', DynastyController.getById);
router.post('/', DynastyController.create);
router.put('/:id', DynastyController.update);
router.delete('/:id', DynastyController.delete);

// Image
router.post('/:id/image', DynastyController.uploadImage);

// Tags
router.put('/:id/tags', DynastyController.setTags);

// Members
router.post('/:id/members', DynastyController.addMember);
router.put('/:id/members/:memberId', DynastyController.updateMember);
router.delete('/:id/members/:memberId', DynastyController.removeMember);

// Family links
router.post('/:id/family-links', DynastyController.addFamilyLink);
router.delete('/:id/family-links/:linkId', DynastyController.deleteFamilyLink);

// Events
router.post('/:id/events', DynastyController.addEvent);
router.put('/:id/events/:eventId', DynastyController.updateEvent);
router.delete('/:id/events/:eventId', DynastyController.deleteEvent);

export default router;