import { Router } from 'express';
import { CharacterController } from '../controllers/character.controller';
import { validateRequest } from '../middleware/validateRequest';
import { createCharacterSchema, updateCharacterSchema, createRelationshipSchema } from '@campaigner/shared';
import { uploadCharacterImage } from '../middleware/upload';

const router = Router();

// Characters
router.get('/', CharacterController.getAll);
router.get('/graph', CharacterController.getGraph);
router.get('/:id', CharacterController.getById);
router.post('/', validateRequest({ body: createCharacterSchema }), CharacterController.create);
router.put('/:id', validateRequest({ body: updateCharacterSchema }), CharacterController.update);
router.delete('/:id', CharacterController.delete);
router.post('/:id/image', uploadCharacterImage, CharacterController.uploadImage);
router.put('/:id/tags', CharacterController.setTags);

// Relationships
router.get('/relationships/list', CharacterController.getRelationships);
router.post('/relationships', validateRequest({ body: createRelationshipSchema }), CharacterController.createRelationship);
router.put('/relationships/:id', CharacterController.updateRelationship);
router.delete('/relationships/:id', CharacterController.deleteRelationship);

export { router as characterRoutes };