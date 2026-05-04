import { getDb } from '../db/connection.js';
import { BadRequestError, NotFoundError } from '../middleware/errorHandler.js';
import type { WikiLink } from '@campaigner/shared';
import {
  branchEntityVisibilitySql,
  effectiveBranchIdForRead,
  resolveCreatedBranchId,
  assertBranchBelongsToProject,
} from './branchScope.js';

function visibilityTripple(
  projectId: number,
  branchId: number | undefined,
  wlCol: string,
  wlAt: string,
  snCol: string,
  snAt: string,
  tnCol: string,
  tnAt: string,
): { sql: string; params: (number | string)[] } {
  const vb = effectiveBranchIdForRead(projectId, branchId);
  const a = branchEntityVisibilitySql(projectId, vb, wlCol, wlAt);
  const b = branchEntityVisibilitySql(projectId, vb, snCol, snAt);
  const c = branchEntityVisibilitySql(projectId, vb, tnCol, tnAt);
  return {
    sql: `${a.sql}${b.sql}${c.sql}`,
    params: [...a.params, ...b.params, ...c.params],
  };
}

export class WikiService {
  static getLinksForNote(noteId: number, branchId?: number): WikiLink[] {
    const db = getDb();
    const meta = db
      .prepare('SELECT project_id as projectId FROM notes WHERE id = ?')
      .get(noteId) as { projectId: number } | undefined;
    if (!meta) return [];

    const { sql: visSql, params: visParams } = visibilityTripple(
      meta.projectId,
      branchId,
      'wl.created_branch_id',
      'wl.created_at',
      'sn.created_branch_id',
      'sn.created_at',
      'tn.created_branch_id',
      'tn.created_at',
    );

    return db.prepare(`
      SELECT
        wl.id, wl.project_id as projectId,
        wl.source_note_id as sourceNoteId,
        wl.target_note_id as targetNoteId,
        wl.label, wl.created_at as createdAt,
        sn.title as sourceTitle,
        tn.title as targetTitle
      FROM wiki_links wl
      JOIN notes sn ON sn.id = wl.source_note_id
      JOIN notes tn ON tn.id = wl.target_note_id
      WHERE (wl.source_note_id = ? OR wl.target_note_id = ?)${visSql}
      ORDER BY wl.created_at DESC
    `).all(noteId, noteId, ...visParams) as WikiLink[];
  }

  static getAllLinks(projectId: number, branchId?: number): WikiLink[] {
    const db = getDb();
    const { sql: visSql, params: visParams } = visibilityTripple(
      projectId,
      branchId,
      'wl.created_branch_id',
      'wl.created_at',
      'sn.created_branch_id',
      'sn.created_at',
      'tn.created_branch_id',
      'tn.created_at',
    );

    return db.prepare(`
      SELECT
        wl.id, wl.project_id as projectId,
        wl.source_note_id as sourceNoteId,
        wl.target_note_id as targetNoteId,
        wl.label, wl.created_at as createdAt,
        sn.title as sourceTitle,
        tn.title as targetTitle
      FROM wiki_links wl
      JOIN notes sn ON sn.id = wl.source_note_id
      JOIN notes tn ON tn.id = wl.target_note_id
      WHERE wl.project_id = ?${visSql}
      ORDER BY wl.created_at DESC
    `).all(projectId, ...visParams) as WikiLink[];
  }

  static createLink(
    projectId: number,
    sourceNoteId: number,
    targetNoteId: number,
    label: string = '',
    requestBranchId?: number,
  ): WikiLink {
    const db = getDb();

    if (sourceNoteId === targetNoteId) {
      throw new BadRequestError('Cannot link a note to itself');
    }

    if (requestBranchId !== undefined) {
      assertBranchBelongsToProject(requestBranchId, projectId);
    }
    const createdBranchId = resolveCreatedBranchId(projectId, requestBranchId);

    const [sId, tId] =
      sourceNoteId < targetNoteId
        ? [sourceNoteId, targetNoteId]
        : [targetNoteId, sourceNoteId];

    const result = db.prepare(`
      INSERT INTO wiki_links (project_id, source_note_id, target_note_id, label, created_branch_id)
      VALUES (?, ?, ?, ?, ?)
    `).run(projectId, sId, tId, label, createdBranchId);

    const link = WikiService.getLinkById(result.lastInsertRowid as number);

    if (!link) {
      throw new NotFoundError('Wiki link');
    }

    return link;
  }

  static deleteLink(id: number): void {
    const db = getDb();

    const existing = WikiService.getLinkById(id);
    if (!existing) {
      throw new NotFoundError('Wiki link');
    }

    db.prepare('DELETE FROM wiki_links WHERE id = ?').run(id);
  }

  static getLinkById(id: number): WikiLink | undefined {
    const db = getDb();

    return db.prepare(`
      SELECT
        wl.id, wl.project_id as projectId,
        wl.source_note_id as sourceNoteId,
        wl.target_note_id as targetNoteId,
        wl.label, wl.created_at as createdAt,
        sn.title as sourceTitle,
        tn.title as targetTitle
      FROM wiki_links wl
      JOIN notes sn ON sn.id = wl.source_note_id
      JOIN notes tn ON tn.id = wl.target_note_id
      WHERE wl.id = ?
    `).get(id) as WikiLink | undefined;
  }

  static getCategories(projectId: number, branchId?: number): { name: string; count: number }[] {
    const db = getDb();
    const viewBranch = effectiveBranchIdForRead(projectId, branchId);
    const nScope = branchEntityVisibilitySql(projectId, viewBranch, 'n.created_branch_id', 'n.created_at');

    return db.prepare(`
      SELECT t.name, COUNT(DISTINCT ta.entity_id) as count
      FROM tags t
      JOIN tag_associations ta ON ta.tag_id = t.id AND ta.entity_type = 'note'
      JOIN notes n ON n.id = ta.entity_id AND n.note_type = 'wiki'
      WHERE t.project_id = ?${nScope.sql}
      GROUP BY t.name
      ORDER BY count DESC
    `).all(projectId, ...nScope.params) as { name: string; count: number }[];
  }
}
