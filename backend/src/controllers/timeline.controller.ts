import type { Request, Response } from 'express';
import { TimelineService } from '../services/timeline.service.js';
import { TagService } from '../services/tag.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, created } from '../utils/apiResponse.js';
import { parseId } from '../utils/parseId.js';
import { BadRequestError } from '../middleware/errorHandler.js';

export class TimelineController {
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

  static getAll = asyncHandler(async (req: Request, res: Response) => {
    const projectId = parseId(req.query.projectId as string, 'project id');
    const era = typeof req.query.era === 'string' ? req.query.era : undefined;
    const branchId = TimelineController.parseBranchId(req.query.branchId);

    const events = TimelineService.getAll(projectId, era, branchId);
    return ok(res, events);
  });

  static getById = asyncHandler(async (req: Request, res: Response) => {
    const id = parseId(req.params.id, 'timeline event id');
    const branchId = TimelineController.parseBranchId(req.query.branchId);
    const event = TimelineService.getById(id, branchId);
    return ok(res, event);
  });

  static create = asyncHandler(async (req: Request, res: Response) => {
    const branchId = TimelineController.parseBranchId(req.body?.branchId);
    const event = TimelineService.create(req.body, branchId);
    return created(res, event);
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const id = parseId(req.params.id, 'timeline event id');
    const branchId = TimelineController.parseBranchId(req.body?.branchId);
    const event = TimelineService.update(id, req.body, branchId);
    return ok(res, event);
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    const id = parseId(req.params.id, 'timeline event id');
    const branchId = TimelineController.parseBranchIdRequiredIfPresent(req.query.branchId);
    TimelineService.delete(id, branchId);
    return ok(res, undefined, 'Timeline event deleted');
  });

  static reorder = asyncHandler(async (req: Request, res: Response) => {
    const projectId = Number(req.body?.projectId);
    const orderedIds = req.body?.orderedIds;
    const branchId = TimelineController.parseBranchId(req.body?.branchId);

    if (!Number.isInteger(projectId) || projectId <= 0) {
      throw new BadRequestError('Valid projectId is required');
    }

    if (!Array.isArray(orderedIds)) {
      throw new BadRequestError('orderedIds must be an array');
    }

    const events = TimelineService.reorder(projectId, orderedIds, branchId);
    return ok(res, events);
  });

  static setTags = asyncHandler(async (req: Request, res: Response) => {
    const id = parseId(req.params.id, 'timeline event id');
    const event = TimelineService.getById(id);
    const tagIds = req.body?.tagIds;

    if (!Array.isArray(tagIds)) {
      throw new BadRequestError('tagIds must be an array');
    }

    const tags = TagService.setTagsForEntity(
      event.projectId,
      'timeline_event',
      id,
      tagIds
    );

    return ok(res, tags);
  });
}