import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { Box, Button, Chip, CircularProgress, Paper, Stack, Typography, alpha, useTheme } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { shallow } from 'zustand/shallow';
import { canvasApi, type CanvasLayer, type CanvasObject, type CanvasScene } from '@/api/canvas';
import { factionsApi } from '@/api/factions';
import { notesApi } from '@/api/notes';
import { projectsApi } from '@/api/projects';
import { useBranchStore } from '@/store/useBranchStore';
import { useUIStore } from '@/store/useUIStore';
import { BranchEntityMissingDialog } from '@/components/ui/BranchEntityMissingDialog';
import { MapToolbar } from './components/MapToolbar';
import { MapMarkerDialog } from './components/MapMarkerDialog';
import { MapSceneContainerDialog } from './components/MapSceneContainerDialog';
import { MapMarkerPanel } from './components/MapMarkerPanel';
import { MapTerritoryDialog } from './components/MapTerritoryDialog';
import { MapTerritoryPanel } from './components/MapTerritoryPanel';
import { MapInlineTextEditor } from './components/MapInlineTextEditor';
import { MapTextPanel } from './components/MapTextPanel';
import { MapShapePanel } from './components/MapShapePanel';
import { MapCanvasContextMenu, type MapContextMenuState } from './components/MapCanvasContextMenu';
import { PixiMapCanvas, type PixiMapCanvasHandle } from './canvas/PixiMapCanvas';
import type { ViewportPersist } from './canvas/canvasViewport';
import { flushCanvasWrites, trackCanvasWrite } from './canvas/canvasWriteQueue';
import {
  buildSceneTrailFromTree,
  parentSceneEntry,
  pushNavigationEntry,
  resolveNavigationTrail,
  truncateNavigationStack,
  type NavigationEntry,
  type NavigationVia,
} from './canvas/navigationStack';
import { curveTextGeometryJsonEquals, mergeCurveTextGeometryDraft } from './canvas/curveTextHandles';
import {
  applyTextContentToObject,
  resolveTextContent,
} from './canvas/textObjectForm';
import {
  loadActiveTextPresetId,
  loadTextPresets,
  resolveTextPresetStyleForCreate,
  type MapTextStylePreset,
} from './canvas/textPresets';
import {
  buildShapeCreateInput,
  isShapeKind,
  type ShapeVariant,
} from './canvas/shapeObjectForm';
import { isMapScene, normalizeCanvasModeForSceneType } from './canvas/canvasTools';
import { mapSceneNeedsBackground } from './canvas/mapBackground';
import {
  appendCompletedTerritoryRing,
  buildTerritoryRingsForCreateDialog,
} from './canvas/territoryDrawing';
import {
  applyMarkerFormToObject,
  applyTerritoryFormToObject,
  asNumber,
  asRecord,
  asString,
  buildMarkerCreateInput,
  buildTerritoryCreateInput,
  DEFAULT_MARKER_FORM,
  DEFAULT_TERRITORY_FORM,
  defaultImageObject,
  defaultTextObject,
  markerFormFromObject,
  factionDetailPath,
  objectTransform,
  objectToUpsert,
  territoryEditRingsFromObject,
  territoryFormFromObject,
  territoryRingsFromObject,
  withObjectPosition,
  withTerritoryEditRings,
  withTerritoryRings,
  type CanvasMode,
  type CanvasPoint,
  type MarkerFormState,
  type NoteOption,
  type TerritoryFactionOption,
  type TerritoryFormState,
} from './canvas/canvasModel';
import type { SceneContainerDisplayLabels } from './canvas/canvasReconciler';

const MAX_TEXTURE_SIZE = 16384;
const pendingInitialSceneLoads = new Map<string, Promise<CanvasScene>>();

