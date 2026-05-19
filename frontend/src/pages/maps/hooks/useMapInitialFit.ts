import { useLayoutEffect, useRef, type MutableRefObject, type RefObject } from 'react';

type Params = {
  containerRef: RefObject<HTMLDivElement | null>;
  mapImageReady: boolean;
  mapWidth: number | null;
  mapHeight: number | null;
  mapId: number | null | undefined;
  loading: boolean;
  transitioning: boolean;
  fitToScreen: (mapWidth: number, mapHeight: number, viewportWidth: number, viewportHeight: number) => void;
  hasUserView: () => boolean;
  forceFitRef: MutableRefObject<boolean>;
  onMapIdChange: () => void;
};

/**
 * Initial fit-to-screen once map image dimensions and container size are known.
 * ResizeObserver is used only until the container gets non-zero size; no refit on window resize.
 */
export function useMapInitialFit({
  containerRef,
  mapImageReady,
  mapWidth,
  mapHeight,
  mapId,
  loading,
  transitioning,
  fitToScreen,
  hasUserView,
  forceFitRef,
  onMapIdChange,
}: Params) {
  const initialFitDoneForMapRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    onMapIdChange();
    initialFitDoneForMapRef.current = null;
  }, [mapId, onMapIdChange]);

  useLayoutEffect(() => {
    if (loading || transitioning || !mapImageReady) return;

    if (mapWidth == null || mapHeight == null) return;

    if (mapWidth <= 0 || mapHeight <= 0) {
      console.warn('[map] Cannot fit view: invalid map dimensions', { mapWidth, mapHeight });
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    const shouldFit = () => {
      if (forceFitRef.current) return true;
      if (hasUserView()) return false;
      if (mapId != null && initialFitDoneForMapRef.current === mapId) return false;
      return true;
    };

    const runFit = (): boolean => {
      if (!shouldFit()) return true;

      const { width, height } = container.getBoundingClientRect();
      if (width <= 0 || height <= 0) return false;

      fitToScreen(mapWidth, mapHeight, width, height);
      forceFitRef.current = false;
      if (mapId != null) initialFitDoneForMapRef.current = mapId;
      return true;
    };

    if (runFit()) return;

    const observer = new ResizeObserver(() => {
      if (runFit()) observer.disconnect();
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [
    loading,
    transitioning,
    mapImageReady,
    mapWidth,
    mapHeight,
    mapId,
    containerRef,
    fitToScreen,
    hasUserView,
    forceFitRef,
  ]);
}
