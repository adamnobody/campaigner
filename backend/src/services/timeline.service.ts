import { getDb } from '../db/connection.js';
import {
  CreateTimelineEvent,
  UpdateTimelineEvent,
  TimelineEvent,
} from '@campaigner/shared';
import { NotFoundError } from '../middleware/errorHandler.js';
import { TagService } from './tag.service.js';
import { loadTagsBatch, buildUpdateQuery } from '../utils/dbHelpers.js';
import { BranchOverlayService } from './branchOverlay.service.js';
import {
  branchCreatedScopeSql,
  isRowVisibleForActiveBranch,
  resolveCreatedBranchId,
  assertBranchBelongsToProject,
} from './branchScope.js';

interface TimelineEventRow {
  id: number;
  projectId: number;
  title: string;
  description: string;
  eventDate: string;
  sortOrder: number;
  era: string;
  linkedNoteId: number | null;
  createdAt: string;
  updatedAt: string;
  createdBranchId?: number | null;
}

const SELECT_FIELDS = `
  id, project_id as projectId, title, description,
  event_date as eventDate, sort_order as sortOrder, era,
  linked_note_id as linkedNoteId,
  created_at as createdAt, updated_at as updatedAt,
  created_branch_id as createdBranchId
`;

function mapRow(row: TimelineEventRow): TimelineEvent {
  return { ...row, tags: [] };
}

const UPDATE_FIELD_MAP: Record<string, string> = {
  title: 'title',
  description: 'description',
  eventDate: 'event_date',
  sortOrder: 'sort_order',
  era: 'era',
  linkedNoteId: 'linked_note_id',
};

function pickTimelinePatch(data: UpdateTimelineEvent): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  (Object.keys(UPDATE_FIELD_MAP) as Array<keyof UpdateTimelineEvent>).forEach((key) => {
    if (data[key] !== undefined) patch[key] = data[key];
  });
  return patch;
}

export class TimelineService {
  static getAll(projectId: number, era?: string, branchId?: number): TimelineEvent[] {
    const db = getDb();

    let query = `SELECT ${SELECT_FIELDS} FROM timeline_events WHERE project_id = ?`;
    const params: Array<number | string> = [projectId];

    if (era) {
      query += ' AND era = ?';
      params.push(era);
    }

    const scope = branchCreatedScopeSql(branchId);
    query += scope.sql;
    params.push(...scope.params);

    query += ' ORDER BY sort_order ASC, created_at ASC';

    const baseRows = db.prepare(query).all(...params) as TimelineEventRow[];
    const rows = branchId
      ? BranchOverlayService.applyListOverlay(baseRows, BranchOverlayService.getOverrides(branchId, 'timeline_event'))
      : baseRows;

    const tagsMap = loadTagsBatch(
      projectId,
      'timeline_event',
      rows.map((r) => r.id)
    );

    return rows.map((row) => {
      const event = mapRow(row);
      event.tags = tagsMap.get(row.id) || [];
      return event;
    });
  }

  static getById(id: number, branchId?: number): TimelineEvent {
    const db = getDb();

    const row = db.prepare(
      `SELECT ${SELECT_FIELDS} FROM timeline_events WHERE id = ?`
    ).get(id) as TimelineEventRow | undefined;

    if (row && !isRowVisibleForActiveBranch(row.createdBranchId, branchId)) {
      throw new NotFoundError('Timeline event');
    }

    const projectedRow = branchId
      ? BranchOverlayService.applyItemOverlay(row ?? null, BranchOverlayService.getOverrides(branchId, 'timeline_event'))
      : row ?? null;

    if (!projectedRow) {
      throw new NotFoundError('Timeline event');
    }

    const event = mapRow(projectedRow);
    event.tags = TagService.getTagsForEntity(projectedRow.projectId, 'timeline_event', id);
    return event;
  }

  static create(data: CreateTimelineEvent, requestBranchId?: number): TimelineEvent {
    const db = getDb();

    if (requestBranchId !== undefined) {
      assertBranchBelongsToProject(requestBranchId, data.projectId);
    }
    const createdBranchId = resolveCreatedBranchId(data.projectId, requestBranchId);

    let sortOrder = data.sortOrder;
    if (sortOrder === undefined || sortOrder === 0) {
      const maxOrderRow = db.prepare(
        'SELECT MAX(sort_order) as maxOrder FROM timeline_events WHERE project_id = ?'
      ).get(data.projectId) as { maxOrder: number | null } | undefined;

      sortOrder = (maxOrderRow?.maxOrder || 0) + 1;
    }

    const result = db.prepare(`
      INSERT INTO timeline_events (project_id, title, description, event_date, sort_order, era, linked_note_id, created_branch_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.projectId,
      data.title,
      data.description || '',
      data.eventDate,
      sortOrder,
      data.era || '',
      data.linkedNoteId || null,
      createdBranchId,
    );

    return this.getById(result.lastInsertRowid as number, requestBranchId);
  }

  static update(id: number, data: UpdateTimelineEvent, branchId?: number): TimelineEvent {
    this.getById(id, branchId);
    if (!branchId) {
      buildUpdateQuery('timeline_events', UPDATE_FIELD_MAP, data as Record<string, unknown>, id);
      return this.getById(id);
    }

    BranchOverlayService.saveUpsertOverride(
      branchId,
      'timeline_event',
      id,
      pickTimelinePatch(data),
    );
    return this.getById(id, branchId);
  }

  static delete(id: number, branchId?: number): void {
    this.getById(id, branchId);
    if (!branchId) {
      const db = getDb();
      db.prepare('DELETE FROM timeline_events WHERE id = ?').run(id);
      return;
    }

    BranchOverlayService.saveDeleteOverride(branchId, 'timeline_event', id);
  }

  static reorder(projectId: number, orderedIds: number[], branchId?: number): TimelineEvent[] {
    if (!branchId) {
      const db = getDb();
      const updateStmt = db.prepare(
        'UPDATE timeline_events SET sort_order = ? WHERE id = ? AND project_id = ?'
      );

      const transaction = db.transaction(() => {
        orderedIds.forEach((id, index) => {
          updateStmt.run(index + 1, id, projectId);
        });
      });

      transaction();
      return this.getAll(projectId);
    }

    const db = getDb();
    const verifyOwnershipStmt = db.prepare(
      'SELECT id FROM timeline_events WHERE id = ? AND project_id = ?'
    );
    const transaction = db.transaction(() => {
      orderedIds.forEach((id, index) => {
        const exists = verifyOwnershipStmt.get(id, projectId) as { id: number } | undefined;
        if (exists) {
          BranchOverlayService.saveUpsertOverride(branchId, 'timeline_event', id, { sortOrder: index + 1 });
        }
      });
    });

    transaction();
    return this.getAll(projectId, undefined, branchId);
  }
}
