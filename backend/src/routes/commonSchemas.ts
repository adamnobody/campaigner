import { z } from 'zod';
import { LIMITS } from '@campaigner/shared';

export const idParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const setTagsBodySchema = z.object({
  tagIds: z.array(z.number().int().positive()).max(LIMITS.MAX_TAGS_PER_ENTITY),
});

export const projectIdQuerySchema = z.object({
  projectId: z.coerce.number().int().positive(),
});

/** Optional branch filter; use on list/graph routes so `validateRequest` does not strip `branchId`. */
export const optionalBranchIdQuerySchema = z.object({
  branchId: z.coerce.number().int().positive().optional(),
});

export const projectIdWithBranchQuerySchema = projectIdQuerySchema.merge(optionalBranchIdQuerySchema);
