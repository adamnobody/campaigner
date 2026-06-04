import { projectPointOnSegment } from '@/utils/mapGeometry';
import type { CanvasPoint } from './canvasModel';

export const MIN_TERRITORY_RING_VERTICES = 3;

export type TerritoryVertexHit = {
  ringIndex: number;
  pointIndex: number;
};

export type TerritoryEdgeHit = {
  ringIndex: number;
  edgeIndex: number;
  projection: CanvasPoint;
};

const worldDistancePx = (a: CanvasPoint, b: CanvasPoint, scale: number): number =>
  Math.hypot(b.x - a.x, b.y - a.y) * scale;

export const hitTerritoryVertex = (
  point: CanvasPoint,
  rings: CanvasPoint[][],
  hitRadiusPx: number,
  scale: number,
): TerritoryVertexHit | null => {
  let best: TerritoryVertexHit | null = null;
  let bestDist = hitRadiusPx;
  rings.forEach((ring, ringIndex) => {
    ring.forEach((vertex, pointIndex) => {
      const dist = worldDistancePx(point, vertex, scale);
      if (dist <= bestDist) {
        bestDist = dist;
        best = { ringIndex, pointIndex };
      }
    });
  });
  return best;
};

export const findNearestTerritoryEdge = (
  point: CanvasPoint,
  rings: CanvasPoint[][],
  maxEdgePx: number,
  minVertexPx: number,
  scale: number,
): TerritoryEdgeHit | null => {
  if (hitTerritoryVertex(point, rings, minVertexPx, scale)) return null;

  let best: TerritoryEdgeHit | null = null;
  let bestDist = maxEdgePx;

  rings.forEach((ring, ringIndex) => {
    const count = ring.length;
    if (count < 2) return;
    for (let edgeIndex = 0; edgeIndex < count; edgeIndex += 1) {
      const a = ring[edgeIndex];
      const b = ring[(edgeIndex + 1) % count];
      const { projX, projY, dist } = projectPointOnSegment(point.x, point.y, a.x, a.y, b.x, b.y);
      const distPx = dist * scale;
      if (distPx < bestDist) {
        bestDist = distPx;
        best = {
          ringIndex,
          edgeIndex,
          projection: { x: projX, y: projY },
        };
      }
    }
  });

  return best;
};

export const moveTerritoryVertex = (
  rings: CanvasPoint[][],
  ringIndex: number,
  pointIndex: number,
  point: CanvasPoint,
): CanvasPoint[][] =>
  rings.map((ring, ri) =>
    (ri === ringIndex
      ? ring.map((vertex, pi) => (pi === pointIndex ? point : vertex))
      : ring),
  );

export const deleteTerritoryVertex = (
  rings: CanvasPoint[][],
  ringIndex: number,
  pointIndex: number,
): { rings: CanvasPoint[][]; ok: boolean } => {
  const ring = rings[ringIndex];
  if (!ring || ring.length <= MIN_TERRITORY_RING_VERTICES) {
    return { rings, ok: false };
  }
  return {
    rings: rings.map((item, ri) =>
      (ri === ringIndex ? item.filter((_, pi) => pi !== pointIndex) : item)),
    ok: true,
  };
};

export const insertTerritoryVertexOnEdge = (
  rings: CanvasPoint[][],
  ringIndex: number,
  edgeIndex: number,
  point: CanvasPoint,
): CanvasPoint[][] =>
  rings.map((ring, ri) => {
    if (ri !== ringIndex) return ring;
    const next = [...ring];
    next.splice(edgeIndex + 1, 0, point);
    return next;
  });

export const appendMidpointOnTerritoryEdge = (
  rings: CanvasPoint[][],
  ringIndex: number,
  edgeIndex: number,
): CanvasPoint[][] => {
  const ring = rings[ringIndex];
  if (!ring || ring.length < 2) return rings;
  const a = ring[edgeIndex];
  const b = ring[(edgeIndex + 1) % ring.length];
  const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  return insertTerritoryVertexOnEdge(rings, ringIndex, edgeIndex, mid);
};
