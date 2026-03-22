import { Request, Response, NextFunction } from 'express';
import { DogmaService } from '../services/dogma.service';
import { TagService } from '../services/tag.service';

export class DogmaController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const projectId = parseInt(req.query.projectId as string);
      const category = req.query.category as string | undefined;
      const importance = req.query.importance as string | undefined;
      const status = req.query.status as string | undefined;
      const search = req.query.search as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : undefined;

      const result = DogmaService.getAll(projectId, {
        category, importance, status, search, limit, offset,
      });
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const dogma = DogmaService.getById(id);
      res.json({ success: true, data: dogma });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const dogma = DogmaService.create(req.body);
      res.status(201).json({ success: true, data: dogma });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const dogma = DogmaService.update(id, req.body);
      res.json({ success: true, data: dogma });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      DogmaService.delete(id);
      res.json({ success: true, message: 'Dogma deleted' });
    } catch (error) {
      next(error);
    }
  }

  static async reorder(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId, orderedIds } = req.body;
      DogmaService.reorder(projectId, orderedIds);
      const result = DogmaService.getAll(projectId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async setTags(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const dogma = DogmaService.getById(id);
      const { tagIds } = req.body;
      const tags = TagService.setTagsForEntity(dogma.projectId, 'dogma', id, tagIds);
      res.json({ success: true, data: tags });
    } catch (error) {
      next(error);
    }
  }
}