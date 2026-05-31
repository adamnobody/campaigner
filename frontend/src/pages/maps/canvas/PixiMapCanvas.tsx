import {
  Application,
  Container,
  Graphics,
  Point,
  Rectangle,
  Texture,
  TilingSprite,
  type FederatedPointerEvent,
} from 'pixi.js';
import { Viewport } from 'pixi-viewport';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import type { CanvasLayer, CanvasObject, CanvasScene } from '@/api/canvas';
import type { MapContextMenuState } from '../components/MapCanvasContextMenu';
import type { CanvasMode, CanvasPoint } from './canvasModel';
import { asNumber, asRecord, objectTransform } from './canvasModel';
import { hitTestObjects, reconcilePixiObjects, type ReconcileState } from './canvasReconciler';

const WORLD_SIZE = 20000;
const DOT_STEP = 64;
const DOT_COLOR = 0x9fb0bf;
const DOT_ALPHA = 0.18;
const DOT_RADIUS = 0.95;

type ViewportSnapshot = { x: number; y: number; scale: number };

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

type Props = {
  scene: CanvasScene;
  layers: CanvasLayer[];
  objects: CanvasObject[];
  selectedObjectId: number | null;
  mode: CanvasMode;
  onCanvasClick: (point: CanvasPoint) => void;
  onObjectSelect: (object: CanvasObject | null) => void;
  onObjectMove: (object: CanvasObject, point: CanvasPoint) => void;
  onDraftPointCountChange: (count: number) => void;
  onCreatePolygon: (points: CanvasPoint[]) => void;
  onCreateTerritory: (points: CanvasPoint[]) => void;
  onCreatePolyline: (points: CanvasPoint[]) => void;
  onImageLoadError: (object: CanvasObject, resourcePath: string) => void;
  onViewportChange: (viewport: ViewportSnapshot) => void;
  onLargeBackgroundStatus: (status: string) => void;
  onContextMenu: (menu: MapContextMenuState) => void;
};

export type PixiMapCanvasHandle = {
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
  getViewportCenter: () => CanvasPoint;
  undoDrawingPoint: () => number;
  finishDrawing: () => number;
  cancelDrawing: () => boolean;
};

const isClosedDrawMode = (mode: CanvasMode): boolean =>
  mode === 'polygon' || mode === 'draw_territory';

const isDrawingMode = (mode: CanvasMode): boolean =>
  isClosedDrawMode(mode) || mode === 'polyline';

const pointFromEvent = (viewport: Viewport, event: FederatedPointerEvent): CanvasPoint => {
  const world = viewport.toWorld(event.global);
  return { x: world.x, y: world.y };
};

const sceneViewport = (scene: CanvasScene): ViewportSnapshot => {
  const json = asRecord(scene.viewportJson);
  return {
    x: asNumber(json.x),
    y: asNumber(json.y),
    scale: Math.max(0.1, asNumber(json.scale, 1)),
  };
};

