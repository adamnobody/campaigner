import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  Box, Typography, TextField, Button, Dialog,
  DialogTitle, DialogContent, DialogActions, IconButton,
  Select, MenuItem, FormControl, InputLabel, Autocomplete,
  Chip, Divider,
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
import { useParams, useNavigate } from 'react-router-dom';
import { mapApi, projectsApi, notesApi } from '@/api/axiosClient';
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

const MIN_ZOOM = 0.2;
const MAX_ZOOM = 5;
const ZOOM_SPEED = 0.1;
const DRAG_THRESHOLD = 4;
const PANEL_WIDTH = 340;
const DEFAULT_FORM = {
  title: '', description: '', icon: 'custom', color: MARKER_COLORS[0] as string,
  linkedNoteId: null as number | null, createChildMap: false,
};

// ==================== Static styles ====================
const sxDivider = { borderColor: 'rgba(255,255,255,0.06)', my: 1.5 } as const;
const sxSectionLabel = { color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 } as const;
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
interface MapData {
  id: number; projectId: number; parentMapId: number | null;
  parentMarkerId: number | null; name: string; imagePath: string | null;
}
interface NoteOption { id: number; title: string; noteType: string; }

// ==================== Helpers (pure) ====================
const extractData = (res: any): any => res.data?.data || res.data;

const normalizeMarker = (m: any): Marker => ({
  id: m.id, title: m.title, description: m.description || '',
  x: (m.positionX ?? 0) * 100, y: (m.positionY ?? 0) * 100,
  icon: m.icon || 'custom', color: m.color || MARKER_COLORS[0],
  linkedNoteId: m.linkedNoteId || null, childMapId: m.childMapId || null,
});

const normalizeMap = (m: any): MapData => ({
  id: m.id, projectId: m.projectId || m.project_id,
  parentMapId: m.parentMapId || m.parent_map_id || null,
  parentMarkerId: m.parentMarkerId || m.parent_marker_id || null,
  name: m.name, imagePath: m.imagePath || m.image_path || null,
});

const parseMarkers = (data: any): Marker[] =>
  (Array.isArray(data) ? data : []).map(normalizeMarker);

const parseNotes = (data: any): NoteOption[] => {
  const list = data?.items || (Array.isArray(data) ? data : []);
  return list.map((n: any) => ({ id: n.id, title: n.title, noteType: n.noteType }));
};

const preloadImage = (src: string): Promise<void> =>
  new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = src;
    setTimeout(resolve, 3000);
  });

