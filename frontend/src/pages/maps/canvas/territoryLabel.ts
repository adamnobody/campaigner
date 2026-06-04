import { MIN_ZOOM } from './canvasViewport';
import type { CanvasPoint } from './canvasModel';

/** Average glyph width relative to fontSize (Latin + Cyrillic, ~600 weight). */
const TERRITORY_LABEL_AVG_CHAR_EM = 0.52;
const TERRITORY_LABEL_MIN_SCREEN_PX = 11;
const TERRITORY_LABEL_MAX_SVG_PX = 96;

export const polygonAreaAbs = (pts: CanvasPoint[]): number => {
  if (pts.length < 3) return 0;
  let sum = 0;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    sum += pts[j].x * pts[i].y - pts[i].x * pts[j].y;
  }
  return Math.abs(sum / 2);
};

/** Ring with the largest absolute area (for label placement). */
export const largestRingByArea = (rings: CanvasPoint[][]): CanvasPoint[] => {
  if (rings.length === 0) return [];
  return rings.reduce((best, ring) =>
    polygonAreaAbs(ring) > polygonAreaAbs(best) ? ring : best
  );
};

export const ringCentroid = (ring: CanvasPoint[]): { x: number; y: number } | null => {
  if (ring.length === 0) return null;
  const x = ring.reduce((sum, p) => sum + p.x, 0) / ring.length;
  const y = ring.reduce((sum, p) => sum + p.y, 0) / ring.length;
  return { x, y };
};

/**
 * Label font size in world coordinates from ring bbox and viewport zoom.
 * Ported from legacy `mapUtils.territoryLabelMetrics`.
 */
export const territoryLabelMetrics = (
  ring: CanvasPoint[],
  name: string,
  zoomDisplay: number,
): { fontSize: number; strokeWidth: number } => {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of ring) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }
  const bw = Math.max(maxX - minX, 1);
  const bh = Math.max(maxY - minY, 1);
  const padX = Math.max(6, bw * 0.035);
  const padY = Math.max(6, bh * 0.035);
  const innerW = Math.max(bw - 2 * padX, 3);
  const innerH = Math.max(bh - 2 * padY, 3);

  const len = Math.max(name.trim().length, 1);
  const fitByWidth = innerW / (TERRITORY_LABEL_AVG_CHAR_EM * len);
  const fitByHeight = innerH * 0.34;
  let fit = Math.min(fitByWidth, fitByHeight);
  fit = Math.max(5, Math.min(fit, 64));

  const z = Math.max(zoomDisplay, MIN_ZOOM * 0.5);
  const minSvg = TERRITORY_LABEL_MIN_SCREEN_PX / z;

  const fontSize = Math.min(Math.max(fit * 0.9, minSvg), TERRITORY_LABEL_MAX_SVG_PX);
  const strokeWidth = Math.min(6, Math.max(1.5, fontSize * 0.2));
  return { fontSize, strokeWidth };
};

export type TerritoryLabelPlacement = {
  x: number;
  y: number;
  fontSize: number;
  strokeWidth: number;
};

export const territoryLabelPlacement = (
  rings: CanvasPoint[][],
  name: string,
  zoomDisplay: number,
): TerritoryLabelPlacement | null => {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const ring = largestRingByArea(rings);
  if (ring.length < 3) return null;
  const center = ringCentroid(ring);
  if (!center) return null;
  const { fontSize, strokeWidth } = territoryLabelMetrics(ring, trimmed, zoomDisplay);
  return { x: center.x, y: center.y, fontSize, strokeWidth };
};
