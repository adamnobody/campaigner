import { z } from 'zod';

export const CreateProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  rootPath: z.string().optional(),
  system: z.enum(['generic', 'dnd5e', 'vtm', 'cyberpunk', 'wh40k_rt']).default('generic'),
});

export type CreateProjectDto = z.infer<typeof CreateProjectSchema>;
