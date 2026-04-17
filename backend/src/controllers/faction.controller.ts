import type { Request, Response } from 'express';
import { FactionService } from '../services/faction.service.js';
import { FactionPolicyService } from '../services/factionPolicy.service.js';
import { TagService } from '../services/tag.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, created } from '../utils/apiResponse.js';
import { parseId } from '../utils/parseId.js';
import { BadRequestError } from '../middleware/errorHandler.js';

export class FactionController {
  // ==================== FACTIONS CRUD ====================

  static getAll = asyncHandler(async (req: Request, res: Response) => {
    const projectId = parseId(req.query.projectId as string, 'project id');

    const limit = Number(req.query.limit);
    const offset = Number(req.query.offset);
    const typeFilter =
      req.query.type === 'state' || req.query.type === 'faction'
        ? req.query.type
        : undefined;

    const filters = {
      type: typeFilter as 'state' | 'faction' | undefined,
      status: typeof req.query.status === 'string' ? req.query.status : undefined,
      search: typeof req.query.search === 'string' ? req.query.search : undefined,
      limit: Number.isFinite(limit) ? limit : 50,
      offset: Number.isFinite(offset) ? offset : 0,
    };

    const result = FactionService.getAll(projectId, filters);

    return res.status(200).json({
      success: true,
      data: result.items,
      total: result.total,
    });
  });

  static getById = asyncHandler(async (req: Request, res: Response) => {
    const id = parseId(req.params.id, 'faction id');
    const faction = FactionService.getById(id);
    return ok(res, faction);
  });

  // ==================== POLICIES (faction_policies) ====================

  static getPolicies = asyncHandler(async (req: Request, res: Response) => {
    const factionId = parseId(req.params.id, 'faction id');
    return ok(res, FactionPolicyService.list(factionId));
  });

  static createPolicy = asyncHandler(async (req: Request, res: Response) => {
    const factionId = parseId(req.params.id, 'faction id');
    return created(res, FactionPolicyService.create(factionId, req.body));
  });

  static updatePolicy = asyncHandler(async (req: Request, res: Response) => {
    const factionId = parseId(req.params.id, 'faction id');
    const policyId = parseId(req.params.policyId, 'policy id');
    return ok(res, FactionPolicyService.update(factionId, policyId, req.body));
  });

  static deletePolicy = asyncHandler(async (req: Request, res: Response) => {
    const factionId = parseId(req.params.id, 'faction id');
    const policyId = parseId(req.params.policyId, 'policy id');
    FactionPolicyService.delete(factionId, policyId);
    return ok(res, undefined, 'Faction policy deleted');
  });

  static create = asyncHandler(async (req: Request, res: Response) => {
    const faction = FactionService.create(req.body);
    return created(res, faction);
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const id = parseId(req.params.id, 'faction id');
    const faction = FactionService.update(id, req.body);
    return ok(res, faction);
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    const id = parseId(req.params.id, 'faction id');
    FactionService.delete(id);
    return ok(res, undefined, 'Faction deleted');
  });

  // ==================== IMAGES ====================

  static uploadImage = asyncHandler(async (req: Request, res: Response) => {
    const id = parseId(req.params.id, 'faction id');

    if (!req.file) {
      throw new BadRequestError('No file uploaded');
    }

    const imagePath = `/uploads/factions/${req.file.filename}`;
    const faction = FactionService.updateImage(id, 'image_path', imagePath);

    return ok(res, faction);
  });

  static uploadBanner = asyncHandler(async (req: Request, res: Response) => {
    const id = parseId(req.params.id, 'faction id');

    if (!req.file) {
      throw new BadRequestError('No file uploaded');
    }

    const bannerPath = `/uploads/factions/${req.file.filename}`;
    const faction = FactionService.updateImage(id, 'banner_path', bannerPath);

    return ok(res, faction);
  });

  // ==================== TAGS ====================

  static setTags = asyncHandler(async (req: Request, res: Response) => {
    const id = parseId(req.params.id, 'faction id');
    const faction = FactionService.getById(id);
    const tagIds = req.body?.tagIds;

    if (!Array.isArray(tagIds)) {
      throw new BadRequestError('tagIds must be an array');
    }

    const tags = TagService.setTagsForEntity(faction.projectId, 'faction', id, tagIds);
    return ok(res, tags);
  });

  // ==================== RANKS ====================

