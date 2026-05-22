import {
  Application,
  Circle,
  Container,
  FederatedPointerEvent,
  Graphics,
  Text,
  TextStyle,
} from 'pixi.js'
import { Viewport } from 'pixi-viewport'

const HANDLE_RADIUS = 14
const HANDLE_HOVER_SCALE = 1.2

// Simple cubic Bézier helpers (parameter t sampling for prototype MVP)
function cubicBezier(p0: number[], p1: number[], p2: number[], p3: number[], t: number): number[] {
  const u = 1 - t
  const tt = t * t
  const uu = u * u
  const uuu = uu * u
  const ttt = tt * t
  const x = uuu * p0[0] + 3 * uu * t * p1[0] + 3 * u * tt * p2[0] + ttt * p3[0]
  const y = uuu * p0[1] + 3 * uu * t * p1[1] + 3 * u * tt * p2[1] + ttt * p3[1]
  return [x, y]
}

function cubicBezierTangent(p0: number[], p1: number[], p2: number[], p3: number[], t: number): number[] {
  const u = 1 - t
  const tt = t * t
  const uu = u * u
  const x = 3 * uu * (p1[0] - p0[0]) + 6 * u * t * (p2[0] - p1[0]) + 3 * tt * (p3[0] - p2[0])
  const y = 3 * uu * (p1[1] - p0[1]) + 6 * u * t * (p2[1] - p1[1]) + 3 * tt * (p3[1] - p2[1])
  return [x, y]
}

function normalize(v: number[]): number[] {
  const len = Math.hypot(v[0], v[1]) || 1
  return [v[0] / len, v[1] / len]
}

const SAMPLE_STEPS = 60

function drawHandleGraphic(g: Graphics, hovered: boolean) {
  g.clear()
  const r = HANDLE_RADIUS
  g.circle(0, 0, r)
  g.fill({ color: hovered ? 0xff8a80 : 0xff5252 })
  g.stroke({ width: hovered ? 3 : 2, color: 0xffffff, alpha: hovered ? 1 : 0.9 })
}

