import type { CanvasObject } from '@/api/canvas';
import type { CanvasScene } from '@/api/canvas';
import {
  computeObjectsBounds,
  type ContentBounds,
} from './canvasBounds';
import type { CanvasPoint } from './canvasModel';
import { isMapScene } from './canvasTools';
import {
  clampZoom,
  isBoundsVisibleInViewport,
  isDefaultPersist,
  isValidPersist,
  type ViewportPersist,
} from './canvasViewport';

export type MapBackgroundSize = {
  width: number;
  height: number;
};

/** World size for root_canvas / legacy free canvas. */
export const INFINITE_CANVAS_WORLD_SIZE = 20000;

export const normalizeBackgroundPath = (path: string | null | undefined): string | null => {
  const trimmed = path?.trim();
  return trimmed ? trimmed : null;
};

export const shouldUseInfiniteCanvas = (sceneType: string | null | undefined): boolean =>
  !isMapScene(sceneType);

export const mapSceneNeedsBackground = (
  scene: Pick<CanvasScene, 'sceneType' | 'backgroundPath'>,
): boolean => isMapScene(scene.sceneType) && !normalizeBackgroundPath(scene.backgroundPath);

export const resolveMapBackgroundAssetPath = (
  scene: Pick<CanvasScene, 'sceneType' | 'backgroundPath'>,
): string | null => {
  if (!isMapScene(scene.sceneType)) return null;
  return normalizeBackgroundPath(scene.backgroundPath);
};

export const isImageBackedMapScene = (
  scene: Pick<CanvasScene, 'sceneType'>,
  backgroundSize: MapBackgroundSize | null,
): boolean => isMapScene(scene.sceneType) && backgroundSize != null;

export const boundsFromMapBackground = (size: MapBackgroundSize): ContentBounds => ({
  minX: 0,
  minY: 0,
  maxX: size.width,
  maxY: size.height,
  width: size.width,
  height: size.height,
  centerX: size.width / 2,
  centerY: size.height / 2,
});

export const getMapSceneWorldBounds = (backgroundSize: MapBackgroundSize): ContentBounds =>
  boundsFromMapBackground(backgroundSize);

export const getCanvasWorldSize = (
  scene: Pick<CanvasScene, 'sceneType'>,
  backgroundSize: MapBackgroundSize | null,
): MapBackgroundSize => {
  if (isImageBackedMapScene(scene, backgroundSize)) {
    return backgroundSize!;
  }
  return {
    width: INFINITE_CANVAS_WORLD_SIZE,
    height: INFINITE_CANVAS_WORLD_SIZE,
  };
};

export const buildMapAutoFitKey = (
  sceneId: number,
  backgroundPath: string | null | undefined,
  backgroundSize: MapBackgroundSize | null,
): string | null => {
  const path = normalizeBackgroundPath(backgroundPath);
  if (!path || !backgroundSize) return null;
  return `${sceneId}:${path}:${backgroundSize.width}x${backgroundSize.height}`;
};

const mergeContentBounds = (a: ContentBounds, b: ContentBounds): ContentBounds => {
  const minX = Math.min(a.minX, b.minX);
  const minY = Math.min(a.minY, b.minY);
  const maxX = Math.max(a.maxX, b.maxX);
  const maxY = Math.max(a.maxY, b.maxY);
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
};

/** Union of map background rect (0,0 – w,h) and visible object bounds for viewport fit. */
export const computeMapSceneFitBounds = (
  backgroundSize: MapBackgroundSize | null,
  objects: CanvasObject[],
): ContentBounds | null => {
  const objectBounds = computeObjectsBounds(objects);
  if (!backgroundSize) return objectBounds;
  const backgroundBounds = boundsFromMapBackground(backgroundSize);
  return objectBounds ? mergeContentBounds(backgroundBounds, objectBounds) : backgroundBounds;
};

/** Contain-fit viewport for finite map bounds (parity with legacy computeFitView). */
export const computeFitToBoundsViewport = (
  containerWidth: number,
  containerHeight: number,
  bounds: ContentBounds,
  paddingRatio = 0.05,
): ViewportPersist => {
  const padding = Math.min(containerWidth, containerHeight) * paddingRatio;
  const availableWidth = Math.max(containerWidth - padding * 2, 1);
  const availableHeight = Math.max(containerHeight - padding * 2, 1);
  const scaleX = availableWidth / Math.max(bounds.width, 1);
  const scaleY = availableHeight / Math.max(bounds.height, 1);
  const scale = clampZoom(Math.min(scaleX, scaleY));
  return {
    centerX: bounds.centerX,
    centerY: bounds.centerY,
    scale,
  };
};

export const clampViewportPersistToMapBounds = (
  persist: ViewportPersist,
  bounds: ContentBounds,
  screenWidth: number,
  screenHeight: number,
  paddingRatio = 0.12,
): ViewportPersist => {
  const padX = bounds.width * paddingRatio;
  const padY = bounds.height * paddingRatio;
  const minX = bounds.minX - padX;
  const minY = bounds.minY - padY;
  const maxX = bounds.maxX + padX;
  const maxY = bounds.maxY + padY;
  const scale = clampZoom(persist.scale);
  const halfW = screenWidth / (2 * scale);
  const halfH = screenHeight / (2 * scale);

  let centerX = persist.centerX;
  let centerY = persist.centerY;

  if (maxX - minX <= halfW * 2) {
    centerX = bounds.centerX;
  } else {
    centerX = Math.max(minX + halfW, Math.min(maxX - halfW, centerX));
  }

  if (maxY - minY <= halfH * 2) {
    centerY = bounds.centerY;
  } else {
    centerY = Math.max(minY + halfH, Math.min(maxY - halfH, centerY));
  }

  return { centerX, centerY, scale };
};

export const isPointInsideMapBounds = (
  point: CanvasPoint,
  bounds: ContentBounds,
): boolean =>
  point.x >= bounds.minX
  && point.x <= bounds.maxX
  && point.y >= bounds.minY
  && point.y <= bounds.maxY;

export const clampPointToMapBounds = (point: CanvasPoint, bounds: ContentBounds): CanvasPoint => ({
  x: Math.max(bounds.minX, Math.min(bounds.maxX, point.x)),
  y: Math.max(bounds.minY, Math.min(bounds.maxY, point.y)),
});

/** True when persisted camera center is far from map center (e.g. root_canvas 0,0 leak). */
export const isMapViewportMisaligned = (
  persist: ViewportPersist,
  bounds: ContentBounds,
  toleranceRatio = 0.2,
): boolean => {
  const dx = Math.abs(persist.centerX - bounds.centerX);
  const dy = Math.abs(persist.centerY - bounds.centerY);
  const tolX = Math.max(bounds.width * toleranceRatio, 32);
  const tolY = Math.max(bounds.height * toleranceRatio, 32);
  return dx > tolX || dy > tolY;
};

export const shouldAutoFitMapBackgroundOnLoad = (
  bounds: ContentBounds | null,
  persist: ViewportPersist,
  screenWidth: number,
  screenHeight: number,
): boolean => {
  if (!bounds) return false;
  if (!isValidPersist(persist)) return true;
  if (isDefaultPersist(persist)) return true;
  if (isMapViewportMisaligned(persist, bounds)) return true;
  return !isBoundsVisibleInViewport(bounds, persist, screenWidth, screenHeight);
};
