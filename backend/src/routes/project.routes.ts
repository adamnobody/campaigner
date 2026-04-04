import { Router } from 'express';
import { z } from 'zod';
import { createDiskUpload } from '../middleware/createUpload';
import { ProjectController } from '../controllers/project.controller';
import { validateRequest } from '../middleware/validateRequest';
import {
  createProjectSchema,
  updateProjectSchema,
} from '@campaigner/shared';
import { idParamsSchema } from './commonSchemas';

const router = Router();

const upload = createDiskUpload({
  folder: 'maps',
  filenamePrefix: 'project-map',
});

const importProjectSchema = z.object({
  version: z.string(),
  project: z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    status: z.string().optional(),
    mapImageBase64: z.string().nullable().optional(),
  }),
  characters: z.array(z.any()).optional(),
  relationships: z.array(z.any()).optional(),
  notes: z.array(z.any()).optional(),
  folders: z.array(z.any()).optional(),
  maps: z.array(z.any()).optional(),
  markers: z.array(z.any()).optional(),
  timelineEvents: z.array(z.any()).optional(),
  tags: z.array(z.any()).optional(),
  tagAssociations: z.array(z.any()).optional(),
});

router.get('/', ProjectController.getAll);

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

export default router;
