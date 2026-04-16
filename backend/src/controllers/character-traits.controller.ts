import type { Request, Response } from 'express';
import { CharacterTraitService } from '../services/character-trait.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, created, noContent } from '../utils/apiResponse.js';
import { parseId } from '../utils/parseId.js';

export class CharacterTraitsController {
  static getAll = asyncHandler(async (req: Request, res: Response) => {
    const projectId = parseId(String(req.query.projectId), 'project id');
    const traits = CharacterTraitService.getAll(projectId);
    return ok(res, traits);
  });

  static getAssigned = asyncHandler(async (req: Request, res: Response) => {
    const characterId = parseId(String(req.query.characterId), 'character id');
    const ids = CharacterTraitService.getAssignedTraitIds(characterId);
    return ok(res, ids);
  });

  static assign = asyncHandler(async (req: Request, res: Response) => {
    const { characterId, traitId } = req.body as { characterId: number; traitId: number };
    CharacterTraitService.assign(characterId, traitId);
    return noContent(res);
  });

  static unassign = asyncHandler(async (req: Request, res: Response) => {
    const { characterId, traitId } = req.body as { characterId: number; traitId: number };
    CharacterTraitService.unassign(characterId, traitId);
    return noContent(res);
  });

  static create = asyncHandler(async (req: Request, res: Response) => {
    const trait = CharacterTraitService.create(req.body);
    return created(res, trait);
  });

  static updateExclusions = asyncHandler(async (req: Request, res: Response) => {
    const id = parseId(req.params.id, 'trait id');
    const excludedIds = (req.body?.excludedIds ?? []) as number[];
    const trait = CharacterTraitService.setExclusions(id, excludedIds);
    return ok(res, trait);
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    const id = parseId(req.params.id, 'trait id');
    CharacterTraitService.delete(id);
    return noContent(res);
  });
}
