import { Router } from 'express';
import multer from 'multer';
import { CreateMapFieldsSchema } from '../validation/maps.zod.js';
import { createMap, getMapFileAbsPath, listMaps, deleteMap } from '../services/maps.service.js';


const MAX_MAP_BYTES = 40 * 1024 * 1024;
const allowedMimes = new Set(['image/png', 'image/jpeg', 'image/svg+xml']);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_MAP_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!allowedMimes.has(file.mimetype)) return cb(Object.assign(new Error('Invalid map file type'), { status: 400, code: 'INVALID_MAP_MIME' }));
    cb(null, true);
  }
});

export const mapsRouter = Router();

mapsRouter.get('/projects/:projectId/maps', async (req, res, next) => {
  try {
    const maps = await listMaps(req.params.projectId);
    res.json(maps);
  } catch (e) {
    next(e);
  }
});

mapsRouter.post('/projects/:projectId/maps', upload.single('file'), async (req, res, next) => {
  try {
    const file = req.file;
    if (!file) throw Object.assign(new Error('file is required'), { status: 400, code: 'FILE_REQUIRED' });

    const fields = CreateMapFieldsSchema.parse({
      title: req.body?.title,
      parent_map_id: req.body?.parent_map_id
    });

    const map = await createMap({
      projectId: req.params.projectId,
      title: fields.title,
      parent_map_id: fields.parent_map_id,
      file
    });

    res.status(201).json(map);
  } catch (e) {
    next(e);
  }
});

mapsRouter.get('/maps/:mapId/file', async (req, res, next) => {
  try {
    const { absPath } = await getMapFileAbsPath(req.params.mapId);
    res.sendFile(absPath);
  } catch (e) {
    next(e);
  }
});

mapsRouter.delete('/maps/:mapId', async (req, res, next) => {
  try {
    await deleteMap(req.params.mapId);
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});
