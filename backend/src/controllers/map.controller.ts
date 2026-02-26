import { Request, Response, NextFunction } from 'express';
import { MapService } from '../services/map.service';

export class MapController {
  static async getMarkers(req: Request, res: Response, next: NextFunction) {
    try {
      const projectId = parseInt(req.query.projectId as string);
      const markers = MapService.getMarkers(projectId);
      res.json({ success: true, data: markers });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const marker = MapService.getById(id);
      res.json({ success: true, data: marker });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const marker = MapService.create(req.body);
      res.status(201).json({ success: true, data: marker });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const marker = MapService.update(id, req.body);
      res.json({ success: true, data: marker });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      MapService.delete(id);
      res.json({ success: true, message: 'Marker deleted' });
    } catch (error) {
      next(error);
    }
  }
}