export async function initCurveTextDemo(container: HTMLDivElement) {
  const app = new Application()
  await app.init({
    width: container.clientWidth,
    height: container.clientHeight,
    backgroundColor: 0x1a1a2e,
    antialias: true,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
  })
  container.appendChild(app.canvas)

  const viewport = new Viewport({
    screenWidth: container.clientWidth,
    screenHeight: container.clientHeight,
    worldWidth: 2000,
    worldHeight: 2000,
    events: app.renderer.events,
  })
  app.stage.addChild(viewport)
  viewport.interactiveChildren = true
  viewport.drag().pinch().wheel().decelerate()

  const curveLayer = new Container()
  const textLayer = new Container()
  const handlesLayer = new Container()
  handlesLayer.eventMode = 'static'
  handlesLayer.interactiveChildren = true
  viewport.addChild(curveLayer, textLayer, handlesLayer)

  let points: number[][] = [
    [400, 400],
    [500, 300],
    [700, 500],
    [800, 400],
  ]

  const textContent = 'The Kingdom of Aldoria'

  const curveGfx = new Graphics()
  curveLayer.addChild(curveGfx)

  const handles: Graphics[] = []

  type ActiveDrag = { index: number; offsetX: number; offsetY: number }
  let activeDrag: ActiveDrag | null = null

  function drawCurve() {
    curveGfx.clear()
    curveGfx.moveTo(points[0][0], points[0][1])
    for (let i = 1; i <= SAMPLE_STEPS; i++) {
      const t = i / SAMPLE_STEPS
      const [x, y] = cubicBezier(points[0], points[1], points[2], points[3], t)
      if (i === 1) {
        curveGfx.stroke({ width: 2, color: 0x00d4ff })
      }
      curveGfx.lineTo(x, y)
    }
  }

  function layoutTextAlongCurve() {
    textLayer.removeChildren()

    const style = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 28,
      fill: 0xffffff,
      align: 'center',
    })

    const chars = Array.from(textContent)
    const n = chars.length
    if (n === 0) return

    const samples: { pos: number[]; t: number; dist: number }[] = []
    let prev: number[] | null = null
    let totalLength = 0
    for (let i = 0; i <= SAMPLE_STEPS; i++) {
      const t = i / SAMPLE_STEPS
      const pos = cubicBezier(points[0], points[1], points[2], points[3], t)
      let dist = 0
      if (prev) {
        dist = Math.hypot(pos[0] - prev[0], pos[1] - prev[1])
        totalLength += dist
      }
      samples.push({ pos, t, dist: totalLength })
      prev = pos
    }

    const glyphSpacing = totalLength / (n + 1)
    let currentDist = glyphSpacing / 2

    for (let i = 0; i < n; i++) {
      let seg = samples.findIndex((s, idx) => idx > 0 && s.dist >= currentDist)
      if (seg < 0) seg = samples.length - 1
      const s1 = samples[Math.max(0, seg - 1)]
      const s2 = samples[seg]
      const segLen = s2.dist - s1.dist
      const localT = segLen > 0 ? (currentDist - s1.dist) / segLen : 0

      const t = s1.t + (s2.t - s1.t) * localT
      const pos = cubicBezier(points[0], points[1], points[2], points[3], t)
      const tan = normalize(cubicBezierTangent(points[0], points[1], points[2], points[3], t))

      const glyph = new Text({ text: chars[i], style })
      glyph.anchor.set(0.5, 0.5)
      glyph.x = pos[0]
      glyph.y = pos[1]
      glyph.rotation = Math.atan2(tan[1], tan[0])
      textLayer.addChild(glyph)

      currentDist += glyphSpacing
    }
  }

  function updateAll() {
    drawCurve()
    layoutTextAlongCurve()
  }

  function endHandleDrag() {
    if (!activeDrag) return
    activeDrag = null
    viewport.plugins.resume('drag')
  }

  function onGlobalPointerMove(e: FederatedPointerEvent) {
    if (!activeDrag) return
    const local = viewport.toLocal(e.global)
    const handle = handles[activeDrag.index]
    handle.x = local.x + activeDrag.offsetX
    handle.y = local.y + activeDrag.offsetY
    points[activeDrag.index] = [handle.x, handle.y]
    updateAll()
  }

  function createHandle(index: number) {
    const g = new Graphics()
    drawHandleGraphic(g, false)
    g.eventMode = 'static'
    g.cursor = 'grab'
    g.hitArea = new Circle(0, 0, HANDLE_RADIUS + 4)

    const [x, y] = points[index]
    g.x = x
    g.y = y

    g.on('pointerover', () => {
      if (activeDrag) return
      g.scale.set(HANDLE_HOVER_SCALE)
      drawHandleGraphic(g, true)
    })

    g.on('pointerout', () => {
      if (activeDrag) return
      g.scale.set(1)
      drawHandleGraphic(g, false)
    })

    g.on('pointerdown', (e: FederatedPointerEvent) => {
      e.stopPropagation()
      viewport.plugins.pause('drag')
      const local = viewport.toLocal(e.global)
      activeDrag = {
        index,
        offsetX: g.x - local.x,
        offsetY: g.y - local.y,
      }
      g.cursor = 'grabbing'
      g.scale.set(HANDLE_HOVER_SCALE)
      drawHandleGraphic(g, true)
    })

    handlesLayer.addChild(g)
    handles.push(g)
  }

  viewport.on('pointermove', onGlobalPointerMove)
  viewport.on('pointerup', () => {
    if (activeDrag) {
      const handle = handles[activeDrag.index]
      handle.cursor = 'grab'
      handle.scale.set(1)
      drawHandleGraphic(handle, false)
    }
    endHandleDrag()
  })
  viewport.on('pointerupoutside', () => {
    if (activeDrag) {
      const handle = handles[activeDrag.index]
      handle.cursor = 'grab'
      handle.scale.set(1)
      drawHandleGraphic(handle, false)
    }
    endHandleDrag()
  })

  points.forEach((_, i) => createHandle(i))
  updateAll()

  const resize = () => {
    app.renderer.resize(container.clientWidth, container.clientHeight)
    viewport.resize(container.clientWidth, container.clientHeight)
  }
  window.addEventListener('resize', resize)

  const info = new Text({
    text: 'Drag the red handles to edit the curve. Drag empty space to pan. Mouse wheel to zoom.',
    style: { fontSize: 14, fill: 0xaaaaaa },
  })
  info.eventMode = 'none'
  info.x = 20
  info.y = 20
  app.stage.addChild(info)

  return () => {
    window.removeEventListener('resize', resize)
    endHandleDrag()
    app.destroy(true, { children: true })
  }
}
