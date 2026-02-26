import { Router } from 'express';
import { FolderController } from '../controllers/folder.controller';
import { validateRequest } from '../middleware/validateRequest';
import { createFolderSchema } from '@campaigner/shared';

const router = Router();

router.get('/', FolderController.getAll);
router.get('/tree', FolderController.getTree);
router.post('/', validateRequest({ body: createFolderSchema }), FolderController.create);
router.put('/:id', FolderController.update);
router.delete('/:id', FolderController.delete);

export { router as folderRoutes };