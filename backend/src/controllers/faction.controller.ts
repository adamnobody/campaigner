import { Request, Response, NextFunction } from 'express';
import { FactionService } from '../services/faction.service';
import { TagService } from '../services/tag.service';

export class FactionController {

  // ==================== FACTIONS CRUD ====================

  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const projectId = parseInt(req.query.projectId as string);
      const filters = {
        type: req.query.type as string,
        status: req.query.status as string,
        search: req.query.search as string,
        limit: parseInt(req.query.limit as string) || 50,
        offset: parseInt(req.query.offset as string) || 0,
      };
      const result = FactionService.getAll(projectId, filters);
      res.json({ success: true, data: result.items, total: result.total });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const faction = FactionService.getById(id);
      res.json({ success: true, data: faction });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const faction = FactionService.create(req.body);
      res.status(201).json({ success: true, data: faction });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const faction = FactionService.update(id, req.body);
      res.json({ success: true, data: faction });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      FactionService.delete(id);
      res.json({ success: true, message: 'Faction deleted' });
    } catch (error) {
      next(error);
    }
  }

  // ==================== IMAGES ====================

  static async uploadImage(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      if (!req.file) {
        res.status(400).json({ success: false, error: 'No file uploaded' });
        return;
      }
      const imagePath = `/uploads/factions/${req.file.filename}`;
      const faction = FactionService.updateImage(id, 'image_path', imagePath);
      res.json({ success: true, data: faction });
    } catch (error) {
      next(error);
    }
  }

  static async uploadBanner(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      if (!req.file) {
        res.status(400).json({ success: false, error: 'No file uploaded' });
        return;
      }
      const bannerPath = `/uploads/factions/${req.file.filename}`;
      const faction = FactionService.updateImage(id, 'banner_path', bannerPath);
      res.json({ success: true, data: faction });
    } catch (error) {
      next(error);
    }
  }

  // ==================== TAGS ====================

  static async setTags(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const faction = FactionService.getById(id);
      const { tagIds } = req.body;
      const tags = TagService.setTagsForEntity(faction.projectId, 'faction', id, tagIds);
      res.json({ success: true, data: tags });
    } catch (error) {
      next(error);
    }
  }

  // ==================== RANKS ====================

  static async getRanks(req: Request, res: Response, next: NextFunction) {
    try {
      const factionId = parseInt(req.params.id);
      const ranks = FactionService.getRanks(factionId);
      res.json({ success: true, data: ranks });
    } catch (error) {
      next(error);
    }
  }

  static async createRank(req: Request, res: Response, next: NextFunction) {
    try {
      const factionId = parseInt(req.params.id);
      const rank = FactionService.createRank({ ...req.body, factionId });
      res.status(201).json({ success: true, data: rank });
    } catch (error) {
      next(error);
    }
  }

  static async updateRank(req: Request, res: Response, next: NextFunction) {
    try {
      const rankId = parseInt(req.params.rankId);
      const rank = FactionService.updateRank(rankId, req.body);
      res.json({ success: true, data: rank });
    } catch (error) {
      next(error);
    }
  }

  static async deleteRank(req: Request, res: Response, next: NextFunction) {
    try {
      const rankId = parseInt(req.params.rankId);
      FactionService.deleteRank(rankId);
      res.json({ success: true, message: 'Rank deleted' });
    } catch (error) {
      next(error);
    }
  }

  // ==================== MEMBERS ====================

  static async getMembers(req: Request, res: Response, next: NextFunction) {
    try {
      const factionId = parseInt(req.params.id);
      const members = FactionService.getMembers(factionId);
      res.json({ success: true, data: members });
    } catch (error) {
      next(error);
    }
  }

  static async addMember(req: Request, res: Response, next: NextFunction) {
    try {
      const factionId = parseInt(req.params.id);
      const member = FactionService.addMember({ ...req.body, factionId });
      res.status(201).json({ success: true, data: member });
    } catch (error) {
      next(error);
    }
  }

  static async updateMember(req: Request, res: Response, next: NextFunction) {
    try {
      const memberId = parseInt(req.params.memberId);
      const member = FactionService.updateMember(memberId, req.body);
      res.json({ success: true, data: member });
    } catch (error) {
      next(error);
    }
  }

  static async removeMember(req: Request, res: Response, next: NextFunction) {
    try {
      const memberId = parseInt(req.params.memberId);
      FactionService.removeMember(memberId);
      res.json({ success: true, message: 'Member removed' });
    } catch (error) {
      next(error);
    }
  }

  // ==================== RELATIONS ====================

  static async getRelations(req: Request, res: Response, next: NextFunction) {
    try {
      const projectId = parseInt(req.query.projectId as string);
      const relations = FactionService.getRelations(projectId);
      res.json({ success: true, data: relations });
    } catch (error) {
      next(error);
    }
  }

  static async createRelation(req: Request, res: Response, next: NextFunction) {
    try {
      const relation = FactionService.createRelation(req.body);
      res.status(201).json({ success: true, data: relation });
    } catch (error) {
      next(error);
    }
  }

  static async updateRelation(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.relationId);
      const relation = FactionService.updateRelation(id, req.body);
      res.json({ success: true, data: relation });
    } catch (error) {
      next(error);
    }
  }

  static async deleteRelation(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.relationId);
      FactionService.deleteRelation(id);
      res.json({ success: true, message: 'Relation deleted' });
    } catch (error) {
      next(error);
    }
  }

  // ==================== GRAPH ====================

  static async getGraph(req: Request, res: Response, next: NextFunction) {
    try {
      const projectId = parseInt(req.query.projectId as string);
      const graph = FactionService.getGraph(projectId);
      res.json({ success: true, data: graph });
    } catch (error) {
      next(error);
    }
  }
}