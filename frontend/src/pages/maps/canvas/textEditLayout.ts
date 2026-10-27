import type { CanvasObject } from '@/api/canvas';
import { getCurveTextBezierGeometry } from './curveTextHandles';
import { asNumber, asRecord, asString, objectTransform, type CanvasPoint } from './canvasModel';
import { resolveTextContent } from './textObjectForm';

export type TextEditScreenLayout = {
  left: number;
  top: number;
  fontSizePx: number;
  color: string;
  opacity: number;
  text: string;
  minWidthPx: number;
};

export const textObjectWorldAnchor = (object: CanvasObject): CanvasPoint => {
  const transform = objectTransform(object);
  if (object.kind === 'curve_text') {
    const geometry = getCurveTextBezierGeometry(object);
    return { x: transform.x + geometry.start.x, y: transform.y + geometry.start.y };
  }
  return { x: transform.x, y: transform.y };
};

export const estimateTextEditMinWidthPx = (object: CanvasObject, viewportScale: number): number => {
  const style = asRecord(object.styleJson);
  const fontSize = asNumber(style.fontSize, object.kind === 'curve_text' ? 24 : 28);
  const text = resolveTextContent(object);
  return Math.max(120 * viewportScale, text.length * fontSize * 0.55 * viewportScale, 160 * viewportScale);
};

export const textEditLayoutFromObject = (
  object: CanvasObject,
  viewportScale: number,
): Omit<TextEditScreenLayout, 'left' | 'top'> => {
  const style = asRecord(object.styleJson);
  const fontSize = asNumber(style.fontSize, object.kind === 'curve_text' ? 24 : 28);
  return {
    fontSizePx: fontSize * viewportScale,
    color: asString(style.fill, asString(style.color, '#f8d7a4')),
    opacity: asNumber(style.opacity, 1),
    text: resolveTextContent(object),
    minWidthPx: estimateTextEditMinWidthPx(object, viewportScale),
  };
};
