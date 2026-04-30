import { Router } from 'express';
import { z } from 'zod';
import { DynastyController } from '../controllers/dynasty.controller.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { createDiskUpload } from '../middleware/createUpload.js';
import {
  createDynastySchema,
  updateDynastySchema,
  createDynastyMemberSchema,
  updateDynastyMemberSchema,
  createDynastyRelationSchema,
  createDynastyEventSchema,
  updateDynastyEventSchema,
  reorderDynastyEventsSchema,
} from '@campaigner/shared';
import { idParamsSchema, setTagsBodySchema } from './commonSchemas.js';

const router = Router();
const upload = createDiskUpload({
  folder: 'dynasties',
  maxFileSize: 10 * 1024 * 1024,
  filenamePrefix: 'dynasty',
});

const memberParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
  memberId: z.coerce.number().int().positive(),
});

const linkParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
  linkId: z.coerce.number().int().positive(),
});

const eventParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
  eventId: z.coerce.number().int().positive(),
});

const getAllQuerySchema = z.object({
  projectId: z.coerce.number().int().positive(),
  search: z.string().optional(),
  status: z.string().optional(),
  limit: z.coerce.number().int().positive().optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

const saveGraphPositionsSchema = z.object({
  positions: z.array(
    z.object({
      characterId: z.number().int().positive(),
      graphX: z.number(),
      graphY: z.number(),
    })
  ),
});

// CRUD
router.get(
  '/',
  validateRequest({ query: getAllQuerySchema }),
  DynastyController.getAll
);

router.get(
  '/:id',
  validateRequest({ params: idParamsSchema }),
  DynastyController.getById
);

router.post(
  '/',
  validateRequest({ body: createDynastySchema }),
  DynastyController.create
);

router.put(
  '/:id',
  validateRequest({
    params: idParamsSchema,
    body: updateDynastySchema,
  }),
  DynastyController.update
);

router.delete(
  '/:id',
  validateRequest({ params: idParamsSchema }),
  DynastyController.delete
);

// Image
router.post(
  '/:id/image',
  validateRequest({ params: idParamsSchema }),
  upload.single('image'),
  DynastyController.uploadImage
);

// Tags
router.put(
  '/:id/tags',
  validateRequest({
    params: idParamsSchema,
    body: setTagsBodySchema,
  }),
  DynastyController.setTags
);

// Members
router.post(
  '/:id/members',
  validateRequest({
    params: idParamsSchema,
    body: createDynastyMemberSchema.omit({ dynastyId: true }),
  }),
  DynastyController.addMember
);

router.put(
  '/:id/members/:memberId',
  validateRequest({
    params: memberParamsSchema,
    body: updateDynastyMemberSchema,
  }),
  DynastyController.updateMember
);

router.delete(
  '/:id/members/:memberId',
  validateRequest({ params: memberParamsSchema }),
  DynastyController.removeMember
);

// Graph positions
router.put(
  '/:id/graph-positions',
  validateRequest({
    params: idParamsSchema,
    body: saveGraphPositionsSchema,
  }),
  DynastyController.saveGraphPositions
);

// Family links
router.post(
  '/:id/family-links',
  validateRequest({
    params: idParamsSchema,
    body: createDynastyRelationSchema.omit({ dynastyId: true }),
  }),
  DynastyController.addFamilyLink
);

router.delete(
  '/:id/family-links/:linkId',
  validateRequest({ params: linkParamsSchema }),
  DynastyController.deleteFamilyLink
);

// Events (reorder before /:eventId routes)
router.post(
  '/:id/events/reorder',
  validateRequest({
    params: idParamsSchema,
    body: reorderDynastyEventsSchema,
  }),
  DynastyController.reorderEvents
);

router.post(
  '/:id/events',
  validateRequest({
    params: idParamsSchema,
    body: createDynastyEventSchema.omit({ dynastyId: true }),
  }),
  DynastyController.addEvent
);

router.put(
  '/:id/events/:eventId',
  validateRequest({
    params: eventParamsSchema,
    body: updateDynastyEventSchema,
  }),
  DynastyController.updateEvent
);

router.delete(
  '/:id/events/:eventId',
  validateRequest({ params: eventParamsSchema }),
  DynastyController.deleteEvent
);

export default router;