import type { Request, Response } from 'express';
import { WikiService } from '../services/wiki.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ok, created } from '../utils/apiResponse';
import { parseId } from '../utils/parseId';
import { BadRequestError } from '../middleware/errorHandler';

export class WikiController {
  static getLinks = asyncHandler(async (req: Request, res: Response) => {
    const projectId = parseId(req.query.projectId as string, 'project id');
    const noteIdRaw = req.query.noteId as string | undefined;
    const noteId = noteIdRaw ? parseId(noteIdRaw, 'note id') : undefined;

    const links = noteId
      ? WikiService.getLinksForNote(noteId)
      : WikiService.getAllLinks(projectId);

    return ok(res, links);
  });

  static createLink = asyncHandler(async (req: Request, res: Response) => {
    const { projectId, sourceNoteId, targetNoteId, label } = req.body;

    if (!Number.isInteger(projectId) || projectId <= 0) {
      throw new BadRequestError('Valid projectId is required');
    }

    if (!Number.isInteger(sourceNoteId) || sourceNoteId <= 0) {
      throw new BadRequestError('Valid sourceNoteId is required');
    }

    if (!Number.isInteger(targetNoteId) || targetNoteId <= 0) {
      throw new BadRequestError('Valid targetNoteId is required');
    }

    const link = WikiService.createLink(
      projectId,
      sourceNoteId,
      targetNoteId,
      label || ''
    );

    return created(res, link);
  });

  static deleteLink = asyncHandler(async (req: Request, res: Response) => {
    const id = parseId(req.params.id, 'wiki link id');
    WikiService.deleteLink(id);
    return ok(res, undefined, 'Link deleted');
  });

  static getCategories = asyncHandler(async (req: Request, res: Response) => {
    const projectId = parseId(req.query.projectId as string, 'project id');
    const categories = WikiService.getCategories(projectId);
    return ok(res, categories);
  });
}