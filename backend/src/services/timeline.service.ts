import { getDb } from '../db/connection';
import { CreateTimelineEvent, UpdateTimelineEvent, TimelineEvent } from '@campaigner/shared';
import { NotFoundError } from '../middleware/errorHandler';
import { TagService } from './tag.service';

function mapRow(row: any): TimelineEvent {
  return {
    ...row,
    tags: [],
  };
}

export class TimelineService {
  static getAll(projectId: number, era?: string): TimelineEvent[] {
    const db = getDb();
    let query = `
      SELECT id, project_id as projectId, title, description,
             event_date as eventDate, sort_order as sortOrder, era,
             linked_note_id as linkedNoteId,
             created_at as createdAt, updated_at as updatedAt
      FROM timeline_events WHERE project_id = ?
    `;
    const params: any[] = [projectId];

    if (era) {
      query += ' AND era = ?';
      params.push(era);
    }

    query += ' ORDER BY sort_order ASC, created_at ASC';

    const rows = db.prepare(query).all(...params) as any[];

    return rows.map(row => {
      const event = mapRow(row);
      event.tags = TagService.getTagsForEntity(projectId, 'timeline_event', row.id);
      return event;
    });
  }

  static getById(id: number): TimelineEvent {
    const db = getDb();
    const row = db.prepare(`
      SELECT id, project_id as projectId, title, description,
             event_date as eventDate, sort_order as sortOrder, era,
             linked_note_id as linkedNoteId,
             created_at as createdAt, updated_at as updatedAt
      FROM timeline_events WHERE id = ?
    `).get(id) as any | undefined;

    if (!row) throw new NotFoundError('Timeline event');
    const event = mapRow(row);
    event.tags = TagService.getTagsForEntity(row.projectId, 'timeline_event', id);
    return event;
  }

  static create(data: CreateTimelineEvent): TimelineEvent {
    const db = getDb();

    // Автоматически определяем sort_order если не указан
    let sortOrder = data.sortOrder;
    if (sortOrder === undefined || sortOrder === 0) {
      const maxOrder = db.prepare(
        'SELECT MAX(sort_order) as maxOrder FROM timeline_events WHERE project_id = ?'
      ).get(data.projectId) as any;
      sortOrder = (maxOrder?.maxOrder || 0) + 1;
    }

    const result = db.prepare(`
      INSERT INTO timeline_events (project_id, title, description, event_date, sort_order, era, linked_note_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.projectId, data.title, data.description || '',
      data.eventDate, sortOrder, data.era || '',
      data.linkedNoteId || null
    );

    return this.getById(result.lastInsertRowid as number);
  }

  static update(id: number, data: UpdateTimelineEvent): TimelineEvent {
    this.getById(id);
    const db = getDb();

    const fields: string[] = [];
    const values: any[] = [];

    if (data.title !== undefined) { fields.push('title = ?'); values.push(data.title); }
    if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
    if (data.eventDate !== undefined) { fields.push('event_date = ?'); values.push(data.eventDate); }
    if (data.sortOrder !== undefined) { fields.push('sort_order = ?'); values.push(data.sortOrder); }
    if (data.era !== undefined) { fields.push('era = ?'); values.push(data.era); }
    if (data.linkedNoteId !== undefined) { fields.push('linked_note_id = ?'); values.push(data.linkedNoteId); }

    if (fields.length > 0) {
      fields.push("updated_at = datetime('now')");
      values.push(id);
      db.prepare(`UPDATE timeline_events SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    }

    return this.getById(id);
  }

  static delete(id: number): void {
    this.getById(id);
    const db = getDb();
    db.prepare('DELETE FROM timeline_events WHERE id = ?').run(id);
  }

  static reorder(projectId: number, orderedIds: number[]): TimelineEvent[] {
    const db = getDb();
    const updateStmt = db.prepare('UPDATE timeline_events SET sort_order = ? WHERE id = ? AND project_id = ?');

    const transaction = db.transaction(() => {
      orderedIds.forEach((id, index) => {
        updateStmt.run(index + 1, id, projectId);
      });
    });

    transaction();
    return this.getAll(projectId);
  }
}