import type { Request, Response } from 'express';
import { DynastyService } from '../services/dynasty.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ok, created } from '../utils/apiResponse';
import { parseId } from '../utils/parseId';
import { BadRequestError } from '../middleware/errorHandler';

export class DynastyController {
  static getAll = asyncHandler(async (req: Request, res: Response) => {
    const projectId = parseId(req.query.projectId as string, 'project id');

    const limit = Number(req.query.limit);
    const offset = Number(req.query.offset);

    const result = DynastyService.getAll(projectId, {
      search: typeof req.query.search === 'string' ? req.query.search : undefined,
      status: typeof req.query.status === 'string' ? req.query.status : undefined,
      limit: Number.isFinite(limit) ? limit : 50,
      offset: Number.isFinite(offset) ? offset : 0,
    });

    return res.status(200).json({
      success: true,
      data: result.items,
      total: result.total,
    });
  });

  static getById = asyncHandler(async (req: Request, res: Response) => {
    const id = parseId(req.params.id, 'dynasty id');
    const dynasty = DynastyService.getById(id);
    return ok(res, dynasty);
  });

  static create = asyncHandler(async (req: Request, res: Response) => {
    const dynasty = DynastyService.create(req.body);
    return created(res, dynasty);
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const id = parseId(req.params.id, 'dynasty id');
    const dynasty = DynastyService.update(id, req.body);
    return ok(res, dynasty);
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    const id = parseId(req.params.id, 'dynasty id');
    DynastyService.delete(id);
    return ok(res, undefined, 'Dynasty deleted');
  });

  static uploadImage = asyncHandler(async (req: Request, res: Response) => {
    const id = parseId(req.params.id, 'dynasty id');

    if (!req.file) {
      throw new BadRequestError('No file uploaded');
    }

    const imagePath = `/uploads/dynasties/${req.file.filename}`;
    const dynasty = DynastyService.uploadImage(id, imagePath);
    return ok(res, dynasty);
  });

  static setTags = asyncHandler(async (req: Request, res: Response) => {
    const id = parseId(req.params.id, 'dynasty id');
    const tagIds = req.body?.tagIds;

    if (!Array.isArray(tagIds)) {
      throw new BadRequestError('tagIds must be an array');
    }

    DynastyService.setTags(id, tagIds);
    const dynasty = DynastyService.getById(id);
    return ok(res, dynasty);
  });

  // Members
  static addMember = asyncHandler(async (req: Request, res: Response) => {
    const dynastyId = parseId(req.params.id, 'dynasty id');
    const member = DynastyService.addMember(dynastyId, req.body);
    return created(res, member);
  });

  static updateMember = asyncHandler(async (req: Request, res: Response) => {
    const memberId = parseId(req.params.memberId, 'member id');
    const member = DynastyService.updateMember(memberId, req.body);
    return ok(res, member);
  });

  static removeMember = asyncHandler(async (req: Request, res: Response) => {
    const memberId = parseId(req.params.memberId, 'member id');
    DynastyService.removeMember(memberId);
    return ok(res, undefined, 'Member removed');
  });

  static saveGraphPositions = asyncHandler(async (req: Request, res: Response) => {
    const dynastyId = parseId(req.params.id, 'dynasty id');
    const positions = req.body?.positions;

    if (!Array.isArray(positions)) {
      throw new BadRequestError('positions must be an array');
    }

    DynastyService.saveGraphPositions(dynastyId, positions);
    return ok(res, undefined, 'Positions saved');
  });

  // Family links
  static addFamilyLink = asyncHandler(async (req: Request, res: Response) => {
    const dynastyId = parseId(req.params.id, 'dynasty id');
    const link = DynastyService.addFamilyLink(dynastyId, req.body);
    return created(res, link);
  });

  static deleteFamilyLink = asyncHandler(async (req: Request, res: Response) => {
    const linkId = parseId(req.params.linkId, 'family link id');
    DynastyService.deleteFamilyLink(linkId);
    return ok(res, undefined, 'Family link deleted');
  });

  // Events
  static addEvent = asyncHandler(async (req: Request, res: Response) => {
    const dynastyId = parseId(req.params.id, 'dynasty id');
    const event = DynastyService.addEvent(dynastyId, req.body);
    return created(res, event);
  });

  static updateEvent = asyncHandler(async (req: Request, res: Response) => {
    const eventId = parseId(req.params.eventId, 'event id');
    const event = DynastyService.updateEvent(eventId, req.body);
    return ok(res, event);
  });

  static deleteEvent = asyncHandler(async (req: Request, res: Response) => {
    const eventId = parseId(req.params.eventId, 'event id');
    DynastyService.deleteEvent(eventId);
    return ok(res, undefined, 'Event deleted');
  });
}