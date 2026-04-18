import type { Request, Response } from 'express';
import { PoliticalScaleService } from '../services/politicalScale.service.js';
import { PoliticalScaleAssignmentService } from '../services/politicalScaleAssignment.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { created, ok } from '../utils/apiResponse.js';
import { parseId } from '../utils/parseId.js';

export class PoliticalScaleController {
  static list = asyncHandler(async (req: Request, res: Response) => {
    const entityType = req.query.entityType as 'state' | 'faction';
    const worldId = parseId(req.query.worldId as string, 'world id');
    return ok(res, PoliticalScaleService.list(entityType, worldId));
  });

  static create = asyncHandler(async (req: Request, res: Response) => {
    return created(res, PoliticalScaleService.create(req.body));
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const id = parseId(req.params.id, 'scale id');
    return ok(res, PoliticalScaleService.update(id, req.body));
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    const id = parseId(req.params.id, 'scale id');
    PoliticalScaleService.delete(id);
    return ok(res, undefined, 'Political scale deleted');
  });

  static listAssignments = asyncHandler(async (req: Request, res: Response) => {
    const entityType = req.query.entityType as 'state' | 'faction';
    const entityId = parseId(req.query.entityId as string, 'entity id');
    return ok(res, PoliticalScaleAssignmentService.list(entityType, entityId));
  });

  static replaceAssignments = asyncHandler(async (req: Request, res: Response) => {
    return ok(res, PoliticalScaleAssignmentService.replace(req.body));
  });

  static deleteAssignment = asyncHandler(async (req: Request, res: Response) => {
    const id = parseId(req.params.id, 'assignment id');
    PoliticalScaleAssignmentService.delete(id);
    return ok(res, undefined, 'Assignment deleted');
  });
}
