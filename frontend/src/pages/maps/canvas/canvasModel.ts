import type { Theme } from '@mui/material/styles';
import type { CanvasObject } from '@/api/canvas';
import type { CreateCanvasObjectInput } from '@/types/generated/bindings';
import type { UpsertCanvasObjectInput } from '@/types/generated/bindings';

export type CanvasPoint = { x: number; y: number };
export type CanvasMode =
  | 'select'
  | 'marker'
  | 'text'
  | 'draw_territory'
  | 'polygon'
  | 'polyline'
  | 'rectangle'
  | 'ellipse'
  | 'curve_text'
  | 'image'
  | 'scene_container';

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
] as const;

export type TerritoryFactionOption = {
  id: number;
  name: string;
  color: string;
  kind: 'state' | 'faction';
};

/** App route for faction/state detail (parity D2; `content_json.factionId` link target). */
export const factionDetailPath = (
  projectId: number,
  faction: Pick<TerritoryFactionOption, 'id' | 'kind'>,
): string =>
  faction.kind === 'state'
    ? `/project/${projectId}/states/${faction.id}`
    : `/project/${projectId}/factions/${faction.id}`;

export type TerritoryFormState = {
  name: string;
  description: string;
  color: string;
  opacity: number;
  borderColor: string;
  borderWidth: number;
  smoothing: number;
  factionId: number | null;
};

export const DEFAULT_TERRITORY_FORM: TerritoryFormState = {
  name: '',
  description: '',
  color: '#4ecdc4',
  opacity: 0.24,
  borderColor: '#9ff3df',
  borderWidth: 2,
  smoothing: 0,
  factionId: null,
};

export const hexToRgb = (hex: string): string => {
  const normalized = hex.replace('#', '');
  if (normalized.length !== 6) return '0,0,0';
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `${r},${g},${b}`;
};

export const PANEL_WIDTH = 360;

export type MarkerIcon = keyof typeof MARKER_ICONS;

export type MarkerFormState = {
  title: string;
  description: string;
  icon: MarkerIcon;
  color: string;
  linkedNoteId: number | null;
};

export type NoteOption = { id: number; title: string; noteType: string };

export const DEFAULT_MARKER_FORM: MarkerFormState = {
  title: '',
  description: '',
  icon: 'custom',
  color: MARKER_COLORS[0],
  linkedNoteId: null,
};

export const sxDivider = (theme: Theme) => ({ borderColor: theme.palette.divider, my: 1.5 });
export const sxSectionLabel = (theme: Theme) => ({
  color: theme.palette.text.secondary,
  fontWeight: 600,
  textTransform: 'uppercase' as const,
  letterSpacing: 1,
  fontSize: '0.65rem',
});
export const sxPanelRoot = (theme: Theme) => ({
  width: PANEL_WIDTH,
  minWidth: PANEL_WIDTH,
  height: '100%',
  backgroundColor: theme.palette.background.paper,
  borderLeft: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  flexDirection: 'column' as const,
  overflow: 'hidden',
});

export type CanvasObjectTransform = {
  x?: number;
  y?: number;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
};

export const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

export const asNumber = (value: unknown, fallback = 0): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

export const asString = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback;

export const asPoints = (value: unknown): CanvasPoint[] =>
  Array.isArray(value)
    ? value
        .map((point) => {
          const record = asRecord(point);
          return { x: asNumber(record.x), y: asNumber(record.y) };
        })
        .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y))
    : [];

export const objectTransform = (object: CanvasObject): Required<CanvasObjectTransform> => {
  const transform = asRecord(object.transformJson);
  return {
    x: asNumber(transform.x),
    y: asNumber(transform.y),
    rotation: asNumber(transform.rotation),
    scaleX: asNumber(transform.scaleX, 1),
    scaleY: asNumber(transform.scaleY, 1),
  };
};

export const objectToUpsert = (object: CanvasObject): UpsertCanvasObjectInput => ({
  id: object.id,
  layerId: object.layerId,
  kind: object.kind,
  name: object.name,
  zIndex: object.zIndex,
  transformJson: object.transformJson,
  geometryJson: object.geometryJson,
  styleJson: object.styleJson,
  contentJson: object.contentJson,
  resourcePath: object.resourcePath,
  linkedNoteId: object.linkedNoteId,
  linkedSceneId: object.linkedSceneId,
  isHidden: object.isHidden,
  isLocked: object.isLocked,
});

export const withObjectPosition = (object: CanvasObject, x: number, y: number): CanvasObject => ({
  ...object,
  transformJson: {
    ...asRecord(object.transformJson),
    x,
    y,
  },
});

