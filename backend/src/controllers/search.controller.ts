import type { Request, Response } from 'express';
import { SearchService } from '../services/search.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/apiResponse.js';
import { parseId } from '../utils/parseId.js';

export class SearchController {
  static search = asyncHandler(async (req: Request, res: Response) => {
    const rawProjectId = req.query.projectId as string | undefined;
    const query = (req.query.q as string | undefined)?.trim() || '';

    if (!rawProjectId || !query) {
      return ok(res, []);
    }

    const projectId = parseId(rawProjectId, 'project id');
    const branchIdRaw = req.query.branchId;
    const branchId =
      branchIdRaw === undefined || branchIdRaw === null || branchIdRaw === ''
        ? undefined
        : Number(branchIdRaw);
    const branchIdParsed =
      typeof branchId === 'number' && Number.isInteger(branchId) && branchId > 0 ? branchId : undefined;

    const limitValue = Number(req.query.limit);
    const limit = Number.isFinite(limitValue)
      ? Math.max(1, Math.min(Math.trunc(limitValue), 50))
      : 20;

    const results = SearchService.search(projectId, query, limit, branchIdParsed);
    return ok(res, results);
  });
}