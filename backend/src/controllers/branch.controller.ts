import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { BranchService } from '../services/branch.service';
import { created, noContent, ok } from '../utils/apiResponse';
import { parseId } from '../utils/parseId';

export class BranchController {
  static getAll = asyncHandler(async (req: Request, res: Response) => {
    const projectId = parseId(String(req.query.projectId), 'project id');
    return ok(res, BranchService.getAll(projectId));
  });

  static create = asyncHandler(async (req: Request, res: Response) => {
    return created(res, BranchService.create(req.body));
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const id = parseId(req.params.id, 'branch id');
    return ok(res, BranchService.update(id, req.body));
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    const id = parseId(req.params.id, 'branch id');
    BranchService.delete(id);
    return noContent(res);
  });
}
