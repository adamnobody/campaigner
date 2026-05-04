import { getDb } from '../db/connection.js';
import { branchCreatedScopeSql } from './branchScope.js';

export interface SearchResult {
  type: 'character' | 'note' | 'marker' | 'event' | 'dogma' | 'tag' | 'faction';
  id: number;
  title: string;
  subtitle: string;
  icon: string;
  url: string;
}

interface CharacterSearchRow {
  id: number;
  name: string;
  title: string;
  race: string;
  characterClass: string;
  status: string;
}

interface NoteSearchRow {
  id: number;
  title: string;
  content: string;
  noteType: 'wiki' | 'note' | 'marker_note';
}

interface MarkerSearchRow {
  id: number;
  title: string;
  description: string;
  icon: string;
}

interface EventSearchRow {
  id: number;
  title: string;
  description: string;
  eventDate: string;
  era: string;
}

interface DogmaSearchRow {
  id: number;
  title: string;
  description: string;
  category: string;
  importance: string;
}

interface FactionSearchRow {
  id: number;
  name: string;
  kind: 'state' | 'faction';
  type: string | null;
  motto: string;
  description: string;
  status: string;
}

interface TagSearchRow {
  id: number;
  name: string;
  color: string;
}

function createSnippet(content: string, query: string, radius = 30): string {
  if (!content) {
    return '';
  }

  const lowerContent = content.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const idx = lowerContent.indexOf(lowerQuery);

  if (idx < 0) {
    return '';
  }

  const start = Math.max(0, idx - radius);
  const end = Math.min(content.length, idx + query.length + radius);

  return `${start > 0 ? '...' : ''}${content.substring(start, end)}${end < content.length ? '...' : ''}`;
}

