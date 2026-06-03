import type { CanvasObject } from '@/api/canvas';
import { asNumber, asPoints, asRecord, asString, objectTransform } from './canvasModel';

export type ContentBounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
};

const MARKER_RADIUS = 16;
const MARKER_LABEL_HEIGHT = 36;

const growBounds = (
  bounds: ContentBounds | null,
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
): ContentBounds => {
  if (!bounds) {
    return {
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX,
      height: maxY - minY,
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2,
    };
  }
  const nextMinX = Math.min(bounds.minX, minX);
  const nextMinY = Math.min(bounds.minY, minY);
  const nextMaxX = Math.max(bounds.maxX, maxX);
  const nextMaxY = Math.max(bounds.maxY, maxY);
  return {
    minX: nextMinX,
    minY: nextMinY,
    maxX: nextMaxX,
    maxY: nextMaxY,
    width: nextMaxX - nextMinX,
    height: nextMaxY - nextMinY,
    centerX: (nextMinX + nextMaxX) / 2,
    centerY: (nextMinY + nextMaxY) / 2,
  };
};

const growPoint = (bounds: ContentBounds | null, x: number, y: number, pad = 0): ContentBounds =>
  growBounds(bounds, x - pad, y - pad, x + pad, y + pad);

const growLocalRect = (
  bounds: ContentBounds | null,
  x: number,
  y: number,
  width: number,
  height: number,
): ContentBounds =>
  growBounds(bounds, x, y, x + width, y + height);

const curveSamples = (geometry: Record<string, unknown>) => {
  const explicit = asPoints(geometry.points);
  if (explicit.length >= 2) return explicit;

  const start = asRecord(geometry.start);
  const control = asRecord(geometry.control);
  const end = asRecord(geometry.end);
  const samples = [];
  for (let i = 0; i <= 32; i += 1) {
    const t = i / 32;
    const mt = 1 - t;
    samples.push({
      x: mt * mt * asNumber(start.x) + 2 * mt * t * asNumber(control.x, 160) + t * t * asNumber(end.x, 320),
      y: mt * mt * asNumber(start.y) + 2 * mt * t * asNumber(control.y, -80) + t * t * asNumber(end.y),
    });
  }
  return samples;
};

const boundsForObject = (object: CanvasObject): ContentBounds | null => {
  if (object.isHidden) return null;

  const transform = objectTransform(object);
  const geometry = asRecord(object.geometryJson);
  const content = asRecord(object.contentJson);
  const style = asRecord(object.styleJson);
  let bounds: ContentBounds | null = null;

  if (object.kind === 'marker') {
    const title = asString(content.title, object.name ?? '').trim();
    bounds = growPoint(bounds, transform.x, transform.y, MARKER_RADIUS + 4);
    if (title) {
      bounds = growBounds(
        bounds,
        transform.x - 80,
        transform.y + MARKER_RADIUS,
        transform.x + 80,
        transform.y + MARKER_RADIUS + MARKER_LABEL_HEIGHT,
      );
    }
    return bounds;
  }

  if (object.kind === 'text') {
    const fontSize = asNumber(style.fontSize, 28);
    const text = asString(content.text, object.name ?? 'Text');
    const width = Math.max(asNumber(geometry.width, 160), text.length * fontSize * 0.55);
    const height = Math.max(asNumber(geometry.height, 48), fontSize * 1.2);
    return growLocalRect(bounds, transform.x, transform.y, width, height);
  }

  if (object.kind === 'curve_text') {
    const fontSize = asNumber(style.fontSize, 24);
    for (const point of curveSamples(geometry)) {
      bounds = growPoint(bounds, transform.x + point.x, transform.y + point.y, fontSize * 0.6);
    }
    return bounds;
  }

  if (object.kind === 'icon') {
    const radius = asNumber(geometry.radius, 12);
    return growPoint(bounds, transform.x, transform.y, radius + 4);
  }

  if (object.kind === 'ellipse') {
    const radiusX = asNumber(geometry.radiusX, 60);
    const radiusY = asNumber(geometry.radiusY, 36);
    return growBounds(
      bounds,
      transform.x - radiusX,
      transform.y - radiusY,
      transform.x + radiusX,
      transform.y + radiusY,
    );
  }

  if (object.kind === 'rectangle' || object.kind === 'group' || object.kind === 'image') {
    const width = asNumber(geometry.width, 120);
    const height = asNumber(geometry.height, 80);
    return growLocalRect(bounds, transform.x, transform.y, width, height);
  }

  const rings = Array.isArray(geometry.rings) ? geometry.rings : [geometry.points];
  for (const ring of rings) {
    for (const point of asPoints(ring)) {
      bounds = growPoint(bounds, transform.x + point.x, transform.y + point.y, 4);
    }
  }

  return bounds;
};

export const computeObjectsBounds = (objects: CanvasObject[]): ContentBounds | null => {
  let bounds: ContentBounds | null = null;
  for (const object of objects) {
    const objectBounds = boundsForObject(object);
    if (!objectBounds) continue;
    bounds = bounds
      ? growBounds(bounds, objectBounds.minX, objectBounds.minY, objectBounds.maxX, objectBounds.maxY)
      : objectBounds;
  }

  if (!bounds) return null;

  const minSize = 48;
  if (bounds.width < minSize) {
    const pad = (minSize - bounds.width) / 2;
    bounds = growBounds(bounds, bounds.minX - pad, bounds.minY, bounds.maxX + pad, bounds.maxY);
  }
  if (bounds.height < minSize) {
    const pad = (minSize - bounds.height) / 2;
    bounds = growBounds(bounds, bounds.minX, bounds.minY - pad, bounds.maxX, bounds.maxY + pad);
  }

  return bounds;
};
