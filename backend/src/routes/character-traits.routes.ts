import { Router } from 'express';
import { z } from 'zod';
import { CharacterTraitsController } from '../controllers/character-traits.controller.js';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  createCharacterTraitBodySchema,
  assignTraitBodySchema,
  unassignTraitBodySchema,
} from '@campaigner/shared';

const router = Router();

const projectIdQuerySchema = z.object({
  projectId: z.coerce.number().int().positive(),
});

const characterIdQuerySchema = z.object({
  characterId: z.coerce.number().int().positive(),
});

const idParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

router.get(
  '/assigned',
  validateRequest({ query: characterIdQuerySchema }),
  CharacterTraitsController.getAssigned
);

router.get(
  '/',
  validateRequest({ query: projectIdQuerySchema }),
  CharacterTraitsController.getAll
);

router.post(
  '/assign',
  validateRequest({ body: assignTraitBodySchema }),
  CharacterTraitsController.assign
);

router.post(
  '/unassign',
  validateRequest({ body: unassignTraitBodySchema }),
  CharacterTraitsController.unassign
);

router.post(
  '/',
  validateRequest({ body: createCharacterTraitBodySchema }),
  CharacterTraitsController.create
);

router.delete(
  '/:id',
  validateRequest({ params: idParamsSchema }),
  CharacterTraitsController.delete
);

export default router;
