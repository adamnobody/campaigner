/**
 * Геометрия для карты: проекция на отрезок, расстояния в экранных px при scale(zoom).
 */

export type PointPercent = { x: number; y: number };

/** Превью вставки вершины на ребро в режиме редактирования формы территории. */
export type EdgeInsertPhantom = {
  ringIndex: number;
  edgeIndex: number;
  projection: PointPercent;
};

function screenDistanceBetweenPercentPointsInPx(
  a: PointPercent,
  b: PointPercent,
  imgWidth: number,
  imgHeight: number,
  zoom: number,
): number {
  const sx0 = (a.x / 100) * imgWidth;
  const sy0 = (a.y / 100) * imgHeight;
  const sx1 = (b.x / 100) * imgWidth;
  const sy1 = (b.y / 100) * imgHeight;
  return Math.hypot(sx1 - sx0, sy1 - sy0) * zoom;
}

/**
 * Проекция точки P на отрезок AB. Координаты в одной линейной системе (например SVG user units).
 */
export function projectPointOnSegment(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
): { projX: number; projY: number; t: number; dist: number } {
  const vx = bx - ax;
  const vy = by - ay;
  const wx = px - ax;
  const wy = py - ay;
  const vv = vx * vx + vy * vy;
  const t = vv < 1e-18 ? 0 : Math.max(0, Math.min(1, (wx * vx + wy * vy) / vv));
  const projX = ax + t * vx;
  const projY = ay + t * vy;
  const dist = Math.hypot(px - projX, py - projY);
  return { projX, projY, t, dist };
}

function percentToSvg(p: PointPercent, imgW: number, imgH: number): { x: number; y: number } {
  return { x: (p.x / 100) * imgW, y: (p.y / 100) * imgH };
}

/** Минимальное расстояние в экранных px от точки (в процентах) до любой вершины любого кольца. */
export function minDistanceToVerticesPx(
  pointPercent: PointPercent,
  rings: PointPercent[][],
  imgW: number,
  imgH: number,
  zoom: number,
): number {
  let min = Infinity;
  for (const ring of rings) {
    for (const v of ring) {
      const d = screenDistanceBetweenPercentPointsInPx(pointPercent, v, imgW, imgH, zoom);
      if (d < min) min = d;
    }
  }
  return min;
}

export type NearestEdgeHit = {
  ringIndex: number;
  edgeIndex: number;
  projection: PointPercent;
  distancePx: number;
};

/**
 * Ближайшее ребро полигона (все кольца), если расстояние до отрезка в px < maxEdgePx
 * и до любой вершины >= minVertexPx.
 */
export function findNearestEditableEdge(
  pointPercent: PointPercent,
  rings: PointPercent[][],
  maxEdgePx: number,
  minVertexPx: number,
  imgW: number,
  imgH: number,
  zoom: number,
): NearestEdgeHit | null {
  if (imgW <= 0 || imgH <= 0) return null;

  if (minDistanceToVerticesPx(pointPercent, rings, imgW, imgH, zoom) < minVertexPx) {
    return null;
  }

  const px = (pointPercent.x / 100) * imgW;
  const py = (pointPercent.y / 100) * imgH;

  let best: NearestEdgeHit | null = null;
  let bestDist = maxEdgePx;

  rings.forEach((ring, ringIndex) => {
    const n = ring.length;
    if (n < 2) return;
    for (let edgeIndex = 0; edgeIndex < n; edgeIndex += 1) {
      const a = percentToSvg(ring[edgeIndex], imgW, imgH);
      const b = percentToSvg(ring[(edgeIndex + 1) % n], imgW, imgH);
      const { projX, projY, dist } = projectPointOnSegment(px, py, a.x, a.y, b.x, b.y);
      const distPx = dist * zoom;
      if (distPx < bestDist) {
        bestDist = distPx;
        best = {
          ringIndex,
          edgeIndex,
          projection: { x: (projX / imgW) * 100, y: (projY / imgH) * 100 },
          distancePx: distPx,
        };
      }
    }
  });

  return best;
}
