import type { CanvasObject } from '@/api/canvas';
import type { CanvasScene } from '@/api/canvas';
import {
  computeObjectsBounds,
  type ContentBounds,
} from './canvasBounds';
import {
  isBoundsVisibleInViewport,
  isDefaultPersist,
  isValidPersist,
  type ViewportPersist,
} from './canvasViewport';
import { isMapScene } from './canvasTools';

export type MapBackgroundSize = {
  width: number;
  height: number;
};

export const normalizeBackgroundPath = (path: string | null | undefined): string | null => {
  const trimmed = path?.trim();
  return trimmed ? trimmed : null;
};

export const mapSceneNeedsBackground = (
  scene: Pick<CanvasScene, 'sceneType' | 'backgroundPath'>,
): boolean => isMapScene(scene.sceneType) && !normalizeBackgroundPath(scene.backgroundPath);

export const resolveMapBackgroundAssetPath = (
  scene: Pick<CanvasScene, 'sceneType' | 'backgroundPath'>,
): string | null => {
  if (!isMapScene(scene.sceneType)) return null;
  return normalizeBackgroundPath(scene.backgroundPath);
};

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

export const shouldAutoFitMapBackgroundOnLoad = (
  bounds: ContentBounds | null,
  persist: ViewportPersist,
  screenWidth: number,
  screenHeight: number,
): boolean => {
  if (!bounds) return false;
  if (!isValidPersist(persist)) return true;
  if (isDefaultPersist(persist)) return true;
  return !isBoundsVisibleInViewport(bounds, persist, screenWidth, screenHeight);
};
