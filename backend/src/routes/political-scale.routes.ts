import { Router } from 'express';
import { z } from 'zod';
import { PoliticalScaleController } from '../controllers/political-scale.controller.js';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  listPoliticalScalesQuerySchema,
  createPoliticalScaleBodySchema,
  updatePoliticalScaleBodySchema,
  listPoliticalScaleAssignmentsQuerySchema,
  putPoliticalScaleAssignmentsBodySchema,
} from '@campaigner/shared';

const router = Router();

const idParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

router.get(
  '/political-scales',
  validateRequest({ query: listPoliticalScalesQuerySchema }),
  PoliticalScaleController.list
);

router.post(
  '/political-scales',
  validateRequest({ body: createPoliticalScaleBodySchema }),
  PoliticalScaleController.create
);

router.patch(
  '/political-scales/:id',
  validateRequest({
    params: idParamsSchema,
    body: updatePoliticalScaleBodySchema,
  }),
  PoliticalScaleController.update
);

router.delete(
  '/political-scales/:id',
  validateRequest({ params: idParamsSchema }),
  PoliticalScaleController.delete
);

router.get(
  '/political-scale-assignments',
  validateRequest({ query: listPoliticalScaleAssignmentsQuerySchema }),
  PoliticalScaleController.listAssignments
);

router.put(
  '/political-scale-assignments',
  validateRequest({ body: putPoliticalScaleAssignmentsBodySchema }),
  PoliticalScaleController.replaceAssignments
);

router.delete(
  '/political-scale-assignments/:id',
  validateRequest({ params: idParamsSchema }),
  PoliticalScaleController.deleteAssignment
);

export default router;
