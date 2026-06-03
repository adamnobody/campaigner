import { Point } from 'pixi.js';
import type { Viewport } from 'pixi-viewport';
import type { ContentBounds } from './canvasBounds';
import { asNumber, asRecord } from './canvasModel';

/** World center visible on screen + zoom — resolution-independent persist format. */
export type ViewportPersist = {
  centerX: number;
  centerY: number;
  scale: number;
};

/** Screen-space camera state derived from a viewport instance or persist record. */
export type ViewportSnapshot = ViewportPersist & {
  x: number;
  y: number;
};

export const MIN_ZOOM = 0.08;
export const MAX_ZOOM = 3.5;
export const FIT_PADDING = 0.12;

export const clampZoom = (scale: number): number =>
  Number.isFinite(scale) ? Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, scale)) : 1;

export const isDefaultPersist = (persist: ViewportPersist): boolean =>
  Math.abs(persist.centerX) < 1 &&
  Math.abs(persist.centerY) < 1 &&
  Math.abs(persist.scale - 1) < 0.01;

export const isValidPersist = (persist: ViewportPersist): boolean =>
  Number.isFinite(persist.centerX) &&
  Number.isFinite(persist.centerY) &&
  Number.isFinite(persist.scale) &&
  persist.scale >= MIN_ZOOM &&
  persist.scale <= MAX_ZOOM;

export const screenOffsetFromPersist = (
  persist: ViewportPersist,
  screenWidth: number,
  screenHeight: number,
): { x: number; y: number; scale: number } => {
  const scale = clampZoom(persist.scale);
  return {
    x: screenWidth / 2 - persist.centerX * scale,
    y: screenHeight / 2 - persist.centerY * scale,
    scale,
  };
};

export const persistFromViewport = (viewport: Viewport): ViewportPersist => {
  const scale = clampZoom(viewport.scale.x);
  const center = viewport.toWorld(new Point(viewport.screenWidth / 2, viewport.screenHeight / 2));
  return {
    centerX: center.x,
    centerY: center.y,
    scale,
  };
};

export const snapshotFromViewport = (viewport: Viewport): ViewportSnapshot => {
  const persist = persistFromViewport(viewport);
  const screen = screenOffsetFromPersist(persist, viewport.screenWidth, viewport.screenHeight);
  return { ...persist, ...screen };
};

export const parseStoredViewport = (
  json: unknown,
  screenWidth: number,
  screenHeight: number,
): ViewportPersist => {
  const record = asRecord(json);
  const scale = clampZoom(asNumber(record.scale, 1));

  const centerX = asNumber(record.centerX, Number.NaN);
  const centerY = asNumber(record.centerY, Number.NaN);
  if (Number.isFinite(centerX) && Number.isFinite(centerY)) {
    return { centerX, centerY, scale };
  }

  const x = asNumber(record.x, Number.NaN);
  const y = asNumber(record.y, Number.NaN);
  if (Number.isFinite(x) && Number.isFinite(y) && scale > 0) {
    return {
      centerX: (screenWidth / 2 - x) / scale,
      centerY: (screenHeight / 2 - y) / scale,
      scale,
    };
  }

  return { centerX: 0, centerY: 0, scale: 1 };
};

export const applyPersistToViewport = (
  viewport: Viewport,
  persist: ViewportPersist,
): ViewportSnapshot => {
  const screen = screenOffsetFromPersist(persist, viewport.screenWidth, viewport.screenHeight);
  viewport.position.set(screen.x, screen.y);
  viewport.setZoom(screen.scale, true);
  return { ...persist, x: viewport.x, y: viewport.y, scale: viewport.scale.x };
};

export const isBoundsVisibleInViewport = (
  bounds: ContentBounds,
  persist: ViewportPersist,
  screenWidth: number,
  screenHeight: number,
  padding = 8,
): boolean => {
  if (!isValidPersist(persist)) return false;
  const screen = screenOffsetFromPersist(persist, screenWidth, screenHeight);
  const screenMinX = screen.x + bounds.minX * screen.scale;
  const screenMinY = screen.y + bounds.minY * screen.scale;
  const screenMaxX = screen.x + bounds.maxX * screen.scale;
  const screenMaxY = screen.y + bounds.maxY * screen.scale;
  return (
    screenMaxX >= padding &&
    screenMinX <= screenWidth - padding &&
    screenMaxY >= padding &&
    screenMinY <= screenHeight - padding
  );
};

export const shouldAutoFitOnLoad = (
  objectCount: number,
  bounds: ContentBounds | null,
  persist: ViewportPersist,
  screenWidth: number,
  screenHeight: number,
): boolean => {
  if (objectCount === 0 || !bounds) return false;
  if (!isValidPersist(persist)) return true;
  if (isDefaultPersist(persist)) return true;
  return !isBoundsVisibleInViewport(bounds, persist, screenWidth, screenHeight);
};

export const fitViewportToBounds = (
  viewport: Viewport,
  bounds: ContentBounds,
  padding = FIT_PADDING,
): ViewportSnapshot => {
  const screenWidth = viewport.screenWidth;
  const screenHeight = viewport.screenHeight;
  const paddedWidth = Math.max(bounds.width * (1 + padding * 2), 1);
  const paddedHeight = Math.max(bounds.height * (1 + padding * 2), 1);
  const scale = clampZoom(Math.min(screenWidth / paddedWidth, screenHeight / paddedHeight));
  const persist: ViewportPersist = {
    centerX: bounds.centerX,
    centerY: bounds.centerY,
    scale,
  };
  return applyPersistToViewport(viewport, persist);
};
