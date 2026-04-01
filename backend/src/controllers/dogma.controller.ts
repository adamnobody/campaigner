import type { Request, Response } from 'express';
import { DogmaService } from '../services/dogma.service';
import { TagService } from '../services/tag.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ok, created } from '../utils/apiResponse';
import { parseId } from '../utils/parseId';
import { BadRequestError } from '../middleware/errorHandler';

export class DogmaController {
  static getAll = asyncHandler(async (req: Request, res: Response) => {
    const projectId = parseId(req.query.projectId as string, 'project id');

    const limit = Number(req.query.limit);
    const offset = Number(req.query.offset);

    const result = DogmaService.getAll(projectId, {
      category: typeof req.query.category === 'string' ? req.query.category : undefined,
      importance: typeof req.query.importance === 'string' ? req.query.importance : undefined,
      status: typeof req.query.status === 'string' ? req.query.status : undefined,
      search: typeof req.query.search === 'string' ? req.query.search : undefined,
      limit: Number.isFinite(limit) ? limit : undefined,
      offset: Number.isFinite(offset) ? offset : undefined,
    });

    return ok(res, result);
  });

  static getById = asyncHandler(async (req: Request, res: Response) => {
    const id = parseId(req.params.id, 'dogma id');
    const dogma = DogmaService.getById(id);
    return ok(res, dogma);
  });

  static create = asyncHandler(async (req: Request, res: Response) => {
    const dogma = DogmaService.create(req.body);
    return created(res, dogma);
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const id = parseId(req.params.id, 'dogma id');
    const dogma = DogmaService.update(id, req.body);
    return ok(res, dogma);
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    const id = parseId(req.params.id, 'dogma id');
    DogmaService.delete(id);
    return ok(res, undefined, 'Dogma deleted');
  });

  static reorder = asyncHandler(async (req: Request, res: Response) => {
    const projectId = req.body?.projectId;
    const orderedIds = req.body?.orderedIds;

    if (typeof projectId !== 'number') {
      throw new BadRequestError('projectId must be a number');
    }

    if (!Array.isArray(orderedIds)) {
      throw new BadRequestError('orderedIds must be an array');
    }

    DogmaService.reorder(projectId, orderedIds);
    const result = DogmaService.getAll(projectId);
    return ok(res, result);
  });

  static setTags = asyncHandler(async (req: Request, res: Response) => {
    const id = parseId(req.params.id, 'dogma id');
    const dogma = DogmaService.getById(id);
    const tagIds = req.body?.tagIds;

    if (!Array.isArray(tagIds)) {
      throw new BadRequestError('tagIds must be an array');
    }

    const tags = TagService.setTagsForEntity(dogma.projectId, 'dogma', id, tagIds);
    return ok(res, tags);
  });
}