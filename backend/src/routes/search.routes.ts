import { Router } from 'express';
import { z } from 'zod';
import { SearchController } from '../controllers/search.controller';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();

const searchQuerySchema = z.object({
  projectId: z.coerce.number().int().positive().optional(),
  q: z.string().optional(),
  limit: z.coerce.number().int().positive().optional(),
});

router.get(
  '/',
  validateRequest({ query: searchQuerySchema }),
  SearchController.search
);

export { router as searchRoutes };