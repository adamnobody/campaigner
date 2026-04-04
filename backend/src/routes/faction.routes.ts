import { Router } from 'express';
import { z } from 'zod';
import { FactionController } from '../controllers/faction.controller';
import { validateRequest } from '../middleware/validateRequest';
import { createDiskUpload } from '../middleware/createUpload';
import {
  createFactionSchema,
  updateFactionSchema,
  createFactionRankSchema,
  updateFactionRankSchema,
  createFactionMemberSchema,
  updateFactionMemberSchema,
  createFactionRelationSchema,
} from '@campaigner/shared';
import { idParamsSchema, setTagsBodySchema, projectIdQuerySchema } from './commonSchemas';

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

const getAllQuerySchema = z.object({
  projectId: z.coerce.number().int().positive(),
  type: z.string().optional(),
  status: z.string().optional(),
  search: z.string().optional(),
  limit: z.coerce.number().int().positive().optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

const updateRelationSchema = z.object({
  relationType: z.string().min(1).max(50).optional(),
  customLabel: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  startedDate: z.string().max(100).optional(),
  isBidirectional: z.boolean().optional(),
});

// ==================== CRUD ====================

router.get(
  '/',
  validateRequest({ query: getAllQuerySchema }),
  FactionController.getAll
);

router.get(
  '/relations',
  validateRequest({ query: projectIdQuerySchema }),
  FactionController.getRelations
);

router.get(
  '/graph',
  validateRequest({ query: projectIdQuerySchema }),
  FactionController.getGraph
);

router.get(
  '/:id',
  validateRequest({ params: idParamsSchema }),
  FactionController.getById
);

router.post(
  '/',
  validateRequest({ body: createFactionSchema }),
  FactionController.create
);

router.put(
  '/:id',
  validateRequest({
    params: idParamsSchema,
    body: updateFactionSchema,
  }),
  FactionController.update
);

router.delete(
  '/:id',
  validateRequest({ params: idParamsSchema }),
  FactionController.delete
);

// ==================== IMAGES ====================

router.post(
  '/:id/image',
  validateRequest({ params: idParamsSchema }),
  upload.single('image'),
  FactionController.uploadImage
);

router.post(
  '/:id/banner',
  validateRequest({ params: idParamsSchema }),
  upload.single('banner'),
  FactionController.uploadBanner
);

// ==================== TAGS ====================

router.put(
  '/:id/tags',
  validateRequest({
    params: idParamsSchema,
    body: setTagsBodySchema,
  }),
  FactionController.setTags
);

// ==================== RANKS ====================

router.get(
  '/:id/ranks',
  validateRequest({ params: idParamsSchema }),
  FactionController.getRanks
);

router.post(
  '/:id/ranks',
  validateRequest({
    params: idParamsSchema,
    body: createFactionRankSchema.omit({ factionId: true }),
  }),
  FactionController.createRank
);

router.put(
  '/:id/ranks/:rankId',
  validateRequest({
    params: rankParamsSchema,
    body: updateFactionRankSchema,
  }),
  FactionController.updateRank
);

router.delete(
  '/:id/ranks/:rankId',
  validateRequest({ params: rankParamsSchema }),
  FactionController.deleteRank
);

// ==================== MEMBERS ====================

router.get(
  '/:id/members',
  validateRequest({ params: idParamsSchema }),
  FactionController.getMembers
);

router.post(
  '/:id/members',
  validateRequest({
    params: idParamsSchema,
    body: createFactionMemberSchema.omit({ factionId: true }),
  }),
  FactionController.addMember
);

router.put(
  '/:id/members/:memberId',
  validateRequest({
    params: memberParamsSchema,
    body: updateFactionMemberSchema,
  }),
  FactionController.updateMember
);

router.delete(
  '/:id/members/:memberId',
  validateRequest({ params: memberParamsSchema }),
  FactionController.removeMember
);

// ==================== RELATIONS ====================

router.post(
  '/relations',
  validateRequest({ body: createFactionRelationSchema }),
  FactionController.createRelation
);

router.put(
  '/relations/:relationId',
  validateRequest({
    params: relationParamsSchema,
    body: updateRelationSchema,
  }),
  FactionController.updateRelation
);

router.delete(
  '/relations/:relationId',
  validateRequest({ params: relationParamsSchema }),
  FactionController.deleteRelation
);

export default router;