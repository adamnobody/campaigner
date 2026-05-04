import { Router } from 'express';
import { z } from 'zod';
import { createDiskUpload } from '../middleware/createUpload.js';
import { ProjectController } from '../controllers/project.controller.js';
import { GraphLayoutController } from '../controllers/graphLayout.controller.js';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  createProjectSchema,
  updateProjectSchema,
} from '@campaigner/shared';
import { idParamsSchema } from './commonSchemas.js';

const router = Router();

const upload = createDiskUpload({
  folder: 'maps',
  filenamePrefix: 'project-map',
});

const importArraySchema = z.array(z.record(z.string(), z.unknown())).optional();

const createDemoProjectBodySchema = z.preprocess(
  (val) => (val == null || typeof val !== 'object' ? {} : val),
  z
    .object({
      locale: z.enum(['en', 'ru']).optional(),
    })
    .strict()
);

const importProjectSchema = z.object({
  version: z.string(),
  project: z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    status: z.string().optional(),
    mapImageBase64: z.string().nullable().optional(),
  }),
  characters: importArraySchema,
  relationships: importArraySchema,
  notes: importArraySchema,
  folders: importArraySchema,
  maps: importArraySchema,
  markers: importArraySchema,
  territories: importArraySchema,
  timelineEvents: importArraySchema,
  tags: importArraySchema,
  tagAssociations: importArraySchema,
  wikiLinks: importArraySchema,
  dogmas: importArraySchema,
  factions: importArraySchema,
  factionRanks: importArraySchema,
  factionMembers: importArraySchema,
  factionRelations: importArraySchema,
  dynasties: importArraySchema,
  dynastyMembers: importArraySchema,
  dynastyFamilyLinks: importArraySchema,
  dynastyEvents: importArraySchema,
  scenarioBranches: importArraySchema,
  graphLayouts: importArraySchema,
  importLocale: z.enum(['en', 'ru']).optional(),
});

router.get('/', ProjectController.getAll);

const graphLayoutQuerySchema = z.object({
  graphType: z.string().min(1).max(64),
  branchId: z.coerce.number().int().positive().optional(),
});

const graphLayoutPutBodySchema = z.object({
  graphType: z.string().min(1).max(64),
  layoutData: z.record(z.unknown()),
  branchId: z.number().int().positive().optional(),
});

router.get(
  '/:id/graph-layout',
  validateRequest({ params: idParamsSchema, query: graphLayoutQuerySchema }),
  GraphLayoutController.get
);

router.put(
  '/:id/graph-layout',
  validateRequest({ params: idParamsSchema, body: graphLayoutPutBodySchema }),
  GraphLayoutController.put
);

router.delete(
  '/:id/graph-layout',
  validateRequest({ params: idParamsSchema, query: graphLayoutQuerySchema }),
  GraphLayoutController.delete
);

router.get(
  '/:id',
  validateRequest({ params: idParamsSchema }),
  ProjectController.getById
);
router.post(
  '/',
  validateRequest({ body: createProjectSchema }),
  ProjectController.create
);

router.put(
  '/:id',
  validateRequest({
    params: idParamsSchema,
    body: updateProjectSchema,
  }),
  ProjectController.update
);

router.delete(
  '/:id',
  validateRequest({ params: idParamsSchema }),
  ProjectController.delete
);

router.post(
  '/:id/map',
  validateRequest({ params: idParamsSchema }),
  upload.single('mapImage'),
  ProjectController.uploadMap
);

router.get(
  '/:id/export',
  validateRequest({ params: idParamsSchema }),
  ProjectController.export
);

router.post(
  '/import',
  validateRequest({ body: importProjectSchema }),
  ProjectController.import
);

router.post(
  '/demo',
  validateRequest({ body: createDemoProjectBodySchema }),
  ProjectController.createDemo
);

export default router;
