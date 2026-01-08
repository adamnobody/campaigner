import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Box, CircularProgress, Checkbox, FormControlLabel, TextField, Button } from '@mui/material';
import { useAppStore } from '../../app/store';
import { MapCanvas } from './MapCanvas';
import { MarkerDialog } from '../markers/MarkerDialog';
import type { MarkerDTO, MarkerType } from '../../app/api';

export function MapViewer({ mapId }: { mapId: string }) {
  const {
    currentProjectId,
    markersByMapId,
    markersLoadingByMapId,
    loadMarkers,
    createMarker,
    patchMarker,
    deleteMarker,
    notes,
    loadNotes,
    maps: projectMaps,
    loadMaps,
    createNote,
    createMap,

    // filters/search
    markerTypeVisibility,
    markerSearchQuery,
    markerOnlyLinked,
    setMarkerTypeVisibility,
    setMarkerSearchQuery,
    setMarkerOnlyLinked,
    resetMarkerFilters,
    getVisibleMarkersForMap
  } = useAppStore();

  const loading = markersLoadingByMapId[mapId] ?? false;

  const [showLabels, setShowLabels] = useState(true);

  // --- Состояние создания ---
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newMarkerPos, setNewMarkerPos] = useState<{ x: number; y: number } | null>(null);

  // --- Состояние редактирования ---
  const [editMarker, setEditMarker] = useState<MarkerDTO | null>(null);

  // --- Optimistic positions during drag (UI-only) ---
  const [dragPositions, setDragPositions] = useState<Record<string, { x: number; y: number }>>({});

  useEffect(() => {
    if (currentProjectId) {
      loadMarkers(mapId);
      if (notes.length === 0) loadNotes(currentProjectId);
      if (projectMaps.length === 0) loadMaps(currentProjectId);
    }
  }, [mapId, currentProjectId, loadMarkers, loadNotes, loadMaps, notes.length, projectMaps.length]);

  // базовые маркеры из стора
  const rawMarkers = useMemo(() => markersByMapId[mapId] ?? [], [markersByMapId, mapId]);

  // применяем фильтры/поиск из стора
  const filteredMarkers = useMemo(
    () => getVisibleMarkersForMap(mapId),
    [
      getVisibleMarkersForMap,
      mapId,
      rawMarkers,
      markerTypeVisibility,
      markerSearchQuery,
      markerOnlyLinked
    ]
  );


  // накладываем временные позиции во время drag (только для тех, что видим/рендерим)
  const markersForCanvas = useMemo(() => {
    if (!dragPositions || Object.keys(dragPositions).length === 0) return filteredMarkers;
    return filteredMarkers.map((m) => {
      const p = dragPositions[m.id];
      return p ? { ...m, x: p.x, y: p.y } : m;
    });
  }, [filteredMarkers, dragPositions]);

  const handleMapClick = (pos: { x: number; y: number }) => {
    setNewMarkerPos(pos);
    setCreateDialogOpen(true);
  };

  const handleCreate = async (data: any) => {
    if (!newMarkerPos) return;
    await createMarker(mapId, {
      ...data,
      x: newMarkerPos.x,
      y: newMarkerPos.y
    });
  };

  const handleSave = async (data: any) => {
    if (!editMarker) return;
    await patchMarker(editMarker.id, data);
  };

  const handleDelete = async () => {
    if (!editMarker) return;
    if (!window.confirm('Удалить этот маркер?')) return;
    await deleteMarker(editMarker.id, mapId);
    setEditMarker(null);
  };

  const handleCreateLinkedNote = async (input: { title: string; type: any }) => {
    if (!currentProjectId) throw new Error('No project');
    return createNote(currentProjectId, input);
  };

  const handleCreateLinkedMap = async (input: { title: string; parent_map_id?: string; file: File }) => {
    if (!currentProjectId) throw new Error('No project');
    return createMap(currentProjectId, input);
  };

  const handleMarkerMove = useCallback((markerId: string, pos: { x: number; y: number }) => {
    setDragPositions((s) => ({ ...s, [markerId]: pos }));
  }, []);

  const handleMarkerMoveEnd = useCallback(
    async (markerId: string, pos: { x: number; y: number }) => {
      // сохраняем на бэке
      await patchMarker(markerId, { x: pos.x, y: pos.y });

      // чистим локальную позицию (теперь она уже в сторе)
      setDragPositions((s) => {
        if (!s[markerId]) return s;
        const next = { ...s };
        delete next[markerId];
        return next;
      });
    },
    [patchMarker]
  );

  const toggleType = (t: MarkerType) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setMarkerTypeVisibility(t, e.target.checked);

  if (loading && rawMarkers.length === 0) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" height="100%">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Filters/Search overlay */}
      <Box
        sx={{
          position: 'absolute',
          zIndex: 11,
          left: 16,
          top: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          p: 1,
          borderRadius: 2,
          bgcolor: 'rgba(255,255,255,0.92)',
          boxShadow: 2,
          backdropFilter: 'blur(4px)',
          minWidth: 280
        }}
      >
        <TextField
          size="small"
          label="Поиск маркеров"
          value={markerSearchQuery}
          onChange={(e) => setMarkerSearchQuery(e.target.value)}
        />

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <FormControlLabel
            control={<Checkbox size="small" checked={markerTypeVisibility.location} onChange={toggleType('location')} />}
            label="Локации"
          />
          <FormControlLabel
            control={<Checkbox size="small" checked={markerTypeVisibility.event} onChange={toggleType('event')} />}
            label="События"
          />
          <FormControlLabel
            control={
              <Checkbox size="small" checked={markerTypeVisibility.character} onChange={toggleType('character')} />
            }
            label="Персонажи"
          />
        </Box>

        <FormControlLabel
          control={<Checkbox size="small" checked={markerOnlyLinked} onChange={(e) => setMarkerOnlyLinked(e.target.checked)} />}
          label="Только со ссылкой"
        />

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ fontSize: 12, color: 'text.secondary' }}>Показано: {markersForCanvas.length}</Box>
          <Button size="small" variant="outlined" onClick={resetMarkerFilters}>
            Сброс
          </Button>
        </Box>
      </Box>

      <MapCanvas
        mapId={mapId}
        markers={markersForCanvas}
        showLabels={showLabels}
        onToggleLabels={() => setShowLabels((s) => !s)}
        onMapClick={handleMapClick}
        onMarkerClick={(m) => setEditMarker(m)}
        onMarkerDoubleClick={(m) => setEditMarker(m)}
        onMarkerMove={handleMarkerMove}
        onMarkerMoveEnd={handleMarkerMoveEnd}
      />

      {createDialogOpen && newMarkerPos && currentProjectId && (
        <MarkerDialog
          open={true}
          mode="create"
          initial={newMarkerPos}
          projectId={currentProjectId}
          notes={notes}
          maps={projectMaps}
          onClose={() => {
            setCreateDialogOpen(false);
            setNewMarkerPos(null);
          }}
          onCreate={handleCreate}
          onCreateLinkedNote={handleCreateLinkedNote}
          onCreateLinkedMap={handleCreateLinkedMap}
        />
      )}

      {editMarker && currentProjectId && (
        <MarkerDialog
          open={true}
          mode="edit"
          initial={editMarker}
          projectId={currentProjectId}
          notes={notes}
          maps={projectMaps}
          onClose={() => setEditMarker(null)}
          onSave={handleSave}
          onDelete={handleDelete}
          onCreateLinkedNote={handleCreateLinkedNote}
          onCreateLinkedMap={handleCreateLinkedMap}
        />
      )}
    </Box>
  );
}
