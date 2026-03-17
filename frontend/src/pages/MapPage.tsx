import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  Box, Typography, Paper, TextField, Button, Dialog,
  DialogTitle, DialogContent, DialogActions, IconButton,
  Select, MenuItem, FormControl, InputLabel, Autocomplete,
  Chip, Drawer, Divider, Tooltip,
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

const MARKER_ICONS: Record<string, string> = {
  castle: '🏰', city: '🏙️', village: '🏘️', tavern: '🍺',
  dungeon: '⚔️', forest: '🌲', mountain: '⛰️', river: '🌊',
  cave: '🕳️', temple: '⛪', ruins: '🏚️', port: '⚓',
  bridge: '🌉', tower: '🗼', camp: '🏕️', battlefield: '⚔️',
  mine: '⛏️', farm: '🌾', graveyard: '💀', custom: '📍',
};

const MARKER_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#BB8FCE', '#85C1E9', '#F8C471', '#82E0AA',
];

interface Marker {
  id: number;
  title: string;
  description: string;
  x: number;
  y: number;
  icon: string;
  color: string;
  linkedNoteId: number | null;
  childMapId: number | null;
}

interface MapData {
  id: number;
  projectId: number;
  parentMapId: number | null;
  parentMarkerId: number | null;
  name: string;
  imagePath: string | null;
}

interface NoteOption {
  id: number;
  title: string;
  noteType: string;
}

const MIN_ZOOM = 0.2;
const MAX_ZOOM = 5;
const ZOOM_SPEED = 0.1;
const DRAG_THRESHOLD = 4;
const PANEL_WIDTH = 340;

