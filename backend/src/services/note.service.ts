import { getDb } from '../db/connection';
import { CreateNote, UpdateNote, Note, Pagination } from '@campaigner/shared';
import { NotFoundError } from '../middleware/errorHandler';
import { TagService } from './tag.service';
import { loadTagsBatch, buildUpdateQuery } from '../utils/dbHelpers';

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

export class NoteService {
  static getAll(
    projectId: number,
    pagination?: Pagination & { noteType?: string; folderId?: number | null }
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

    const totalRow = db.prepare(`
      SELECT COUNT(*) as count FROM notes ${whereClause}
    `).get(...params) as { count: number };

    const rows = db.prepare(`
      SELECT id, project_id as projectId, folder_id as folderId, title, content,
             format, note_type as noteType, is_pinned as isPinned,
             created_at as createdAt, updated_at as updatedAt
      FROM notes
      ${whereClause}
      ORDER BY is_pinned DESC, ${sortColumn} ${order}
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset) as NoteRow[];

    const tagsMap = loadTagsBatch(projectId, 'note', rows.map((r) => r.id));

    const items = rows.map((row) => {
      const note = mapRow(row);
      note.tags = tagsMap.get(row.id) || [];
      return note;
    });

    return { items, total: totalRow.count };
  }

  static getById(id: number): Note {
    const db = getDb();

    const row = db.prepare(`
      SELECT id, project_id as projectId, folder_id as folderId, title, content,
             format, note_type as noteType, is_pinned as isPinned,
             created_at as createdAt, updated_at as updatedAt
      FROM notes
      WHERE id = ?
    `).get(id) as NoteRow | undefined;

    if (!row) {
      throw new NotFoundError('Note');
    }

    const note = mapRow(row);
    note.tags = TagService.getTagsForEntity(row.projectId, 'note', id);
    return note;
  }

  static create(data: CreateNote): Note {
    const db = getDb();

    const result = db.prepare(`
      INSERT INTO notes (project_id, folder_id, title, content, format, note_type, is_pinned)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.projectId,
      data.folderId || null,
      data.title,
      data.content || '',
      data.format || 'md',
      data.noteType || 'note',
      data.isPinned ? 1 : 0
    );

    return this.getById(result.lastInsertRowid as number);
  }

  static update(id: number, data: UpdateNote): Note {
    this.getById(id);
    buildUpdateQuery('notes', UPDATE_FIELD_MAP, data as Record<string, unknown>, id, {
      booleanFields: ['isPinned'],
    });
    return this.getById(id);
  }

  static delete(id: number): void {
    this.getById(id);
    const db = getDb();
    db.prepare('DELETE FROM notes WHERE id = ?').run(id);
  }
}
