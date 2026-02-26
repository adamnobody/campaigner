import { Router } from 'express';
import { NoteController } from '../controllers/note.controller';
import { validateRequest } from '../middleware/validateRequest';
import { createNoteSchema, updateNoteSchema } from '@campaigner/shared';

const router = Router();

router.get('/', NoteController.getAll);
router.get('/:id', NoteController.getById);
router.post('/', validateRequest({ body: createNoteSchema }), NoteController.create);
router.put('/:id', validateRequest({ body: updateNoteSchema }), NoteController.update);
router.delete('/:id', NoteController.delete);
router.put('/:id/tags', NoteController.setTags);

export { router as noteRoutes };