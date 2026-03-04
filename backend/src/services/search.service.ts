import { getDb } from '../db/connection';

export interface SearchResult {
  type: 'character' | 'note' | 'marker' | 'event' | 'tag';
  id: number;
  title: string;
  subtitle: string;
  icon: string;
  url: string;
}

export class SearchService {
  static search(projectId: number, query: string, limit = 20): SearchResult[] {
    const db = getDb();
    const like = `%${query}%`;
    const results: SearchResult[] = [];

    // Characters
    const characters = db.prepare(`
      SELECT id, name, title, race, character_class as characterClass, status
      FROM characters
      WHERE project_id = ? AND (
        name LIKE ? OR title LIKE ? OR race LIKE ? OR
        character_class LIKE ? OR bio LIKE ? OR backstory LIKE ?
      )
      LIMIT ?
    `).all(projectId, like, like, like, like, like, like, limit) as any[];

    for (const ch of characters) {
      const parts = [ch.race, ch.characterClass, ch.title].filter(Boolean);
      results.push({
        type: 'character',
        id: ch.id,
        title: ch.name,
        subtitle: parts.join(' · ') || ch.status,
        icon: '👤',
        url: `/project/${projectId}/characters/${ch.id}`,
      });
    }

    // Notes
    const notes = db.prepare(`
      SELECT id, title, content, note_type as noteType
      FROM notes
      WHERE project_id = ? AND (title LIKE ? OR content LIKE ?)
      LIMIT ?
    `).all(projectId, like, like, limit) as any[];

    for (const note of notes) {
      const typeIcons: Record<string, string> = { wiki: '📖', note: '📝', marker_note: '📌' };
      // Extract snippet from content
      let snippet = '';
      if (note.content) {
        const idx = note.content.toLowerCase().indexOf(query.toLowerCase());
        if (idx >= 0) {
          const start = Math.max(0, idx - 30);
          const end = Math.min(note.content.length, idx + query.length + 30);
          snippet = (start > 0 ? '...' : '') + note.content.substring(start, end) + (end < note.content.length ? '...' : '');
        }
      }
      results.push({
        type: 'note',
        id: note.id,
        title: note.title,
        subtitle: snippet || note.noteType,
        icon: typeIcons[note.noteType] || '📝',
        url: `/project/${projectId}/notes/${note.id}`,
      });
    }

    // Map markers
    const markers = db.prepare(`
      SELECT id, title, description, icon
      FROM map_markers
      WHERE project_id = ? AND (title LIKE ? OR description LIKE ?)
      LIMIT ?
    `).all(projectId, like, like, limit) as any[];

    for (const m of markers) {
      results.push({
        type: 'marker',
        id: m.id,
        title: m.title,
        subtitle: m.description || 'Маркер на карте',
        icon: '📍',
        url: `/project/${projectId}/map`,
      });
    }

    // Timeline events
    const events = db.prepare(`
      SELECT id, title, description, event_date as eventDate, era
      FROM timeline_events
      WHERE project_id = ? AND (title LIKE ? OR description LIKE ? OR era LIKE ?)
      LIMIT ?
    `).all(projectId, like, like, like, limit) as any[];

    for (const ev of events) {
      const parts = [ev.eventDate, ev.era].filter(Boolean);
      results.push({
        type: 'event',
        id: ev.id,
        title: ev.title,
        subtitle: parts.join(' · ') || 'Событие',
        icon: '📅',
        url: `/project/${projectId}/timeline`,
      });
    }

    // Tags
    const tags = db.prepare(`
      SELECT id, name, color FROM tags
      WHERE project_id = ? AND name LIKE ?
      LIMIT ?
    `).all(projectId, like, limit) as any[];

    for (const tag of tags) {
      results.push({
        type: 'tag',
        id: tag.id,
        title: tag.name,
        subtitle: 'Тег',
        icon: '🏷️',
        url: `/project/${projectId}/characters`,
      });
    }

    // Sort: exact matches first, then by type priority
    const typePriority: Record<string, number> = {
      character: 0, note: 1, marker: 2, event: 3, tag: 4,
    };

    results.sort((a, b) => {
      const aExact = a.title.toLowerCase() === query.toLowerCase() ? 0 : 1;
      const bExact = b.title.toLowerCase() === query.toLowerCase() ? 0 : 1;
      if (aExact !== bExact) return aExact - bExact;

      const aStarts = a.title.toLowerCase().startsWith(query.toLowerCase()) ? 0 : 1;
      const bStarts = b.title.toLowerCase().startsWith(query.toLowerCase()) ? 0 : 1;
      if (aStarts !== bStarts) return aStarts - bStarts;

      return typePriority[a.type] - typePriority[b.type];
    });

    return results.slice(0, limit);
  }
}