import type { CanvasPoint } from './canvasModel';

export const MIN_TERRITORY_DRAW_RING_POINTS = 3;

export const appendCompletedTerritoryRing = (
  completedRings: CanvasPoint[][],
  currentRing: CanvasPoint[],
): { ok: true; completedRings: CanvasPoint[][] } | { ok: false; reason: 'min_points' } => {
  if (currentRing.length < MIN_TERRITORY_DRAW_RING_POINTS) {
    return { ok: false, reason: 'min_points' };
  }
  return {
    ok: true,
    completedRings: [...completedRings, currentRing.map((point) => ({ ...point }))],
  };
};

/** Rings to open create dialog: completed + current ring if it has ≥3 points. */
export const buildTerritoryRingsForCreateDialog = (
  completedRings: CanvasPoint[][],
  currentRing: CanvasPoint[],
): { ok: true; rings: CanvasPoint[][] } | { ok: false; reason: 'no_rings' | 'ring_too_short' } => {
  const rings: CanvasPoint[][] = completedRings.map((ring) => ring.map((point) => ({ ...point })));
  if (currentRing.length >= MIN_TERRITORY_DRAW_RING_POINTS) {
    rings.push(currentRing.map((point) => ({ ...point })));
  }
  if (rings.length === 0) {
    return { ok: false, reason: 'no_rings' };
  }
  if (rings.some((ring) => ring.length < MIN_TERRITORY_DRAW_RING_POINTS)) {
    return { ok: false, reason: 'ring_too_short' };
  }
  return { ok: true, rings };
};