// ==================== Component ====================
export const MapPage: React.FC = () => {
  const { projectId, mapId } = useParams<{ projectId: string; mapId?: string }>();
  const pid = parseInt(projectId!);
  const mid = mapId ? parseInt(mapId) : null;
  const navigate = useNavigate();
  const { showSnackbar, showConfirmDialog } = useUIStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Data
  const [project, setProject] = useState<any>(null);
  const [currentMap, setCurrentMap] = useState<MapData | null>(null);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [notes, setNotes] = useState<NoteOption[]>([]);
  const [mapBreadcrumbs, setMapBreadcrumbs] = useState<MapData[]>([]);
  const [loading, setLoading] = useState(true);
  const [transitioning, setTransitioning] = useState(false);

  // Transform
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const panOriginRef = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(zoom);
  const panRef = useRef(pan);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { panRef.current = pan; }, [pan]);

  // Drag
  const [draggingMarker, setDraggingMarker] = useState<Marker | null>(null);
  const [dragPreview, setDragPreview] = useState<{ x: number; y: number } | null>(null);
  const dragStartScreenRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const didDragRef = useRef(false);

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMarker, setEditingMarker] = useState<Marker | null>(null);
  const [clickPos, setClickPos] = useState<{ x: number; y: number } | null>(null);
  const [markerForm, setMarkerForm] = useState({ ...DEFAULT_FORM });
  const [childMapFile, setChildMapFile] = useState<File | null>(null);
  const [childMapPreview, setChildMapPreview] = useState<string | null>(null);

  // Panel
  const [selectedMarker, setSelectedMarker] = useState<Marker | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Lookup map for notes — O(1) вместо .find() на каждый рендер
  const notesMap = useMemo(() => {
    const m = new Map<number, NoteOption>();
    notes.forEach(n => m.set(n.id, n));
    return m;
  }, [notes]);

  const getLinkedNote = useCallback((noteId: number | null) =>
    noteId ? notesMap.get(noteId) : undefined
  , [notesMap]);

  const mapImageUrl = useMemo(() =>
    currentMap?.imagePath ? `/api${currentMap.imagePath}` : project?.mapImagePath || null
  , [currentMap?.imagePath, project?.mapImagePath]);

  // ==================== Data loading ====================
  const loadMapData = useCallback(async (loadMapId: number) => {
    setTransitioning(true);
    setSelectedMarker(null);
    setPanelOpen(false);

    try {
      const mapRes = await mapApi.getMapById(loadMapId);
      const mapData = normalizeMap(extractData(mapRes));

      const [markersRes, notesRes] = await Promise.all([
        mapApi.getMarkersByMapId(mapData.id),
        notesApi.getAll(pid),
      ]);

      const newMarkers = parseMarkers(extractData(markersRes));
      const newNotes = parseNotes(extractData(notesRes));

      if (mapData.imagePath) {
        await preloadImage(`/api${mapData.imagePath}`);
      }

      setCurrentMap(mapData);
      setMarkers(newMarkers);
      setNotes(newNotes);
      setZoom(1);
      setPan({ x: 0, y: 0 });
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

        const [markersRes, notesRes] = await Promise.all([
          mapApi.getMarkersByMapId(mapToLoad.id),
          notesApi.getAll(pid),
        ]);
        if (cancelled) return;

        setMarkers(parseMarkers(extractData(markersRes)));
        setNotes(parseNotes(extractData(notesRes)));
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

      const updater = (m: Marker) => m.id === marker.id ? { ...m, childMapId: newMap.id } : m;
      setMarkers(prev => prev.map(updater));
      if (selectedMarker?.id === marker.id) {
        setSelectedMarker(prev => prev ? { ...prev, childMapId: newMap.id } : prev);
      }
      showSnackbar('Вложенная карта создана', 'success');
    } catch {
      showSnackbar('Ошибка создания карты', 'error');
    }
  }, [currentMap, pid, selectedMarker?.id, showSnackbar]);

  const handleUploadChildMapImage = useCallback(async (marker: Marker, file: File) => {
    if (!marker.childMapId) return;
    try {
      await mapApi.uploadMapImage(marker.childMapId, file);
      showSnackbar('Изображение загружено. Откройте вложенную карту чтобы увидеть.', 'success');
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
      const oldPan = panRef.current;

      const nx = cx - ((cx - oldPan.x) / oldZoom) * newZoom;
      const ny = cy - ((cy - oldPan.y) / oldZoom) * newZoom;

      zoomRef.current = newZoom;
      panRef.current = { x: nx, y: ny };
      setZoom(newZoom);
      setPan({ x: nx, y: ny });
    };

    container.addEventListener('wheel', onWheel, { passive: false });
    return () => container.removeEventListener('wheel', onWheel);
  }, [loading]);

  const zoomToCenter = useCallback((newZoom: number) => {
    const container = containerRef.current;
    if (!container) { setZoom(newZoom); return; }
    const rect = container.getBoundingClientRect();
    const cx = rect.width / 2, cy = rect.height / 2;
    setZoom(newZoom);
    setPan({
      x: cx - ((cx - panRef.current.x) / zoomRef.current) * newZoom,
      y: cy - ((cy - panRef.current.y) / zoomRef.current) * newZoom,
    });
  }, []);

  const zoomIn = useCallback(() => zoomToCenter(Math.min(MAX_ZOOM, zoomRef.current + 0.2)), [zoomToCenter]);
  const zoomOut = useCallback(() => zoomToCenter(Math.max(MIN_ZOOM, zoomRef.current - 0.2)), [zoomToCenter]);
  const resetView = useCallback(() => { setZoom(1); setPan({ x: 0, y: 0 }); }, []);

  // ==================== Pan & Drag ====================
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsPanning(true);
      panStartRef.current = { x: e.clientX, y: e.clientY };
      panOriginRef.current = { ...panRef.current };
      e.preventDefault();
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: panOriginRef.current.x + e.clientX - panStartRef.current.x,
        y: panOriginRef.current.y + e.clientY - panStartRef.current.y,
      });
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
  }, [isPanning, draggingMarker]);

  const handleMouseUp = useCallback(async () => {
    setIsPanning(false);

    if (isDraggingRef.current && draggingMarker) {
      isDraggingRef.current = false;

      if (didDragRef.current && dragPreview) {
        try {
          await mapApi.updateMarker(draggingMarker.id, {
            positionX: dragPreview.x / 100, positionY: dragPreview.y / 100,
          });
          const pos = { x: dragPreview.x, y: dragPreview.y };
          setMarkers(prev => prev.map(m => m.id === draggingMarker.id ? { ...m, ...pos } : m));
          if (selectedMarker?.id === draggingMarker.id) {
            setSelectedMarker(prev => prev ? { ...prev, ...pos } : prev);
          }
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
    if (e.button !== 0 || e.altKey) return;
    e.stopPropagation();
    isDraggingRef.current = true;
    didDragRef.current = false;
    dragStartScreenRef.current = { x: e.clientX, y: e.clientY };
    setDraggingMarker(marker);
    setDragPreview(null);
  }, []);

  const handleMarkerClick = useCallback((e: React.MouseEvent, marker: Marker) => {
    e.stopPropagation();
    if (didDragRef.current || transitioning) return;

    // Откладываем одинарный клик — если за 250ms придёт двойной, отменяем
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    clickTimerRef.current = setTimeout(() => {
      clickTimerRef.current = null;
      setSelectedMarker(marker);
      setPanelOpen(true);
    }, 250);
  }, [transitioning]);

  const handleMapClick = useCallback((e: React.MouseEvent) => {
    if (isPanning || didDragRef.current || transitioning) return;
    if (!imgRef.current || !currentMap) return;

    const rect = imgRef.current.getBoundingClientRect();
    setClickPos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
    setEditingMarker(null);
    setMarkerForm({ ...DEFAULT_FORM });
    setChildMapFile(null);
    setChildMapPreview(null);
    setDialogOpen(true);
  }, [isPanning, transitioning, currentMap]);

  // ==================== CRUD ====================
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
  }, []);

  const closeDialog = useCallback(() => setDialogOpen(false), []);

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
  const scale = 1 / zoom;

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
          // Отменяем одинарный клик
          if (clickTimerRef.current) {
            clearTimeout(clickTimerRef.current);
            clickTimerRef.current = null;
          }
          if (hasChildMap) navigateToChildMap(marker.childMapId!);
        }}
        sx={{
          position: 'absolute', left: `${dx}%`, top: `${dy}%`,
          transform: `translate(-50%, -50%) scale(${scale})`,
          cursor: isDragging ? 'grabbing' : 'grab',
          zIndex: isDragging ? 100 : isSelected ? 10 : 5,
          opacity: isDragging ? 0.85 : 1,
          transition: isDragging ? 'none' : 'transform 0.15s',
          '&:hover': {
            transform: `translate(-50%, -50%) scale(${isDragging ? scale : scale * 1.3})`,
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

  // ==================== Right Panel ====================
  const renderPanel = () => {
    if (!selectedMarker) return null;
    const linkedNote = getLinkedNote(selectedMarker.linkedNoteId);
    const hasChildMap = !!selectedMarker.childMapId;

    return (
      <Box sx={sxPanelRoot}>
        {/* Header */}
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
            <Typography sx={{
              fontWeight: 700, color: '#fff', fontSize: '1rem',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
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

        {/* Content */}
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

          {/* Linked Note */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" sx={sxSectionLabel}>Привязанная заметка</Typography>
            {linkedNote ? (
              <Box
                onClick={() => navigate(`/project/${pid}/notes/${linkedNote.id}`)}
                sx={{
                  mt: 1, p: 1.5, borderRadius: 1,
                  backgroundColor: 'rgba(78,205,196,0.08)',
                  border: '1px solid rgba(78,205,196,0.2)',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 1,
                  '&:hover': { backgroundColor: 'rgba(78,205,196,0.15)' },
                }}
              >
                <DescriptionIcon sx={{ fontSize: 18, color: '#4ECDC4' }} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{
                    color: '#4ECDC4', fontWeight: 600,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
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

          {/* Child Map */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" sx={sxSectionLabel}>Вложенная карта</Typography>
            {hasChildMap ? (
              <Box sx={{ mt: 1 }}>
                <Button
                  fullWidth variant="outlined" startIcon={<MapIcon />}
                  onClick={() => navigateToChildMap(selectedMarker.childMapId!)}
                  sx={{
                    borderColor: 'rgba(187,143,206,0.3)', color: '#BB8FCE',
                    justifyContent: 'flex-start',
                    '&:hover': { borderColor: 'rgba(187,143,206,0.5)', backgroundColor: 'rgba(187,143,206,0.08)' },
                  }}
                >
                  Открыть вложенную карту
                </Button>
                <Button
                  component="label" fullWidth variant="text" startIcon={<ImageIcon />} size="small"
                  sx={{ mt: 0.5, color: 'rgba(255,255,255,0.4)', justifyContent: 'flex-start' }}
                >
                  Загрузить изображение
                  <input type="file" hidden accept="image/*"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadChildMapImage(selectedMarker, f); }}
                  />
                </Button>
              </Box>
            ) : (
              <Box sx={{ mt: 1 }}>
                <Button
                  fullWidth variant="outlined" startIcon={<AddIcon />} size="small"
                  onClick={() => handleCreateChildMap(selectedMarker)}
                  sx={{
                    borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)',
                    borderStyle: 'dashed', justifyContent: 'flex-start',
                    '&:hover': { borderColor: 'rgba(187,143,206,0.4)', color: '#BB8FCE' },
                  }}
                >
                  Создать вложенную карту
                </Button>
              </Box>
            )}
          </Box>

          <Divider sx={sxDivider} />

          {/* Info */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" sx={sxSectionLabel}>Информация</Typography>
            <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {[
                ['Иконка', `${MARKER_ICONS[selectedMarker.icon] || '📍'} ${selectedMarker.icon}`],
                ['Позиция', `${selectedMarker.x.toFixed(1)}%, ${selectedMarker.y.toFixed(1)}%`],
              ].map(([label, value]) => (
                <Box key={label} display="flex" justifyContent="space-between">
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)' }}>{label}</Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>{value}</Typography>
                </Box>
              ))}
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)' }}>Цвет</Typography>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: selectedMarker.color }} />
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>{selectedMarker.color}</Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Footer */}
        <Box sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: 1 }}>
          <Button
            fullWidth variant="outlined" startIcon={<EditIcon />} size="small"
            onClick={() => handleEditMarker(selectedMarker)}
            sx={{ borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)' }}
          >
            Редактировать
          </Button>
          <Button
            variant="outlined" size="small"
            onClick={() => handleDeleteMarker(selectedMarker)}
            sx={{
              borderColor: 'rgba(255,100,100,0.2)', color: 'rgba(255,100,100,0.6)',
              minWidth: 'auto', px: 1.5,
              '&:hover': { borderColor: 'rgba(255,100,100,0.4)', backgroundColor: 'rgba(255,100,100,0.05)' },
            }}
          >
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
          <Box display="flex" gap={0.5} sx={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 1, p: 0.5 }}>
            <IconButton size="small" onClick={zoomOut} sx={{ color: '#fff' }}><ZoomOutIcon fontSize="small" /></IconButton>
            <Typography sx={{ color: '#fff', fontSize: '0.8rem', lineHeight: '30px', px: 1, minWidth: 40, textAlign: 'center' }}>
              {Math.round(zoom * 100)}%
            </Typography>
            <IconButton size="small" onClick={zoomIn} sx={{ color: '#fff' }}><ZoomInIcon fontSize="small" /></IconButton>
            <IconButton size="small" onClick={resetView} sx={{ color: '#fff' }}><CenterFocusStrongIcon fontSize="small" /></IconButton>
          </Box>
          <Chip
            icon={<DragIndicatorIcon sx={{ fontSize: 14 }} />}
            label={`${markers.length} маркеров`} size="small" variant="outlined"
            sx={{ borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)' }}
          />
          <Button component="label" variant="outlined" startIcon={<CloudUploadIcon />} size="small"
            sx={{ borderColor: 'rgba(255,255,255,0.2)', color: '#fff' }}>
            Загрузить карту
            <input type="file" hidden accept="image/*" onChange={handleUploadMap} />
          </Button>
        </Box>
      </Box>

      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)', mb: 1, display: 'block' }}>
        Клик — добавить маркер · Перетаскивание — переместить · Двойной клик по маркеру — вложенная карта · Alt+drag / СКМ — пан · Колёсико — зум
      </Typography>

      {/* Map + Panel */}
      <Box sx={{ ...sxMapContainer, position: 'relative' }}>
        <Box
          ref={containerRef}
          sx={{
            width: '100%', height: '100%', overflow: 'hidden',
            backgroundColor: '#0a0a14',
            position: 'relative',
            cursor: isPanning ? 'grabbing' : (draggingMarker && didDragRef.current) ? 'grabbing' : 'crosshair',
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {mapImageUrl ? (
            <Box sx={{
              position: 'absolute', transformOrigin: '0 0',
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transition: 'none',
            }}>
              <img
                ref={imgRef} src={mapImageUrl} alt="Map"
                onClick={handleMapClick}
                style={{
                  display: 'block',
                  maxWidth: containerRef.current?.clientWidth || '100%',
                  maxHeight: containerRef.current?.clientHeight || 'calc(100vh - 200px)',
                  userSelect: 'none', pointerEvents: 'auto',
                }}
                draggable={false}
              />
              {markers.map(renderMarker)}
            </Box>
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

        {/* Right Panel — absolute, не влияет на размер контейнера карты */}
        {panelOpen && selectedMarker && (
          <Box sx={{
            position: 'absolute', top: 0, right: 0, bottom: 0,
            zIndex: 20,
          }}>
            {renderPanel()}
          </Box>
        )}
      </Box>
      {/* Dialog */}
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
              <TextField {...params} label="Привязанная заметка" margin="normal" placeholder="Начните вводить название..." />
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

          {/* Child map checkbox */}
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
                          sx={{ color: 'rgba(255,100,100,0.6)', minWidth: 'auto', fontSize: '0.75rem' }}>
                          Удалить
                        </Button>
                      </Box>
                    </>
                  ) : (
                    <Button component="label" fullWidth variant="outlined" startIcon={<ImageIcon />} size="small"
                      sx={{
                        borderColor: 'rgba(187,143,206,0.2)', color: 'rgba(187,143,206,0.6)',
                        borderStyle: 'dashed', py: 1.5,
                        '&:hover': { borderColor: 'rgba(187,143,206,0.4)', backgroundColor: 'rgba(187,143,206,0.05)' },
                      }}>
                      Загрузить изображение карты
                      <input type="file" hidden accept="image/*" onChange={handleChildMapFileChange} />
                    </Button>
                  )}
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.2)', display: 'block', mt: 0.5 }}>
                    Можно загрузить позже через панель маркера
                  </Typography>
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

          {/* Preview */}
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
    </Box>
  );
};