import React, { useEffect, useState, useMemo } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { useAppStore } from '../../app/store';
import { MapCanvas } from './MapCanvas';
import { MarkerDialog } from '../markers/MarkerDialog';
import type { MarkerDTO, MarkerType } from '../../app/api';

export function MapViewer({ mapId }: { mapId: string }) {
  const {
    // Данные текущего проекта
    currentProjectId,
    
    // Маркеры
    markersByMapId,
    markersLoadingByMapId,
    loadMarkers,
    createMarker,
    patchMarker,
    deleteMarker,

    // Данные для диалога (чтобы можно было привязывать заметки/карты)
    notes,
    loadNotes,
    maps: projectMaps, // переименуем, чтобы не путать
    loadMaps,
    createNote,
    createMap
  } = useAppStore();

  const markers = useMemo(() => markersByMapId[mapId] ?? [], [markersByMapId, mapId]);
  const loading = markersLoadingByMapId[mapId] ?? false;

  const [showLabels, setShowLabels] = useState(true);

  // --- Состояние создания ---
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newMarkerData, setNewMarkerData] = useState<{ 
    x: number; 
    y: number; 
    points?: { x: number; y: number }[] 
  } | null>(null);

  // --- Состояние редактирования ---
  const [editMarker, setEditMarker] = useState<MarkerDTO | null>(null);

  // Загрузка данных
  useEffect(() => {
    if (currentProjectId) {
      loadMarkers(mapId);
      // Подгружаем списки для диалогов, если их нет
      // (можно оптимизировать и грузить только при открытии диалога, но пока так проще)
      if (notes.length === 0) loadNotes(currentProjectId);
      if (projectMaps.length === 0) loadMaps(currentProjectId);
    }
  }, [mapId, currentProjectId, loadMarkers, loadNotes, loadMaps, notes.length, projectMaps.length]);

  // 1. Кликнули просто в точку
  const handleMapClick = (pos: { x: number; y: number }) => {
    setNewMarkerData({ x: pos.x, y: pos.y }); 
    setCreateDialogOpen(true);
  };

  // 2. Нарисовали область
  const handleAreaCreated = (area: { points: { x: number; y: number }[]; center: { x: number; y: number } }) => {
    setNewMarkerData({
      x: area.center.x,
      y: area.center.y,
      points: area.points
    });
    setCreateDialogOpen(true);
  };

  // Обработчик СОЗДАНИЯ (прокидываем в onCreate)
  const handleCreate = async (data: any) => {
    if (!newMarkerData) return;
    await createMarker(mapId, {
      ...data,
      x: newMarkerData.x,
      y: newMarkerData.y,
      points: newMarkerData.points,
    });
    // Закрытие произойдет внутри диалога или можно здесь явно вызвать setCreateDialogOpen(false)
    // Но компонент Dialog обычно сам вызывает onClose после успеха, если мы так настроили.
    // В нашем коде MarkerDialog вызывает onClose() сам после await onCreate().
  };

  // Обработчик СОХРАНЕНИЯ (прокидываем в onSave)
  const handleSave = async (data: any) => {
    if (!editMarker) return;
    await patchMarker(editMarker.id, data);
  };

  // Обработчик УДАЛЕНИЯ
  const handleDelete = async () => {
    if (!editMarker) return;
    if (!window.confirm('Удалить этот маркер?')) return;
    await deleteMarker(editMarker.id, mapId);
    setEditMarker(null);
  };

  if (loading && markers.length === 0) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" height="100%">
        <CircularProgress />
      </Box>
    );
  }

  // Врапперы для быстрого создания контента из диалога
  const handleCreateLinkedNote = async (input: { title: string; type: any }) => {
    if (!currentProjectId) throw new Error('No project');
    return createNote(currentProjectId, input);
  };

  const handleCreateLinkedMap = async (input: { title: string; parent_map_id?: string; file: File }) => {
    if (!currentProjectId) throw new Error('No project');
    return createMap(currentProjectId, input);
  };

  return (
    <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
      <MapCanvas
        mapId={mapId}
        markers={markers}
        showLabels={showLabels}
        onToggleLabels={() => setShowLabels((s) => !s)}
        
        onMapClick={handleMapClick}
        onAreaCreated={handleAreaCreated}
        
        onMarkerClick={(m) => setEditMarker(m)}
        onMarkerDoubleClick={(m) => setEditMarker(m)}
      />

      {/* Диалог СОЗДАНИЯ */}
      {createDialogOpen && newMarkerData && currentProjectId && (
        <MarkerDialog
          open={true}
          mode="create"
          initial={{ x: newMarkerData.x, y: newMarkerData.y }}
          initialType={newMarkerData.points ? 'area' : 'location'} 
          
          // Пропсы данных
          projectId={currentProjectId}
          notes={notes}
          maps={projectMaps}
          
          // Методы
          onClose={() => {
            setCreateDialogOpen(false);
            setNewMarkerData(null);
          }}
          onCreate={handleCreate} // <--- Вот здесь было onSubmit, стало onCreate
          
          onCreateLinkedNote={handleCreateLinkedNote}
          onCreateLinkedMap={handleCreateLinkedMap}
        />
      )}

      {/* Диалог РЕДАКТИРОВАНИЯ */}
      {editMarker && currentProjectId && (
        <MarkerDialog
          open={true}
          mode="edit"
          initial={editMarker}
          
          projectId={currentProjectId}
          notes={notes}
          maps={projectMaps}

          onClose={() => setEditMarker(null)}
          onSave={handleSave}     // <--- Вот здесь было onSubmit, стало onSave
          onDelete={handleDelete}
          
          onCreateLinkedNote={handleCreateLinkedNote}
          onCreateLinkedMap={handleCreateLinkedMap}
        />
      )}
    </Box>
  );
}
