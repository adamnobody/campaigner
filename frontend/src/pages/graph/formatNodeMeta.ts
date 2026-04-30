import {
  GRAPH_PANEL_META_LABELS,
  type GraphNode,
  type GraphNodeType,
} from '@/pages/graph/types';

const NOTE_TYPE_VALUE_RU: Record<string, string> = {
  wiki: 'Вики',
  note: 'Заметка',
  marker_note: 'Заметка маркера',
};

const FACTION_KIND_VALUE_RU: Record<string, string> = {
  state: 'Государство',
  faction: 'Фракция',
};

export function formatMetaValue(nodeType: GraphNodeType, metaKey: string, raw: string | number | boolean): string {
  const s = String(raw);
  if (metaKey === 'noteType' && (nodeType === 'note' || nodeType === 'wiki')) return NOTE_TYPE_VALUE_RU[s] ?? s;
  if (nodeType === 'faction' && metaKey === 'kind') return FACTION_KIND_VALUE_RU[s] ?? s;
  return s;
}

export function getOrderedMetaRows(node: GraphNode): Array<{ key: string; label: string; value: string }> {
  const labelMap = GRAPH_PANEL_META_LABELS[node.type];
  return Object.keys(labelMap)
    .map((key) => {
      const value = node.meta[key];
      if (value === '' || value === null || value === undefined) return null;
      return {
        key,
        label: labelMap[key],
        value: formatMetaValue(node.type, key, value as string | number | boolean),
      };
    })
    .filter(Boolean) as Array<{ key: string; label: string; value: string }>;
}
