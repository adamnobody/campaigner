import { Router } from 'express';
import { ProjectController } from '../controllers/project.controller';
import { validateRequest } from '../middleware/validateRequest';
import { createProjectSchema, updateProjectSchema } from '@campaigner/shared';
import { uploadMapImage } from '../middleware/upload';

const router = Router();

router.get('/', ProjectController.getAll);
router.get('/:id', ProjectController.getById);
router.get('/:id/export', ProjectController.exportProject);
router.post('/', validateRequest({ body: createProjectSchema }), ProjectController.create);
router.post('/import', ProjectController.importProject);
router.put('/:id', validateRequest({ body: updateProjectSchema }), ProjectController.update);
router.delete('/:id', ProjectController.delete);
router.post('/:id/map', uploadMapImage, ProjectController.uploadMap);

export { router as projectRoutes };