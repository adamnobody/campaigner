import i18n from '@/i18n';
import { charactersApi } from '@/api/characters';
import { factionsApi } from '@/api/factions';
import { dynastiesApi } from '@/api/dynasties';
import { dogmasApi } from '@/api/dogmas';
import { timelineApi } from '@/api/timeline';
import { notesApi } from '@/api/notes';
import { wikiApi } from '@/api/wiki';
import type { GraphEdge, GraphNode, ProjectGraphData } from '@/pages/graph/types';

const toNodeId = (type: GraphNode['type'], entityId: number) => `${type}:${entityId}`;

const pushNode = (map: Map<string, GraphNode>, node: GraphNode) => {
  if (!map.has(node.id)) map.set(node.id, node);
};

const pushEdge = (map: Map<string, GraphEdge>, edge: GraphEdge) => {
  if (!map.has(edge.id)) map.set(edge.id, edge);
};

const sortedPair = (a: string, b: string) => (a < b ? `${a}::${b}` : `${b}::${a}`);
export const buildProjectGraph = async (
  projectId: number,
  limits?: { maxCharacters?: number; maxFactions?: number; maxDynasties?: number; maxDogmas?: number; maxNotes?: number }
): Promise<ProjectGraphData> => {
  const maxCharacters = limits?.maxCharacters ?? 240;
  const maxFactions = limits?.maxFactions ?? 160;
  const maxDynasties = limits?.maxDynasties ?? 120;
  const maxDogmas = limits?.maxDogmas ?? 150;
  const maxNotes = limits?.maxNotes ?? 320;

  const settled = await Promise.allSettled([
    charactersApi.getAll(projectId, { limit: maxCharacters }),
    charactersApi.getRelationships(projectId),
    factionsApi.getAll(projectId, { limit: maxFactions }),
    factionsApi.getRelations(projectId),
    dynastiesApi.getAll(projectId, { limit: maxDynasties }),
    dogmasApi.getAll(projectId, { limit: maxDogmas }),
    timelineApi.getAll(projectId),
    notesApi.getAll(projectId, { limit: maxNotes }),
    wikiApi.getLinks(projectId),
  ]);

  const getSettled = <T,>(index: number, pick: (value: any) => T, fallback: T): T => {
    const item = settled[index];
    if (item.status !== 'fulfilled') return fallback;
    try {
      return pick(item.value);
    } catch {
      return fallback;
    }
  };

  const characters = getSettled(0, (res) => res.data.data.items || [], []);
  const characterRelationships = getSettled(1, (res) => res.data.data || [], []);
  const factions = getSettled(2, (res) => res.data.data || [], []);
  const factionRelations = getSettled(3, (res) => res.data.data || [], []);
  const dynasties = getSettled(4, (res) => res.data.data || [], []);
  const dogmas = getSettled(5, (res) => res.data.data.items || [], []);
  const timelineEvents = getSettled(6, (res) => res.data.data || [], []);
  const notes = getSettled(7, (res) => res.data.data.items || [], []);
  const wikiLinks = getSettled(8, (res) => res.data.data || [], []);

  const dynastyDetails = await Promise.all(
    dynasties.slice(0, 80).map(async (dynasty: { id: number }) => {
      try {
        const res = await dynastiesApi.getById(dynasty.id);
        return res.data.data;
      } catch {
        return null;
      }
    })
  );

  const nodes = new Map<string, GraphNode>();
  const edges = new Map<string, GraphEdge>();

  const noteTypeById = new Map<number, string>();
  notes.forEach((note: { id: number; noteType?: string }) => {
    noteTypeById.set(note.id, note.noteType || 'note');
  });

  characters.forEach((character: any) => {
    const meta: GraphNode['meta'] = {};
    if (character.title) meta.title = character.title;
    if (character.race) meta.race = character.race;
    if (character.characterClass) meta.characterClass = character.characterClass;
    if (typeof character.level === 'number') meta.level = character.level;
    pushNode(nodes, {
      id: toNodeId('character', character.id),
      type: 'character',
      entityId: character.id,
      label: character.name,
      meta,
    });
  });

  factions.forEach((faction: any) => {
    const meta: GraphNode['meta'] = {};
    if (faction.kind) meta.kind = faction.kind;
    if (faction.type) meta.type = faction.type;
    pushNode(nodes, {
      id: toNodeId('faction', faction.id),
      type: 'faction',
      entityId: faction.id,
      label: faction.name,
      meta,
    });
  });

  dynasties.forEach((dynasty: any) => {
    const meta: GraphNode['meta'] = {};
    if (dynasty.motto) meta.motto = dynasty.motto;
    pushNode(nodes, {
      id: toNodeId('dynasty', dynasty.id),
      type: 'dynasty',
      entityId: dynasty.id,
      label: dynasty.name,
      meta,
    });
  });

  dogmas.forEach((dogma: any) => {
    const meta: GraphNode['meta'] = {};
    if (dogma.category) meta.category = dogma.category;
    if (dogma.importance) meta.importance = dogma.importance;
    pushNode(nodes, {
      id: toNodeId('dogma', dogma.id),
      type: 'dogma',
      entityId: dogma.id,
      label: dogma.title,
      meta,
    });
  });

  timelineEvents.forEach((event: any) => {
    const meta: GraphNode['meta'] = {};
    if (event.era) meta.era = event.era;
    if (event.eventDate) meta.eventDate = event.eventDate;
    pushNode(nodes, {
      id: toNodeId('timeline', event.id),
      type: 'timeline',
      entityId: event.id,
      label: event.title,
      meta,
    });
  });

  notes.forEach((note: any) => {
    const nodeType = note.noteType === 'wiki' ? 'wiki' : 'note';
    pushNode(nodes, {
      id: toNodeId(nodeType, note.id),
      type: nodeType,
      entityId: note.id,
      label: note.title,
      meta: { noteType: note.noteType || 'note' },
    });
  });

  characterRelationships.forEach((rel: any) => {
    const source = toNodeId('character', rel.sourceCharacterId);
    const target = toNodeId('character', rel.targetCharacterId);
    if (!nodes.has(source) || !nodes.has(target)) return;
    pushEdge(edges, {
      id: `relationship:${sortedPair(source, target)}:${rel.relationshipType || 'custom'}`,
      source,
      target,
      kind: 'relationship',
      label:
        rel.customLabel
        || (rel.relationshipType
          ? i18n.t(`graph:relationshipTypes.${String(rel.relationshipType)}`, {
              defaultValue: i18n.t('graph:generatedEdgeLabels.relationshipDefault'),
            })
          : i18n.t('graph:generatedEdgeLabels.relationshipDefault')),
    });
  });

  characters.forEach((character: any) => {
    const source = toNodeId('character', character.id);
    (character.factionIds || []).forEach((factionId: number) => {
      const target = toNodeId('faction', factionId);
      if (!nodes.has(source) || !nodes.has(target)) return;
      pushEdge(edges, {
        id: `membership:${source}:${target}`,
        source,
        target,
        kind: 'membership',
        label: i18n.t('graph:generatedEdgeLabels.factionMember'),
      });
    });
    if (character.stateId) {
      const target = toNodeId('faction', character.stateId);
      if (!nodes.has(target)) return;
      pushEdge(edges, {
        id: `membership:${source}:${target}:state`,
        source,
        target,
        kind: 'membership',
        label: i18n.t('graph:generatedEdgeLabels.state'),
      });
    }
  });

  dynastyDetails.filter(Boolean).forEach((dynasty: any) => {
    const dynastyNode = toNodeId('dynasty', dynasty.id);
    const memberPairs: Array<{ characterId: number; label: string }> = [];

    (dynasty.members || []).forEach((member: any) => {
      if (member.characterId) {
        memberPairs.push({ characterId: member.characterId, label: member.role || i18n.t('graph:generatedEdgeLabels.dynastyMember') });
      }
    });
    if (dynasty.founderId) memberPairs.push({ characterId: dynasty.founderId, label: i18n.t('graph:generatedEdgeLabels.founder') });
    if (dynasty.currentLeaderId) {
      memberPairs.push({ characterId: dynasty.currentLeaderId, label: i18n.t('graph:generatedEdgeLabels.leader') });
    }
    if (dynasty.heirId) memberPairs.push({ characterId: dynasty.heirId, label: i18n.t('graph:generatedEdgeLabels.heir') });

    memberPairs.forEach(({ characterId, label }) => {
      const characterNode = toNodeId('character', characterId);
      if (!nodes.has(characterNode) || !nodes.has(dynastyNode)) return;
      pushEdge(edges, {
        id: `dynasty-member:${sortedPair(characterNode, dynastyNode)}:${label}`,
        source: characterNode,
        target: dynastyNode,
        kind: 'dynasty-member',
        label,
      });
    });

    if (dynasty.linkedFactionId) {
      const factionNode = toNodeId('faction', dynasty.linkedFactionId);
      if (!nodes.has(factionNode) || !nodes.has(dynastyNode)) return;
      pushEdge(edges, {
        id: `membership:${sortedPair(dynastyNode, factionNode)}:linked`,
        source: dynastyNode,
        target: factionNode,
        kind: 'membership',
        label: i18n.t('graph:generatedEdgeLabels.relatedFaction'),
      });
    }
  });

  factionRelations.forEach((rel: any) => {
    const source = toNodeId('faction', rel.sourceFactionId);
    const target = toNodeId('faction', rel.targetFactionId);
    if (!nodes.has(source) || !nodes.has(target)) return;
    pushEdge(edges, {
      id: `relationship:${sortedPair(source, target)}:${rel.relationType || 'relation'}`,
      source,
      target,
      kind: 'relationship',
      label: rel.customLabel || rel.relationType || i18n.t('graph:generatedEdgeLabels.factionRelationFallback'),
    });
  });

  timelineEvents.forEach((event: any) => {
    if (!event.linkedNoteId) return;
    const source = toNodeId('timeline', event.id);
    const isWiki = noteTypeById.get(event.linkedNoteId) === 'wiki';
    const target = toNodeId(isWiki ? 'wiki' : 'note', event.linkedNoteId);
    if (!nodes.has(source) || !nodes.has(target)) return;
    pushEdge(edges, {
      id: `timeline-link:${source}:${target}`,
      source,
      target,
      kind: 'timeline-link',
      label: i18n.t('graph:generatedEdgeLabels.noteAttached'),
    });
  });

  wikiLinks.forEach((link: any) => {
    const sourceType = noteTypeById.get(link.sourceNoteId) === 'wiki' ? 'wiki' : 'note';
    const targetType = noteTypeById.get(link.targetNoteId) === 'wiki' ? 'wiki' : 'note';
    const source = toNodeId(sourceType, link.sourceNoteId);
    const target = toNodeId(targetType, link.targetNoteId);
    if (!nodes.has(source) || !nodes.has(target)) return;
    const kind = sourceType === 'wiki' && targetType === 'wiki' ? 'wiki-link' : 'note-link';
    pushEdge(edges, {
      id: `${kind}:${sortedPair(source, target)}:${link.id}`,
      source,
      target,
      kind,
      label: link.label || '',
    });
  });

  const degreeMap = new Map<string, number>();
  Array.from(edges.values()).forEach((edge) => {
    degreeMap.set(edge.source, (degreeMap.get(edge.source) || 0) + 1);
    degreeMap.set(edge.target, (degreeMap.get(edge.target) || 0) + 1);
  });

  const finalNodes = Array.from(nodes.values()).map((node) => ({
    ...node,
    degree: degreeMap.get(node.id) || 0,
  }));

  return {
    nodes: finalNodes,
    edges: Array.from(edges.values()),
  };
};
