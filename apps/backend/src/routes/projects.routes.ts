import { Router } from 'express';
import { CreateProjectSchema } from '../validation/projects.zod.js';
import { createProject, listProjects } from '../services/projects.service.js';

export const projectsRouter = Router();

projectsRouter.get('/', async (_req, res, next) => {
  try {
    const projects = await listProjects();
    res.json(projects);
  } catch (e) {
    next(e);
  }
});

projectsRouter.post('/', async (req, res, next) => {
  try {
    const parsed = CreateProjectSchema.parse(req.body ?? {});
    const project = await createProject(parsed);
    res.status(201).json(project);
  } catch (e) {
    next(e);
  }
});
