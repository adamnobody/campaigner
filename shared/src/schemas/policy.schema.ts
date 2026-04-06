import { z } from 'zod';

export const POLICY_TYPES = ['ambition', 'policy'] as const;
export const POLICY_STATUSES = ['planned', 'active', 'archived'] as const;

export const policyTypeSchema = z.enum(POLICY_TYPES);
export const policyStatusSchema = z.enum(POLICY_STATUSES);

/** Faction-scoped policy row (table `faction_policies`). */
export const factionPolicySchema = z.object({
  id: z.number().int().positive(),
  factionId: z.number().int().positive(),
  title: z.string().trim().min(1).max(200),
  type: policyTypeSchema,
  status: policyStatusSchema.default('active'),
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
  description: z.string().max(5000).optional(),
  sortOrder: z.number().int().optional(),
});

export const updateFactionPolicySchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  type: policyTypeSchema.optional(),
  status: policyStatusSchema.optional(),
  description: z.string().max(5000).optional(),
  sortOrder: z.number().int().optional(),
});
