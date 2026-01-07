import { Router } from 'express';
import { CreateMarkerSchema, PatchMarkerSchema } from '../validation/markers.zod.js';
import { createMarker, deleteMarker, listMarkers, patchMarker } from '../services/markers.service.js';

export const markersRouter = Router();

markersRouter.get('/maps/:mapId/markers', async (req, res, next) => {
  try {
    const markers = await listMarkers(req.params.mapId);
    res.json(markers);
  } catch (e) {
    next(e);
  }
});

markersRouter.post('/maps/:mapId/markers', async (req, res, next) => {
  try {
    const parsed = CreateMarkerSchema.parse(req.body ?? {});
    const marker = await createMarker(req.params.mapId, parsed);
    res.status(201).json(marker);
  } catch (e) {
    next(e);
  }
});

markersRouter.patch('/markers/:markerId', async (req, res, next) => {
  try {
    const parsed = PatchMarkerSchema.parse(req.body ?? {});
    const marker = await patchMarker(req.params.markerId, parsed);
    res.json(marker);
  } catch (e) {
    next(e);
  }
});

markersRouter.delete('/markers/:markerId', async (req, res, next) => {
  try {
    await deleteMarker(req.params.markerId);
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});
