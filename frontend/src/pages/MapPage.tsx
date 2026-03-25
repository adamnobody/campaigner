import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  Box, Typography, TextField, Button, Dialog,
  DialogTitle, DialogContent, DialogActions, IconButton,
  Select, MenuItem, FormControl, InputLabel, Autocomplete,
  Chip, Divider, Slider, Tooltip, ToggleButton, ToggleButtonGroup,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DescriptionIcon from '@mui/icons-material/Description';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import CloseIcon from '@mui/icons-material/Close';
import MapIcon from '@mui/icons-material/Map';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import ImageIcon from '@mui/icons-material/Image';
import PentagonIcon from '@mui/icons-material/Pentagon';
import MouseIcon from '@mui/icons-material/Mouse';
import UndoIcon from '@mui/icons-material/Undo';
import CheckIcon from '@mui/icons-material/Check';
import { useParams, useNavigate } from 'react-router-dom';
import { mapApi, projectsApi, notesApi, factionsApi } from '@/api/axiosClient';
import { useUIStore } from '@/store/useUIStore';
import { DndButton } from '@/components/ui/DndButton';

// ==================== Constants ====================
const MARKER_ICONS: Record<string, string> = {
  castle: '🏰', city: '🏙️', village: '🏘️', tavern: '🍺',
  dungeon: '⚔️', forest: '🌲', mountain: '⛰️', river: '🌊',
  cave: '🕳️', temple: '⛪', ruins: '🏚️', port: '⚓',
  bridge: '🌉', tower: '🗼', camp: '🏕️', battlefield: '⚔️',
  mine: '⛏️', farm: '🌾', graveyard: '💀', custom: '📍',
};
const MARKER_ICON_ENTRIES = Object.entries(MARKER_ICONS);

const MARKER_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#BB8FCE', '#85C1E9', '#F8C471', '#82E0AA',
] as const;

const TERRITORY_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#BB8FCE', '#85C1E9', '#F8C471', '#82E0AA',
  '#E74C3C', '#2ECC71', '#3498DB', '#9B59B6',
  '#F39C12', '#1ABC9C', '#E67E22', '#8E44AD',
];

const MIN_ZOOM = 0.2;
const MAX_ZOOM = 5;
const ZOOM_SPEED = 0.1;
const DRAG_THRESHOLD = 4;
const PANEL_WIDTH = 360;
const DEFAULT_FORM = {
  title: '', description: '', icon: 'custom', color: MARKER_COLORS[0] as string,
  linkedNoteId: null as number | null, createChildMap: false,
};

type MapMode = 'select' | 'draw_territory';

// ==================== Static styles ====================
const sxDivider = { borderColor: 'rgba(255,255,255,0.06)', my: 1.5 } as const;
const sxSectionLabel = { color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.65rem' } as const;
const sxPanelRoot = {
  width: PANEL_WIDTH, minWidth: PANEL_WIDTH, height: '100%',
  backgroundColor: 'rgba(15,15,28,0.98)', borderLeft: '1px solid rgba(255,255,255,0.1)',
  display: 'flex', flexDirection: 'column', overflow: 'hidden',
} as const;
const sxMapContainer = { flexGrow: 1, display: 'flex', overflow: 'hidden', borderRadius: 2, border: '1px solid rgba(255,255,255,0.1)' } as const;

// ==================== Types ====================
interface Marker {
  id: number; title: string; description: string;
  x: number; y: number; icon: string; color: string;
  linkedNoteId: number | null; childMapId: number | null;
}
interface Territory {
  id: number; mapId: number; name: string; description: string;
  color: string; opacity: number; borderColor: string; borderWidth: number;
  points: { x: number; y: number }[];
  factionId: number | null; sortOrder: number;
}
interface MapData {
  id: number; projectId: number; parentMapId: number | null;
  parentMarkerId: number | null; name: string; imagePath: string | null;
}
interface NoteOption { id: number; title: string; noteType: string; }
interface FactionOption { id: number; name: string; color: string; type: string; }

// ==================== Helpers ====================
const extractData = (res: any): any => res.data?.data || res.data;

const normalizeMarker = (m: any): Marker => ({
  id: m.id, title: m.title, description: m.description || '',
  x: (m.positionX ?? 0) * 100, y: (m.positionY ?? 0) * 100,
  icon: m.icon || 'custom', color: m.color || MARKER_COLORS[0],
  linkedNoteId: m.linkedNoteId || null, childMapId: m.childMapId || null,
});

const normalizeTerritory = (t: any): Territory => ({
  id: t.id, mapId: t.mapId, name: t.name, description: t.description || '',
  color: t.color || '#4ECDC4', opacity: t.opacity ?? 0.25,
  borderColor: t.borderColor || '#4ECDC4', borderWidth: t.borderWidth ?? 1.5,
  points: (t.points || []).map((p: any) => ({ x: p.x * 100, y: p.y * 100 })),
  factionId: t.factionId || null, sortOrder: t.sortOrder || 0,
});

const normalizeMap = (m: any): MapData => ({
  id: m.id, projectId: m.projectId || m.project_id,
  parentMapId: m.parentMapId || m.parent_map_id || null,
  parentMarkerId: m.parentMarkerId || m.parent_marker_id || null,
  name: m.name, imagePath: m.imagePath || m.image_path || null,
});

const parseMarkers = (data: any): Marker[] =>
  (Array.isArray(data) ? data : []).map(normalizeMarker);

const parseTerritories = (data: any): Territory[] =>
  (Array.isArray(data) ? data : []).map(normalizeTerritory);

const parseNotes = (data: any): NoteOption[] => {
  const list = data?.items || (Array.isArray(data) ? data : []);
  return list.map((n: any) => ({ id: n.id, title: n.title, noteType: n.noteType }));
};

const parseFactions = (data: any): FactionOption[] => {
  const list = Array.isArray(data) ? data : [];
  return list.map((f: any) => ({ id: f.id, name: f.name, color: f.color || '#4ECDC4', type: f.type || 'other' }));
};

const preloadImage = (src: string): Promise<void> =>
  new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = src;
    setTimeout(resolve, 3000);
  });

