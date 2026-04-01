import type { Request, Response } from 'express';
import { ProjectService } from '../services/project.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ok, created, noContent } from '../utils/apiResponse';
import { parseId } from '../utils/parseId';
import { BadRequestError } from '../middleware/errorHandler';

export const getProjects = asyncHandler(async (_req: Request, res: Response) => {
  const projects = ProjectService.getAll();
  return ok(res, projects);
});

export const getProjectById = asyncHandler(async (req: Request, res: Response) => {
  const id = parseId(req.params.id, 'project id');
  const project = ProjectService.getById(id);
  return ok(res, project);
});

export const createProject = asyncHandler(async (req: Request, res: Response) => {
  const project = ProjectService.create(req.body);
  return created(res, project);
});

export const updateProject = asyncHandler(async (req: Request, res: Response) => {
  const id = parseId(req.params.id, 'project id');
  const project = ProjectService.update(id, req.body);
  return ok(res, project);
});

export const deleteProject = asyncHandler(async (req: Request, res: Response) => {
  const id = parseId(req.params.id, 'project id');
  ProjectService.delete(id);
  return noContent(res);
});

export const uploadProjectMap = asyncHandler(async (req: Request, res: Response) => {
  const id = parseId(req.params.id, 'project id');
  const file = req.file as Express.Multer.File | undefined;

  if (!file) {
    throw new BadRequestError('Map image file is required');
  }

  const project = ProjectService.updateMapImage(id, file.path.replace(/^.*data/, ''));
  return ok(res, project);
});

export const exportProject = asyncHandler(async (req: Request, res: Response) => {
  const id = parseId(req.params.id, 'project id');
  const exported = ProjectService.exportProject(id);

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="project-${id}.json"`);

  return res.status(200).send(JSON.stringify({
    success: true,
    data: exported,
  }, null, 2));
});

export const importProject = asyncHandler(async (req: Request, res: Response) => {
  const project = ProjectService.importProject(req.body);
  return created(res, project);
});