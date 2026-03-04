import { Request, Response, NextFunction } from 'express';
import { SearchService } from '../services/search.service';

export class SearchController {
  static async search(req: Request, res: Response, next: NextFunction) {
    try {
      const projectId = parseInt(req.query.projectId as string);
      const query = (req.query.q as string || '').trim();

      if (!projectId || !query) {
        res.json({ success: true, data: [] });
        return;
      }

      const results = SearchService.search(projectId, query);
      res.json({ success: true, data: results });
    } catch (error) {
      next(error);
    }
  }
}