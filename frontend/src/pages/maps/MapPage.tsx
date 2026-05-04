import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useMapTerritoriesRefreshStore } from '@/store/useMapTerritoriesRefreshStore';
import { Box, Typography, Button, alpha } from '@mui/material';
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
  parseTerritories,
} from './components/mapUtils';
import type { MapMode, Marker, Territory, NoteOption, FactionOption } from './components/mapUtils';
import { MapMarkerDialog } from './components/MapMarkerDialog';
import { MapTerritoryDialog } from './components/MapTerritoryDialog';
import { MapMarkerPanel } from './components/MapMarkerPanel';
import { MapTerritoryPanel } from './components/MapTerritoryPanel';
import { MapTerritorySvg } from './components/MapTerritorySvg';
import { MapMarkerOnMap } from './components/MapMarkerOnMap';
import { MapToolbar } from './components/MapToolbar';
import { useMapViewport } from './hooks/useMapViewport';
import { useMapTerritoryDrawing } from './hooks/useMapTerritoryDrawing';
import { shallow } from 'zustand/shallow';
import { useMapData } from './hooks/useMapData';
import { useMapNavigation } from './hooks/useMapNavigation';
import { useMapMarkerCrud } from './hooks/useMapMarkerCrud';
import { useMapTerritoryCrud } from './hooks/useMapTerritoryCrud';
import { useMapInteractions } from './hooks/useMapInteractions';
import { useBranchStore } from '@/store/useBranchStore';

