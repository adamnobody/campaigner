import { Request, Response, NextFunction } from 'express';
import { TagService } from '../services/tag.service';

export class TagController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const projectId = parseInt(req.query.projectId as string);
      const tags = TagService.getAll(projectId);
      res.json({ success: true, data: tags });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const projectId = parseInt(req.body.projectId);
      const tag = TagService.create(projectId, req.body);
      res.status(201).json({ success: true, data: tag });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      TagService.delete(id);
      res.json({ success: true, message: 'Tag deleted' });
    } catch (error) {
      next(error);
    }
  }
}