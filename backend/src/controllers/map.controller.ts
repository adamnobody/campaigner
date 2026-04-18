import type { Request, Response } from 'express';
import { mapService } from '../services/map.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, created } from '../utils/apiResponse.js';
import { parseId } from '../utils/parseId.js';
import { BadRequestError } from '../middleware/errorHandler.js';

export class MapController {
  private static parseBranchId(input: unknown): number | undefined {
    if (input === undefined || input === null || input === '') return undefined;
    const branchId = Number(input);
    return Number.isInteger(branchId) && branchId > 0 ? branchId : undefined;
  }

  private static parseBranchIdRequiredIfPresent(input: unknown): number | undefined {
    if (input === undefined || input === null || input === '') return undefined;
    const branchId = Number(input);
    if (!Number.isInteger(branchId) || branchId <= 0) {
      throw new BadRequestError('Invalid branchId');
    }
    return branchId;
  }

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

  static getTerritorySummariesForProject = asyncHandler(async (req: Request, res: Response) => {
    const projectId = parseId(req.params.projectId, 'project id');
    const rows = mapService.listTerritorySummariesForProject(projectId);
    return ok(res, rows);
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
    const branchId = MapController.parseBranchId(req.query.branchId);
    const markers = mapService.getMarkersByMapId(mapId, branchId);
    return ok(res, markers);
  });

  static createMarker = asyncHandler(async (req: Request, res: Response) => {
    const branchId = MapController.parseBranchId(req.body?.branchId);
    if (branchId) {
      throw new BadRequestError('Branch-local marker create is not supported in MVP');
    }
    const mapId = parseId(req.params.mapId, 'map id');
    const marker = mapService.createMarker(mapId, req.body);
    return created(res, marker);
  });

  static updateMarker = asyncHandler(async (req: Request, res: Response) => {
    const markerId = parseId(req.params.markerId, 'marker id');
    const branchId = MapController.parseBranchId(req.body?.branchId);
    const updated = mapService.updateMarker(markerId, req.body, branchId);
    return ok(res, updated);
  });

  static deleteMarker = asyncHandler(async (req: Request, res: Response) => {
    const markerId = parseId(req.params.markerId, 'marker id');
    const branchId = MapController.parseBranchIdRequiredIfPresent(req.query.branchId);
    mapService.deleteMarker(markerId, branchId);
    return ok(res, undefined, 'Marker deleted');
  });

  // ==================== Территории ====================

  static getTerritories = asyncHandler(async (req: Request, res: Response) => {
    const mapId = parseId(req.params.mapId, 'map id');
    const branchId = MapController.parseBranchId(req.query.branchId);
    const territories = mapService.getTerritoriesByMapId(mapId, branchId);
    return ok(res, territories);
  });

  static createTerritory = asyncHandler(async (req: Request, res: Response) => {
    const mapId = parseId(req.params.mapId, 'map id');
    const territory = mapService.createTerritory(mapId, req.body);
    return created(res, territory);
  });

  static updateTerritory = asyncHandler(async (req: Request, res: Response) => {
    const territoryId = parseId(req.params.territoryId, 'territory id');
    const branchId = MapController.parseBranchId(req.body?.branchId);
    const updated = mapService.updateTerritory(territoryId, req.body, branchId);
    return ok(res, updated);
  });

  static deleteTerritory = asyncHandler(async (req: Request, res: Response) => {
    const territoryId = parseId(req.params.territoryId, 'territory id');
    const branchId = MapController.parseBranchIdRequiredIfPresent(req.query.branchId);
    mapService.deleteTerritory(territoryId, branchId);
    return ok(res, undefined, 'Territory deleted');
  });
}