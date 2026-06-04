import { describe, expect, it } from 'vitest';
import { appendCompletedTerritoryRing, buildTerritoryRingsForCreateDialog } from './territoryDrawing';

const ring = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 5, y: 8 }];

describe('appendCompletedTerritoryRing', () => {
  it('appends a copy of the current ring', () => {
    const result = appendCompletedTerritoryRing([], ring);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.completedRings).toHaveLength(1);
      expect(result.completedRings[0]).toEqual(ring);
      expect(result.completedRings[0]).not.toBe(ring);
    }
  });

  it('rejects rings with fewer than 3 points', () => {
    expect(appendCompletedTerritoryRing([], [{ x: 0, y: 0 }, { x: 1, y: 0 }]).ok).toBe(false);
  });
});

describe('buildTerritoryRingsForCreateDialog', () => {
  it('merges completed rings and a valid current ring', () => {
    const completed = [[{ x: 1, y: 1 }, { x: 2, y: 1 }, { x: 1, y: 2 }]];
    const result = buildTerritoryRingsForCreateDialog(completed, ring);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.rings).toHaveLength(2);
  });

  it('uses only completed rings when current ring is short', () => {
    const result = buildTerritoryRingsForCreateDialog([ring], [{ x: 0, y: 0 }]);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.rings).toHaveLength(1);
  });

  it('fails when there are no valid rings', () => {
    expect(buildTerritoryRingsForCreateDialog([], [{ x: 0, y: 0 }]).ok).toBe(false);
  });
});