const createInitialScene = (projectId: number, sceneName: string): Promise<CanvasScene> =>
  canvasApi.createScene({
    projectId,
    parentSceneId: null,
    parentObjectId: null,
    name: sceneName,
    backgroundPath: null,
    sceneType: 'root_canvas',
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
  const [sceneTree, setSceneTree] = useState<CanvasScene[]>([]);
  const [navigationStack, setNavigationStack] = useState<NavigationEntry[]>([]);
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
  const [sceneContainerDialogOpen, setSceneContainerDialogOpen] = useState(false);
  const [pendingSceneContainerPoint, setPendingSceneContainerPoint] = useState<CanvasPoint | null>(null);
  const [editingMarker, setEditingMarker] = useState<CanvasObject | null>(null);
  const [markerForm, setMarkerForm] = useState<MarkerFormState>(DEFAULT_MARKER_FORM);
  const [createNestedMapInDialog, setCreateNestedMapInDialog] = useState(false);
  const [nestedMapImageFile, setNestedMapImageFile] = useState<File | null>(null);
  const [nestedMapImageName, setNestedMapImageName] = useState<string | null>(null);
  const [notes, setNotes] = useState<NoteOption[]>([]);
  const [factions, setFactions] = useState<TerritoryFactionOption[]>([]);
  const [territoryDialogOpen, setTerritoryDialogOpen] = useState(false);
  const [editingTerritory, setEditingTerritory] = useState<CanvasObject | null>(null);
  const [territoryForm, setTerritoryForm] = useState<TerritoryFormState>(DEFAULT_TERRITORY_FORM);
  const pixiCanvasRef = useRef<PixiMapCanvasHandle | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const mapBackgroundInputRef = useRef<HTMLInputElement | null>(null);
  const childMapImageInputRef = useRef<HTMLInputElement | null>(null);
  const dialogNestedMapImageInputRef = useRef<HTMLInputElement | null>(null);
  const pendingChildMapMarkerIdRef = useRef<number | null>(null);
  const pendingImagePointRef = useRef<CanvasPoint | null>(null);
  const pendingMarkerPointRef = useRef<CanvasPoint | null>(null);
  const pendingTerritoryRingsRef = useRef<CanvasPoint[][] | null>(null);
  const [territoryCompletedRings, setTerritoryCompletedRings] = useState<CanvasPoint[][]>([]);
  const [territoryEditSession, setTerritoryEditSession] = useState<{
    objectId: number;
    rings: CanvasPoint[][];
    snapshot: CanvasObject;
  } | null>(null);
  const [textPresets, setTextPresets] = useState<MapTextStylePreset[]>([]);
  const [activeTextPresetId, setActiveTextPresetId] = useState<string | null>(null);
  const [inlineTextEdit, setInlineTextEdit] = useState<{
    objectId: number;
    selectAll?: boolean;
    replaceWithSeed?: string;
  } | null>(null);
  const [textLayoutTick, setTextLayoutTick] = useState(0);
  const reportedImageLoadErrorsRef = useRef(new Set<string>());
  const viewportPersistTimerRef = useRef<number | null>(null);
  const pendingViewportRef = useRef<{ sceneId: number; viewport: ViewportPersist } | null>(null);
  const projectIdRef = useRef(projectIdNumber);
  projectIdRef.current = projectIdNumber;

  const createCanvasObject = useCallback(
    (input: Parameters<typeof canvasApi.createObject>[0]) =>
      trackCanvasWrite(canvasApi.createObject(input, projectIdNumber)),
    [projectIdNumber],
  );

  const selectedObject = useMemo(
    () => objects.find((object) => object.id === selectedObjectId) ?? null,
    [objects, selectedObjectId],
  );

  const [curveTextGeometryDraft, setCurveTextGeometryDraft] = useState<CanvasObject | null>(null);

  const canvasObjects = useMemo(() => {
    let list = objects;
    if (territoryEditSession) {
      list = list.map((object) => (
        object.id === territoryEditSession.objectId
          ? withTerritoryEditRings(object, territoryEditSession.rings)
          : object
      ));
    }
    list = mergeCurveTextGeometryDraft(list, curveTextGeometryDraft);
    return list;
  }, [objects, territoryEditSession, curveTextGeometryDraft]);

  const inlineEditObject = useMemo(
    () => (inlineTextEdit
      ? canvasObjects.find((object) => object.id === inlineTextEdit.objectId) ?? null
      : null),
    [canvasObjects, inlineTextEdit],
  );

  const notesMap = useMemo(
    () => new Map(notes.map((note) => [note.id, note])),
    [notes],
  );

  const factionsMap = useMemo(
    () => new Map(factions.map((faction) => [faction.id, faction])),
    [factions],
  );

  const selectedTerritoryFaction = useMemo(() => {
    if (!selectedObject || selectedObject.kind !== 'territory') return null;
    const factionId = territoryFormFromObject(selectedObject).factionId;
    return factionId != null ? factionsMap.get(factionId) ?? null : null;
  }, [factionsMap, selectedObject]);

  const markersCount = useMemo(
    () => objects.filter((object) => object.kind === 'marker').length,
    [objects],
  );
  const territoriesCount = useMemo(
    () => objects.filter((object) => object.kind === 'territory').length,
    [objects],
  );

  const canvasModeHint = useMemo(() => {
    if (territoryEditSession) return t('map:page.hintEditingPoints');
    if (mode === 'draw_territory') return t('map:page.hintDrawTerritory');
    if (mode === 'marker') return t('map:page.hintMarkerMode');
    if (mode === 'scene_container') return t('map:page.hintSceneContainerMode');
    return t('map:page.hintSelectMode');
  }, [mode, t, territoryEditSession]);

  const sceneTypesById = useMemo(
    () => new Map(sceneTree.map((item) => [item.id, item.sceneType])),
    [sceneTree],
  );

  const linkedSceneNames = useMemo(
    () => new Map(sceneTree.map((item) => [item.id, item.name])),
    [sceneTree],
  );

  const linkedSceneBackgroundPaths = useMemo(
    () => new Map(
      sceneTree.flatMap((item) => {
        const path = item.backgroundPath?.trim();
        return path ? [[item.id, path] as const] : [];
      }),
    ),
    [sceneTree],
  );

  const sceneContainerLabels = useMemo((): SceneContainerDisplayLabels => ({
    defaultTitle: t('map:canvas.breadcrumbs.mapFallback'),
    openHint: t('map:canvas.sceneContainer.openHint'),
    kindLabel: t('map:canvas.sceneContainer.kindLabel'),
  }), [t]);

  const selectedLabel = useMemo(() => {
    if (!selectedObject) return null;
    if (selectedObject.kind === 'marker') {
      const content = asRecord(selectedObject.contentJson);
      return asString(content.title, selectedObject.name ?? selectedObject.kind);
    }
    if (selectedObject.kind === 'scene_container') {
      const content = asRecord(selectedObject.contentJson);
      const override = asString(content.titleOverride, '').trim();
      if (override) return override;
      if (selectedObject.linkedSceneId != null) {
        return linkedSceneNames.get(selectedObject.linkedSceneId) ?? selectedObject.name ?? t('map:canvas.breadcrumbs.mapFallback');
      }
    }
    if (selectedObject.kind === 'text' || selectedObject.kind === 'curve_text') {
      const line = (selectedObject.name ?? '').trim();
      if (line) return line;
    }
    return selectedObject.name ?? selectedObject.kind;
  }, [linkedSceneNames, selectedObject, t]);

  const navigationTrail = useMemo(() => {
    if (!scene) return [];
    return resolveNavigationTrail(navigationStack, sceneTree, scene.id);
  }, [navigationStack, scene, sceneTree]);

  useEffect(() => {
    if (!scene) return;
    setMode((current) => normalizeCanvasModeForSceneType(current, scene.sceneType));
  }, [scene?.id, scene?.sceneType]);

  const navigateToMapScene = useCallback((sceneId: number, stackAfterNavigate: NavigationEntry[]) => {
    setNavigationStack(stackAfterNavigate);
    navigate(`/project/${projectIdNumber}/map/${sceneId}`);
  }, [navigate, projectIdNumber]);

  const handleBreadcrumbNavigate = useCallback((sceneId: number, index: number) => {
    const trail = scene ? resolveNavigationTrail(navigationStack, sceneTree, scene.id) : [];
    navigateToMapScene(sceneId, truncateNavigationStack(trail, index));
  }, [navigateToMapScene, navigationStack, scene, sceneTree]);

  const handleNavigationBack = useCallback(() => {
    const trail = scene ? resolveNavigationTrail(navigationStack, sceneTree, scene.id) : [];
    const parent = parentSceneEntry(trail);
    if (!parent) return;
    navigateToMapScene(parent.sceneId, truncateNavigationStack(trail, trail.length - 2));
  }, [navigateToMapScene, navigationStack, scene, sceneTree]);

  const handleOpenChildMap = useCallback((
    childSceneId: number,
    via: NavigationVia = 'marker',
  ) => {
    if (!scene) return;
    const child = sceneTree.find((item) => item.id === childSceneId);
    const trail = resolveNavigationTrail(navigationStack, sceneTree, scene.id);
    const nextStack = pushNavigationEntry(trail, {
      sceneId: childSceneId,
      label: child?.name ?? t('map:canvas.breadcrumbs.mapFallback'),
      via,
    });
    navigateToMapScene(childSceneId, nextStack);
  }, [navigateToMapScene, navigationStack, scene, sceneTree, t]);

  const loadScene = useCallback(async () => {
    if (!projectIdNumber) return;
    setLoading(true);
    try {
      await projectsApi.getById(projectIdNumber);
      const scopeKey = `${projectIdNumber}:${activeBranchId ?? 'main'}`;
      const [loadedScene, tree] = await Promise.all([
        loadInitialScene(
          projectIdNumber,
          sceneIdFromRoute,
          t('map:canvas.defaults.sceneName'),
          scopeKey,
        ),
        canvasApi.getSceneTree(projectIdNumber),
      ]);

      const [loadedLayers, loadedObjects] = await Promise.all([
        canvasApi.listLayers(loadedScene.id, projectIdNumber),
        canvasApi.listObjects(loadedScene.id, projectIdNumber),
      ]);
      setSceneTree(tree);
      setNavigationStack(buildSceneTrailFromTree(tree, loadedScene.id));
      console.debug('[Canvas] loadScene', {
        sceneId: loadedScene.id,
        routeSceneId: sceneIdFromRoute,
        objectCount: loadedObjects.length,
      });
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
    setTextPresets(loadTextPresets(projectIdNumber));
    setActiveTextPresetId(loadActiveTextPresetId(projectIdNumber));
  }, [projectIdNumber]);

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
    if (!projectIdNumber) return;
    void factionsApi.getAll(projectIdNumber, { limit: 500 })
      .then((response) => {
        setFactions(response.data.data.map((faction) => ({
          id: faction.id,
          name: faction.name,
          color: faction.color || '#4ecdc4',
          kind: faction.kind,
        })));
      })
      .catch(() => undefined);
  }, [projectIdNumber]);

  useEffect(() => () => {
    if (viewportPersistTimerRef.current != null) {
      window.clearTimeout(viewportPersistTimerRef.current);
      viewportPersistTimerRef.current = null;
    }
    const pendingViewport = pendingViewportRef.current;
    if (pendingViewport) {
      pendingViewportRef.current = null;
      void trackCanvasWrite(canvasApi.updateScene({
        id: pendingViewport.sceneId,
        name: null,
        backgroundPath: null,
        sceneType: null,
        viewportJson: pendingViewport.viewport,
        metadataJson: null,
      }, projectIdRef.current)).catch((error) => {
        console.error('[Canvas] viewport flush on unmount failed', error);
      });
    }
    void flushCanvasWrites();
  }, []);

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
    try {
      const result = await trackCanvasWrite(canvasApi.reconcileScene({
        sceneId: scene.id,
        upsert: [objectToUpsert(object)],
        deleteIds: [],
      }, projectIdNumber));
      console.debug('[Canvas] persistObject', { sceneId: scene.id, objectId: object.id });
      setObjects((current) => {
        const byId = new Map(current.map((item) => [item.id, item]));
        for (const upserted of result.upserted) byId.set(upserted.id, upserted);
        return [...byId.values()];
      });
    } catch (error) {
      console.error('[Canvas] persistObject failed', { sceneId: scene.id, objectId: object.id, error });
      showSnackbar(t('map:canvas.snackbar.objectSaveError'), 'error');
      await loadScene();
    }
  }, [loadScene, projectIdNumber, scene, showSnackbar, t]);

  const resetNestedMapDialogState = useCallback(() => {
    setCreateNestedMapInDialog(false);
    setNestedMapImageFile(null);
    setNestedMapImageName(null);
  }, []);

  const openMarkerDialog = useCallback((point: CanvasPoint | null, marker: CanvasObject | null = null) => {
    pendingMarkerPointRef.current = point;
    setEditingMarker(marker);
    setMarkerForm(marker ? markerFormFromObject(marker) : DEFAULT_MARKER_FORM);
    resetNestedMapDialogState();
    setMarkerDialogOpen(true);
  }, [resetNestedMapDialogState]);

  const closeMarkerDialog = useCallback(() => {
    setMarkerDialogOpen(false);
    setEditingMarker(null);
    pendingMarkerPointRef.current = null;
    resetNestedMapDialogState();
  }, [resetNestedMapDialogState]);

  const clearTerritoryDrawingDraft = useCallback(() => {
    setTerritoryCompletedRings([]);
    pixiCanvasRef.current?.clearDrawingPoints();
    setDraftPointsCount(0);
  }, []);

  const openTerritoryDialog = useCallback((rings: CanvasPoint[][] | null, territory: CanvasObject | null = null) => {
    pendingTerritoryRingsRef.current = rings
      ? rings.map((ring) => ring.map((point) => ({ ...point })))
      : null;
    setEditingTerritory(territory);
    setTerritoryForm(territory ? territoryFormFromObject(territory) : DEFAULT_TERRITORY_FORM);
    setTerritoryDialogOpen(true);
  }, []);

  const closeTerritoryDialog = useCallback(() => {
    setTerritoryDialogOpen(false);
    setEditingTerritory(null);
    pendingTerritoryRingsRef.current = null;
    clearTerritoryDrawingDraft();
  }, [clearTerritoryDrawingDraft]);

  const saveTerritory = useCallback(async () => {
    if (!scene || !territoryForm.name.trim()) return;
    try {
      if (editingTerritory) {
        const updated = applyTerritoryFormToObject(editingTerritory, territoryForm);
        await persistObject(updated);
        showSnackbar(t('map:snackbar.territoryUpdated', { name: updated.name }), 'success');
        closeTerritoryDialog();
        return;
      }
      const rings = pendingTerritoryRingsRef.current;
      if (!rings || rings.length === 0) return;
      const layer = await contentLayer();
      const created = await createCanvasObject(
        buildTerritoryCreateInput(scene.id, layer.id, rings, territoryForm),
      );
      console.debug('[Canvas] createObject territory', { sceneId: scene.id, objectId: created.id });
      setObjects((current) => [...current, created]);
      setSelectedObjectId(created.id);
      showSnackbar(t('map:snackbar.territoryCreated', { name: created.name }), 'success');
      closeTerritoryDialog();
      setMode('select');
    } catch (error) {
      console.error('[Canvas] saveTerritory failed', { sceneId: scene?.id, error });
      showSnackbar(t('map:snackbar.territorySaveError'), 'error');
    }
  }, [
    closeTerritoryDialog,
    contentLayer,
    createCanvasObject,
    editingTerritory,
    persistObject,
    scene,
    showSnackbar,
    t,
    territoryForm,
  ]);

  const handleNavigateToFaction = useCallback((faction: TerritoryFactionOption) => {
    navigate(factionDetailPath(projectIdNumber, faction));
  }, [navigate, projectIdNumber]);

  const cancelTerritoryShapeEdit = useCallback(() => {
    if (!territoryEditSession) return;
    setObjects((current) => current.map((object) => (
      object.id === territoryEditSession.objectId ? territoryEditSession.snapshot : object
    )));
    setTerritoryEditSession(null);
    showSnackbar(t('map:snackbar.shapeEditCancelled'), 'info');
  }, [showSnackbar, t, territoryEditSession]);

  const saveTerritoryShapeEdit = useCallback(async () => {
    if (!territoryEditSession) return;
    const target = objects.find((object) => object.id === territoryEditSession.objectId);
    if (!target || target.kind !== 'territory') return;
    try {
      const updated = withTerritoryEditRings(target, territoryEditSession.rings);
      await persistObject(updated);
      showSnackbar(t('map:snackbar.territoryShapeSaved'), 'success');
      setTerritoryEditSession(null);
    } catch (error) {
      console.error('[Canvas] saveTerritoryShapeEdit failed', error);
      showSnackbar(t('map:snackbar.territoryPointsSaveError'), 'error');
    }
  }, [objects, persistObject, showSnackbar, t, territoryEditSession]);

  const handleStartTerritoryPointEdit = useCallback((territory: CanvasObject) => {
    if (territory.kind !== 'territory') return;
    if (territoryEditSession) {
      showSnackbar(t('map:snackbar.finishShapeEditFirst'), 'warning');
      return;
    }
    pixiCanvasRef.current?.cancelDrawing();
    setDraftPointsCount(0);
    setMode('select');
    setTerritoryEditSession({
      objectId: territory.id,
      rings: territoryEditRingsFromObject(territory),
      snapshot: territory,
    });
    setSelectedObjectId(territory.id);
  }, [showSnackbar, t, territoryEditSession]);

  const nestedMapSceneName = useCallback((markerTitle: string) => (
    t('map:childMap.autoName', { title: markerTitle.trim() || t('map:canvas.defaults.sceneName') })
  ), [t]);

  const attachNestedMapToMarker = useCallback(async (
    markerId: number,
    sceneName: string,
    backgroundFile: File | null,
  ) => {
    const result = await trackCanvasWrite(canvasApi.attachChildSceneToMarker({
      markerId,
      sceneName,
      backgroundPath: null,
    }, projectIdNumber));

    let childScene = result.childScene;
    if (backgroundFile) {
      try {
        childScene = await trackCanvasWrite(
          canvasApi.uploadSceneBackground(childScene.id, projectIdNumber, backgroundFile),
        );
        showSnackbar(t('map:snackbar.childMapImageUploaded'), 'success');
      } catch (error) {
        console.error('[Canvas] child map image upload failed', error);
        showSnackbar(t('map:snackbar.markerChildMapUploadWarning'), 'warning');
      }
    }

    setObjects((current) => current.map((item) => (item.id === markerId ? result.marker : item)));
    const tree = await canvasApi.getSceneTree(projectIdNumber);
    setSceneTree(tree);
    showSnackbar(t('map:snackbar.nestedMapCreated'), 'success');
    return { marker: result.marker, childScene };
  }, [projectIdNumber, showSnackbar, t]);

  const saveMarker = useCallback(async () => {
    if (!scene || !markerForm.title.trim()) return;
    const wantsNestedMap = createNestedMapInDialog
      && !(editingMarker?.linkedSceneId != null);
    try {
      if (editingMarker) {
        const updated = applyMarkerFormToObject(editingMarker, markerForm);
        await persistObject(updated);
        if (wantsNestedMap) {
          await attachNestedMapToMarker(
            editingMarker.id,
            nestedMapSceneName(markerForm.title),
            nestedMapImageFile,
          );
        }
        closeMarkerDialog();
        return;
      }
      const point = pendingMarkerPointRef.current;
      if (!point) return;
      const layer = await contentLayer();
      const created = await createCanvasObject(
        buildMarkerCreateInput(scene.id, layer.id, point, markerForm),
      );
      console.debug('[Canvas] createObject marker', { sceneId: scene.id, objectId: created.id });
      setObjects((current) => [...current, created]);
      setSelectedObjectId(created.id);
      if (wantsNestedMap) {
        try {
          await attachNestedMapToMarker(
            created.id,
            nestedMapSceneName(markerForm.title),
            nestedMapImageFile,
          );
        } catch (attachError) {
          console.error('[Canvas] nested map attach after create failed', attachError);
          showSnackbar(t('map:snackbar.markerChildMapWarning'), 'warning');
        }
      }
      closeMarkerDialog();
      setMode('select');
    } catch (error) {
      console.error('[Canvas] saveMarker failed', { sceneId: scene?.id, error });
      showSnackbar(t('map:canvas.snackbar.objectSaveError'), 'error');
    }
  }, [
    attachNestedMapToMarker,
    closeMarkerDialog,
    contentLayer,
    createCanvasObject,
    createNestedMapInDialog,
    editingMarker,
    markerForm,
    nestedMapImageFile,
    nestedMapSceneName,
    persistObject,
    scene,
    showSnackbar,
    t,
  ]);

  const handleCreateChildMapFromPanel = useCallback((marker: CanvasObject) => {
    pendingChildMapMarkerIdRef.current = marker.id;
    childMapImageInputRef.current?.click();
  }, []);

  const handleDialogNestedMapImagePick = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setNestedMapImageFile(file);
    setNestedMapImageName(file.name);
  }, []);

  const handleChildMapImageSelected = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    const markerId = pendingChildMapMarkerIdRef.current;
    pendingChildMapMarkerIdRef.current = null;
    if (!file || markerId == null) return;

    const marker = objects.find((item) => item.id === markerId);
    if (!marker || marker.kind !== 'marker' || marker.linkedSceneId != null) return;

    const title = asString(asRecord(marker.contentJson).title, marker.name ?? '');
    try {
      await attachNestedMapToMarker(markerId, nestedMapSceneName(title), file);
    } catch (error) {
      console.error('[Canvas] create child map from panel failed', error);
      showSnackbar(t('map:snackbar.nestedMapCreateError'), 'error');
    }
  }, [attachNestedMapToMarker, nestedMapSceneName, objects, showSnackbar, t]);

  const handleMarkerOpenLinkedScene = useCallback((object: CanvasObject) => {
    if (object.linkedSceneId == null) return;
    const via: NavigationVia = object.kind === 'scene_container' ? 'container' : 'marker';
    handleOpenChildMap(object.linkedSceneId, via);
  }, [handleOpenChildMap]);

  const handleSaveSceneContainer = useCallback(async (mapName: string, file: File) => {
    if (!scene || !pendingSceneContainerPoint) return;
    setSceneContainerDialogOpen(false);
    setLoading(true);
    try {
      const backgroundPath = await canvasApi.uploadCanvasAsset(file);
      const layer = await contentLayer();
      const transformJson = {
        x: pendingSceneContainerPoint.x,
        y: pendingSceneContainerPoint.y,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
      };

      const result = await trackCanvasWrite(canvasApi.createMapSceneContainer({
        projectId: projectIdNumber,
        parentSceneId: scene.id,
        parentLayerId: layer.id,
        mapName,
        backgroundPath,
        objectName: mapName,
        transformJson,
        styleJson: null,
        contentJson: { titleOverride: mapName },
      }));

      setObjects((current) => [...current, result.containerObject]);
      setSelectedObjectId(result.containerObject.id);
      setMode('select');
      const tree = await canvasApi.getSceneTree(projectIdNumber);
      setSceneTree(tree);

      showSnackbar(t('map:snackbar.nestedMapCreated'), 'success');
    } catch (error) {
      console.error('[Canvas] createMapSceneContainer failed', error);
      const message = error instanceof Error && error.message.trim()
        ? error.message
        : t('map:snackbar.nestedMapCreateError');
      showSnackbar(message, 'error');
    } finally {
      setLoading(false);
      setPendingSceneContainerPoint(null);
    }
  }, [scene, pendingSceneContainerPoint, contentLayer, projectIdNumber, showSnackbar, t]);

  const handleShiftCanvasClick = useCallback((point: CanvasPoint) => {
    openMarkerDialog(point);
  }, [openMarkerDialog]);

  const handleObjectMove = useCallback((object: CanvasObject, point: CanvasPoint) => {
    persistObject(withObjectPosition(object, point.x, point.y));
  }, [persistObject]);

  const handleTextObjectSave = useCallback((object: CanvasObject) => {
    void persistObject(object);
  }, [persistObject]);

  const handleShapeObjectSave = useCallback((object: CanvasObject) => {
    void persistObject(object);
  }, [persistObject]);

  const buildNewTextObject = useCallback((
    layerId: number,
    point: CanvasPoint,
    kind: 'text' | 'curve_text',
  ) => {
    if (!scene) return null;
    const object = defaultTextObject(scene.id, layerId, point, kind);
    const style = resolveTextPresetStyleForCreate(textPresets, activeTextPresetId);
    return {
      ...object,
      styleJson: {
        ...object.styleJson,
        fill: style.fill,
        fontSize: style.fontSize,
        opacity: style.opacity,
      },
    };
  }, [activeTextPresetId, scene, textPresets]);

  const openInlineTextEdit = useCallback((object: CanvasObject, options?: {
    selectAll?: boolean;
    replaceWithSeed?: string;
  }) => {
    setSelectedObjectId(object.id);
    setInlineTextEdit({
      objectId: object.id,
      selectAll: options?.selectAll,
      replaceWithSeed: options?.replaceWithSeed,
    });
    setTextLayoutTick((tick) => tick + 1);
  }, []);

  const handleTextEditRequest = useCallback((object: CanvasObject) => {
    openInlineTextEdit(object, { selectAll: true });
  }, [openInlineTextEdit]);

  const handleInlineTextCommit = useCallback((text: string) => {
    const object = objects.find((item) => item.id === inlineTextEdit?.objectId);
    setInlineTextEdit(null);
    if (!object) return;
    void persistObject(applyTextContentToObject(object, text));
  }, [inlineTextEdit?.objectId, objects, persistObject]);

  const handleInlineTextCancel = useCallback(() => {
    setInlineTextEdit(null);
  }, []);

  const placeCreatedText = useCallback(async (
    point: CanvasPoint,
    kind: 'text' | 'curve_text' = 'text',
  ) => {
    if (!scene) return;
    const layer = await contentLayer();
    const draft = buildNewTextObject(layer.id, point, kind);
    if (!draft) return;
    const created = await createCanvasObject(draft);
    setObjects((current) => [...current, created]);
    setSelectedObjectId(created.id);
    setMode('select');
    openInlineTextEdit(created, { selectAll: true });
  }, [buildNewTextObject, contentLayer, createCanvasObject, openInlineTextEdit, scene]);

  const handleCanvasClick = useCallback(async (point: CanvasPoint) => {
    if (!scene) return;
    if (mode === 'scene_container') {
      setPendingSceneContainerPoint(point);
      setSceneContainerDialogOpen(true);
      return;
    }
    if (mode === 'marker') {
      openMarkerDialog(point);
      return;
    }
    if (mode === 'text' || mode === 'curve_text') {
      await placeCreatedText(point, mode);
      return;
    }
    if (mode === 'image') {
      pendingImagePointRef.current = point;
      imageInputRef.current?.click();
    }
  }, [contentLayer, createCanvasObject, mode, openMarkerDialog, placeCreatedText, scene]);

  const handleCurveTextGeometryDraft = useCallback((object: CanvasObject) => {
    setCurveTextGeometryDraft(object);
  }, []);

  const handleCurveTextGeometryCommit = useCallback((object: CanvasObject) => {
    setCurveTextGeometryDraft(object);
    void persistObject(object);
  }, [persistObject]);

  useEffect(() => {
    if (!curveTextGeometryDraft) return;
    const committed = objects.find((item) => item.id === curveTextGeometryDraft.id);
    if (committed && curveTextGeometryJsonEquals(committed, curveTextGeometryDraft)) {
      setCurveTextGeometryDraft(null);
    }
  }, [objects, curveTextGeometryDraft]);

  const handleObjectSelect = useCallback((object: CanvasObject | null) => {
    setSelectedObjectId(object?.id ?? null);
  }, []);

  const handleImageLoadError = useCallback((object: CanvasObject, resourcePath: string) => {
    const key = `${object.id}:${resourcePath}`;
    if (reportedImageLoadErrorsRef.current.has(key)) return;
    reportedImageLoadErrorsRef.current.add(key);
    showSnackbar(t('map:canvas.snackbar.imageLoadError'), 'error');
  }, [showSnackbar, t]);

  useEffect(() => {
    if (inlineTextEdit) return;
    if (!selectedObject) return;
    if (selectedObject.kind !== 'text' && selectedObject.kind !== 'curve_text') return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      if (event.key.length !== 1) return;
      event.preventDefault();
      openInlineTextEdit(selectedObject, { replaceWithSeed: event.key });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inlineTextEdit, openInlineTextEdit, selectedObject]);

  const handleViewportChange = useCallback((viewport: ViewportPersist) => {
    setZoomPercent(Math.round(viewport.scale * 100));
    if (inlineTextEdit) setTextLayoutTick((tick) => tick + 1);
    if (!scene) return;
    pendingViewportRef.current = { sceneId: scene.id, viewport };
    if (viewportPersistTimerRef.current != null) window.clearTimeout(viewportPersistTimerRef.current);
    viewportPersistTimerRef.current = window.setTimeout(() => {
      const pending = pendingViewportRef.current;
      if (!pending || pending.sceneId !== scene.id) return;
      pendingViewportRef.current = null;
      void trackCanvasWrite(canvasApi.updateScene({
        id: pending.sceneId,
        name: null,
        backgroundPath: null,
        sceneType: null,
        viewportJson: pending.viewport,
        metadataJson: null,
      }, projectIdNumber)).catch((error) => {
        console.error('[Canvas] viewport persist failed', { sceneId: pending.sceneId, error });
      });
    }, 400);
  }, [inlineTextEdit, projectIdNumber, scene]);

  useEffect(() => {
    if (!inlineTextEdit) return;
    if (selectedObjectId !== inlineTextEdit.objectId) {
      setInlineTextEdit(null);
    }
  }, [inlineTextEdit, selectedObjectId]);

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
      const created = await createCanvasObject({ ...input, styleJson: style });
      setObjects((current) => [...current, created]);
      setSelectedObjectId(created.id);
      setMode('select');
    } catch (error) {
      console.error('[Canvas] createImageObjectAt failed', { sceneId: scene?.id, error });
      showSnackbar(t('map:canvas.snackbar.imagePersistError'), 'error');
    }
  }, [contentLayer, createCanvasObject, readImageSize, scene, showSnackbar, t]);

  const uploadMapSceneBackground = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !scene || !isMapScene(scene.sceneType)) return;
    setLoading(true);
    try {
      const updated = await trackCanvasWrite(
        canvasApi.uploadSceneBackground(scene.id, projectIdNumber, file),
      );
      setScene(updated);
      showSnackbar(t('map:snackbar.mapUploaded'), 'success');
    } catch (error) {
      console.error('[Canvas] upload map background failed', { sceneId: scene.id, error });
      showSnackbar(t('map:snackbar.mapUploadError'), 'error');
    } finally {
      setLoading(false);
    }
  }, [projectIdNumber, scene, showSnackbar, t]);

  const uploadBackground = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !scene) return;
    if (isMapScene(scene.sceneType)) return;
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
    const created = await createCanvasObject({
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
    });
    console.debug('[Canvas] createObject polygon', { sceneId: scene.id, objectId: created.id });
    setObjects((current) => [...current, created]);
    setSelectedObjectId(created.id);
    setMode('select');
  }, [contentLayer, createCanvasObject, scene]);

  const finishTerritoryDrawing = useCallback((currentRing: CanvasPoint[]) => {
    const snapshot = buildTerritoryRingsForCreateDialog(territoryCompletedRings, currentRing);
    if (!snapshot.ok) {
      if (snapshot.reason === 'no_rings') {
        showSnackbar(t('map:drawing.needClosedContour'), 'warning');
      } else {
        showSnackbar(t('map:drawing.minThreePerRing'), 'warning');
      }
      return;
    }
    pixiCanvasRef.current?.clearDrawingPoints();
    setDraftPointsCount(0);
    setTerritoryCompletedRings([]);
    openTerritoryDialog(snapshot.rings);
    setMode('select');
  }, [openTerritoryDialog, showSnackbar, t, territoryCompletedRings]);

  const handleCompleteTerritoryRing = useCallback(() => {
    const currentRing = pixiCanvasRef.current?.getDrawingPoints() ?? [];
    const result = appendCompletedTerritoryRing(territoryCompletedRings, currentRing);
    if (!result.ok) {
      showSnackbar(t('map:drawing.minThreePoints'), 'warning');
      return;
    }
    setTerritoryCompletedRings(result.completedRings);
    pixiCanvasRef.current?.clearDrawingPoints();
    setDraftPointsCount(0);
  }, [showSnackbar, t, territoryCompletedRings]);

  const handleCancelTerritoryDrawing = useCallback(() => {
    pixiCanvasRef.current?.cancelDrawing();
    clearTerritoryDrawingDraft();
  }, [clearTerritoryDrawingDraft]);

  const createPolyline = useCallback(async (points: CanvasPoint[]) => {
    if (!scene || points.length < 2) return;
    const layer = await contentLayer();
    const created = await createCanvasObject({
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
    });
    console.debug('[Canvas] createObject polyline', { sceneId: scene.id, objectId: created.id });
    setObjects((current) => [...current, created]);
    setSelectedObjectId(created.id);
  }, [contentLayer, createCanvasObject, scene]);

  const deleteSelected = useCallback(() => {
    const target = contextMenu?.targetObject ?? selectedObject;
    if (!target) return;
    showConfirmDialog(
      t('map:canvas.confirm.deleteObjectTitle'),
      t('map:canvas.confirm.deleteObjectBody', { name: target.name ?? target.kind }),
      async () => {
        await trackCanvasWrite(canvasApi.deleteObject(target.id, projectIdNumber));
        setObjects((current) => current.filter((object) => object.id !== target.id));
        setSelectedObjectId(null);
      },
    );
  }, [contextMenu?.targetObject, projectIdNumber, selectedObject, showConfirmDialog, t]);

  useEffect(() => {
    if (inlineTextEdit) return;
    if (!selectedObject) return;
    if (selectedObject.kind !== 'text' && selectedObject.kind !== 'curve_text') return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (event.key !== 'Delete') return;
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      if (document.querySelector('[role="dialog"]')) return;
      event.preventDefault();
      deleteSelected();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deleteSelected, inlineTextEdit, selectedObject]);

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

  const createShapePresetAt = useCallback(async (point: CanvasPoint, variant: ShapeVariant) => {
    if (!scene) return;
    const layer = await contentLayer();
    const created = await createCanvasObject(buildShapeCreateInput(scene.id, layer.id, point, variant));
    setObjects((current) => [...current, created]);
    setSelectedObjectId(created.id);
    setMode('select');
  }, [contentLayer, createCanvasObject, scene]);

  const addShapePreset = useCallback((variant: ShapeVariant, point?: CanvasPoint) => {
    const placement = point ?? pixiCanvasRef.current?.getViewportCenter() ?? { x: 0, y: 0 };
    void createShapePresetAt(placement, variant);
  }, [createShapePresetAt]);

  const duplicateSelected = useCallback(async () => {
    if (!selectedForMenu || !scene) return;
    const layer = await contentLayer();
    const transform = objectTransform(selectedForMenu);
    const moved = withObjectPosition(
      selectedForMenu,
      transform.x + 24,
      transform.y + 24,
    );
    const created = await createCanvasObject({
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
    });
    setObjects((current) => [...current, created]);
    setSelectedObjectId(created.id);
  }, [contentLayer, createCanvasObject, maxZIndex, scene, selectedForMenu]);

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
      '9': 'image',
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (isBlockedTarget(event.target)) return;

      if (event.key === 'Escape') {
        if (territoryEditSession) {
          cancelTerritoryShapeEdit();
          return;
        }
        if (mode === 'draw_territory') {
          handleCancelTerritoryDrawing();
          setMode('select');
          return;
        }
        if (mode === 'polygon' || mode === 'polyline') {
          if (pixiCanvasRef.current?.cancelDrawing()) {
            setDraftPointsCount(0);
            return;
          }
        }
        setMode('select');
        return;
      }

      if (!event.ctrlKey && !event.metaKey) return;

      if (event.key === '0') {
        event.preventDefault();
        pixiCanvasRef.current?.fitToContent();
        return;
      }

      const next = keyToMode[event.key];
      if (!next) return;
      event.preventDefault();
      setMode(normalizeCanvasModeForSceneType(next, scene?.sceneType));
      if (next !== 'polygon' && next !== 'draw_territory' && next !== 'polyline') {
        pixiCanvasRef.current?.cancelDrawing();
        setDraftPointsCount(0);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [cancelTerritoryShapeEdit, handleCancelTerritoryDrawing, mode, territoryEditSession]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (mode !== 'draw_territory') return;
      const target = event.target as HTMLElement | null;
      if (!target) return;
      const tag = target.tagName.toLowerCase();
      if (target.isContentEditable || tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (document.querySelector('[role="dialog"]')) return;
      if (event.code !== 'KeyR' || event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
      event.preventDefault();
      handleCompleteTerritoryRing();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleCompleteTerritoryRing, mode]);

  if (loading || !scene) {
    return (
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="60vh" gap={2}>
        <CircularProgress />
        <Typography sx={{ color: 'text.secondary' }}>{t('map:page.loading')}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
      <MapToolbar
        sceneName={scene.name}
        sceneType={scene.sceneType}
        sceneTypesById={sceneTypesById}
        navigationTrail={navigationTrail}
        onBreadcrumbNavigate={handleBreadcrumbNavigate}
        onNavigationBack={handleNavigationBack}
        mode={mode}
        onModeChange={(nextMode) => {
          if (mode === 'draw_territory' && nextMode !== 'draw_territory') {
            clearTerritoryDrawingDraft();
          }
          setMode(nextMode);
          if (nextMode !== 'polygon' && nextMode !== 'draw_territory' && nextMode !== 'polyline') {
            pixiCanvasRef.current?.cancelDrawing();
            setDraftPointsCount(0);
          }
        }}
        zoomPercent={zoomPercent}
        onZoomIn={() => pixiCanvasRef.current?.zoomIn()}
        onZoomOut={() => pixiCanvasRef.current?.zoomOut()}
        onResetView={() => pixiCanvasRef.current?.fitToContent()}
        objectCount={objects.length}
        markersCount={markersCount}
        territoriesCount={territoriesCount}
        selectedLabel={selectedLabel}
        draftPointsCount={draftPointsCount}
        onUndoDraftPoint={() => {
          const nextCount = pixiCanvasRef.current?.undoDrawingPoint() ?? 0;
          setDraftPointsCount(nextCount);
        }}
        onFinishTerritory={() => {
          if (mode === 'draw_territory') {
            const currentRing = pixiCanvasRef.current?.getDrawingPoints() ?? [];
            finishTerritoryDrawing(currentRing);
            return;
          }
          pixiCanvasRef.current?.finishDrawing();
        }}
        onCancelTerritory={handleCancelTerritoryDrawing}
        onAddImage={() => openImagePickerAt()}
        onAddShape={(variant) => addShapePreset(variant)}
      />

      <Typography
        variant="caption"
        sx={{ color: 'text.secondary', mb: 0.25, display: 'block', fontSize: '0.8rem', lineHeight: 1.45 }}
      >
        {canvasModeHint}
      </Typography>
      <Typography
        variant="caption"
        component="div"
        sx={{ color: 'text.secondary', mb: territoryEditSession ? 0.5 : 1, fontSize: '0.72rem', lineHeight: 1.4 }}
      >
        {t('map:page.modeShortcutsHint')}
      </Typography>
      {territoryEditSession && (
        <Typography
          variant="caption"
          sx={{ color: 'text.secondary', mb: 1, display: 'block', fontSize: '0.75rem' }}
        >
          {t('map:editingPoints.escHint')}
        </Typography>
      )}

      <input ref={imageInputRef} type="file" hidden accept="image/*" onChange={uploadBackground} />
      <input ref={mapBackgroundInputRef} type="file" hidden accept="image/*" onChange={uploadMapSceneBackground} />
      <input ref={childMapImageInputRef} type="file" hidden accept="image/*" onChange={(event) => { void handleChildMapImageSelected(event); }} />
      <input ref={dialogNestedMapImageInputRef} type="file" hidden accept="image/*" onChange={handleDialogNestedMapImagePick} />

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
          objects={canvasObjects}
          linkedSceneNames={linkedSceneNames}
          linkedSceneBackgroundPaths={linkedSceneBackgroundPaths}
          sceneContainerLabels={sceneContainerLabels}
          territoryEditRings={territoryEditSession?.rings ?? null}
          onTerritoryEditChange={(rings) => {
            setTerritoryEditSession((current) => (current ? { ...current, rings } : null));
          }}
          onTerritoryVertexDeleteRejected={() => {
            showSnackbar(t('map:snackbar.deleteRingMinVertices'), 'warning');
          }}
          selectedObjectId={selectedObjectId}
          mode={mode}
          onCanvasClick={handleCanvasClick}
          onShiftCanvasClick={handleShiftCanvasClick}
          onObjectSelect={handleObjectSelect}
          onObjectMove={handleObjectMove}
          onCurveTextGeometryDraft={handleCurveTextGeometryDraft}
          onCurveTextGeometryCommit={handleCurveTextGeometryCommit}
          onTextEditRequest={handleTextEditRequest}
          editingTextObjectId={inlineTextEdit?.objectId ?? null}
          onMarkerOpenLinkedScene={handleMarkerOpenLinkedScene}
          onDraftPointCountChange={(count) => {
            setDraftPointsCount(count);
          }}
          onCreatePolygon={createPolygon}
          onCreateTerritory={finishTerritoryDrawing}
          territoryDraftCompletedRings={territoryCompletedRings}
          onCreatePolyline={createPolyline}
          onImageLoadError={handleImageLoadError}
          onViewportChange={handleViewportChange}
          onLargeBackgroundStatus={setLargeBackgroundStatus}
          onContextMenu={setContextMenu}
        />

        {inlineTextEdit && inlineEditObject && (
          <MapInlineTextEditor
            getLayout={() => pixiCanvasRef.current?.getTextEditLayout(inlineTextEdit.objectId) ?? null}
            layoutTick={textLayoutTick}
            initialText={resolveTextContent(inlineEditObject)}
            selectAll={inlineTextEdit.selectAll}
            replaceWithSeed={inlineTextEdit.replaceWithSeed}
            onCommit={handleInlineTextCommit}
            onCancel={handleInlineTextCancel}
          />
        )}

        {mapSceneNeedsBackground(scene) && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              zIndex: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              px: 3,
              textAlign: 'center',
              backgroundColor: alpha(theme.palette.background.default, 0.88),
              backdropFilter: 'blur(6px)',
            }}
          >
            <Typography variant="h6" sx={{ fontFamily: '"Cinzel", serif' }}>
              {t('map:mapBackground.missingTitle')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420 }}>
              {t('map:mapBackground.missingHint')}
            </Typography>
            <Button
              variant="contained"
              startIcon={<CloudUploadIcon />}
              onClick={() => mapBackgroundInputRef.current?.click()}
            >
              {t('map:mapBackground.addButton')}
            </Button>
          </Box>
        )}

        {(mode === 'draw_territory' || territoryEditSession) && (
          <Box
            sx={{
              position: 'absolute',
              left: '50%',
              bottom: 16,
              transform: 'translateX(-50%)',
              zIndex: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
              flexWrap: 'wrap',
              justifyContent: 'center',
              maxWidth: 'calc(100% - 32px)',
              px: 1,
              py: 0.75,
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.divider, 0.65)}`,
              backgroundColor: alpha(theme.palette.background.paper, 0.92),
              boxShadow: theme.shadows[6],
              backdropFilter: 'blur(10px)',
            }}
          >
            {territoryEditSession ? (
              <>
                <Chip
                  size="small"
                  color="warning"
                  variant="outlined"
                  label={t('map:editingPoints.banner', {
                    name: territoryEditSession.snapshot.name?.trim()
                      || t('map:territoryDialog.previewNameFallback'),
                    ringCount: territoryEditSession.rings.length,
                    pointCount: territoryEditSession.rings.reduce((sum, ring) => sum + ring.length, 0),
                  })}
                />
                <Button size="small" variant="outlined" onClick={cancelTerritoryShapeEdit}>
                  {t('common:cancel')}
                </Button>
                <Button size="small" variant="contained" onClick={() => { void saveTerritoryShapeEdit(); }}>
                  {t('map:canvas.toolbar.save')}
                </Button>
              </>
            ) : (
              <>
                <Chip
                  size="small"
                  variant="outlined"
                  label={t('map:canvas.toolbar.drawingChip', {
                    rings: territoryCompletedRings.length,
                    points: draftPointsCount,
                  })}
                />
                <Button
                  size="small"
                  variant="outlined"
                  disabled={draftPointsCount < 3}
                  onClick={handleCompleteTerritoryRing}
                >
                  {t('map:canvas.toolbar.completeContour')}
                </Button>
                <Button size="small" variant="outlined" onClick={handleCancelTerritoryDrawing}>
                  {t('common:cancel')}
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  disabled={territoryCompletedRings.length === 0 && draftPointsCount < 3}
                  onClick={() => {
                    const currentRing = pixiCanvasRef.current?.getDrawingPoints() ?? [];
                    finishTerritoryDrawing(currentRing);
                  }}
                >
                  {t('map:canvas.toolbar.save')}
                </Button>
              </>
            )}
          </Box>
        )}

        {selectedObject?.kind === 'marker' && (
          <Box sx={{ position: 'absolute', right: 0, top: 0, bottom: 0, zIndex: 2 }}>
            <MapMarkerPanel
              selectedMarker={selectedObject}
              linkedNote={selectedObject.linkedNoteId ? notesMap.get(selectedObject.linkedNoteId) : undefined}
              onClose={() => setSelectedObjectId(null)}
              onNavigateToNote={(noteId) => navigate(`/project/${projectIdNumber}/notes/${noteId}`)}
              onOpenChildMap={
                selectedObject.linkedSceneId != null
                  ? () => handleOpenChildMap(selectedObject.linkedSceneId!)
                  : undefined
              }
              onCreateChildMap={() => handleCreateChildMapFromPanel(selectedObject)}
              onEditMarker={(marker) => openMarkerDialog(null, marker)}
              onDeleteMarker={() => deleteSelected()}
            />
          </Box>
        )}

        {selectedObject?.kind === 'territory' && (
          <Box sx={{ position: 'absolute', right: 0, top: 0, bottom: 0, zIndex: 2 }}>
            <MapTerritoryPanel
              selectedTerritory={selectedObject}
              faction={selectedTerritoryFaction}
              onClose={() => setSelectedObjectId(null)}
              onNavigateToFaction={handleNavigateToFaction}
              onEditTerritory={(territory) => openTerritoryDialog(null, territory)}
              onDeleteTerritory={() => deleteSelected()}
              onStartEditingPoints={(territory) => handleStartTerritoryPointEdit(territory)}
            />
          </Box>
        )}

        {(selectedObject?.kind === 'text' || selectedObject?.kind === 'curve_text') && (
          <Box sx={{ position: 'absolute', right: 0, top: 0, bottom: 0, zIndex: 2 }}>
            <MapTextPanel
              key={selectedObject.id}
              projectId={projectIdNumber}
              selectedObject={selectedObject}
              presets={textPresets}
              onPresetsChange={setTextPresets}
              onActivePresetChange={setActiveTextPresetId}
              onClose={() => setSelectedObjectId(null)}
              onSave={handleTextObjectSave}
              onDelete={() => deleteSelected()}
            />
          </Box>
        )}

        {selectedObject && isShapeKind(selectedObject.kind) && (
          <Box sx={{ position: 'absolute', right: 0, top: 0, bottom: 0, zIndex: 2 }}>
            <MapShapePanel
              key={selectedObject.id}
              selectedObject={selectedObject}
              onClose={() => setSelectedObjectId(null)}
              onSave={handleShapeObjectSave}
              onDelete={() => deleteSelected()}
            />
          </Box>
        )}

        {selectedObject
          && selectedObject.kind !== 'marker'
          && selectedObject.kind !== 'territory'
          && selectedObject.kind !== 'text'
          && selectedObject.kind !== 'curve_text'
          && !isShapeKind(selectedObject.kind) && (
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
            <Stack spacing={1.5}>
              <Typography variant="subtitle2" color="text.secondary">{t('map:canvas.selection.title')}</Typography>
              <Typography fontWeight={700}>{selectedObject.name ?? selectedObject.kind}</Typography>
              <Typography variant="caption" color="text.secondary">
                {selectedObject.kind === 'scene_container' ? t('map:canvas.sceneContainer.selectionType') : t('map:canvas.selection.meta', {
                  kind: selectedObject.kind,
                  layer: selectedObject.layerId,
                  z: selectedObject.zIndex,
                })}
              </Typography>
              {selectedObject.kind === 'scene_container' && selectedObject.linkedSceneId != null && (
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  onClick={() => handleOpenChildMap(selectedObject.linkedSceneId!, 'container')}
                >
                  {t('map:canvas.sceneContainer.openAction')}
                </Button>
              )}
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
        sceneType={scene.sceneType}
        onClose={() => setContextMenu(null)}
        onAddMarker={() => {
          if (!contextMenu) return;
          openMarkerDialog({ x: contextMenu.worldX, y: contextMenu.worldY });
        }}
        onAddText={() => {
          placeByContextMenu(async (point) => {
            await placeCreatedText(point, 'text');
          });
        }}
        onAddImage={() => {
          if (!contextMenu) return;
          openImagePickerAt({ x: contextMenu.worldX, y: contextMenu.worldY });
        }}
        onAddShape={(variant) => {
          placeByContextMenu(async (point) => createShapePresetAt(point, variant));
        }}
        onEditSelected={() => {
          if (!selectedForMenu) return;
          if (selectedForMenu.kind === 'marker') {
            openMarkerDialog(null, selectedForMenu);
            return;
          }
          if (selectedForMenu.kind === 'territory') {
            openTerritoryDialog(null, selectedForMenu);
            return;
          }
          setSelectedObjectId(selectedForMenu.id);
        }}
        onDeleteSelected={deleteSelected}
        onDuplicateSelected={() => {
          void duplicateSelected();
        }}
        onBringToFront={bringToFront}
        onSendToBack={sendToBack}
      />

      <MapTerritoryDialog
        open={territoryDialogOpen}
        onClose={closeTerritoryDialog}
        editingTerritory={editingTerritory}
        territoryForm={territoryForm}
        setTerritoryForm={setTerritoryForm}
        factions={factions}
        onSave={() => {
          void saveTerritory();
        }}
      />

      <MapMarkerDialog
        open={markerDialogOpen}
        onClose={closeMarkerDialog}
        editingMarker={editingMarker}
        markerForm={markerForm}
        setMarkerForm={setMarkerForm}
        notes={notes}
        notesMap={notesMap}
        canCreateNestedMap={editingMarker?.linkedSceneId == null}
        createNestedMap={createNestedMapInDialog}
        onCreateNestedMapChange={setCreateNestedMapInDialog}
        nestedMapImageName={nestedMapImageName}
        onPickNestedMapImage={() => dialogNestedMapImageInputRef.current?.click()}
        onClearNestedMapImage={() => {
          setNestedMapImageFile(null);
          setNestedMapImageName(null);
        }}
        onSave={() => {
          void saveMarker();
        }}
      />

      <MapSceneContainerDialog
        open={sceneContainerDialogOpen}
        onClose={() => {
          setSceneContainerDialogOpen(false);
          setPendingSceneContainerPoint(null);
          setMode('select');
        }}
        onSave={handleSaveSceneContainer}
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
