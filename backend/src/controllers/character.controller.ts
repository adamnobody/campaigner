import { Request, Response, NextFunction } from 'express';
import { CharacterService } from '../services/character.service';
import { TagService } from '../services/tag.service';

export class CharacterController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const projectId = parseInt(req.query.projectId as string);
      const pagination = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
        search: req.query.search as string,
        sortBy: req.query.sortBy as string,
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'asc',
      };

      const result = CharacterService.getAll(projectId, pagination);
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
      const character = CharacterService.getById(id);
      res.json({ success: true, data: character });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const character = CharacterService.create(req.body);
      res.status(201).json({ success: true, data: character });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const character = CharacterService.update(id, req.body);
      res.json({ success: true, data: character });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      CharacterService.delete(id);
      res.json({ success: true, message: 'Character deleted' });
    } catch (error) {
      next(error);
    }
  }

  static async uploadImage(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      if (!req.file) {
        res.status(400).json({ success: false, error: 'No file uploaded' });
        return;
      }
      const imagePath = `/uploads/characters/${req.file.filename}`;
      const character = CharacterService.updateImage(id, imagePath);
      res.json({ success: true, data: character });
    } catch (error) {
      next(error);
    }
  }

  // ===== Relationships =====
  static async getRelationships(req: Request, res: Response, next: NextFunction) {
    try {
      const projectId = parseInt(req.query.projectId as string);
      const relationships = CharacterService.getRelationships(projectId);
      res.json({ success: true, data: relationships });
    } catch (error) {
      next(error);
    }
  }

  static async createRelationship(req: Request, res: Response, next: NextFunction) {
    try {
      const relationship = CharacterService.createRelationship(req.body);
      res.status(201).json({ success: true, data: relationship });
    } catch (error) {
      next(error);
    }
  }

  static async updateRelationship(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const relationship = CharacterService.updateRelationship(id, req.body);
      res.json({ success: true, data: relationship });
    } catch (error) {
      next(error);
    }
  }

  static async deleteRelationship(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      CharacterService.deleteRelationship(id);
      res.json({ success: true, message: 'Relationship deleted' });
    } catch (error) {
      next(error);
    }
  }

  // ===== Graph =====
  static async getGraph(req: Request, res: Response, next: NextFunction) {
    try {
      const projectId = parseInt(req.query.projectId as string);
      const graph = CharacterService.getGraph(projectId);
      res.json({ success: true, data: graph });
    } catch (error) {
      next(error);
    }
  }

  // ===== Tags =====
  static async setTags(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const character = CharacterService.getById(id);
      const { tagIds } = req.body;
      const tags = TagService.setTagsForEntity(character.projectId, 'character', id, tagIds);
      res.json({ success: true, data: tags });
    } catch (error) {
      next(error);
    }
  }
}