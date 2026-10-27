import type { GraphNode } from '@/pages/graph/types';

const toNodeId = (type: GraphNode['type'], entityId: number) => `${type}:${entityId}`;

const SECTION_TYPE: Record<string, GraphNode['type']> = {
  characters: 'character',
  factions: 'faction',
  states: 'faction',
  dynasties: 'dynasty',
  dogmas: 'dogma',
  timeline: 'timeline',
};

export function hrefToGraphNodeId(
  href: string,
  noteTypeById: Map<number, string>,
): GraphNode['id'] | null {
  const internal = href.match(/^\/__note__\/(\d+)/);
  if (internal) {
    const id = Number(internal[1]);
    return toNodeId(noteTypeById.get(id) === 'wiki' ? 'wiki' : 'note', id);
  }

  const project = href.match(/^\/project\/\d+\/([a-z]+)\/(\d+)/);
  if (!project) return null;

  const section = project[1]!;
  const id = Number(project[2]);
  if (section === 'notes') {
    return toNodeId(noteTypeById.get(id) === 'wiki' ? 'wiki' : 'note', id);
  }
  if (section === 'wiki') return toNodeId('wiki', id);

  const type = SECTION_TYPE[section];
  return type ? toNodeId(type, id) : null;
}
