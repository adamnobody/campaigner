import {
  Application,
  Container,
  FederatedPointerEvent,
  Graphics,
  Rectangle,
  Text,
  TextStyle,
} from 'pixi.js'
import { Viewport } from 'pixi-viewport'
import type { DrawTool, InProgressShape, SceneObject } from '../sceneTypes'

const WORLD_SIZE = 4000
const POLYLINE_STROKE = 0xe6b422
const POLYLINE_WIDTH = 4
const HIT_PADDING = 8

export type BridgeCallbacks = {
  getActiveTool: () => DrawTool | null
  onCanvasClick: (world: [number, number]) => void
  onCanvasDoubleClick: (world: [number, number]) => void
  onShapeDragMove: (id: string, dx: number, dy: number) => void
  onShapeDragEnd: (id: string) => void
}

export type ReconcileState = {
  objects: SceneObject[]
  inProgress: InProgressShape | null
  textRotationDeg: number
}

export type PrimitivesBridge = {
  reconcile: (state: ReconcileState) => void
  setPanForTool: (toolActive: boolean) => void
  destroy: () => void
}

function drawPolygonPath(g: Graphics, points: [number, number][], close: boolean) {
  if (points.length === 0) return
  g.moveTo(points[0][0], points[0][1])
  for (let i = 1; i < points.length; i++) {
    g.lineTo(points[i][0], points[i][1])
  }
  if (close && points.length >= 3) g.closePath()
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

function boundsOfPoints(points: [number, number][]): Rectangle {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const [x, y] of points) {
    minX = Math.min(minX, x)
    minY = Math.min(minY, y)
    maxX = Math.max(maxX, x)
    maxY = Math.max(maxY, y)
  }
  const pad = HIT_PADDING
  return new Rectangle(minX - pad, minY - pad, maxX - minX + pad * 2, maxY - minY + pad * 2)
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
  const previewLayer = new Container()
  viewport.addChild(backdrop, shapesLayer, previewLayer)

  viewport.moveCenter(WORLD_SIZE / 2, WORLD_SIZE / 2)
  const fit = Math.min(container.clientWidth, container.clientHeight) / WORLD_SIZE
  viewport.setZoom(fit * 0.9, true)

  let activeDrag: { id: string; lastX: number; lastY: number } | null = null

  const endShapeDrag = () => {
    if (activeDrag) {
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
    activeDrag.lastX = local.x
    activeDrag.lastY = local.y
    callbacks.onShapeDragMove(activeDrag.id, dx, dy)
  }

  viewport.on('pointermove', onGlobalMove)
  viewport.on('pointerup', endShapeDrag)
  viewport.on('pointerupoutside', endShapeDrag)

  const onBackdropClick = (e: FederatedPointerEvent) => {
    if (e.button !== 0 || callbacks.getActiveTool() === null) return
    const local = viewport.toLocal(e.global)
    callbacks.onCanvasClick([local.x, local.y])
  }

  const onBackdropDblClick = (e: FederatedPointerEvent) => {
    if (e.button !== 0 || callbacks.getActiveTool() !== 'polygon') return
    const local = viewport.toLocal(e.global)
    callbacks.onCanvasDoubleClick([local.x, local.y])
  }

  backdrop.on('pointerdown', onBackdropClick)
  backdrop.on('dblclick', onBackdropDblClick)

  const attachShapeDrag = (root: Container, id: string) => {
    root.eventMode = 'static'
    root.cursor = 'grab'
    root.on('pointerdown', (e: FederatedPointerEvent) => {
      if (e.button !== 0) return
      e.stopPropagation()
      viewport.plugins.pause('drag')
      const local = viewport.toLocal(e.global)
      activeDrag = { id, lastX: local.x, lastY: local.y }
      root.cursor = 'grabbing'
    })
    root.on('pointerup', () => {
      root.cursor = 'grab'
    })
    root.on('pointerupoutside', () => {
      root.cursor = 'grab'
    })
  }

  const reconcile = (state: ReconcileState) => {
    shapesLayer.removeChildren()
    previewLayer.removeChildren()

    for (const obj of state.objects) {
      if (obj.kind === 'polygon') {
        const root = new Container()
        const g = new Graphics()
        drawPolygonPath(g, obj.points, true)
        g.fill({ color: obj.fill, alpha: 0.75 })
        g.stroke({ width: 2, color: 0xffffff, alpha: 0.35 })
        root.addChild(g)
        root.hitArea = boundsOfPoints(obj.points)
        attachShapeDrag(root, obj.id)
        shapesLayer.addChild(root)
      } else if (obj.kind === 'polyline') {
        const root = new Container()
        const g = new Graphics()
        drawPolylinePath(g, obj.points)
        g.stroke({ width: POLYLINE_WIDTH, color: obj.stroke, cap: 'round', join: 'round' })
        const hit = new Graphics()
        drawPolylinePath(hit, obj.points)
        hit.stroke({ width: POLYLINE_WIDTH + HIT_PADDING * 2, color: 0x000000, alpha: 0.001 })
        root.addChild(g, hit)
        root.hitArea = boundsOfPoints(obj.points)
        attachShapeDrag(root, obj.id)
        shapesLayer.addChild(root)
      } else if (obj.kind === 'text') {
        const label = new Text({
          text: obj.content,
          style: new TextStyle({
            fontFamily: 'Arial',
            fontSize: 22,
            fill: 0xffffff,
            stroke: { color: 0x222222, width: 2 },
          }),
        })
        label.anchor.set(0.5)
        label.x = obj.x
        label.y = obj.y
        label.rotation = obj.rotation
        const root = new Container()
        root.addChild(label)
        const b = label.getBounds()
        root.hitArea = new Rectangle(
          b.x - HIT_PADDING,
          b.y - HIT_PADDING,
          b.width + HIT_PADDING * 2,
          b.height + HIT_PADDING * 2,
        )
        attachShapeDrag(root, obj.id)
        shapesLayer.addChild(root)
      }
    }

    if (state.inProgress) {
      const g = new Graphics()
      if (state.inProgress.kind === 'polygon') {
        drawPolygonPath(g, state.inProgress.points, false)
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

  return {
    reconcile,
    setPanForTool,
    destroy: () => {
      window.removeEventListener('resize', resize)
      endShapeDrag()
      app.destroy(true, { children: true })
    },
  }
}
