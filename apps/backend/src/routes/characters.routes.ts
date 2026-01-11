import { Router } from 'express';
import multer from 'multer';
import { CreateCharacterSchema, PatchCharacterSchema } from '../validation/characters.zod.js';
import {
  createCharacter,
  deleteCharacter,
  listCharacters,
  patchCharacter,
  setCharacterPhoto,
  clearCharacterPhoto,
  getCharacterPhotoAbsPath
} from '../services/characters.service.js';

const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
const allowedMimes = new Set(['image/png', 'image/jpeg', 'image/svg+xml']);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_PHOTO_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!allowedMimes.has(file.mimetype)) {
      return cb(Object.assign(new Error('Invalid character photo type'), { status: 400, code: 'INVALID_CHARACTER_PHOTO_MIME' }));
    }
    cb(null, true);
  }
});

export const charactersRouter = Router();

charactersRouter.get('/projects/:projectId/characters', async (req, res, next) => {
  try {
    const list = await listCharacters(req.params.projectId);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

charactersRouter.post('/projects/:projectId/characters', async (req, res, next) => {
  try {
    const parsed = CreateCharacterSchema.parse(req.body ?? {});
    const created = await createCharacter(req.params.projectId, parsed);
    res.status(201).json(created);
  } catch (e) {
    next(e);
  }
});

charactersRouter.patch('/characters/:characterId', async (req, res, next) => {
  try {
    const parsed = PatchCharacterSchema.parse(req.body ?? {});
    const updated = await patchCharacter(req.params.characterId, parsed);
    res.json(updated);
  } catch (e) {
    next(e);
  }
});

charactersRouter.delete('/characters/:characterId', async (req, res, next) => {
  try {
    await deleteCharacter(req.params.characterId);
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

// Photo upload
charactersRouter.post('/characters/:characterId/photo', upload.single('file'), async (req, res, next) => {
  try {
    const file = req.file;
    if (!file) throw Object.assign(new Error('file is required'), { status: 400, code: 'FILE_REQUIRED' });

    const updated = await setCharacterPhoto(req.params.characterId, file);
    res.json(updated);
  } catch (e) {
    next(e);
  }
});

// Photo get
charactersRouter.get('/characters/:characterId/photo', async (req, res, next) => {
  try {
    const { absPath, mime } = await getCharacterPhotoAbsPath(req.params.characterId);
    res.type(mime);
    res.sendFile(absPath);
  } catch (e) {
    next(e);
  }
});

charactersRouter.delete('/characters/:characterId/photo', async (req, res, next) => {
  try {
    const updated = await clearCharacterPhoto(req.params.characterId);
    res.json(updated);
  } catch (e) {
    next(e);
  }
});
