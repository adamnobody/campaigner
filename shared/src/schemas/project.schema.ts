import { z } from 'zod';
import { LIMITS, PROJECT_STATUSES } from '../constants.js';
import { idSchema } from './common.schema.js';

export const projectSchema = z.object({
  id: idSchema,
  name: z.string().min(LIMITS.PROJECT_NAME_MIN).max(LIMITS.PROJECT_NAME_MAX).trim(),
  description: z.string().max(LIMITS.PROJECT_DESCRIPTION_MAX).optional().default(''),
  status: z.enum(PROJECT_STATUSES).default('active'),
  mapImagePath: z.string().optional().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const createProjectSchema = z.object({
  name: z.string().min(LIMITS.PROJECT_NAME_MIN).max(LIMITS.PROJECT_NAME_MAX).trim(),
  description: z.string().max(LIMITS.PROJECT_DESCRIPTION_MAX).optional().default(''),
  status: z.enum(PROJECT_STATUSES).optional().default('active'),
  /** Display name for the initial main scenario branch (UI locale). */
  mainBranchName: z.string().min(1).max(120).trim().optional(),
});

export const updateProjectSchema = projectSchema
  .omit({ id: true, createdAt: true, updatedAt: true })
  .partial();

// Для файловой структуры проекта
export const projectFolderSchema = z.object({
  id: idSchema,
  projectId: idSchema,
  name: z.string().min(1).max(200).trim(),
  parentId: idSchema.nullable().optional(),
  createdAt: z.string().datetime(),
});

export const createFolderSchema = projectFolderSchema.omit({
  id: true,
  createdAt: true,
});