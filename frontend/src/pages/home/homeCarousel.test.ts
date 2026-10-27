import { describe, expect, it } from 'vitest';
import { getProjectCarouselIndices } from './homeCarousel';

describe('getProjectCarouselIndices', () => {
  it('handles empty and short libraries without duplicate wings', () => {
    expect(getProjectCarouselIndices(0, 0)).toEqual({ center: null, left: null, right: null });
    expect(getProjectCarouselIndices(1, 4)).toEqual({ center: 0, left: null, right: null });
    expect(getProjectCarouselIndices(2, 0)).toEqual({ center: 0, left: 1, right: null });
  });

  it('wraps both wings around the active project', () => {
    expect(getProjectCarouselIndices(5, 0)).toEqual({ center: 0, left: 4, right: 1 });
    expect(getProjectCarouselIndices(5, -1)).toEqual({ center: 4, left: 3, right: 0 });
  });
});
