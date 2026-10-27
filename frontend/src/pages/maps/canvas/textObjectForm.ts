import type { CanvasObject } from '@/api/canvas';
import { asNumber, asPoints, asRecord, asString, objectTransform } from './canvasModel';
import type { MapTextStylePreset } from './textPresets';

export type TextObjectFormState = {
  text: string;
  fontSize: number;
  fill: string;
  opacity: number;
  x: number;
  y: number;
  rotation: number;
};

export type CurveTextGeometryFormState = {
  startX: number;
  startY: number;
  controlX: number;
  controlY: number;
  endX: number;
  endY: number;
  hasExplicitPointPath: boolean;
};

export const resolveTextContent = (object: CanvasObject): string => {
  const content = asRecord(object.contentJson);
  const fromText = asString(content.text, '');
  if (fromText) return fromText;
  const fromLabel = asString(content.label, '');
  if (fromLabel) return fromLabel;
  return asString(object.name, object.kind === 'curve_text' ? 'Curve text' : 'Text');
};

export const textFormFromObject = (object: CanvasObject): TextObjectFormState => {
  const style = asRecord(object.styleJson);
  const transform = objectTransform(object);
  return {
    text: resolveTextContent(object),
    fontSize: asNumber(style.fontSize, object.kind === 'curve_text' ? 24 : 28),
    fill: asString(style.fill, asString(style.color, '#f8d7a4')),
    opacity: asNumber(style.opacity, 1),
    x: transform.x,
    y: transform.y,
    rotation: transform.rotation,
  };
};

export const curveTextGeometryFromObject = (object: CanvasObject): CurveTextGeometryFormState => {
  const geometry = asRecord(object.geometryJson);
  const points = asPoints(geometry.points);
  const start = asRecord(geometry.start);
  const control = asRecord(geometry.control);
  const end = asRecord(geometry.end);
  return {
    startX: asNumber(start.x),
    startY: asNumber(start.y),
    controlX: asNumber(control.x, 140),
    controlY: asNumber(control.y, -80),
    endX: asNumber(end.x, 280),
    endY: asNumber(end.y),
    hasExplicitPointPath: points.length >= 2,
  };
};

export const applyTextContentToObject = (object: CanvasObject, text: string): CanvasObject => {
  const trimmedLine = text.trim().split('\n')[0]?.trim() ?? '';
  const fallbackName = object.kind === 'curve_text' ? 'Curve text' : 'Text';
  const name = trimmedLine.slice(0, 80) || fallbackName;
  return {
    ...object,
    name,
    contentJson: {
      ...asRecord(object.contentJson),
      text,
    },
  };
};

export const applyTextStylePreset = (
  object: CanvasObject,
  preset: Pick<MapTextStylePreset, 'fontSize' | 'fill' | 'opacity'>,
): CanvasObject => ({
  ...object,
  styleJson: {
    ...asRecord(object.styleJson),
    fill: preset.fill,
    fontSize: preset.fontSize,
    opacity: preset.opacity,
  },
});

export const convertTextToCurveText = (object: CanvasObject): CanvasObject => {
  if (object.kind !== 'text') return object;
  const form = textFormFromObject(object);
  return applyTextFormToObject(
    {
      ...object,
      kind: 'curve_text',
      geometryJson: {
        start: { x: 0, y: 0 },
        control: { x: 140, y: -80 },
        end: { x: 280, y: 0 },
      },
    },
    form,
    curveTextGeometryFromObject({
      ...object,
      kind: 'curve_text',
      geometryJson: {
        start: { x: 0, y: 0 },
        control: { x: 140, y: -80 },
        end: { x: 280, y: 0 },
      },
    }),
  );
};

export const applyTextFormToObject = (
  object: CanvasObject,
  form: TextObjectFormState,
  curveGeometry?: CurveTextGeometryFormState | null,
): CanvasObject => {
  const trimmedLine = form.text.trim().split('\n')[0]?.trim() ?? '';
  const fallbackName = object.kind === 'curve_text' ? 'Curve text' : 'Text';
  const name = trimmedLine.slice(0, 80) || fallbackName;

  let geometryJson = object.geometryJson;
  if (object.kind === 'curve_text' && curveGeometry && !curveGeometry.hasExplicitPointPath) {
    geometryJson = {
      ...asRecord(object.geometryJson),
      start: { x: curveGeometry.startX, y: curveGeometry.startY },
      control: { x: curveGeometry.controlX, y: curveGeometry.controlY },
      end: { x: curveGeometry.endX, y: curveGeometry.endY },
    };
  }

  return {
    ...object,
    name,
    transformJson: {
      ...asRecord(object.transformJson),
      x: form.x,
      y: form.y,
      rotation: form.rotation,
    },
    contentJson: {
      ...asRecord(object.contentJson),
      text: form.text,
    },
    styleJson: {
      ...asRecord(object.styleJson),
      fill: form.fill,
      fontSize: form.fontSize,
      opacity: form.opacity,
    },
    geometryJson,
  };
};
