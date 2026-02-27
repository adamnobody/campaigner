import { z } from 'zod';
import { LIMITS, CHARACTER_STATUSES, RELATIONSHIP_TYPES } from '../constants.js';
import { idSchema, tagSchema } from './common.schema.js';

export const characterSchema = z.object({
  id: idSchema,
  projectId: idSchema,
  name: z.string().min(LIMITS.CHARACTER_NAME_MIN).max(LIMITS.CHARACTER_NAME_MAX).trim(),
  title: z.string().max(200).optional().default(''),
  race: z.string().max(100).optional().default(''),
  characterClass: z.string().max(100).optional().default(''),
  level: z.number().int().min(1).max(30).optional().nullable(),
  status: z.enum(CHARACTER_STATUSES).default('alive'),
  bio: z.string().max(LIMITS.CHARACTER_BIO_MAX).optional().default(''),
  appearance: z.string().max(10000).optional().default(''),
  personality: z.string().max(10000).optional().default(''),
  backstory: z.string().max(50000).optional().default(''),
  notes: z.string().max(50000).optional().default(''),
  imagePath: z.string().optional().nullable(),
  tags: z.array(tagSchema).max(LIMITS.MAX_TAGS_PER_ENTITY).optional().default([]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const createCharacterSchema = characterSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  tags: true,
  imagePath: true,
});

export const updateCharacterSchema = characterSchema
  .omit({ id: true, projectId: true, createdAt: true, updatedAt: true })
  .partial();

// Связи между персонажами
export const characterRelationshipSchema = z.object({
  id: idSchema,
  projectId: idSchema,
  sourceCharacterId: idSchema,
  targetCharacterId: idSchema,
  relationshipType: z.enum(RELATIONSHIP_TYPES),
  customLabel: z.string().max(200).optional().default(''),
  description: z.string().max(5000).optional().default(''),
  isBidirectional: z.boolean().default(true),
  createdAt: z.string().datetime(),
});

export const createRelationshipSchema = characterRelationshipSchema.omit({
  id: true,
  createdAt: true,
});

export const updateRelationshipSchema = characterRelationshipSchema
  .omit({ id: true, projectId: true, sourceCharacterId: true, targetCharacterId: true, createdAt: true })
  .partial();