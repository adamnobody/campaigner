import { Router } from 'express';
import { z } from 'zod';
import { validateRequest } from '../middleware/validateRequest.js';
import { BranchController } from '../controllers/branch.controller.js';
import { createScenarioBranchSchema, updateScenarioBranchSchema } from '@campaigner/shared';
import { idParamsSchema, projectIdQuerySchema } from './commonSchemas.js';

const router = Router();

const branchIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

router.get(
  '/',
  validateRequest({ query: projectIdQuerySchema }),
  BranchController.getAll
);

router.post(
  '/',
  validateRequest({ body: createScenarioBranchSchema }),
  BranchController.create
);

router.put(
  '/:id',
  validateRequest({ params: branchIdParamsSchema, body: updateScenarioBranchSchema }),
  BranchController.update
);

router.delete(
  '/:id',
  validateRequest({ params: idParamsSchema }),
  BranchController.delete
);

export default router;
