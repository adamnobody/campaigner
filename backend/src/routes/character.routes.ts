import { Router } from 'express';
import { z } from 'zod';
import { CharacterController } from '../controllers/character.controller.js';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  createCharacterSchema,
  updateCharacterSchema,
  createRelationshipSchema,
  updateRelationshipSchema,
} from '@campaigner/shared';
import { uploadCharacterImage } from '../middleware/upload.js';
import {
  idParamsSchema,
  setTagsBodySchema,
  projectIdWithBranchQuerySchema,
  optionalBranchIdQuerySchema,
} from './commonSchemas.js';

const router = Router();

const listQuerySchema = z.object({
  projectId: z.coerce.number().int().positive(),
  branchId: z.coerce.number().int().positive().optional(),
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
  validateRequest({ query: projectIdWithBranchQuerySchema }),
  CharacterController.getGraph
);

router.get(
  '/relationships/list',
  validateRequest({ query: projectIdWithBranchQuerySchema }),
  CharacterController.getRelationships
);

router.get(
  '/:id',
  validateRequest({ params: idParamsSchema, query: optionalBranchIdQuerySchema }),
  CharacterController.getById
);

router.post(
  '/',
  validateRequest({
    body: createCharacterSchema.extend({ branchId: z.number().int().positive().optional() }),
  }),
  CharacterController.create
);

router.put(
  '/:id',
  validateRequest({
    params: idParamsSchema,
    body: updateCharacterSchema.extend({ branchId: z.number().int().positive().optional() }),
  }),
  CharacterController.update
);

router.delete(
  '/:id',
  validateRequest({ params: idParamsSchema, query: optionalBranchIdQuerySchema }),
  CharacterController.delete
);

router.post(
  '/:id/image',
  validateRequest({ params: idParamsSchema, query: optionalBranchIdQuerySchema }),
  uploadCharacterImage,
  CharacterController.uploadImage
);

router.put(
  '/:id/tags',
  validateRequest({
    params: idParamsSchema,
    query: optionalBranchIdQuerySchema,
    body: setTagsBodySchema,
  }),
  CharacterController.setTags
);

// Relationships
router.post(
  '/relationships',
  validateRequest({
    body: createRelationshipSchema.extend({ branchId: z.number().int().positive().optional() }),
  }),
  CharacterController.createRelationship
);

router.put(
  '/relationships/:id',
  validateRequest({
    params: idParamsSchema,
    body: updateRelationshipSchema.extend({ branchId: z.number().int().positive().optional() }),
  }),
  CharacterController.updateRelationship
);

router.delete(
  '/relationships/:id',
  validateRequest({ params: idParamsSchema, query: optionalBranchIdQuerySchema }),
  CharacterController.deleteRelationship
);

export default router;