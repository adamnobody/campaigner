import { getDb } from '../db/connection.js';
import { CreateNote, UpdateNote, Note, Pagination } from '@campaigner/shared';
import { NotFoundError } from '../middleware/errorHandler.js';
import { TagService } from './tag.service.js';
import { loadTagsBatch, buildUpdateQuery } from '../utils/dbHelpers.js';
import { BranchOverlayService } from './branchOverlay.service.js';
import {
  branchEntityVisibilitySql,
  effectiveBranchIdForRead,
  isEntityVisibleInBranch,
  resolveCreatedBranchId,
  assertBranchBelongsToProject,
} from './branchScope.js';

type NoteFormat = Note['format'];
type NoteType = Note['noteType'];

interface NoteRow {
  id: number;
  projectId: number;
  folderId: number | null;
  title: string;
  content: string;
  format: NoteFormat;
  noteType: NoteType;
  isPinned: number | boolean;
  createdAt: string;
  updatedAt: string;
  createdBranchId?: number | null;
}

function mapRow(row: NoteRow): Note {
  return {
    ...row,
    isPinned: !!row.isPinned,
    tags: [],
  };
}

const UPDATE_FIELD_MAP: Record<string, string> = {
  title: 'title',
  content: 'content',
  format: 'format',
  noteType: 'note_type',
  folderId: 'folder_id',
  isPinned: 'is_pinned',
};

function pickNotePatch(data: UpdateNote): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  (Object.keys(UPDATE_FIELD_MAP) as Array<keyof UpdateNote>).forEach((key) => {
    if (data[key] !== undefined) patch[key] = data[key];
  });
  return patch;
}

export class NoteService {
  static getAll(
    projectId: number,
    pagination?: Pagination & { noteType?: string; folderId?: number | null },
    branchId?: number,
  ): { items: Note[]; total: number } {
    const db = getDb();
    const {
      page = 1,
      limit = 20,
      search,
      sortBy = 'updatedAt',
      sortOrder = 'desc',
      noteType,
      folderId,
    } = pagination || {};

    const offset = (page - 1) * limit;
    let whereClause = 'WHERE project_id = ?';
    const params: Array<number | string> = [projectId];

    if (search) {
      whereClause += ' AND (title LIKE ? OR content LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s);
    }

    if (noteType) {
      whereClause += ' AND note_type = ?';
      params.push(noteType);
    }

    if (folderId !== undefined) {
      if (folderId === null) {
        whereClause += ' AND folder_id IS NULL';
      } else {
        whereClause += ' AND folder_id = ?';
        params.push(folderId);
      }
    }

    const allowedSortColumns: Record<string, string> = {
      title: 'title',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    };

    const sortColumn = allowedSortColumns[sortBy] || 'updated_at';
    const order = sortOrder === 'desc' ? 'DESC' : 'ASC';

    const viewBranch = effectiveBranchIdForRead(projectId, branchId);
    const scope = branchEntityVisibilitySql(projectId, viewBranch, 'created_branch_id', 'created_at');
    const scopedWhere = `${whereClause}${scope.sql}`;
    const listParams = [...params, ...scope.params];

    let rows: NoteRow[];
    let total: number;

    if (branchId) {
      const baseRows = db.prepare(`
        SELECT id, project_id as projectId, folder_id as folderId, title, content,
               format, note_type as noteType, is_pinned as isPinned,
               created_at as createdAt, updated_at as updatedAt,
               created_branch_id as createdBranchId
        FROM notes
        ${scopedWhere}
        ORDER BY is_pinned DESC, ${sortColumn} ${order}
      `).all(...listParams) as NoteRow[];

      const overlaid = BranchOverlayService.applyListOverlay(
        baseRows,
        BranchOverlayService.getOverrides(branchId, 'note'),
      );
      total = overlaid.length;
      rows = overlaid.slice(offset, offset + limit);
    } else {
      const countRow = db.prepare(`
        SELECT COUNT(*) as count FROM notes ${scopedWhere}
      `).get(...listParams) as { count: number };
      total = countRow.count;

      rows = db.prepare(`
        SELECT id, project_id as projectId, folder_id as folderId, title, content,
               format, note_type as noteType, is_pinned as isPinned,
               created_at as createdAt, updated_at as updatedAt,
               created_branch_id as createdBranchId
        FROM notes
        ${scopedWhere}
        ORDER BY is_pinned DESC, ${sortColumn} ${order}
        LIMIT ? OFFSET ?
      `).all(...listParams, limit, offset) as NoteRow[];
    }

    const tagsMap = loadTagsBatch(projectId, 'note', rows.map((r) => r.id));

    const items = rows.map((row) => {
      const note = mapRow(row);
      note.tags = tagsMap.get(row.id) || [];
      return note;
    });

    return { items, total };
  }

  static getById(id: number, branchId?: number): Note {
    const db = getDb();

    const row = db.prepare(`
      SELECT id, project_id as projectId, folder_id as folderId, title, content,
             format, note_type as noteType, is_pinned as isPinned,
             created_at as createdAt, updated_at as updatedAt,
             created_branch_id as createdBranchId
      FROM notes
      WHERE id = ?
    `).get(id) as NoteRow | undefined;

    if (!row) {
      throw new NotFoundError('Note');
    }

    const viewBranch = effectiveBranchIdForRead(row.projectId, branchId);
    if (!isEntityVisibleInBranch(row.projectId, viewBranch, row.createdBranchId, row.createdAt)) {
      throw new NotFoundError('Note');
    }

    const projectedRow = viewBranch
      ? BranchOverlayService.applyItemOverlay(row, BranchOverlayService.getOverrides(viewBranch, 'note'))
      : row;

    if (!projectedRow) {
      throw new NotFoundError('Note');
    }

    const note = mapRow(projectedRow);
    note.tags = TagService.getTagsForEntity(projectedRow.projectId, 'note', id);
    return note;
  }

  static create(data: CreateNote, requestBranchId?: number): Note {
    const db = getDb();

    if (requestBranchId !== undefined) {
      assertBranchBelongsToProject(requestBranchId, data.projectId);
    }
    const createdBranchId = resolveCreatedBranchId(data.projectId, requestBranchId);

    const result = db.prepare(`
      INSERT INTO notes (project_id, folder_id, title, content, format, note_type, is_pinned, created_branch_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.projectId,
      data.folderId || null,
      data.title,
      data.content || '',
      data.format || 'md',
      data.noteType || 'note',
      data.isPinned ? 1 : 0,
      createdBranchId,
    );

    const viewBranch = requestBranchId ?? effectiveBranchIdForRead(data.projectId, undefined);
    return this.getById(result.lastInsertRowid as number, viewBranch);
  }

  static update(id: number, data: UpdateNote, branchId?: number): Note {
    this.getById(id, branchId);
    if (branchId) {
      BranchOverlayService.saveUpsertOverride(branchId, 'note', id, pickNotePatch(data));
      return this.getById(id, branchId);
    }

    buildUpdateQuery('notes', UPDATE_FIELD_MAP, data as Record<string, unknown>, id, {
      booleanFields: ['isPinned'],
    });
    return this.getById(id);
  }

  static delete(id: number, branchId?: number): void {
    this.getById(id, branchId);
    if (branchId) {
      BranchOverlayService.saveDeleteOverride(branchId, 'note', id);
      return;
    }

    const db = getDb();
    db.prepare('DELETE FROM notes WHERE id = ?').run(id);
  }
}
