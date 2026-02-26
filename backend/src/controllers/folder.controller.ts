import { Request, Response, NextFunction } from 'express';
import { FolderService } from '../services/folder.service';

export class FolderController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const projectId = parseInt(req.query.projectId as string);
      const folders = FolderService.getAll(projectId);
      res.json({ success: true, data: folders });
    } catch (error) {
      next(error);
    }
  }

  static async getTree(req: Request, res: Response, next: NextFunction) {
    try {
      const projectId = parseInt(req.query.projectId as string);
      const tree = FolderService.getTree(projectId);
      res.json({ success: true, data: tree });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const folder = FolderService.create(req.body);
      res.status(201).json({ success: true, data: folder });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const { name } = req.body;
      const folder = FolderService.update(id, name);
      res.json({ success: true, data: folder });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      FolderService.delete(id);
      res.json({ success: true, message: 'Folder deleted' });
    } catch (error) {
      next(error);
    }
  }
}