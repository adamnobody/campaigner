import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { findNearestEditableEdge, type EdgeInsertPhantom } from '@/utils/mapGeometry';
import {
  DRAG_THRESHOLD,
  isPointInTerritory,
  screenDistanceBetweenPercentPointsInPx,
} from '../components/mapUtils';
import type { MapData, MapMode, Marker, Territory, TerritoryPointDragPayload } from '../components/mapUtils';

export type { EdgeInsertPhantom } from '@/utils/mapGeometry';

type UseMapInteractionsArgs = {
  mode: MapMode;
  setMode: React.Dispatch<React.SetStateAction<MapMode>>;
  currentMap: MapData | null;
  territories: Territory[];
  transitioning: boolean;
  draggingMarker: Marker | null;
  didDragRef: React.MutableRefObject<boolean>;
  isDraggingRef: React.MutableRefObject<boolean>;
  isPanningRef: React.MutableRefObject<boolean>;
  panStartRef: React.MutableRefObject<{ x: number; y: number }>;
  panOriginRef: React.MutableRefObject<{ x: number; y: number }>;
  panRef: React.MutableRefObject<{ x: number; y: number }>;
  applyTransform: () => void;
  imgRef: React.RefObject<HTMLImageElement>;
  setDrawingPoints: React.Dispatch<React.SetStateAction<Array<{ x: number; y: number }>>>;
  drawingPoints: Array<{ x: number; y: number }>;
  zoomDisplay: number;
  completeContour: () => void;
  clearDrawingDraft: () => void;
  buildRingsSnapshotForCreateDialog: () => Array<Array<{ x: number; y: number }>> | null;
  openNewMarkerDialogAt: (x: number, y: number) => void;
  openCreateTerritoryDialogFromRings: (rings: Array<Array<{ x: number; y: number }>>) => void;
  navigateToChildMap: (childMapId: number) => Promise<void>;
  handleMarkerDragMove: (e: React.MouseEvent, imageElement: HTMLImageElement | null, dragThreshold: number) => void;
  handleMarkerDragEnd: () => Promise<void>;
  editingTerritoryPoints: Territory | null;
  setEditingTerritoryPoints: React.Dispatch<React.SetStateAction<Territory | null>>;
  cancelEditingPoints: () => void;
  panelOpen: boolean;
  setPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
  panelType: 'marker' | 'territory';
  setPanelType: React.Dispatch<React.SetStateAction<'marker' | 'territory'>>;
  selectedMarker: Marker | null;
  setSelectedMarker: React.Dispatch<React.SetStateAction<Marker | null>>;
  selectedTerritory: Territory | null;
  setSelectedTerritory: React.Dispatch<React.SetStateAction<Territory | null>>;
  setPendingNewTerritoryRings: React.Dispatch<React.SetStateAction<Array<Array<{ x: number; y: number }>> | null>>;
  showSnackbar: (message: string, severity?: 'success' | 'error' | 'warning' | 'info') => void;
};

