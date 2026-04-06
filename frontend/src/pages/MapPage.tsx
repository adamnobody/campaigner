import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { Box, Typography, Button, TextField } from '@mui/material';
import MapIcon from '@mui/icons-material/Map';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useParams, useNavigate } from 'react-router-dom';
import { mapApi } from '@/api/maps';
import { useUIStore } from '@/store/useUIStore';
import { DndButton } from '@/components/ui/DndButton';
import {
  sxMapContainer,
  extractData, normalizeMap,
  territoryTotalPointCount,
} from './map/mapUtils';
import type { MapMode, Marker, Territory, NoteOption, FactionOption } from './map/mapUtils';
import { MapMarkerDialog } from './map/MapMarkerDialog';
import { MapTerritoryDialog } from './map/MapTerritoryDialog';
import { MapMarkerPanel } from './map/MapMarkerPanel';
import { MapTerritoryPanel } from './map/MapTerritoryPanel';
import { MapTerritorySvg } from './map/MapTerritorySvg';
import { MapMarkerOnMap } from './map/MapMarkerOnMap';
import { MapToolbar } from './map/MapToolbar';
import { useMapViewport } from './map/useMapViewport';
import { useMapTerritoryDrawing } from './map/useMapTerritoryDrawing';
import { shallow } from 'zustand/shallow';
import { useBranchStore } from '@/store/useBranchStore';
import { useMapGeoHistory } from './map/useMapGeoHistory';
import { useMapData } from './map/useMapData';
import { useMapNavigation } from './map/useMapNavigation';
import { useMapMarkerCrud } from './map/useMapMarkerCrud';
import { useMapTerritoryCrud } from './map/useMapTerritoryCrud';
import { useMapInteractions } from './map/useMapInteractions';

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
  const activeBranchId = useBranchStore((state) => state.activeBranchId);

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const transformRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<MapMode>('select');
  const [selectedMarker, setSelectedMarker] = useState<Marker | null>(null);
  const [selectedTerritory, setSelectedTerritory] = useState<Territory | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelType, setPanelType] = useState<'marker' | 'territory'>('marker');

  const {
    drawingCompletedRings,
    drawingPoints,
    pendingNewTerritoryRings,
    setDrawingPoints,
    setPendingNewTerritoryRings,
    clearDrawingDraft,
    undoLastPoint,
    completeContour,
    buildRingsSnapshotForCreateDialog,
  } = useMapTerritoryDrawing(mode, showSnackbar);
  const resetViewRef = useRef<() => void>(() => {});

  const {
    project,
    currentMap,
    markers,
    territories,
    notes,
    factions,
    loading,
    transitioning,
    imgSize,
    setImgSize,
    setProject,
    setCurrentMap,
    setMarkers,
    setTerritories,
    loadMapData,
  } = useMapData({
    projectId: pid,
    mapId: mid,
    showSnackbar,
    clearDrawingDraft,
    resetView: () => resetViewRef.current(),
    onBeforeMapLoad: () => {
      setSelectedMarker(null);
      setSelectedTerritory(null);
      setPanelOpen(false);
      setMode('select');
    },
    onInitialMapResolved: (map) => setMapBreadcrumbs([map]),
  });

  const {
    zoomDisplay,
    zoomRef,
    panRef,
    isPanningRef,
    panStartRef,
    panOriginRef,
    applyTransform,
    zoomIn,
    zoomOut,
    resetView,
  } = useMapViewport({
    containerRef,
    transformRef,
    wheelEnabled: !loading,
  });
  resetViewRef.current = resetView;

  const {
    mapBreadcrumbs,
    setMapBreadcrumbs,
    navigateToChildMap,
    navigateToBreadcrumb,
    navigateToParent,
  } = useMapNavigation({ loadMapData });

  const {
    dialogOpen,
    editingMarker,
    markerForm,
    childMapFile,
    childMapPreview,
    draggingMarker,
    dragPreview,
    didDragRef,
    isDraggingRef,
    openNewMarkerDialogAt,
    setMarkerForm,
    handleMarkerMouseDown,
    handleMarkerDragMove,
    handleMarkerDragEnd,
    handleSaveMarker,
    handleDeleteMarker,
    handleEditMarker,
    handleUploadMap,
    closeDialog,
    handleChildMapFileChange,
    clearChildMapFile,
  } = useMapMarkerCrud({
    projectId: pid,
    currentMap,
    selectedMarker,
    setSelectedMarker,
    setPanelOpen,
    setMarkers,
    setCurrentMap,
    setProject,
    showSnackbar,
    showConfirmDialog,
  });

  const {
    territoryDialogOpen,
    editingTerritory,
    editingTerritoryPoints,
    territoryForm,
    setTerritoryForm,
    setEditingTerritoryPoints,
    openCreateTerritoryDialogFromRings,
    handleSaveTerritory,
    startEditingPoints,
    saveEditingPoints,
    cancelEditingPoints,
    deletePoint,
    addPointOnEdge,
    handleEditTerritory,
    handleDeleteTerritory,
    closeTerritoryDialog,
  } = useMapTerritoryCrud({
    currentMap,
    pendingNewTerritoryRings,
    setPendingNewTerritoryRings,
    setDrawingPoints,
    clearDrawingDraft,
    setMode,
    selectedTerritory,
    setSelectedTerritory,
    setPanelOpen,
    setTerritories,
    showSnackbar,
    showConfirmDialog,
  });

  const {
    draggingTerritoryPoint,
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
    closePanel,
    resetForMapLoad,
  } = useMapInteractions({
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
    clearDrawingDraft,
    buildRingsSnapshotForCreateDialog,
    openNewMarkerDialogAt,
    openCreateTerritoryDialogFromRings,
    navigateToChildMap,
    handleMarkerDragMove,
    handleMarkerDragEnd,
    editingTerritoryPoints,
    setEditingTerritoryPoints,
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
  });

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

  const { geoDate, setGeoDate, geoEventsCount } = useMapGeoHistory({
    projectId: pid,
    mapId: currentMap?.id ?? null,
    branchId: activeBranchId,
  });

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
      <MapToolbar
        mapBreadcrumbs={mapBreadcrumbs}
        onNavigateToParent={navigateToParent}
        onNavigateToBreadcrumb={navigateToBreadcrumb}
        mode={mode}
        onModeChange={handleMapModeChange}
        drawingCompletedRingsCount={drawingCompletedRings.length}
        drawingPointsCount={drawingPoints.length}
        onUndoLastPoint={undoLastPoint}
        onCompleteContour={completeContour}
        onFinishDrawing={finishDrawing}
        onCancelDrawing={cancelDrawing}
        zoomDisplay={zoomDisplay}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onResetView={resetView}
        markersCount={markers.length}
        territoriesCount={territories.length}
        onUploadMap={handleUploadMap}
      />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
        <TextField
          size="small"
          type="date"
          label="Гео-история"
          InputLabelProps={{ shrink: true }}
          value={geoDate}
          onChange={(e) => setGeoDate(e.target.value)}
          sx={{ width: 180 }}
        />
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.55)' }}>
          Событий в текущей ветке: {geoEventsCount}
        </Typography>
      </Box>

      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.42)', mb: 1, display: 'block', fontSize: '0.8rem', lineHeight: 1.45 }}>
        {editingTerritoryPoints
          ? 'Перетащите точки для изменения формы · ПКМ — удалить точку · Двойной клик — добавить точку на ребре'
          : mode === 'draw_territory'
          ? 'Клик — точки контура · R или «Контур готов» — зафиксировать контур · «Сохранить» — имя и создание · ПКМ / двойной клик — как раньше'
          : 'Клик — маркер · Shift+клик по территории — маркер поверх неё · Клик по территории — настройки · Перетаскивание маркера · Двойной клик — вложенная карта · Alt+drag / СКМ — пан · Колёсико — зум'
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
                drawingCompletedRings={drawingCompletedRings}
                drawingPoints={drawingPoints}
                editingTerritoryPoints={editingTerritoryPoints}
                selectedTerritory={selectedTerritory}
                draggingMarker={draggingMarker}
                draggingTerritoryPoint={draggingTerritoryPoint}
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
                    onMarkerMouseDown={(e, m) => handleMarkerMouseDown(e, m, mode)}
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
              ✏️ {editingTerritoryPoints.name} — {editingTerritoryPoints.rings.length} контура, {territoryTotalPointCount(editingTerritoryPoints)} точек
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
