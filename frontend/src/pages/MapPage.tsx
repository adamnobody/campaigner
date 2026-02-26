import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Box, Typography, Paper, IconButton, Tooltip, Fab,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Select, MenuItem, FormControl, InputLabel, Button, Chip,
} from '@mui/material';
import AddLocationIcon from '@mui/icons-material/AddLocation';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import { useParams } from 'react-router-dom';
import { useProjectStore } from '@/store/useProjectStore';
import { useMapStore } from '@/store/useMapStore';
import { useUIStore } from '@/store/useUIStore';
import { MARKER_COLORS, MARKER_ICONS } from '@campaigner/shared';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { EmptyState } from '@/components/ui/EmptyState';
import { DndButton } from '@/components/ui/DndButton';

export const MapPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const pid = parseInt(projectId!);
  const { currentProject, fetchProject, uploadMap } = useProjectStore();
  const { markers, fetchMarkers, createMarker, updateMarker, deleteMarker, selectedMarker, setSelectedMarker } = useMapStore();
  const { showSnackbar, showConfirmDialog } = useUIStore();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [addingMarker, setAddingMarker] = useState(false);
  const [markerDialogOpen, setMarkerDialogOpen] = useState(false);
  const [editingMarker, setEditingMarker] = useState<any>(null);
  const [clickPosition, setClickPosition] = useState<{ x: number; y: number } | null>(null);

  // Form state
  const [markerTitle, setMarkerTitle] = useState('');
  const [markerDescription, setMarkerDescription] = useState('');
  const [markerColor, setMarkerColor] = useState<string>(MARKER_COLORS[0]);
  const [markerIcon, setMarkerIcon] = useState<string>('custom');

  useEffect(() => {
    fetchProject(pid);
    fetchMarkers(pid);
  }, [pid, fetchProject, fetchMarkers]);

  const handleMapClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!addingMarker || !mapContainerRef.current) return;

    const rect = mapContainerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    setClickPosition({ x, y });
    setMarkerTitle('');
    setMarkerDescription('');
    setMarkerColor(MARKER_COLORS[0] as string);
    setMarkerIcon('custom');
    setEditingMarker(null);
    setMarkerDialogOpen(true);
    setAddingMarker(false);
  }, [addingMarker]);

  const handleSaveMarker = async () => {
    if (!markerTitle.trim()) return;

    try {
      if (editingMarker) {
        await updateMarker(editingMarker.id, {
          title: markerTitle,
          description: markerDescription,
          color: markerColor,
          icon: markerIcon as any,
        });
        showSnackbar('Marker updated', 'success');
      } else if (clickPosition) {
        await createMarker({
          projectId: pid,
          title: markerTitle,
          description: markerDescription,
          positionX: clickPosition.x,
          positionY: clickPosition.y,
          color: markerColor,
          icon: markerIcon as any,
        });
        showSnackbar('Marker added', 'success');
      }
      setMarkerDialogOpen(false);
    } catch {
      showSnackbar('Failed to save marker', 'error');
    }
  };

  const handleEditMarker = (marker: any) => {
    setEditingMarker(marker);
    setMarkerTitle(marker.title);
    setMarkerDescription(marker.description || '');
    setMarkerColor(marker.color);
    setMarkerIcon(marker.icon);
    setMarkerDialogOpen(true);
  };

  const handleDeleteMarker = (id: number) => {
    showConfirmDialog('Delete Marker', 'Are you sure?', async () => {
      try {
        await deleteMarker(id);
        showSnackbar('Marker deleted', 'success');
      } catch {
        showSnackbar('Failed to delete marker', 'error');
      }
    });
  };

  const handleUploadMap = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadMap(pid, file);
      showSnackbar('Map uploaded!', 'success');
    } catch {
      showSnackbar('Failed to upload map', 'error');
    }
  };

  if (!currentProject) return <LoadingScreen />;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h3">World Map</Typography>
        <Box display="flex" gap={1}>
          <Tooltip title={addingMarker ? 'Click on map to place marker' : 'Add marker mode'}>
            <DndButton
              variant={addingMarker ? 'contained' : 'outlined'}
              startIcon={<AddLocationIcon />}
              onClick={() => setAddingMarker(!addingMarker)}
              color={addingMarker ? 'warning' : 'primary'}
            >
              {addingMarker ? 'Click on map...' : 'Add Marker'}
            </DndButton>
          </Tooltip>
          <Button component="label" variant="outlined" startIcon={<CloudUploadIcon />}>
            Upload Map
            <input type="file" hidden accept="image/jpeg,image/png,image/svg+xml" onChange={handleUploadMap} />
          </Button>
        </Box>
      </Box>

      {currentProject.mapImagePath ? (
        <Paper
          sx={{
            position: 'relative',
            overflow: 'hidden',
            cursor: addingMarker ? 'crosshair' : 'default',
            borderRadius: 2,
          }}
        >
          <div
            ref={mapContainerRef}
            onClick={handleMapClick}
            style={{ position: 'relative', display: 'inline-block', width: '100%' }}
          >
            <img
              src={currentProject.mapImagePath}
              alt="Campaign Map"
              style={{ width: '100%', display: 'block' }}
            />

            {/* Markers */}
            {markers.map(marker => (
              <Tooltip key={marker.id} title={marker.title} arrow>
                <Box
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!addingMarker) {
                      setSelectedMarker(marker);
                    }
                  }}
                  sx={{
                    position: 'absolute',
                    left: `${marker.positionX * 100}%`,
                    top: `${marker.positionY * 100}%`,
                    transform: 'translate(-50%, -100%)',
                    cursor: 'pointer',
                    fontSize: '28px',
                    filter: `drop-shadow(0 2px 4px rgba(0,0,0,0.5))`,
                    transition: 'transform 0.2s',
                    '&:hover': { transform: 'translate(-50%, -100%) scale(1.3)' },
                    zIndex: selectedMarker?.id === marker.id ? 10 : 1,
                  }}
                >
                  📍
                </Box>
              </Tooltip>
            ))}
          </div>

          {/* Selected marker info */}
          {selectedMarker && (
            <Paper
              sx={{
                position: 'absolute',
                top: 16,
                right: 16,
                width: 320,
                p: 2,
                zIndex: 20,
              }}
              elevation={8}
            >
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Typography variant="h5">{selectedMarker.title}</Typography>
                <IconButton size="small" onClick={() => setSelectedMarker(null)}>
                  <CloseIcon />
                </IconButton>
              </Box>
              {selectedMarker.description && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {selectedMarker.description}
                </Typography>
              )}
              <Chip label={selectedMarker.icon} size="small" sx={{ mt: 1, mr: 1 }} />
              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                <IconButton size="small" onClick={() => handleEditMarker(selectedMarker)}>
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" color="error" onClick={() => handleDeleteMarker(selectedMarker.id)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            </Paper>
          )}
        </Paper>
      ) : (
        <EmptyState
          title="No map uploaded yet"
          description="Upload a map image (JPEG, PNG, or SVG) to start placing markers"
          actionLabel="Upload Map"
          onAction={() => document.querySelector<HTMLInputElement>('input[type=file]')?.click()}
        />
      )}

      {/* Marker Dialog */}
      <Dialog open={markerDialogOpen} onClose={() => setMarkerDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingMarker ? 'Edit Marker' : 'Add Marker'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Marker Title"
            value={markerTitle}
            onChange={(e) => setMarkerTitle(e.target.value)}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Description"
            value={markerDescription}
            onChange={(e) => setMarkerDescription(e.target.value)}
            margin="normal"
            multiline
            rows={3}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Icon</InputLabel>
            <Select value={markerIcon} label="Icon" onChange={(e) => setMarkerIcon(e.target.value)}>
              {MARKER_ICONS.map(icon => (
                <MenuItem key={icon} value={icon}>{icon}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" gutterBottom>Color</Typography>
            <Box display="flex" gap={1} flexWrap="wrap">
              {MARKER_COLORS.map(color => (
                <Box
                  key={color}
                  onClick={() => setMarkerColor(color)}
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    backgroundColor: color,
                    cursor: 'pointer',
                    border: markerColor === color ? '3px solid white' : '2px solid transparent',
                    transition: 'border 0.2s',
                  }}
                />
              ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setMarkerDialogOpen(false)} color="inherit">Cancel</Button>
          <DndButton variant="contained" onClick={handleSaveMarker} disabled={!markerTitle.trim()}>
            {editingMarker ? 'Update' : 'Add'}
          </DndButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};