import {

  Application,

  Container,

  FederatedPointerEvent,

  Graphics,

  Point,

  Text,

  TextStyle,

} from 'pixi.js'

import { Viewport } from 'pixi-viewport'

import type { DrawTool, InProgressShape, SceneObject } from '../sceneTypes'

import { boundsOfObject, hitTestTopmost } from './hitTest'

import { drawSelectionOutline } from './selectionOutline'
import { FpsMonitor } from '../shared/fpsMonitor'
import { downloadPngBlob, exportVisibleViewport } from '../shared/viewportExport'
import { STRESS_WORLD_SIZE } from './stressSpawn'

const WORLD_SIZE = STRESS_WORLD_SIZE

const POLYLINE_STROKE = 0xe6b422

const POLYLINE_WIDTH = 4

/** Polyline hit tolerance in screen pixels (SPEC Task 4). */

const POLYLINE_HIT_SCREEN_PX = 5

/** Pointer movement above this (screen px) suppresses the following click. */

const CLICK_DRAG_THRESHOLD_PX = 3



export type BridgeCallbacks = {

  getActiveTool: () => DrawTool | null

  getObjects: () => SceneObject[]

  onSelect: (id: string | null) => void

  onCanvasClick: (world: [number, number]) => void

  onPolygonDoubleClick: () => void

  onShapeDragMove: (id: string, dx: number, dy: number) => void

  onShapeDragEnd: (id: string) => void

}



export type ReconcileState = {

  objects: SceneObject[]

  inProgress: InProgressShape | null

  textRotationDeg: number

  selectedId: string | null

}



export type PrimitivesBridge = {

  reconcile: (state: ReconcileState) => void

  setPanForTool: (toolActive: boolean) => void

  screenDistanceBetweenWorldPoints: (a: [number, number], b: [number, number]) => number

  clientToWorld: (clientX: number, clientY: number) => [number, number]

  hasSelectionOutline: () => boolean

  hitTestAtClient: (clientX: number, clientY: number) => string | null

  fpsMonitor: FpsMonitor

  fitWorld: () => void

  setZoomRelative: (factor: number) => void

  exportViewportPng: (filename?: string) => Promise<{
    width: number
    height: number
    byteLength: number
  }>

  destroy: () => void

}



function drawFilledPolygon(g: Graphics, points: [number, number][], fill: number) {

  if (points.length < 3) return

  g.moveTo(points[0][0], points[0][1])

  for (let i = 1; i < points.length; i++) {

    g.lineTo(points[i][0], points[i][1])

  }

  g.closePath()

  g.fill({ color: fill, alpha: 0.8 })

  g.moveTo(points[0][0], points[0][1])

  for (let i = 1; i < points.length; i++) {

    g.lineTo(points[i][0], points[i][1])

  }

  g.closePath()

  g.stroke({ width: 2, color: 0xffffff, alpha: 0.5 })

}



function drawOpenPolygonPath(g: Graphics, points: [number, number][]) {

  if (points.length === 0) return

  g.moveTo(points[0][0], points[0][1])

  for (let i = 1; i < points.length; i++) {

    g.lineTo(points[i][0], points[i][1])

  }

}



function drawPolylinePath(g: Graphics, points: [number, number][]) {

  if (points.length < 2) {

    if (points.length === 1) {

      g.circle(points[0][0], points[0][1], 3)

      g.fill({ color: POLYLINE_STROKE })

    }

    return

  }

  g.moveTo(points[0][0], points[0][1])

  for (let i = 1; i < points.length; i++) {

    g.lineTo(points[i][0], points[i][1])

  }

}



