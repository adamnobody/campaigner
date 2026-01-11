import { z } from 'zod';

export const CreateCharacterSchema = z.object({
  name: z.string().trim().min(1).max(120),
  summary: z.string().max(1000).optional().default(''),
  notes: z.string().max(200000).optional().default(''),
  tags: z.array(z.string().trim().min(1).max(40)).optional().default([]),
});

export const PatchCharacterSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  summary: z.string().max(1000).optional(),
  notes: z.string().max(200000).optional(),
  tags: z.array(z.string().trim().min(1).max(40)).optional(),
});