import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { MapMode } from '../components/mapUtils';

type SnackbarSeverity = 'success' | 'error' | 'warning' | 'info';

/**
 * Черновик мультиполигонной территории: точки, готовые контуры, снимок для диалога создания.
 */
export function useMapTerritoryDrawing(
  mode: MapMode,
  showSnackbar: (message: string, severity: SnackbarSeverity) => void
) {
  const { t } = useTranslation(['map', 'common']);
  const [drawingCompletedRings, setDrawingCompletedRings] = useState<{ x: number; y: number }[][]>([]);
  const [drawingPoints, setDrawingPoints] = useState<{ x: number; y: number }[]>([]);
  const [pendingNewTerritoryRings, setPendingNewTerritoryRings] = useState<{ x: number; y: number }[][] | null>(
    null
  );

  const clearDrawingDraft = useCallback(() => {
    setDrawingPoints([]);
    setDrawingCompletedRings([]);
    setPendingNewTerritoryRings(null);
  }, []);

  const undoLastPoint = useCallback(() => {
    setDrawingPoints(prev => prev.slice(0, -1));
  }, []);

  const completeContour = useCallback(() => {
    if (drawingPoints.length < 3) {
      showSnackbar(t('map:drawing.minThreePoints'), 'warning');
      return;
    }
    setDrawingCompletedRings(prev => [...prev, [...drawingPoints]]);
    setDrawingPoints([]);
  }, [drawingPoints, showSnackbar, t]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (mode !== 'draw_territory') return;
      const targetEl = e.target as HTMLElement | null;
      if (!targetEl) return;
      const tag = targetEl.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || targetEl.isContentEditable) return;
      // e.code: физическая клавиша; при русской раскладке e.key — «к», а не «r»
      if (e.code !== 'KeyR') return;
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
      e.preventDefault();
      completeContour();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mode, completeContour]);

  /** Валидный набор колец для открытия диалога создания территории, иначе null и snackbar. */
  const buildRingsSnapshotForCreateDialog = useCallback((): { x: number; y: number }[][] | null => {
    const rings: { x: number; y: number }[][] = [...drawingCompletedRings];
    if (drawingPoints.length >= 3) rings.push([...drawingPoints]);
    if (rings.length === 0) {
      showSnackbar(t('map:drawing.needClosedContour'), 'warning');
      return null;
    }
    if (rings.some(r => r.length < 3)) {
      showSnackbar(t('map:drawing.minThreePerRing'), 'warning');
      return null;
    }
    return rings;
  }, [drawingCompletedRings, drawingPoints, showSnackbar, t]);

  return {
    drawingCompletedRings,
    drawingPoints,
    pendingNewTerritoryRings,
    setDrawingPoints,
    setPendingNewTerritoryRings,
    clearDrawingDraft,
    undoLastPoint,
    completeContour,
    buildRingsSnapshotForCreateDialog,
  };
}
