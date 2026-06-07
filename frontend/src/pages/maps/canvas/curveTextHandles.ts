import type { CanvasObject } from '@/api/canvas';
import { asNumber, asPoints, asRecord, objectTransform, type CanvasPoint } from './canvasModel';

export type CurveTextHandleId = 'start' | 'control' | 'end';

export type CurveTextBezierGeometry = {
  start: CanvasPoint;
  control: CanvasPoint;
  end: CanvasPoint;
};

export const DEFAULT_CURVE_TEXT_BEZIER: CurveTextBezierGeometry = {
  start: { x: 0, y: 0 },
  control: { x: 140, y: -80 },
  end: { x: 280, y: 0 },
};

export const hasCurveTextPointPath = (object: CanvasObject): boolean => {
  const geometry = asRecord(object.geometryJson);
  return asPoints(geometry.points).length >= 2;
};

export const canEditCurveTextBezierHandles = (object: CanvasObject): boolean =>
  object.kind === 'curve_text' && !hasCurveTextPointPath(object);

export const getCurveTextBezierGeometry = (object: CanvasObject): CurveTextBezierGeometry => {
  const geometry = asRecord(object.geometryJson);
  const start = asRecord(geometry.start);
  const control = asRecord(geometry.control);
  const end = asRecord(geometry.end);
  const hasBezier = Number.isFinite(asNumber(start.x, Number.NaN))
    && Number.isFinite(asNumber(start.y, Number.NaN))
    && Number.isFinite(asNumber(end.x, Number.NaN))
    && Number.isFinite(asNumber(end.y, Number.NaN));
  if (!hasBezier) return { ...DEFAULT_CURVE_TEXT_BEZIER };
  return {
    start: { x: asNumber(start.x), y: asNumber(start.y) },
    control: {
      x: asNumber(control.x, DEFAULT_CURVE_TEXT_BEZIER.control.x),
      y: asNumber(control.y, DEFAULT_CURVE_TEXT_BEZIER.control.y),
    },
    end: { x: asNumber(end.x), y: asNumber(end.y) },
  };
};

export const worldPointToCurveLocal = (object: CanvasObject, world: CanvasPoint): CanvasPoint => {
  const transform = objectTransform(object);
  return { x: world.x - transform.x, y: world.y - transform.y };
};

export const curveLocalToWorldPoint = (object: CanvasObject, local: CanvasPoint): CanvasPoint => {
  const transform = objectTransform(object);
  return { x: transform.x + local.x, y: transform.y + local.y };
};

export const getCurveTextHandleWorldPositions = (
  object: CanvasObject,
): Record<CurveTextHandleId, CanvasPoint> => {
  const geometry = getCurveTextBezierGeometry(object);
  return {
    start: curveLocalToWorldPoint(object, geometry.start),
    control: curveLocalToWorldPoint(object, geometry.control),
    end: curveLocalToWorldPoint(object, geometry.end),
  };
};

export const hitCurveTextHandle = (
  worldPoint: CanvasPoint,
  object: CanvasObject,
  hitRadiusPx: number,
  viewportScale: number,
): CurveTextHandleId | null => {
  if (!canEditCurveTextBezierHandles(object)) return null;
  const tolerance = hitRadiusPx / Math.max(viewportScale, 0.05);
  const handles = getCurveTextHandleWorldPositions(object);
  const order: CurveTextHandleId[] = ['control', 'start', 'end'];
  for (const id of order) {
    const handle = handles[id];
    if (Math.hypot(worldPoint.x - handle.x, worldPoint.y - handle.y) <= tolerance) {
      return id;
    }
  }
  return null;
};

export const mergeCurveTextGeometryDraft = (
  objects: CanvasObject[],
  draft: CanvasObject | null,
): CanvasObject[] => {
  if (!draft) return objects;
  return objects.map((object) => (
    object.id === draft.id ? draft : object
  ));
};

const bezierGeometryKey = (object: CanvasObject): string => {
  const geometry = getCurveTextBezierGeometry(object);
  return JSON.stringify(geometry);
};

export const curveTextGeometryJsonEquals = (left: CanvasObject, right: CanvasObject): boolean => {
  if (left.id !== right.id) return false;
  if (left.kind !== 'curve_text' || right.kind !== 'curve_text') return false;
  if (hasCurveTextPointPath(left) || hasCurveTextPointPath(right)) {
    return JSON.stringify(left.geometryJson) === JSON.stringify(right.geometryJson);
  }
  return bezierGeometryKey(left) === bezierGeometryKey(right);
};

export const withUpdatedCurveTextHandle = (
  object: CanvasObject,
  handle: CurveTextHandleId,
  worldPoint: CanvasPoint,
): CanvasObject => {
  if (!canEditCurveTextBezierHandles(object)) return object;
  const local = worldPointToCurveLocal(object, worldPoint);
  const geometry = getCurveTextBezierGeometry(object);
  const nextGeometry: CurveTextBezierGeometry = {
    ...geometry,
    [handle]: local,
  };
  return {
    ...object,
    geometryJson: {
      ...asRecord(object.geometryJson),
      start: nextGeometry.start,
      control: nextGeometry.control,
      end: nextGeometry.end,
    },
  };
};
