import { z } from 'zod';

export const POLICY_TYPES = ['ambition', 'policy'] as const;
export const POLICY_STATUSES = ['planned', 'active', 'archived'] as const;

export const policyTypeSchema = z.enum(POLICY_TYPES);
export const policyStatusSchema = z.enum(POLICY_STATUSES);
export const policyFactionLinkRoleSchema = z.enum(['owner', 'supporter', 'opponent']);

export const policySchema = z.object({
  id: z.number().int().positive(),
  projectId: z.number().int().positive(),
  title: z.string().trim().min(1).max(200),
  type: policyTypeSchema,
  status: policyStatusSchema.default('active'),
  description: z.string().max(5000).default(''),
  sortOrder: z.number().int().default(0),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const createPolicySchema = z.object({
  projectId: z.number().int().positive(),
  title: z.string().trim().min(1).max(200),
  type: policyTypeSchema,
  status: policyStatusSchema.optional(),
  description: z.string().max(5000).optional(),
  sortOrder: z.number().int().optional(),
});

export const updatePolicySchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  type: policyTypeSchema.optional(),
  status: policyStatusSchema.optional(),
  description: z.string().max(5000).optional(),
  sortOrder: z.number().int().optional(),
});

export const getPoliciesQuerySchema = z.object({
  projectId: z.coerce.number().int().positive(),
});

export const policyFactionLinkSchema = z.object({
  id: z.number().int().positive(),
  policyId: z.number().int().positive(),
  factionId: z.number().int().positive(),
  factionName: z.string(),
  factionType: z.string(),
  role: policyFactionLinkRoleSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const createPolicyFactionLinkSchema = z.object({
  factionId: z.number().int().positive(),
  role: policyFactionLinkRoleSchema,
});

export const updatePolicyFactionLinkSchema = z.object({
  role: policyFactionLinkRoleSchema,
});
