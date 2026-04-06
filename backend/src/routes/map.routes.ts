import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { MapController } from '../controllers/map.controller.js';
import { validateRequest } from '../middleware/validateRequest';
import {
  createMapSchema,
  updateMapSchema,
  createMarkerSchema,
  updateMarkerSchema,
  createTerritorySchema,
  updateTerritorySchema,
} from '@campaigner/shared';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

const projectIdParamsSchema = z.object({
  projectId: z.coerce.number().int().positive(),
});

const mapIdParamsSchema = z.object({
  mapId: z.coerce.number().int().positive(),
});

const markerIdParamsSchema = z.object({
  markerId: z.coerce.number().int().positive(),
});

const territoryIdParamsSchema = z.object({
  territoryId: z.coerce.number().int().positive(),
});

const branchQuerySchema = z.object({
  branchId: z.coerce.number().int().positive().optional(),
});

const updateTerritoryWithBranchSchema = z.object({
  branchId: z.number().int().positive().optional(),
}).and(updateTerritorySchema);

// ==================== Карты ====================

router.get(
  '/projects/:projectId/maps/root',
  validateRequest({ params: projectIdParamsSchema, query: branchQuerySchema }),
  MapController.getRootMap
);

router.get(
  '/projects/:projectId/maps/tree',
  validateRequest({ params: projectIdParamsSchema, query: branchQuerySchema }),
  MapController.getMapTree
);

router.get(
  '/maps/:mapId',
  validateRequest({ params: mapIdParamsSchema, query: branchQuerySchema }),
  MapController.getMapById
);

router.post(
  '/maps',
  validateRequest({ body: createMapSchema.extend({ branchId: z.number().int().positive().optional() }) }),
  MapController.createMap
);

router.put(
  '/maps/:mapId',
  validateRequest({
    params: mapIdParamsSchema,
    body: updateMapSchema.extend({ branchId: z.number().int().positive().optional() }),
  }),
  MapController.updateMap
);

router.delete(
  '/maps/:mapId',
  validateRequest({ params: mapIdParamsSchema }),
  MapController.deleteMap
);

router.post(
  '/maps/:mapId/image',
  validateRequest({ params: mapIdParamsSchema }),
  upload.single('image'),
  MapController.uploadMapImage
);

// ==================== Маркеры ====================

router.get(
  '/maps/:mapId/markers',
  validateRequest({ params: mapIdParamsSchema, query: branchQuerySchema }),
  MapController.getMarkers
);

router.post(
  '/maps/:mapId/markers',
  validateRequest({
    params: mapIdParamsSchema,
    body: createMarkerSchema.extend({ branchId: z.number().int().positive().optional() }),
  }),
  MapController.createMarker
);

router.put(
  '/markers/:markerId',
  validateRequest({
    params: markerIdParamsSchema,
    body: updateMarkerSchema.extend({ branchId: z.number().int().positive().optional() }),
  }),
  MapController.updateMarker
);

router.delete(
  '/markers/:markerId',
  validateRequest({ params: markerIdParamsSchema, query: branchQuerySchema }),
  MapController.deleteMarker
);

// ==================== Территории ====================

router.get(
  '/maps/:mapId/territories',
  validateRequest({ params: mapIdParamsSchema, query: branchQuerySchema }),
  MapController.getTerritories
);

router.post(
  '/maps/:mapId/territories',
  validateRequest({
    params: mapIdParamsSchema,
    body: createTerritorySchema,
  }),
  MapController.createTerritory
);

router.put(
  '/territories/:territoryId',
  validateRequest({
    params: territoryIdParamsSchema,
    body: updateTerritoryWithBranchSchema,
  }),
  MapController.updateTerritory
);

router.delete(
  '/territories/:territoryId',
  validateRequest({ params: territoryIdParamsSchema, query: branchQuerySchema }),
  MapController.deleteTerritory
);

export default router;