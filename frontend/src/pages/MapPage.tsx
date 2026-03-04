import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  Box, Typography, Paper, TextField, Button, Dialog,
  DialogTitle, DialogContent, DialogActions, IconButton,
  Select, MenuItem, FormControl, InputLabel, Autocomplete,
  Chip,
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
}

interface NoteOption {
  id: number;
  title: string;
  noteType: string;
}

const MIN_ZOOM = 0.2;
const MAX_ZOOM = 5;
const ZOOM_SPEED = 0.1;
const DRAG_THRESHOLD = 4; // px — минимум движения для начала drag

export const MapPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const pid = parseInt(projectId!);
  const navigate = useNavigate();
  const { showSnackbar, showConfirmDialog } = useUIStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const [project, setProject] = useState<any>(null);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<NoteOption[]>([]);

  // Transform state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const panOriginRef = useRef({ x: 0, y: 0 });

  // Refs for native listeners
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
    title: '', description: '', icon: 'custom', color: MARKER_COLORS[0], linkedNoteId: null as number | null,
  });

  const [selectedMarker, setSelectedMarker] = useState<Marker | null>(null);

  // ==================== Fetch ====================
  useEffect(() => {
    Promise.all([
      projectsApi.getById(pid),
      mapApi.getMarkers(pid),
      notesApi.getAll(pid),
    ]).then(([projRes, markersRes, notesRes]) => {
      setProject(projRes.data.data);
      setMarkers((markersRes.data.data || []).map(normalizeMarker));
      const notesList = notesRes.data.data?.items || notesRes.data.data || [];
      setNotes(notesList.map((n: any) => ({ id: n.id, title: n.title, noteType: n.noteType })));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [pid]);

  const normalizeMarker = (m: any): Marker => ({
    id: m.id,
    title: m.title,
    description: m.description || '',
    x: (m.positionX ?? 0) * 100,
    y: (m.positionY ?? 0) * 100,
    icon: m.icon || 'custom',
    color: m.color || MARKER_COLORS[0],
    linkedNoteId: m.linkedNoteId || null,
  });

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

    // Marker drag
    if (isDraggingRef.current && draggingMarker && imgRef.current) {
      const dx = e.clientX - dragStartScreenRef.current.x;
      const dy = e.clientY - dragStartScreenRef.current.y;

      // Check threshold
      if (!didDragRef.current && Math.sqrt(dx * dx + dy * dy) < DRAG_THRESHOLD) return;
      didDragRef.current = true;

      const rect = imgRef.current.getBoundingClientRect();
      const newX = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      const newY = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
      setDragPreview({ x: newX, y: newY });
    }
  };

  const handleMouseUp = async (e: React.MouseEvent) => {
    setIsPanning(false);

    // Finish marker drag
    if (isDraggingRef.current && draggingMarker) {
      isDraggingRef.current = false;

      if (didDragRef.current && dragPreview) {
        // Save new position
        try {
          await mapApi.update(draggingMarker.id, {
            positionX: dragPreview.x / 100,
            positionY: dragPreview.y / 100,
          });
          setMarkers(prev => prev.map(m =>
            m.id === draggingMarker.id ? { ...m, x: dragPreview.x, y: dragPreview.y } : m
          ));
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
    // Only select if we didn't drag
    if (!didDragRef.current) {
      setSelectedMarker(marker);
    }
  };

  const handleMapClick = (e: React.MouseEvent) => {
    if (isPanning || didDragRef.current) return;
    if (!imgRef.current) return;

    const rect = imgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setClickPos({ x, y });
    setEditingMarker(null);
    setMarkerForm({ title: '', description: '', icon: 'custom', color: MARKER_COLORS[0], linkedNoteId: null });
    setDialogOpen(true);
  };

  // ==================== CRUD ====================
  const handleSaveMarker = async () => {
    if (!markerForm.title.trim()) return;
    try {
      if (editingMarker) {
        const res = await mapApi.update(editingMarker.id, {
          title: markerForm.title,
          description: markerForm.description,
          positionX: editingMarker.x / 100,
          positionY: editingMarker.y / 100,
          icon: markerForm.icon,
          color: markerForm.color,
          linkedNoteId: markerForm.linkedNoteId,
        });
        const updated = normalizeMarker(res.data.data);
        setMarkers(prev => prev.map(m => m.id === editingMarker.id ? updated : m));
        if (selectedMarker?.id === editingMarker.id) setSelectedMarker(updated);
        showSnackbar('Маркер обновлён', 'success');
      } else if (clickPos) {
        const res = await mapApi.create({
          title: markerForm.title,
          description: markerForm.description,
          projectId: pid,
          positionX: clickPos.x / 100,
          positionY: clickPos.y / 100,
          icon: markerForm.icon,
          color: markerForm.color,
          linkedNoteId: markerForm.linkedNoteId,
        });
        setMarkers(prev => [...prev, normalizeMarker(res.data.data)]);
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
        await mapApi.delete(marker.id);
        setMarkers(prev => prev.filter(m => m.id !== marker.id));
        setSelectedMarker(null);
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
    });
    setDialogOpen(true);
  };

  const handleUploadMap = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await projectsApi.uploadMap(pid, file);
      setProject(res.data.data);
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

  const mapImageUrl = project?.mapImagePath ? `${project.mapImagePath}` : null;

  // ==================== Render marker ====================
  const renderMarker = (marker: Marker) => {
    const isDragging = draggingMarker?.id === marker.id && didDragRef.current;
    const displayX = isDragging && dragPreview ? dragPreview.x : marker.x;
    const displayY = isDragging && dragPreview ? dragPreview.y : marker.y;

    const markerSize = Math.max(20, 36 / zoom);
    const fontSize = Math.max(10, 18 / zoom);
    const borderWidth = Math.max(1, 2 / zoom);
    const labelSize = Math.max(7, 11 / zoom);
    const linkedNote = getLinkedNote(marker.linkedNoteId);

    return (
      <Box
        key={marker.id}
        onMouseDown={(e) => handleMarkerMouseDown(e, marker)}
        onClick={(e) => handleMarkerClick(e, marker)}
        sx={{
          position: 'absolute',
          left: `${displayX}%`,
          top: `${displayY}%`,
          transform: 'translate(-50%, -50%)',
          cursor: isDragging ? 'grabbing' : 'grab',
          zIndex: isDragging ? 100 : selectedMarker?.id === marker.id ? 10 : 5,
          opacity: isDragging ? 0.85 : 1,
          transition: isDragging ? 'none' : 'transform 0.15s',
          '&:hover': {
            transform: isDragging ? 'translate(-50%, -50%)' : 'translate(-50%, -50%) scale(1.3)',
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
            ? `0 0 ${Math.max(8, 16 / zoom)}px ${marker.color}cc, 0 ${Math.max(2, 4 / zoom)}px ${Math.max(8, 16 / zoom)}px rgba(0,0,0,0.7)`
            : `0 0 ${Math.max(4, 8 / zoom)}px ${marker.color}80, 0 ${Math.max(1, 2 / zoom)}px ${Math.max(4, 8 / zoom)}px rgba(0,0,0,0.5)`,
          border: selectedMarker?.id === marker.id
            ? `${borderWidth}px solid #fff`
            : `${borderWidth}px solid rgba(0,0,0,0.3)`,
        }}>
          {MARKER_ICONS[marker.icon] || MARKER_ICONS.custom}
        </Box>

        {/* Label */}
        <Typography sx={{
          position: 'absolute', top: '100%', left: '50%',
          transform: 'translateX(-50%)',
          mt: `${Math.max(1, 3 / zoom)}px`,
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
            position: 'absolute', top: `-${Math.max(4, 8 / zoom)}px`, right: `-${Math.max(4, 8 / zoom)}px`,
            width: Math.max(8, 14 / zoom), height: Math.max(8, 14 / zoom),
            borderRadius: '50%',
            backgroundColor: '#4ECDC4',
            border: `${Math.max(1, 1.5 / zoom)}px solid rgba(0,0,0,0.4)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
          }}>
            <DescriptionIcon sx={{ fontSize: Math.max(5, 8 / zoom), color: '#fff' }} />
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ height: 'calc(100vh - 64px - 48px)', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography sx={{ fontFamily: '"Cinzel", serif', fontWeight: 700, fontSize: '1.5rem', color: '#fff' }}>
          Карта мира
        </Typography>
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
            size="small"
            variant="outlined"
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
        Клик — добавить маркер · Перетаскивание маркера — переместить · Alt+перетаскивание / СКМ — панорамирование · Колёсико — зум
      </Typography>

      {/* Map area */}
      <Box
        ref={containerRef}
        sx={{
          flexGrow: 1, overflow: 'hidden', borderRadius: 2,
          border: '1px solid rgba(255,255,255,0.1)',
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
            transition: isPanning ? 'none' : 'transform 0.1s ease-out',
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

        {/* Selected marker popup */}
        {selectedMarker && !isDraggingRef.current && (
          <Paper sx={{
            position: 'absolute', bottom: 16, left: 16, p: 2, maxWidth: 320,
            backgroundColor: 'rgba(20,20,35,0.95)', border: '1px solid rgba(255,255,255,0.15)',
            backdropFilter: 'blur(10px)', zIndex: 20,
          }}>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
              <Box display="flex" alignItems="center" gap={1}>
                <Typography fontSize="1.2rem">{MARKER_ICONS[selectedMarker.icon] || '📍'}</Typography>
                <Typography sx={{ fontWeight: 700, color: '#fff' }}>{selectedMarker.title}</Typography>
              </Box>
              <Box display="flex" gap={0.5}>
                <IconButton size="small" onClick={() => handleEditMarker(selectedMarker)} sx={{ color: 'rgba(255,255,255,0.5)' }}>
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => handleDeleteMarker(selectedMarker)} sx={{ color: 'rgba(255,100,100,0.5)' }}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>

            {selectedMarker.description && (
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mt: 1 }}>
                {selectedMarker.description}
              </Typography>
            )}

            {/* Linked note */}
            {(() => {
              const linked = getLinkedNote(selectedMarker.linkedNoteId);
              if (!linked) return null;
              return (
                <Box
                  onClick={() => navigate(`/project/${pid}/notes/${linked.id}`)}
                  sx={{
                    mt: 1.5, p: 1, borderRadius: 1,
                    backgroundColor: 'rgba(78,205,196,0.08)',
                    border: '1px solid rgba(78,205,196,0.2)',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 1,
                    '&:hover': { backgroundColor: 'rgba(78,205,196,0.15)' },
                  }}
                >
                  <DescriptionIcon sx={{ fontSize: 16, color: '#4ECDC4' }} />
                  <Typography variant="body2" sx={{ color: '#4ECDC4', flex: 1 }}>
                    {linked.title}
                  </Typography>
                  <OpenInNewIcon sx={{ fontSize: 14, color: 'rgba(78,205,196,0.6)' }} />
                </Box>
              );
            })()}

            <Box display="flex" gap={1} mt={1.5}>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.2)' }}>
                X: {selectedMarker.x.toFixed(1)}% · Y: {selectedMarker.y.toFixed(1)}%
              </Typography>
            </Box>

            <Button size="small" onClick={() => setSelectedMarker(null)} sx={{ mt: 1, color: 'rgba(255,255,255,0.4)' }}>
              Закрыть
            </Button>
          </Paper>
        )}
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

          {/* Linked note select */}
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