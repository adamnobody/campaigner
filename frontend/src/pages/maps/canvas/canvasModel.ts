import type { CanvasObject } from '@/api/canvas';
import type { UpsertCanvasObjectInput } from '@/types/generated/bindings';

export type CanvasPoint = { x: number; y: number };
export type CanvasMode =
  | 'select'
  | 'marker'
  | 'text'
  | 'polygon'
  | 'polyline'
  | 'rectangle'
  | 'ellipse'
  | 'curve_text'
  | 'image';

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

export const defaultMarkerObject = (sceneId: number, layerId: number, point: CanvasPoint) => ({
  sceneId,
  layerId,
  kind: 'marker',
  name: 'Marker',
  zIndex: null,
  transformJson: { x: point.x, y: point.y },
  geometryJson: { radius: 12 },
  styleJson: { fill: '#ff6b6b', stroke: '#f8d7a4', strokeWidth: 2 },
  contentJson: { title: 'Marker', description: '', icon: 'custom' },
  resourcePath: null,
  linkedNoteId: null,
  linkedSceneId: null,
  isHidden: false,
  isLocked: false,
});

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

export const defaultTerritoryObject = (sceneId: number, layerId: number, points: CanvasPoint[]) => ({
  sceneId,
  layerId,
  kind: 'territory',
  name: 'Territory',
  zIndex: null,
  transformJson: {},
  geometryJson: { rings: [points] },
  styleJson: { fill: '#4ecdc4', opacity: 0.24, stroke: '#9ff3df', strokeWidth: 2 },
  contentJson: { description: '', factionId: null },
  resourcePath: null,
  linkedNoteId: null,
  linkedSceneId: null,
  isHidden: false,
  isLocked: false,
});
