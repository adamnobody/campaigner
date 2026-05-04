import type { Request, Response } from 'express';
import { CharacterService } from '../services/character.service.js';
import { TagService } from '../services/tag.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, created } from '../utils/apiResponse.js';
import { parseId } from '../utils/parseId.js';
import { BadRequestError } from '../middleware/errorHandler.js';
import { parseOptionalBranchId, parseBranchIdStrict } from '../utils/branchRequest.js';

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

    const branchId = parseOptionalBranchId(req.query.branchId);
    const result = CharacterService.getAll(projectId, pagination, branchId);

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
    const branchId = parseOptionalBranchId(req.query.branchId);
    const character = CharacterService.getById(id, branchId);
    return ok(res, character);
  });

  static create = asyncHandler(async (req: Request, res: Response) => {
    const branchId = parseOptionalBranchId(req.body?.branchId);
    const character = CharacterService.create(req.body, branchId);
    return created(res, character);
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const id = parseId(req.params.id, 'character id');
    const branchId = parseOptionalBranchId(req.body?.branchId);
    const character = CharacterService.update(id, req.body, branchId);
    return ok(res, character);
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    const id = parseId(req.params.id, 'character id');
    const branchId = parseBranchIdStrict(req.query.branchId);
    CharacterService.delete(id, branchId);
    return ok(res, undefined, 'Character deleted');
  });

  static uploadImage = asyncHandler(async (req: Request, res: Response) => {
    const id = parseId(req.params.id, 'character id');

    if (!req.file) {
      throw new BadRequestError('No file uploaded');
    }

    const branchId = parseOptionalBranchId(req.query.branchId);
    const imagePath = `/uploads/characters/${req.file.filename}`;
    const character = CharacterService.updateImage(id, imagePath, branchId);
    return ok(res, character);
  });

  // ===== Relationships =====

  static getRelationships = asyncHandler(async (req: Request, res: Response) => {
    const projectId = parseId(req.query.projectId as string, 'project id');
    const branchId = parseOptionalBranchId(req.query.branchId);
    const relationships = CharacterService.getRelationships(projectId, branchId);
    return ok(res, relationships);
  });

  static createRelationship = asyncHandler(async (req: Request, res: Response) => {
    const branchId = parseOptionalBranchId(req.body?.branchId);
    const relationship = CharacterService.createRelationship(req.body, branchId);
    return created(res, relationship);
  });

  static updateRelationship = asyncHandler(async (req: Request, res: Response) => {
    const id = parseId(req.params.id, 'relationship id');
    const branchId = parseOptionalBranchId(req.body?.branchId);
    const relationship = CharacterService.updateRelationship(id, req.body, branchId);
    return ok(res, relationship);
  });

  static deleteRelationship = asyncHandler(async (req: Request, res: Response) => {
    const id = parseId(req.params.id, 'relationship id');
    const branchId = parseBranchIdStrict(req.query.branchId);
    CharacterService.deleteRelationship(id, branchId);
    return ok(res, undefined, 'Relationship deleted');
  });

  // ===== Graph =====

  static getGraph = asyncHandler(async (req: Request, res: Response) => {
    const projectId = parseId(req.query.projectId as string, 'project id');
    const branchId = parseOptionalBranchId(req.query.branchId);
    const graph = CharacterService.getGraph(projectId, branchId);
    return ok(res, graph);
  });

  // ===== Tags =====

  static setTags = asyncHandler(async (req: Request, res: Response) => {
    const id = parseId(req.params.id, 'character id');
    const branchId = parseOptionalBranchId(req.query.branchId);
    const character = CharacterService.getById(id, branchId);
    const tagIds = req.body?.tagIds;

    if (!Array.isArray(tagIds)) {
      throw new BadRequestError('tagIds must be an array');
    }

    const tags = TagService.setTagsForEntity(character.projectId, 'character', id, tagIds);
    return ok(res, tags);
  });
}
