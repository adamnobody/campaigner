import { getDb } from '../db/connection';
import type { CreateGeoStoryEvent, GeoStoryEvent, UpdateGeoStoryEvent } from '@campaigner/shared';
import { NotFoundError } from '../middleware/errorHandler';

interface GeoStoryListQuery {
  projectId: number;
  branchId: number;
  mapId?: number;
  territoryId?: number;
}

export class GeoStoryService {
  static list(query: GeoStoryListQuery): GeoStoryEvent[] {
    const db = getDb();
    const filters: string[] = ['project_id = ?', 'branch_id = ?'];
    const params: Array<number | string> = [query.projectId, query.branchId];
    if (query.mapId) {
      filters.push('map_id = ?');
      params.push(query.mapId);
    }
    if (query.territoryId) {
      filters.push('territory_id = ?');
      params.push(query.territoryId);
    }
    const rows = db.prepare(`
      SELECT
        id,
        project_id as projectId,
        branch_id as branchId,
        title,
        description,
        event_date as eventDate,
        sort_order as sortOrder,
        map_id as mapId,
        territory_id as territoryId,
        action_type as actionType,
        payload_json as payloadJson,
        linked_note_id as linkedNoteId,
        created_at as createdAt,
        updated_at as updatedAt
      FROM geo_story_events
      WHERE ${filters.join(' AND ')}
      ORDER BY event_date ASC, sort_order ASC, created_at ASC
    `).all(...params) as Array<Omit<GeoStoryEvent, 'payloadJson'> & { payloadJson: string }>;

    return rows.map((row) => ({
      ...row,
      payloadJson: JSON.parse(row.payloadJson || '{}'),
    }));
  }

  static create(data: CreateGeoStoryEvent): GeoStoryEvent {
    const db = getDb();
    const result = db.prepare(`
      INSERT INTO geo_story_events (
        project_id, branch_id, title, description, event_date, sort_order,
        map_id, territory_id, action_type, payload_json, linked_note_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.projectId,
      data.branchId,
      data.title,
      data.description ?? '',
      data.eventDate,
      data.sortOrder ?? 0,
      data.mapId ?? null,
      data.territoryId ?? null,
      data.actionType,
      JSON.stringify(data.payloadJson ?? {}),
      data.linkedNoteId ?? null,
    );
    return this.getById(result.lastInsertRowid as number);
  }

  static update(id: number, data: UpdateGeoStoryEvent): GeoStoryEvent {
    const db = getDb();
    this.getById(id);
    db.prepare(`
      UPDATE geo_story_events
      SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        event_date = COALESCE(?, event_date),
        sort_order = COALESCE(?, sort_order),
        map_id = COALESCE(?, map_id),
        territory_id = COALESCE(?, territory_id),
        action_type = COALESCE(?, action_type),
        payload_json = COALESCE(?, payload_json),
        linked_note_id = COALESCE(?, linked_note_id),
        updated_at = datetime('now')
      WHERE id = ?
    `).run(
      data.title ?? null,
      data.description ?? null,
      data.eventDate ?? null,
      data.sortOrder ?? null,
      data.mapId ?? null,
      data.territoryId ?? null,
      data.actionType ?? null,
      data.payloadJson ? JSON.stringify(data.payloadJson) : null,
      data.linkedNoteId ?? null,
      id,
    );
    return this.getById(id);
  }

  static delete(id: number): void {
    const db = getDb();
    this.getById(id);
    db.prepare(`DELETE FROM geo_story_events WHERE id = ?`).run(id);
  }

  static getById(id: number): GeoStoryEvent {
    const db = getDb();
    const row = db.prepare(`
      SELECT
        id,
        project_id as projectId,
        branch_id as branchId,
        title,
        description,
        event_date as eventDate,
        sort_order as sortOrder,
        map_id as mapId,
        territory_id as territoryId,
        action_type as actionType,
        payload_json as payloadJson,
        linked_note_id as linkedNoteId,
        created_at as createdAt,
        updated_at as updatedAt
      FROM geo_story_events
      WHERE id = ?
    `).get(id) as (Omit<GeoStoryEvent, 'payloadJson'> & { payloadJson: string }) | undefined;
    if (!row) throw new NotFoundError('Geo story event');
    return { ...row, payloadJson: JSON.parse(row.payloadJson || '{}') };
  }
}
