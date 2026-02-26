import { Router } from 'express';
import { TagController } from '../controllers/tag.controller';

const router = Router();

router.get('/', TagController.getAll);
router.post('/', TagController.create);
router.delete('/:id', TagController.delete);

export { router as tagRoutes };