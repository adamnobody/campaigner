import { describe, expect, it } from 'vitest';
import type { CanvasObject } from '@/api/canvas';
import { buildSmoothedRingPoints, resolveTerritoryStyleFields } from './territoryRender';

const territoryObject = (overrides: Partial<CanvasObject> = {}): CanvasObject => ({
  id: 1,
  sceneId: 10,
  layerId: 2,
  kind: 'territory',
  name: 'North',
  zIndex: 0,
  transformJson: {},
  geometryJson: { rings: [[{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 5, y: 8 }]] },
  styleJson: {},
  contentJson: {},
  resourcePath: null,
  linkedNoteId: null,
  linkedSceneId: null,
  isHidden: false,
  isLocked: false,
  ...overrides,
});

const defaults = {
  fill: '#4ecdc4',
  opacity: 0.25,
  borderColor: '#9ff3df',
  borderWidth: 2,
  smoothing: 0,
};

describe('resolveTerritoryStyleFields', () => {
  it('prefers style_json over content_json mirror', () => {
    const fields = resolveTerritoryStyleFields(territoryObject({
      styleJson: { fill: '#aabbcc', opacity: 0.5, stroke: '#112233', strokeWidth: 3 },
      contentJson: { fill: '#000000', opacity: 0.1, borderColor: '#ffffff', borderWidth: 9, smoothing: 0.8 },
    }), defaults);
    expect(fields).toMatchObject({
      fill: '#aabbcc',
      opacity: 0.5,
      borderColor: '#112233',
      borderWidth: 3,
      smoothing: 0.8,
    });
  });

  it('falls back to content_json when style_json is empty', () => {
    const fields = resolveTerritoryStyleFields(territoryObject({
      contentJson: {
        fill: '#ff0000',
        opacity: 0.7,
        borderColor: '#00ff00',
        borderWidth: 4,
        smoothing: 0.3,
      },
    }), defaults);
    expect(fields).toMatchObject({
      fill: '#ff0000',
      opacity: 0.7,
      borderColor: '#00ff00',
      borderWidth: 4,
      smoothing: 0.3,
    });
  });

  it('clamps smoothing to 0..1', () => {
    expect(resolveTerritoryStyleFields(territoryObject({
      contentJson: { smoothing: 2 },
    }), defaults).smoothing).toBe(1);
    expect(resolveTerritoryStyleFields(territoryObject({
      contentJson: { smoothing: -0.5 },
    }), defaults).smoothing).toBe(0);
  });
});

describe('buildSmoothedRingPoints', () => {
  const triangle = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 5, y: 10 }];

  it('returns original points when smoothing is zero', () => {
    expect(buildSmoothedRingPoints(triangle, 0)).toEqual(triangle);
  });

  it('returns more sample points when smoothing is applied', () => {
    const smoothed = buildSmoothedRingPoints(triangle, 0.5);
    expect(smoothed.length).toBeGreaterThan(triangle.length);
    expect(smoothed[0]).toEqual(expect.objectContaining({ x: expect.any(Number), y: expect.any(Number) }));
  });
});
