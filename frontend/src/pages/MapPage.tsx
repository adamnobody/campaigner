import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  Box, Typography, Button, IconButton,
  Chip, Tooltip, ToggleButton, ToggleButtonGroup,
} from '@mui/material';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import MapIcon from '@mui/icons-material/Map';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PentagonIcon from '@mui/icons-material/Pentagon';
import MouseIcon from '@mui/icons-material/Mouse';
import UndoIcon from '@mui/icons-material/Undo';
import CheckIcon from '@mui/icons-material/Check';
import { useParams, useNavigate } from 'react-router-dom';
import { mapApi, projectsApi, notesApi, factionsApi } from '@/api/axiosClient';
import { useUIStore } from '@/store/useUIStore';
import { DndButton } from '@/components/ui/DndButton';
import {
  MIN_ZOOM, MAX_ZOOM, ZOOM_SPEED, DRAG_THRESHOLD,
  DEFAULT_FORM, MARKER_COLORS, sxMapContainer,
  extractData, normalizeMarker, normalizeTerritory, normalizeMap,
  parseMarkers, parseTerritories, parseNotes, parseFactions,
  preloadImage, isPointInPolygon,
} from './map/mapUtils';
import type { MapMode, Marker, Territory, MapData, NoteOption, FactionOption } from './map/mapUtils';
import { MapMarkerDialog } from './map/MapMarkerDialog';
import { MapTerritoryDialog } from './map/MapTerritoryDialog';
import { MapMarkerPanel } from './map/MapMarkerPanel';
import { MapTerritoryPanel } from './map/MapTerritoryPanel';
import { MapTerritorySvg } from './map/MapTerritorySvg';
import { MapMarkerOnMap } from './map/MapMarkerOnMap';
import { shallow } from 'zustand/shallow';

