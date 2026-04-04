import { Router } from 'express';
import { z } from 'zod';
import { CharacterController } from '../controllers/character.controller';
import { validateRequest } from '../middleware/validateRequest';
import {
  createCharacterSchema,
  updateCharacterSchema,
  createRelationshipSchema,
  updateRelationshipSchema,
} from '@campaigner/shared';
import { uploadCharacterImage } from '../middleware/upload';
import { idParamsSchema, setTagsBodySchema, projectIdQuerySchema } from './commonSchemas';

const router = Router();

const listQuerySchema = z.object({
  projectId: z.coerce.number().int().positive(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

// Characters
router.get(
  '/',
  validateRequest({ query: listQuerySchema }),
  CharacterController.getAll
);

router.get(
  '/graph',
  validateRequest({ query: projectIdQuerySchema }),
  CharacterController.getGraph
);

router.get(
  '/relationships/list',
  validateRequest({ query: projectIdQuerySchema }),
  CharacterController.getRelationships
);

router.get(
  '/:id',
  validateRequest({ params: idParamsSchema }),
  CharacterController.getById
);

router.post(
  '/',
  validateRequest({ body: createCharacterSchema }),
  CharacterController.create
);

router.put(
  '/:id',
  validateRequest({
    params: idParamsSchema,
    body: updateCharacterSchema,
  }),
  CharacterController.update
);

router.delete(
  '/:id',
  validateRequest({ params: idParamsSchema }),
  CharacterController.delete
);

router.post(
  '/:id/image',
  validateRequest({ params: idParamsSchema }),
  uploadCharacterImage,
  CharacterController.uploadImage
);

router.put(
  '/:id/tags',
  validateRequest({
    params: idParamsSchema,
    body: setTagsBodySchema,
  }),
  CharacterController.setTags
);

// Relationships
router.post(
  '/relationships',
  validateRequest({ body: createRelationshipSchema }),
  CharacterController.createRelationship
);

router.put(
  '/relationships/:id',
  validateRequest({
    params: idParamsSchema,
    body: updateRelationshipSchema,
  }),
  CharacterController.updateRelationship
);

router.delete(
  '/relationships/:id',
  validateRequest({ params: idParamsSchema }),
  CharacterController.deleteRelationship
);

export default router;