// ==================== Component ====================
export const MapPage: React.FC = () => {
  const { t } = useTranslation(['map', 'common']);
  const { projectId, mapId } = useParams<{ projectId: string; mapId?: string }>();
  const pid = parseInt(projectId!);
  const mid = mapId ? parseInt(mapId) : null;
  const navigate = useNavigate();
  const { showSnackbar, showConfirmDialog } = useUIStore((state) => ({
    showSnackbar: state.showSnackbar,
    showConfirmDialog: state.showConfirmDialog,
  }), shallow);
  const confirmDialogOpen = useUIStore((state) => state.confirmDialog.open);

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const transformRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<MapMode>('select');
  const [selectedMarker, setSelectedMarker] = useState<Marker | null>(null);
  const [selectedTerritory, setSelectedTerritory] = useState<Territory | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelType, setPanelType] = useState<'marker' | 'territory'>('marker');
  const [drawClosureHover, setDrawClosureHover] = useState(false);

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

  const territoryRefreshVersion = useMapTerritoriesRefreshStore((s) => s.version);
  const activeBranchId = useBranchStore((s) => s.activeBranchId);

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

  useEffect(() => {
    if (!currentMap?.id || territoryRefreshVersion === 0) return;
    let cancelled = false;
    mapApi.getTerritoriesByMapId(currentMap.id, pid).then((res) => {
      if (cancelled) return;
      setTerritories(parseTerritories(extractData(res)));
    }).catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [territoryRefreshVersion, currentMap?.id, setTerritories, pid, activeBranchId]);

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
  } = useMapNavigation({ loadMapData, projectId: pid });

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
    insertVertexOnEdge,
    handleEditTerritory,
    handleDeleteTerritory,
    closeTerritoryDialog,
  } = useMapTerritoryCrud({
    projectId: pid,
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

  const handleStartEditingPointsFromPanel = useCallback(
    (territory: Territory) => {
      if (mode === 'draw_territory') {
        const hasDraft = drawingPoints.length > 0 || drawingCompletedRings.length > 0;
        if (!hasDraft) {
          setMode('select');
          startEditingPoints(territory);
          return;
        }
        showConfirmDialog(
          t('map:confirm.cancelDrawingTitle'),
          t('map:confirm.cancelDrawingMessage'),
          () => {
          clearDrawingDraft();
          setMode('select');
          startEditingPoints(territory);
        });
        return;
      }
      startEditingPoints(territory);
    },
    [
      mode,
      drawingPoints.length,
      drawingCompletedRings.length,
      startEditingPoints,
      clearDrawingDraft,
      setMode,
      showConfirmDialog,
      t,
    ],
  );

  const handleDrawClosureHoverChange = useCallback((active: boolean) => {
    setDrawClosureHover(active);
  }, []);

  const {
    draggingTerritoryPoint,
    drawPointerPercent,
    edgeInsertPhantom,
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
    drawingPoints,
    zoomDisplay,
    completeContour,
    clearDrawingDraft,
    buildRingsSnapshotForCreateDialog,
    openNewMarkerDialogAt,
    openCreateTerritoryDialogFromRings,
    navigateToChildMap,
    handleMarkerDragMove,
    handleMarkerDragEnd,
    editingTerritoryPoints,
    setEditingTerritoryPoints,
    cancelEditingPoints,
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

  const handlePhantomVertexClick = useCallback(() => {
    if (!edgeInsertPhantom) return;
    insertVertexOnEdge(edgeInsertPhantom.ringIndex, edgeInsertPhantom.edgeIndex, edgeInsertPhantom.projection);
  }, [edgeInsertPhantom, insertVertexOnEdge]);

  useEffect(() => {
    if (!editingTerritoryPoints) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Escape') return;
      if (e.repeat) return;
      const targetEl = e.target as HTMLElement | null;
      if (targetEl && (targetEl.tagName === 'INPUT' || targetEl.tagName === 'TEXTAREA' || targetEl.tagName === 'SELECT' || targetEl.isContentEditable)) {
        return;
      }
      if (territoryDialogOpen || dialogOpen || confirmDialogOpen) return;
      e.preventDefault();
      cancelEditingPoints();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    editingTerritoryPoints,
    territoryDialogOpen,
    dialogOpen,
    confirmDialogOpen,
    cancelEditingPoints,
  ]);

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

  // ==================== Child map ops ====================
  const handleCreateChildMap = useCallback(async (marker: Marker) => {
    if (!currentMap) return;
    try {
      const res = await mapApi.createMap({
        projectId: pid, parentMapId: currentMap.id,
        parentMarkerId: marker.id, name: t('map:childMap.autoName', { title: marker.title }),
      });
      const newMap = normalizeMap(extractData(res));
      await mapApi.updateMarker(marker.id, { childMapId: newMap.id });
      setMarkers(prev => prev.map(m => m.id === marker.id ? { ...m, childMapId: newMap.id } : m));
      if (selectedMarker?.id === marker.id) setSelectedMarker(prev => prev ? { ...prev, childMapId: newMap.id } : prev);
      showSnackbar(t('map:snackbar.nestedMapCreated'), 'success');
    } catch {
      showSnackbar(t('map:snackbar.nestedMapCreateError'), 'error');
    }
  }, [currentMap, pid, selectedMarker?.id, showSnackbar, t]);

  const handleUploadChildMapImage = useCallback(async (marker: Marker, file: File) => {
    if (!marker.childMapId) return;
    try {
      await mapApi.uploadMapImage(marker.childMapId, file);
      showSnackbar(t('map:snackbar.childMapImageUploaded'), 'success');
    } catch {
      showSnackbar(t('map:snackbar.childMapImageError'), 'error');
    }
  }, [showSnackbar, t]);

  // ==================== Loading ====================
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <Typography sx={{ color: 'rgba(255,255,255,0.5)' }}>{t('map:page.loading')}</Typography>
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
      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.42)', mb: 1, display: 'block', fontSize: '0.8rem', lineHeight: 1.45 }}>
        {editingTerritoryPoints
          ? t('map:page.hintEditingPoints')
          : mode === 'draw_territory'
          ? t('map:page.hintDrawTerritory')
          : t('map:page.hintSelectMode')
        }
      </Typography>

      {/* Map + Panel */}
      <Box sx={{ ...sxMapContainer, position: 'relative' }}>
          <Box
            ref={containerRef}
            sx={{
              width: '100%', height: '100%', overflow: 'hidden',
              backgroundColor: (theme) => theme.palette.background.default,
              position: 'relative',
              userSelect: 'none',
              WebkitUserSelect: 'none',
            cursor: isPanningRef.current ? 'grabbing'
              : (draggingMarker && didDragRef.current) ? 'grabbing'
              : mode === 'draw_territory' ? (drawClosureHover ? 'pointer' : 'crosshair')
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
                  ref={imgRef} src={mapImageUrl} alt={t('map:page.mapImageAlt')}
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
                drawPointerPercent={drawPointerPercent}
                onDrawClosureHoverChange={handleDrawClosureHoverChange}
                editingTerritoryPoints={editingTerritoryPoints}
                edgeInsertPhantom={edgeInsertPhantom}
                onPhantomVertexClick={handlePhantomVertexClick}
                selectedTerritory={selectedTerritory}
                draggingMarker={draggingMarker}
                draggingTerritoryPoint={draggingTerritoryPoint}
                onTerritoryClick={handleTerritoryClick}
                onPointDragStart={handlePointDragStart}
                onDeletePoint={deletePoint}
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
              <Typography sx={{ color: 'rgba(255,255,255,0.3)', mb: 2 }}>{t('map:page.noMapImage')}</Typography>
              <Button component="label" variant="outlined" startIcon={<CloudUploadIcon />}>
                {t('map:page.uploadMapImage')}
                <input type="file" hidden accept="image/*" onChange={handleUploadMap} />
              </Button>
            </Box>
          )}
        </Box>

        {/* Editing territory points floating panel */}
        {editingTerritoryPoints && (
          <Box sx={{
            position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
            zIndex: 30, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.75,
            backgroundColor: (theme) => alpha(theme.palette.background.paper, 0.95), padding: '10px 20px',
            borderRadius: 2, border: (theme) => `1px solid ${alpha(theme.palette.warning.main, 0.3)}`,
            backdropFilter: 'blur(8px)', boxShadow: (theme) => `0 4px 20px ${alpha(theme.palette.common.black, 0.5)}`,
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant="body2" sx={{ color: 'warning.main', mr: 1, whiteSpace: 'nowrap' }}>
                ✏️ {t('map:editingPoints.banner', {
                  name: editingTerritoryPoints.name,
                  ringCount: editingTerritoryPoints.rings.length,
                  pointCount: territoryTotalPointCount(editingTerritoryPoints),
                })}
              </Typography>
              <Button size="small" variant="outlined" onClick={cancelEditingPoints}
                sx={{ borderColor: (theme) => alpha(theme.palette.text.primary, 0.2), color: 'text.secondary',
                  '&:hover': { borderColor: (theme) => alpha(theme.palette.text.primary, 0.4) } }}>
                {t('common:cancel')}
              </Button>
              <DndButton size="small" variant="contained" onClick={saveEditingPoints}
                sx={{ minWidth: 100 }}>
                {t('common:save')}
              </DndButton>
            </Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
              {t('map:editingPoints.escHint')}
            </Typography>
          </Box>
        )}

        {/* Transition overlay */}
        {transitioning && (
          <Box sx={{
            position: 'absolute', inset: 0,
            backgroundColor: (theme) => alpha(theme.palette.background.default, 0.85),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 50, backdropFilter: 'blur(4px)',
          }}>
            <Box sx={{ textAlign: 'center' }}>
              <MapIcon sx={{ fontSize: 40, color: 'primary.main', opacity: 0.5, mb: 1 }} />
              <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>{t('map:page.loadingOverlay')}</Typography>
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
              onNavigateToFaction={(factionId) => {
                const target = factionsMap.get(factionId);
                const basePath = target?.kind === 'state' ? 'states' : 'factions';
                navigate(`/project/${pid}/${basePath}/${factionId}`);
              }}
              onEditTerritory={handleEditTerritory}
              onDeleteTerritory={handleDeleteTerritory}
              onStartEditingPoints={handleStartEditingPointsFromPanel}
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
