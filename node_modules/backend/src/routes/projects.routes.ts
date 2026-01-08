import { Router } from 'express';
import { z } from 'zod';
import { CreateProjectSchema } from '../validation/projects.zod.js';
import { createProject, deleteProject, listProjects } from '../services/projects.service.js';

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

projectsRouter.delete('/:projectId', async (req, res, next) => {
  try {
    const projectId = z.string().min(1).parse(req.params.projectId);

    // по умолчанию удаляем и с диска
    const deleteFilesRaw = req.query.deleteFiles;
    const deleteFiles =
      deleteFilesRaw === undefined
        ? true
        : ['1', 'true', 'yes'].includes(String(deleteFilesRaw).toLowerCase());

    await deleteProject(projectId, { deleteFiles });

    res.status(204).end();
  } catch (e) {
    next(e);
  }
});