const redrawDraftPolyline = (
  graphics: Graphics,
  viewport: Viewport,
  mode: CanvasMode,
  points: CanvasPoint[],
  hoverPoint: CanvasPoint | null,
  snapToFirst: boolean,
): void => {
  graphics.clear();
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

const updateDots = (dots: TilingSprite, viewport: Viewport, width: number, height: number): void => {
  dots.width = width;
  dots.height = height;
  dots.tileScale.set(viewport.scale.x, viewport.scale.y);
  dots.tilePosition.set(viewport.x + (DOT_STEP / 2) * viewport.scale.x, viewport.y + (DOT_STEP / 2) * viewport.scale.y);
};

export const PixiMapCanvas = forwardRef<PixiMapCanvasHandle, Props>(function PixiMapCanvas({
  scene,
  layers,
  objects,
  selectedObjectId,
  mode,
  onCanvasClick,
  onObjectSelect,
  onObjectMove,
  onDraftPointCountChange,
  onCreatePolygon,
  onCreateTerritory,
  onCreatePolyline,
  onImageLoadError,
  onViewportChange,
  onLargeBackgroundStatus,
  onContextMenu,
}, ref) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const appRef = useRef<Application | null>(null);
  const viewportRef = useRef<Viewport | null>(null);
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
  const spacePressedRef = useRef(false);
  const canvasHostRef = useRef<HTMLCanvasElement | null>(null);
  const liveObjectsRef = useRef<CanvasObject[]>(objects);
  const currentModeRef = useRef<CanvasMode>(mode);
  const sceneRef = useRef<CanvasScene>(scene);
  const onCanvasClickRef = useRef(onCanvasClick);
  const onObjectSelectRef = useRef(onObjectSelect);
  const onObjectMoveRef = useRef(onObjectMove);
  const onDraftPointCountChangeRef = useRef(onDraftPointCountChange);
  const onCreatePolygonRef = useRef(onCreatePolygon);
  const onCreateTerritoryRef = useRef(onCreateTerritory);
  const onCreatePolylineRef = useRef(onCreatePolyline);
  const onImageLoadErrorRef = useRef(onImageLoadError);
  const onViewportChangeRef = useRef(onViewportChange);
  const onContextMenuRef = useRef(onContextMenu);
  const onLargeBackgroundStatusRef = useRef(onLargeBackgroundStatus);
  const sceneIdRef = useRef<number | null>(null);

  liveObjectsRef.current = objects;
  currentModeRef.current = mode;
  sceneRef.current = scene;
  onCanvasClickRef.current = onCanvasClick;
  onObjectSelectRef.current = onObjectSelect;
  onObjectMoveRef.current = onObjectMove;
  onDraftPointCountChangeRef.current = onDraftPointCountChange;
  onCreatePolygonRef.current = onCreatePolygon;
  onCreateTerritoryRef.current = onCreateTerritory;
  onCreatePolylineRef.current = onCreatePolyline;
  onImageLoadErrorRef.current = onImageLoadError;
  onViewportChangeRef.current = onViewportChange;
  onContextMenuRef.current = onContextMenu;
  onLargeBackgroundStatusRef.current = onLargeBackgroundStatus;

  const updateCursor = (cursor: string) => {
    if (!canvasHostRef.current) return;
    canvasHostRef.current.style.cursor = cursor;
  };

  const redrawDraft = () => {
    const viewport = viewportRef.current;
    const draft = draftRef.current;
    if (!viewport || !draft) return;
    redrawDraftPolyline(
      draft,
      viewport,
      currentModeRef.current,
      drawingPointsRef.current,
      drawingHoverRef.current,
      snapToFirstRef.current,
    );
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

  useImperativeHandle(ref, () => ({
    zoomIn() {
      const viewport = viewportRef.current;
      if (!viewport) return;
      viewport.zoom(0.2, true);
      if (dotsRef.current && appRef.current) {
        updateDots(dotsRef.current, viewport, appRef.current.renderer.width, appRef.current.renderer.height);
      }
    },
    zoomOut() {
      const viewport = viewportRef.current;
      if (!viewport) return;
      viewport.zoom(-0.2, true);
      if (dotsRef.current && appRef.current) {
        updateDots(dotsRef.current, viewport, appRef.current.renderer.width, appRef.current.renderer.height);
      }
    },
    resetView() {
      const viewport = viewportRef.current;
      if (!viewport) return;
      const initial = sceneViewport(scene);
      viewport.position.set(initial.x, initial.y);
      viewport.setZoom(initial.scale, true);
      if (dotsRef.current && appRef.current) {
        updateDots(dotsRef.current, viewport, appRef.current.renderer.width, appRef.current.renderer.height);
      }
      onViewportChange(initial);
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
      const viewport = new Viewport({
        events: app.renderer.events,
        screenWidth: host.clientWidth,
        screenHeight: host.clientHeight,
        worldWidth: WORLD_SIZE,
        worldHeight: WORLD_SIZE,
      });
      viewport.wheel().pinch().decelerate();
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

      const rootObjects = new Container();
      rootObjects.sortableChildren = true;
      rootObjectsRef.current = rootObjects;
      viewport.addChild(rootObjects);

      const draft = new Graphics();
      draft.zIndex = 99999;
      draftRef.current = draft;
      viewport.addChild(draft);

      const syncViewport = () => {
        const snapshot: ViewportSnapshot = {
          x: viewport.x,
          y: viewport.y,
          scale: viewport.scale.x,
        };
        onViewportChangeRef.current(snapshot);
        if (dotsRef.current) updateDots(dotsRef.current, viewport, app.renderer.width, app.renderer.height);
      };
      viewport.on('moved', syncViewport);
      viewport.on('zoomed', syncViewport);

      const handlePointerDown = (event: FederatedPointerEvent) => {
        if (event.button !== 0) return;
        const worldPoint = pointFromEvent(viewport, event);
        const hit = hitTestObjects(reconcileStateRef.current, liveObjectsRef.current, worldPoint);
        const isDrawing = isDrawingMode(currentModeRef.current);
        const forcePan = spacePressedRef.current;

        if (isDrawing && !forcePan) {
          drawPointerRef.current = {
            downX: event.global.x,
            downY: event.global.y,
            moved: false,
          };
          drawingHoverRef.current = worldPoint;
          redrawDraft();
          updateCursor('crosshair');
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
          onCanvasClickRef.current(worldPoint);
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
          syncViewport();
          return;
        }

        if (dragStateRef.current && currentModeRef.current === 'select') {
          const drag = dragStateRef.current;
          if (Math.hypot(event.global.x - drag.startX, event.global.y - drag.startY) > 2) {
            drag.moved = true;
          }
          const entry = reconcileStateRef.current.objects.get(drag.objectId);
          if (entry) {
            entry.display.position.set(worldPoint.x - drag.offsetX, worldPoint.y - drag.offsetY);
          }
          updateCursor('move');
          return;
        }

        const hovered = hitTestObjects(reconcileStateRef.current, liveObjectsRef.current, worldPoint);
        if (spacePressedRef.current) {
          updateCursor('grab');
        } else if (isDrawing) {
          updateCursor('crosshair');
        } else if (hovered) {
          updateCursor('pointer');
        } else {
          updateCursor('grab');
        }
      };

      const handlePointerUp = (event: FederatedPointerEvent) => {
        const worldPoint = pointFromEvent(viewport, event);

        if (panStateRef.current) {
          panStateRef.current = null;
        }

        if (dragStateRef.current && currentModeRef.current === 'select') {
          const drag = dragStateRef.current;
          dragStateRef.current = null;
          if (!drag.moved) {
            updateCursor('pointer');
            return;
          }
          const movedObject = liveObjectsRef.current.find((item) => item.id === drag.objectId);
          if (movedObject) {
            onObjectMoveRef.current(movedObject, {
              x: worldPoint.x - drag.offsetX,
              y: worldPoint.y - drag.offsetY,
            });
          }
          updateCursor('pointer');
          return;
        }

        if (drawPointerRef.current && isDrawingMode(currentModeRef.current)) {
          const draw = drawPointerRef.current;
          drawPointerRef.current = null;
          if (draw.moved) return;

          const now = Date.now();
          const last = lastDrawClickRef.current;
          const isDoubleClick = Boolean(
            last && now - last.at < 280 && Math.hypot(last.x - worldPoint.x, last.y - worldPoint.y) < 12,
          );
          lastDrawClickRef.current = { at: now, x: worldPoint.x, y: worldPoint.y };

          if (isClosedDrawMode(currentModeRef.current)) {
            if (drawingPointsRef.current.length > 0) {
              const first = drawingPointsRef.current[0];
              const firstScreen = viewport.toScreen(first.x, first.y);
              const worldScreen = viewport.toScreen(worldPoint.x, worldPoint.y);
              const distance = Math.hypot(firstScreen.x - worldScreen.x, firstScreen.y - worldScreen.y);
              snapToFirstRef.current = distance <= 8;
            }
            if (snapToFirstRef.current && drawingPointsRef.current.length >= 3) {
              finishDrawingInternal();
              return;
            }
            const next = [...drawingPointsRef.current, worldPoint];
            setDrawingPoints(next);
            if (isDoubleClick && next.length >= 3) {
              finishDrawingInternal();
            }
            return;
          }

          const next = [...drawingPointsRef.current, worldPoint];
          setDrawingPoints(next);
          if (isDoubleClick && next.length >= 2) {
            finishDrawingInternal();
          }
          return;
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
        viewport.resize(width, height, WORLD_SIZE, WORLD_SIZE);
        updateDots(dots, viewport, width, height);
      });
      resizeObserver.observe(host);

      const initial = sceneViewport(sceneRef.current);
      viewport.position.set(initial.x, initial.y);
      viewport.setZoom(initial.scale, true);
      updateDots(dots, viewport, app.renderer.width, app.renderer.height);
      updateCursor('grab');

      sceneIdRef.current = sceneRef.current.id;
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
    const snapshot = sceneViewport(scene);
    viewport.position.set(snapshot.x, snapshot.y);
    viewport.setZoom(snapshot.scale, true);
    sceneIdRef.current = scene.id;
    if (dotsRef.current && appRef.current) {
      updateDots(dotsRef.current, viewport, appRef.current.renderer.width, appRef.current.renderer.height);
    }
    onViewportChange(snapshot);
  }, [onViewportChange, scene]);

  useEffect(() => {
    const root = rootObjectsRef.current;
    if (!root) return;
    reconcilePixiObjects(root, reconcileStateRef.current, layers, objects, selectedObjectId, (object, resourcePath) => {
      onImageLoadErrorRef.current(object, resourcePath);
    });
  }, [layers, objects, selectedObjectId]);

  useEffect(() => {
    redrawDraft();
  }, [mode]);

  return <div ref={hostRef} style={{ width: '100%', height: '100%', minHeight: 0, overflow: 'hidden' }} />;
});