export function useMapInteractions({
  mode,
  setMode,
  currentMap,
  territories,
  transitioning,
  draggingMarker,
  didDragRef,
  isDraggingRef,
  isPanningRef,
  panStartRef,
  panOriginRef,
  panRef,
  applyTransform,
  imgRef,
  setDrawingPoints,
  drawingPoints,
  zoomDisplay,
  completeContour,
  clearDrawingDraft,
  buildRingsSnapshotForCreateDialog,
  openNewMarkerDialogAt,
  openCreateTerritoryDialogFromRings,
  navigateToChildMap,
  handleMarkerDragMove,
  handleMarkerDragEnd,
  editingTerritoryPoints,
  setEditingTerritoryPoints,
  cancelEditingPoints,
  panelOpen,
  setPanelOpen,
  panelType,
  setPanelType,
  selectedMarker,
  setSelectedMarker,
  selectedTerritory,
  setSelectedTerritory,
  setPendingNewTerritoryRings,
  showSnackbar,
}: UseMapInteractionsArgs) {
  const { t } = useTranslation(['map', 'common']);
  const [draggingTerritoryPoint, setDraggingTerritoryPoint] = useState<TerritoryPointDragPayload | null>(null);
  const [drawPointerPercent, setDrawPointerPercent] = useState<{ x: number; y: number } | null>(null);
  const [edgeInsertPhantom, setEdgeInsertPhantom] = useState<EdgeInsertPhantom | null>(null);
  const [isCtrlPressed, setIsCtrlPressed] = useState(false);
  const lastPointDragUpdateAtRef = useRef(0);
  const lastPhantomAtRef = useRef(0);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressNextMapClickRef = useRef(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Control') setIsCtrlPressed(true);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Control') setIsCtrlPressed(false);
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  useEffect(() => {
    if (mode !== 'draw_territory' || drawingPoints.length === 0) {
      setDrawPointerPercent(null);
    }
  }, [mode, drawingPoints.length]);

  useEffect(() => {
    if (!editingTerritoryPoints) setEdgeInsertPhantom(null);
  }, [editingTerritoryPoints]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.shiftKey) {
      e.preventDefault();
    }
    const byMiddleMouse = e.button === 1;
    const byAltLeft = e.button === 0 && e.altKey;
    const byPanModeLeft = e.button === 0 && mode === 'select';
    const byMarkerCtrlLeft = e.button === 0 && mode === 'marker' && e.ctrlKey;
    if (byMiddleMouse || byAltLeft || byPanModeLeft || byMarkerCtrlLeft) {
      isPanningRef.current = true;
      panStartRef.current = { x: e.clientX, y: e.clientY };
      panOriginRef.current = { ...panRef.current };
      suppressNextMapClickRef.current = e.button === 0;
      e.preventDefault();
    }
  }, [isPanningRef, mode, panOriginRef, panRef, panStartRef]);

  const handlePointDragStart = useCallback((e: React.MouseEvent, payload: TerritoryPointDragPayload) => {
    e.stopPropagation();
    e.preventDefault();
    setEdgeInsertPhantom(null);
    setDraggingTerritoryPoint(payload);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isCtrlPressed !== e.ctrlKey) {
      setIsCtrlPressed(e.ctrlKey);
    }
    if (isPanningRef.current) {
      setEdgeInsertPhantom(null);
      panRef.current = {
        x: panOriginRef.current.x + e.clientX - panStartRef.current.x,
        y: panOriginRef.current.y + e.clientY - panStartRef.current.y,
      };
      applyTransform();
      return;
    }

    if (draggingTerritoryPoint !== null && imgRef.current) {
      const now = performance.now();
      if (now - lastPointDragUpdateAtRef.current < 16) return;
      lastPointDragUpdateAtRef.current = now;

      const rect = imgRef.current.getBoundingClientRect();
      const px = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      const py = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

      if (draggingTerritoryPoint.mode === 'edit' && editingTerritoryPoints) {
        setEditingTerritoryPoints(prev => {
          if (!prev) return prev;
          const { ringIndex, pointIndex } = draggingTerritoryPoint;
          const newRings = prev.rings.map((ring, ri) =>
            ri === ringIndex ? ring.map((p, pi) => (pi === pointIndex ? { x: px, y: py } : p)) : ring,
          );
          return { ...prev, rings: newRings };
        });
      }
      return;
    }

    if (mode === 'draw_territory' && drawingPoints.length > 0 && imgRef.current) {
      const rect = imgRef.current.getBoundingClientRect();
      const px = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      const py = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
      setDrawPointerPercent({ x: px, y: py });
      setEdgeInsertPhantom(null);
    } else {
      setDrawPointerPercent(null);
    }

    if (mode !== 'draw_territory' && editingTerritoryPoints && draggingTerritoryPoint === null && imgRef.current) {
      const now = performance.now();
      if (now - lastPhantomAtRef.current >= 16) {
        lastPhantomAtRef.current = now;
        const rect = imgRef.current.getBoundingClientRect();
        const px = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
        const py = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
        const iw = imgRef.current.clientWidth;
        const ih = imgRef.current.clientHeight;
        const hit = findNearestEditableEdge(
          { x: px, y: py },
          editingTerritoryPoints.rings,
          8,
          8,
          iw,
          ih,
          zoomDisplay,
        );
        setEdgeInsertPhantom(
          hit
            ? { ringIndex: hit.ringIndex, edgeIndex: hit.edgeIndex, projection: hit.projection }
            : null,
        );
      }
    } else {
      setEdgeInsertPhantom(null);
    }

    handleMarkerDragMove(e, imgRef.current, DRAG_THRESHOLD);
  }, [
    applyTransform,
    draggingTerritoryPoint,
    drawingPoints.length,
    editingTerritoryPoints,
    handleMarkerDragMove,
    imgRef,
    isCtrlPressed,
    isPanningRef,
    mode,
    panOriginRef,
    panRef,
    panStartRef,
    setDrawingPoints,
    setEditingTerritoryPoints,
    zoomDisplay,
  ]);

  const handleMouseUp = useCallback(async (e?: React.MouseEvent) => {
    if (e?.type === 'mouseleave') {
      setDrawPointerPercent(null);
      setEdgeInsertPhantom(null);
    }

    if (draggingTerritoryPoint !== null) {
      setDraggingTerritoryPoint(null);
      return;
    }

    if (isPanningRef.current) {
      isPanningRef.current = false;
      if (e?.button === 0) {
        suppressNextMapClickRef.current = true;
      }
      return;
    }

    await handleMarkerDragEnd();
  }, [draggingTerritoryPoint, handleMarkerDragEnd, isPanningRef]);

  const handleMarkerClick = useCallback((e: React.MouseEvent, marker: Marker) => {
    e.stopPropagation();
    if (didDragRef.current || transitioning || mode !== 'marker') return;

    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    clickTimerRef.current = setTimeout(() => {
      clickTimerRef.current = null;
      setSelectedMarker(marker);
      setSelectedTerritory(null);
      setPanelType('marker');
      setPanelOpen(true);
    }, 250);
  }, [didDragRef, mode, setPanelOpen, setPanelType, setSelectedMarker, setSelectedTerritory, transitioning]);

  const handleMarkerDoubleClick = useCallback((e: React.MouseEvent, marker: Marker) => {
    e.stopPropagation();
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }
    if (marker.childMapId) void navigateToChildMap(marker.childMapId);
  }, [navigateToChildMap]);

  const handleTerritoryClick = useCallback((e: React.MouseEvent, territory: Territory) => {
    e.stopPropagation();
    if (mode === 'draw_territory') return;
    if (editingTerritoryPoints) {
      if (territory.id === editingTerritoryPoints.id) return;
      showSnackbar(t('map:snackbar.finishShapeEditFirst'), 'warning');
      return;
    }
    if (e.shiftKey && imgRef.current) {
      const rect = imgRef.current.getBoundingClientRect();
      const px = ((e.clientX - rect.left) / rect.width) * 100;
      const py = ((e.clientY - rect.top) / rect.height) * 100;
      openNewMarkerDialogAt(px, py);
      return;
    }
    setSelectedTerritory(territory);
    setSelectedMarker(null);
    setPanelType('territory');
    setPanelOpen(true);
  }, [
    editingTerritoryPoints,
    imgRef,
    mode,
    openNewMarkerDialogAt,
    setPanelOpen,
    setPanelType,
    setSelectedMarker,
    setSelectedTerritory,
    showSnackbar,
    t,
  ]);

  const handleMapClick = useCallback((e: React.MouseEvent) => {
    if (suppressNextMapClickRef.current) {
      suppressNextMapClickRef.current = false;
      return;
    }
    if (isPanningRef.current || didDragRef.current || transitioning) return;
    if (!imgRef.current || !currentMap) return;
    const rect = imgRef.current.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * 100;
    const py = ((e.clientY - rect.top) / rect.height) * 100;

    if (mode === 'draw_territory') {
      const iw = imgRef.current.clientWidth;
      const ih = imgRef.current.clientHeight;
      if (
        drawingPoints.length >= 3 &&
        iw > 0 &&
        ih > 0 &&
        screenDistanceBetweenPercentPointsInPx(drawingPoints[0], { x: px, y: py }, iw, ih, zoomDisplay) < 10
      ) {
        completeContour();
        return;
      }
      setDrawingPoints(prev => [...prev, { x: px, y: py }]);
      return;
    }

    if (editingTerritoryPoints) {
      if (!e.shiftKey) {
        for (let i = territories.length - 1; i >= 0; i -= 1) {
          if (isPointInTerritory(px, py, territories[i])) {
            if (territories[i].id === editingTerritoryPoints.id) return;
            showSnackbar(t('map:snackbar.finishShapeEditFirst'), 'warning');
            return;
          }
        }
      }
      return;
    }

    if (!e.shiftKey) {
      for (let i = territories.length - 1; i >= 0; i -= 1) {
        if (isPointInTerritory(px, py, territories[i])) {
          setSelectedTerritory(territories[i]);
          setSelectedMarker(null);
          setPanelType('territory');
          setPanelOpen(true);
          return;
        }
      }
    }

    if (mode === 'select') return;
    if (mode === 'marker' && e.ctrlKey) return;
    openNewMarkerDialogAt(px, py);
  }, [
    completeContour,
    currentMap,
    didDragRef,
    drawingPoints,
    editingTerritoryPoints,
    imgRef,
    isPanningRef,
    mode,
    openNewMarkerDialogAt,
    setDrawingPoints,
    setPanelOpen,
    setPanelType,
    setSelectedMarker,
    setSelectedTerritory,
    showSnackbar,
    suppressNextMapClickRef,
    t,
    territories,
    transitioning,
    zoomDisplay,
  ]);

  const finishDrawing = useCallback(() => {
    const rings = buildRingsSnapshotForCreateDialog();
    if (!rings) return;
    openCreateTerritoryDialogFromRings(rings);
  }, [buildRingsSnapshotForCreateDialog, openCreateTerritoryDialogFromRings]);

  const cancelDrawing = useCallback(() => {
    clearDrawingDraft();
    setMode('select');
  }, [clearDrawingDraft]);

  const handleMapModeChange = useCallback(
    (nextMode: MapMode) => {
      if (nextMode === 'draw_territory' && editingTerritoryPoints) {
        cancelEditingPoints();
        showSnackbar(t('map:snackbar.shapeEditCancelled'), 'info');
      }
      setMode(nextMode);
      clearDrawingDraft();
    },
    [cancelEditingPoints, clearDrawingDraft, editingTerritoryPoints, setMode, showSnackbar, t],
  );

  const closePanel = useCallback(() => {
    setPanelOpen(false);
    setSelectedMarker(null);
    setSelectedTerritory(null);
  }, [setPanelOpen, setSelectedMarker, setSelectedTerritory]);

  const resetForMapLoad = useCallback(() => {
    setSelectedMarker(null);
    setSelectedTerritory(null);
    setPanelOpen(false);
    setMode('select');
    setPendingNewTerritoryRings(null);
  }, [setMode, setPanelOpen, setPendingNewTerritoryRings, setSelectedMarker, setSelectedTerritory]);

  return {
    draggingTerritoryPoint,
    drawPointerPercent,
    edgeInsertPhantom,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handlePointDragStart,
    handleMarkerClick,
    handleMarkerDoubleClick,
    handleTerritoryClick,
    handleMapClick,
    finishDrawing,
    cancelDrawing,
    handleMapModeChange,
    isCtrlPressed,
    closePanel,
    resetForMapLoad,
  };
}
