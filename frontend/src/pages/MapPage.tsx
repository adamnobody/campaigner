import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  Box, Typography, Paper, TextField, Button, Dialog,
  DialogTitle, DialogContent, DialogActions, IconButton,
  Select, MenuItem, FormControl, InputLabel, Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useParams } from 'react-router-dom';
import { mapApi, projectsApi } from '@/api/axiosClient';
import { useUIStore } from '@/store/useUIStore';
import { DndButton } from '@/components/ui/DndButton';

// Иконки маркеров
const MARKER_ICONS: Record<string, string> = {
  castle: '🏰',
  city: '🏙️',
  village: '🏘️',
  tavern: '🍺',
  dungeon: '⚔️',
  forest: '🌲',
  mountain: '⛰️',
  river: '🌊',
  cave: '🕳️',
  temple: '⛪',
  ruins: '🏚️',
  port: '⚓',
  bridge: '🌉',
  tower: '🗼',
  camp: '🏕️',
  battlefield: '�crossed_swords',
  mine: '⛏️',
  farm: '🌾',
  graveyard: '💀',
  custom: '📍',
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
}

export const MapPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const pid = parseInt(projectId!);
  const { showSnackbar, showConfirmDialog } = useUIStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const [project, setProject] = useState<any>(null);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [loading, setLoading] = useState(true);

  // Zoom & pan
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Marker dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMarker, setEditingMarker] = useState<Marker | null>(null);
  const [clickPos, setClickPos] = useState<{ x: number; y: number } | null>(null);
  const [markerForm, setMarkerForm] = useState({
    title: '',
    description: '',
    icon: 'custom',
    color: MARKER_COLORS[0],
  });

  // Selected marker popup
  const [selectedMarker, setSelectedMarker] = useState<Marker | null>(null);

  // Fetch
  useEffect(() => {
    Promise.all([
      projectsApi.getById(pid),
      mapApi.getMarkers(pid),
    ]).then(([projRes, markersRes]) => {
      setProject(projRes.data.data);
      setMarkers((markersRes.data.data || []).map(normalizeMarker));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [pid]);

  // Zoom with mouse wheel
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(prev => Math.min(5, Math.max(0.2, prev + delta)));
  }, []);

  const zoomIn = () => setZoom(prev => Math.min(5, prev + 0.2));
  const zoomOut = () => setZoom(prev => Math.max(0.2, prev - 0.2));
  const resetView = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  // Pan
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      e.preventDefault();
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    }
  };

  const handleMouseUp = () => setIsPanning(false);

  // Click on map to add marker
  const handleMapClick = (e: React.MouseEvent) => {
    if (isPanning) return;
    if (!imgRef.current) return;

    const rect = imgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setClickPos({ x, y });
    setEditingMarker(null);
    setMarkerForm({ title: '', description: '', icon: 'custom', color: MARKER_COLORS[0] });
    setDialogOpen(true);
  };

  const normalizeMarker = (m: any): Marker => ({
    id: m.id,
    title: m.title,
    description: m.description || '',
    x: (m.positionX ?? 0) * 100,
    y: (m.positionY ?? 0) * 100,
    icon: m.icon || 'custom',
    color: m.color || MARKER_COLORS[0],
  });

  // Save marker
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
        });
        setMarkers(prev => prev.map(m => m.id === editingMarker.id ? normalizeMarker(res.data.data) : m));
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
        });
        setMarkers(prev => [...prev, normalizeMarker(res.data.data)]);
        showSnackbar('Маркер добавлен', 'success');
      }
      setDialogOpen(false);
    } catch (err: any) {
      showSnackbar(err.message || 'Ошибка сохранения', 'error');
    }
  };

  // Delete marker
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

  // Edit marker
  const handleEditMarker = (marker: Marker) => {
    setEditingMarker(marker);
    setMarkerForm({
      title: marker.title,
      description: marker.description || '',
      icon: marker.icon || 'custom',
      color: marker.color || MARKER_COLORS[0],
    });
    setDialogOpen(true);
  };

  // Upload map image
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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <Typography sx={{ color: 'rgba(255,255,255,0.5)' }}>Загрузка карты...</Typography>
      </Box>
    );
  }

  const mapImageUrl = project?.mapImagePath
    ? `${project.mapImagePath}`
    : null;

  return (
    <Box sx={{ height: 'calc(100vh - 64px - 48px)', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography sx={{ fontFamily: '"Cinzel", serif', fontWeight: 700, fontSize: '1.5rem', color: '#fff' }}>
          Карта мира
        </Typography>
        <Box display="flex" gap={1} alignItems="center">
          {/* Zoom controls */}
          <Box display="flex" gap={0.5} sx={{
            backgroundColor: 'rgba(255,255,255,0.06)',
            borderRadius: 1,
            p: 0.5,
          }}>
            <IconButton size="small" onClick={zoomOut} sx={{ color: '#fff' }}>
              <ZoomOutIcon fontSize="small" />
            </IconButton>
            <Typography sx={{ color: '#fff', fontSize: '0.8rem', lineHeight: '30px', px: 1 }}>
              {Math.round(zoom * 100)}%
            </Typography>
            <IconButton size="small" onClick={zoomIn} sx={{ color: '#fff' }}>
              <ZoomInIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={resetView} sx={{ color: '#fff' }}>
              <CenterFocusStrongIcon fontSize="small" />
            </IconButton>
          </Box>

          <Button
            component="label"
            variant="outlined"
            startIcon={<CloudUploadIcon />}
            size="small"
            sx={{ borderColor: 'rgba(255,255,255,0.2)', color: '#fff' }}
          >
            Загрузить карту
            <input type="file" hidden accept="image/*" onChange={handleUploadMap} />
          </Button>
        </Box>
      </Box>

      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)', mb: 1, display: 'block' }}>
        Клик на карту — добавить маркер · Alt+перетаскивание — панорамирование · Колёсико — зум
      </Typography>

      {/* Map area */}
      <Box
        ref={containerRef}
        sx={{
          flexGrow: 1,
          overflow: 'hidden',
          borderRadius: 2,
          border: '1px solid rgba(255,255,255,0.1)',
          backgroundColor: '#0a0a14',
          position: 'relative',
          cursor: isPanning ? 'grabbing' : 'crosshair',
        }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {mapImageUrl ? (
          <Box
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Box
              sx={{
                position: 'relative',
                transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                transformOrigin: 'center center',
                transition: isPanning ? 'none' : 'transform 0.1s ease-out',
              }}
            >
              <img
                ref={imgRef}
                src={mapImageUrl}
                alt="Map"
                onClick={handleMapClick}
                style={{
                  maxWidth: '100%',
                  maxHeight: 'calc(100vh - 200px)',
                  display: 'block',
                  userSelect: 'none',
                  pointerEvents: 'auto',
                }}
                draggable={false}
              />

              {/* Markers */}
              {markers.map(marker => {
                const markerSize = Math.max(20, 36 / zoom);
                const fontSize = Math.max(10, 18 / zoom);
                const borderWidth = Math.max(1, 2 / zoom);
                const labelSize = Math.max(7, 11 / zoom);

                return (
                  <Box
                    key={marker.id}
                    onClick={(e) => { e.stopPropagation(); setSelectedMarker(marker); }}
                    sx={{
                      position: 'absolute',
                      left: `${marker.x}%`,
                      top: `${marker.y}%`,
                      transform: 'translate(-50%, -50%)',
                      cursor: 'pointer',
                      zIndex: selectedMarker?.id === marker.id ? 10 : 5,
                      transition: 'transform 0.15s',
                      '&:hover': { transform: 'translate(-50%, -50%) scale(1.3)' },
                    }}
                  >
                    <Box
                      sx={{
                        width: markerSize,
                        height: markerSize,
                        borderRadius: '50%',
                        backgroundColor: marker.color || MARKER_COLORS[0],
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: `${fontSize}px`,
                        boxShadow: `0 0 ${Math.max(4, 8 / zoom)}px ${marker.color || MARKER_COLORS[0]}80, 0 ${Math.max(1, 2 / zoom)}px ${Math.max(4, 8 / zoom)}px rgba(0,0,0,0.5)`,
                        border: selectedMarker?.id === marker.id
                          ? `${borderWidth}px solid #fff`
                          : `${borderWidth}px solid rgba(0,0,0,0.3)`,
                      }}
                    >
                      {MARKER_ICONS[marker.icon] || MARKER_ICONS.custom}
                    </Box>
                    <Typography
                      sx={{
                        position: 'absolute',
                        top: '100%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        mt: `${Math.max(1, 3 / zoom)}px`,
                        fontSize: `${labelSize}px`,
                        color: '#fff',
                        textShadow: '0 1px 4px rgba(0,0,0,0.9), 0 0 8px rgba(0,0,0,0.7)',
                        whiteSpace: 'nowrap',
                        fontWeight: 600,
                        pointerEvents: 'none',
                      }}
                    >
                      {marker.title}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
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
        {selectedMarker && (
          <Paper
            sx={{
              position: 'absolute',
              bottom: 16,
              left: 16,
              p: 2,
              maxWidth: 300,
              backgroundColor: 'rgba(20,20,35,0.95)',
              border: '1px solid rgba(255,255,255,0.15)',
              backdropFilter: 'blur(10px)',
              zIndex: 20,
            }}
          >
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
            <Button size="small" onClick={() => setSelectedMarker(null)} sx={{ mt: 1, color: 'rgba(255,255,255,0.4)' }}>
              Закрыть
            </Button>
          </Paper>
        )}
      </Box>

      {/* Add/Edit Marker Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)' } }}
      >
        <DialogTitle sx={{ fontFamily: '"Cinzel", serif' }}>
          {editingMarker ? 'Редактировать маркер' : 'Добавить маркер'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Название маркера"
            value={markerForm.title}
            onChange={e => { setMarkerForm(prev => ({ ...prev, title: e.target.value })); }}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Описание"
            value={markerForm.description}
            onChange={e => { setMarkerForm(prev => ({ ...prev, description: e.target.value })); }}
            margin="normal"
            multiline
            rows={3}
          />

          {/* Icon selector */}
          <FormControl fullWidth margin="normal">
            <InputLabel>Иконка</InputLabel>
            <Select
              value={markerForm.icon}
              label="Иконка"
              onChange={e => { setMarkerForm(prev => ({ ...prev, icon: e.target.value })); }}
            >
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

          {/* Color selector */}
          <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.6)', mt: 2, mb: 1 }}>
            Цвет
          </Typography>
          <Box display="flex" gap={1} flexWrap="wrap">
            {MARKER_COLORS.map(color => (
              <Box
                key={color}
                onClick={() => setMarkerForm(prev => ({ ...prev, color }))}
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  backgroundColor: color,
                  cursor: 'pointer',
                  border: markerForm.color === color ? '3px solid #fff' : '2px solid transparent',
                  transition: 'all 0.15s',
                  '&:hover': { transform: 'scale(1.2)' },
                }}
              />
            ))}
          </Box>

          {/* Preview */}
          <Box display="flex" alignItems="center" gap={1} mt={2} p={1.5}
            sx={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 1 }}
          >
            <Box sx={{
              width: 36, height: 36, borderRadius: '50%', backgroundColor: markerForm.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
              boxShadow: `0 0 8px ${markerForm.color}80`,
            }}>
              {MARKER_ICONS[markerForm.icon] || '📍'}
            </Box>
            <Typography sx={{ color: '#fff', fontWeight: 600 }}>
              {markerForm.title || 'Превью маркера'}
            </Typography>
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