const pointsToSvgPath = (points: { x: number; y: number }[]): string => {
  if (points.length < 2) return '';
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
};

const isPointInPolygon = (px: number, py: number, polygon: { x: number; y: number }[]): boolean => {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    if (((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  return inside;
};

const hexToRgb = (hex: string): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
};

// ==================== Component ====================
export const MapPage: React.FC = () => {
  const { projectId, mapId } = useParams<{ projectId: string; mapId?: string }>();
  const pid = parseInt(projectId!);
  const mid = mapId ? parseInt(mapId) : null;
  const navigate = useNavigate();
  const { showSnackbar, showConfirmDialog } = useUIStore();

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
    borderColor: '#4ECDC4', borderWidth: 1.5, factionId: null as number | null,
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

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanningRef.current) {
      panRef.current = {
        x: panOriginRef.current.x + e.clientX - panStartRef.current.x,
        y: panOriginRef.current.y + e.clientY - panStartRef.current.y,
      };
      applyTransform();
      return;
    }

    if (isDraggingRef.current && draggingMarker && imgRef.current) {
      const dx = e.clientX - dragStartScreenRef.current.x;
      const dy = e.clientY - dragStartScreenRef.current.y;
      if (!didDragRef.current && Math.sqrt(dx * dx + dy * dy) < DRAG_THRESHOLD) return;
      didDragRef.current = true;

      const rect = imgRef.current.getBoundingClientRect();
      setDragPreview({
        x: Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)),
        y: Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100)),
      });
    }
  }, [draggingMarker, applyTransform]);

  const handleMouseUp = useCallback(async () => {
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
      didDragRef.current = false;
    }
  }, [draggingMarker, dragPreview, selectedMarker?.id, showSnackbar]);

  // ==================== Marker interactions ====================
  const handleMarkerMouseDown = useCallback((e: React.MouseEvent, marker: Marker) => {
    if (e.button !== 0 || e.altKey || mode !== 'select') return;
    e.stopPropagation();
    isDraggingRef.current = true;
    didDragRef.current = false;
    dragStartScreenRef.current = { x: e.clientX, y: e.clientY };
    setDraggingMarker(marker);
    setDragPreview(null);
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
      borderColor: '#4ECDC4', borderWidth: 2, factionId: null,
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

  const handleEditTerritory = useCallback((territory: Territory) => {
    setEditingTerritory(territory);
    setTerritoryForm({
      name: territory.name,
      description: territory.description,
      color: territory.color,
      opacity: territory.opacity,
      borderColor: territory.borderColor,
      borderWidth: territory.borderWidth,
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

  // ==================== Loading ====================
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <Typography sx={{ color: 'rgba(255,255,255,0.5)' }}>Загрузка карты...</Typography>
      </Box>
    );
  }

  // ==================== Render helpers ====================
  const renderTerritorySvg = () => {
    if (!imgRef.current) return null;
    const w = imgRef.current.clientWidth;
    const h = imgRef.current.clientHeight;
    if (!w || !h) return null;

    return (
      <svg
        style={{
          position: 'absolute', top: 0, left: 0,
          width: w, height: h,
          pointerEvents: 'none', zIndex: 2,
          overflow: 'visible',
        }}
        viewBox={`0 0 ${w} ${h}`}
      >
        {territories.map(t => {
          const svgPts = t.points.map(p => ({
            x: (p.x / 100) * w,
            y: (p.y / 100) * h,
          }));
          const pathD = svgPts.map((p, i) =>
            `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
          ).join(' ') + ' Z';
          const filterId = `shadow-${t.id}`;

          return (
            <g key={t.id}>
              <defs>
                <filter id={filterId} x="-10%" y="-10%" width="120%" height="120%">
                  <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor={t.borderColor} floodOpacity="0.5" />
                </filter>
              </defs>
              {/* Shadow border */}
              <path
                d={pathD}
                fill="none"
                stroke={t.borderColor}
                strokeWidth={t.borderWidth + 2}
                strokeLinejoin="round"
                strokeLinecap="round"
                opacity={0.3}
                filter={`url(#${filterId})`}
              />
              {/* Main fill + border */}
              <path
                d={pathD}
                fill={`rgba(${hexToRgb(t.color)}, ${t.opacity})`}
                stroke={t.borderColor}
                strokeWidth={t.borderWidth}
                strokeLinejoin="round"
                strokeLinecap="round"
                style={{
                  pointerEvents: mode === 'select' ? 'auto' : 'none',
                  cursor: mode === 'select' ? 'pointer' : 'default',
                }}
                onClick={(e) => handleTerritoryClick(e as any, t)}
              />
            </g>
          );
        })}

        {mode === 'draw_territory' && drawingPoints.length > 0 && (() => {
          const svgPts = drawingPoints.map(p => ({
            x: (p.x / 100) * w,
            y: (p.y / 100) * h,
          }));

          return (
            <>
              {svgPts.length >= 3 && (
                <path
                  d={svgPts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z'}
                  fill="rgba(78, 205, 196, 0.15)"
                  stroke="#4ECDC4"
                  strokeWidth={2}
                  strokeDasharray="8 4"
                  strokeLinejoin="round"
                />
              )}
              {svgPts.length === 2 && (
                <line
                  x1={svgPts[0].x} y1={svgPts[0].y}
                  x2={svgPts[1].x} y2={svgPts[1].y}
                  stroke="#4ECDC4" strokeWidth={2} strokeDasharray="8 4"
                />
              )}
              {svgPts.map((p, i) => (
                <circle
                  key={i}
                  cx={p.x} cy={p.y} r={5}
                  fill={i === 0 ? '#FF6B6B' : '#4ECDC4'}
                  stroke="#fff" strokeWidth={2}
                />
              ))}
            </>
          );
        })()}
      </svg>
    );
  };

  const renderMarker = (marker: Marker) => {
    const isDragging = draggingMarker?.id === marker.id && didDragRef.current;
    const dx = isDragging && dragPreview ? dragPreview.x : marker.x;
    const dy = isDragging && dragPreview ? dragPreview.y : marker.y;
    const isSelected = selectedMarker?.id === marker.id;
    const linkedNote = getLinkedNote(marker.linkedNoteId);
    const hasChildMap = !!marker.childMapId;

    return (
      <Box
        key={marker.id}
        onMouseDown={e => handleMarkerMouseDown(e, marker)}
        onClick={e => handleMarkerClick(e, marker)}
        onDoubleClick={e => {
          e.stopPropagation();
          if (clickTimerRef.current) {
            clearTimeout(clickTimerRef.current);
            clickTimerRef.current = null;
          }
          if (hasChildMap) navigateToChildMap(marker.childMapId!);
        }}
        sx={{
          position: 'absolute',
          left: `${dx}%`,
          top: `${dy}%`,
          transform: `translate(-50%, -50%) scale(${1 / zoomDisplay})`,
          willChange: 'transform',
          backfaceVisibility: 'hidden',
          cursor: mode === 'select' ? (isDragging ? 'grabbing' : 'grab') : 'crosshair',
          zIndex: isDragging ? 100 : isSelected ? 10 : 5,
          opacity: isDragging ? 0.85 : 1,
          transition: isDragging ? 'none' : 'transform 0.15s',
          pointerEvents: mode === 'select' ? 'auto' : 'none',
          '&:hover': {
            transform: `translate(-50%, -50%) scale(${1 / zoomDisplay * 1.15})`,
          },
          userSelect: 'none',
        }}
      >
        <Box sx={{
          width: 32, height: 32, borderRadius: '50%',
          backgroundColor: marker.color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '16px',
          boxShadow: isDragging
            ? `0 0 16px ${marker.color}cc, 0 4px 16px rgba(0,0,0,0.7)`
            : `0 0 8px ${marker.color}80, 0 2px 8px rgba(0,0,0,0.5)`,
          border: isSelected ? '2px solid #fff' : '2px solid rgba(0,0,0,0.3)',
        }}>
          {MARKER_ICONS[marker.icon] || '📍'}
        </Box>
        <Typography sx={{
          position: 'absolute', top: '100%', left: '50%',
          transform: 'translateX(-50%)', mt: '3px',
          fontSize: '11px', color: '#fff',
          textShadow: '0 1px 4px rgba(0,0,0,0.9), 0 0 8px rgba(0,0,0,0.7)',
          whiteSpace: 'nowrap', fontWeight: 600, pointerEvents: 'none',
        }}>
          {marker.title}
        </Typography>
        {linkedNote && (
          <Box sx={{
            position: 'absolute', top: -8, right: -8, width: 14, height: 14,
            borderRadius: '50%', backgroundColor: '#4ECDC4',
            border: '1.5px solid rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
          }}>
            <DescriptionIcon sx={{ fontSize: 8, color: '#fff' }} />
          </Box>
        )}
        {hasChildMap && (
          <Box sx={{
            position: 'absolute', top: -8, left: -8, width: 14, height: 14,
            borderRadius: '50%', backgroundColor: '#BB8FCE',
            border: '1.5px solid rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
          }}>
            <MapIcon sx={{ fontSize: 8, color: '#fff' }} />
          </Box>
        )}
      </Box>
    );
  };

  // ==================== Marker Panel ====================
  const renderMarkerPanel = () => {
    if (!selectedMarker) return null;
    const linkedNote = getLinkedNote(selectedMarker.linkedNoteId);
    const hasChildMap = !!selectedMarker.childMapId;

    return (
      <Box sx={sxPanelRoot}>
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <Box sx={{
            width: 40, height: 40, borderRadius: '50%',
            backgroundColor: selectedMarker.color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '20px', flexShrink: 0,
            boxShadow: `0 0 12px ${selectedMarker.color}60`,
          }}>
            {MARKER_ICONS[selectedMarker.icon] || '📍'}
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700, color: '#fff', fontSize: '1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {selectedMarker.title}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)' }}>
              X: {selectedMarker.x.toFixed(1)}% · Y: {selectedMarker.y.toFixed(1)}%
            </Typography>
          </Box>
          <IconButton size="small" onClick={closePanel} sx={{ color: 'rgba(255,255,255,0.4)' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          {selectedMarker.description && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" sx={sxSectionLabel}>Описание</Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mt: 0.5, lineHeight: 1.6 }}>
                {selectedMarker.description}
              </Typography>
            </Box>
          )}
          <Divider sx={sxDivider} />
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" sx={sxSectionLabel}>Привязанная заметка</Typography>
            {linkedNote ? (
              <Box
                onClick={() => navigate(`/project/${pid}/notes/${linkedNote.id}`)}
                sx={{
                  mt: 1, p: 1.5, borderRadius: 1,
                  backgroundColor: 'rgba(78,205,196,0.08)',
                  border: '1px solid rgba(78,205,196,0.2)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 1,
                  '&:hover': { backgroundColor: 'rgba(78,205,196,0.15)' },
                }}
              >
                <DescriptionIcon sx={{ fontSize: 18, color: '#4ECDC4' }} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{ color: '#4ECDC4', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {linkedNote.title}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(78,205,196,0.6)' }}>
                    {linkedNote.noteType === 'wiki' ? 'Вики-статья' : 'Заметка'}
                  </Typography>
                </Box>
                <OpenInNewIcon sx={{ fontSize: 16, color: 'rgba(78,205,196,0.5)' }} />
              </Box>
            ) : (
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.25)', mt: 0.5, fontStyle: 'italic' }}>
                Не привязана
              </Typography>
            )}
          </Box>
          <Divider sx={sxDivider} />
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" sx={sxSectionLabel}>Вложенная карта</Typography>
            {hasChildMap ? (
              <Box sx={{ mt: 1 }}>
                <Button fullWidth variant="outlined" startIcon={<MapIcon />}
                  onClick={() => navigateToChildMap(selectedMarker.childMapId!)}
                  sx={{ borderColor: 'rgba(187,143,206,0.3)', color: '#BB8FCE', justifyContent: 'flex-start',
                    '&:hover': { borderColor: 'rgba(187,143,206,0.5)', backgroundColor: 'rgba(187,143,206,0.08)' } }}>
                  Открыть вложенную карту
                </Button>
                <Button component="label" fullWidth variant="text" startIcon={<ImageIcon />} size="small"
                  sx={{ mt: 0.5, color: 'rgba(255,255,255,0.4)', justifyContent: 'flex-start' }}>
                  Загрузить изображение
                  <input type="file" hidden accept="image/*"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadChildMapImage(selectedMarker, f); }} />
                </Button>
              </Box>
            ) : (
              <Box sx={{ mt: 1 }}>
                <Button fullWidth variant="outlined" startIcon={<AddIcon />} size="small"
                  onClick={() => handleCreateChildMap(selectedMarker)}
                  sx={{ borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)', borderStyle: 'dashed', justifyContent: 'flex-start',
                    '&:hover': { borderColor: 'rgba(187,143,206,0.4)', color: '#BB8FCE' } }}>
                  Создать вложенную карту
                </Button>
              </Box>
            )}
          </Box>
        </Box>

        <Box sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: 1 }}>
          <Button fullWidth variant="outlined" startIcon={<EditIcon />} size="small"
            onClick={() => handleEditMarker(selectedMarker)}
            sx={{ borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)' }}>
            Редактировать
          </Button>
          <Button variant="outlined" size="small"
            onClick={() => handleDeleteMarker(selectedMarker)}
            sx={{ borderColor: 'rgba(255,100,100,0.2)', color: 'rgba(255,100,100,0.6)', minWidth: 'auto', px: 1.5,
              '&:hover': { borderColor: 'rgba(255,100,100,0.4)', backgroundColor: 'rgba(255,100,100,0.05)' } }}>
            <DeleteIcon fontSize="small" />
          </Button>
        </Box>
      </Box>
    );
  };

  // ==================== Territory Panel ====================
  const renderTerritoryPanel = () => {
    if (!selectedTerritory) return null;
    const faction = selectedTerritory.factionId ? factionsMap.get(selectedTerritory.factionId) : null;

    return (
      <Box sx={sxPanelRoot}>
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <Box sx={{
            width: 40, height: 40, borderRadius: '8px',
            backgroundColor: `rgba(${hexToRgb(selectedTerritory.color)}, 0.3)`,
            border: `2px solid ${selectedTerritory.borderColor}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <PentagonIcon sx={{ fontSize: 20, color: selectedTerritory.color }} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700, color: '#fff', fontSize: '1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {selectedTerritory.name}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)' }}>
              Территория · {selectedTerritory.points.length} точек
            </Typography>
          </Box>
          <IconButton size="small" onClick={closePanel} sx={{ color: 'rgba(255,255,255,0.4)' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          {selectedTerritory.description && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" sx={sxSectionLabel}>Описание</Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mt: 0.5, lineHeight: 1.6 }}>
                {selectedTerritory.description}
              </Typography>
            </Box>
          )}

          <Divider sx={sxDivider} />

          {/* Faction */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" sx={sxSectionLabel}>Принадлежность</Typography>
            {faction ? (
              <Box
                onClick={() => navigate(`/project/${pid}/factions/${faction.id}`)}
                sx={{
                  mt: 1, p: 1.5, borderRadius: 1,
                  backgroundColor: `rgba(${hexToRgb(faction.color)}, 0.08)`,
                  border: `1px solid rgba(${hexToRgb(faction.color)}, 0.2)`,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 1,
                  '&:hover': { backgroundColor: `rgba(${hexToRgb(faction.color)}, 0.15)` },
                }}
              >
                <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: faction.color }} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{ color: faction.color, fontWeight: 600 }}>
                    {faction.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: `rgba(${hexToRgb(faction.color)}, 0.6)` }}>
                    {faction.type}
                  </Typography>
                </Box>
                <OpenInNewIcon sx={{ fontSize: 16, color: `rgba(${hexToRgb(faction.color)}, 0.5)` }} />
              </Box>
            ) : (
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.25)', mt: 0.5, fontStyle: 'italic' }}>
                Не привязана к фракции
              </Typography>
            )}
          </Box>

          <Divider sx={sxDivider} />

          {/* Visual info */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" sx={sxSectionLabel}>Визуальные параметры</Typography>
            <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)' }}>Цвет заливки</Typography>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: selectedTerritory.color }} />
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>{selectedTerritory.color}</Typography>
                </Box>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)' }}>Прозрачность</Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>{Math.round(selectedTerritory.opacity * 100)}%</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)' }}>Цвет границы</Typography>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: selectedTerritory.borderColor }} />
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>{selectedTerritory.borderColor}</Typography>
                </Box>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)' }}>Толщина границы</Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>{selectedTerritory.borderWidth}px</Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        <Box sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: 1 }}>
          <Button fullWidth variant="outlined" startIcon={<EditIcon />} size="small"
            onClick={() => handleEditTerritory(selectedTerritory)}
            sx={{ borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)' }}>
            Редактировать
          </Button>
          <Button variant="outlined" size="small"
            onClick={() => handleDeleteTerritory(selectedTerritory)}
            sx={{ borderColor: 'rgba(255,100,100,0.2)', color: 'rgba(255,100,100,0.6)', minWidth: 'auto', px: 1.5,
              '&:hover': { borderColor: 'rgba(255,100,100,0.4)', backgroundColor: 'rgba(255,100,100,0.05)' } }}>
            <DeleteIcon fontSize="small" />
          </Button>
        </Box>
      </Box>
    );
  };

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
                      fontSize: isLast ? '1.3rem' : '0.9rem',
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
            <Typography sx={{ color: '#fff', fontSize: '0.8rem', lineHeight: '30px', px: 1, minWidth: 40, textAlign: 'center' }}>
              {Math.round(zoomDisplay * 100)}%
            </Typography>
            <IconButton size="small" onClick={zoomIn} sx={{ color: '#fff' }}><ZoomInIcon fontSize="small" /></IconButton>
            <IconButton size="small" onClick={resetView} sx={{ color: '#fff' }}><CenterFocusStrongIcon fontSize="small" /></IconButton>
          </Box>

          <Chip icon={<DragIndicatorIcon sx={{ fontSize: 14 }} />}
            label={`${markers.length} маркеров · ${territories.length} территорий`}
            size="small" variant="outlined"
            sx={{ borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)' }} />

          <Button component="label" variant="outlined" startIcon={<CloudUploadIcon />} size="small"
            sx={{ borderColor: 'rgba(255,255,255,0.2)', color: '#fff' }}>
            Загрузить карту
            <input type="file" hidden accept="image/*" onChange={handleUploadMap} />
          </Button>
        </Box>
      </Box>

      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)', mb: 1, display: 'block' }}>
        {mode === 'draw_territory'
          ? 'Кликайте по карте чтобы добавить точки территории · Минимум 3 точки · «Завершить» для сохранения'
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
                  willChange: 'transform',
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
                    maxWidth: '100vw',
                    maxHeight: '100vh',
                    userSelect: 'none',
                    pointerEvents: 'auto',
                  }}
                  draggable={false}
                />
              {/* Territories SVG layer */}
              {renderTerritorySvg()}
              {/* Markers */}
              {markers.map(renderMarker)}
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
        {panelOpen && (selectedMarker || selectedTerritory) && (
          <Box sx={{ position: 'absolute', top: 0, right: 0, bottom: 0, zIndex: 20 }}>
            {panelType === 'marker' ? renderMarkerPanel() : renderTerritoryPanel()}
          </Box>
        )}
      </Box>

      {/* ==================== Marker Dialog ==================== */}
      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth
        PaperProps={{ sx: { backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)' } }}>
        <DialogTitle sx={{ fontFamily: '"Cinzel", serif' }}>
          {editingMarker ? 'Редактировать маркер' : 'Добавить маркер'}
        </DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Название маркера" value={markerForm.title}
            onChange={e => setMarkerForm(prev => ({ ...prev, title: e.target.value }))} margin="normal" />
          <TextField fullWidth label="Описание" value={markerForm.description}
            onChange={e => setMarkerForm(prev => ({ ...prev, description: e.target.value }))}
            margin="normal" multiline rows={3} />

          <Autocomplete
            options={notes}
            getOptionLabel={o => o.title}
            value={notes.find(n => n.id === markerForm.linkedNoteId) || null}
            onChange={(_, v) => setMarkerForm(prev => ({ ...prev, linkedNoteId: v?.id || null }))}
            renderInput={params => (
              <TextField {...params} label="Привязанная заметка" margin="normal" placeholder="Начните вводить..." />
            )}
            renderOption={(props, option) => (
              <li {...props}>
                <Box display="flex" alignItems="center" gap={1}>
                  <DescriptionIcon sx={{ fontSize: 16, color: 'rgba(255,255,255,0.4)' }} />
                  <Typography>{option.title}</Typography>
                  <Chip label={option.noteType} size="small" variant="outlined"
                    sx={{ ml: 'auto', fontSize: '0.7rem', height: 20 }} />
                </Box>
              </li>
            )}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            noOptionsText="Нет заметок" clearText="Очистить" sx={{ mt: 1 }}
          />

          {!editingMarker && (
            <Box sx={{ mt: 2 }}>
              <Box
                onClick={() => {
                  const next = !markerForm.createChildMap;
                  setMarkerForm(prev => ({ ...prev, createChildMap: next }));
                  if (!next) clearChildMapFile();
                }}
                sx={{
                  p: 1.5, borderRadius: 1, cursor: 'pointer', transition: 'all 0.2s',
                  backgroundColor: markerForm.createChildMap ? 'rgba(187,143,206,0.08)' : 'transparent',
                  border: markerForm.createChildMap ? '1px solid rgba(187,143,206,0.3)' : '1px solid rgba(255,255,255,0.08)',
                  '&:hover': { borderColor: 'rgba(187,143,206,0.4)' },
                }}
              >
                <Box display="flex" alignItems="center" gap={1.5}>
                  <Box sx={{
                    width: 20, height: 20, borderRadius: '4px', transition: 'all 0.2s',
                    border: markerForm.createChildMap ? '2px solid #BB8FCE' : '2px solid rgba(255,255,255,0.2)',
                    backgroundColor: markerForm.createChildMap ? '#BB8FCE' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {markerForm.createChildMap && (
                      <Typography sx={{ color: '#fff', fontSize: 14, fontWeight: 700, lineHeight: 1 }}>✓</Typography>
                    )}
                  </Box>
                  <Box>
                    <Typography sx={{ color: markerForm.createChildMap ? '#BB8FCE' : 'rgba(255,255,255,0.6)', fontWeight: 600, fontSize: '0.9rem' }}>
                      Создать вложенную карту
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)' }}>
                      Маркер станет входом на отдельную карту
                    </Typography>
                  </Box>
                  <MapIcon sx={{ ml: 'auto', color: markerForm.createChildMap ? '#BB8FCE' : 'rgba(255,255,255,0.15)', fontSize: 20 }} />
                </Box>
              </Box>

              {markerForm.createChildMap && (
                <Box sx={{ mt: 1.5, ml: 0.5 }}>
                  {childMapPreview ? (
                    <>
                      <Box sx={{ width: '100%', height: 120, borderRadius: 1, overflow: 'hidden', border: '1px solid rgba(187,143,206,0.3)' }}>
                        <img src={childMapPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </Box>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mt={0.5}>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>{childMapFile?.name}</Typography>
                        <Button size="small" onClick={clearChildMapFile}
                          sx={{ color: 'rgba(255,100,100,0.6)', minWidth: 'auto', fontSize: '0.75rem' }}>Удалить</Button>
                      </Box>
                    </>
                  ) : (
                    <Button component="label" fullWidth variant="outlined" startIcon={<ImageIcon />} size="small"
                      sx={{ borderColor: 'rgba(187,143,206,0.2)', color: 'rgba(187,143,206,0.6)', borderStyle: 'dashed', py: 1.5,
                        '&:hover': { borderColor: 'rgba(187,143,206,0.4)', backgroundColor: 'rgba(187,143,206,0.05)' } }}>
                      Загрузить изображение карты
                      <input type="file" hidden accept="image/*" onChange={handleChildMapFileChange} />
                    </Button>
                  )}
                </Box>
              )}
            </Box>
          )}

          <FormControl fullWidth margin="normal">
            <InputLabel>Иконка</InputLabel>
            <Select value={markerForm.icon} label="Иконка"
              onChange={e => setMarkerForm(prev => ({ ...prev, icon: e.target.value }))}>
              {MARKER_ICON_ENTRIES.map(([key, emoji]) => (
                <MenuItem key={key} value={key}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography fontSize="1.2rem">{emoji}</Typography>
                    <Typography>{key}</Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.6)', mt: 2, mb: 1 }}>Цвет</Typography>
          <Box display="flex" gap={1} flexWrap="wrap">
            {MARKER_COLORS.map(color => (
              <Box key={color} onClick={() => setMarkerForm(prev => ({ ...prev, color }))}
                sx={{
                  width: 32, height: 32, borderRadius: '50%', backgroundColor: color, cursor: 'pointer',
                  border: markerForm.color === color ? '3px solid #fff' : '2px solid transparent',
                  transition: 'all 0.15s', '&:hover': { transform: 'scale(1.2)' },
                }} />
            ))}
          </Box>

          <Box display="flex" alignItems="center" gap={1} mt={2} p={1.5}
            sx={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 1 }}>
            <Box sx={{
              width: 36, height: 36, borderRadius: '50%', backgroundColor: markerForm.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
              boxShadow: `0 0 8px ${markerForm.color}80`,
            }}>
              {MARKER_ICONS[markerForm.icon] || '📍'}
            </Box>
            <Box>
              <Typography sx={{ color: '#fff', fontWeight: 600 }}>
                {markerForm.title || 'Превью маркера'}
              </Typography>
              {markerForm.linkedNoteId && (
                <Typography variant="caption" sx={{ color: '#4ECDC4' }}>
                  📎 {notesMap.get(markerForm.linkedNoteId)?.title}
                </Typography>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeDialog} color="inherit">Отмена</Button>
          <DndButton variant="contained" onClick={handleSaveMarker} disabled={!markerForm.title.trim()}>
            {editingMarker ? 'Сохранить' : 'Добавить'}
          </DndButton>
        </DialogActions>
      </Dialog>

      {/* ==================== Territory Dialog ==================== */}
      <Dialog open={territoryDialogOpen} onClose={closeTerritoryDialog} maxWidth="sm" fullWidth
        PaperProps={{ sx: { backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)' } }}>
        <DialogTitle sx={{ fontFamily: '"Cinzel", serif' }}>
          {editingTerritory ? 'Редактировать территорию' : 'Новая территория'}
        </DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Название территории" value={territoryForm.name}
            onChange={e => setTerritoryForm(prev => ({ ...prev, name: e.target.value }))} margin="normal" />
          <TextField fullWidth label="Описание" value={territoryForm.description}
            onChange={e => setTerritoryForm(prev => ({ ...prev, description: e.target.value }))}
            margin="normal" multiline rows={3} />

          {/* Faction */}
          <Autocomplete
            options={factions}
            getOptionLabel={o => o.name}
            value={factions.find(f => f.id === territoryForm.factionId) || null}
            onChange={(_, v) => {
              setTerritoryForm(prev => ({
                ...prev,
                factionId: v?.id || null,
                ...(v ? { color: v.color, borderColor: v.color } : {}),
              }));
            }}
            renderInput={params => (
              <TextField {...params} label="Принадлежность (фракция)" margin="normal" placeholder="Выберите фракцию..." />
            )}
            renderOption={(props, option) => (
              <li {...props}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: option.color }} />
                  <Typography>{option.name}</Typography>
                  <Chip label={option.type} size="small" variant="outlined"
                    sx={{ ml: 'auto', fontSize: '0.7rem', height: 20 }} />
                </Box>
              </li>
            )}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            noOptionsText="Нет фракций" clearText="Очистить" sx={{ mt: 1 }}
          />

          {/* Fill color */}
          <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.6)', mt: 2, mb: 1 }}>Цвет заливки</Typography>
          <Box display="flex" gap={0.8} flexWrap="wrap">
            {TERRITORY_COLORS.map(color => (
              <Box key={color} onClick={() => setTerritoryForm(prev => ({ ...prev, color }))}
                sx={{
                  width: 28, height: 28, borderRadius: '50%', backgroundColor: color, cursor: 'pointer',
                  border: territoryForm.color === color ? '3px solid #fff' : '2px solid transparent',
                  transition: 'all 0.15s', '&:hover': { transform: 'scale(1.2)' },
                }} />
            ))}
          </Box>

          {/* Opacity */}
          <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.6)', mt: 2.5, mb: 0.5 }}>
            Прозрачность: {Math.round(territoryForm.opacity * 100)}%
          </Typography>
          <Slider
            value={territoryForm.opacity}
            onChange={(_, v) => setTerritoryForm(prev => ({ ...prev, opacity: v as number }))}
            min={0.05} max={1} step={0.05}
            sx={{
              color: territoryForm.color,
              '& .MuiSlider-thumb': { width: 16, height: 16 },
            }}
          />

          {/* Border color */}
          <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.6)', mt: 1.5, mb: 1 }}>Цвет границы</Typography>
          <Box display="flex" gap={0.8} flexWrap="wrap">
            {TERRITORY_COLORS.map(color => (
              <Box key={color} onClick={() => setTerritoryForm(prev => ({ ...prev, borderColor: color }))}
                sx={{
                  width: 28, height: 28, borderRadius: '50%', backgroundColor: color, cursor: 'pointer',
                  border: territoryForm.borderColor === color ? '3px solid #fff' : '2px solid transparent',
                  transition: 'all 0.15s', '&:hover': { transform: 'scale(1.2)' },
                }} />
            ))}
          </Box>

          {/* Border width */}
          <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.6)', mt: 2, mb: 0.5 }}>
            Толщина границы: {territoryForm.borderWidth}px
          </Typography>
          <Slider
            value={territoryForm.borderWidth}
            onChange={(_, v) => setTerritoryForm(prev => ({ ...prev, borderWidth: v as number }))}
            min={0.5} max={5} step={0.5}
            sx={{
              color: territoryForm.borderColor,
              '& .MuiSlider-thumb': { width: 16, height: 16 },
            }}
          />

          {/* Preview */}
          <Box mt={2} p={2} sx={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 1 }}>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', mb: 1, display: 'block' }}>Превью</Typography>
            <svg width="100%" height="60" viewBox="0 0 200 60">
              <polygon
                points="20,50 50,10 100,5 150,15 180,45 140,55 60,55"
                fill={`rgba(${hexToRgb(territoryForm.color)}, ${territoryForm.opacity})`}
                stroke={territoryForm.borderColor}
                strokeWidth={territoryForm.borderWidth}
                strokeLinejoin="round"
              />
              <text x="100" y="35" textAnchor="middle" fill="white" fontSize="11" fontWeight="600">
                {territoryForm.name || 'Территория'}
              </text>
            </svg>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeTerritoryDialog} color="inherit">Отмена</Button>
          <DndButton variant="contained" onClick={handleSaveTerritory} disabled={!territoryForm.name.trim()}>
            {editingTerritory ? 'Сохранить' : 'Создать'}
          </DndButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};