import { useRef, useState, useCallback, useEffect, type RefObject } from 'react';
import { MIN_ZOOM, MAX_ZOOM, ZOOM_SPEED } from './mapUtils';

type Params = {
  containerRef: RefObject<HTMLDivElement | null>;
  transformRef: RefObject<HTMLDivElement | null>;
  /** Пока false — не вешаем wheel (нет контейнера / начальная загрузка). */
  wheelEnabled: boolean;
};

/**
 * Зум и пан карты: refs для transform, колесо мыши, кнопки +/- / сброс.
 */
export function useMapViewport({ containerRef, transformRef, wheelEnabled }: Params) {
  const [zoomDisplay, setZoomDisplay] = useState(1);
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const panOriginRef = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(1);
  const panRef = useRef({ x: 0, y: 0 });

  const applyTransform = useCallback(() => {
    const el = transformRef.current;
    if (el) {
      el.style.transform =
        `translate(${panRef.current.x}px, ${panRef.current.y}px) scale(${zoomRef.current})`;
    }
  }, [transformRef]);

  useEffect(() => {
    if (!wheelEnabled) return;
    const container = containerRef.current;
    if (!container) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const oldZoom = zoomRef.current;
      const delta = e.deltaY > 0 ? -ZOOM_SPEED : ZOOM_SPEED;
      const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, oldZoom + delta));
      if (newZoom === oldZoom) return;

      const rect = container.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;

      panRef.current = {
        x: cx - ((cx - panRef.current.x) / oldZoom) * newZoom,
        y: cy - ((cy - panRef.current.y) / oldZoom) * newZoom,
      };
      zoomRef.current = newZoom;
      applyTransform();
      setZoomDisplay(newZoom);
    };

    container.addEventListener('wheel', onWheel, { passive: false });
    return () => container.removeEventListener('wheel', onWheel);
  }, [wheelEnabled, applyTransform, containerRef]);

  const zoomToCenter = useCallback(
    (newZoom: number) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      panRef.current = {
        x: cx - ((cx - panRef.current.x) / zoomRef.current) * newZoom,
        y: cy - ((cy - panRef.current.y) / zoomRef.current) * newZoom,
      };
      zoomRef.current = newZoom;
      applyTransform();
      setZoomDisplay(newZoom);
    },
    [applyTransform, containerRef]
  );

  const zoomIn = useCallback(
    () => zoomToCenter(Math.min(MAX_ZOOM, zoomRef.current + 0.2)),
    [zoomToCenter]
  );
  const zoomOut = useCallback(
    () => zoomToCenter(Math.max(MIN_ZOOM, zoomRef.current - 0.2)),
    [zoomToCenter]
  );

  const resetView = useCallback(() => {
    zoomRef.current = 1;
    panRef.current = { x: 0, y: 0 };
    applyTransform();
    setZoomDisplay(1);
  }, [applyTransform]);

  return {
    zoomDisplay,
    zoomRef,
    panRef,
    isPanningRef,
    panStartRef,
    panOriginRef,
    applyTransform,
    zoomIn,
    zoomOut,
    resetView,
  };
}