// ==================== Component ====================
export const MapPage: React.FC = () => {
  const { projectId, mapId } = useParams<{ projectId: string; mapId?: string }>();
  const pid = parseInt(projectId!);
  const mid = mapId ? parseInt(mapId) : null;
  const navigate = useNavigate();
  const { showSnackbar, showConfirmDialog } = useUIStore((state) => ({
    showSnackbar: state.showSnackbar,
    showConfirmDialog: state.showConfirmDialog,
  }), shallow);

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const transformRef = useRef<HTMLDivElement>(null);

  // Data
  const [project, setProject] = useState<any>(null);
  const [currentMap, setCurrentMap] = useState<MapData | null>(null);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [notes, setNotes] = useState<NoteOption[]>([]);
  const [factions, setFactions] = useState<FactionOption[]>([]);
  const [mapBreadcrumbs, setMapBreadcrumbs] = useState<MapData[]>([]);
  const [loading, setLoading] = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null);

  // Mode
  const [mode, setMode] = useState<MapMode>('select');
  const [drawingPoints, setDrawingPoints] = useState<{ x: number; y: number }[]>([]);

  // Transform — управляем только через refs, без React state
  const [zoomDisplay, setZoomDisplay] = useState(1); // для UI и counter-scale маркеров
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const panOriginRef = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(1);
  const panRef = useRef({ x: 0, y: 0 });

  const applyTransform = useCallback(() => {
    if (transformRef.current) {
      transformRef.current.style.transform =
        `translate(${panRef.current.x}px, ${panRef.current.y}px) scale(${zoomRef.current})`;
    }
  }, []);

  // Drag markers
  const [draggingMarker, setDraggingMarker] = useState<Marker | null>(null);
  const [dragPreview, setDragPreview] = useState<{ x: number; y: number } | null>(null);
  const dragStartScreenRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const didDragRef = useRef(false);
  const lastDragPreviewUpdateAtRef = useRef(0);
  const lastPointDragUpdateAtRef = useRef(0);

  // Drag territory points
  const [draggingPointIndex, setDraggingPointIndex] = useState<number | null>(null);
  const [editingTerritoryPoints, setEditingTerritoryPoints] = useState<Territory | null>(null);

  // Dialog (markers)
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMarker, setEditingMarker] = useState<Marker | null>(null);
  const [clickPos, setClickPos] = useState<{ x: number; y: number } | null>(null);
  const [markerForm, setMarkerForm] = useState({ ...DEFAULT_FORM });
  const [childMapFile, setChildMapFile] = useState<File | null>(null);
  const [childMapPreview, setChildMapPreview] = useState<string | null>(null);

  // Dialog (territory)
  const [territoryDialogOpen, setTerritoryDialogOpen] = useState(false);
  const [editingTerritory, setEditingTerritory] = useState<Territory | null>(null);
  const [territoryForm, setTerritoryForm] = useState({
    name: '', description: '', color: '#4ECDC4', opacity: 0.25,
    borderColor: '#4ECDC4', borderWidth: 1.5, smoothing: 0, factionId: null as number | null,
  });

  // Panel
  const [selectedMarker, setSelectedMarker] = useState<Marker | null>(null);
  const [selectedTerritory, setSelectedTerritory] = useState<Territory | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelType, setPanelType] = useState<'marker' | 'territory'>('marker');

  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notesMap = useMemo(() => {
    const m = new Map<number, NoteOption>();
    notes.forEach(n => m.set(n.id, n));
    return m;
  }, [notes]);

  const factionsMap = useMemo(() => {
    const m = new Map<number, FactionOption>();
    factions.forEach(f => m.set(f.id, f));
    return m;
  }, [factions]);

  const getLinkedNote = useCallback((noteId: number | null) =>
    noteId ? notesMap.get(noteId) : undefined, [notesMap]);

  const mapImageUrl = useMemo(() =>
    currentMap?.imagePath ? `/api${currentMap.imagePath}` : project?.mapImagePath || null,
    [currentMap?.imagePath, project?.mapImagePath]);

  // ==================== Data loading ====================
  const loadMapData = useCallback(async (loadMapId: number) => {
    setTransitioning(true);
    setSelectedMarker(null);
    setSelectedTerritory(null);
    setPanelOpen(false);
    setMode('select');
    setDrawingPoints([]);

    try {
      const mapRes = await mapApi.getMapById(loadMapId);
      const mapData = normalizeMap(extractData(mapRes));

      const [markersRes, territoriesRes, notesRes, factionsRes] = await Promise.all([
        mapApi.getMarkersByMapId(mapData.id),
        mapApi.getTerritoriesByMapId(mapData.id),
        notesApi.getAll(pid),
        factionsApi.getAll(pid),
      ]);

      const newMarkers = parseMarkers(extractData(markersRes));
      const newTerritories = parseTerritories(extractData(territoriesRes));
      const newNotes = parseNotes(extractData(notesRes));
      const newFactions = parseFactions(extractData(factionsRes));

      if (mapData.imagePath) {
        await preloadImage(`/api${mapData.imagePath}`);
      }

      setCurrentMap(mapData);
      setMarkers(newMarkers);
      setTerritories(newTerritories);
      setNotes(newNotes);
      setFactions(newFactions);
      setImgSize(null);
      zoomRef.current = 1;
      panRef.current = { x: 0, y: 0 };
      applyTransform();
      setZoomDisplay(1);
    } catch {
      showSnackbar('Ошибка загрузки карты', 'error');
    }
    setTransitioning(false);
  }, [pid, showSnackbar]);

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        const projRes = await projectsApi.getById(pid);
        if (cancelled) return;
        setProject(extractData(projRes));

        let mapToLoad: MapData;
        if (mid) {
          mapToLoad = normalizeMap(extractData(await mapApi.getMapById(mid)));
        } else {
          try {
            mapToLoad = normalizeMap(extractData(await mapApi.getRootMap(pid)));
          } catch {
            mapToLoad = normalizeMap(extractData(await mapApi.createMap({ projectId: pid, name: 'Корневая карта' })));
          }
        }
        if (cancelled) return;

        setCurrentMap(mapToLoad);
        setMapBreadcrumbs([mapToLoad]);

        const [markersRes, territoriesRes, notesRes, factionsRes] = await Promise.all([
          mapApi.getMarkersByMapId(mapToLoad.id),
          mapApi.getTerritoriesByMapId(mapToLoad.id),
          notesApi.getAll(pid),
          factionsApi.getAll(pid),
        ]);
        if (cancelled) return;

        setMarkers(parseMarkers(extractData(markersRes)));
        setTerritories(parseTerritories(extractData(territoriesRes)));
        setNotes(parseNotes(extractData(notesRes)));
        setFactions(parseFactions(extractData(factionsRes)));
      } catch { /* ignore */ }
      if (!cancelled) setLoading(false);
    };

    init();
    return () => { cancelled = true; };
  }, [pid, mid]);

  // ==================== Navigation ====================
  const navigateToChildMap = useCallback(async (childMapId: number) => {
    const mapRes = await mapApi.getMapById(childMapId);
    const childMap = normalizeMap(extractData(mapRes));
    setMapBreadcrumbs(prev => [...prev, childMap]);
    await loadMapData(childMapId);
  }, [loadMapData]);

  const navigateToBreadcrumb = useCallback(async (index: number) => {
    const target = mapBreadcrumbs[index];
    if (!target) return;
    await loadMapData(target.id);
    setMapBreadcrumbs(prev => prev.slice(0, index + 1));
  }, [mapBreadcrumbs, loadMapData]);

  const navigateToParent = useCallback(() => {
    if (mapBreadcrumbs.length > 1) navigateToBreadcrumb(mapBreadcrumbs.length - 2);
  }, [mapBreadcrumbs, navigateToBreadcrumb]);

  // ==================== Child map ops ====================
  const handleCreateChildMap = useCallback(async (marker: Marker) => {
    if (!currentMap) return;
    try {
      const res = await mapApi.createMap({
        projectId: pid, parentMapId: currentMap.id,
        parentMarkerId: marker.id, name: `Карта: ${marker.title}`,
      });
      const newMap = normalizeMap(extractData(res));
      await mapApi.updateMarker(marker.id, { childMapId: newMap.id });
      setMarkers(prev => prev.map(m => m.id === marker.id ? { ...m, childMapId: newMap.id } : m));
      if (selectedMarker?.id === marker.id) setSelectedMarker(prev => prev ? { ...prev, childMapId: newMap.id } : prev);
      showSnackbar('Вложенная карта создана', 'success');
    } catch {
      showSnackbar('Ошибка создания карты', 'error');
    }
  }, [currentMap, pid, selectedMarker?.id, showSnackbar]);

  const handleUploadChildMapImage = useCallback(async (marker: Marker, file: File) => {
    if (!marker.childMapId) return;
    try {
      await mapApi.uploadMapImage(marker.childMapId, file);
      showSnackbar('Изображение загружено', 'success');
    } catch {
      showSnackbar('Ошибка загрузки изображения', 'error');
    }
  }, [showSnackbar]);

  // ==================== Zoom ====================
  useEffect(() => {
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
  }, [loading, applyTransform]);

  const zoomToCenter = useCallback((newZoom: number) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const cx = rect.width / 2, cy = rect.height / 2;
    panRef.current = {
      x: cx - ((cx - panRef.current.x) / zoomRef.current) * newZoom,
      y: cy - ((cy - panRef.current.y) / zoomRef.current) * newZoom,
    };
    zoomRef.current = newZoom;
    applyTransform();
    setZoomDisplay(newZoom);
  }, [applyTransform]);

  const zoomIn = useCallback(() => zoomToCenter(Math.min(MAX_ZOOM, zoomRef.current + 0.2)), [zoomToCenter]);
  const zoomOut = useCallback(() => zoomToCenter(Math.max(MIN_ZOOM, zoomRef.current - 0.2)), [zoomToCenter]);
  const resetView = useCallback(() => {
    zoomRef.current = 1;
    panRef.current = { x: 0, y: 0 };
    applyTransform();
    setZoomDisplay(1);
  }, [applyTransform]);

  // ==================== Pan & Drag ====================
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      isPanningRef.current = true;
      panStartRef.current = { x: e.clientX, y: e.clientY };
      panOriginRef.current = { ...panRef.current };
      e.preventDefault();
    }
  }, []);

  const handlePointDragStart = useCallback((e: React.MouseEvent, index: number, isDrawing: boolean) => {
    e.stopPropagation();
    e.preventDefault();
    setDraggingPointIndex(index);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanningRef.current) {
      panRef.current = {
        x: panOriginRef.current.x + e.clientX - panStartRef.current.x,
        y: panOriginRef.current.y + e.clientY - panStartRef.current.y,
      };
      applyTransform();
      return;
    }

    // Drag territory point
    if (draggingPointIndex !== null && imgRef.current) {
      const now = performance.now();
      if (now - lastPointDragUpdateAtRef.current < 16) {
        return;
      }
      lastPointDragUpdateAtRef.current = now;

      const rect = imgRef.current.getBoundingClientRect();
      const px = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      const py = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

      if (editingTerritoryPoints) {
        // Editing existing territory points
        setEditingTerritoryPoints(prev => {
          if (!prev) return prev;
          const newPoints = [...prev.points];
          newPoints[draggingPointIndex] = { x: px, y: py };
          return { ...prev, points: newPoints };
        });
      } else {
        // Drawing new territory points
        setDrawingPoints(prev => {
          const newPts = [...prev];
          newPts[draggingPointIndex] = { x: px, y: py };
          return newPts;
        });
      }
      return;
    }

    if (isDraggingRef.current && draggingMarker && imgRef.current) {
      const dx = e.clientX - dragStartScreenRef.current.x;
      const dy = e.clientY - dragStartScreenRef.current.y;
      if (!didDragRef.current && Math.sqrt(dx * dx + dy * dy) < DRAG_THRESHOLD) return;
      didDragRef.current = true;
      const now = performance.now();
      if (now - lastDragPreviewUpdateAtRef.current < 16) {
        return;
      }
      lastDragPreviewUpdateAtRef.current = now;

      const rect = imgRef.current.getBoundingClientRect();
      setDragPreview({
        x: Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)),
        y: Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100)),
      });
    }
  }, [draggingMarker, draggingPointIndex, editingTerritoryPoints, applyTransform]);

  const handleMouseUp = useCallback(async () => {
    if (draggingPointIndex !== null) {
      setDraggingPointIndex(null);
      return;
    }

    if (isPanningRef.current) {
      isPanningRef.current = false;
      return;
    }

    if (isDraggingRef.current && draggingMarker) {
      isDraggingRef.current = false;

      if (didDragRef.current && dragPreview) {
        try {
          await mapApi.updateMarker(draggingMarker.id, {
            positionX: dragPreview.x / 100, positionY: dragPreview.y / 100,
          });
          setMarkers(prev => prev.map(m => m.id === draggingMarker.id ? { ...m, x: dragPreview.x, y: dragPreview.y } : m));
          if (selectedMarker?.id === draggingMarker.id)
            setSelectedMarker(prev => prev ? { ...prev, x: dragPreview.x, y: dragPreview.y } : prev);
          showSnackbar('Маркер перемещён', 'success');
        } catch {
          showSnackbar('Ошибка перемещения', 'error');
        }
      }

      setDraggingMarker(null);
      setDragPreview(null);
      lastDragPreviewUpdateAtRef.current = 0;
      didDragRef.current = false;
    }
  }, [draggingMarker, draggingPointIndex, dragPreview, selectedMarker?.id, showSnackbar]);

  // ==================== Marker interactions ====================
  const handleMarkerMouseDown = useCallback((e: React.MouseEvent, marker: Marker) => {
    if (e.button !== 0 || e.altKey || mode !== 'select') return;
    e.stopPropagation();
    isDraggingRef.current = true;
    didDragRef.current = false;
    dragStartScreenRef.current = { x: e.clientX, y: e.clientY };
    setDraggingMarker(marker);
    setDragPreview(null);
    lastDragPreviewUpdateAtRef.current = 0;
  }, [mode]);

  const handleMarkerClick = useCallback((e: React.MouseEvent, marker: Marker) => {
    e.stopPropagation();
    if (didDragRef.current || transitioning || mode !== 'select') return;

    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    clickTimerRef.current = setTimeout(() => {
      clickTimerRef.current = null;
      setSelectedMarker(marker);
      setSelectedTerritory(null);
      setPanelType('marker');
      setPanelOpen(true);
    }, 250);
  }, [transitioning, mode]);

  // ==================== Territory interactions ====================
  const handleTerritoryClick = useCallback((e: React.MouseEvent, territory: Territory) => {
    e.stopPropagation();
    if (mode !== 'select') return;
    setSelectedTerritory(territory);
    setSelectedMarker(null);
    setPanelType('territory');
    setPanelOpen(true);
  }, [mode]);

  // ==================== Map click ====================
  const handleMapClick = useCallback((e: React.MouseEvent) => {
    if (isPanningRef.current || didDragRef.current || transitioning) return;
    if (!imgRef.current || !currentMap) return;

    const rect = imgRef.current.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * 100;
    const py = ((e.clientY - rect.top) / rect.height) * 100;

    if (mode === 'draw_territory') {
      setDrawingPoints(prev => [...prev, { x: px, y: py }]);
      return;
    }

    // Check if clicked on a territory
    for (let i = territories.length - 1; i >= 0; i--) {
      if (isPointInPolygon(px, py, territories[i].points)) {
        setSelectedTerritory(territories[i]);
        setSelectedMarker(null);
        setPanelType('territory');
        setPanelOpen(true);
        return;
      }
    }

    // Create marker
    setClickPos({ x: px, y: py });
    setEditingMarker(null);
    setMarkerForm({ ...DEFAULT_FORM });
    setChildMapFile(null);
    setChildMapPreview(null);
    setDialogOpen(true);
  }, [isPanningRef.current, transitioning, currentMap, mode, territories]);

  // ==================== Drawing territory ====================
  const undoLastPoint = useCallback(() => {
    setDrawingPoints(prev => prev.slice(0, -1));
  }, []);

  const finishDrawing = useCallback(() => {
    if (drawingPoints.length < 3) {
      showSnackbar('Нужно минимум 3 точки для территории', 'warning');
      return;
    }
    setTerritoryForm({
      name: '', description: '', color: '#4ECDC4', opacity: 0.25,
      borderColor: '#4ECDC4', borderWidth: 2, smoothing: 0, factionId: null,
    });
    setEditingTerritory(null);
    setTerritoryDialogOpen(true);
  }, [drawingPoints, showSnackbar]);

  const cancelDrawing = useCallback(() => {
    setDrawingPoints([]);
    setMode('select');
  }, []);

  // ==================== Territory CRUD ====================
  const handleSaveTerritory = useCallback(async () => {
    if (!territoryForm.name.trim()) return;
    try {
      if (editingTerritory) {
        const res = await mapApi.updateTerritory(editingTerritory.id, {
          name: territoryForm.name,
          description: territoryForm.description,
          color: territoryForm.color,
          opacity: territoryForm.opacity,
          borderColor: territoryForm.borderColor,
          borderWidth: territoryForm.borderWidth,
          smoothing: territoryForm.smoothing,
          factionId: territoryForm.factionId,
        });
        const updated = normalizeTerritory(extractData(res));
        setTerritories(prev => prev.map(t => t.id === editingTerritory.id ? updated : t));
      if (selectedTerritory?.id === editingTerritory.id) setSelectedTerritory(updated);
        showSnackbar('Территория обновлена', 'success');
      } else if (currentMap) {
        const apiPoints = drawingPoints.map(p => ({ x: p.x / 100, y: p.y / 100 }));
        const res = await mapApi.createTerritory(currentMap.id, {
          name: territoryForm.name,
          description: territoryForm.description,
          color: territoryForm.color,
          opacity: territoryForm.opacity,
          borderColor: territoryForm.borderColor,
          borderWidth: territoryForm.borderWidth,
          smoothing: territoryForm.smoothing,
          factionId: territoryForm.factionId,
          points: apiPoints,
        });
        const newTerritory = normalizeTerritory(extractData(res));
        setTerritories(prev => [...prev, newTerritory]);
        showSnackbar('Территория создана', 'success');
      }
      setTerritoryDialogOpen(false);
      setDrawingPoints([]);
      setMode('select');
    } catch (err: any) {
      showSnackbar(err.message || 'Ошибка сохранения территории', 'error');
    }
  }, [territoryForm, editingTerritory, currentMap, drawingPoints, selectedTerritory?.id, showSnackbar]);

  const startEditingPoints = useCallback((territory: Territory) => {
    setEditingTerritoryPoints(territory);
    setPanelOpen(false);
  }, []);

  const saveEditingPoints = useCallback(async () => {
    if (!editingTerritoryPoints) return;
    try {
      const apiPoints = editingTerritoryPoints.points.map(p => ({ x: p.x / 100, y: p.y / 100 }));
      const res = await mapApi.updateTerritory(editingTerritoryPoints.id, { points: apiPoints });
      const updated = normalizeTerritory(extractData(res));
      setTerritories(prev => prev.map(t => t.id === editingTerritoryPoints.id ? updated : t));
      if (selectedTerritory?.id === editingTerritoryPoints.id) setSelectedTerritory(updated);
      setEditingTerritoryPoints(null);
      showSnackbar('Точки территории обновлены', 'success');
    } catch {
      showSnackbar('Ошибка сохранения точек', 'error');
    }
  }, [editingTerritoryPoints, selectedTerritory?.id, showSnackbar]);

  const cancelEditingPoints = useCallback(() => {
    setEditingTerritoryPoints(null);
  }, []);

  const deletePoint = useCallback((index: number, isDrawing: boolean) => {
    if (isDrawing) {
      setDrawingPoints(prev => {
        if (prev.length <= 1) return prev;
        return prev.filter((_, i) => i !== index);
      });
    } else {
      setEditingTerritoryPoints(prev => {
        if (!prev || prev.points.length <= 3) return prev;
        return { ...prev, points: prev.points.filter((_, i) => i !== index) };
      });
    }
  }, []);

  const addPointOnEdge = useCallback((index: number, isDrawing: boolean) => {
    if (isDrawing) {
      setDrawingPoints(prev => {
        const nextIdx = (index + 1) % prev.length;
        const mid = {
          x: (prev[index].x + prev[nextIdx].x) / 2,
          y: (prev[index].y + prev[nextIdx].y) / 2,
        };
        const newPts = [...prev];
        newPts.splice(index + 1, 0, mid);
        return newPts;
      });
    } else {
      setEditingTerritoryPoints(prev => {
        if (!prev) return prev;
        const pts = prev.points;
        const nextIdx = (index + 1) % pts.length;
        const mid = {
          x: (pts[index].x + pts[nextIdx].x) / 2,
          y: (pts[index].y + pts[nextIdx].y) / 2,
        };
        const newPts = [...pts];
        newPts.splice(index + 1, 0, mid);
        return { ...prev, points: newPts };
      });
    }
  }, []);

  const handleEditTerritory = useCallback((territory: Territory) => {
    setEditingTerritory(territory);
    setTerritoryForm({
      name: territory.name,
      description: territory.description,
      color: territory.color,
      opacity: territory.opacity,
      borderColor: territory.borderColor,
      borderWidth: territory.borderWidth,
      smoothing: territory.smoothing,
      factionId: territory.factionId,
    });
    setTerritoryDialogOpen(true);
  }, []);

  const handleDeleteTerritory = useCallback((territory: Territory) => {
    showConfirmDialog('Удалить территорию', `Удалить "${territory.name}"?`, async () => {
      try {
        await mapApi.deleteTerritory(territory.id);
        setTerritories(prev => prev.filter(t => t.id !== territory.id));
        setSelectedTerritory(null);
        setPanelOpen(false);
        showSnackbar('Территория удалена', 'success');
      } catch {
        showSnackbar('Ошибка удаления', 'error');
      }
    });
  }, [showConfirmDialog, showSnackbar]);

  // ==================== Marker CRUD ====================
  const handleSaveMarker = useCallback(async () => {
    if (!markerForm.title.trim()) return;
    try {
      if (editingMarker) {
        const res = await mapApi.updateMarker(editingMarker.id, {
          title: markerForm.title, description: markerForm.description,
          positionX: editingMarker.x / 100, positionY: editingMarker.y / 100,
          icon: markerForm.icon, color: markerForm.color,
          linkedNoteId: markerForm.linkedNoteId,
        });
        const updated = normalizeMarker(extractData(res));
        setMarkers(prev => prev.map(m => m.id === editingMarker.id ? updated : m));
        if (selectedMarker?.id === editingMarker.id) setSelectedMarker(updated);
        showSnackbar('Маркер обновлён', 'success');
      } else if (clickPos && currentMap) {
        const res = await mapApi.createMarker(currentMap.id, {
          title: markerForm.title, description: markerForm.description,
          positionX: clickPos.x / 100, positionY: clickPos.y / 100,
          icon: markerForm.icon, color: markerForm.color,
          linkedNoteId: markerForm.linkedNoteId,
        });
        const newMarker = normalizeMarker(extractData(res));

        if (markerForm.createChildMap && currentMap) {
          try {
            const mapRes = await mapApi.createMap({
              projectId: pid, parentMapId: currentMap.id,
              parentMarkerId: newMarker.id, name: `Карта: ${newMarker.title}`,
            });
            const childMap = normalizeMap(extractData(mapRes));
            await mapApi.updateMarker(newMarker.id, { childMapId: childMap.id });
            newMarker.childMapId = childMap.id;

            if (childMapFile) {
              try { await mapApi.uploadMapImage(childMap.id, childMapFile); }
              catch { showSnackbar('Карта создана, но ошибка загрузки изображения', 'warning'); }
            }
          } catch {
            showSnackbar('Маркер создан, но ошибка создания вложенной карты', 'warning');
          }
        }

        setMarkers(prev => [...prev, newMarker]);
        setChildMapFile(null);
        setChildMapPreview(null);
        showSnackbar('Маркер добавлен', 'success');
      }
      setDialogOpen(false);
    } catch (err: any) {
      showSnackbar(err.message || 'Ошибка сохранения', 'error');
    }
  }, [markerForm, editingMarker, clickPos, currentMap, pid, childMapFile, selectedMarker?.id, showSnackbar]);

  const handleDeleteMarker = useCallback((marker: Marker) => {
    showConfirmDialog('Удалить маркер', `Удалить "${marker.title}"?`, async () => {
      try {
        await mapApi.deleteMarker(marker.id);
        setMarkers(prev => prev.filter(m => m.id !== marker.id));
        setSelectedMarker(null);
        setPanelOpen(false);
        showSnackbar('Маркер удалён', 'success');
      } catch {
        showSnackbar('Ошибка удаления', 'error');
      }
    });
  }, [showConfirmDialog, showSnackbar]);

  const handleEditMarker = useCallback((marker: Marker) => {
    setEditingMarker(marker);
    setMarkerForm({
      title: marker.title, description: marker.description || '',
      icon: marker.icon || 'custom', color: marker.color || MARKER_COLORS[0],
      linkedNoteId: marker.linkedNoteId, createChildMap: false,
    });
    setChildMapFile(null);
    setChildMapPreview(null);
    setDialogOpen(true);
  }, []);

  const handleUploadMap = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      if (currentMap) {
        await mapApi.uploadMapImage(currentMap.id, file);
        const updated = normalizeMap(extractData(await mapApi.getMapById(currentMap.id)));
        setCurrentMap(updated);
        if (!updated.parentMapId) {
          await projectsApi.uploadMap(pid, file);
          setProject(extractData(await projectsApi.getById(pid)));
        }
      }
      showSnackbar('Карта загружена!', 'success');
    } catch {
      showSnackbar('Ошибка загрузки', 'error');
    }
  }, [currentMap, pid, showSnackbar]);

  const closePanel = useCallback(() => {
    setPanelOpen(false);
    setSelectedMarker(null);
    setSelectedTerritory(null);
  }, []);

  const closeDialog = useCallback(() => setDialogOpen(false), []);
  const closeTerritoryDialog = useCallback(() => setTerritoryDialogOpen(false), []);

  const handleChildMapFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setChildMapFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setChildMapPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  }, []);

  const clearChildMapFile = useCallback(() => {
    setChildMapFile(null);
    setChildMapPreview(null);
  }, []);

  const handleMarkerDoubleClick = useCallback((e: React.MouseEvent, marker: Marker) => {
    e.stopPropagation();
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }
    if (marker.childMapId) navigateToChildMap(marker.childMapId);
  }, [navigateToChildMap]);

  // ==================== Loading ====================
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <Typography sx={{ color: 'rgba(255,255,255,0.5)' }}>Загрузка карты...</Typography>
      </Box>
    );
  }


  // ==================== Main render ====================
  return (
    <Box sx={{ height: 'calc(100vh - 64px - 48px)', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Box display="flex" alignItems="center" gap={1}>
          {mapBreadcrumbs.length > 1 && (
            <IconButton size="small" onClick={navigateToParent} sx={{ color: 'rgba(255,255,255,0.5)' }}>
              <ArrowBackIcon fontSize="small" />
            </IconButton>
          )}
          <Box display="flex" alignItems="center" gap={0.5}>
            {mapBreadcrumbs.map((bc, i) => {
              const isLast = i === mapBreadcrumbs.length - 1;
              return (
                <React.Fragment key={bc.id}>
                  {i > 0 && <Typography sx={{ color: 'rgba(255,255,255,0.2)', mx: 0.5 }}>›</Typography>}
                  <Typography
                    onClick={isLast ? undefined : () => navigateToBreadcrumb(i)}
                    sx={{
                      fontFamily: '"Cinzel", serif',
                      fontWeight: isLast ? 700 : 400,
                      fontSize: isLast ? '1.55rem' : '1.05rem',
                      color: isLast ? '#fff' : 'rgba(255,255,255,0.4)',
                      cursor: isLast ? 'default' : 'pointer',
                      ...(!isLast && { '&:hover': { color: 'rgba(255,255,255,0.7)' } }),
                    }}
                  >
                    {bc.name}
                  </Typography>
                </React.Fragment>
              );
            })}
          </Box>
        </Box>

        <Box display="flex" gap={1} alignItems="center">
          {/* Mode toggle */}
          <ToggleButtonGroup
            value={mode}
            exclusive
            onChange={(_, v) => {
              if (v) {
                setMode(v);
                if (v === 'select') setDrawingPoints([]);
              }
            }}
            size="small"
            sx={{
              '& .MuiToggleButton-root': {
                color: 'rgba(255,255,255,0.5)',
                borderColor: 'rgba(255,255,255,0.15)',
                px: 1.5, py: 0.5,
                '&.Mui-selected': {
                  color: '#fff',
                  backgroundColor: 'rgba(78,205,196,0.15)',
                  borderColor: 'rgba(78,205,196,0.4)',
                },
              },
            }}
          >
            <ToggleButton value="select">
              <Tooltip title="Режим выбора">
                <MouseIcon fontSize="small" />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="draw_territory">
              <Tooltip title="Рисовать территорию">
                <PentagonIcon fontSize="small" />
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>

          {/* Drawing controls */}
          {mode === 'draw_territory' && (
            <Box display="flex" gap={0.5} alignItems="center">
              <Chip
                label={`${drawingPoints.length} точек`}
                size="small" variant="outlined"
                sx={{ borderColor: 'rgba(78,205,196,0.3)', color: '#4ECDC4' }}
              />
              <IconButton size="small" onClick={undoLastPoint} disabled={drawingPoints.length === 0}
                sx={{ color: 'rgba(255,255,255,0.5)' }}>
                <UndoIcon fontSize="small" />
              </IconButton>
              <Button size="small" variant="contained" startIcon={<CheckIcon />}
                onClick={finishDrawing} disabled={drawingPoints.length < 3}
                sx={{ backgroundColor: '#4ECDC4', color: '#000', fontWeight: 600,
                  '&:hover': { backgroundColor: '#45b7aa' },
                  '&.Mui-disabled': { backgroundColor: 'rgba(78,205,196,0.2)', color: 'rgba(0,0,0,0.3)' } }}>
                Завершить
              </Button>
              <Button size="small" variant="outlined" onClick={cancelDrawing}
                sx={{ borderColor: 'rgba(255,100,100,0.3)', color: 'rgba(255,100,100,0.7)' }}>
                Отмена
              </Button>
            </Box>
          )}

          {/* Zoom */}
          <Box display="flex" gap={0.5} sx={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 1, p: 0.5 }}>
            <IconButton size="small" onClick={zoomOut} sx={{ color: '#fff' }}><ZoomOutIcon fontSize="small" /></IconButton>
            <Typography sx={{ color: '#fff', fontSize: '0.9rem', lineHeight: '30px', px: 1, minWidth: 40, textAlign: 'center' }}>
              {Math.round(zoomDisplay * 100)}%
            </Typography>
            <IconButton size="small" onClick={zoomIn} sx={{ color: '#fff' }}><ZoomInIcon fontSize="small" /></IconButton>
            <IconButton size="small" onClick={resetView} sx={{ color: '#fff' }}><CenterFocusStrongIcon fontSize="small" /></IconButton>
          </Box>

          <Chip icon={<DragIndicatorIcon sx={{ fontSize: 14 }} />}
            label={`${markers.length} маркеров · ${territories.length} территорий`}
            size="small" variant="outlined"
            sx={{
              borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.55)',
              '& .MuiChip-label': { fontSize: '0.8rem' },
            }} />

          <Button component="label" variant="outlined" startIcon={<CloudUploadIcon />} size="small"
            sx={{ borderColor: 'rgba(255,255,255,0.2)', color: '#fff' }}>
            Загрузить карту
            <input type="file" hidden accept="image/*" onChange={handleUploadMap} />
          </Button>
        </Box>
      </Box>

      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.42)', mb: 1, display: 'block', fontSize: '0.8rem', lineHeight: 1.45 }}>
        {editingTerritoryPoints
          ? 'Перетащите точки для изменения формы · ПКМ — удалить точку · Двойной клик — добавить точку на ребре'
          : mode === 'draw_territory'
          ? 'Кликайте по карте чтобы добавить точки · Перетащите для коррекции · ПКМ — удалить · Двойной клик — добавить'
          : 'Клик — добавить маркер · Клик по территории — настройки · Перетаскивание — переместить · Двойной клик — вложенная карта · Alt+drag / СКМ — пан · Колёсико — зум'
        }
      </Typography>

      {/* Map + Panel */}
      <Box sx={{ ...sxMapContainer, position: 'relative' }}>
        <Box
          ref={containerRef}
          sx={{
            width: '100%', height: '100%', overflow: 'hidden',
            backgroundColor: '#0a0a14',
            position: 'relative',
            cursor: isPanningRef.current ? 'grabbing'
              : (draggingMarker && didDragRef.current) ? 'grabbing'
              : mode === 'draw_territory' ? 'crosshair'
              : 'crosshair',
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {mapImageUrl ? (
            <>
              <Box
                ref={transformRef}
                sx={{
                  position: 'absolute', transformOrigin: '0 0',
                  isolation: 'isolate',
                }}
              >
                <img
                  ref={imgRef} src={mapImageUrl} alt="Map"
                  onClick={handleMapClick}
                  onLoad={(e) => {
                    const el = e.currentTarget;
                    setImgSize({ w: el.naturalWidth, h: el.naturalHeight });
                  }}
                  style={{
                    display: 'block',
                    width: imgSize ? imgSize.w : 'auto',
                    height: imgSize ? imgSize.h : 'auto',
                    maxWidth: 'none',
                    maxHeight: 'none',
                    userSelect: 'none',
                    pointerEvents: 'auto',
                  }}
                  draggable={false}
                />
              <MapTerritorySvg
                imgRef={imgRef}
                zoomDisplay={zoomDisplay}
                territories={territories}
                mode={mode}
                drawingPoints={drawingPoints}
                editingTerritoryPoints={editingTerritoryPoints}
                selectedTerritory={selectedTerritory}
                draggingMarker={draggingMarker}
                draggingPointIndex={draggingPointIndex}
                onTerritoryClick={handleTerritoryClick}
                onPointDragStart={handlePointDragStart}
                onDeletePoint={deletePoint}
                onAddPointOnEdge={addPointOnEdge}
              />
              {markers.map(marker => {
                const isDraggingVisual = draggingMarker?.id === marker.id && didDragRef.current;
                const displayX = isDraggingVisual && dragPreview ? dragPreview.x : marker.x;
                const displayY = isDraggingVisual && dragPreview ? dragPreview.y : marker.y;
                return (
                  <MapMarkerOnMap
                    key={marker.id}
                    marker={marker}
                    mode={mode}
                    zoomDisplay={zoomDisplay}
                    isSelected={selectedMarker?.id === marker.id}
                    isDraggingVisual={isDraggingVisual}
                    displayX={displayX}
                    displayY={displayY}
                    linkedNote={getLinkedNote(marker.linkedNoteId)}
                    hasChildMap={!!marker.childMapId}
                    onMarkerMouseDown={handleMarkerMouseDown}
                    onMarkerClick={handleMarkerClick}
                    onMarkerDoubleClick={handleMarkerDoubleClick}
                  />
                );
              })}
            </Box>
            </>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <Typography sx={{ color: 'rgba(255,255,255,0.3)', mb: 2 }}>Карта не загружена</Typography>
              <Button component="label" variant="outlined" startIcon={<CloudUploadIcon />}>
                Загрузить изображение карты
                <input type="file" hidden accept="image/*" onChange={handleUploadMap} />
              </Button>
            </Box>
          )}
        </Box>

        {/* Editing territory points floating panel */}
        {editingTerritoryPoints && (
          <Box sx={{
            position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
            zIndex: 30, display: 'flex', alignItems: 'center', gap: 1.5,
            backgroundColor: 'rgba(26,26,46,0.95)', padding: '10px 20px',
            borderRadius: 2, border: '1px solid rgba(255,215,0,0.3)',
            backdropFilter: 'blur(8px)', boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          }}>
            <Typography variant="body2" sx={{ color: '#FFD700', mr: 1, whiteSpace: 'nowrap' }}>
              ✏️ {editingTerritoryPoints.name} — {editingTerritoryPoints.points.length} точек
            </Typography>
            <Button size="small" variant="outlined" onClick={cancelEditingPoints}
              sx={{ borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.6)',
                '&:hover': { borderColor: 'rgba(255,255,255,0.4)' } }}>
              Отмена
            </Button>
            <DndButton size="small" variant="contained" onClick={saveEditingPoints}
              sx={{ minWidth: 100 }}>
              Сохранить
            </DndButton>
          </Box>
        )}

        {/* Transition overlay */}
        {transitioning && (
          <Box sx={{
            position: 'absolute', inset: 0,
            backgroundColor: 'rgba(10,10,20,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 50, backdropFilter: 'blur(4px)',
          }}>
            <Box sx={{ textAlign: 'center' }}>
              <MapIcon sx={{ fontSize: 40, color: 'rgba(187,143,206,0.5)', mb: 1 }} />
              <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>Загрузка карты...</Typography>
            </Box>
          </Box>
        )}

        {/* Right Panel */}
        {panelOpen && selectedMarker && panelType === 'marker' && (
          <Box sx={{ position: 'absolute', top: 0, right: 0, bottom: 0, zIndex: 20 }}>
            <MapMarkerPanel
              selectedMarker={selectedMarker}
              linkedNote={getLinkedNote(selectedMarker.linkedNoteId)}
              onClose={closePanel}
              onNavigateToNote={(noteId) => navigate(`/project/${pid}/notes/${noteId}`)}
              onNavigateToChildMap={navigateToChildMap}
              onCreateChildMap={handleCreateChildMap}
              onUploadChildMapImage={handleUploadChildMapImage}
              onEditMarker={handleEditMarker}
              onDeleteMarker={handleDeleteMarker}
            />
          </Box>
        )}
        {panelOpen && selectedTerritory && panelType === 'territory' && (
          <Box sx={{ position: 'absolute', top: 0, right: 0, bottom: 0, zIndex: 20 }}>
            <MapTerritoryPanel
              selectedTerritory={selectedTerritory}
              faction={selectedTerritory.factionId ? factionsMap.get(selectedTerritory.factionId) : null}
              onClose={closePanel}
              onNavigateToFaction={(factionId) => navigate(`/project/${pid}/factions/${factionId}`)}
              onEditTerritory={handleEditTerritory}
              onDeleteTerritory={handleDeleteTerritory}
              onStartEditingPoints={startEditingPoints}
            />
          </Box>
        )}
      </Box>


      <MapMarkerDialog
        open={dialogOpen}
        onClose={closeDialog}
        editingMarker={editingMarker}
        markerForm={markerForm}
        setMarkerForm={setMarkerForm}
        notes={notes}
        notesMap={notesMap}
        childMapFile={childMapFile}
        childMapPreview={childMapPreview}
        onChildMapFileChange={handleChildMapFileChange}
        clearChildMapFile={clearChildMapFile}
        onSave={handleSaveMarker}
      />
      <MapTerritoryDialog
        open={territoryDialogOpen}
        onClose={closeTerritoryDialog}
        editingTerritory={editingTerritory}
        territoryForm={territoryForm}
        setTerritoryForm={setTerritoryForm}
        factions={factions}
        onSave={handleSaveTerritory}
      />
    </Box>
  );
};
