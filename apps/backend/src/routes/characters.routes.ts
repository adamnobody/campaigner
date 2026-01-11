import { Router } from 'express';
import { CreateCharacterSchema, PatchCharacterSchema } from '../validation/characters.zod.js';
import { createCharacter, deleteCharacter, listCharacters, patchCharacter } from '../services/characters.service.js';

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
