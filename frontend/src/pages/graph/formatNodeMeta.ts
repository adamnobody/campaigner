import i18n from '@/i18n';
import {
  GRAPH_PANEL_META_LABELS,
  type GraphNode,
  type GraphNodeType,
} from '@/pages/graph/types';

export function formatMetaValue(nodeType: GraphNodeType, metaKey: string, raw: string | number | boolean): string {
  const s = String(raw);
  if (metaKey === 'noteType' && (nodeType === 'note' || nodeType === 'wiki')) {
    return i18n.t(`graph:metaValues.noteType.${s}`, { defaultValue: s });
  }
  if (nodeType === 'faction' && metaKey === 'kind') {
    return i18n.t(`graph:metaValues.factionKind.${s}`, { defaultValue: s });
  }
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
        label: i18n.t(`graph:metaLabels.${node.type}.${key}`, { defaultValue: labelMap[key] }),
        value: formatMetaValue(node.type, key, value as string | number | boolean),
      };
    })
    .filter(Boolean) as Array<{ key: string; label: string; value: string }>;
}
