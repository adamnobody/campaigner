import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { created, noContent, ok } from '../utils/apiResponse.js';
import { parseId } from '../utils/parseId.js';
import { AmbitionService } from '../services/ambition.service.js';

export class AmbitionController {
  static getCatalog = asyncHandler(async (req: Request, res: Response) => {
    const projectId = parseId(String(req.query.projectId), 'project id');
    return ok(res, AmbitionService.getCatalog(projectId));
  });

  static create = asyncHandler(async (req: Request, res: Response) => {
    return created(res, AmbitionService.create(req.body));
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const ambitionId = parseId(req.params.id, 'ambition id');
    return ok(res, AmbitionService.update(ambitionId, req.body));
  });

  static updateExclusions = asyncHandler(async (req: Request, res: Response) => {
    const ambitionId = parseId(req.params.id, 'ambition id');
    const excludedIds = (req.body?.excludedIds ?? []) as number[];
    return ok(res, AmbitionService.setExclusions(ambitionId, excludedIds));
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    const ambitionId = parseId(req.params.id, 'ambition id');
    AmbitionService.delete(ambitionId);
    return noContent(res);
  });

  static getFactionAmbitions = asyncHandler(async (req: Request, res: Response) => {
    const factionId = parseId(req.params.factionId, 'faction id');
    return ok(res, AmbitionService.getFactionAmbitions(factionId));
  });

  static assignFactionAmbition = asyncHandler(async (req: Request, res: Response) => {
    const factionId = parseId(req.params.factionId, 'faction id');
    const ambitionId = parseId(String(req.body.ambitionId), 'ambition id');
    AmbitionService.assignToFaction(factionId, ambitionId);
    return noContent(res);
  });

  static unassignFactionAmbition = asyncHandler(async (req: Request, res: Response) => {
    const factionId = parseId(req.params.factionId, 'faction id');
    const ambitionId = parseId(req.params.ambitionId, 'ambition id');
    AmbitionService.unassignFromFaction(factionId, ambitionId);
    return noContent(res);
  });
}
