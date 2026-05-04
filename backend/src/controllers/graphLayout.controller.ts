import type { Request, Response } from 'express';
import type { GraphLayoutDataV1 } from '@campaigner/shared';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, noContent } from '../utils/apiResponse.js';
import { parseId } from '../utils/parseId.js';
import { GraphLayoutService } from '../services/graphLayout.service.js';

export class GraphLayoutController {
  static get = asyncHandler(async (req: Request, res: Response) => {
    const projectId = parseId(req.params.id, 'project id');
    const graphType = String(req.query.graphType ?? '');
    const branchId =
      req.query.branchId !== undefined && req.query.branchId !== ''
        ? parseId(String(req.query.branchId), 'branch id')
        : undefined;
    const layoutData = GraphLayoutService.getParsed(projectId, graphType, branchId);
    return ok(res, { layoutData });
  });

  static put = asyncHandler(async (req: Request, res: Response) => {
    const projectId = parseId(req.params.id, 'project id');
    const { graphType, layoutData, branchId } = req.body as {
      graphType: string;
      layoutData: GraphLayoutDataV1;
      branchId?: number;
    };
    const saved = GraphLayoutService.upsert(projectId, graphType, layoutData, branchId);
    return ok(res, { layoutData: saved });
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    const projectId = parseId(req.params.id, 'project id');
    const graphType = String(req.query.graphType ?? '');
    const branchId =
      req.query.branchId !== undefined && req.query.branchId !== ''
        ? parseId(String(req.query.branchId), 'branch id')
        : undefined;
    GraphLayoutService.delete(projectId, graphType, branchId);
    return noContent(res);
  });
}