export const markerFormFromObject = (object: CanvasObject): MarkerFormState => {
  const content = asRecord(object.contentJson);
  const style = asRecord(object.styleJson);
  const icon = asString(content.icon, 'custom');
  return {
    title: asString(content.title, object.name ?? ''),
    description: asString(content.description),
    icon: (icon in MARKER_ICONS ? icon : 'custom') as MarkerIcon,
    color: asString(style.fill, MARKER_COLORS[0]),
    linkedNoteId: object.linkedNoteId,
  };
};

export const applyMarkerFormToObject = (object: CanvasObject, form: MarkerFormState): CanvasObject => {
  const title = form.title.trim();
  return {
    ...object,
    name: title || 'Marker',
    linkedNoteId: form.linkedNoteId,
    contentJson: {
      ...asRecord(object.contentJson),
      title,
      description: form.description,
      icon: form.icon,
    },
    styleJson: {
      ...asRecord(object.styleJson),
      fill: form.color,
    },
  };
};

export const buildMarkerCreateInput = (
  sceneId: number,
  layerId: number,
  point: CanvasPoint,
  form: MarkerFormState,
): Omit<CreateCanvasObjectInput, 'branchId'> => {
  const title = form.title.trim();
  return {
    sceneId,
    layerId,
    kind: 'marker',
    name: title || 'Marker',
    zIndex: null,
    transformJson: { x: point.x, y: point.y },
    geometryJson: { radius: 12 },
    styleJson: { fill: form.color, stroke: '#f8d7a4', strokeWidth: 2 },
    contentJson: { title, description: form.description, icon: form.icon },
    resourcePath: null,
    linkedNoteId: form.linkedNoteId,
    linkedSceneId: null,
    isHidden: false,
    isLocked: false,
  };
};

export const defaultImageObject = (
  sceneId: number,
  layerId: number,
  point: CanvasPoint,
  resourcePath: string,
  width: number,
  height: number,
) => ({
  sceneId,
  layerId,
  kind: 'image',
  name: 'Image',
  zIndex: null,
  transformJson: { x: point.x, y: point.y },
  geometryJson: { width, height },
  styleJson: { opacity: 1 },
  contentJson: {},
  resourcePath,
  linkedNoteId: null,
  linkedSceneId: null,
  isHidden: false,
  isLocked: false,
});

export const defaultTextObject = (sceneId: number, layerId: number, point: CanvasPoint, kind: 'text' | 'curve_text') => ({
  sceneId,
  layerId,
  kind,
  name: kind === 'curve_text' ? 'Curve text' : 'Text',
  zIndex: null,
  transformJson: { x: point.x, y: point.y },
  geometryJson: kind === 'curve_text'
    ? { start: { x: 0, y: 0 }, control: { x: 140, y: -80 }, end: { x: 280, y: 0 } }
    : { width: 160, height: 48 },
  styleJson: { fill: '#f8d7a4', fontSize: 28 },
  contentJson: { text: kind === 'curve_text' ? 'Curved label' : 'Text label' },
  resourcePath: null,
  linkedNoteId: null,
  linkedSceneId: null,
  isHidden: false,
  isLocked: false,
});

export const defaultShapeObject = (
  sceneId: number,
  layerId: number,
  point: CanvasPoint,
  kind: 'rectangle' | 'ellipse' | 'polyline' | 'polygon',
) => {
  const base = {
    sceneId,
    layerId,
    name: kind,
    zIndex: null,
    transformJson: { x: point.x, y: point.y },
    styleJson: { fill: '#4ecdc4', opacity: 0.24, stroke: '#9ff3df', strokeWidth: 2 },
    contentJson: {},
    resourcePath: null,
    linkedNoteId: null,
    linkedSceneId: null,
    isHidden: false,
    isLocked: false,
  };
  if (kind === 'rectangle') {
    return { ...base, kind: 'rectangle' as const, geometryJson: { width: 160, height: 96 } };
  }
  if (kind === 'ellipse') {
    return { ...base, kind: 'ellipse' as const, geometryJson: { radiusX: 80, radiusY: 48 } };
  }
  if (kind === 'polyline') {
    return {
      ...base,
      kind: 'polyline' as const,
      geometryJson: { points: [{ x: 0, y: 0 }, { x: 120, y: 0 }, { x: 180, y: 60 }], closed: false },
    };
  }
  return {
    ...base,
    kind: 'polygon' as const,
    geometryJson: { points: [{ x: 0, y: 0 }, { x: 120, y: 0 }, { x: 60, y: 80 }] },
  };
};

