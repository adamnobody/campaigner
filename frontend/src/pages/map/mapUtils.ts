import type { CreateMarker } from '@campaigner/shared';

export const MARKER_ICONS: Record<string, string> = {
  castle: '🏰', city: '🏙️', village: '🏘️', tavern: '🍺',
  dungeon: '⚔️', forest: '🌲', mountain: '⛰️', river: '🌊',
  cave: '🕳️', temple: '⛪', ruins: '🏚️', port: '⚓',
  bridge: '🌉', tower: '🗼', camp: '🏕️', battlefield: '⚔️',
  mine: '⛏️', farm: '🌾', graveyard: '💀', custom: '📍',
};
export const MARKER_ICON_ENTRIES = Object.entries(MARKER_ICONS);

export const MARKER_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#BB8FCE', '#85C1E9', '#F8C471', '#82E0AA',
] as const;

export const TERRITORY_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#BB8FCE', '#85C1E9', '#F8C471', '#82E0AA',
  '#E74C3C', '#2ECC71', '#3498DB', '#9B59B6',
  '#F39C12', '#1ABC9C', '#E67E22', '#8E44AD',
];

export const MIN_ZOOM = 0.2;
export const MAX_ZOOM = 5;
export const ZOOM_SPEED = 0.1;
export const DRAG_THRESHOLD = 4;
export const PANEL_WIDTH = 360;

export type MarkerIcon = CreateMarker['icon'];
export type MapMode = 'select' | 'draw_territory';

export const DEFAULT_FORM = {
  title: '',
  description: '',
  icon: 'custom' as MarkerIcon,
  color: MARKER_COLORS[0] as string,
  linkedNoteId: null as number | null,
  createChildMap: false,
};

export const sxDivider = { borderColor: 'rgba(255,255,255,0.06)', my: 1.5 } as const;
export const sxSectionLabel = { color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.65rem' } as const;
export const sxPanelRoot = {
  width: PANEL_WIDTH, minWidth: PANEL_WIDTH, height: '100%',
  backgroundColor: 'rgba(15,15,28,0.98)', borderLeft: '1px solid rgba(255,255,255,0.1)',
  display: 'flex', flexDirection: 'column', overflow: 'hidden',
} as const;
export const sxMapContainer = { flexGrow: 1, display: 'flex', overflow: 'hidden', borderRadius: 2, border: '1px solid rgba(255,255,255,0.1)' } as const;

export interface Marker {
  id: number; title: string; description: string;
  x: number; y: number; icon: MarkerIcon; color: string;
  linkedNoteId: number | null; childMapId: number | null;
}
export interface Territory {
  id: number; mapId: number; name: string; description: string;
  color: string; opacity: number; borderColor: string; borderWidth: number; smoothing: number;
  points: { x: number; y: number }[];
  factionId: number | null; sortOrder: number;
}
export interface MapData {
  id: number; projectId: number; parentMapId: number | null;
  parentMarkerId: number | null; name: string; imagePath: string | null;
}
export interface NoteOption { id: number; title: string; noteType: string; }
export interface FactionOption { id: number; name: string; color: string; type: string; }

/* eslint-disable @typescript-eslint/no-explicit-any */
export const extractData = (res: any): any => res.data?.data || res.data;

export const normalizeMarker = (m: any): Marker => ({
  id: m.id, title: m.title, description: m.description || '',
  x: (m.positionX ?? 0) * 100, y: (m.positionY ?? 0) * 100,
  icon: m.icon || 'custom', color: m.color || MARKER_COLORS[0],
  linkedNoteId: m.linkedNoteId || null, childMapId: m.childMapId || null,
});

export const normalizeTerritory = (t: any): Territory => ({
  id: t.id, mapId: t.mapId, name: t.name, description: t.description || '',
  color: t.color || '#4ECDC4', opacity: t.opacity ?? 0.25,
  borderColor: t.borderColor || '#4ECDC4', borderWidth: t.borderWidth ?? 1.5,
  smoothing: t.smoothing ?? 0,
  points: (t.points || []).map((p: any) => ({ x: p.x * 100, y: p.y * 100 })),
  factionId: t.factionId || null, sortOrder: t.sortOrder || 0,
});

export const normalizeMap = (m: any): MapData => ({
  id: m.id, projectId: m.projectId || m.project_id,
  parentMapId: m.parentMapId || m.parent_map_id || null,
  parentMarkerId: m.parentMarkerId || m.parent_marker_id || null,
  name: m.name, imagePath: m.imagePath || m.image_path || null,
});

export const parseMarkers = (data: any): Marker[] =>
  (Array.isArray(data) ? data : []).map(normalizeMarker);

export const parseTerritories = (data: any): Territory[] =>
  (Array.isArray(data) ? data : []).map(normalizeTerritory);

export const parseNotes = (data: any): NoteOption[] => {
  const list = data?.items || (Array.isArray(data) ? data : []);
  return list.map((n: any) => ({ id: n.id, title: n.title, noteType: n.noteType }));
};

export const parseFactions = (data: any): FactionOption[] => {
  const list = Array.isArray(data) ? data : [];
  return list.map((f: any) => ({ id: f.id, name: f.name, color: f.color || '#4ECDC4', type: f.type || 'other' }));
};
/* eslint-enable @typescript-eslint/no-explicit-any */

export const preloadImage = (src: string): Promise<void> =>
  new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = src;
    setTimeout(resolve, 3000);
  });

export const pointsToSvgPath = (points: { x: number; y: number }[]): string => {
  if (points.length < 2) return '';
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
};

export const isPointInPolygon = (px: number, py: number, polygon: { x: number; y: number }[]): boolean => {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    if (((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  return inside;
};

export const hexToRgb = (hex: string): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
};
