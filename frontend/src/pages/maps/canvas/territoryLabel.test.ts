import { describe, expect, it } from 'vitest';
import {
  largestRingByArea,
  polygonAreaAbs,
  ringCentroid,
  territoryLabelMetrics,
  territoryLabelPlacement,
} from './territoryLabel';

describe('territoryLabel', () => {
  const smallRing: { x: number; y: number }[] = [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 50, y: 80 },
  ];
  const largeRing: { x: number; y: number }[] = [
    { x: 200, y: 200 },
    { x: 400, y: 200 },
    { x: 300, y: 350 },
  ];

  it('polygonAreaAbs is positive for a triangle', () => {
    expect(polygonAreaAbs(smallRing)).toBeGreaterThan(0);
  });

  it('largestRingByArea picks the ring with greater area', () => {
    expect(largestRingByArea([smallRing, largeRing])).toEqual(largeRing);
  });

  it('ringCentroid averages vertices', () => {
    expect(ringCentroid(smallRing)).toEqual({ x: 50, y: 80 / 3 });
  });

  it('territoryLabelMetrics scales down for long names', () => {
    const short = territoryLabelMetrics(smallRing, 'A', 1);
    const long = territoryLabelMetrics(smallRing, 'Very long territory name here', 1);
    expect(long.fontSize).toBeLessThanOrEqual(short.fontSize);
  });

  it('territoryLabelPlacement returns null without a name', () => {
    expect(territoryLabelPlacement([smallRing], '  ', 1)).toBeNull();
  });

  it('territoryLabelPlacement centers on the largest ring', () => {
    const placement = territoryLabelPlacement([smallRing, largeRing], 'Realm', 1);
    expect(placement).not.toBeNull();
    const centroid = ringCentroid(largeRing)!;
    expect(placement!.x).toBeCloseTo(centroid.x);
    expect(placement!.y).toBeCloseTo(centroid.y);
    expect(placement!.fontSize).toBeGreaterThan(0);
  });
});