export class SearchService {
  static search(projectId: number, query: string, limit = 20, branchId?: number): SearchResult[] {
    const db = getDb();
    const safeLimit = Math.max(1, Math.min(Math.trunc(limit), 50));
    const like = `%${query}%`;
    const results: SearchResult[] = [];

    const characters = db.prepare(`
      SELECT id, name, title, race, character_class as characterClass, status
      FROM characters
      WHERE project_id = ? AND (
        name LIKE ? OR title LIKE ? OR race LIKE ? OR
        character_class LIKE ? OR bio LIKE ? OR backstory LIKE ?
      )
      LIMIT ?
    `).all(projectId, like, like, like, like, like, like, safeLimit) as CharacterSearchRow[];

    for (const character of characters) {
      const parts = [character.race, character.characterClass, character.title].filter(Boolean);

      results.push({
        type: 'character',
        id: character.id,
        title: character.name,
        subtitle: parts.join(' · ') || character.status,
        icon: '👤',
        url: `/project/${projectId}/characters/${character.id}`,
      });
    }

    const noteScope = branchCreatedScopeSql(branchId);
    const notes = db.prepare(`
      SELECT id, title, content, note_type as noteType
      FROM notes
      WHERE project_id = ? AND (title LIKE ? OR content LIKE ?)${noteScope.sql}
      LIMIT ?
    `).all(projectId, like, like, ...noteScope.params, safeLimit) as NoteSearchRow[];

    for (const note of notes) {
      const typeIcons: Record<NoteSearchRow['noteType'], string> = {
        wiki: '📖',
        note: '📝',
        marker_note: '📌',
      };

      const snippet = createSnippet(note.content, query);

      results.push({
        type: 'note',
        id: note.id,
        title: note.title,
        subtitle: snippet || note.noteType,
        icon: typeIcons[note.noteType] || '📝',
        url: `/project/${projectId}/notes/${note.id}`,
      });
    }

    const markerScope = branchCreatedScopeSql(branchId, 'mm.created_branch_id');
    const markers = db.prepare(`
      SELECT mm.id, mm.title, mm.description, mm.icon
      FROM map_markers mm
      JOIN maps m ON mm.map_id = m.id
      WHERE m.project_id = ? AND (mm.title LIKE ? OR mm.description LIKE ?)${markerScope.sql}
      LIMIT ?
    `).all(projectId, like, like, ...markerScope.params, safeLimit) as MarkerSearchRow[];

    for (const marker of markers) {
      results.push({
        type: 'marker',
        id: marker.id,
        title: marker.title,
        subtitle: marker.description || 'Маркер на карте',
        icon: '📍',
        url: `/project/${projectId}/map`,
      });
    }

    const eventScope = branchCreatedScopeSql(branchId);
    const events = db.prepare(`
      SELECT id, title, description, event_date as eventDate, era
      FROM timeline_events
      WHERE project_id = ? AND (title LIKE ? OR description LIKE ? OR era LIKE ?)${eventScope.sql}
      LIMIT ?
    `).all(projectId, like, like, like, ...eventScope.params, safeLimit) as EventSearchRow[];

    for (const event of events) {
      const parts = [event.eventDate, event.era].filter(Boolean);

      results.push({
        type: 'event',
        id: event.id,
        title: event.title,
        subtitle: parts.join(' · ') || 'Событие',
        icon: '📅',
        url: `/project/${projectId}/timeline`,
      });
    }

    const dogmaScope = branchCreatedScopeSql(branchId);
    const dogmas = db.prepare(`
      SELECT id, title, description, category, importance
      FROM dogmas
      WHERE project_id = ? AND (title LIKE ? OR description LIKE ? OR impact LIKE ? OR exceptions LIKE ?)${dogmaScope.sql}
      LIMIT ?
    `).all(projectId, like, like, like, like, ...dogmaScope.params, safeLimit) as DogmaSearchRow[];

    for (const dogma of dogmas) {
      results.push({
        type: 'dogma',
        id: dogma.id,
        title: dogma.title,
        subtitle: dogma.description ? dogma.description.substring(0, 80) : 'Догма',
        icon: '⚖️',
        url: `/project/${projectId}/dogmas`,
      });
    }

    const factions = db.prepare(`
      SELECT id, name, kind, type, motto, description, status
      FROM factions
      WHERE project_id = ? AND (name LIKE ? OR motto LIKE ? OR description LIKE ? OR headquarters LIKE ?)
      LIMIT ?
    `).all(projectId, like, like, like, like, safeLimit) as FactionSearchRow[];

    for (const faction of factions) {
      const subtitle =
        faction.motto ||
        faction.description?.substring(0, 80) ||
        faction.status;
      const isState = faction.kind === 'state';
      const basePath = isState ? 'states' : 'factions';

      results.push({
        type: 'faction',
        id: faction.id,
        title: faction.name,
        subtitle,
        icon: isState ? '🏰' : '👥',
        url: `/project/${projectId}/${basePath}/${faction.id}`,
      });
    }

    const tags = db.prepare(`
      SELECT id, name, color
      FROM tags
      WHERE project_id = ? AND name LIKE ?
      LIMIT ?
    `).all(projectId, like, safeLimit) as TagSearchRow[];

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

    const lowerQuery = query.toLowerCase();

    const typePriority: Record<SearchResult['type'], number> = {
      character: 0,
      faction: 1,
      note: 2,
      marker: 3,
      event: 4,
      dogma: 5,
      tag: 6,
    };

    results.sort((a, b) => {
      const aExact = a.title.toLowerCase() === lowerQuery ? 0 : 1;
      const bExact = b.title.toLowerCase() === lowerQuery ? 0 : 1;

      if (aExact !== bExact) {
        return aExact - bExact;
      }

      const aStarts = a.title.toLowerCase().startsWith(lowerQuery) ? 0 : 1;
      const bStarts = b.title.toLowerCase().startsWith(lowerQuery) ? 0 : 1;

      if (aStarts !== bStarts) {
        return aStarts - bStarts;
      }

      return typePriority[a.type] - typePriority[b.type];
    });

    return results.slice(0, safeLimit);
  }
}