/** Parses `geometry_json.rings[]` or legacy `points` into one or more rings (engine-agnostic). */
export const geometryRingsFromJson = (geometryJson: unknown): CanvasPoint[][] => {
  const geometry = asRecord(geometryJson);
  const ringsRaw = Array.isArray(geometry.rings) ? geometry.rings : [];
  if (ringsRaw.length > 0) {
    return ringsRaw.map((ring) => asPoints(ring)).filter((ring) => ring.length > 0);
  }
  const points = asPoints(geometry.points);
  return points.length > 0 ? [points] : [];
};

export const territoryRingsFromObject = (object: CanvasObject): CanvasPoint[][] =>
  geometryRingsFromJson(object.geometryJson);

export const territoryTotalPointCount = (object: CanvasObject): number =>
  territoryRingsFromObject(object).reduce((sum, ring) => sum + ring.length, 0);

export const withTerritoryRings = (object: CanvasObject, rings: CanvasPoint[][]): CanvasObject => ({
  ...object,
  geometryJson: {
    ...asRecord(object.geometryJson),
    rings,
  },
});

export const territoryEditRingsFromObject = (object: CanvasObject): CanvasPoint[][] => {
  const transform = asRecord(object.transformJson);
  const offsetX = asNumber(transform.x) || 0;
  const offsetY = asNumber(transform.y) || 0;
  return territoryRingsFromObject(object).map((ring) => ring.map((point) => ({
    x: point.x + offsetX,
    y: point.y + offsetY,
  })));
};

export const withTerritoryEditRings = (object: CanvasObject, editRings: CanvasPoint[][]): CanvasObject => {
  const transform = asRecord(object.transformJson);
  const offsetX = asNumber(transform.x) || 0;
  const offsetY = asNumber(transform.y) || 0;
  const localRings = editRings.map((ring) => ring.map((point) => ({
    x: point.x - offsetX,
    y: point.y - offsetY,
  })));
  return withTerritoryRings(object, localRings);
};

export const territoryFormFromObject = (object: CanvasObject): TerritoryFormState => {
  const content = asRecord(object.contentJson);
  const style = asRecord(object.styleJson);
  const factionIdRaw = content.factionId;
  return {
    name: asString(object.name),
    description: asString(content.description),
    color: asString(style.fill, DEFAULT_TERRITORY_FORM.color),
    opacity: asNumber(style.opacity, DEFAULT_TERRITORY_FORM.opacity),
    borderColor: asString(style.stroke, DEFAULT_TERRITORY_FORM.borderColor),
    borderWidth: asNumber(style.strokeWidth, DEFAULT_TERRITORY_FORM.borderWidth),
    smoothing: asNumber(content.smoothing, 0),
    factionId: typeof factionIdRaw === 'number' ? factionIdRaw : null,
  };
};

export const applyTerritoryFormToObject = (object: CanvasObject, form: TerritoryFormState): CanvasObject => {
  const name = form.name.trim() || 'Territory';
  return {
    ...object,
    name,
    contentJson: {
      ...asRecord(object.contentJson),
      description: form.description,
      factionId: form.factionId,
      smoothing: form.smoothing,
    },
    styleJson: {
      ...asRecord(object.styleJson),
      fill: form.color,
      opacity: form.opacity,
      stroke: form.borderColor,
      strokeWidth: form.borderWidth,
    },
  };
};

export const buildTerritoryCreateInput = (
  sceneId: number,
  layerId: number,
  rings: CanvasPoint[][],
  form: TerritoryFormState,
): Omit<CreateCanvasObjectInput, 'branchId'> => {
  const name = form.name.trim() || 'Territory';
  return {
    sceneId,
    layerId,
    kind: 'territory',
    name,
    zIndex: null,
    transformJson: {},
    geometryJson: { rings },
    styleJson: {
      fill: form.color,
      opacity: form.opacity,
      stroke: form.borderColor,
      strokeWidth: form.borderWidth,
    },
    contentJson: {
      description: form.description,
      factionId: form.factionId,
      smoothing: form.smoothing,
    },
    resourcePath: null,
    linkedNoteId: null,
    linkedSceneId: null,
    isHidden: false,
    isLocked: false,
  };
};

export const defaultTerritoryObject = (sceneId: number, layerId: number, points: CanvasPoint[]) =>
  buildTerritoryCreateInput(sceneId, layerId, [points], DEFAULT_TERRITORY_FORM);
