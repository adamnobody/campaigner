import type { Request, Response } from 'express';
import { mapService } from '../services/map.service.js';
import { asyncHandler } from '../utils/asyncHandler';
import { ok, created } from '../utils/apiResponse';
import { parseId } from '../utils/parseId';
import { BadRequestError } from '../middleware/errorHandler';

export class MapController {
  // ==================== Карты ====================

  static getRootMap = asyncHandler(async (req: Request, res: Response) => {
    const projectId = parseId(req.params.projectId, 'project id');
    const map = mapService.getRootMap(projectId);
    return ok(res, map);
  });

  static getMapById = asyncHandler(async (req: Request, res: Response) => {
    const mapId = parseId(req.params.mapId, 'map id');
    const map = mapService.getMapByIdOrThrow(mapId);
    return ok(res, map);
  });

  static getMapTree = asyncHandler(async (req: Request, res: Response) => {
    const projectId = parseId(req.params.projectId, 'project id');
    const maps = mapService.getMapTree(projectId);
    return ok(res, maps);
  });

  static createMap = asyncHandler(async (req: Request, res: Response) => {
    const map = mapService.createMap(req.body);
    return created(res, map);
  });

  static updateMap = asyncHandler(async (req: Request, res: Response) => {
    const mapId = parseId(req.params.mapId, 'map id');
    const updated = mapService.updateMap(mapId, req.body);
    return ok(res, updated);
  });

  static uploadMapImage = asyncHandler(async (req: Request, res: Response) => {
    const mapId = parseId(req.params.mapId, 'map id');

    if (!req.file) {
      throw new BadRequestError('File is required');
    }

    const map = mapService.uploadMapImage(mapId, req.file);
    return ok(res, map);
  });

  static deleteMap = asyncHandler(async (req: Request, res: Response) => {
    const mapId = parseId(req.params.mapId, 'map id');
    mapService.deleteMap(mapId);
    return ok(res, undefined, 'Map deleted');
  });

  // ==================== Маркеры ====================

  static getMarkers = asyncHandler(async (req: Request, res: Response) => {
    const mapId = parseId(req.params.mapId, 'map id');
    const markers = mapService.getMarkersByMapId(mapId);
    return ok(res, markers);
  });

  static createMarker = asyncHandler(async (req: Request, res: Response) => {
    const mapId = parseId(req.params.mapId, 'map id');
    const marker = mapService.createMarker(mapId, req.body);
    return created(res, marker);
  });

  static updateMarker = asyncHandler(async (req: Request, res: Response) => {
    const markerId = parseId(req.params.markerId, 'marker id');
    const updated = mapService.updateMarker(markerId, req.body);
    return ok(res, updated);
  });

  static deleteMarker = asyncHandler(async (req: Request, res: Response) => {
    const markerId = parseId(req.params.markerId, 'marker id');
    mapService.deleteMarker(markerId);
    return ok(res, undefined, 'Marker deleted');
  });

  // ==================== Территории ====================

  static getTerritories = asyncHandler(async (req: Request, res: Response) => {
    const mapId = parseId(req.params.mapId, 'map id');
    const territories = mapService.getTerritoriesByMapId(mapId);
    return ok(res, territories);
  });

  static createTerritory = asyncHandler(async (req: Request, res: Response) => {
    const mapId = parseId(req.params.mapId, 'map id');
    const territory = mapService.createTerritory(mapId, req.body);
    return created(res, territory);
  });

  static updateTerritory = asyncHandler(async (req: Request, res: Response) => {
    const territoryId = parseId(req.params.territoryId, 'territory id');
    const updated = mapService.updateTerritory(territoryId, req.body);
    return ok(res, updated);
  });

  static deleteTerritory = asyncHandler(async (req: Request, res: Response) => {
    const territoryId = parseId(req.params.territoryId, 'territory id');
    mapService.deleteTerritory(territoryId);
    return ok(res, undefined, 'Territory deleted');
  });
}