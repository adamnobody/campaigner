import type { CanvasObject } from '@/api/canvas';
import type { CreateCanvasObjectInput } from '@/types/generated/bindings';
import {
  asNumber,
  asPoints,
  asRecord,
  asString,
  objectTransform,
  type CanvasPoint,
} from './canvasModel';

export const SHAPE_KINDS = ['rectangle', 'ellipse', 'polygon', 'polyline'] as const;
export type ShapeKind = (typeof SHAPE_KINDS)[number];

export type ShapeVariant = 'rectangle' | 'ellipse' | 'triangle' | 'diamond' | 'line';

export type ShapeLabelPosition = 'none' | 'inside' | 'above' | 'below';

export type ShapeObjectFormState = {
  variant: ShapeVariant;
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
  width: number;
  height: number;
  x: number;
  y: number;
  rotation: number;
  labelText: string;
  labelPosition: ShapeLabelPosition;
  labelFontSize: number;
  labelColor: string;
  labelFontWeight: 'normal' | 'bold';
};

export const DEFAULT_SHAPE_STYLE = {
  fill: '#5a7a9a',
  stroke: '#e8dcc8',
  strokeWidth: 2,
  opacity: 1,
} as const;

export const DEFAULT_SHAPE_SIZE = {
  width: 160,
  height: 100,
} as const;

export const DEFAULT_LABEL = {
  labelText: '',
  labelPosition: 'none' as ShapeLabelPosition,
  labelFontSize: 18,
  labelColor: '#f8f4ec',
  labelFontWeight: 'normal' as const,
};

export function isShapeKind(kind: string): kind is ShapeKind {
  return (SHAPE_KINDS as readonly string[]).includes(kind);
}

const TRIANGLE_ASPECT = 0.625;

function trianglePoints(width: number, height: number): CanvasPoint[] {
  const h = height > 0 ? height : width * TRIANGLE_ASPECT;
  return [
    { x: width / 2, y: 0 },
    { x: width, y: h },
    { x: 0, y: h },
  ];
}

function diamondPoints(width: number, height: number): CanvasPoint[] {
  const w = width > 0 ? width : DEFAULT_SHAPE_SIZE.width;
  const h = height > 0 ? height : DEFAULT_SHAPE_SIZE.height;
  return [
    { x: w / 2, y: 0 },
    { x: w, y: h / 2 },
    { x: w / 2, y: h },
    { x: 0, y: h / 2 },
  ];
}

function linePoints(width: number): CanvasPoint[] {
  const w = width > 0 ? width : DEFAULT_SHAPE_SIZE.width;
  const y = DEFAULT_SHAPE_SIZE.height / 2;
  return [{ x: 0, y }, { x: w, y }];
}

function pointsEqual(a: CanvasPoint[], b: CanvasPoint[], tolerance = 0.5): boolean {
  if (a.length !== b.length) return false;
  return a.every((point, index) =>
    Math.abs(point.x - b[index].x) <= tolerance
    && Math.abs(point.y - b[index].y) <= tolerance);
}

export function inferShapeVariant(object: CanvasObject): ShapeVariant {
  const content = asRecord(object.contentJson);
  const stored = asString(content.shapeVariant, '');
  if (stored === 'rectangle' || stored === 'ellipse' || stored === 'triangle' || stored === 'diamond' || stored === 'line') {
    return stored;
  }
  if (object.kind === 'rectangle') return 'rectangle';
  if (object.kind === 'ellipse') return 'ellipse';
  if (object.kind === 'polyline') return 'line';
  if (object.kind === 'polygon') {
    const points = asPoints(asRecord(object.geometryJson).points);
    const { width, height } = shapeSizeFromObject(object);
    if (pointsEqual(points, trianglePoints(width, height))) return 'triangle';
    if (pointsEqual(points, diamondPoints(width, height))) return 'diamond';
  }
  return 'rectangle';
}

