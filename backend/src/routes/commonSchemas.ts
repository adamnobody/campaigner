import { z } from 'zod';

export const idParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const setTagsBodySchema = z.object({
  tagIds: z.array(z.number().int().positive()),
});

export const projectIdQuerySchema = z.object({
  projectId: z.coerce.number().int().positive(),
});
