import { z } from 'zod';

export const CreateMapFieldsSchema = z.object({
  title: z.string().trim().min(1).max(120),
  parent_map_id: z.string().trim().min(1).optional()
});
