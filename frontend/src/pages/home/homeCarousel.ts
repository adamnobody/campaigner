export type ProjectCarouselIndices = {
  center: number | null;
  left: number | null;
  right: number | null;
};

export function getProjectCarouselIndices(
  count: number,
  requestedIndex: number,
): ProjectCarouselIndices {
  if (count <= 0) return { center: null, left: null, right: null };
  const center = ((requestedIndex % count) + count) % count;
  if (count === 1) return { center, left: null, right: null };
  if (count === 2) return { center, left: center === 0 ? 1 : 0, right: null };
  return {
    center,
    left: (center - 1 + count) % count,
    right: (center + 1) % count,
  };
}
