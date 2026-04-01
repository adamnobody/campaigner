import type { Request, Response } from 'express';
import { CharacterService } from '../services/character.service';
import { TagService } from '../services/tag.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ok, created } from '../utils/apiResponse';
import { parseId } from '../utils/parseId';
import { BadRequestError } from '../middleware/errorHandler';

export class CharacterController {
  static getAll = asyncHandler(async (req: Request, res: Response) => {
    const projectId = parseId(req.query.projectId as string, 'project id');

    const page = Number(req.query.page);
    const limit = Number(req.query.limit);

    const pagination = {
      page: Number.isFinite(page) ? page : 1,
      limit: Number.isFinite(limit) ? limit : 20,
      search: typeof req.query.search === 'string' ? req.query.search : undefined,
      sortBy: typeof req.query.sortBy === 'string' ? req.query.sortBy : undefined,
      sortOrder: req.query.sortOrder === 'desc' ? 'desc' : 'asc' as 'asc' | 'desc',
    };

    const result = CharacterService.getAll(projectId, pagination);

    return res.status(200).json({
      success: true,
      data: {
        items: result.items,
        total: result.total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: Math.ceil(result.total / pagination.limit),
      },
    });
  });

  static getById = asyncHandler(async (req: Request, res: Response) => {
    const id = parseId(req.params.id, 'character id');
    const character = CharacterService.getById(id);
    return ok(res, character);
  });

  static create = asyncHandler(async (req: Request, res: Response) => {
    const character = CharacterService.create(req.body);
    return created(res, character);
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const id = parseId(req.params.id, 'character id');
    const character = CharacterService.update(id, req.body);
    return ok(res, character);
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    const id = parseId(req.params.id, 'character id');
    CharacterService.delete(id);
    return ok(res, undefined, 'Character deleted');
  });

  static uploadImage = asyncHandler(async (req: Request, res: Response) => {
    const id = parseId(req.params.id, 'character id');

    if (!req.file) {
      throw new BadRequestError('No file uploaded');
    }

    const imagePath = `/uploads/characters/${req.file.filename}`;
    const character = CharacterService.updateImage(id, imagePath);
    return ok(res, character);
  });

  // ===== Relationships =====

  static getRelationships = asyncHandler(async (req: Request, res: Response) => {
    const projectId = parseId(req.query.projectId as string, 'project id');
    const relationships = CharacterService.getRelationships(projectId);
    return ok(res, relationships);
  });

  static createRelationship = asyncHandler(async (req: Request, res: Response) => {
    const relationship = CharacterService.createRelationship(req.body);
    return created(res, relationship);
  });

  static updateRelationship = asyncHandler(async (req: Request, res: Response) => {
    const id = parseId(req.params.id, 'relationship id');
    const relationship = CharacterService.updateRelationship(id, req.body);
    return ok(res, relationship);
  });

  static deleteRelationship = asyncHandler(async (req: Request, res: Response) => {
    const id = parseId(req.params.id, 'relationship id');
    CharacterService.deleteRelationship(id);
    return ok(res, undefined, 'Relationship deleted');
  });

  // ===== Graph =====

  static getGraph = asyncHandler(async (req: Request, res: Response) => {
    const projectId = parseId(req.query.projectId as string, 'project id');
    const graph = CharacterService.getGraph(projectId);
    return ok(res, graph);
  });

  // ===== Tags =====

  static setTags = asyncHandler(async (req: Request, res: Response) => {
    const id = parseId(req.params.id, 'character id');
    const character = CharacterService.getById(id);
    const tagIds = req.body?.tagIds;

    if (!Array.isArray(tagIds)) {
      throw new BadRequestError('tagIds must be an array');
    }

    const tags = TagService.setTagsForEntity(character.projectId, 'character', id, tagIds);
    return ok(res, tags);
  });
}