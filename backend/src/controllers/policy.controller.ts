import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ok, created } from '../utils/apiResponse';
import { parseId } from '../utils/parseId';
import { PolicyService } from '../services/policy.service';

export class PolicyController {
  static getAll = asyncHandler(async (req: Request, res: Response) => {
    const projectId = parseId(String(req.query.projectId), 'project id');
    return ok(res, PolicyService.getAll(projectId));
  });

  static getById = asyncHandler(async (req: Request, res: Response) => {
    const id = parseId(req.params.id, 'policy id');
    return ok(res, PolicyService.getById(id));
  });

  static create = asyncHandler(async (req: Request, res: Response) => {
    return created(res, PolicyService.create(req.body));
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const id = parseId(req.params.id, 'policy id');
    return ok(res, PolicyService.update(id, req.body));
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    const id = parseId(req.params.id, 'policy id');
    PolicyService.delete(id);
    return ok(res, undefined, 'Policy deleted');
  });

  static getLinks = asyncHandler(async (req: Request, res: Response) => {
    const policyId = parseId(req.params.id, 'policy id');
    return ok(res, PolicyService.getLinks(policyId));
  });

  static addLink = asyncHandler(async (req: Request, res: Response) => {
    const policyId = parseId(req.params.id, 'policy id');
    return created(res, PolicyService.addLink(policyId, req.body));
  });

  static updateLink = asyncHandler(async (req: Request, res: Response) => {
    const policyId = parseId(req.params.id, 'policy id');
    const linkId = parseId(req.params.linkId, 'policy link id');
    return ok(res, PolicyService.updateLink(policyId, linkId, req.body));
  });

  static removeLink = asyncHandler(async (req: Request, res: Response) => {
    const policyId = parseId(req.params.id, 'policy id');
    const linkId = parseId(req.params.linkId, 'policy link id');
    PolicyService.removeLink(policyId, linkId);
    return ok(res, undefined, 'Policy link removed');
  });
}