export async function createPrimitivesBridge(

  container: HTMLDivElement,

  callbacks: BridgeCallbacks,

): Promise<PrimitivesBridge> {

  const app = new Application()

  await app.init({

    width: container.clientWidth,

    height: container.clientHeight,

    backgroundColor: 0x1e1e2a,

    antialias: true,

    resolution: window.devicePixelRatio || 1,

    autoDensity: true,

  })

  container.appendChild(app.canvas)



  const viewport = new Viewport({

    screenWidth: container.clientWidth,

    screenHeight: container.clientHeight,

    worldWidth: WORLD_SIZE,

    worldHeight: WORLD_SIZE,

    events: app.renderer.events,

  })

  app.stage.addChild(viewport)

  viewport.drag().pinch().wheel().decelerate()



  const backdrop = new Graphics()

  backdrop.rect(0, 0, WORLD_SIZE, WORLD_SIZE)

  backdrop.fill({ color: 0x2a2a38, alpha: 1 })

  backdrop.eventMode = 'static'

  backdrop.cursor = 'crosshair'



  const shapesLayer = new Container()

  const selectionLayer = new Container()

  const previewLayer = new Container()

  shapesLayer.eventMode = 'none'

  selectionLayer.eventMode = 'none'

  previewLayer.eventMode = 'none'

  viewport.addChild(backdrop, shapesLayer, selectionLayer, previewLayer)



  viewport.moveCenter(WORLD_SIZE / 2, WORLD_SIZE / 2)

  const fit = Math.min(container.clientWidth, container.clientHeight) / WORLD_SIZE

  viewport.setZoom(fit * 0.9, true)

  const fpsMonitor = new FpsMonitor()
  fpsMonitor.attach(app)
  fpsMonitor.setZoom(viewport.scale.x)

  let isPanning = false
  let isZooming = false
  let zoomDebounce: ReturnType<typeof setTimeout> | undefined

  viewport.on('drag-start', () => {
    isPanning = true
    fpsMonitor.setInteraction('pan')
  })
  viewport.on('drag-end', () => {
    isPanning = false
    if (!isZooming) fpsMonitor.setInteraction('idle')
  })
  viewport.on('wheel', () => {
    isZooming = true
    fpsMonitor.setInteraction('zoom')
    fpsMonitor.setZoom(viewport.scale.x)
    clearTimeout(zoomDebounce)
    zoomDebounce = setTimeout(() => {
      isZooming = false
      if (!isPanning) fpsMonitor.setInteraction('idle')
    }, 200)
  })

  app.ticker.add(() => {
    fpsMonitor.setZoom(viewport.scale.x)
  })

  let activeDrag: { id: string; lastX: number; lastY: number } | null = null

  let suppressNextClick = false

  let pointerHitId: string | null = null

  let selectionOutlineVisible = false

  let pointerGesture: {

    clientX: number

    clientY: number

    shapeDragMoved: boolean

  } | null = null



  const markSuppressNextClick = () => {

    suppressNextClick = true

  }



  const screenDistanceBetweenWorldPoints = (
    a: [number, number],
    b: [number, number],
  ): number => {
    const s1 = viewport.toGlobal(new Point(a[0], a[1]))
    const s2 = viewport.toGlobal(new Point(b[0], b[1]))
    return Math.hypot(s1.x - s2.x, s1.y - s2.y)
  }

  const screenToWorldTolerance = (screenPx: number): number => {
    const oneWorld = screenDistanceBetweenWorldPoints([0, 0], [1, 0])
    if (oneWorld < 1e-6) return screenPx
    return screenPx / oneWorld
  }

  const endShapeDrag = () => {

    if (activeDrag) {

      markSuppressNextClick()

      callbacks.onShapeDragEnd(activeDrag.id)

      activeDrag = null

    }

    viewport.plugins.resume('drag')

  }



  const onGlobalMove = (e: FederatedPointerEvent) => {

    if (!activeDrag) return

    const local = viewport.toLocal(e.global)

    const dx = local.x - activeDrag.lastX

    const dy = local.y - activeDrag.lastY

    if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {

      if (pointerGesture) pointerGesture.shapeDragMoved = true

      markSuppressNextClick()

    }

    activeDrag.lastX = local.x

    activeDrag.lastY = local.y

    callbacks.onShapeDragMove(activeDrag.id, dx, dy)

  }



  viewport.on('pointermove', onGlobalMove)

  viewport.on('pointerup', endShapeDrag)

  viewport.on('pointerupoutside', endShapeDrag)



  const clientToWorld = (clientX: number, clientY: number): [number, number] => {

    const global = new Point()

    app.renderer.events.mapPositionToPoint(global, clientX, clientY)

    const local = viewport.toLocal(global)

    return [local.x, local.y]

  }



  const domEventToWorld = (e: MouseEvent): [number, number] => clientToWorld(e.clientX, e.clientY)

  const onDomPointerDown = (e: PointerEvent) => {

    if (e.button !== 0) return

    pointerGesture = {

      clientX: e.clientX,

      clientY: e.clientY,

      shapeDragMoved: false,

    }

    const world = clientToWorld(e.clientX, e.clientY)

    const polylineTol = screenToWorldTolerance(POLYLINE_HIT_SCREEN_PX)

    const hitId = hitTestTopmost(callbacks.getObjects(), world[0], world[1], polylineTol)

    pointerHitId = hitId

    if (hitId) {

      callbacks.onSelect(hitId)

      viewport.plugins.pause('drag')

      activeDrag = { id: hitId, lastX: world[0], lastY: world[1] }

      backdrop.cursor = 'grabbing'

    } else {

      callbacks.onSelect(null)

    }

  }



  const onDomPointerUp = (e: PointerEvent) => {

    if (e.button !== 0 || !pointerGesture) return

    const dx = e.clientX - pointerGesture.clientX

    const dy = e.clientY - pointerGesture.clientY

    if (

      pointerHitId !== null ||

      pointerGesture.shapeDragMoved ||

      activeDrag !== null ||

      Math.hypot(dx, dy) > CLICK_DRAG_THRESHOLD_PX

    ) {

      markSuppressNextClick()

    }

    pointerGesture = null

    if (!activeDrag) backdrop.cursor = callbacks.getActiveTool() ? 'crosshair' : 'grab'

  }



  const onDomClick = (e: MouseEvent) => {

    if (e.button !== 0) return

    if (e.detail > 1) return

    if (suppressNextClick) {

      suppressNextClick = false

      if (callbacks.getActiveTool() !== null) return

    }



    const world = domEventToWorld(e)

    const tool = callbacks.getActiveTool()



    if (!tool) {

      return

    }



    if (pointerHitId) return

    callbacks.onCanvasClick(world)

  }



  const onCanvasDblClick = (e: MouseEvent) => {

    if (callbacks.getActiveTool() !== 'polygon') return

    e.preventDefault()

    e.stopPropagation()

    queueMicrotask(() => callbacks.onPolygonDoubleClick())

  }



  app.canvas.addEventListener('pointerdown', onDomPointerDown, { capture: true })

  app.canvas.addEventListener('pointerup', onDomPointerUp)

  app.canvas.addEventListener('click', onDomClick)

  app.canvas.addEventListener('dblclick', onCanvasDblClick)



  const reconcile = (state: ReconcileState) => {

    shapesLayer.removeChildren()

    selectionLayer.removeChildren()

    previewLayer.removeChildren()

    selectionOutlineVisible = false



    for (const obj of state.objects) {

      const root = new Container()

      root.eventMode = 'none'



      if (obj.kind === 'polygon') {

        const g = new Graphics()

        drawFilledPolygon(g, obj.points, obj.fill)

        root.addChild(g)

      } else if (obj.kind === 'polyline') {

        const g = new Graphics()

        drawPolylinePath(g, obj.points)

        g.stroke({ width: POLYLINE_WIDTH, color: obj.stroke, cap: 'round', join: 'round' })

        root.addChild(g)

      } else if (obj.kind === 'text') {

        const label = new Text({

          text: obj.content,

          style: new TextStyle({

            fontFamily: 'Arial',

            fontSize: 24,

            fontWeight: 'bold',

            fill: 0xffffff,

            stroke: { color: 0x000000, width: 4 },

          }),

        })

        label.anchor.set(0.5)

        label.x = obj.x

        label.y = obj.y

        label.rotation = obj.rotation

        root.addChild(label)

      }



      shapesLayer.addChild(root)

    }



    if (state.selectedId) {

      const selected = state.objects.find((o) => o.id === state.selectedId)

      if (selected) {

        const b = boundsOfObject(selected)

        if (b) {

          const g = new Graphics()

          drawSelectionOutline(g, b)

          selectionLayer.addChild(g)

          selectionOutlineVisible = true

        }

      }

    }



    if (state.inProgress) {

      const g = new Graphics()

      if (state.inProgress.kind === 'polygon') {

        drawOpenPolygonPath(g, state.inProgress.points)

        g.stroke({ width: 2, color: 0x88ccff, alpha: 0.9 })

        for (const [x, y] of state.inProgress.points) {

          g.circle(x, y, 5)

          g.fill({ color: 0x88ccff })

        }

      } else {

        drawPolylinePath(g, state.inProgress.points)

        g.stroke({ width: 2, color: 0xffdd88, alpha: 0.9 })

        for (const [x, y] of state.inProgress.points) {

          g.circle(x, y, 5)

          g.fill({ color: 0xffdd88 })

        }

      }

      previewLayer.addChild(g)

    }

  }



  const setPanForTool = (toolActive: boolean) => {

    const drag = viewport.plugins.get('drag')

    if (drag && 'options' in drag) {

      ;(drag as { options: { mouseButtons?: string } }).options.mouseButtons = toolActive

        ? 'right'

        : 'left'

    }

    backdrop.cursor = toolActive ? 'crosshair' : 'grab'

  }



  const resize = () => {

    app.renderer.resize(container.clientWidth, container.clientHeight)

    viewport.resize(container.clientWidth, container.clientHeight)

  }

  window.addEventListener('resize', resize)

  const fitWorld = () => {
    viewport.moveCenter(WORLD_SIZE / 2, WORLD_SIZE / 2)
    const fit = Math.min(container.clientWidth, container.clientHeight) / WORLD_SIZE
    viewport.setZoom(fit * 0.9, true)
    fpsMonitor.setZoom(viewport.scale.x)
  }

  const setZoomRelative = (factor: number) => {
    viewport.setZoom(viewport.scale.x * factor, true)
    fpsMonitor.setZoom(viewport.scale.x)
  }

  const exportViewportPng = async (filename = 'campaigner-viewport.png') => {
    const { blob, width, height } = await exportVisibleViewport(app, app.stage, {
      hide: [selectionLayer, fpsMonitor.getOverlay()],
      clearColor: 0x1e1e2a,
    })
    downloadPngBlob(blob, filename)
    return { width, height, byteLength: blob.size }
  }

  return {

    reconcile,

    setPanForTool,

    screenDistanceBetweenWorldPoints,

    clientToWorld,

    hasSelectionOutline: () => selectionOutlineVisible,

    hitTestAtClient: (clientX, clientY) => {
      const [wx, wy] = clientToWorld(clientX, clientY)
      return hitTestTopmost(
        callbacks.getObjects(),
        wx,
        wy,
        screenToWorldTolerance(POLYLINE_HIT_SCREEN_PX),
      )
    },

    fpsMonitor,

    fitWorld,

    setZoomRelative,

    exportViewportPng,

    destroy: () => {

      window.removeEventListener('resize', resize)

      app.canvas.removeEventListener('pointerdown', onDomPointerDown, { capture: true })

      app.canvas.removeEventListener('pointerup', onDomPointerUp)

      app.canvas.removeEventListener('click', onDomClick)

      app.canvas.removeEventListener('dblclick', onCanvasDblClick)

      endShapeDrag()

      clearTimeout(zoomDebounce)

      app.destroy(true, { children: true })

    },

  }

}


