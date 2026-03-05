import { getDb } from '../db/connection';

export interface WikiLink {
  id: number;
  projectId: number;
  sourceNoteId: number;
  targetNoteId: number;
  label: string;
  createdAt: string;
  // joined fields
  sourceTitle?: string;
  targetTitle?: string;
}

export class WikiService {

  /** Get all links for a note (both directions) */
  static getLinksForNote(noteId: number): WikiLink[] {
    const db = getDb();
    const rows = db.prepare(`
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
      WHERE wl.source_note_id = ? OR wl.target_note_id = ?
      ORDER BY wl.created_at DESC
    `).all(noteId, noteId) as WikiLink[];
    return rows;
  }

  /** Get all links for a project */
  static getAllLinks(projectId: number): WikiLink[] {
    const db = getDb();
    const rows = db.prepare(`
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
      WHERE wl.project_id = ?
      ORDER BY wl.created_at DESC
    `).all(projectId) as WikiLink[];
    return rows;
  }

  /** Create a link between two wiki notes */
  static createLink(projectId: number, sourceNoteId: number, targetNoteId: number, label: string = ''): WikiLink {
    const db = getDb();
    if (sourceNoteId === targetNoteId) {
      throw new Error('Cannot link a note to itself');
    }
    // Normalize direction: smaller id is always source
    const [sId, tId] = sourceNoteId < targetNoteId
      ? [sourceNoteId, targetNoteId]
      : [targetNoteId, sourceNoteId];

    const result = db.prepare(`
      INSERT INTO wiki_links (project_id, source_note_id, target_note_id, label)
      VALUES (?, ?, ?, ?)
    `).run(projectId, sId, tId, label);

    return WikiService.getLinkById(result.lastInsertRowid as number)!;
  }

  /** Delete a link */
  static deleteLink(id: number): void {
    const db = getDb();
    db.prepare('DELETE FROM wiki_links WHERE id = ?').run(id);
  }

  /** Get link by id */
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

  /** Get wiki categories (distinct first tags of wiki notes) */
  static getCategories(projectId: number): { name: string; count: number }[] {
    const db = getDb();
    const rows = db.prepare(`
      SELECT t.name, COUNT(DISTINCT ta.entity_id) as count
      FROM tags t
      JOIN tag_associations ta ON ta.tag_id = t.id AND ta.entity_type = 'note'
      JOIN notes n ON n.id = ta.entity_id AND n.note_type = 'wiki'
      WHERE t.project_id = ?
      GROUP BY t.name
      ORDER BY count DESC
    `).all(projectId) as { name: string; count: number }[];
    return rows;
  }
}