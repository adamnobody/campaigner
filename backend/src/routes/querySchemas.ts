import { z } from 'zod';

/** Max page size for notes list (wiki / graph use high limits). */
export const NOTE_LIST_MAX_LIMIT = 500;

export const noteListQuerySchema = z.object({
  projectId: z.coerce.number().int().positive(),
  branchId: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(NOTE_LIST_MAX_LIMIT).optional(),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  noteType: z.string().optional(),
  folderId: z.union([z.coerce.number().int().positive(), z.literal('null')]).optional(),
});
