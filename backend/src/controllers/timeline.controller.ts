import type { Request, Response } from 'express';
import { TimelineService } from '../services/timeline.service';
import { TagService } from '../services/tag.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ok, created } from '../utils/apiResponse';
import { parseId } from '../utils/parseId';
import { BadRequestError } from '../middleware/errorHandler';

export class TimelineController {
  static getAll = asyncHandler(async (req: Request, res: Response) => {
    const projectId = parseId(req.query.projectId as string, 'project id');
    const era = typeof req.query.era === 'string' ? req.query.era : undefined;

    const events = TimelineService.getAll(projectId, era);
    return ok(res, events);
  });

  static getById = asyncHandler(async (req: Request, res: Response) => {
    const id = parseId(req.params.id, 'timeline event id');
    const event = TimelineService.getById(id);
    return ok(res, event);
  });

  static create = asyncHandler(async (req: Request, res: Response) => {
    const event = TimelineService.create(req.body);
    return created(res, event);
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const id = parseId(req.params.id, 'timeline event id');
    const event = TimelineService.update(id, req.body);
    return ok(res, event);
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    const id = parseId(req.params.id, 'timeline event id');
    TimelineService.delete(id);
    return ok(res, undefined, 'Timeline event deleted');
  });

  static reorder = asyncHandler(async (req: Request, res: Response) => {
    const projectId = Number(req.body?.projectId);
    const orderedIds = req.body?.orderedIds;

    if (!Number.isInteger(projectId) || projectId <= 0) {
      throw new BadRequestError('Valid projectId is required');
    }

    if (!Array.isArray(orderedIds)) {
      throw new BadRequestError('orderedIds must be an array');
    }

    const events = TimelineService.reorder(projectId, orderedIds);
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