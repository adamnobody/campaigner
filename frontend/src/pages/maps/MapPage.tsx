import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { Box, Button, CircularProgress, Paper, Stack, Typography, alpha, useTheme } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { shallow } from 'zustand/shallow';
import { canvasApi, type CanvasLayer, type CanvasObject, type CanvasScene } from '@/api/canvas';
import { notesApi } from '@/api/notes';
import { projectsApi } from '@/api/projects';
import { useBranchStore } from '@/store/useBranchStore';
import { useUIStore } from '@/store/useUIStore';
import { BranchEntityMissingDialog } from '@/components/ui/BranchEntityMissingDialog';
import { MapToolbar } from './components/MapToolbar';
import { MapMarkerDialog } from './components/MapMarkerDialog';
import { MapMarkerPanel } from './components/MapMarkerPanel';
import { MapCanvasContextMenu, type MapContextMenuState } from './components/MapCanvasContextMenu';
import { PixiMapCanvas, type PixiMapCanvasHandle } from './canvas/PixiMapCanvas';
import {
  applyMarkerFormToObject,
  asRecord,
  asString,
  buildMarkerCreateInput,
  DEFAULT_MARKER_FORM,
  defaultImageObject,
  defaultShapeObject,
  defaultTerritoryObject,
  defaultTextObject,
  markerFormFromObject,
  objectTransform,
  objectToUpsert,
  withObjectPosition,
  type CanvasMode,
  type CanvasPoint,
  type MarkerFormState,
  type NoteOption,
} from './canvas/canvasModel';

const MAX_TEXTURE_SIZE = 16384;
const pendingInitialSceneLoads = new Map<string, Promise<CanvasScene>>();

const createInitialScene = (projectId: number, sceneName: string): Promise<CanvasScene> =>
  canvasApi.createScene({
    projectId,
    parentSceneId: null,
    parentObjectId: null,
    name: sceneName,
    backgroundPath: null,
    viewportJson: null,
    metadataJson: null,
  });

const loadInitialScene = (
  projectId: number,
  sceneIdFromRoute: number | null,
  sceneName: string,
  scopeKey: string,
): Promise<CanvasScene> => {
  if (sceneIdFromRoute) return canvasApi.getScene(sceneIdFromRoute, projectId);

  const pending = pendingInitialSceneLoads.get(scopeKey);
  if (pending) return pending;

  const promise = (async () => {
    const scenes = await canvasApi.getSceneTree(projectId);
    if (scenes.length > 0) {
      return scenes.find((item) => item.parentSceneId == null) ?? scenes[0];
    }
    return createInitialScene(projectId, sceneName);
  })();

  pendingInitialSceneLoads.set(scopeKey, promise);
  void promise.finally(() => pendingInitialSceneLoads.delete(scopeKey));
  return promise;
};

const ensureContentLayer = async (sceneId: number, projectId: number, layers: CanvasLayer[]): Promise<CanvasLayer> => {
  const existing = layers.find((layer) => layer.kind === 'content') ?? layers[0];
  if (existing) return existing;
  return canvasApi.createLayer({
    sceneId,
    name: 'Content',
    kind: 'content',
    zIndex: 0,
    isHidden: false,
    isLocked: false,
    opacity: 1,
    blendMode: 'normal',
    metadataJson: null,
  }, projectId);
};

