import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { created, noContent, ok } from '../utils/apiResponse';
import { parseId } from '../utils/parseId';
import { GeoStoryService } from '../services/geoStory.service';

export class GeoStoryController {
  static list = asyncHandler(async (req: Request, res: Response) => {
    return ok(res, GeoStoryService.list({
      projectId: parseId(String(req.query.projectId), 'project id'),
      branchId: parseId(String(req.query.branchId), 'branch id'),
      mapId: req.query.mapId ? parseId(String(req.query.mapId), 'map id') : undefined,
      territoryId: req.query.territoryId ? parseId(String(req.query.territoryId), 'territory id') : undefined,
    }));
  });

  static create = asyncHandler(async (req: Request, res: Response) => {
    return created(res, GeoStoryService.create(req.body));
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const id = parseId(req.params.id, 'geo story id');
    return ok(res, GeoStoryService.update(id, req.body));
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    const id = parseId(req.params.id, 'geo story id');
    GeoStoryService.delete(id);
    return noContent(res);
  });
}
