import {
  emptyGraphLayoutData,
  graphLayoutDataSchema,
  type GraphLayoutDataV1,
} from '@campaigner/shared';

export type GraphLayoutEntityIdMaps = {
  characterIdMap: Map<number, number>;
  factionIdMap: Map<number, number>;
  dynastyIdMap: Map<number, number>;
  dogmaIdMap: Map<number, number>;
  timelineEventIdMap: Map<number, number>;
  noteIdMap: Map<number, number>;
};

export function remapGraphLayoutDataForImport(
  layoutData: unknown,
  maps: GraphLayoutEntityIdMaps,
): GraphLayoutDataV1 {
  const parsedRoot = graphLayoutDataSchema.safeParse(layoutData);
  const base = parsedRoot.success ? parsedRoot.data : emptyGraphLayoutData();
  const nodes: GraphLayoutDataV1['nodes'] = {};
  for (const [key, pos] of Object.entries(base.nodes)) {
    const nextKey = remapGraphLayoutNodeKey(key, maps);
    if (nextKey) nodes[nextKey] = pos;
  }
  return {
    version: 1,
    viewport: base.viewport,
    nodes,
  };
}

function remapGraphLayoutNodeKey(key: string, maps: GraphLayoutEntityIdMaps): string | null {
  const colon = key.indexOf(':');
  if (colon < 1) return null;
  const type = key.slice(0, colon);
  const idStr = key.slice(colon + 1);
  const oldId = Number.parseInt(idStr, 10);
  if (!Number.isFinite(oldId)) return null;

  const normalizedType = type === 'event' ? 'timeline' : type;

  let newId: number | undefined;
  let outType = normalizedType;

  switch (normalizedType) {
    case 'character':
      newId = maps.characterIdMap.get(oldId);
      break;
    case 'faction':
    case 'state':
      newId = maps.factionIdMap.get(oldId);
      outType = normalizedType;
      break;
    case 'dynasty':
      newId = maps.dynastyIdMap.get(oldId);
      break;
    case 'dogma':
      newId = maps.dogmaIdMap.get(oldId);
      break;
    case 'timeline':
      newId = maps.timelineEventIdMap.get(oldId);
      break;
    case 'note':
    case 'wiki':
      newId = maps.noteIdMap.get(oldId);
      break;
    default:
      return null;
  }

  if (newId == null) return null;
  return `${outType}:${newId}`;
}
