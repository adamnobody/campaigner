import { z } from 'zod';

const nameSchema = z.string().trim().min(1).max(120);
const summarySchema = z.string().max(1000).optional().default('');
const notesSchema = z.string().max(200000).optional().default('');
const tagsSchema = z.array(z.string().trim().min(1).max(40)).optional().default([]);

export const CreateCharacterSchema = z.object({
  name: nameSchema,
  summary: summarySchema,
  notes: notesSchema,
  tags: tagsSchema,
});

export const PatchCharacterSchema = z.object({
  name: nameSchema.optional(),
  summary: summarySchema.optional(),
  notes: notesSchema.optional(),
  tags: tagsSchema.optional(),
});