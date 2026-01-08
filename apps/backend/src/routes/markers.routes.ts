import { Router } from 'express';
import { CreateMarkerSchema, PatchMarkerSchema } from '../validation/markers.zod.js';
import { createMarker, deleteMarker, listMarkers, patchMarker } from '../services/markers.service.js';

export const markersRouter = Router();

// GET /api/maps/:mapId/markers
markersRouter.get('/maps/:mapId/markers', async (req, res, next) => {
  try {
    const markers = await listMarkers(req.params.mapId);
    res.json(markers);
  } catch (e) {
    next(e);
  }
});

// POST /api/maps/:mapId/markers
markersRouter.post('/maps/:mapId/markers', async (req, res, next) => {
  try {
    const parsed = CreateMarkerSchema.parse(req.body ?? {});
    const marker = await createMarker(req.params.mapId, parsed);
    res.status(201).json(marker);
  } catch (e) {
    next(e);
  }
});

// PATCH /api/markers/:markerId
markersRouter.patch('/markers/:markerId', async (req, res, next) => {
  try {
    const parsed = PatchMarkerSchema.parse(req.body ?? {});
    const marker = await patchMarker(req.params.markerId, parsed);
    res.json(marker);
  } catch (e) {
    next(e);
  }
});

// DELETE /api/markers/:markerId
markersRouter.delete('/markers/:markerId', async (req, res, next) => {
  try {
    await deleteMarker(req.params.markerId);
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});
