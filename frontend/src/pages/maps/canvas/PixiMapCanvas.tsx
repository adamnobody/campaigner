import {
  Application,
  Assets,
  Container,
  Graphics,
  Point,
  Rectangle,
  Sprite,
  Texture,
  TilingSprite,
  type FederatedPointerEvent,
} from 'pixi.js';
import { resolveUploadAssetUrl } from '@/utils/uploadAssetUrl';
import { Viewport } from 'pixi-viewport';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import type { CanvasLayer, CanvasObject, CanvasScene } from '@/api/canvas';
import type { MapContextMenuState } from '../components/MapCanvasContextMenu';
import { computeObjectsBounds } from './canvasBounds';
import { isMapScene } from './canvasTools';
import {
  buildMapAutoFitKey,
  clampPointToMapBounds,
  clampViewportPersistToMapBounds,
  computeFitToBoundsViewport,
  getCanvasWorldSize,
  getMapSceneWorldBounds,
  isImageBackedMapScene,
  isMapViewportMisaligned,
  isPointInsideMapBounds,
  resolveMapBackgroundAssetPath,
  shouldAutoFitMapBackgroundOnLoad,
  shouldUseInfiniteCanvas,
  type MapBackgroundSize,
} from './mapBackground';
import {
  canEditCurveTextBezierHandles,
  curveTextGeometryJsonEquals,
  getCurveTextBezierGeometry,
  getCurveTextHandleWorldPositions,
  hitCurveTextHandle,
  mergeCurveTextGeometryDraft,
  withUpdatedCurveTextHandle,
  type CurveTextHandleId,
} from './curveTextHandles';
import type { CanvasMode, CanvasPoint } from './canvasModel';
import { objectTransform, withObjectPosition } from './canvasModel';
import { textEditLayoutFromObject, textObjectWorldAnchor, type TextEditScreenLayout } from './textEditLayout';
import {
  hitTestObjects,
  reconcilePixiObjects,
  type ReconcileState,
  type SceneContainerDisplayLabels,
} from './canvasReconciler';
import {
  deleteTerritoryVertex,
  findNearestTerritoryEdge,
  hitTerritoryVertex,
  insertTerritoryVertexOnEdge,
  moveTerritoryVertex,
} from './territoryGeometry';
import {
  applyPersistToViewport,
  clampZoom,
  fitViewportToBounds,
  isBoundsVisibleInViewport,
  isDefaultPersist,
  MAX_ZOOM,
  MIN_ZOOM,
  parseStoredViewport,
  persistFromViewport,
  shouldAutoFitOnLoad,
  snapshotFromViewport,
  type ViewportPersist,
} from './canvasViewport';

const DOT_STEP = 64;
const DOT_COLOR = 0xb4c5d6;
const DOT_ALPHA = 0.38;
const DOT_RADIUS = 2;

type DragState = {
  objectId: number;
  offsetX: number;
  offsetY: number;
  startX: number;
  startY: number;
  moved: boolean;
} | null;

type PanState = {
  startX: number;
  startY: number;
  viewportX: number;
  viewportY: number;
} | null;

type DrawPointerState = {
  downX: number;
  downY: number;
  moved: boolean;
} | null;

type VertexDragState = {
  ringIndex: number;
  pointIndex: number;
} | null;

type CurveHandleDragState = {
  objectId: number;
  handle: CurveTextHandleId;
} | null;

const VERTEX_HIT_PX = 10;
const CURVE_HANDLE_HIT_PX = 12;
const EDGE_HIT_PX = 14;
const VERTEX_GUARD_PX = 8;

type Props = {
  scene: CanvasScene;
  layers: CanvasLayer[];
  objects: CanvasObject[];
  selectedObjectId: number | null;
  mode: CanvasMode;
  onCanvasClick: (point: CanvasPoint) => void;
  onShiftCanvasClick?: (point: CanvasPoint) => void;
  onObjectSelect: (object: CanvasObject | null) => void;
  onObjectMove: (object: CanvasObject, point: CanvasPoint) => void;
  onCurveTextGeometryDraft?: (object: CanvasObject) => void;
  onCurveTextGeometryCommit?: (object: CanvasObject) => void;
  /** Double-click on text / curve_text opens inline editor. */
  onTextEditRequest?: (object: CanvasObject) => void;
  editingTextObjectId?: number | null;
  /** Double-click on a marker that has linkedSceneId (select mode, no drag). */
  onMarkerOpenLinkedScene?: (object: CanvasObject) => void;
  onDraftPointCountChange: (count: number) => void;
  onCreatePolygon: (points: CanvasPoint[]) => void;
  onCreateTerritory: (points: CanvasPoint[]) => void;
  onCreatePolyline: (points: CanvasPoint[]) => void;
  onImageLoadError: (object: CanvasObject, resourcePath: string) => void;
  onViewportChange: (viewport: ViewportPersist) => void;
  onLargeBackgroundStatus: (status: string) => void;
  onContextMenu: (menu: MapContextMenuState) => void;
  /** When set, shows vertex handles and edits rings in world coordinates (all rings drawn in overlay). */
  territoryEditRings: CanvasPoint[][] | null;
  onTerritoryEditChange: (rings: CanvasPoint[][]) => void;
  onTerritoryVertexDeleteRejected: () => void;
  /** Closed rings already finished via «Complete ring» (draw_territory only). */
  territoryDraftCompletedRings?: CanvasPoint[][];
  linkedSceneNames?: ReadonlyMap<number, string>;
  linkedSceneBackgroundPaths?: ReadonlyMap<number, string>;
  sceneContainerLabels?: SceneContainerDisplayLabels;
};

export type PixiMapCanvasHandle = {
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
  fitToContent: () => void;
  getViewportCenter: () => CanvasPoint;
  undoDrawingPoint: () => number;
  finishDrawing: () => number;
  cancelDrawing: () => boolean;
  getDrawingPoints: () => CanvasPoint[];
  clearDrawingPoints: () => void;
  getTextEditLayout: (objectId: number) => TextEditScreenLayout | null;
};

const isClosedDrawMode = (mode: CanvasMode): boolean =>
  mode === 'polygon' || mode === 'draw_territory';

const isDrawingMode = (mode: CanvasMode): boolean =>
  isClosedDrawMode(mode) || mode === 'polyline';

const pointFromEvent = (viewport: Viewport, event: FederatedPointerEvent): CanvasPoint => {
  const world = viewport.toWorld(event.global);
  return { x: world.x, y: world.y };
};

const sceneViewportPersist = (scene: CanvasScene, screenWidth: number, screenHeight: number): ViewportPersist =>
  parseStoredViewport(scene.viewportJson, screenWidth, screenHeight);

const redrawDraftPolyline = (
  graphics: Graphics,
  viewport: Viewport,
  mode: CanvasMode,
  points: CanvasPoint[],
  hoverPoint: CanvasPoint | null,
  snapToFirst: boolean,
  skipClear = false,
): void => {
  if (!skipClear) graphics.clear();
  if (points.length === 0) return;
  graphics.moveTo(points[0].x, points[0].y);
  for (let index = 1; index < points.length; index += 1) {
    graphics.lineTo(points[index].x, points[index].y);
  }
  if (hoverPoint) {
    graphics.lineTo(hoverPoint.x, hoverPoint.y);
  }
  graphics.stroke({ color: 0xf8d7a4, alpha: 0.92, width: 2 });

  if (isClosedDrawMode(mode) && points.length >= 2) {
    graphics.moveTo(points[points.length - 1].x, points[points.length - 1].y);
    if (snapToFirst) {
      graphics.lineTo(points[0].x, points[0].y);
    } else if (hoverPoint) {
      graphics.lineTo(hoverPoint.x, hoverPoint.y);
    }
    graphics.stroke({ color: 0x9ff3df, alpha: 0.45, width: 1.5 });
  }

  points.forEach((point) => {
    graphics.circle(point.x, point.y, 3).fill({ color: 0xf8d7a4, alpha: 0.9 });
  });

  if (isClosedDrawMode(mode)) {
    const first = points[0];
    if (first) {
      const markerRadius = snapToFirst ? 8 / viewport.scale.x : 5 / viewport.scale.x;
      graphics.circle(first.x, first.y, markerRadius).fill({ color: 0x9ff3df, alpha: snapToFirst ? 0.95 : 0.55 });
    }
  }
};

