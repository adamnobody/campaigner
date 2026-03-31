import { Router } from 'express';
import { z } from 'zod';
import { createDiskUpload } from '../middleware/createUpload';
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  uploadProjectMap,
  exportProject,
  importProject,
} from '../controllers/project.controller';
import { validateRequest } from '../middleware/validateRequest';
import {
  createProjectSchema,
  updateProjectSchema,
} from '@campaigner/shared';

const router = Router();

const upload = createDiskUpload({
  folder: 'maps',
  filenamePrefix: 'project-map',
});

const idParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
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

router.get('/', getProjects);

router.get(
  '/:id',
  validateRequest({ params: idParamsSchema }),
  getProjectById
);

router.post(
  '/',
  validateRequest({ body: createProjectSchema }),
  createProject
);

router.put(
  '/:id',
  validateRequest({
    params: idParamsSchema,
    body: updateProjectSchema,
  }),
  updateProject
);

router.delete(
  '/:id',
  validateRequest({ params: idParamsSchema }),
  deleteProject
);

router.post(
  '/:id/map',
  validateRequest({ params: idParamsSchema }),
  upload.single('mapImage'),
  uploadProjectMap
);

router.get(
  '/:id/export',
  validateRequest({ params: idParamsSchema }),
  exportProject
);

router.post(
  '/import',
  validateRequest({ body: importProjectSchema }),
  importProject
);

export default router;