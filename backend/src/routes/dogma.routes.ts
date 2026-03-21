import { Router } from 'express';
import { DogmaController } from '../controllers/dogma.controller';
import { validateRequest } from '../middleware/validateRequest';
import { createDogmaSchema, updateDogmaSchema } from '@campaigner/shared';

const router = Router();

router.get('/', DogmaController.getAll);
router.get('/:id', DogmaController.getById);
router.post('/', validateRequest({ body: createDogmaSchema }), DogmaController.create);
router.put('/:id', validateRequest({ body: updateDogmaSchema }), DogmaController.update);
router.delete('/:id', DogmaController.delete);
router.post('/reorder', DogmaController.reorder);
router.put('/:id/tags', DogmaController.setTags);

export { router as dogmaRoutes };