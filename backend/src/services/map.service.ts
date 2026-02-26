import { getDb } from '../db/connection';
import { CreateMarker, UpdateMarker, MapMarker } from '@campaigner/shared';
import { NotFoundError } from '../middleware/errorHandler';

export class MapService {
  static getMarkers(projectId: number): MapMarker[] {
    const db = getDb();
    return db.prepare(`
      SELECT id, project_id as projectId, title, description,
             position_x as positionX, position_y as positionY,
             color, icon, linked_note_id as linkedNoteId,
             created_at as createdAt, updated_at as updatedAt
      FROM map_markers WHERE project_id = ?
      ORDER BY created_at ASC
    `).all(projectId) as MapMarker[];
  }

  static getById(id: number): MapMarker {
    const db = getDb();
    const row = db.prepare(`
      SELECT id, project_id as projectId, title, description,
             position_x as positionX, position_y as positionY,
             color, icon, linked_note_id as linkedNoteId,
             created_at as createdAt, updated_at as updatedAt
      FROM map_markers WHERE id = ?
    `).get(id) as MapMarker | undefined;

    if (!row) throw new NotFoundError('Map marker');
    return row;
  }

  static create(data: CreateMarker): MapMarker {
    const db = getDb();
    const result = db.prepare(`
      INSERT INTO map_markers (project_id, title, description, position_x, position_y, color, icon, linked_note_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.projectId, data.title, data.description || '',
      data.positionX, data.positionY, data.color || '#FF6B6B',
      data.icon || 'custom', data.linkedNoteId || null
    );

    return this.getById(result.lastInsertRowid as number);
  }

  static update(id: number, data: UpdateMarker): MapMarker {
    this.getById(id);
    const db = getDb();

    const fields: string[] = [];
    const values: any[] = [];

    if (data.title !== undefined) { fields.push('title = ?'); values.push(data.title); }
    if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
    if (data.positionX !== undefined) { fields.push('position_x = ?'); values.push(data.positionX); }
    if (data.positionY !== undefined) { fields.push('position_y = ?'); values.push(data.positionY); }
    if (data.color !== undefined) { fields.push('color = ?'); values.push(data.color); }
    if (data.icon !== undefined) { fields.push('icon = ?'); values.push(data.icon); }
    if (data.linkedNoteId !== undefined) { fields.push('linked_note_id = ?'); values.push(data.linkedNoteId); }

    if (fields.length > 0) {
      fields.push("updated_at = datetime('now')");
      values.push(id);
      db.prepare(`UPDATE map_markers SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    }

    return this.getById(id);
  }

  static delete(id: number): void {
    this.getById(id);
    const db = getDb();
    db.prepare('DELETE FROM map_markers WHERE id = ?').run(id);
  }
}