import type { Request, Response } from 'express';
import { DogmaService } from '../services/dogma.service';
import { TagService } from '../services/tag.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ok, created } from '../utils/apiResponse';
import { parseId } from '../utils/parseId';
import { BadRequestError } from '../middleware/errorHandler';

export class DogmaController {
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
    const branchId = DogmaController.parseBranchId(req.query.branchId);

    const limit = Number(req.query.limit);
    const offset = Number(req.query.offset);

    const result = DogmaService.getAll(projectId, {
      category: typeof req.query.category === 'string' ? req.query.category : undefined,
      importance: typeof req.query.importance === 'string' ? req.query.importance : undefined,
      status: typeof req.query.status === 'string' ? req.query.status : undefined,
      search: typeof req.query.search === 'string' ? req.query.search : undefined,
      limit: Number.isFinite(limit) ? limit : undefined,
      offset: Number.isFinite(offset) ? offset : undefined,
    }, branchId);

    return ok(res, result);
  });

  static getById = asyncHandler(async (req: Request, res: Response) => {
    const id = parseId(req.params.id, 'dogma id');
    const branchId = DogmaController.parseBranchId(req.query.branchId);
    const dogma = DogmaService.getById(id, branchId);
    return ok(res, dogma);
  });

  static create = asyncHandler(async (req: Request, res: Response) => {
    const branchId = DogmaController.parseBranchId(req.body?.branchId);
    if (branchId) {
      throw new BadRequestError('Branch-local dogma create is not supported in MVP');
    }
    const dogma = DogmaService.create(req.body);
    return created(res, dogma);
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const id = parseId(req.params.id, 'dogma id');
    const branchId = DogmaController.parseBranchId(req.body?.branchId);
    const dogma = DogmaService.update(id, req.body, branchId);
    return ok(res, dogma);
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    const id = parseId(req.params.id, 'dogma id');
    const branchId = DogmaController.parseBranchIdRequiredIfPresent(req.query.branchId);
    DogmaService.delete(id, branchId);
    return ok(res, undefined, 'Dogma deleted');
  });

  static reorder = asyncHandler(async (req: Request, res: Response) => {
    const projectId = req.body?.projectId;
    const orderedIds = req.body?.orderedIds;
    const branchId = DogmaController.parseBranchId(req.body?.branchId);

    if (typeof projectId !== 'number') {
      throw new BadRequestError('projectId must be a number');
    }

    if (!Array.isArray(orderedIds)) {
      throw new BadRequestError('orderedIds must be an array');
    }

    DogmaService.reorder(projectId, orderedIds, branchId);
    const result = DogmaService.getAll(projectId, undefined, branchId);
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