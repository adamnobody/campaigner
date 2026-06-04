import { describe, expect, it } from 'vitest';
import { geometryRingsFromJson } from './canvasModel';

describe('geometryRingsFromJson', () => {
  it('returns all rings when geometry has rings[]', () => {
    const rings = geometryRingsFromJson({
      rings: [
        [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 5, y: 8 }],
        [{ x: 20, y: 20 }, { x: 30, y: 20 }, { x: 25, y: 28 }],
      ],
    });
    expect(rings).toHaveLength(2);
    expect(rings[0]).toHaveLength(3);
    expect(rings[1][0]).toEqual({ x: 20, y: 20 });
  });

  it('falls back to legacy points as a single ring', () => {
    const rings = geometryRingsFromJson({
      points: [{ x: 1, y: 2 }, { x: 3, y: 4 }, { x: 0, y: 5 }],
    });
    expect(rings).toHaveLength(1);
    expect(rings[0]).toHaveLength(3);
  });

  it('skips empty rings', () => {
    const rings = geometryRingsFromJson({
      rings: [[], [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }]],
    });
    expect(rings).toHaveLength(1);
  });
});
