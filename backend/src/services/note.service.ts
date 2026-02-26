import { getDb } from '../db/connection';
import { CreateNote, UpdateNote, Note, Pagination } from '@campaigner/shared';
import { NotFoundError } from '../middleware/errorHandler';
import { TagService } from './tag.service';

function mapRow(row: any): Note {
  return {
    ...row,
    isPinned: !!row.isPinned,
    tags: [],
  };
}

export class NoteService {
  static getAll(projectId: number, pagination?: Pagination & { noteType?: string; folderId?: number | null }): { items: Note[]; total: number } {
    const db = getDb();
    const { page = 1, limit = 20, search, sortBy = 'updatedAt', sortOrder = 'desc', noteType, folderId } = pagination || {};
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE project_id = ?';
    const params: any[] = [projectId];

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
      title: 'title', createdAt: 'created_at', updatedAt: 'updated_at',
    };
    const sortColumn = allowedSortColumns[sortBy] || 'updated_at';
    const order = sortOrder === 'desc' ? 'DESC' : 'ASC';

    const total = (db.prepare(`SELECT COUNT(*) as count FROM notes ${whereClause}`).get(...params) as any).count;

    const rows = db.prepare(`
      SELECT id, project_id as projectId, folder_id as folderId, title, content,
             format, note_type as noteType, is_pinned as isPinned,
             created_at as createdAt, updated_at as updatedAt
      FROM notes ${whereClause}
      ORDER BY is_pinned DESC, ${sortColumn} ${order}
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset) as any[];

    const items = rows.map(row => {
      const note = mapRow(row);
      note.tags = TagService.getTagsForEntity(projectId, 'note', row.id);
      return note;
    });

    return { items, total };
  }

  static getById(id: number): Note {
    const db = getDb();
    const row = db.prepare(`
      SELECT id, project_id as projectId, folder_id as folderId, title, content,
             format, note_type as noteType, is_pinned as isPinned,
             created_at as createdAt, updated_at as updatedAt
      FROM notes WHERE id = ?
    `).get(id) as any | undefined;

    if (!row) throw new NotFoundError('Note');
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
      data.projectId, data.folderId || null, data.title,
      data.content || '', data.format || 'md', data.noteType || 'note',
      data.isPinned ? 1 : 0
    );

    return this.getById(result.lastInsertRowid as number);
  }

  static update(id: number, data: UpdateNote): Note {
    this.getById(id);
    const db = getDb();

    const fields: string[] = [];
    const values: any[] = [];

    if (data.title !== undefined) { fields.push('title = ?'); values.push(data.title); }
    if (data.content !== undefined) { fields.push('content = ?'); values.push(data.content); }
    if (data.format !== undefined) { fields.push('format = ?'); values.push(data.format); }
    if (data.noteType !== undefined) { fields.push('note_type = ?'); values.push(data.noteType); }
    if (data.folderId !== undefined) { fields.push('folder_id = ?'); values.push(data.folderId); }
    if (data.isPinned !== undefined) { fields.push('is_pinned = ?'); values.push(data.isPinned ? 1 : 0); }

    if (fields.length > 0) {
      fields.push("updated_at = datetime('now')");
      values.push(id);
      db.prepare(`UPDATE notes SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    }

    return this.getById(id);
  }

  static delete(id: number): void {
    this.getById(id);
    const db = getDb();
    db.prepare('DELETE FROM notes WHERE id = ?').run(id);
  }
}