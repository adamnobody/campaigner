import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

import { createDiskUpload } from '../middleware/createUpload';

const upload = createDiskUpload({ folder: 'maps' });

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

const uploadsDir = path.resolve('data/uploads/maps');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

router.get('/', getProjects);
router.get('/:id', getProjectById);
router.post('/', validateRequest({ body: createProjectSchema }), createProject);
router.put('/:id', validateRequest({ body: updateProjectSchema }), updateProject);
router.delete('/:id', deleteProject);

router.post('/:id/map', upload.single('mapImage'), uploadProjectMap);
router.get('/:id/export', exportProject);
router.post('/import', importProject);

export default router;