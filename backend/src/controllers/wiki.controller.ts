import { Request, Response, NextFunction } from 'express';
import { WikiService } from '../services/wiki.service';

export class WikiController {
  static async getLinks(req: Request, res: Response, next: NextFunction) {
    try {
      const projectId = parseInt(req.query.projectId as string);
      const noteId = req.query.noteId ? parseInt(req.query.noteId as string) : undefined;
      const links = noteId
        ? WikiService.getLinksForNote(noteId)
        : WikiService.getAllLinks(projectId);
      res.json({ success: true, data: links });
    } catch (error) {
      next(error);
    }
  }

  static async createLink(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId, sourceNoteId, targetNoteId, label } = req.body;
      const link = WikiService.createLink(projectId, sourceNoteId, targetNoteId, label || '');
      res.status(201).json({ success: true, data: link });
    } catch (error) {
      next(error);
    }
  }

  static async deleteLink(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      WikiService.deleteLink(id);
      res.json({ success: true, message: 'Link deleted' });
    } catch (error) {
      next(error);
    }
  }

  static async getCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const projectId = parseInt(req.query.projectId as string);
      const categories = WikiService.getCategories(projectId);
      res.json({ success: true, data: categories });
    } catch (error) {
      next(error);
    }
  }
}