import { Router } from 'express';
import { z } from 'zod';
import { PolicyController } from '../controllers/policy.controller';
import { validateRequest } from '../middleware/validateRequest';
import { idParamsSchema } from './commonSchemas';
import {
  createPolicySchema,
  getPoliciesQuerySchema,
  updatePolicySchema,
  createPolicyFactionLinkSchema,
  updatePolicyFactionLinkSchema,
} from '@campaigner/shared';

const router = Router();
const linkParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
  linkId: z.coerce.number().int().positive(),
});

router.get(
  '/',
  validateRequest({ query: getPoliciesQuerySchema }),
  PolicyController.getAll
);

router.get(
  '/:id',
  validateRequest({ params: idParamsSchema }),
  PolicyController.getById
);

router.post(
  '/',
  validateRequest({ body: createPolicySchema }),
  PolicyController.create
);

router.put(
  '/:id',
  validateRequest({
    params: idParamsSchema,
    body: updatePolicySchema,
  }),
  PolicyController.update
);

router.delete(
  '/:id',
  validateRequest({ params: idParamsSchema }),
  PolicyController.delete
);

router.get(
  '/:id/links',
  validateRequest({ params: idParamsSchema }),
  PolicyController.getLinks
);

router.post(
  '/:id/links',
  validateRequest({
    params: idParamsSchema,
    body: createPolicyFactionLinkSchema,
  }),
  PolicyController.addLink
);

router.put(
  '/:id/links/:linkId',
  validateRequest({
    params: linkParamsSchema,
    body: updatePolicyFactionLinkSchema,
  }),
  PolicyController.updateLink
);

router.delete(
  '/:id/links/:linkId',
  validateRequest({ params: linkParamsSchema }),
  PolicyController.removeLink
);

export default router;
