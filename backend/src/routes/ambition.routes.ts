import { Router } from 'express';
import { z } from 'zod';
import {
  assignFactionAmbitionBodySchema,
  createAmbitionBodySchema,
  updateAmbitionExclusionsBodySchema,
  updateAmbitionBodySchema,
} from '@campaigner/shared';
import { validateRequest } from '../middleware/validateRequest.js';
import { AmbitionController } from '../controllers/ambition.controller.js';

const router = Router();

const ambitionIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const catalogQuerySchema = z.object({
  projectId: z.coerce.number().int().positive(),
});

const factionIdParamsSchema = z.object({
  factionId: z.coerce.number().int().positive(),
});

const factionAmbitionParamsSchema = z.object({
  factionId: z.coerce.number().int().positive(),
  ambitionId: z.coerce.number().int().positive(),
});

router.get(
  '/ambitions',
  validateRequest({ query: catalogQuerySchema }),
  AmbitionController.getCatalog
);

router.post(
  '/ambitions',
  validateRequest({ body: createAmbitionBodySchema }),
  AmbitionController.create
);

router.patch(
  '/ambitions/:id',
  validateRequest({ params: ambitionIdParamsSchema, body: updateAmbitionBodySchema }),
  AmbitionController.update
);

router.patch(
  '/ambitions/:id/exclusions',
  validateRequest({ params: ambitionIdParamsSchema, body: updateAmbitionExclusionsBodySchema }),
  AmbitionController.updateExclusions
);

router.delete(
  '/ambitions/:id',
  validateRequest({ params: ambitionIdParamsSchema }),
  AmbitionController.delete
);

router.get(
  '/factions/:factionId/ambitions',
  validateRequest({ params: factionIdParamsSchema }),
  AmbitionController.getFactionAmbitions
);

router.post(
  '/factions/:factionId/ambitions',
  validateRequest({ params: factionIdParamsSchema, body: assignFactionAmbitionBodySchema }),
  AmbitionController.assignFactionAmbition
);

router.delete(
  '/factions/:factionId/ambitions/:ambitionId',
  validateRequest({ params: factionAmbitionParamsSchema }),
  AmbitionController.unassignFactionAmbition
);

export default router;
