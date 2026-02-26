import { Request, Response, NextFunction } from 'express';
import { NoteService } from '../services/note.service';
import { TagService } from '../services/tag.service';

export class NoteController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const projectId = parseInt(req.query.projectId as string);
      const pagination = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 50,
        search: req.query.search as string,
        sortBy: req.query.sortBy as string,
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
        noteType: req.query.noteType as string,
        folderId: req.query.folderId ? parseInt(req.query.folderId as string) : undefined,
      };

      const result = NoteService.getAll(projectId, pagination);
      res.json({
        success: true,
        data: {
          items: result.items,
          total: result.total,
          page: pagination.page,
          limit: pagination.limit,
          totalPages: Math.ceil(result.total / pagination.limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const note = NoteService.getById(id);
      res.json({ success: true, data: note });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const note = NoteService.create(req.body);
      res.status(201).json({ success: true, data: note });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const note = NoteService.update(id, req.body);
      res.json({ success: true, data: note });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      NoteService.delete(id);
      res.json({ success: true, message: 'Note deleted' });
    } catch (error) {
      next(error);
    }
  }

  static async setTags(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const note = NoteService.getById(id);
      const { tagIds } = req.body;
      const tags = TagService.setTagsForEntity(note.projectId, 'note', id, tagIds);
      res.json({ success: true, data: tags });
    } catch (error) {
      next(error);
    }
  }
}