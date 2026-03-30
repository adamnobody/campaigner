import type { Request, Response } from 'express';
import { TagService } from '../services/tag.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ok, created, noContent } from '../utils/apiResponse';
import { parseId } from '../utils/parseId';
import { BadRequestError } from '../middleware/errorHandler';

export const getTags = asyncHandler(async (req: Request, res: Response) => {
  const projectId = Number(req.query.projectId);

  if (!Number.isInteger(projectId) || projectId <= 0) {
    throw new BadRequestError('Valid projectId is required');
  }

  const tags = TagService.getAll(projectId);
  return ok(res, tags);
});

export const createTag = asyncHandler(async (req: Request, res: Response) => {
  const { projectId, ...data } = req.body;

  if (!Number.isInteger(projectId) || projectId <= 0) {
    throw new BadRequestError('Valid projectId is required');
  }

  const tag = TagService.create(projectId, data);
  return created(res, tag);
});

export const deleteTag = asyncHandler(async (req: Request, res: Response) => {
  const id = parseId(req.params.id, 'tag id');
  TagService.delete(id);
  return noContent(res);
});