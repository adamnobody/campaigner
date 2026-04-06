import type { Request, Response } from 'express';
import { ProjectService } from '../services/project.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ok, created, noContent } from '../utils/apiResponse';
import { parseId } from '../utils/parseId';
import { BadRequestError } from '../middleware/errorHandler';

export class ProjectController {
  static getAll = asyncHandler(async (_req: Request, res: Response) => {
    const projects = ProjectService.getAll();
    return ok(res, projects);
  });

  static getById = asyncHandler(async (req: Request, res: Response) => {
    const id = parseId(req.params.id, 'project id');
    const project = ProjectService.getById(id);
    return ok(res, project);
  });

  static create = asyncHandler(async (req: Request, res: Response) => {
    const project = ProjectService.create(req.body);
    return created(res, project);
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const id = parseId(req.params.id, 'project id');
    const project = ProjectService.update(id, req.body);
    return ok(res, project);
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    const id = parseId(req.params.id, 'project id');
    ProjectService.delete(id);
    return noContent(res);
  });

  static uploadMap = asyncHandler(async (req: Request, res: Response) => {
    const id = parseId(req.params.id, 'project id');
    const file = req.file as Express.Multer.File | undefined;

    if (!file) {
      throw new BadRequestError('Map image file is required');
    }

    const project = ProjectService.updateMapImage(id, file.path.replace(/^.*data/, ''));
    return ok(res, project);
  });

  static export = asyncHandler(async (req: Request, res: Response) => {
    const id = parseId(req.params.id, 'project id');
    const exported = ProjectService.exportProject(id);

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="project-${id}.json"`);

    return res.status(200).send(JSON.stringify({
      success: true,
      data: exported,
    }, null, 2));
  });

  static import = asyncHandler(async (req: Request, res: Response) => {
    const project = ProjectService.importProject(req.body);
    return created(res, project);
  });

  static createDemo = asyncHandler(async (_req: Request, res: Response) => {
    const project = ProjectService.createDemoProject();
    return created(res, project);
  });
}
