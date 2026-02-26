import { Request, Response, NextFunction } from 'express';
import { ProjectService } from '../services/project.service';

export class ProjectController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const projects = ProjectService.getAll();
      res.json({ success: true, data: projects });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const project = ProjectService.getById(id);
      res.json({ success: true, data: project });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const project = ProjectService.create(req.body);
      res.status(201).json({ success: true, data: project });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const project = ProjectService.update(id, req.body);
      res.json({ success: true, data: project });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      ProjectService.delete(id);
      res.json({ success: true, message: 'Project deleted' });
    } catch (error) {
      next(error);
    }
  }

  static async uploadMap(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      if (!req.file) {
        res.status(400).json({ success: false, error: 'No file uploaded' });
        return;
      }
      const imagePath = `/uploads/maps/${req.file.filename}`;
      const project = ProjectService.updateMapImage(id, imagePath);
      res.json({ success: true, data: project });
    } catch (error) {
      next(error);
    }
  }
}