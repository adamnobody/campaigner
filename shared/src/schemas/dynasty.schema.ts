import { z } from 'zod';

export const createDynastySchema = z.object({
  projectId: z.number().int().positive(),
  name: z.string().min(1).max(200),
  motto: z.string().max(500).optional(),
  description: z.string().max(10000).optional(),
  history: z.string().max(10000).optional(),
  status: z.string().max(50).default('active'),
  color: z.string().max(50).optional(),
  secondaryColor: z.string().max(50).optional(),
  foundedDate: z.string().max(100).optional(),
  extinctDate: z.string().max(100).optional(),
  founderId: z.number().int().positive().nullable().optional(),
  currentLeaderId: z.number().int().positive().nullable().optional(),
  heirId: z.number().int().positive().nullable().optional(),
  linkedFactionId: z.number().int().positive().nullable().optional(),
  sortOrder: z.number().int().default(0),
});

export const updateDynastySchema = createDynastySchema.partial().omit({ projectId: true });

export const createDynastyMemberSchema = z.object({
  dynastyId: z.number().int().positive(),
  characterId: z.number().int().positive(),
  generation: z.number().int().min(0).max(100).default(0),
  role: z.string().max(200).optional(),
  birthDate: z.string().max(100).optional(),
  deathDate: z.string().max(100).optional(),
  isMainLine: z.boolean().default(true),
  notes: z.string().max(2000).optional(),
});

export const updateDynastyMemberSchema = createDynastyMemberSchema.partial().omit({ dynastyId: true, characterId: true });

export const createDynastyRelationSchema = z.object({
  dynastyId: z.number().int().positive(),
  sourceCharacterId: z.number().int().positive(),
  targetCharacterId: z.number().int().positive(),
  relationType: z.string().min(1).max(50),
  customLabel: z.string().max(200).optional(),
});

export const createDynastyEventSchema = z.object({
  dynastyId: z.number().int().positive(),
  title: z.string().min(1).max(300),
  description: z.string().max(5000).optional(),
  eventDate: z.string().max(100),
  importance: z.string().max(50).default('normal'),
  sortOrder: z.number().int().default(0),
});

export const updateDynastyEventSchema = createDynastyEventSchema.partial().omit({ dynastyId: true });

export const reorderDynastyEventsSchema = z.object({
  orderedIds: z.array(z.number().int().positive()).min(1),
});

export type ReorderDynastyEvents = z.infer<typeof reorderDynastyEventsSchema>;

export const dynastySchema = z.object({
  id: z.number(),
  projectId: z.number(),
  name: z.string(),
  motto: z.string(),
  description: z.string(),
  history: z.string(),
  status: z.string(),
  color: z.string(),
  secondaryColor: z.string(),
  imagePath: z.string().nullable(),
  foundedDate: z.string(),
  extinctDate: z.string(),
  founderId: z.number().nullable(),
  currentLeaderId: z.number().nullable(),
  heirId: z.number().nullable(),
  linkedFactionId: z.number().nullable(),
  sortOrder: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});