  static getRanks = asyncHandler(async (req: Request, res: Response) => {
    const factionId = parseId(req.params.id, 'faction id');
    const ranks = FactionService.getRanks(factionId);
    return ok(res, ranks);
  });

  static createRank = asyncHandler(async (req: Request, res: Response) => {
    const factionId = parseId(req.params.id, 'faction id');
    const rank = FactionService.createRank({ ...req.body, factionId });
    return created(res, rank);
  });

  static updateRank = asyncHandler(async (req: Request, res: Response) => {
    const rankId = parseId(req.params.rankId, 'rank id');
    const rank = FactionService.updateRank(rankId, req.body);
    return ok(res, rank);
  });

  static deleteRank = asyncHandler(async (req: Request, res: Response) => {
    const rankId = parseId(req.params.rankId, 'rank id');
    FactionService.deleteRank(rankId);
    return ok(res, undefined, 'Rank deleted');
  });

  // ==================== MEMBERS ====================

  static getMembers = asyncHandler(async (req: Request, res: Response) => {
    const factionId = parseId(req.params.id, 'faction id');
    const members = FactionService.getMembers(factionId);
    return ok(res, members);
  });

  static addMember = asyncHandler(async (req: Request, res: Response) => {
    const factionId = parseId(req.params.id, 'faction id');
    const member = FactionService.addMember({ ...req.body, factionId });
    return created(res, member);
  });

  static updateMember = asyncHandler(async (req: Request, res: Response) => {
    const memberId = parseId(req.params.memberId, 'member id');
    const member = FactionService.updateMember(memberId, req.body);
    return ok(res, member);
  });

  static removeMember = asyncHandler(async (req: Request, res: Response) => {
    const memberId = parseId(req.params.memberId, 'member id');
    FactionService.removeMember(memberId);
    return ok(res, undefined, 'Member removed');
  });

  // ==================== RELATIONS ====================

  static getRelations = asyncHandler(async (req: Request, res: Response) => {
    const projectId = parseId(req.query.projectId as string, 'project id');
    const relations = FactionService.getRelations(projectId);
    return ok(res, relations);
  });

  // ==================== ASSETS ====================

  static getAssets = asyncHandler(async (req: Request, res: Response) => {
    const factionId = parseId(req.params.id, 'faction id');
    const assets = FactionService.getAssets(factionId);
    return ok(res, assets);
  });

  static createAsset = asyncHandler(async (req: Request, res: Response) => {
    const factionId = parseId(req.params.id, 'faction id');
    const asset = FactionService.createAsset({ ...req.body, factionId });
    return created(res, asset);
  });

  static updateAsset = asyncHandler(async (req: Request, res: Response) => {
    const assetId = parseId(req.params.assetId, 'asset id');
    const asset = FactionService.updateAsset(assetId, req.body);
    return ok(res, asset);
  });

  static deleteAsset = asyncHandler(async (req: Request, res: Response) => {
    const assetId = parseId(req.params.assetId, 'asset id');
    FactionService.deleteAsset(assetId);
    return ok(res, undefined, 'Asset deleted');
  });

  static bootstrapDefaultAssets = asyncHandler(async (req: Request, res: Response) => {
    const factionId = parseId(req.params.id, 'faction id');
    return ok(res, FactionService.bootstrapDefaultAssets(factionId));
  });

  static reorderAssets = asyncHandler(async (req: Request, res: Response) => {
    const factionId = parseId(req.params.id, 'faction id');
    const orderedIds = req.body?.orderedIds as number[];
    const assets = FactionService.reorderAssets(factionId, orderedIds);
    return ok(res, assets);
  });

  static createRelation = asyncHandler(async (req: Request, res: Response) => {
    const relation = FactionService.createRelation(req.body);
    return created(res, relation);
  });

  static updateRelation = asyncHandler(async (req: Request, res: Response) => {
    const relationId = parseId(req.params.relationId, 'relation id');
    const relation = FactionService.updateRelation(relationId, req.body);
    return ok(res, relation);
  });

  static deleteRelation = asyncHandler(async (req: Request, res: Response) => {
    const relationId = parseId(req.params.relationId, 'relation id');
    FactionService.deleteRelation(relationId);
    return ok(res, undefined, 'Relation deleted');
  });

  // ==================== GRAPH ====================

  static getGraph = asyncHandler(async (req: Request, res: Response) => {
    const projectId = parseId(req.query.projectId as string, 'project id');
    const graph = FactionService.getGraph(projectId);
    return ok(res, graph);
  });
}