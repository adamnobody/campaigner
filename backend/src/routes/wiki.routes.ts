import { Router } from 'express';
import { WikiController } from '../controllers/wiki.controller';

const router = Router();

router.get('/links', WikiController.getLinks);
router.post('/links', WikiController.createLink);
router.delete('/links/:id', WikiController.deleteLink);
router.get('/categories', WikiController.getCategories);

export default router;