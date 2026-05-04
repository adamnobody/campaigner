import { Router } from 'express';
import { WikiController } from '../controllers/wiki.controller.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { createWikiLinkSchema, getWikiLinksQuerySchema } from '@campaigner/shared';
import { idParamsSchema, projectIdWithBranchQuerySchema } from './commonSchemas.js';
import { z } from 'zod';

const router = Router();

router.get(
  '/links',
  validateRequest({ query: getWikiLinksQuerySchema }),
  WikiController.getLinks
);

router.post(
  '/links',
  validateRequest({
    body: createWikiLinkSchema.extend({ branchId: z.number().int().positive().optional() }),
  }),
  WikiController.createLink
);

router.delete(
  '/links/:id',
  validateRequest({ params: idParamsSchema }),
  WikiController.deleteLink
);

router.get(
  '/categories',
  validateRequest({ query: projectIdWithBranchQuerySchema }),
  WikiController.getCategories
);

export default router;