import { describe, expect, it } from 'vitest';
import type { CanvasObject } from '@/api/canvas';
import {
  boundsFromMapBackground,
  computeMapSceneFitBounds,
  mapSceneNeedsBackground,
  normalizeBackgroundPath,
  resolveMapBackgroundAssetPath,
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
