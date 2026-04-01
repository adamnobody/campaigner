import type { Request, Response } from 'express';
import { SearchService } from '../services/search.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ok } from '../utils/apiResponse';
import { parseId } from '../utils/parseId';

export class SearchController {
  static search = asyncHandler(async (req: Request, res: Response) => {
    const rawProjectId = req.query.projectId as string | undefined;
    const query = (req.query.q as string | undefined)?.trim() || '';

    if (!rawProjectId || !query) {
      return ok(res, []);
    }

    const projectId = parseId(rawProjectId, 'project id');

    const limitValue = Number(req.query.limit);
    const limit = Number.isFinite(limitValue) ? limitValue : 20;

    const results = SearchService.search(projectId, query, limit);
    return ok(res, results);
  });
}