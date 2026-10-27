import type { Graphics } from 'pixi.js';
import type { CanvasPoint } from './canvasModel';
import { asNumber, asRecord, asString } from './canvasModel';
import type { CanvasObject } from '@/api/canvas';

export type TerritoryStyleFields = {
  fill: string;
  opacity: number;
  borderColor: string;
  borderWidth: number;
  smoothing: number;
};

/** Reads territory visual fields from style_json with content_json mirror fallback. */
export const resolveTerritoryStyleFields = (
  object: CanvasObject,
  defaults: TerritoryStyleFields,
): TerritoryStyleFields => {
  const style = asRecord(object.styleJson);
  const content = asRecord(object.contentJson);
  return {
    fill: asString(style.fill, asString(content.fill, defaults.fill)),
    opacity: asNumber(style.opacity, asNumber(content.opacity, defaults.opacity)),
    borderColor: asString(style.stroke, asString(content.borderColor, defaults.borderColor)),
    borderWidth: asNumber(style.strokeWidth, asNumber(content.borderWidth, defaults.borderWidth)),
    smoothing: Math.min(1, Math.max(0, asNumber(content.smoothing, asNumber(style.smoothing, defaults.smoothing)))),
  };
};

/**
 * Quadratic-corner smoothing (parity with MapTerritoryDialog SVG preview).
 * Returns closed polygon sample points for hit tests when smoothing > 0.
 */
export const buildSmoothedRingPoints = (
  points: CanvasPoint[],
  smoothing: number,
): CanvasPoint[] => {
  if (smoothing <= 0 || points.length < 3) return points;

  const n = points.length;
  const samples: CanvasPoint[] = [];

  for (let i = 0; i < n; i += 1) {
    const prev = points[(i - 1 + n) % n]!;
    const curr = points[i]!;
    const next = points[(i + 1) % n]!;
    const sx1 = curr.x + (prev.x - curr.x) * smoothing * 0.5;
    const sy1 = curr.y + (prev.y - curr.y) * smoothing * 0.5;
    const ex = curr.x + (next.x - curr.x) * smoothing * 0.5;
    const ey = curr.y + (next.y - curr.y) * smoothing * 0.5;

    if (i === 0) {
      samples.push({ x: ex, y: ey });
    } else {
      samples.push({ x: sx1, y: sy1 });
      samples.push({ x: curr.x, y: curr.y });
      samples.push({ x: ex, y: ey });
    }
  }

  const first = points[0]!;
  const last = points[n - 1]!;
  const second = points[1]!;
  samples.push({
    x: first.x + (last.x - first.x) * smoothing * 0.5,
    y: first.y + (last.y - first.y) * smoothing * 0.5,
  });
  samples.push({ x: first.x, y: first.y });
  samples.push({
    x: first.x + (second.x - first.x) * smoothing * 0.5,
    y: first.y + (second.y - first.y) * smoothing * 0.5,
  });

  return samples;
};

export const traceSmoothedClosedRing = (
  graphics: Graphics,
  points: CanvasPoint[],
  smoothing: number,
): void => {
  if (smoothing <= 0 || points.length < 3) {
    const flat = points.flatMap((point) => [point.x, point.y]);
    graphics.poly(flat);
    return;
  }

  const n = points.length;
  let started = false;

  for (let i = 0; i < n; i += 1) {
    const prev = points[(i - 1 + n) % n]!;
    const curr = points[i]!;
    const next = points[(i + 1) % n]!;
    const sx1 = curr.x + (prev.x - curr.x) * smoothing * 0.5;
    const sy1 = curr.y + (prev.y - curr.y) * smoothing * 0.5;
    const ex = curr.x + (next.x - curr.x) * smoothing * 0.5;
    const ey = curr.y + (next.y - curr.y) * smoothing * 0.5;

    if (!started) {
      graphics.moveTo(ex, ey);
      started = true;
    } else {
      graphics.lineTo(sx1, sy1);
      graphics.quadraticCurveTo(curr.x, curr.y, ex, ey);
    }
  }

  const first = points[0]!;
  const last = points[n - 1]!;
  const second = points[1]!;
  graphics.lineTo(
    first.x + (last.x - first.x) * smoothing * 0.5,
    first.y + (last.y - first.y) * smoothing * 0.5,
  );
  graphics.quadraticCurveTo(
    first.x,
    first.y,
    first.x + (second.x - first.x) * smoothing * 0.5,
    first.y + (second.y - first.y) * smoothing * 0.5,
  );
  graphics.closePath();
};