export function shapeSizeFromObject(object: CanvasObject): { width: number; height: number } {
  const geometry = asRecord(object.geometryJson);
  if (object.kind === 'rectangle' || object.kind === 'group') {
    return {
      width: asNumber(geometry.width, DEFAULT_SHAPE_SIZE.width),
      height: asNumber(geometry.height, DEFAULT_SHAPE_SIZE.height),
    };
  }
  if (object.kind === 'ellipse') {
    return {
      width: asNumber(geometry.radiusX, DEFAULT_SHAPE_SIZE.width / 2) * 2,
      height: asNumber(geometry.radiusY, DEFAULT_SHAPE_SIZE.height / 2) * 2,
    };
  }
  const points = asPoints(geometry.points);
  if (points.length === 0) {
    return { ...DEFAULT_SHAPE_SIZE };
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
  return {
    width: Math.max(maxX - minX, 1),
    height: Math.max(maxY - minY, 1),
  };
}

export function shapeLabelFromObject(object: CanvasObject): Pick<
  ShapeObjectFormState,
  'labelText' | 'labelPosition' | 'labelFontSize' | 'labelColor' | 'labelFontWeight'
> {
  const content = asRecord(object.contentJson);
  const positionRaw = asString(content.labelPosition, 'none');
  const labelPosition: ShapeLabelPosition =
    positionRaw === 'inside' || positionRaw === 'above' || positionRaw === 'below'
      ? positionRaw
      : 'none';
  const weightRaw = asString(content.labelFontWeight, 'normal');
  return {
    labelText: asString(content.labelText, ''),
    labelPosition,
    labelFontSize: asNumber(content.labelFontSize, DEFAULT_LABEL.labelFontSize),
    labelColor: asString(content.labelColor, DEFAULT_LABEL.labelColor),
    labelFontWeight: weightRaw === 'bold' ? 'bold' : 'normal',
  };
}

export function shapeFormFromObject(object: CanvasObject): ShapeObjectFormState {
  const style = asRecord(object.styleJson);
  const transform = objectTransform(object);
  const size = shapeSizeFromObject(object);
  return {
    variant: inferShapeVariant(object),
    fill: asString(style.fill, DEFAULT_SHAPE_STYLE.fill),
    stroke: asString(style.stroke, DEFAULT_SHAPE_STYLE.stroke),
    strokeWidth: asNumber(style.strokeWidth, DEFAULT_SHAPE_STYLE.strokeWidth),
    opacity: asNumber(style.opacity, DEFAULT_SHAPE_STYLE.opacity),
    width: size.width,
    height: size.height,
    x: transform.x,
    y: transform.y,
    rotation: transform.rotation,
    ...shapeLabelFromObject(object),
  };
}

function geometryForVariant(
  variant: ShapeVariant,
  width: number,
  height: number,
): { kind: ShapeKind; geometryJson: Record<string, unknown> } {
  const w = Math.max(width, 1);
  const h = Math.max(height, 1);
  if (variant === 'rectangle') {
    return { kind: 'rectangle', geometryJson: { width: w, height: h } };
  }
  if (variant === 'ellipse') {
    return { kind: 'ellipse', geometryJson: { radiusX: w / 2, radiusY: h / 2 } };
  }
  if (variant === 'triangle') {
    return { kind: 'polygon', geometryJson: { points: trianglePoints(w, h) } };
  }
  if (variant === 'diamond') {
    return { kind: 'polygon', geometryJson: { points: diamondPoints(w, h) } };
  }
  return {
    kind: 'polyline',
    geometryJson: { points: linePoints(w), closed: false },
  };
}

export function applyShapeFormToObject(object: CanvasObject, form: ShapeObjectFormState): CanvasObject {
  const { kind, geometryJson } = geometryForVariant(form.variant, form.width, form.height);
  const variantName = form.variant === 'line' ? 'polyline' : form.variant;
  return {
    ...object,
    kind,
    name: object.name ?? variantName,
    transformJson: {
      ...asRecord(object.transformJson),
      x: form.x,
      y: form.y,
      rotation: form.rotation,
    },
    geometryJson,
    styleJson: {
      ...asRecord(object.styleJson),
      fill: form.fill,
      stroke: form.stroke,
      strokeWidth: form.strokeWidth,
      opacity: form.opacity,
    },
    contentJson: {
      ...asRecord(object.contentJson),
      shapeVariant: form.variant,
      labelText: form.labelText,
      labelPosition: form.labelPosition,
      labelFontSize: form.labelFontSize,
      labelColor: form.labelColor,
      labelFontWeight: form.labelFontWeight,
    },
  };
}

export function buildShapeCreateInput(
  sceneId: number,
  layerId: number,
  point: CanvasPoint,
  variant: ShapeVariant,
): Omit<CreateCanvasObjectInput, 'branchId'> {
  const size = variant === 'ellipse'
    ? { width: 140, height: 100 }
    : DEFAULT_SHAPE_SIZE;
  const { kind, geometryJson } = geometryForVariant(variant, size.width, size.height);
  const nameMap: Record<ShapeVariant, string> = {
    rectangle: 'Rectangle',
    ellipse: 'Ellipse',
    triangle: 'Triangle',
    diamond: 'Diamond',
    line: 'Line',
  };
  return {
    sceneId,
    layerId,
    kind,
    name: nameMap[variant],
    zIndex: null,
    transformJson: { x: point.x, y: point.y },
    geometryJson,
    styleJson: { ...DEFAULT_SHAPE_STYLE },
    contentJson: {
      shapeVariant: variant,
      ...DEFAULT_LABEL,
    },
    resourcePath: null,
    linkedNoteId: null,
    linkedSceneId: null,
    isHidden: false,
    isLocked: false,
  };
}
