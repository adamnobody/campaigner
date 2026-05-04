import { Router } from 'express';
import { z } from 'zod';
import { FactionController } from '../controllers/faction.controller.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { createDiskUpload } from '../middleware/createUpload.js';
import {
  createFactionSchema,
  updateFactionSchema,
  createFactionRankSchema,
  updateFactionRankSchema,
  createFactionMemberSchema,
  updateFactionMemberSchema,
  createFactionRelationSchema,
  updateFactionRelationSchema,
  replaceFactionCustomMetricsSchema,
  compareFactionsSchema,
  createFactionPolicyBodySchema,
  updateFactionPolicySchema,
  factionEntityTypeSchema,
} from '@campaigner/shared';
import { idParamsSchema, setTagsBodySchema, projectIdWithBranchQuerySchema, optionalBranchIdQuerySchema } from './commonSchemas.js';

const router = Router();
const upload = createDiskUpload({
  folder: 'factions',
  maxFileSize: 10 * 1024 * 1024,
  filenamePrefix: 'faction',
});

const rankParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
  rankId: z.coerce.number().int().positive(),
});

const memberParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
  memberId: z.coerce.number().int().positive(),
});

const relationParamsSchema = z.object({
  relationId: z.coerce.number().int().positive(),
});

const factionPolicyParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
  policyId: z.coerce.number().int().positive(),
});

const getAllQuerySchema = z.object({
  projectId: z.coerce.number().int().positive(),
  branchId: z.coerce.number().int().positive().optional(),
  kind: factionEntityTypeSchema.optional(),
  type: factionEntityTypeSchema.optional(),
  status: z.string().optional(),
  search: z.string().optional(),
  limit: z.coerce.number().int().positive().optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

// ==================== CRUD ====================

router.get(
  '/',
  validateRequest({ query: getAllQuerySchema }),
  FactionController.getAll
);

router.get(
  '/relations',
  validateRequest({ query: projectIdWithBranchQuerySchema }),
  FactionController.getRelations
);

router.get(
  '/graph',
  validateRequest({ query: projectIdWithBranchQuerySchema }),
  FactionController.getGraph
);

router.get(
  '/:id',
  validateRequest({ params: idParamsSchema, query: optionalBranchIdQuerySchema }),
  FactionController.getById
);

// ==================== FACTION POLICIES ====================

router.get(
  '/:id/policies',
  validateRequest({ params: idParamsSchema, query: optionalBranchIdQuerySchema }),
  FactionController.getPolicies
);

router.post(
  '/:id/policies',
  validateRequest({
    params: idParamsSchema,
    query: optionalBranchIdQuerySchema,
    body: createFactionPolicyBodySchema,
  }),
  FactionController.createPolicy
);

router.put(
  '/:id/policies/:policyId',
  validateRequest({
    params: factionPolicyParamsSchema,
    query: optionalBranchIdQuerySchema,
    body: updateFactionPolicySchema,
  }),
  FactionController.updatePolicy
);

router.delete(
  '/:id/policies/:policyId',
  validateRequest({ params: factionPolicyParamsSchema, query: optionalBranchIdQuerySchema }),
  FactionController.deletePolicy
);

router.post(
  '/',
  validateRequest({
    body: createFactionSchema.extend({ branchId: z.number().int().positive().optional() }),
  }),
  FactionController.create
);

router.put(
  '/:id',
  validateRequest({
    params: idParamsSchema,
    body: updateFactionSchema.extend({ branchId: z.number().int().positive().optional() }),
  }),
  FactionController.update
);

router.delete(
  '/:id',
  validateRequest({ params: idParamsSchema, query: optionalBranchIdQuerySchema }),
  FactionController.delete
);

// ==================== IMAGES ====================

router.post(
  '/:id/image',
  validateRequest({ params: idParamsSchema, query: optionalBranchIdQuerySchema }),
  upload.single('image'),
  FactionController.uploadImage
);

router.post(
  '/:id/banner',
  validateRequest({ params: idParamsSchema, query: optionalBranchIdQuerySchema }),
  upload.single('banner'),
  FactionController.uploadBanner
);

// ==================== TAGS ====================

router.put(
  '/:id/tags',
  validateRequest({
    params: idParamsSchema,
    query: optionalBranchIdQuerySchema,
    body: setTagsBodySchema,
  }),
  FactionController.setTags
);

// ==================== RANKS ====================

router.get(
  '/:id/ranks',
  validateRequest({ params: idParamsSchema, query: optionalBranchIdQuerySchema }),
  FactionController.getRanks
);

router.post(
  '/:id/ranks',
  validateRequest({
    params: idParamsSchema,
    query: optionalBranchIdQuerySchema,
    body: createFactionRankSchema.omit({ factionId: true }),
  }),
  FactionController.createRank
);

router.put(
  '/:id/ranks/:rankId',
  validateRequest({
    params: rankParamsSchema,
    query: optionalBranchIdQuerySchema,
    body: updateFactionRankSchema,
  }),
  FactionController.updateRank
);

router.delete(
  '/:id/ranks/:rankId',
  validateRequest({ params: rankParamsSchema, query: optionalBranchIdQuerySchema }),
  FactionController.deleteRank
);

// ==================== MEMBERS ====================

router.get(
  '/:id/members',
  validateRequest({ params: idParamsSchema, query: optionalBranchIdQuerySchema }),
  FactionController.getMembers
);

router.post(
  '/:id/members',
  validateRequest({
    params: idParamsSchema,
    query: optionalBranchIdQuerySchema,
    body: createFactionMemberSchema.omit({ factionId: true }),
  }),
  FactionController.addMember
);

router.put(
  '/:id/members/:memberId',
  validateRequest({
    params: memberParamsSchema,
    query: optionalBranchIdQuerySchema,
    body: updateFactionMemberSchema,
  }),
  FactionController.updateMember
);

router.delete(
  '/:id/members/:memberId',
  validateRequest({ params: memberParamsSchema, query: optionalBranchIdQuerySchema }),
  FactionController.removeMember
);

router.put(
  '/:id/custom-metrics',
  validateRequest({
    params: idParamsSchema,
    query: optionalBranchIdQuerySchema,
    body: replaceFactionCustomMetricsSchema,
  }),
  FactionController.replaceCustomMetrics
);

router.post(
  '/compare',
  validateRequest({ body: compareFactionsSchema }),
  FactionController.compare
);

// ==================== RELATIONS ====================

router.post(
  '/relations',
  validateRequest({
    body: createFactionRelationSchema.extend({ branchId: z.number().int().positive().optional() }),
  }),
  FactionController.createRelation
);

router.put(
  '/relations/:relationId',
  validateRequest({
    params: relationParamsSchema,
    body: updateFactionRelationSchema.extend({ branchId: z.number().int().positive().optional() }),
  }),
  FactionController.updateRelation
);

router.delete(
  '/relations/:relationId',
  validateRequest({ params: relationParamsSchema, query: optionalBranchIdQuerySchema }),
  FactionController.deleteRelation
);

export default router;