export function CanvasPage() {
  const theme = useTheme();
  const { t } = useTranslation(['map', 'common']);
  const navigate = useNavigate();
  const { projectId, mapId } = useParams<{ projectId: string; mapId?: string }>();
  const projectIdNumber = Number(projectId);
  const sceneIdFromRoute = mapId ? Number(mapId) : null;
  const activeBranchId = useBranchStore((state) => state.activeBranchId);
  const { showSnackbar, showConfirmDialog } = useUIStore((state) => ({
    showSnackbar: state.showSnackbar,
    showConfirmDialog: state.showConfirmDialog,
  }), shallow);

  const [scene, setScene] = useState<CanvasScene | null>(null);
  const [layers, setLayers] = useState<CanvasLayer[]>([]);
  const [objects, setObjects] = useState<CanvasObject[]>([]);
  const [selectedObjectId, setSelectedObjectId] = useState<number | null>(null);
  const [mode, setMode] = useState<CanvasMode>('select');
  const [draftPointsCount, setDraftPointsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [branchMissingDialogOpen, setBranchMissingDialogOpen] = useState(false);
  const [largeBackgroundStatus, setLargeBackgroundStatus] = useState('');
  const [zoomPercent, setZoomPercent] = useState(100);
  const [contextMenu, setContextMenu] = useState<MapContextMenuState>(null);
  const [markerDialogOpen, setMarkerDialogOpen] = useState(false);
  const [editingMarker, setEditingMarker] = useState<CanvasObject | null>(null);
  const [markerForm, setMarkerForm] = useState<MarkerFormState>(DEFAULT_MARKER_FORM);
  const [notes, setNotes] = useState<NoteOption[]>([]);
  const pixiCanvasRef = useRef<PixiMapCanvasHandle | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const pendingImagePointRef = useRef<CanvasPoint | null>(null);
  const pendingMarkerPointRef = useRef<CanvasPoint | null>(null);
  const reportedImageLoadErrorsRef = useRef(new Set<string>());
  const sceneCacheRef = useRef(new Map<number, { scene: CanvasScene; layers: CanvasLayer[]; objects: CanvasObject[] }>());
  const viewportPersistTimerRef = useRef<number | null>(null);

  const selectedObject = useMemo(
    () => objects.find((object) => object.id === selectedObjectId) ?? null,
    [objects, selectedObjectId],
  );

  const notesMap = useMemo(
    () => new Map(notes.map((note) => [note.id, note])),
    [notes],
  );

  const selectedLabel = useMemo(() => {
    if (!selectedObject) return null;
    if (selectedObject.kind === 'marker') {
      const content = asRecord(selectedObject.contentJson);
      return asString(content.title, selectedObject.name ?? selectedObject.kind);
    }
    return selectedObject.name ?? selectedObject.kind;
  }, [selectedObject]);

  const loadScene = useCallback(async () => {
    if (!projectIdNumber) return;
    setLoading(true);
    try {
      await projectsApi.getById(projectIdNumber);
      const scopeKey = `${projectIdNumber}:${activeBranchId ?? 'main'}`;
      const loadedScene = await loadInitialScene(
        projectIdNumber,
        sceneIdFromRoute,
        t('map:canvas.defaults.sceneName'),
        scopeKey,
      );
      const cached = sceneCacheRef.current.get(loadedScene.id);
      if (cached) {
        setScene(cached.scene);
        setLayers(cached.layers);
        setObjects(cached.objects);
      }

      const [loadedLayers, loadedObjects] = await Promise.all([
        canvasApi.listLayers(loadedScene.id, projectIdNumber),
        canvasApi.listObjects(loadedScene.id, projectIdNumber),
      ]);
      const snapshot = { scene: loadedScene, layers: loadedLayers, objects: loadedObjects };
      sceneCacheRef.current.set(loadedScene.id, snapshot);
      setScene(loadedScene);
      setLayers(loadedLayers);
      setObjects(loadedObjects);
      setSelectedObjectId(null);
      setDraftPointsCount(0);
    } catch (error) {
      if (sceneIdFromRoute) {
        setBranchMissingDialogOpen(true);
      } else {
        setScene(null);
        setLayers([]);
        setObjects([]);
        showSnackbar(t('map:canvas.snackbar.sceneAutoCreateError'), 'error');
        console.error('[Canvas] failed to load or auto-create scene', error);
      }
    } finally {
      setLoading(false);
    }
  }, [activeBranchId, projectIdNumber, sceneIdFromRoute, showSnackbar, t]);

  useEffect(() => {
    loadScene();
  }, [loadScene]);

  useEffect(() => {
    if (!projectIdNumber) return;
    void notesApi.getAll(projectIdNumber, { limit: 500 })
      .then((response) => {
        setNotes(response.data.data.items.map((note) => ({
          id: note.id,
          title: note.title,
          noteType: note.noteType,
        })));
      })
      .catch(() => undefined);
  }, [projectIdNumber]);

  useEffect(() => {
    if (!scene) return;
    sceneCacheRef.current.set(scene.id, { scene, layers, objects });
  }, [scene, layers, objects]);

  const contentLayer = useCallback(async () => {
    if (!scene) throw new Error('Scene is not loaded');
    const layer = await ensureContentLayer(scene.id, projectIdNumber, layers);
    if (!layers.some((item) => item.id === layer.id)) {
      setLayers((current) => [...current, layer]);
    }
    return layer;
  }, [layers, projectIdNumber, scene]);

  const persistObject = useCallback(async (object: CanvasObject) => {
    if (!scene) return;
    setObjects((current) => current.map((item) => (item.id === object.id ? object : item)));
    try {
      const result = await canvasApi.reconcileScene({
        sceneId: scene.id,
        upsert: [objectToUpsert(object)],
        deleteIds: [],
      }, projectIdNumber);
      setObjects((current) => {
        const byId = new Map(current.map((item) => [item.id, item]));
        for (const upserted of result.upserted) byId.set(upserted.id, upserted);
        return [...byId.values()];
      });
    } catch {
      showSnackbar(t('map:canvas.snackbar.objectSaveError'), 'error');
      loadScene();
    }
  }, [loadScene, projectIdNumber, scene, showSnackbar, t]);

  const openMarkerDialog = useCallback((point: CanvasPoint | null, marker: CanvasObject | null = null) => {
    pendingMarkerPointRef.current = point;
    setEditingMarker(marker);
    setMarkerForm(marker ? markerFormFromObject(marker) : DEFAULT_MARKER_FORM);
    setMarkerDialogOpen(true);
  }, []);

  const closeMarkerDialog = useCallback(() => {
    setMarkerDialogOpen(false);
    setEditingMarker(null);
    pendingMarkerPointRef.current = null;
  }, []);

  const saveMarker = useCallback(async () => {
    if (!scene || !markerForm.title.trim()) return;
    try {
      if (editingMarker) {
        const updated = applyMarkerFormToObject(editingMarker, markerForm);
        await persistObject(updated);
        closeMarkerDialog();
        return;
      }
      const point = pendingMarkerPointRef.current;
      if (!point) return;
      const layer = await contentLayer();
      const created = await canvasApi.createObject(
        buildMarkerCreateInput(scene.id, layer.id, point, markerForm),
        projectIdNumber,
      );
      setObjects((current) => [...current, created]);
      setSelectedObjectId(created.id);
      closeMarkerDialog();
      setMode('select');
    } catch {
      showSnackbar(t('map:canvas.snackbar.objectSaveError'), 'error');
    }
  }, [
    closeMarkerDialog,
    contentLayer,
    editingMarker,
    markerForm,
    persistObject,
    projectIdNumber,
    scene,
    showSnackbar,
    t,
  ]);

  const handleCanvasClick = useCallback(async (point: CanvasPoint) => {
    if (!scene) return;
    if (mode === 'marker') {
      openMarkerDialog(point);
      return;
    }
    if (mode === 'text' || mode === 'curve_text') {
      const layer = await contentLayer();
      const created = await canvasApi.createObject(defaultTextObject(scene.id, layer.id, point, mode), projectIdNumber);
      setObjects((current) => [...current, created]);
      setSelectedObjectId(created.id);
      setMode('select');
      return;
    }
    if (mode === 'rectangle' || mode === 'ellipse') {
      const layer = await contentLayer();
      const created = await canvasApi.createObject(defaultShapeObject(scene.id, layer.id, point, mode), projectIdNumber);
      setObjects((current) => [...current, created]);
      setSelectedObjectId(created.id);
      setMode('select');
      return;
    }
    if (mode === 'image') {
      pendingImagePointRef.current = point;
      imageInputRef.current?.click();
    }
  }, [contentLayer, mode, openMarkerDialog, projectIdNumber, scene]);

  const handleObjectMove = useCallback((object: CanvasObject, point: CanvasPoint) => {
    persistObject(withObjectPosition(object, point.x, point.y));
  }, [persistObject]);

  const handleObjectSelect = useCallback((object: CanvasObject | null) => {
    setSelectedObjectId(object?.id ?? null);
  }, []);

  const handleImageLoadError = useCallback((object: CanvasObject, resourcePath: string) => {
    const key = `${object.id}:${resourcePath}`;
    if (reportedImageLoadErrorsRef.current.has(key)) return;
    reportedImageLoadErrorsRef.current.add(key);
    showSnackbar(t('map:canvas.snackbar.imageLoadError'), 'error');
  }, [showSnackbar, t]);

  const handleViewportChange = useCallback((viewport: { x: number; y: number; scale: number }) => {
    setZoomPercent(Math.round(viewport.scale * 100));
    if (!scene) return;
    if (viewportPersistTimerRef.current) window.clearTimeout(viewportPersistTimerRef.current);
    viewportPersistTimerRef.current = window.setTimeout(() => {
      canvasApi.updateScene({
        id: scene.id,
        name: null,
        backgroundPath: null,
        viewportJson: viewport,
        metadataJson: null,
      }, projectIdNumber).catch(() => undefined);
    }, 400);
  }, [projectIdNumber, scene]);

  const readImageSize = useCallback((file: File) => new Promise<{ width: number; height: number }>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const size = { width: image.width, height: image.height };
      URL.revokeObjectURL(url);
      resolve(size);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('image_load_failed'));
    };
    image.src = url;
  }), []);

  const createImageObjectAt = useCallback(async (
    point: CanvasPoint,
    file: File,
    role: 'background' | null,
  ) => {
    if (!scene) return;
    let width = 0;
    let height = 0;
    try {
      const size = await readImageSize(file);
      width = size.width;
      height = size.height;
    } catch {
      showSnackbar(t('map:canvas.snackbar.imageReadError'), 'error');
      return;
    }
    if (width > MAX_TEXTURE_SIZE || height > MAX_TEXTURE_SIZE) {
      setLargeBackgroundStatus(t('map:canvas.status.maxTextureExceeded', { max: MAX_TEXTURE_SIZE, width, height }));
      showSnackbar(t('map:canvas.snackbar.maxTextureExceeded', { max: MAX_TEXTURE_SIZE }), 'error');
      return;
    }
    setLargeBackgroundStatus('');
    try {
      const layer = await contentLayer();
      const assetPath = await canvasApi.uploadCanvasAsset(file);
      const input = defaultImageObject(scene.id, layer.id, point, assetPath, width, height);
      const style = role ? { ...(input.styleJson as Record<string, unknown>), role } : input.styleJson;
      const created = await canvasApi.createObject({ ...input, styleJson: style }, projectIdNumber);
      setObjects((current) => [...current, created]);
      setSelectedObjectId(created.id);
      setMode('select');
    } catch {
      showSnackbar(t('map:canvas.snackbar.imagePersistError'), 'error');
    }
  }, [contentLayer, projectIdNumber, readImageSize, scene, showSnackbar, t]);

  const uploadBackground = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !scene) return;
    const fallbackPoint = pixiCanvasRef.current?.getViewportCenter() ?? { x: 0, y: 0 };
    const point = pendingImagePointRef.current ?? fallbackPoint;
    const role: 'background' | null = pendingImagePointRef.current ? null : 'background';
    pendingImagePointRef.current = null;
    await createImageObjectAt(point, file, role);
  }, [createImageObjectAt, scene]);

  const openImagePickerAt = useCallback((point?: CanvasPoint) => {
    pendingImagePointRef.current = point ?? null;
    imageInputRef.current?.click();
  }, []);

  const createPolygon = useCallback(async (points: CanvasPoint[]) => {
    if (!scene || points.length < 3) return;
    const layer = await contentLayer();
    const created = await canvasApi.createObject({
      sceneId: scene.id,
      layerId: layer.id,
      kind: 'polygon',
      name: 'polygon',
      zIndex: null,
      transformJson: {},
      geometryJson: { points },
      styleJson: { fill: '#4ecdc4', opacity: 0.24, stroke: '#9ff3df', strokeWidth: 2 },
      contentJson: {},
      resourcePath: null,
      linkedNoteId: null,
      linkedSceneId: null,
      isHidden: false,
      isLocked: false,
    }, projectIdNumber);
    setObjects((current) => [...current, created]);
    setSelectedObjectId(created.id);
    setMode('select');
  }, [contentLayer, projectIdNumber, scene]);

  const createTerritory = useCallback(async (points: CanvasPoint[]) => {
    if (!scene || points.length < 3) return;
    const layer = await contentLayer();
    const created = await canvasApi.createObject(
      defaultTerritoryObject(scene.id, layer.id, points),
      projectIdNumber,
    );
    setObjects((current) => [...current, created]);
    setSelectedObjectId(created.id);
    setMode('select');
  }, [contentLayer, projectIdNumber, scene]);

  const createPolyline = useCallback(async (points: CanvasPoint[]) => {
    if (!scene || points.length < 2) return;
    const layer = await contentLayer();
    const created = await canvasApi.createObject({
      sceneId: scene.id,
      layerId: layer.id,
      kind: 'polyline',
      name: 'polyline',
      zIndex: null,
      transformJson: {},
      geometryJson: { points, closed: false },
      styleJson: { fill: '#4ecdc4', opacity: 0.24, stroke: '#9ff3df', strokeWidth: 2 },
      contentJson: {},
      resourcePath: null,
      linkedNoteId: null,
      linkedSceneId: null,
      isHidden: false,
      isLocked: false,
    }, projectIdNumber);
    setObjects((current) => [...current, created]);
    setSelectedObjectId(created.id);
  }, [contentLayer, projectIdNumber, scene]);

  const deleteSelected = useCallback(() => {
    const target = contextMenu?.targetObject ?? selectedObject;
    if (!target) return;
    showConfirmDialog(
      t('map:canvas.confirm.deleteObjectTitle'),
      t('map:canvas.confirm.deleteObjectBody', { name: target.name ?? target.kind }),
      async () => {
        await canvasApi.deleteObject(target.id, projectIdNumber);
        setObjects((current) => current.filter((object) => object.id !== target.id));
        setSelectedObjectId(null);
      },
    );
  }, [contextMenu?.targetObject, projectIdNumber, selectedObject, showConfirmDialog, t]);

  const selectedForMenu = useMemo(
    () => contextMenu?.targetObject ?? selectedObject ?? null,
    [contextMenu?.targetObject, selectedObject],
  );

  const maxZIndex = useMemo(
    () => objects.reduce((max, object) => Math.max(max, object.zIndex ?? 0), 0),
    [objects],
  );

  const minZIndex = useMemo(
    () => objects.reduce((min, object) => Math.min(min, object.zIndex ?? 0), 0),
    [objects],
  );

  const placeByContextMenu = useCallback((factory: (point: CanvasPoint) => Promise<void>) => {
    if (!contextMenu) return;
    void factory({ x: contextMenu.worldX, y: contextMenu.worldY });
  }, [contextMenu]);

  const createShapeAt = useCallback(async (point: CanvasPoint, kind: 'polygon' | 'rectangle' | 'ellipse' | 'polyline') => {
    if (!scene) return;
    const layer = await contentLayer();
    const created = await canvasApi.createObject(defaultShapeObject(scene.id, layer.id, point, kind), projectIdNumber);
    setObjects((current) => [...current, created]);
    setSelectedObjectId(created.id);
    setMode('select');
  }, [contentLayer, projectIdNumber, scene]);

  const duplicateSelected = useCallback(async () => {
    if (!selectedForMenu || !scene) return;
    const layer = await contentLayer();
    const transform = objectTransform(selectedForMenu);
    const moved = withObjectPosition(
      selectedForMenu,
      transform.x + 24,
      transform.y + 24,
    );
    const created = await canvasApi.createObject({
      sceneId: scene.id,
      layerId: layer.id,
      kind: moved.kind,
      name: `${selectedForMenu.name ?? selectedForMenu.kind} copy`,
      zIndex: maxZIndex + 1,
      transformJson: moved.transformJson,
      geometryJson: moved.geometryJson,
      styleJson: moved.styleJson,
      contentJson: moved.contentJson,
      resourcePath: moved.resourcePath,
      linkedNoteId: moved.linkedNoteId,
      linkedSceneId: moved.linkedSceneId,
      isHidden: moved.isHidden,
      isLocked: moved.isLocked,
    }, projectIdNumber);
    setObjects((current) => [...current, created]);
    setSelectedObjectId(created.id);
  }, [contentLayer, maxZIndex, projectIdNumber, scene, selectedForMenu]);

  const bringToFront = useCallback(() => {
    if (!selectedForMenu) return;
    void persistObject({ ...selectedForMenu, zIndex: maxZIndex + 1 });
  }, [maxZIndex, persistObject, selectedForMenu]);

  const sendToBack = useCallback(() => {
    if (!selectedForMenu) return;
    void persistObject({ ...selectedForMenu, zIndex: minZIndex - 1 });
  }, [minZIndex, persistObject, selectedForMenu]);

  useEffect(() => {
    const isBlockedTarget = (target: EventTarget | null): boolean => {
      if (!(target instanceof HTMLElement)) return false;
      if (target.isContentEditable) return true;
      const tag = target.tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
      if (target.closest('[contenteditable="true"]')) return true;
      if (document.querySelector('[role="dialog"]')) return true;
      return false;
    };

    const keyToMode: Record<string, CanvasMode> = {
      '1': 'select',
      '2': 'marker',
      '3': 'text',
      '4': 'polygon',
      '5': 'polyline',
      '6': 'rectangle',
      '7': 'ellipse',
      '8': 'curve_text',
      '9': 'image',
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (isBlockedTarget(event.target)) return;

      if (event.key === 'Escape') {
        if (mode === 'polygon' || mode === 'draw_territory' || mode === 'polyline') {
          if (pixiCanvasRef.current?.cancelDrawing()) {
            setDraftPointsCount(0);
            return;
          }
        }
        setMode('select');
        return;
      }

      if (!event.ctrlKey && !event.metaKey) return;
      const next = keyToMode[event.key];
      if (!next) return;
      event.preventDefault();
      setMode(next);
      if (next !== 'polygon' && next !== 'draw_territory' && next !== 'polyline') {
        pixiCanvasRef.current?.cancelDrawing();
        setDraftPointsCount(0);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mode]);

  if (loading || !scene) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
      <MapToolbar
        sceneName={scene.name}
        mode={mode}
        onModeChange={(nextMode) => {
          setMode(nextMode);
          if (nextMode !== 'polygon' && nextMode !== 'draw_territory' && nextMode !== 'polyline') {
            pixiCanvasRef.current?.cancelDrawing();
            setDraftPointsCount(0);
          }
        }}
        zoomPercent={zoomPercent}
        onZoomIn={() => pixiCanvasRef.current?.zoomIn()}
        onZoomOut={() => pixiCanvasRef.current?.zoomOut()}
        onResetView={() => pixiCanvasRef.current?.resetView()}
        objectCount={objects.length}
        selectedLabel={selectedLabel}
        draftPointsCount={draftPointsCount}
        onUndoDraftPoint={() => {
          const nextCount = pixiCanvasRef.current?.undoDrawingPoint() ?? 0;
          setDraftPointsCount(nextCount);
        }}
        onFinishTerritory={() => {
          pixiCanvasRef.current?.finishDrawing();
        }}
        onCancelTerritory={() => {
          pixiCanvasRef.current?.cancelDrawing();
          setDraftPointsCount(0);
        }}
        onAddImage={() => openImagePickerAt()}
      />

      <input ref={imageInputRef} type="file" hidden accept="image/*" onChange={uploadBackground} />

      <Paper
        data-tour="map-canvas"
        sx={{
          position: 'relative',
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
          border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
          background: '#111820',
        }}
      >
        <PixiMapCanvas
          ref={pixiCanvasRef}
          scene={scene}
          layers={layers}
          objects={objects}
          selectedObjectId={selectedObjectId}
          mode={mode}
          onCanvasClick={handleCanvasClick}
          onObjectSelect={handleObjectSelect}
          onObjectMove={handleObjectMove}
          onDraftPointCountChange={(count) => {
            setDraftPointsCount(count);
          }}
          onCreatePolygon={createPolygon}
          onCreateTerritory={createTerritory}
          onCreatePolyline={createPolyline}
          onImageLoadError={handleImageLoadError}
          onViewportChange={handleViewportChange}
          onLargeBackgroundStatus={setLargeBackgroundStatus}
          onContextMenu={setContextMenu}
        />

        {selectedObject?.kind === 'marker' && (
          <Box sx={{ position: 'absolute', right: 0, top: 0, bottom: 0, zIndex: 2 }}>
            <MapMarkerPanel
              selectedMarker={selectedObject}
              linkedNote={selectedObject.linkedNoteId ? notesMap.get(selectedObject.linkedNoteId) : undefined}
              onClose={() => setSelectedObjectId(null)}
              onNavigateToNote={(noteId) => navigate(`/project/${projectIdNumber}/notes/${noteId}`)}
              onEditMarker={(marker) => openMarkerDialog(null, marker)}
              onDeleteMarker={() => deleteSelected()}
            />
          </Box>
        )}

        {selectedObject && selectedObject.kind !== 'marker' && (
          <Paper
            elevation={6}
            sx={{
              position: 'absolute',
              right: 16,
              top: 16,
              width: 280,
              p: 2,
              backgroundColor: alpha(theme.palette.background.paper, 0.92),
              backdropFilter: 'blur(8px)',
            }}
          >
            <Stack spacing={1}>
              <Typography variant="subtitle2" color="text.secondary">{t('map:canvas.selection.title')}</Typography>
              <Typography fontWeight={700}>{selectedObject.name ?? selectedObject.kind}</Typography>
              <Typography variant="caption" color="text.secondary">
                {t('map:canvas.selection.meta', {
                  kind: selectedObject.kind,
                  layer: selectedObject.layerId,
                  z: selectedObject.zIndex,
                })}
              </Typography>
              <Button color="error" variant="outlined" size="small" startIcon={<DeleteIcon />} onClick={deleteSelected}>
                {t('common:delete')}
              </Button>
            </Stack>
          </Paper>
        )}

        <Typography
          variant="caption"
          sx={{ position: 'absolute', left: 12, bottom: 8, color: alpha(theme.palette.common.white, 0.64) }}
        >
          {largeBackgroundStatus}
        </Typography>
      </Paper>

      <MapCanvasContextMenu
        menu={contextMenu}
        onClose={() => setContextMenu(null)}
        onAddMarker={() => {
          if (!contextMenu) return;
          openMarkerDialog({ x: contextMenu.worldX, y: contextMenu.worldY });
        }}
        onAddText={() => {
          placeByContextMenu(async (point) => {
            if (!scene) return;
            const layer = await contentLayer();
            const created = await canvasApi.createObject(defaultTextObject(scene.id, layer.id, point, 'text'), projectIdNumber);
            setObjects((current) => [...current, created]);
            setSelectedObjectId(created.id);
          });
        }}
        onAddCurveText={() => {
          placeByContextMenu(async (point) => {
            if (!scene) return;
            const layer = await contentLayer();
            const created = await canvasApi.createObject(defaultTextObject(scene.id, layer.id, point, 'curve_text'), projectIdNumber);
            setObjects((current) => [...current, created]);
            setSelectedObjectId(created.id);
          });
        }}
        onAddImage={() => {
          if (!contextMenu) return;
          openImagePickerAt({ x: contextMenu.worldX, y: contextMenu.worldY });
        }}
        onAddPolygon={() => {
          placeByContextMenu(async (point) => createShapeAt(point, 'polygon'));
        }}
        onAddRectangle={() => {
          placeByContextMenu(async (point) => createShapeAt(point, 'rectangle'));
        }}
        onAddEllipse={() => {
          placeByContextMenu(async (point) => createShapeAt(point, 'ellipse'));
        }}
        onAddPolyline={() => {
          placeByContextMenu(async (point) => createShapeAt(point, 'polyline'));
        }}
        onEditSelected={() => {
          if (!selectedForMenu) return;
          setSelectedObjectId(selectedForMenu.id);
          showSnackbar(t('map:canvas.snackbar.objectSelectedForEdit'), 'info');
        }}
        onDeleteSelected={deleteSelected}
        onDuplicateSelected={() => {
          void duplicateSelected();
        }}
        onBringToFront={bringToFront}
        onSendToBack={sendToBack}
      />

      <MapMarkerDialog
        open={markerDialogOpen}
        onClose={closeMarkerDialog}
        editingMarker={editingMarker}
        markerForm={markerForm}
        setMarkerForm={setMarkerForm}
        notes={notes}
        notesMap={notesMap}
        onSave={() => {
          void saveMarker();
        }}
      />

      <BranchEntityMissingDialog
        open={branchMissingDialogOpen}
        entityName={t('map:canvas.entityName')}
        onClose={() => {
          setBranchMissingDialogOpen(false);
          navigate(`/project/${projectIdNumber}/map`, { replace: true });
        }}
      />
    </Box>
  );
}

export const MapPage = CanvasPage;