const createDotTexture = (app: Application): Texture => {
  const graphics = new Graphics();
  graphics.circle(DOT_STEP / 2, DOT_STEP / 2, DOT_RADIUS).fill({ color: DOT_COLOR, alpha: DOT_ALPHA });
  const texture = app.renderer.generateTexture({
    target: graphics,
    frame: new Rectangle(0, 0, DOT_STEP, DOT_STEP),
  });
  graphics.destroy();
  return texture;
};

const positiveMod = (value: number, modulus: number): number =>
  ((value % modulus) + modulus) % modulus;

const updateDots = (dots: TilingSprite, viewport: Viewport, width: number, height: number): void => {
  dots.width = width;
  dots.height = height;
  const scale = clampZoom(viewport.scale.x);
  const tileSize = DOT_STEP * scale;
  const offset = (DOT_STEP / 2) * scale;
  dots.tileScale.set(scale, scale);
  dots.tilePosition.set(
    positiveMod(viewport.x + offset, tileSize),
    positiveMod(viewport.y + offset, tileSize),
  );
};

export const PixiMapCanvas = forwardRef<PixiMapCanvasHandle, Props>(function PixiMapCanvas({
  scene,
  layers,
  objects,
  selectedObjectId,
  mode,
  onCanvasClick,
  onShiftCanvasClick,
  onObjectSelect,
  onObjectMove,
  onCurveTextGeometryDraft,
  onCurveTextGeometryCommit,
  onTextEditRequest,
  editingTextObjectId = null,
  onMarkerOpenLinkedScene,
  onDraftPointCountChange,
  onCreatePolygon,
  onCreateTerritory,
  onCreatePolyline,
  onImageLoadError,
  onViewportChange,
  onLargeBackgroundStatus,
  onContextMenu,
  territoryEditRings,
  onTerritoryEditChange,
  onTerritoryVertexDeleteRejected,
  territoryDraftCompletedRings = [],
  linkedSceneNames,
  linkedSceneBackgroundPaths,
  sceneContainerLabels,
}, ref) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const appRef = useRef<Application | null>(null);
  const viewportRef = useRef<Viewport | null>(null);
  const backgroundLayerRef = useRef<Container | null>(null);
  const backgroundSizeRef = useRef<MapBackgroundSize | null>(null);
  const [backgroundLoadTick, setBackgroundLoadTick] = useState(0);
  const rootObjectsRef = useRef<Container | null>(null);
  const reconcileStateRef = useRef<ReconcileState>({ layerContainers: new Map(), objects: new Map() });
  const dotsRef = useRef<TilingSprite | null>(null);
  const dotTextureRef = useRef<Texture | null>(null);
  const draftRef = useRef<Graphics | null>(null);
  const dragStateRef = useRef<DragState>(null);
  const panStateRef = useRef<PanState>(null);
  const drawPointerRef = useRef<DrawPointerState>(null);
  const drawingPointsRef = useRef<CanvasPoint[]>([]);
  const drawingHoverRef = useRef<CanvasPoint | null>(null);
  const snapToFirstRef = useRef(false);
  const lastDrawClickRef = useRef<{ at: number; x: number; y: number } | null>(null);
  const lastTerritoryEditClickRef = useRef<{ at: number; x: number; y: number } | null>(null);
  const vertexDragRef = useRef<VertexDragState>(null);
  const curveHandleDragRef = useRef<CurveHandleDragState>(null);
  const curveTextGeometryDraftRef = useRef<CanvasObject | null>(null);
  const objectDragPositionRef = useRef<{ objectId: number; x: number; y: number } | null>(null);
  const objectsPropRef = useRef<CanvasObject[]>(objects);
  const selectedObjectIdRef = useRef<number | null>(selectedObjectId);
  const territoryEditRingsRef = useRef<CanvasPoint[][] | null>(null);
  const territoryDraftCompletedRingsRef = useRef<CanvasPoint[][]>([]);
  const onTerritoryEditChangeRef = useRef(onTerritoryEditChange);
  const onTerritoryVertexDeleteRejectedRef = useRef(onTerritoryVertexDeleteRejected);
  const lastMarkerClickRef = useRef<{ objectId: number; at: number } | null>(null);
  const lastTextClickRef = useRef<{ objectId: number; at: number } | null>(null);
  const editingTextObjectIdRef = useRef<number | null>(editingTextObjectId);
  const spacePressedRef = useRef(false);
  const canvasHostRef = useRef<HTMLCanvasElement | null>(null);
  const liveObjectsRef = useRef<CanvasObject[]>(objects);
  const currentModeRef = useRef<CanvasMode>(mode);
  const sceneRef = useRef<CanvasScene>(scene);
  const onCanvasClickRef = useRef(onCanvasClick);
  const onShiftCanvasClickRef = useRef(onShiftCanvasClick);
  const shiftClickPointerRef = useRef<{ downX: number; downY: number; worldPoint: CanvasPoint } | null>(null);
  const onObjectSelectRef = useRef(onObjectSelect);
  const onObjectMoveRef = useRef(onObjectMove);
  const onCurveTextGeometryDraftRef = useRef(onCurveTextGeometryDraft);
  const onCurveTextGeometryCommitRef = useRef(onCurveTextGeometryCommit);
  const onTextEditRequestRef = useRef(onTextEditRequest);
  const onMarkerOpenLinkedSceneRef = useRef(onMarkerOpenLinkedScene);
  const onDraftPointCountChangeRef = useRef(onDraftPointCountChange);
  const onCreatePolygonRef = useRef(onCreatePolygon);
  const onCreateTerritoryRef = useRef(onCreateTerritory);
  const onCreatePolylineRef = useRef(onCreatePolyline);
  const onImageLoadErrorRef = useRef(onImageLoadError);
  const onViewportChangeRef = useRef(onViewportChange);
  const onContextMenuRef = useRef(onContextMenu);
  const onLargeBackgroundStatusRef = useRef(onLargeBackgroundStatus);
  const sceneIdRef = useRef<number | null>(null);
  const autoFitKeyRef = useRef<string | null>(null);
  const userViewAdjustedRef = useRef(false);
  const applyingCameraRef = useRef(false);
  const [pixiReady, setPixiReady] = useState(false);
  const [viewportScale, setViewportScale] = useState(1);
  const layersRef = useRef(layers);
  const viewportScaleRef = useRef(viewportScale);
  const linkedSceneNamesRef = useRef(linkedSceneNames);
  const linkedSceneBackgroundPathsRef = useRef(linkedSceneBackgroundPaths);
  const sceneContainerLabelsRef = useRef(sceneContainerLabels);

  const forceRender = () => {
    appRef.current?.render();
  };

  const resolveEffectiveObjects = (source = objectsPropRef.current): CanvasObject[] => {
    let list = mergeCurveTextGeometryDraft(source, curveTextGeometryDraftRef.current);
    const dragPosition = objectDragPositionRef.current;
    if (dragPosition) {
      list = list.map((object) => (
        object.id === dragPosition.objectId
          ? withObjectPosition(object, dragPosition.x, dragPosition.y)
          : object
      ));
    }
    return list;
  };

  const objectPositionNear = (object: CanvasObject, x: number, y: number): boolean => {
    const transform = objectTransform(object);
    return Math.abs(transform.x - x) < 0.5 && Math.abs(transform.y - y) < 0.5;
  };

  const syncPendingObjectDragPosition = (source: CanvasObject[]) => {
    const dragPosition = objectDragPositionRef.current;
    if (!dragPosition) return;
    const committed = source.find((item) => item.id === dragPosition.objectId);
    if (committed && objectPositionNear(committed, dragPosition.x, dragPosition.y)) {
      objectDragPositionRef.current = null;
    }
  };

  const isInteractiveObjectDragActive = () => (
    Boolean(curveHandleDragRef.current || objectDragPositionRef.current)
  );

  const syncCurveTextDraft = (draft: CanvasObject) => {
    curveTextGeometryDraftRef.current = draft;
    liveObjectsRef.current = resolveEffectiveObjects();
  };

  const reconcileLiveObjects = () => {
    const root = rootObjectsRef.current;
    if (!root) return;
    const effectiveObjects = resolveEffectiveObjects();
    liveObjectsRef.current = effectiveObjects;
    reconcilePixiObjects(
      root,
      reconcileStateRef.current,
      layersRef.current,
      effectiveObjects,
      selectedObjectIdRef.current,
      (object, resourcePath) => {
        onImageLoadErrorRef.current(object, resourcePath);
      },
      {
        viewportScale: viewportScaleRef.current,
        linkedSceneNames: linkedSceneNamesRef.current,
        linkedSceneBackgroundPaths: linkedSceneBackgroundPathsRef.current,
        sceneContainerLabels: sceneContainerLabelsRef.current,
        editingTextObjectId: editingTextObjectIdRef.current,
      },
    );
    forceRender();
  };

  objectsPropRef.current = objects;
  layersRef.current = layers;
  viewportScaleRef.current = viewportScale;
  linkedSceneNamesRef.current = linkedSceneNames;
  linkedSceneBackgroundPathsRef.current = linkedSceneBackgroundPaths;
  sceneContainerLabelsRef.current = sceneContainerLabels;
  liveObjectsRef.current = resolveEffectiveObjects();
  currentModeRef.current = mode;
  sceneRef.current = scene;
  onCanvasClickRef.current = onCanvasClick;
  onShiftCanvasClickRef.current = onShiftCanvasClick;
  onObjectSelectRef.current = onObjectSelect;
  onObjectMoveRef.current = onObjectMove;
  onCurveTextGeometryDraftRef.current = onCurveTextGeometryDraft;
  onCurveTextGeometryCommitRef.current = onCurveTextGeometryCommit;
  onTextEditRequestRef.current = onTextEditRequest;
  editingTextObjectIdRef.current = editingTextObjectId;
  selectedObjectIdRef.current = selectedObjectId;
  onMarkerOpenLinkedSceneRef.current = onMarkerOpenLinkedScene;
  onDraftPointCountChangeRef.current = onDraftPointCountChange;
  onCreatePolygonRef.current = onCreatePolygon;
  onCreateTerritoryRef.current = onCreateTerritory;
  onCreatePolylineRef.current = onCreatePolyline;
  onImageLoadErrorRef.current = onImageLoadError;
  onViewportChangeRef.current = onViewportChange;
  onContextMenuRef.current = onContextMenu;
  onLargeBackgroundStatusRef.current = onLargeBackgroundStatus;
  territoryEditRingsRef.current = territoryEditRings;
  territoryDraftCompletedRingsRef.current = territoryDraftCompletedRings;
  onTerritoryEditChangeRef.current = onTerritoryEditChange;
  onTerritoryVertexDeleteRejectedRef.current = onTerritoryVertexDeleteRejected;

  const updateCursor = (cursor: string) => {
    if (!canvasHostRef.current) return;
    canvasHostRef.current.style.cursor = cursor;
  };

  const redrawTerritoryEdit = () => {
    const viewport = viewportRef.current;
    const draft = draftRef.current;
    const rings = territoryEditRingsRef.current;
    if (!viewport || !draft) return;
    draft.clear();
    if (!rings) return;
    const scale = Math.max(viewport.scale.x, 0.05);
    rings.forEach((ring, ringIndex) => {
      if (ring.length < 2) return;
      const strokeColor = ringIndex === 0 ? 0xf8d7a4 : 0x5ecfff;
      if (ring.length >= 3) {
        const flat = ring.flatMap((point) => [point.x, point.y]);
        draft.poly(flat).fill({ color: strokeColor, alpha: ringIndex === 0 ? 0.14 : 0.08 })
          .stroke({ color: strokeColor, width: 2, alpha: 0.85 });
      } else {
        draft.moveTo(ring[0].x, ring[0].y);
        for (let index = 1; index < ring.length; index += 1) {
          draft.lineTo(ring[index].x, ring[index].y);
        }
        draft.stroke({ color: strokeColor, width: 2, alpha: 0.85 });
      }
      ring.forEach((point) => {
        draft.circle(point.x, point.y, 5 / scale).fill({ color: 0xf8d7a4, alpha: 0.95 });
        draft.circle(point.x, point.y, 7 / scale).stroke({ color: 0xffffff, width: 1.5 / scale, alpha: 0.9 });
      });
    });
    forceRender();
  };

  const redrawDraft = () => {
    if (territoryEditRingsRef.current) {
      redrawTerritoryEdit();
      return;
    }
    const viewport = viewportRef.current;
    const draft = draftRef.current;
    if (!viewport || !draft) return;
    draft.clear();
    const completed = territoryDraftCompletedRingsRef.current;
    if (completed.length > 0 && currentModeRef.current === 'draw_territory') {
      for (const ring of completed) {
        if (ring.length < 3) continue;
        const flat = ring.flatMap((point) => [point.x, point.y]);
        draft.poly(flat).stroke({ color: 0x5ecfff, alpha: 0.55, width: 1.5 });
      }
    }
    redrawDraftPolyline(
      draft,
      viewport,
      currentModeRef.current,
      drawingPointsRef.current,
      drawingHoverRef.current,
      snapToFirstRef.current,
      true,
    );

    const selectedCurveText = getSelectedCurveTextObject();
    if (
      selectedCurveText
      && canEditCurveTextBezierHandles(selectedCurveText)
      && currentModeRef.current === 'select'
    ) {
      drawCurveTextHandles(draft, viewport, selectedCurveText);
    }

    forceRender();
  };

  const setDrawingPoints = (points: CanvasPoint[]) => {
    drawingPointsRef.current = points;
    onDraftPointCountChangeRef.current(points.length);
    redrawDraft();
  };

  const clearDrawing = () => {
    drawingHoverRef.current = null;
    snapToFirstRef.current = false;
    lastDrawClickRef.current = null;
    setDrawingPoints([]);
  };

  const isFiniteMapActive = () =>
    isImageBackedMapScene(sceneRef.current, backgroundSizeRef.current);

  const getFiniteMapBounds = () => {
    const size = backgroundSizeRef.current;
    return size ? getMapSceneWorldBounds(size) : null;
  };

  const resizeViewportWorld = (viewport: Viewport) => {
    const world = getCanvasWorldSize(sceneRef.current, backgroundSizeRef.current);
    viewport.resize(viewport.screenWidth, viewport.screenHeight, world.width, world.height);
  };

  const fitMapBackgroundToViewport = (viewport: Viewport, size: MapBackgroundSize): ViewportPersist => {
    const mapBounds = getMapSceneWorldBounds(size);
    applyingCameraRef.current = true;
    try {
      resizeViewportWorld(viewport);
      const persist = computeFitToBoundsViewport(
        viewport.screenWidth,
        viewport.screenHeight,
        mapBounds,
      );
      applyPersistToViewport(viewport, persist);
      return persist;
    } finally {
      applyingCameraRef.current = false;
    }
  };

  const applyCamera = (viewport: Viewport, persist: ViewportPersist) => {
    applyingCameraRef.current = true;
    applyPersistToViewport(viewport, persist);
    applyingCameraRef.current = false;
  };

  const syncDots = () => {
    const viewport = viewportRef.current;
    const dots = dotsRef.current;
    const app = appRef.current;
    if (!viewport || !dots || !app) return;
    dots.visible = shouldUseInfiniteCanvas(sceneRef.current.sceneType);
    if (!dots.visible) return;
    updateDots(dots, viewport, app.renderer.width, app.renderer.height);
  };

  const guardMapPlacementPoint = (point: CanvasPoint): CanvasPoint | null => {
    if (!isFiniteMapActive()) return point;
    const bounds = getFiniteMapBounds();
    if (!bounds) return point;
    return isPointInsideMapBounds(point, bounds) ? point : null;
  };

  const clampCurveHandleWorldPoint = (point: CanvasPoint): CanvasPoint => {
    if (!isFiniteMapActive()) return point;
    const size = backgroundSizeRef.current;
    if (!size) return point;
    return clampPointToMapBounds(point, getMapSceneWorldBounds(size));
  };

  const getSelectedCurveTextObject = (): CanvasObject | null => {
    const selectedId = selectedObjectIdRef.current;
    if (selectedId == null) return null;
    const object = liveObjectsRef.current.find((item) => item.id === selectedId);
    if (!object || object.kind !== 'curve_text') return null;
    return object;
  };

  const applyCurveHandleWorldPoint = (object: CanvasObject, handle: CurveTextHandleId, worldPoint: CanvasPoint) =>
    withUpdatedCurveTextHandle(object, handle, clampCurveHandleWorldPoint(worldPoint));

  const drawCurveTextHandles = (draft: Graphics, viewport: Viewport, object: CanvasObject) => {
    const scale = Math.max(viewport.scale.x, 0.05);
    const geometry = getCurveTextBezierGeometry(object);
    const transform = objectTransform(object);
    const toWorld = (local: CanvasPoint): CanvasPoint => ({
      x: transform.x + local.x,
      y: transform.y + local.y,
    });
    const start = toWorld(geometry.start);
    const control = toWorld(geometry.control);
    const end = toWorld(geometry.end);

    draft.moveTo(start.x, start.y);
    for (let index = 1; index <= 32; index += 1) {
      const t = index / 32;
      const mt = 1 - t;
      draft.lineTo(
        mt * mt * start.x + 2 * mt * t * control.x + t * t * end.x,
        mt * mt * start.y + 2 * mt * t * control.y + t * t * end.y,
      );
    }
    draft.stroke({ color: 0xf8d7a4, width: 1.5 / scale, alpha: 0.75 });

    const drawHandle = (point: CanvasPoint, fill: number) => {
      draft.circle(point.x, point.y, 6 / scale).fill({ color: fill, alpha: 0.95 });
      draft.circle(point.x, point.y, 8 / scale).stroke({ color: 0xffffff, width: 1.5 / scale, alpha: 0.9 });
    };
    drawHandle(start, 0x5ecfff);
    drawHandle(control, 0xf8d7a4);
    drawHandle(end, 0xbb8fce);
  };

  const fitToContentInternal = (source: 'auto' | 'manual') => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const visibleObjects = liveObjectsRef.current.filter((object) => !object.isHidden);
    const finiteMap = isFiniteMapActive();
    const mapBounds = finiteMap ? getFiniteMapBounds() : null;
    const bounds = mapBounds ?? computeObjectsBounds(visibleObjects);
    const cameraBefore = snapshotFromViewport(viewport);

    console.debug('[Canvas] fitToContent', {
      source,
      sceneId: sceneRef.current.id,
      finiteMap,
      objectCount: visibleObjects.length,
      bbox: bounds
        ? {
            minX: bounds.minX,
            minY: bounds.minY,
            maxX: bounds.maxX,
            maxY: bounds.maxY,
          }
        : null,
      cameraBefore,
    });

    if (!bounds || (!finiteMap && visibleObjects.length === 0)) {
      const fallback = sceneViewportPersist(sceneRef.current, viewport.screenWidth, viewport.screenHeight);
      applyCamera(viewport, fallback);
      syncDots();
      setViewportScale(clampZoom(viewport.scale.x));
      onViewportChangeRef.current(persistFromViewport(viewport));
      return;
    }

    if (finiteMap && mapBounds) {
      const persist = computeFitToBoundsViewport(
        viewport.screenWidth,
        viewport.screenHeight,
        mapBounds,
      );
      applyCamera(viewport, persist);
    } else {
      fitViewportToBounds(viewport, bounds);
    }

    if (source === 'manual') {
      userViewAdjustedRef.current = true;
    }

    syncDots();
    console.debug('[Canvas] fitToContent applied', { cameraAfter: snapshotFromViewport(viewport) });
    setViewportScale(clampZoom(viewport.scale.x));
    onViewportChangeRef.current(persistFromViewport(viewport));
  };

  const finishDrawingInternal = () => {
    const points = drawingPointsRef.current;
    if (currentModeRef.current === 'polygon') {
      if (points.length < 3) return points.length;
      onCreatePolygonRef.current(points);
      clearDrawing();
      return 0;
    }
    if (currentModeRef.current === 'draw_territory') {
      if (points.length < 3) return points.length;
      onCreateTerritoryRef.current(points);
      clearDrawing();
      return 0;
    }
    if (currentModeRef.current === 'polyline') {
      if (points.length < 2) return points.length;
      onCreatePolylineRef.current(points);
      clearDrawing();
      return 0;
    }
    return points.length;
  };

  /** Place vertex on pointerdown so rapid clicks are not dropped by small cursor drift before pointerup. */
  const appendDrawingPointAt = (viewport: Viewport, worldPoint: CanvasPoint) => {
    const placementPoint = guardMapPlacementPoint(worldPoint);
    if (!placementPoint) return;

    if (isClosedDrawMode(currentModeRef.current)) {
      if (drawingPointsRef.current.length > 0) {
        const first = drawingPointsRef.current[0];
        const firstScreen = viewport.toScreen(first.x, first.y);
        const clickScreen = viewport.toScreen(placementPoint.x, placementPoint.y);
        const distance = Math.hypot(firstScreen.x - clickScreen.x, firstScreen.y - clickScreen.y);
        if (distance <= 8 && drawingPointsRef.current.length >= 3) {
          finishDrawingInternal();
          return;
        }
      }

      const now = Date.now();
      const last = lastDrawClickRef.current;
      const isDoubleClick = Boolean(
        last && now - last.at < 280 && Math.hypot(last.x - placementPoint.x, last.y - placementPoint.y) < 12,
      );
      lastDrawClickRef.current = { at: now, x: placementPoint.x, y: placementPoint.y };

      const next = [...drawingPointsRef.current, placementPoint];
      setDrawingPoints(next);
      if (isDoubleClick && next.length >= 3) {
        finishDrawingInternal();
      }
      return;
    }

    const now = Date.now();
    const last = lastDrawClickRef.current;
    const isDoubleClick = Boolean(
      last && now - last.at < 280 && Math.hypot(last.x - placementPoint.x, last.y - placementPoint.y) < 12,
    );
    lastDrawClickRef.current = { at: now, x: placementPoint.x, y: placementPoint.y };

    const next = [...drawingPointsRef.current, placementPoint];
    setDrawingPoints(next);
    if (isDoubleClick && next.length >= 2) {
      finishDrawingInternal();
    }
  };

  useImperativeHandle(ref, () => ({
    zoomIn() {
      const viewport = viewportRef.current;
      if (!viewport) return;
      viewport.zoom(0.2, true);
      syncDots();
    },
    zoomOut() {
      const viewport = viewportRef.current;
      if (!viewport) return;
      viewport.zoom(-0.2, true);
      syncDots();
    },
    resetView() {
      fitToContentInternal('manual');
    },
    fitToContent() {
      fitToContentInternal('manual');
    },
    getViewportCenter() {
      const viewport = viewportRef.current;
      if (!viewport) return { x: 0, y: 0 };
      const center = viewport.toWorld(new Point(viewport.screenWidth / 2, viewport.screenHeight / 2));
      return { x: center.x, y: center.y };
    },
    undoDrawingPoint() {
      if (!isDrawingMode(currentModeRef.current)) return 0;
      const next = drawingPointsRef.current.slice(0, -1);
      setDrawingPoints(next);
      return next.length;
    },
    finishDrawing() {
      return finishDrawingInternal();
    },
    cancelDrawing() {
      if (drawingPointsRef.current.length === 0) return false;
      clearDrawing();
      return true;
    },
    getDrawingPoints() {
      return [...drawingPointsRef.current];
    },
    clearDrawingPoints() {
      setDrawingPoints([]);
    },
    getTextEditLayout(objectId: number) {
      const viewport = viewportRef.current;
      const host = hostRef.current;
      if (!viewport || !host) return null;
      const object = liveObjectsRef.current.find((item) => item.id === objectId);
      if (!object || (object.kind !== 'text' && object.kind !== 'curve_text')) return null;
      const anchor = textObjectWorldAnchor(object);
      const screen = viewport.toScreen(anchor.x, anchor.y);
      return {
        left: screen.x,
        top: screen.y,
        ...textEditLayoutFromObject(object, viewport.scale.x),
      };
    },
  }), [onViewportChange, scene]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let destroyed = false;
    let resizeObserver: ResizeObserver | null = null;
    const init = async () => {
      const app = new Application();
      await app.init({
        antialias: true,
        autoDensity: true,
        backgroundAlpha: 0,
        eventFeatures: { wheel: true },
      });
      if (destroyed) {
        app.destroy();
        return;
      }
      app.canvas.style.display = 'block';
      app.canvas.style.width = '100%';
      app.canvas.style.height = '100%';
      host.appendChild(app.canvas);
      const initialWorld = getCanvasWorldSize(sceneRef.current, backgroundSizeRef.current);
      const viewport = new Viewport({
        events: app.renderer.events,
        screenWidth: host.clientWidth,
        screenHeight: host.clientHeight,
        worldWidth: initialWorld.width,
        worldHeight: initialWorld.height,
      });
      viewport.wheel().pinch().decelerate().clampZoom({ minScale: MIN_ZOOM, maxScale: MAX_ZOOM });
      app.stage.eventMode = 'static';
      appRef.current = app;
      viewportRef.current = viewport;
      canvasHostRef.current = app.canvas;

      const dotTexture = createDotTexture(app);
      dotTextureRef.current = dotTexture;
      const dots = new TilingSprite({
        texture: dotTexture,
        width: host.clientWidth,
        height: host.clientHeight,
      });
      dots.eventMode = 'none';
      dotsRef.current = dots;
      app.stage.addChild(dots);
      app.stage.addChild(viewport);

      const backgroundLayer = new Container();
      backgroundLayer.eventMode = 'none';
      backgroundLayerRef.current = backgroundLayer;
      viewport.addChild(backgroundLayer);

      const rootObjects = new Container();
      rootObjects.sortableChildren = true;
      rootObjectsRef.current = rootObjects;
      viewport.addChild(rootObjects);

      const draft = new Graphics();
      draft.zIndex = 99999;
      draftRef.current = draft;
      viewport.addChild(draft);

      const syncViewport = () => {
        if (!applyingCameraRef.current && isImageBackedMapScene(sceneRef.current, backgroundSizeRef.current)) {
          const mapBounds = backgroundSizeRef.current
            ? getMapSceneWorldBounds(backgroundSizeRef.current)
            : null;
          if (mapBounds) {
            const current = persistFromViewport(viewport);
            const clamped = clampViewportPersistToMapBounds(
              current,
              mapBounds,
              viewport.screenWidth,
              viewport.screenHeight,
            );
            if (
              Math.abs(clamped.centerX - current.centerX) > 0.5
              || Math.abs(clamped.centerY - current.centerY) > 0.5
            ) {
              applyingCameraRef.current = true;
              applyPersistToViewport(viewport, clamped);
              applyingCameraRef.current = false;
            }
          }
        }
        setViewportScale(clampZoom(viewport.scale.x));
        onViewportChangeRef.current(persistFromViewport(viewport));
        syncDots();
      };
      const markUserViewportGesture = () => {
        if (!applyingCameraRef.current) {
          userViewAdjustedRef.current = true;
        }
      };
      viewport.on('moved', syncViewport);
      viewport.on('zoomed', () => {
        markUserViewportGesture();
        syncViewport();
      });

      const handlePointerDown = (event: FederatedPointerEvent) => {
        const worldPoint = pointFromEvent(viewport, event);
        const editRings = territoryEditRingsRef.current;
        const isEditingTerritory = Boolean(editRings && editRings.length > 0);
        const forcePan = spacePressedRef.current;

        if (event.button === 1) {
          panStateRef.current = {
            startX: event.global.x,
            startY: event.global.y,
            viewportX: viewport.x,
            viewportY: viewport.y,
          };
          updateCursor('grabbing');
          return;
        }

        if (event.shiftKey && !forcePan) {
          shiftClickPointerRef.current = {
            downX: event.global.x,
            downY: event.global.y,
            worldPoint,
          };
          return;
        }

        if (isEditingTerritory && !forcePan) {
          const scale = viewport.scale.x;
          if (event.button === 2) {
            event.preventDefault();
            const vertexHit = hitTerritoryVertex(worldPoint, editRings!, VERTEX_HIT_PX, scale);
            if (vertexHit) {
              const result = deleteTerritoryVertex(editRings!, vertexHit.ringIndex, vertexHit.pointIndex);
              if (result.ok) {
                territoryEditRingsRef.current = result.rings;
                onTerritoryEditChangeRef.current(result.rings);
                redrawTerritoryEdit();
              } else {
                onTerritoryVertexDeleteRejectedRef.current();
              }
            }
            return;
          }
          if (event.button === 0) {
            const vertexHit = hitTerritoryVertex(worldPoint, editRings!, VERTEX_HIT_PX, scale);
            if (vertexHit) {
              vertexDragRef.current = vertexHit;
              updateCursor('move');
              return;
            }
            panStateRef.current = {
              startX: event.global.x,
              startY: event.global.y,
              viewportX: viewport.x,
              viewportY: viewport.y,
            };
            updateCursor('grabbing');
            return;
          }
          return;
        }

        if (event.button !== 0) return;

        if (currentModeRef.current === 'select' && !forcePan) {
          const selectedCurve = getSelectedCurveTextObject();
          if (selectedCurve) {
            const handleHit = hitCurveTextHandle(
              worldPoint,
              selectedCurve,
              CURVE_HANDLE_HIT_PX,
              viewport.scale.x,
            );
            if (handleHit) {
              curveHandleDragRef.current = { objectId: selectedCurve.id, handle: handleHit };
              syncCurveTextDraft(selectedCurve);
              updateCursor('move');
              return;
            }
          }
        }

        const hit = hitTestObjects(reconcileStateRef.current, liveObjectsRef.current, worldPoint);
        const isDrawing = isDrawingMode(currentModeRef.current);

        if (isDrawing && !forcePan) {
          appendDrawingPointAt(viewport, worldPoint);
          drawPointerRef.current = {
            downX: event.global.x,
            downY: event.global.y,
            moved: false,
          };
          drawingHoverRef.current = worldPoint;
          redrawDraft();
          updateCursor('pointer');
          return;
        }

        if (currentModeRef.current === 'select' && hit && !forcePan) {
          onObjectSelectRef.current(hit);
          const transform = objectTransform(hit);
          dragStateRef.current = {
            objectId: hit.id,
            offsetX: worldPoint.x - transform.x,
            offsetY: worldPoint.y - transform.y,
            startX: event.global.x,
            startY: event.global.y,
            moved: false,
          };
          updateCursor('move');
          return;
        }

        if (currentModeRef.current !== 'select' && !isDrawing && !hit) {
          const placementPoint = guardMapPlacementPoint(worldPoint);
          if (placementPoint) {
            onCanvasClickRef.current(placementPoint);
          }
        }

        panStateRef.current = {
          startX: event.global.x,
          startY: event.global.y,
          viewportX: viewport.x,
          viewportY: viewport.y,
        };
        updateCursor('grabbing');
      };

      const handlePointerMove = (event: FederatedPointerEvent) => {
        const worldPoint = pointFromEvent(viewport, event);
        const isDrawing = isDrawingMode(currentModeRef.current);

        if (curveHandleDragRef.current) {
          const drag = curveHandleDragRef.current;
          const object = liveObjectsRef.current.find((item) => item.id === drag.objectId);
          if (object) {
            const updated = applyCurveHandleWorldPoint(object, drag.handle, worldPoint);
            syncCurveTextDraft(updated);
            reconcileLiveObjects();
            onCurveTextGeometryDraftRef.current?.(updated);
            redrawDraft();
          }
          updateCursor('move');
          return;
        }

        if (vertexDragRef.current) {
          const drag = vertexDragRef.current;
          const rings = territoryEditRingsRef.current;
          if (rings) {
            const next = moveTerritoryVertex(rings, drag.ringIndex, drag.pointIndex, worldPoint);
            territoryEditRingsRef.current = next;
            onTerritoryEditChangeRef.current(next);
            redrawTerritoryEdit();
          }
          updateCursor('move');
          return;
        }

        if (drawPointerRef.current) {
          const draw = drawPointerRef.current;
          if (Math.hypot(event.global.x - draw.downX, event.global.y - draw.downY) > 4) {
            draw.moved = true;
          }
          drawingHoverRef.current = worldPoint;
          if (isClosedDrawMode(currentModeRef.current) && drawingPointsRef.current.length > 0) {
            const first = drawingPointsRef.current[0];
            const firstScreen = viewport.toScreen(first.x, first.y);
            const distance = Math.hypot(firstScreen.x - event.global.x, firstScreen.y - event.global.y);
            snapToFirstRef.current = distance <= 8;
          } else {
            snapToFirstRef.current = false;
          }
          redrawDraft();
        }

        if (!drawPointerRef.current && isDrawing && drawingPointsRef.current.length > 0) {
          drawingHoverRef.current = worldPoint;
          if (isClosedDrawMode(currentModeRef.current)) {
            const first = drawingPointsRef.current[0];
            const firstScreen = viewport.toScreen(first.x, first.y);
            const distance = Math.hypot(firstScreen.x - event.global.x, firstScreen.y - event.global.y);
            snapToFirstRef.current = distance <= 8;
          } else {
            snapToFirstRef.current = false;
          }
          redrawDraft();
        }

        if (panStateRef.current) {
          const pan = panStateRef.current;
          viewport.position.set(
            pan.viewportX + (event.global.x - pan.startX),
            pan.viewportY + (event.global.y - pan.startY),
          );
          userViewAdjustedRef.current = true;
          syncViewport();
          return;
        }

        if (dragStateRef.current && currentModeRef.current === 'select') {
          const drag = dragStateRef.current;
          if (Math.hypot(event.global.x - drag.startX, event.global.y - drag.startY) > 2) {
            drag.moved = true;
          }
          const x = worldPoint.x - drag.offsetX;
          const y = worldPoint.y - drag.offsetY;
          objectDragPositionRef.current = { objectId: drag.objectId, x, y };
          liveObjectsRef.current = resolveEffectiveObjects();
          const entry = reconcileStateRef.current.objects.get(drag.objectId);
          if (entry) {
            entry.display.position.set(x, y);
          }
          redrawDraft();
          forceRender();
          updateCursor('move');
          return;
        }

        const hovered = hitTestObjects(reconcileStateRef.current, liveObjectsRef.current, worldPoint);
        if (territoryEditRingsRef.current) {
          const scale = viewport.scale.x;
          const vertexHit = hitTerritoryVertex(worldPoint, territoryEditRingsRef.current, VERTEX_HIT_PX, scale);
          updateCursor(vertexHit ? 'pointer' : 'grab');
        } else if (spacePressedRef.current) {
          updateCursor('grab');
        } else if (currentModeRef.current !== 'select') {
          updateCursor('pointer');
        } else if (hovered) {
          updateCursor('pointer');
        } else {
          updateCursor('grab');
        }
      };

      const handlePointerUp = (event: FederatedPointerEvent) => {
        const worldPoint = pointFromEvent(viewport, event);
        const editRings = territoryEditRingsRef.current;

        if (shiftClickPointerRef.current) {
          const shiftClick = shiftClickPointerRef.current;
          shiftClickPointerRef.current = null;
          const distance = Math.hypot(event.global.x - shiftClick.downX, event.global.y - shiftClick.downY);
          if (distance <= 4) {
            const placementPoint = guardMapPlacementPoint(shiftClick.worldPoint);
            if (placementPoint && onShiftCanvasClickRef.current) {
              onShiftCanvasClickRef.current(placementPoint);
            }
            return;
          }
        }

        if (curveHandleDragRef.current) {
          const drag = curveHandleDragRef.current;
          curveHandleDragRef.current = null;
          const object = liveObjectsRef.current.find((item) => item.id === drag.objectId);
          if (object) {
            const updated = applyCurveHandleWorldPoint(object, drag.handle, worldPoint);
            syncCurveTextDraft(updated);
            reconcileLiveObjects();
            onCurveTextGeometryCommitRef.current?.(updated);
          }
          redrawDraft();
          updateCursor(currentModeRef.current === 'select' ? 'grab' : 'pointer');
          return;
        }

        if (vertexDragRef.current) {
          vertexDragRef.current = null;
          updateCursor(currentModeRef.current === 'select' ? 'grab' : 'pointer');
        }

        if (editRings && editRings.length > 0 && event.button === 0) {
          const now = Date.now();
          const last = lastTerritoryEditClickRef.current;
          const isDoubleClick = Boolean(
            last && now - last.at < 280 && Math.hypot(last.x - worldPoint.x, last.y - worldPoint.y) < 12,
          );
          lastTerritoryEditClickRef.current = { at: now, x: worldPoint.x, y: worldPoint.y };
          if (isDoubleClick) {
            const edge = findNearestTerritoryEdge(
              worldPoint,
              editRings,
              EDGE_HIT_PX,
              VERTEX_GUARD_PX,
              viewport.scale.x,
            );
            if (edge) {
              const next = insertTerritoryVertexOnEdge(
                editRings,
                edge.ringIndex,
                edge.edgeIndex,
                edge.projection,
              );
              territoryEditRingsRef.current = next;
              onTerritoryEditChangeRef.current(next);
              redrawTerritoryEdit();
            }
          }
        }

        if (panStateRef.current) {
          panStateRef.current = null;
          updateCursor(currentModeRef.current === 'select' ? 'grab' : 'pointer');
        }

        if (dragStateRef.current && currentModeRef.current === 'select') {
          const drag = dragStateRef.current;
          dragStateRef.current = null;
          if (!drag.moved) {
            objectDragPositionRef.current = null;
            const clicked = liveObjectsRef.current.find((item) => item.id === drag.objectId);
            if (
              (clicked?.kind === 'text' || clicked?.kind === 'curve_text')
              && onTextEditRequestRef.current
            ) {
              const now = Date.now();
              const last = lastTextClickRef.current;
              if (last?.objectId === clicked.id && now - last.at < 400) {
                lastTextClickRef.current = null;
                onTextEditRequestRef.current(clicked);
                updateCursor('text');
                return;
              }
              lastTextClickRef.current = { objectId: clicked.id, at: now };
              updateCursor('pointer');
              return;
            }
            if (
              (clicked?.kind === 'marker' || clicked?.kind === 'scene_container')
              && clicked.linkedSceneId != null
              && onMarkerOpenLinkedSceneRef.current
            ) {
              const now = Date.now();
              const last = lastMarkerClickRef.current;
              if (last?.objectId === clicked.id && now - last.at < 400) {
                lastMarkerClickRef.current = null;
                onMarkerOpenLinkedSceneRef.current(clicked);
                updateCursor('pointer');
                return;
              }
              lastMarkerClickRef.current = { objectId: clicked.id, at: now };
            } else {
              lastMarkerClickRef.current = null;
            }
            updateCursor('pointer');
            return;
          }
          lastMarkerClickRef.current = null;
          const x = worldPoint.x - drag.offsetX;
          const y = worldPoint.y - drag.offsetY;
          objectDragPositionRef.current = { objectId: drag.objectId, x, y };
          liveObjectsRef.current = resolveEffectiveObjects();
          const movedObject = liveObjectsRef.current.find((item) => item.id === drag.objectId);
          if (movedObject) {
            onObjectMoveRef.current(movedObject, { x, y });
          }
          updateCursor('pointer');
          return;
        }

        if (drawPointerRef.current && isDrawingMode(currentModeRef.current)) {
          drawPointerRef.current = null;
        }
      };

      viewport.on('pointerdown', handlePointerDown);
      viewport.on('pointermove', handlePointerMove);
      viewport.on('pointerup', handlePointerUp);
      viewport.on('pointerupoutside', handlePointerUp);

      const preventWheel = (event: WheelEvent) => {
        event.preventDefault();
        event.stopPropagation();
      };

      const handleContextMenu = (event: MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
        if (territoryEditRingsRef.current) return;
        const rect = app.canvas.getBoundingClientRect();
        const local = new Point(event.clientX - rect.left, event.clientY - rect.top);
        const world = viewport.toWorld(local);
        const worldPoint = { x: world.x, y: world.y };
        const targetObject = hitTestObjects(reconcileStateRef.current, liveObjectsRef.current, worldPoint);
        onObjectSelectRef.current(targetObject);
        onContextMenuRef.current({
          mouseX: event.clientX,
          mouseY: event.clientY,
          worldX: world.x,
          worldY: world.y,
          targetObject,
        });
      };

      app.canvas.addEventListener('wheel', preventWheel, { passive: false });
      app.canvas.addEventListener('contextmenu', handleContextMenu);

      const handleKeyDown = (event: KeyboardEvent) => {
        const active = document.activeElement;
        if (active instanceof HTMLElement) {
          const tag = active.tagName.toLowerCase();
          if (active.isContentEditable || tag === 'input' || tag === 'textarea' || tag === 'select') {
            return;
          }
        }
        if (document.querySelector('[role="dialog"]')) return;

        if (event.code === 'Space') {
          event.preventDefault();
          spacePressedRef.current = true;
          if (!panStateRef.current) updateCursor('grab');
          return;
        }
        if (event.key === 'Enter') {
          event.preventDefault();
          finishDrawingInternal();
          return;
        }
        if (event.key === 'Escape') {
          event.preventDefault();
          clearDrawing();
        }
      };
      const handleKeyUp = (event: KeyboardEvent) => {
        if (event.code === 'Space') {
          spacePressedRef.current = false;
          updateCursor(currentModeRef.current === 'select' ? 'grab' : 'pointer');
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);

      resizeObserver = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (!entry) return;
        const width = Math.max(1, Math.floor(entry.contentRect.width));
        const height = Math.max(1, Math.floor(entry.contentRect.height));
        app.renderer.resize(width, height);
        applyingCameraRef.current = true;
        try {
          resizeViewportWorld(viewport);
          const mapSize = backgroundSizeRef.current;
          if (
            !userViewAdjustedRef.current
            && mapSize
            && isMapScene(sceneRef.current.sceneType)
          ) {
            const mapBounds = getMapSceneWorldBounds(mapSize);
            applyPersistToViewport(
              viewport,
              computeFitToBoundsViewport(width, height, mapBounds),
            );
            setViewportScale(clampZoom(viewport.scale.x));
          }
        } finally {
          applyingCameraRef.current = false;
        }
        updateDots(dots, viewport, width, height);
      });
      resizeObserver.observe(host);

      const deferInitialPersist = isMapScene(sceneRef.current.sceneType)
        && Boolean(resolveMapBackgroundAssetPath(sceneRef.current));
      if (!deferInitialPersist) {
        const initial = sceneViewportPersist(sceneRef.current, viewport.screenWidth, viewport.screenHeight);
        applyPersistToViewport(viewport, initial);
      }
      updateDots(dots, viewport, app.renderer.width, app.renderer.height);
      updateCursor(currentModeRef.current === 'select' ? 'grab' : 'pointer');

      sceneIdRef.current = sceneRef.current.id;
      setPixiReady(true);
      if (!app.ticker.started) {
        app.start();
      }
      onLargeBackgroundStatusRef.current('');

      const cleanupInput = () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
      };
      (app as unknown as { __cleanupInput?: () => void }).__cleanupInput = cleanupInput;
    };

    void init();

    return () => {
      destroyed = true;
      if (resizeObserver) resizeObserver.disconnect();
      if (appRef.current?.canvas?.parentElement) {
        appRef.current.canvas.parentElement.removeChild(appRef.current.canvas);
      }
      (appRef.current as unknown as { __cleanupInput?: () => void })?.__cleanupInput?.();
      appRef.current?.destroy(true, { children: true });
      appRef.current = null;
      viewportRef.current = null;
      setPixiReady(false);
      autoFitKeyRef.current = null;
      userViewAdjustedRef.current = false;
      backgroundLayerRef.current = null;
      backgroundSizeRef.current = null;
      rootObjectsRef.current = null;
      dotsRef.current = null;
      dotTextureRef.current?.destroy(true);
      dotTextureRef.current = null;
      draftRef.current = null;
      dragStateRef.current = null;
      reconcileStateRef.current = { layerContainers: new Map(), objects: new Map() };
    };
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    if (sceneIdRef.current === scene.id) return;
    clearDrawing();
    autoFitKeyRef.current = null;
    userViewAdjustedRef.current = false;
    backgroundSizeRef.current = null;
    sceneIdRef.current = scene.id;

    const deferPersist = isMapScene(scene.sceneType) && Boolean(resolveMapBackgroundAssetPath(scene));
    if (!deferPersist) {
      const persist = sceneViewportPersist(scene, viewport.screenWidth, viewport.screenHeight);
      applyCamera(viewport, persist);
      resizeViewportWorld(viewport);
    }

    syncDots();
    setViewportScale(clampZoom(viewport.scale.x));
    if (!deferPersist) {
      onViewportChange(persistFromViewport(viewport));
    }
  }, [onViewportChange, scene]);

  useEffect(() => {
    if (!pixiReady) return;
    const layer = backgroundLayerRef.current;
    if (!layer) return;

    const assetPath = resolveMapBackgroundAssetPath(scene);
    backgroundSizeRef.current = null;
    layer.removeChildren();

    if (!assetPath) {
      if (dotsRef.current) dotsRef.current.visible = shouldUseInfiniteCanvas(scene.sceneType);
      const viewport = viewportRef.current;
      if (viewport) resizeViewportWorld(viewport);
      setBackgroundLoadTick((tick) => tick + 1);
      return;
    }

    let cancelled = false;
    void (async () => {
      const url = await resolveUploadAssetUrl(assetPath);
      if (cancelled || !url || layer.destroyed) return;
      try {
        const texture = await Assets.load(url);
        if (cancelled || layer.destroyed) return;
        const sprite = new Sprite(texture);
        sprite.position.set(0, 0);
        sprite.width = texture.width;
        sprite.height = texture.height;
        sprite.eventMode = 'none';
        layer.addChild(sprite);
        const texWidth = sprite.texture.width;
        const texHeight = sprite.texture.height;
        backgroundSizeRef.current = { width: texWidth, height: texHeight };
        const viewport = viewportRef.current;
        if (viewport) {
          const fitKey = buildMapAutoFitKey(scene.id, scene.backgroundPath, backgroundSizeRef.current);
          if (!fitKey || autoFitKeyRef.current !== fitKey) {
            const persist = fitMapBackgroundToViewport(viewport, backgroundSizeRef.current);
            setViewportScale(clampZoom(persist.scale));
            onViewportChangeRef.current(persist);
            if (fitKey) autoFitKeyRef.current = fitKey;
          } else {
            applyingCameraRef.current = true;
            try {
              resizeViewportWorld(viewport);
            } finally {
              applyingCameraRef.current = false;
            }
          }
        }
        if (dotsRef.current) dotsRef.current.visible = false;
        setBackgroundLoadTick((tick) => tick + 1);
      } catch (error) {
        console.error('[Canvas] map background load failed', { sceneId: scene.id, assetPath, error });
        if (dotsRef.current) dotsRef.current.visible = true;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pixiReady, scene.id, scene.sceneType, scene.backgroundPath]);

  useEffect(() => {
    if (!pixiReady) return;

    const viewport = viewportRef.current;
    if (!viewport) return;

    const isMap = isMapScene(scene.sceneType);
    const waitingForBackground = isMap
      && Boolean(resolveMapBackgroundAssetPath(scene))
      && !backgroundSizeRef.current;
    if (waitingForBackground) return;

    const visibleObjects = objects.filter((object) => !object.isHidden);
    const mapBounds = isMap && backgroundSizeRef.current
      ? getMapSceneWorldBounds(backgroundSizeRef.current)
      : null;
    const fitKey = isMap
      ? buildMapAutoFitKey(scene.id, scene.backgroundPath, backgroundSizeRef.current)
      : `scene:${scene.id}`;
    const needsMapInitialFit = Boolean(mapBounds && fitKey && autoFitKeyRef.current !== fitKey);

    if (!needsMapInitialFit && userViewAdjustedRef.current) return;
    if (!needsMapInitialFit && fitKey && autoFitKeyRef.current === fitKey) return;

    const bounds = mapBounds ?? computeObjectsBounds(visibleObjects);
    const savedViewport = sceneViewportPersist(scene, viewport.screenWidth, viewport.screenHeight);

    console.debug('[Canvas] scene load camera', {
      sceneId: scene.id,
      fitKey,
      needsMapInitialFit,
      objectCount: visibleObjects.length,
      bbox: bounds
        ? {
            minX: bounds.minX,
            minY: bounds.minY,
            maxX: bounds.maxX,
            maxY: bounds.maxY,
          }
        : null,
      savedViewport,
    });

    if (needsMapInitialFit && backgroundSizeRef.current) {
      const persist = fitMapBackgroundToViewport(viewport, backgroundSizeRef.current);
      setViewportScale(clampZoom(persist.scale));
      onViewportChangeRef.current(persist);
      if (fitKey) autoFitKeyRef.current = fitKey;
      return;
    }

    const shouldFit = mapBounds
      ? shouldAutoFitMapBackgroundOnLoad(mapBounds, savedViewport, viewport.screenWidth, viewport.screenHeight)
      : shouldAutoFitOnLoad(
        visibleObjects.length,
        bounds,
        savedViewport,
        viewport.screenWidth,
        viewport.screenHeight,
      );
    if (!shouldFit) {
      if (mapBounds && !isDefaultPersist(savedViewport) && !isMapViewportMisaligned(savedViewport, mapBounds)) {
        applyCamera(viewport, savedViewport);
        setViewportScale(clampZoom(viewport.scale.x));
        onViewportChangeRef.current(persistFromViewport(viewport));
      }
      if (fitKey) autoFitKeyRef.current = fitKey;
      return;
    }

    fitToContentInternal('auto');
    if (fitKey) autoFitKeyRef.current = fitKey;
  }, [pixiReady, scene, objects, backgroundLoadTick]);

  useEffect(() => {
    syncPendingObjectDragPosition(objects);

    if (!pixiReady) return;
    if (isInteractiveObjectDragActive()) return;
    const root = rootObjectsRef.current;
    if (!root) return;

    const effectiveObjects = resolveEffectiveObjects(objects);
    liveObjectsRef.current = effectiveObjects;
    reconcilePixiObjects(
      root,
      reconcileStateRef.current,
      layers,
      effectiveObjects,
      selectedObjectId,
      (object, resourcePath) => {
        onImageLoadErrorRef.current(object, resourcePath);
      },
      {
        viewportScale,
        linkedSceneNames,
        linkedSceneBackgroundPaths,
        sceneContainerLabels,
        editingTextObjectId,
      },
    );
    forceRender();
  }, [pixiReady, layers, objects, selectedObjectId, scene.id, viewportScale, linkedSceneNames, linkedSceneBackgroundPaths, sceneContainerLabels, editingTextObjectId]);

  useEffect(() => {
    const draft = curveTextGeometryDraftRef.current;
    if (!draft || curveHandleDragRef.current) return;
    const committed = objects.find((item) => item.id === draft.id);
    if (committed && curveTextGeometryJsonEquals(committed, draft)) {
      curveTextGeometryDraftRef.current = null;
      liveObjectsRef.current = resolveEffectiveObjects(objects);
    }
  }, [objects]);

  useEffect(() => {
    redrawDraft();
    updateCursor(mode === 'select' ? 'grab' : 'pointer');
  }, [mode]);

  useEffect(() => {
    curveHandleDragRef.current = null;
    curveTextGeometryDraftRef.current = null;
    objectDragPositionRef.current = null;
    redrawDraft();
  }, [selectedObjectId]);

  useEffect(() => {
    redrawDraft();
  }, [objects]);

  useEffect(() => {
    if (territoryEditRings) clearDrawing();
    redrawDraft();
  }, [territoryEditRings]);

  useEffect(() => {
    redrawDraft();
  }, [territoryDraftCompletedRings]);

  return <div ref={hostRef} style={{ width: '100%', height: '100%', minHeight: 0, overflow: 'hidden' }} />;
});
