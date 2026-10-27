import { describe, expect, it } from 'vitest';
import type { CanvasObject } from '@/api/canvas';
import {
  boundsFromMapBackground,
  buildMapAutoFitKey,
  clampPointToMapBounds,
  clampViewportPersistToMapBounds,
  computeFitToBoundsViewport,
  computeMapSceneFitBounds,
  getCanvasWorldSize,
  getMapSceneWorldBounds,
  isImageBackedMapScene,
  isMapViewportMisaligned,
  isPointInsideMapBounds,
  shouldAutoFitMapBackgroundOnLoad,
  mapSceneNeedsBackground,
  normalizeBackgroundPath,
  resolveMapBackgroundAssetPath,
  shouldUseInfiniteCanvas,
} from './mapBackground';

const scene = (overrides: Partial<{ sceneType: string | null; backgroundPath: string | null }> = {}) => ({
  sceneType: 'map' as string | null,
  backgroundPath: '/uploads/maps/bg.png' as string | null,
  ...overrides,
});

describe('normalizeBackgroundPath', () => {
  it('trims and rejects empty paths', () => {
    expect(normalizeBackgroundPath('  /uploads/a.png  ')).toBe('/uploads/a.png');
    expect(normalizeBackgroundPath('')).toBeNull();
    expect(normalizeBackgroundPath('   ')).toBeNull();
    expect(normalizeBackgroundPath(null)).toBeNull();
  });
});

describe('shouldUseInfiniteCanvas', () => {
  it('returns true only for non-map scenes', () => {
    expect(shouldUseInfiniteCanvas('root_canvas')).toBe(true);
    expect(shouldUseInfiniteCanvas(null)).toBe(true);
    expect(shouldUseInfiniteCanvas('map')).toBe(false);
  });
});

describe('isImageBackedMapScene', () => {
  it('requires map scene type and loaded dimensions', () => {
    expect(isImageBackedMapScene(scene(), { width: 800, height: 600 })).toBe(true);
    expect(isImageBackedMapScene(scene(), null)).toBe(false);
    expect(isImageBackedMapScene(scene({ sceneType: 'root_canvas' }), { width: 800, height: 600 })).toBe(false);
  });
});

describe('getCanvasWorldSize', () => {
  it('uses background dimensions for map and infinite size for root canvas', () => {
    expect(getCanvasWorldSize(scene(), { width: 1200, height: 900 })).toEqual({ width: 1200, height: 900 });
    expect(getCanvasWorldSize(scene({ sceneType: 'root_canvas' }), null).width).toBeGreaterThan(1000);
  });
});

describe('getMapSceneWorldBounds', () => {
  it('anchors map world at image origin', () => {
    expect(getMapSceneWorldBounds({ width: 800, height: 600 })).toEqual(boundsFromMapBackground({ width: 800, height: 600 }));
  });
});

describe('buildMapAutoFitKey', () => {
  it('includes scene id, path, and dimensions', () => {
    expect(buildMapAutoFitKey(7, '/uploads/a.png', { width: 100, height: 50 })).toBe('7:/uploads/a.png:100x50');
    expect(buildMapAutoFitKey(7, null, { width: 100, height: 50 })).toBeNull();
  });
});

describe('computeFitToBoundsViewport', () => {
  it('contain-fits map bounds into container', () => {
    const persist = computeFitToBoundsViewport(1000, 800, boundsFromMapBackground({ width: 2000, height: 1000 }));
    expect(persist.centerX).toBe(1000);
    expect(persist.centerY).toBe(500);
    expect(persist.scale).toBeGreaterThan(0.3);
    expect(persist.scale).toBeLessThan(0.5);
  });
});

describe('isMapViewportMisaligned', () => {
  it('detects root-canvas origin leak on map scenes', () => {
    const bounds = boundsFromMapBackground({ width: 2000, height: 1500 });
    expect(isMapViewportMisaligned({ centerX: 0, centerY: 0, scale: 0.31 }, bounds)).toBe(true);
    expect(isMapViewportMisaligned({ centerX: 1000, centerY: 750, scale: 0.31 }, bounds)).toBe(false);
  });
});

describe('shouldAutoFitMapBackgroundOnLoad', () => {
  it('requests fit when saved viewport is misaligned even if a corner is visible', () => {
    const bounds = boundsFromMapBackground({ width: 2000, height: 1500 });
    expect(
      shouldAutoFitMapBackgroundOnLoad(
        bounds,
        { centerX: 0, centerY: 0, scale: 0.31 },
        1200,
        900,
      ),
    ).toBe(true);
  });
});

describe('clampViewportPersistToMapBounds', () => {
  it('keeps viewport center near map bounds', () => {
    const bounds = boundsFromMapBackground({ width: 800, height: 600 });
    const clamped = clampViewportPersistToMapBounds(
      { centerX: 5000, centerY: 5000, scale: 1 },
      bounds,
      1000,
      800,
    );
    expect(clamped.centerX).toBeLessThan(2000);
    expect(clamped.centerY).toBeLessThan(2000);
    expect(clamped.centerX).toBeGreaterThanOrEqual(400);
    expect(clamped.centerY).toBeGreaterThanOrEqual(300);
  });
});

describe('map point guards', () => {
  const bounds = boundsFromMapBackground({ width: 100, height: 80 });

  it('detects points inside map bounds', () => {
    expect(isPointInsideMapBounds({ x: 10, y: 20 }, bounds)).toBe(true);
    expect(isPointInsideMapBounds({ x: 200, y: 20 }, bounds)).toBe(false);
  });

  it('clamps points to map bounds', () => {
    expect(clampPointToMapBounds({ x: 200, y: -5 }, bounds)).toEqual({ x: 100, y: 0 });
  });
});

describe('resolveMapBackgroundAssetPath', () => {
  it('returns path only for map scenes', () => {
    expect(resolveMapBackgroundAssetPath(scene())).toBe('/uploads/maps/bg.png');
    expect(resolveMapBackgroundAssetPath(scene({ sceneType: 'root_canvas' }))).toBeNull();
    expect(resolveMapBackgroundAssetPath(scene({ backgroundPath: null }))).toBeNull();
  });
});

describe('mapSceneNeedsBackground', () => {
  it('flags map scenes without background', () => {
    expect(mapSceneNeedsBackground(scene())).toBe(false);
    expect(mapSceneNeedsBackground(scene({ backgroundPath: null }))).toBe(true);
    expect(mapSceneNeedsBackground(scene({ sceneType: 'root_canvas', backgroundPath: null }))).toBe(false);
  });
});

describe('computeMapSceneFitBounds', () => {
  const marker: CanvasObject = {
    id: 1,
    sceneId: 1,
    layerId: 1,
    kind: 'marker',
    name: 'M',
    zIndex: 0,
    transformJson: { x: 50, y: 60 },
    geometryJson: {},
    styleJson: {},
    contentJson: {},
    resourcePath: null,
    linkedNoteId: null,
    linkedSceneId: null,
    isHidden: false,
    isLocked: false,
  };

  it('uses background dimensions when there are no objects', () => {
    const bounds = computeMapSceneFitBounds({ width: 800, height: 600 }, []);
    expect(bounds).toEqual(boundsFromMapBackground({ width: 800, height: 600 }));
  });

  it('unions background and object bounds', () => {
    const bounds = computeMapSceneFitBounds({ width: 800, height: 600 }, [marker]);
    expect(bounds).not.toBeNull();
    expect(bounds!.minX).toBeLessThanOrEqual(0);
    expect(bounds!.maxX).toBeGreaterThanOrEqual(50);
  });
});
