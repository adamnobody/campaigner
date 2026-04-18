import { z } from 'zod';

export const POLICY_TYPES = ['ambition', 'policy'] as const;
export const POLICY_STATUSES = ['planned', 'active', 'archived'] as const;

export const FACTION_POLICY_CATEGORIES = [
  'economy',
  'military',
  'social',
  'religion',
  'foreign',
  'other',
] as const;

export const policyTypeSchema = z.enum(POLICY_TYPES);
export const policyStatusSchema = z.enum(POLICY_STATUSES);
export const factionPolicyCategorySchema = z.enum(FACTION_POLICY_CATEGORIES);

/** Faction-scoped policy row (table `faction_policies`). UI: «Указы» / Decrees. */
export const factionPolicySchema = z.object({
  id: z.number().int().positive(),
  factionId: z.number().int().positive(),
  title: z.string().trim().min(1).max(200),
  type: policyTypeSchema,
  status: policyStatusSchema.default('active'),
  category: factionPolicyCategorySchema.default('other'),
  enactedDate: z.string().max(40).nullable().optional(),
  description: z.string().max(5000).default(''),
  sortOrder: z.number().int().default(0),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/** Body for POST /factions/:id/policies */
export const createFactionPolicyBodySchema = z.object({
  title: z.string().trim().min(1).max(200),
  type: policyTypeSchema,
  status: policyStatusSchema.optional(),
  category: factionPolicyCategorySchema.optional(),
  enactedDate: z.string().max(40).nullable().optional(),
  description: z.string().max(5000).optional(),
  sortOrder: z.number().int().optional(),
});

export const updateFactionPolicySchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  type: policyTypeSchema.optional(),
  status: policyStatusSchema.optional(),
  category: factionPolicyCategorySchema.optional(),
  enactedDate: z.string().max(40).nullable().optional(),
  description: z.string().max(5000).optional(),
  sortOrder: z.number().int().optional(),
});
