import type { CanvasObject } from '@/api/canvas';
import { asNumber, asPoints, asRecord, asString } from './canvasModel';
import { DEFAULT_LABEL, shapeLabelFromObject, shapeSizeFromObject } from './shapeObjectForm';

export type ShapeLabelPlacement = {
  x: number;
  y: number;
  fontSize: number;
  color: string;
  fontWeight: 'normal' | 'bold';
  text: string;
};

const LABEL_GAP = 8;

function localBounds(object: CanvasObject): { minX: number; minY: number; maxX: number; maxY: number } {
  const geometry = asRecord(object.geometryJson);
  if (object.kind === 'rectangle' || object.kind === 'group') {
    const width = asNumber(geometry.width, 160);
    const height = asNumber(geometry.height, 100);
    return { minX: 0, minY: 0, maxX: width, maxY: height };
  }
  if (object.kind === 'ellipse') {
    const radiusX = asNumber(geometry.radiusX, 80);
    const radiusY = asNumber(geometry.radiusY, 50);
    return { minX: -radiusX, minY: -radiusY, maxX: radiusX, maxY: radiusY };
  }
  const points = asPoints(geometry.points);
  if (points.length === 0) {
    const { width, height } = shapeSizeFromObject(object);
    return { minX: 0, minY: 0, maxX: width, maxY: height };
  }
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const point of points) {
    minX = Math.min(minX, point.x);
    maxX = Math.max(maxX, point.x);
    minY = Math.min(minY, point.y);
    maxY = Math.max(maxY, point.y);
  }
  return { minX, minY, maxX, maxY };
}

export function shapeLabelPlacement(object: CanvasObject): ShapeLabelPlacement | null {
  const label = shapeLabelFromObject(object);
  const trimmed = label.labelText.trim();
  if (!trimmed || label.labelPosition === 'none') return null;

  const bounds = localBounds(object);
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;
  const fontSize = Math.max(8, label.labelFontSize);

  let x = centerX;
  let y = centerY;
  if (label.labelPosition === 'above') {
    y = bounds.minY - LABEL_GAP - fontSize * 0.35;
  } else if (label.labelPosition === 'below') {
    y = bounds.maxY + LABEL_GAP + fontSize * 0.65;
  }

  return {
    x,
    y,
    fontSize,
    color: asString(label.labelColor, DEFAULT_LABEL.labelColor),
    fontWeight: label.labelFontWeight,
    text: trimmed,
  };
}