export const MapPage: React.FC = () => {
  const { projectId, mapId } = useParams<{ projectId: string; mapId?: string }>();
  const pid = parseInt(projectId!);
  const mid = mapId ? parseInt(mapId) : null;
  const navigate = useNavigate();
  const { showSnackbar, showConfirmDialog } = useUIStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const [project, setProject] = useState<any>(null);
  const [currentMap, setCurrentMap] = useState<MapData | null>(null);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [loading, setLoading] = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  const [notes, setNotes] = useState<NoteOption[]>([]);

  // Breadcrumbs для навигации по вложенным картам
  const [mapBreadcrumbs, setMapBreadcrumbs] = useState<MapData[]>([]);

  // Transform state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const panOriginRef = useRef({ x: 0, y: 0 });

  const zoomRef = useRef(zoom);
  const panRef = useRef(pan);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { panRef.current = pan; }, [pan]);

  // Drag state
  const [draggingMarker, setDraggingMarker] = useState<Marker | null>(null);
  const [dragPreview, setDragPreview] = useState<{ x: number; y: number } | null>(null);
  const dragStartScreenRef = useRef({ x: 0, y: 0 });
  const dragStartMarkerRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const didDragRef = useRef(false);

  // Marker dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMarker, setEditingMarker] = useState<Marker | null>(null);
  const [clickPos, setClickPos] = useState<{ x: number; y: number } | null>(null);
  const [markerForm, setMarkerForm] = useState({
    title: '', description: '', icon: 'custom', color: MARKER_COLORS[0],
    linkedNoteId: null as number | null, createChildMap: false,
  });
  const [childMapFile, setChildMapFile] = useState<File | null>(null);
  const [childMapPreview, setChildMapPreview] = useState<string | null>(null);

  // Right panel
  const [selectedMarker, setSelectedMarker] = useState<Marker | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  // ==================== Helpers ====================
  const extractData = (res: any): any => res.data?.data || res.data;

  const normalizeMarker = (m: any): Marker => ({
    id: m.id,
    title: m.title,
    description: m.description || '',
    x: (m.positionX ?? 0) * 100,
    y: (m.positionY ?? 0) * 100,
    icon: m.icon || 'custom',
    color: m.color || MARKER_COLORS[0],
    linkedNoteId: m.linkedNoteId || null,
    childMapId: m.childMapId || null,
  });

  const normalizeMap = (m: any): MapData => ({
    id: m.id,
    projectId: m.projectId || m.project_id,
    parentMapId: m.parentMapId || m.parent_map_id || null,
    parentMarkerId: m.parentMarkerId || m.parent_marker_id || null,
    name: m.name,
    imagePath: m.imagePath || m.image_path || null,
  });

  // ==================== Загрузка карты ====================
  const loadMapData = useCallback(async (mapId: number) => {
    setTransitioning(true);
    setSelectedMarker(null);
    setPanelOpen(false);

    try {
      // Загружаем все данные ДО обновления стейта
      const mapRes = await mapApi.getMapById(mapId);
      const mapData = normalizeMap(extractData(mapRes));

      const [markersRes, notesRes] = await Promise.all([
        mapApi.getMarkersByMapId(mapData.id),
        notesApi.getAll(pid),
      ]);

      const markersData = extractData(markersRes);
      const newMarkers = (Array.isArray(markersData) ? markersData : []).map(normalizeMarker);

      const notesData = extractData(notesRes);
      const notesList = notesData?.items || (Array.isArray(notesData) ? notesData : []);
      const newNotes = notesList.map((n: any) => ({ id: n.id, title: n.title, noteType: n.noteType }));

      // Предзагружаем изображение если есть
      if (mapData.imagePath) {
        await new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = `/api${mapData.imagePath}`;
          // Таймаут на случай долгой загрузки
          setTimeout(resolve, 3000);
        });
      }

      // Обновляем всё разом
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
    const init = async () => {
      try {
        const projRes = await projectsApi.getById(pid);
        setProject(extractData(projRes));

        let mapToLoad: MapData;

        if (mid) {
          const mapRes = await mapApi.getMapById(mid);
          mapToLoad = normalizeMap(extractData(mapRes));
        } else {
          try {
            const mapRes = await mapApi.getRootMap(pid);
            mapToLoad = normalizeMap(extractData(mapRes));
          } catch {
            const createRes = await mapApi.createMap({
              projectId: pid,
              name: 'Корневая карта',
            });
            mapToLoad = normalizeMap(extractData(createRes));
          }
        }

        setCurrentMap(mapToLoad);
        setMapBreadcrumbs([mapToLoad]);

        const [markersRes, notesRes] = await Promise.all([
          mapApi.getMarkersByMapId(mapToLoad.id),
          notesApi.getAll(pid),
        ]);

        const markersData = extractData(markersRes);
        setMarkers((Array.isArray(markersData) ? markersData : []).map(normalizeMarker));

        const notesData = extractData(notesRes);
        const notesList = notesData?.items || (Array.isArray(notesData) ? notesData : []);
        setNotes(notesList.map((n: any) => ({ id: n.id, title: n.title, noteType: n.noteType })));
      } catch {
        // ignore
      }
      setLoading(false);
    };

    init();
  }, [pid, mid]);

  // ==================== Навигация по вложенным картам ====================
  const navigateToChildMap = async (childMapId: number) => {
    // Сначала получаем данные для breadcrumb
    const mapRes = await mapApi.getMapById(childMapId);
    const childMap = normalizeMap(extractData(mapRes));
    setMapBreadcrumbs(prev => [...prev, childMap]);

    await loadMapData(childMapId);
  };

  const navigateToBreadcrumb = async (index: number) => {
    const target = mapBreadcrumbs[index];
    if (!target) return;
    await loadMapData(target.id);
    setMapBreadcrumbs(prev => prev.slice(0, index + 1));
  };

  const navigateToParent = () => {
    if (mapBreadcrumbs.length > 1) {
      navigateToBreadcrumb(mapBreadcrumbs.length - 2);
    }
  };

  // ==================== Создание вложенной карты ====================
  const handleCreateChildMap = async (marker: Marker) => {
    try {
      if (!currentMap) return;
      const res = await mapApi.createMap({
        projectId: pid,
        parentMapId: currentMap.id,
        parentMarkerId: marker.id,
        name: `Карта: ${marker.title}`,
      });
      const newMap = normalizeMap(extractData(res));

      // Привязываем child_map_id к маркеру
      await mapApi.updateMarker(marker.id, { childMapId: newMap.id });

      // Обновляем маркер в стейте
      setMarkers(prev => prev.map(m =>
        m.id === marker.id ? { ...m, childMapId: newMap.id } : m
      ));
      if (selectedMarker?.id === marker.id) {
        setSelectedMarker(prev => prev ? { ...prev, childMapId: newMap.id } : prev);
      }

      showSnackbar('Вложенная карта создана', 'success');
    } catch {
      showSnackbar('Ошибка создания карты', 'error');
    }
  };

  const handleUploadChildMapImage = async (marker: Marker, file: File) => {
    if (!marker.childMapId) return;
    try {
      await mapApi.uploadMapImage(marker.childMapId, file);
      showSnackbar('Изображение загружено. Откройте вложенную карту чтобы увидеть.', 'success');
    } catch {
      showSnackbar('Ошибка загрузки изображения', 'error');
    }
  };

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
      const cursorX = e.clientX - rect.left;
      const cursorY = e.clientY - rect.top;
      const oldPan = panRef.current;
      const newPanX = cursorX - ((cursorX - oldPan.x) / oldZoom) * newZoom;
      const newPanY = cursorY - ((cursorY - oldPan.y) / oldZoom) * newZoom;

      zoomRef.current = newZoom;
      panRef.current = { x: newPanX, y: newPanY };
      setZoom(newZoom);
      setPan({ x: newPanX, y: newPanY });
    };

    container.addEventListener('wheel', onWheel, { passive: false });
    return () => container.removeEventListener('wheel', onWheel);
  }, [loading]);

  const zoomToCenter = useCallback((newZoom: number) => {
    const container = containerRef.current;
    if (!container) { setZoom(newZoom); return; }
    const rect = container.getBoundingClientRect();
    const cx = rect.width / 2, cy = rect.height / 2;
    const oldZoom = zoomRef.current;
    const oldPan = panRef.current;
    setZoom(newZoom);
    setPan({
      x: cx - ((cx - oldPan.x) / oldZoom) * newZoom,
      y: cy - ((cy - oldPan.y) / oldZoom) * newZoom,
    });
  }, []);

  const zoomIn = () => zoomToCenter(Math.min(MAX_ZOOM, zoomRef.current + 0.2));
  const zoomOut = () => zoomToCenter(Math.max(MIN_ZOOM, zoomRef.current - 0.2));
  const resetView = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  // ==================== Pan ====================
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsPanning(true);
      panStartRef.current = { x: e.clientX, y: e.clientY };
      panOriginRef.current = { ...panRef.current };
      e.preventDefault();
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      setPan({ x: panOriginRef.current.x + dx, y: panOriginRef.current.y + dy });
      return;
    }

    if (isDraggingRef.current && draggingMarker && imgRef.current) {
      const dx = e.clientX - dragStartScreenRef.current.x;
      const dy = e.clientY - dragStartScreenRef.current.y;

      if (!didDragRef.current && Math.sqrt(dx * dx + dy * dy) < DRAG_THRESHOLD) return;
      didDragRef.current = true;

      const rect = imgRef.current.getBoundingClientRect();
      const newX = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      const newY = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
      setDragPreview({ x: newX, y: newY });
    }
  };

  const handleMouseUp = async () => {
    setIsPanning(false);

    if (isDraggingRef.current && draggingMarker) {
      isDraggingRef.current = false;

      if (didDragRef.current && dragPreview) {
        try {
          await mapApi.updateMarker(draggingMarker.id, {
            positionX: dragPreview.x / 100,
            positionY: dragPreview.y / 100,
          });
          setMarkers(prev => prev.map(m =>
            m.id === draggingMarker.id ? { ...m, x: dragPreview.x, y: dragPreview.y } : m
          ));
          if (selectedMarker?.id === draggingMarker.id) {
            setSelectedMarker(prev => prev ? { ...prev, x: dragPreview.x, y: dragPreview.y } : prev);
          }
          showSnackbar('Маркер перемещён', 'success');
        } catch {
          showSnackbar('Ошибка перемещения', 'error');
        }
      }

      setDraggingMarker(null);
      setDragPreview(null);
      didDragRef.current = false;
      return;
    }
  };

  // ==================== Marker interactions ====================
  const handleMarkerMouseDown = (e: React.MouseEvent, marker: Marker) => {
    if (e.button !== 0 || e.altKey) return;
    e.stopPropagation();

    isDraggingRef.current = true;
    didDragRef.current = false;
    dragStartScreenRef.current = { x: e.clientX, y: e.clientY };
    dragStartMarkerRef.current = { x: marker.x, y: marker.y };
    setDraggingMarker(marker);
    setDragPreview(null);
  };

  const handleMarkerClick = (e: React.MouseEvent, marker: Marker) => {
    e.stopPropagation();
    if (!didDragRef.current && !transitioning) {
      setSelectedMarker(marker);
      setPanelOpen(true);
    }
  };

  const handleMapClick = (e: React.MouseEvent) => {
    if (isPanning || didDragRef.current || transitioning) return;
    if (!imgRef.current || !currentMap) return;

    const rect = imgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setClickPos({ x, y });
    setEditingMarker(null);
    setMarkerForm({ title: '', description: '', icon: 'custom', color: MARKER_COLORS[0], linkedNoteId: null, createChildMap: false });
    setChildMapFile(null);
    setChildMapPreview(null);
    setDialogOpen(true);
  };

  // ==================== CRUD ====================
  const handleSaveMarker = async () => {
    if (!markerForm.title.trim()) return;
    try {
      if (editingMarker) {
        const res = await mapApi.updateMarker(editingMarker.id, {
          title: markerForm.title,
          description: markerForm.description,
          positionX: editingMarker.x / 100,
          positionY: editingMarker.y / 100,
          icon: markerForm.icon,
          color: markerForm.color,
          linkedNoteId: markerForm.linkedNoteId,
        });
        const updated = normalizeMarker(extractData(res));
        setMarkers(prev => prev.map(m => m.id === editingMarker.id ? updated : m));
        if (selectedMarker?.id === editingMarker.id) setSelectedMarker(updated);
        showSnackbar('Маркер обновлён', 'success');
} else if (clickPos && currentMap) {
        const res = await mapApi.createMarker(currentMap.id, {
          title: markerForm.title,
          description: markerForm.description,
          positionX: clickPos.x / 100,
          positionY: clickPos.y / 100,
          icon: markerForm.icon,
          color: markerForm.color,
          linkedNoteId: markerForm.linkedNoteId,
        });
        const newMarker = normalizeMarker(extractData(res));

        // Создаём вложенную карту если отмечено
        if (markerForm.createChildMap && currentMap) {
          try {
            const mapRes = await mapApi.createMap({
              projectId: pid,
              parentMapId: currentMap.id,
              parentMarkerId: newMarker.id,
              name: `Карта: ${newMarker.title}`,
            });
            const childMap = normalizeMap(extractData(mapRes));
            await mapApi.updateMarker(newMarker.id, { childMapId: childMap.id });
            newMarker.childMapId = childMap.id;

            // Загружаем изображение если выбрано
            if (childMapFile) {
              try {
                await mapApi.uploadMapImage(childMap.id, childMapFile);
              } catch {
                showSnackbar('Карта создана, но ошибка загрузки изображения', 'warning');
              }
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
  };

  const handleDeleteMarker = (marker: Marker) => {
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
  };

  const handleEditMarker = (marker: Marker) => {
    setEditingMarker(marker);
    setMarkerForm({
      title: marker.title,
      description: marker.description || '',
      icon: marker.icon || 'custom',
      color: marker.color || MARKER_COLORS[0],
      linkedNoteId: marker.linkedNoteId,
      createChildMap: false,
    });
    setChildMapFile(null);
    setChildMapPreview(null);
    setDialogOpen(true);
  };

  const handleUploadMap = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      if (currentMap) {
        await mapApi.uploadMapImage(currentMap.id, file);
        const mapRes = await mapApi.getMapById(currentMap.id);
        const updated = normalizeMap(extractData(mapRes));
        setCurrentMap(updated);

        // Если это корневая карта — обновляем и project.mapImagePath
        if (!updated.parentMapId) {
          await projectsApi.uploadMap(pid, file);
          const projRes = await projectsApi.getById(pid);
          setProject(extractData(projRes));
        }
      }
      showSnackbar('Карта загружена!', 'success');
    } catch {
      showSnackbar('Ошибка загрузки', 'error');
    }
  };

  const getLinkedNote = (noteId: number | null): NoteOption | undefined => {
    if (!noteId) return undefined;
    return notes.find(n => n.id === noteId);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <Typography sx={{ color: 'rgba(255,255,255,0.5)' }}>Загрузка карты...</Typography>
      </Box>
    );
  }

  const mapImageUrl = currentMap?.imagePath
    ? `/api${currentMap.imagePath}`
    : project?.mapImagePath || null;

  // ==================== Render marker ====================
  const renderMarker = (marker: Marker) => {
    const isDragging = draggingMarker?.id === marker.id && didDragRef.current;
    const displayX = isDragging && dragPreview ? dragPreview.x : marker.x;
    const displayY = isDragging && dragPreview ? dragPreview.y : marker.y;

    const scale = 1 / zoom;
    const markerSize = 32;
    const fontSize = 16;
    const borderWidth = 2;
    const labelSize = 11;
    const linkedNote = getLinkedNote(marker.linkedNoteId);
    const hasChildMap = !!marker.childMapId;
    const isSelected = selectedMarker?.id === marker.id;

    return (
      <Box
        key={marker.id}
        onMouseDown={(e) => handleMarkerMouseDown(e, marker)}
        onClick={(e) => handleMarkerClick(e, marker)}
        onDoubleClick={(e) => {
          e.stopPropagation();
          if (marker.childMapId) {
            navigateToChildMap(marker.childMapId);
          }
        }}
        sx={{
          position: 'absolute',
          left: `${displayX}%`,
          top: `${displayY}%`,
          transform: `translate(-50%, -50%) scale(${scale})`,
          cursor: isDragging ? 'grabbing' : 'grab',
          zIndex: isDragging ? 100 : isSelected ? 10 : 5,
          opacity: isDragging ? 0.85 : 1,
          transition: isDragging ? 'none' : 'transform 0.15s',
          '&:hover': {
            transform: isDragging
              ? `translate(-50%, -50%) scale(${scale})`
              : `translate(-50%, -50%) scale(${scale * 1.3})`,
          },
          userSelect: 'none',
        }}
      >
        <Box sx={{
          width: markerSize, height: markerSize, borderRadius: '50%',
          backgroundColor: marker.color || MARKER_COLORS[0],
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: `${fontSize}px`,
          boxShadow: isDragging
            ? `0 0 16px ${marker.color}cc, 0 4px 16px rgba(0,0,0,0.7)`
            : `0 0 8px ${marker.color}80, 0 2px 8px rgba(0,0,0,0.5)`,
          border: isSelected
            ? `${borderWidth}px solid #fff`
            : `${borderWidth}px solid rgba(0,0,0,0.3)`,
        }}>
          {MARKER_ICONS[marker.icon] || MARKER_ICONS.custom}
        </Box>

        {/* Label */}
        <Typography sx={{
          position: 'absolute', top: '100%', left: '50%',
          transform: 'translateX(-50%)',
          mt: '3px',
          fontSize: `${labelSize}px`,
          color: '#fff',
          textShadow: '0 1px 4px rgba(0,0,0,0.9), 0 0 8px rgba(0,0,0,0.7)',
          whiteSpace: 'nowrap', fontWeight: 600, pointerEvents: 'none',
        }}>
          {marker.title}
        </Typography>

        {/* Linked note indicator */}
        {linkedNote && (
          <Box sx={{
            position: 'absolute', top: '-8px', right: '-8px',
            width: 14, height: 14,
            borderRadius: '50%',
            backgroundColor: '#4ECDC4',
            border: '1.5px solid rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
          }}>
            <DescriptionIcon sx={{ fontSize: 8, color: '#fff' }} />
          </Box>
        )}

        {/* Child map indicator */}
        {hasChildMap && (
          <Box sx={{
            position: 'absolute', top: '-8px', left: '-8px',
            width: 14, height: 14,
            borderRadius: '50%',
            backgroundColor: '#BB8FCE',
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
      <Box sx={{
        width: PANEL_WIDTH,
        minWidth: PANEL_WIDTH,
        height: '100%',
        backgroundColor: 'rgba(15,15,28,0.98)',
        borderLeft: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Panel Header */}
        <Box sx={{
          p: 2, display: 'flex', alignItems: 'center', gap: 1,
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}>
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
          <IconButton size="small" onClick={() => { setPanelOpen(false); setSelectedMarker(null); }}
            sx={{ color: 'rgba(255,255,255,0.4)' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Panel Content */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          {/* Description */}
          {selectedMarker.description && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
                Описание
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mt: 0.5, lineHeight: 1.6 }}>
                {selectedMarker.description}
              </Typography>
            </Box>
          )}

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', my: 1.5 }} />

          {/* Linked Note */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
              Привязанная заметка
            </Typography>
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

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', my: 1.5 }} />

          {/* Child Map */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
              Вложенная карта
            </Typography>
            {hasChildMap ? (
              <Box sx={{ mt: 1 }}>
                <Button
                  fullWidth variant="outlined" startIcon={<MapIcon />}
                  onClick={() => navigateToChildMap(selectedMarker.childMapId!)}
                  sx={{
                    borderColor: 'rgba(187,143,206,0.3)',
                    color: '#BB8FCE',
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
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUploadChildMapImage(selectedMarker, file);
                    }}
                  />
                </Button>
              </Box>
            ) : (
              <Box sx={{ mt: 1 }}>
                <Button
                  fullWidth variant="outlined" startIcon={<AddIcon />} size="small"
                  onClick={() => handleCreateChildMap(selectedMarker)}
                  sx={{
                    borderColor: 'rgba(255,255,255,0.15)',
                    color: 'rgba(255,255,255,0.5)',
                    borderStyle: 'dashed',
                    justifyContent: 'flex-start',
                    '&:hover': { borderColor: 'rgba(187,143,206,0.4)', color: '#BB8FCE' },
                  }}
                >
                  Создать вложенную карту
                </Button>
              </Box>
            )}
          </Box>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', my: 1.5 }} />

          {/* Info */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
              Информация
            </Typography>
            <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)' }}>Иконка</Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                  {MARKER_ICONS[selectedMarker.icon] || '📍'} {selectedMarker.icon}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)' }}>Цвет</Typography>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: selectedMarker.color }} />
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                    {selectedMarker.color}
                  </Typography>
                </Box>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)' }}>Позиция</Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                  {selectedMarker.x.toFixed(1)}%, {selectedMarker.y.toFixed(1)}%
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Panel Footer */}
        <Box sx={{
          p: 2, borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', gap: 1,
        }}>
          <Button
            fullWidth variant="outlined" startIcon={<EditIcon />} size="small"
            onClick={() => handleEditMarker(selectedMarker)}
            sx={{ borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)' }}
          >
            Редактировать
          </Button>
          <Button
            variant="outlined" startIcon={<DeleteIcon />} size="small"
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
          {/* Breadcrumbs */}
          <Box display="flex" alignItems="center" gap={0.5}>
            {mapBreadcrumbs.map((bc, i) => (
              <React.Fragment key={bc.id}>
                {i > 0 && <Typography sx={{ color: 'rgba(255,255,255,0.2)', mx: 0.5 }}>›</Typography>}
                <Typography
                  onClick={() => i < mapBreadcrumbs.length - 1 ? navigateToBreadcrumb(i) : null}
                  sx={{
                    fontFamily: '"Cinzel", serif',
                    fontWeight: i === mapBreadcrumbs.length - 1 ? 700 : 400,
                    fontSize: i === mapBreadcrumbs.length - 1 ? '1.3rem' : '0.9rem',
                    color: i === mapBreadcrumbs.length - 1 ? '#fff' : 'rgba(255,255,255,0.4)',
                    cursor: i < mapBreadcrumbs.length - 1 ? 'pointer' : 'default',
                    '&:hover': i < mapBreadcrumbs.length - 1 ? { color: 'rgba(255,255,255,0.7)' } : {},
                  }}
                >
                  {bc.name}
                </Typography>
              </React.Fragment>
            ))}
          </Box>
        </Box>
        <Box display="flex" gap={1} alignItems="center">
          <Box display="flex" gap={0.5} sx={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 1, p: 0.5 }}>
            <IconButton size="small" onClick={zoomOut} sx={{ color: '#fff' }}>
              <ZoomOutIcon fontSize="small" />
            </IconButton>
            <Typography sx={{ color: '#fff', fontSize: '0.8rem', lineHeight: '30px', px: 1, minWidth: 40, textAlign: 'center' }}>
              {Math.round(zoom * 100)}%
            </Typography>
            <IconButton size="small" onClick={zoomIn} sx={{ color: '#fff' }}>
              <ZoomInIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={resetView} sx={{ color: '#fff' }}>
              <CenterFocusStrongIcon fontSize="small" />
            </IconButton>
          </Box>
          <Chip
            icon={<DragIndicatorIcon sx={{ fontSize: 14 }} />}
            label={`${markers.length} маркеров`}
            size="small" variant="outlined"
            sx={{ borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)' }}
          />
          <Button
            component="label" variant="outlined" startIcon={<CloudUploadIcon />} size="small"
            sx={{ borderColor: 'rgba(255,255,255,0.2)', color: '#fff' }}
          >
            Загрузить карту
            <input type="file" hidden accept="image/*" onChange={handleUploadMap} />
          </Button>
        </Box>
      </Box>

      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)', mb: 1, display: 'block' }}>
        Клик — добавить маркер · Перетаскивание — переместить · Двойной клик по маркеру — вложенная карта · Alt+drag / СКМ — пан · Колёсико — зум
      </Typography>

      {/* Map + Panel */}
      <Box sx={{ flexGrow: 1, display: 'flex', overflow: 'hidden', borderRadius: 2, border: '1px solid rgba(255,255,255,0.1)' }}>
        {/* Map area */}
        <Box
          ref={containerRef}
          sx={{
            flexGrow: 1, overflow: 'hidden',
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
              position: 'absolute',
              transformOrigin: '0 0',
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transition: 'none',
            }}>
              <img
                ref={imgRef}
                src={mapImageUrl}
                alt="Map"
                onClick={handleMapClick}
                style={{
                  display: 'block',
                  maxWidth: containerRef.current ? containerRef.current.clientWidth : '100%',
                  maxHeight: containerRef.current ? containerRef.current.clientHeight : 'calc(100vh - 200px)',
                  userSelect: 'none',
                  pointerEvents: 'auto',
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
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(10,10,20,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            backdropFilter: 'blur(4px)',
          }}>
            <Box sx={{ textAlign: 'center' }}>
              <MapIcon sx={{ fontSize: 40, color: 'rgba(187,143,206,0.5)', mb: 1 }} />
              <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>
                Загрузка карты...
              </Typography>
            </Box>
          </Box>
        )}
        {/* Right Panel */}
        {panelOpen && selectedMarker && renderPanel()}
      </Box>

      {/* Add/Edit Marker Dialog */}
      <Dialog
        open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)' } }}
      >
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
            getOptionLabel={(option) => option.title}
            value={notes.find(n => n.id === markerForm.linkedNoteId) || null}
            onChange={(_, newValue) => setMarkerForm(prev => ({ ...prev, linkedNoteId: newValue?.id || null }))}
            renderInput={(params) => (
              <TextField {...params} label="Привязанная заметка" margin="normal"
                placeholder="Начните вводить название..." />
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
            isOptionEqualToValue={(option, value) => option.id === value.id}
            noOptionsText="Нет заметок"
            clearText="Очистить"
            sx={{ mt: 1 }}
          />
          {/* Вложенная карта — только при создании нового маркера */}
          {!editingMarker && (
            <Box sx={{ mt: 2 }}>
              {/* Чекбокс */}
              <Box sx={{
                p: 1.5, borderRadius: 1,
                backgroundColor: markerForm.createChildMap ? 'rgba(187,143,206,0.08)' : 'transparent',
                border: markerForm.createChildMap ? '1px solid rgba(187,143,206,0.3)' : '1px solid rgba(255,255,255,0.08)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': { borderColor: 'rgba(187,143,206,0.4)' },
              }}
                onClick={() => {
                  const next = !markerForm.createChildMap;
                  setMarkerForm(prev => ({ ...prev, createChildMap: next }));
                  if (!next) {
                    setChildMapFile(null);
                    setChildMapPreview(null);
                  }
                }}
              >
                <Box display="flex" alignItems="center" gap={1.5}>
                  <Box sx={{
                    width: 20, height: 20, borderRadius: '4px',
                    border: markerForm.createChildMap ? '2px solid #BB8FCE' : '2px solid rgba(255,255,255,0.2)',
                    backgroundColor: markerForm.createChildMap ? '#BB8FCE' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s',
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

              {/* Загрузка изображения вложенной карты */}
              {markerForm.createChildMap && (
                <Box sx={{ mt: 1.5, ml: 0.5 }}>
                  {childMapPreview ? (
                    <Box sx={{ position: 'relative' }}>
                      <Box sx={{
                        width: '100%', height: 120, borderRadius: 1, overflow: 'hidden',
                        border: '1px solid rgba(187,143,206,0.3)',
                      }}>
                        <img
                          src={childMapPreview}
                          alt="Preview"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </Box>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mt={0.5}>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                          {childMapFile?.name}
                        </Typography>
                        <Button
                          size="small"
                          onClick={() => { setChildMapFile(null); setChildMapPreview(null); }}
                          sx={{ color: 'rgba(255,100,100,0.6)', minWidth: 'auto', fontSize: '0.75rem' }}
                        >
                          Удалить
                        </Button>
                      </Box>
                    </Box>
                  ) : (
                    <Button
                      component="label" fullWidth variant="outlined" startIcon={<ImageIcon />} size="small"
                      sx={{
                        borderColor: 'rgba(187,143,206,0.2)', color: 'rgba(187,143,206,0.6)',
                        borderStyle: 'dashed', py: 1.5,
                        '&:hover': { borderColor: 'rgba(187,143,206,0.4)', backgroundColor: 'rgba(187,143,206,0.05)' },
                      }}
                    >
                      Загрузить изображение карты
                      <input type="file" hidden accept="image/*" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setChildMapFile(file);
                          const reader = new FileReader();
                          reader.onload = (ev) => setChildMapPreview(ev.target?.result as string);
                          reader.readAsDataURL(file);
                        }
                        e.target.value = '';
                      }} />
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
              {Object.entries(MARKER_ICONS).map(([key, emoji]) => (
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
                  📎 {notes.find(n => n.id === markerForm.linkedNoteId)?.title}
                </Typography>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} color="inherit">Отмена</Button>
          <DndButton variant="contained" onClick={handleSaveMarker} disabled={!markerForm.title.trim()}>
            {editingMarker ? 'Сохранить' : 'Добавить'}
          </DndButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};