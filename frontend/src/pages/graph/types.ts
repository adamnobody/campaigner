export type GraphNodeType = 'character' | 'faction' | 'dynasty' | 'dogma' | 'timeline' | 'note' | 'wiki';

export type GraphEdgeKind =
  | 'relationship'
  | 'membership'
  | 'dynasty-member'
  | 'dogma-link'
  | 'timeline-link'
  | 'wiki-link'
  | 'note-link';

export interface GraphNode {
  id: string;
  type: GraphNodeType;
  entityId: number;
  label: string;
  meta: Record<string, string | number | boolean | null | undefined>;
  degree?: number;
}

export interface GraphEdge {
  id: string;
  source: GraphNode['id'];
  target: GraphNode['id'];
  kind: GraphEdgeKind;
  label?: string;
  weight?: number;
}

export interface ProjectGraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export type NodeSizeMode = 'small' | 'medium' | 'large';
export type LabelVisibilityMode = 'always' | 'on-hover' | 'off';
export type EdgeThicknessMode = 'thin' | 'normal' | 'thick';
export type EdgeOpacityMode = 'low' | 'medium' | 'high';
export type LayoutIntensityMode = 'compact' | 'balanced' | 'loose';

export interface ProjectGraphViewSettings {
  nodeSize: NodeSizeMode;
  nodeLabels: LabelVisibilityMode;
  edgeLabels: 'on-hover' | 'off';
  edgeThickness: EdgeThicknessMode;
  edgeOpacity: EdgeOpacityMode;
  layoutIntensity: LayoutIntensityMode;
  focusSelectedNeighborhood: boolean;
}

export const PROJECT_GRAPH_VIEW_SETTINGS_KEY = 'campaigner.projectGraph.viewSettings.v1';

export const DEFAULT_PROJECT_GRAPH_VIEW_SETTINGS: ProjectGraphViewSettings = {
  nodeSize: 'medium',
  nodeLabels: 'on-hover',
  edgeLabels: 'off',
  edgeThickness: 'normal',
  edgeOpacity: 'medium',
  layoutIntensity: 'balanced',
  focusSelectedNeighborhood: false,
};

export const GRAPH_NODE_TYPE_LABELS: Record<GraphNodeType, string> = {
  character: 'Персонажи',
  faction: 'Фракции/государства',
  dynasty: 'Династии',
  dogma: 'Догмы',
  timeline: 'События',
  note: 'Заметки',
  wiki: 'Вики',
};

export const GRAPH_NODE_TYPE_COLORS: Record<GraphNodeType, string> = {
  character: '#7E9EFF',
  faction: '#64D5A7',
  dynasty: '#C18CFF',
  dogma: '#FFB86B',
  timeline: '#61D4E6',
  note: '#A9B3C8',
  wiki: '#E89BFF',
};

export const GRAPH_EDGE_KIND_LABELS: Record<GraphEdgeKind, string> = {
  relationship: 'Отношение',
  membership: 'Принадлежность',
  'dynasty-member': 'Член династии',
  'dogma-link': 'Связь с догмой',
  'timeline-link': 'Событие',
  'wiki-link': 'Wiki-ссылка',
  'note-link': 'Связь заметок',
};

export const GRAPH_EDGE_KIND_COLORS: Record<GraphEdgeKind, string> = {
  relationship: '#6FB8FF',
  membership: '#6EE7A7',
  'dynasty-member': '#CB9CFF',
  'dogma-link': '#FFC86E',
  'timeline-link': '#6AD7EB',
  'wiki-link': '#F0A1FF',
  'note-link': '#B4BED2',
};

export const GRAPH_NODE_TYPES: GraphNodeType[] = [
  'character',
  'faction',
  'dynasty',
  'dogma',
  'timeline',
  'wiki',
  'note',
];

export const GRAPH_EDGE_KINDS: GraphEdgeKind[] = [
  'relationship',
  'membership',
  'dynasty-member',
  'dogma-link',
  'timeline-link',
  'wiki-link',
  'note-link',
];

export const getNodeRoute = (projectId: number, node: GraphNode): string => {
  if (node.type === 'character') return `/project/${projectId}/characters/${node.entityId}`;
  if (node.type === 'faction') return `/project/${projectId}/factions/${node.entityId}`;
  if (node.type === 'dynasty') return `/project/${projectId}/dynasties/${node.entityId}`;
  if (node.type === 'dogma') return `/project/${projectId}/dogmas`;
  if (node.type === 'timeline') return `/project/${projectId}/timeline`;
  return `/project/${projectId}/notes/${node.entityId}`;
};
