import { Request, Response, NextFunction } from 'express';
import { TimelineService } from '../services/timeline.service';
import { TagService } from '../services/tag.service';

export class TimelineController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const projectId = parseInt(req.query.projectId as string);
      const era = req.query.era as string | undefined;
      const events = TimelineService.getAll(projectId, era);
      res.json({ success: true, data: events });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const event = TimelineService.getById(id);
      res.json({ success: true, data: event });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const event = TimelineService.create(req.body);
      res.status(201).json({ success: true, data: event });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const event = TimelineService.update(id, req.body);
      res.json({ success: true, data: event });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      TimelineService.delete(id);
      res.json({ success: true, message: 'Timeline event deleted' });
    } catch (error) {
      next(error);
    }
  }

  static async reorder(req: Request, res: Response, next: NextFunction) {
    try {
      const projectId = parseInt(req.body.projectId);
      const { orderedIds } = req.body;
      const events = TimelineService.reorder(projectId, orderedIds);
      res.json({ success: true, data: events });
    } catch (error) {
      next(error);
    }
  }

  static async setTags(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const event = TimelineService.getById(id);
      const { tagIds } = req.body;
      const tags = TagService.setTagsForEntity(event.projectId, 'timeline_event', id, tagIds);
      res.json({ success: true, data: tags });
    } catch (error) {
      next(error);
    }
  }
}