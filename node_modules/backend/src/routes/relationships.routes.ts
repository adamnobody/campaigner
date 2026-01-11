import { Router } from 'express';
import { CreateRelationshipSchema } from '../validation/relationships.zod.js';
import { createRelationship, deleteRelationship, listRelationships } from '../services/relationships.service.js';

export const relationshipsRouter = Router();

relationshipsRouter.get('/projects/:projectId/relationships', async (req, res, next) => {
  try {
    const list = await listRelationships(req.params.projectId);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

relationshipsRouter.post('/projects/:projectId/relationships', async (req, res, next) => {
  try {
    const parsed = CreateRelationshipSchema.parse(req.body ?? {});
    const created = await createRelationship(req.params.projectId, parsed);
    res.status(201).json(created);
  } catch (e) {
    next(e);
  }
});

relationshipsRouter.delete('/relationships/:relationshipId', async (req, res, next) => {
  try {
    await deleteRelationship(req.params.relationshipId);
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});
