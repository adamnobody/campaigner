import { z } from 'zod';

export const politicalEntityTypeSchema = z.enum(['state', 'faction']);

export const scaleZoneSchema = z.object({
  from: z.number().int().min(-100).max(100),
  to: z.number().int().min(-100).max(100),
  label: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
});

export const politicalScaleSchema = z.object({
  id: z.number().int().positive(),
  code: z.string().min(1).max(120),
  entityType: politicalEntityTypeSchema,
  category: z.string().min(1).max(80),
  name: z.string().min(1).max(300),
  leftPoleLabel: z.string().min(1).max(200),
  rightPoleLabel: z.string().min(1).max(200),
  leftPoleDescription: z.string().max(2000).default(''),
  rightPoleDescription: z.string().max(2000).default(''),
  icon: z.string().max(500).nullable().optional(),
  zones: z.array(scaleZoneSchema).nullable().optional(),
  isSystem: z.boolean(),
  worldId: z.number().int().positive().nullable(),
  order: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const politicalScaleAssignmentSchema = z.object({
  id: z.number().int().positive(),
  scaleId: z.number().int().positive(),
  entityType: politicalEntityTypeSchema,
  entityId: z.number().int().positive(),
  value: z.number().int().min(-100).max(100),
  enabled: z.boolean(),
  note: z.string().max(5000).nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const listPoliticalScalesQuerySchema = z.object({
  entityType: politicalEntityTypeSchema,
  worldId: z.coerce.number().int().positive(),
});

export const createPoliticalScaleBodySchema = z.object({
  worldId: z.number().int().positive(),
  code: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9_]+$/i, 'Код: только латиница, цифры и подчёркивание'),
  entityType: politicalEntityTypeSchema,
  category: z.string().trim().min(1).max(80),
  name: z.string().trim().min(1).max(300),
  leftPoleLabel: z.string().trim().min(1).max(200),
  rightPoleLabel: z.string().trim().min(1).max(200),
  leftPoleDescription: z.string().max(2000).optional(),
  rightPoleDescription: z.string().max(2000).optional(),
  icon: z.string().max(500).nullable().optional(),
  zones: z.array(scaleZoneSchema).nullable().optional(),
  order: z.number().int().optional(),
});

export const updatePoliticalScaleBodySchema = z.object({
  category: z.string().trim().min(1).max(80).optional(),
  name: z.string().trim().min(1).max(300).optional(),
  leftPoleLabel: z.string().trim().min(1).max(200).optional(),
  rightPoleLabel: z.string().trim().min(1).max(200).optional(),
  leftPoleDescription: z.string().max(2000).optional(),
  rightPoleDescription: z.string().max(2000).optional(),
  icon: z.string().max(500).nullable().optional(),
  zones: z.array(scaleZoneSchema).nullable().optional(),
  order: z.number().int().optional(),
});

/** Строка upsert для PUT /political-scale-assignments (сущность задаётся один раз в теле). */
export const politicalScaleAssignmentUpsertRowSchema = z.object({
  scaleId: z.number().int().positive(),
  value: z.number().int().min(-100).max(100),
  enabled: z.boolean(),
  note: z.string().max(5000).nullable().optional(),
});

export const putPoliticalScaleAssignmentsBodySchema = z.object({
  entityType: politicalEntityTypeSchema,
  entityId: z.number().int().positive(),
  assignments: z.array(politicalScaleAssignmentUpsertRowSchema),
});

export const listPoliticalScaleAssignmentsQuerySchema = z.object({
  entityType: politicalEntityTypeSchema,
  entityId: z.coerce.number().int().positive(),
});
