import { z } from 'zod';

export const createFactionSchema = z.object({
  projectId: z.number().int().positive(),
  name: z.string().min(1).max(200),
  type: z.string().min(1).max(50),
  customType: z.string().max(200).optional(),
  stateType: z.string().max(50).optional(),
  customStateType: z.string().max(200).optional(),
  motto: z.string().max(500).optional(),
  description: z.string().max(10000).optional(),
  history: z.string().max(10000).optional(),
  goals: z.string().max(5000).optional(),
  headquarters: z.string().max(500).optional(),
  territory: z.string().max(2000).optional(),
  status: z.string().max(50).default('active'),
  color: z.string().max(50).optional(),
  secondaryColor: z.string().max(50).optional(),
  foundedDate: z.string().max(100).optional(),
  disbandedDate: z.string().max(100).optional(),
  parentFactionId: z.number().int().positive().nullable().optional(),
  sortOrder: z.number().int().default(0),
});

export const updateFactionSchema = createFactionSchema.partial().omit({ projectId: true });

export const createFactionRankSchema = z.object({
  factionId: z.number().int().positive(),
  name: z.string().min(1).max(200),
  level: z.number().int().min(0).max(100),
  description: z.string().max(2000).optional(),
  permissions: z.string().max(2000).optional(),
  icon: z.string().max(50).optional(),
  color: z.string().max(50).optional(),
});

export const updateFactionRankSchema = createFactionRankSchema.partial().omit({ factionId: true });

export const createFactionMemberSchema = z.object({
  factionId: z.number().int().positive(),
  characterId: z.number().int().positive(),
  rankId: z.number().int().positive().optional(),
  role: z.string().max(200).optional(),
  joinedDate: z.string().max(100).optional(),
  leftDate: z.string().max(100).optional(),
  isActive: z.boolean().default(true),
  notes: z.string().max(2000).optional(),
});

export const updateFactionMemberSchema = createFactionMemberSchema.partial().omit({ factionId: true, characterId: true });

export const createFactionRelationSchema = z.object({
  projectId: z.number().int().positive(),
  sourceFactionId: z.number().int().positive(),
  targetFactionId: z.number().int().positive(),
  relationType: z.string().min(1).max(50),
  customLabel: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  startedDate: z.string().max(100).optional(),
  isBidirectional: z.boolean().default(true),
});

export const updateFactionRelationSchema = z.object({
  relationType: z.string().min(1).max(50).optional(),
  customLabel: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  startedDate: z.string().max(100).optional(),
  isBidirectional: z.boolean().optional(),
});

export const factionAssetSchema = z.object({
  id: z.number().int().positive(),
  factionId: z.number().int().positive(),
  name: z.string().trim().min(1).max(200),
  value: z.string().max(1000).default(''),
  sortOrder: z.number().int().default(0),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const createFactionAssetSchema = z.object({
  factionId: z.number().int().positive(),
  name: z.string().trim().min(1).max(200),
  value: z.string().trim().max(1000).optional(),
  sortOrder: z.number().int().optional(),
});

export const updateFactionAssetSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  value: z.string().trim().max(1000).optional(),
  sortOrder: z.number().int().optional(),
});

export const factionGraphNodeSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  type: z.string(),
  customType: z.string().optional().default(''),
  stateType: z.string().optional().default(''),
  status: z.string(),
  color: z.string().optional().default(''),
  imagePath: z.string().optional().default(''),
  memberCount: z.number().int().default(0),
});

export const factionGraphSchema = z.object({
  nodes: z.array(factionGraphNodeSchema),
  edges: z.array(createFactionRelationSchema.extend({
    id: z.number().int().positive(),
    createdAt: z.string().optional(),
    sourceFactionName: z.string().optional(),
    targetFactionName: z.string().optional(),
  })),
});