import type { Request, Response } from 'express';
import { NoteService } from '../services/note.service';
import { TagService } from '../services/tag.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ok, created } from '../utils/apiResponse';
import { parseId } from '../utils/parseId';
import { BadRequestError } from '../middleware/errorHandler';

export class NoteController {
  static getAll = asyncHandler(async (req: Request, res: Response) => {
    const projectId = parseId(req.query.projectId as string, 'project id');

    const page = Number(req.query.page);
    const limit = Number(req.query.limit);

    const pagination = {
      page: Number.isFinite(page) ? page : 1,
      limit: Number.isFinite(limit) ? Math.max(1, Math.min(Math.trunc(limit), 200)) : 50,
      search: typeof req.query.search === 'string' ? req.query.search : undefined,
      sortBy: typeof req.query.sortBy === 'string' ? req.query.sortBy : undefined,
      sortOrder: req.query.sortOrder === 'asc' ? 'asc' : 'desc' as 'asc' | 'desc',
      noteType: typeof req.query.noteType === 'string' ? req.query.noteType : undefined,
      folderId:
        req.query.folderId === 'null'
          ? null
          : req.query.folderId !== undefined
            ? Number(req.query.folderId)
            : undefined,
    };

    const result = NoteService.getAll(projectId, pagination);

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
    const id = parseId(req.params.id, 'note id');
    const note = NoteService.getById(id);
    return ok(res, note);
  });

  static create = asyncHandler(async (req: Request, res: Response) => {
    const note = NoteService.create(req.body);
    return created(res, note);
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const id = parseId(req.params.id, 'note id');
    const note = NoteService.update(id, req.body);
    return ok(res, note);
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    const id = parseId(req.params.id, 'note id');
    NoteService.delete(id);
    return ok(res, undefined, 'Note deleted');
  });

  static setTags = asyncHandler(async (req: Request, res: Response) => {
    const id = parseId(req.params.id, 'note id');
    const note = NoteService.getById(id);
    const tagIds = req.body?.tagIds;

    if (!Array.isArray(tagIds)) {
      throw new BadRequestError('tagIds must be an array');
    }

    const tags = TagService.setTagsForEntity(note.projectId, 'note', id, tagIds);
    return ok(res, tags);
  });
}