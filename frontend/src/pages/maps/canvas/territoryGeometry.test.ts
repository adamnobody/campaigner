import { describe, expect, it } from 'vitest';
import type { CanvasPoint } from './canvasModel';
import {
  deleteTerritoryVertex,
  findNearestTerritoryEdge,
  hitTerritoryVertex,
  insertTerritoryVertexOnEdge,
  moveTerritoryVertex,
} from './territoryGeometry';

const square: CanvasPoint[][] = [[
  { x: 0, y: 0 },
  { x: 100, y: 0 },
  { x: 100, y: 100 },
  { x: 0, y: 100 },
]];

describe('hitTerritoryVertex', () => {
  it('finds a vertex within hit radius', () => {
    expect(hitTerritoryVertex({ x: 2, y: 1 }, square, 12, 1)).toEqual({ ringIndex: 0, pointIndex: 0 });
  });
});

describe('findNearestTerritoryEdge', () => {
  it('returns projection on the nearest edge', () => {
    const hit = findNearestTerritoryEdge({ x: 50, y: 2 }, square, 16, 10, 1);
    expect(hit?.ringIndex).toBe(0);
    expect(hit?.edgeIndex).toBe(0);
    expect(hit?.projection).toEqual({ x: 50, y: 0 });
  });
});

describe('ring mutations', () => {
  it('moves, inserts, and deletes vertices', () => {
    const moved = moveTerritoryVertex(square, 0, 0, { x: 5, y: 5 });
    expect(moved[0][0]).toEqual({ x: 5, y: 5 });

    const inserted = insertTerritoryVertexOnEdge(square, 0, 0, { x: 50, y: 0 });
    expect(inserted[0]).toHaveLength(5);

    const { rings: reduced, ok } = deleteTerritoryVertex(square, 0, 0);
    expect(ok).toBe(true);
    expect(reduced[0]).toHaveLength(3);

    const blocked = deleteTerritoryVertex([[{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }]], 0, 0);
    expect(blocked.ok).toBe(false);
  });
});
