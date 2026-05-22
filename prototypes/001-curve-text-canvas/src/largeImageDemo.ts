import { Application, Container, Text } from 'pixi.js'
import { Viewport } from 'pixi-viewport'
import {
  FpsMonitor,
  formatResultsTable,
  sleep,
  type FpsSampleRow,
  type InteractionKind,
} from './shared/fpsMonitor'
import {
  loadTiledBackground,
  readGpuMemoryMb,
  readMaxTextureSize,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from './shared/tiledBackground'

const SAMPLE_MS = 2500
const PAN_ANIM_MS = 2500
const ZOOM_ANIM_MS = 2000

export async function initLargeImageDemo(container: HTMLDivElement): Promise<() => void> {
  const app = new Application()
  await app.init({
    width: container.clientWidth,
    height: container.clientHeight,
    backgroundColor: 0x0f0f14,
    antialias: false,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
  })
  container.appendChild(app.canvas)

  const fpsMonitor = new FpsMonitor()
  fpsMonitor.attach(app)

  const hud = new Text({
    text: 'Loading 16k×16k tiled background…',
    style: { fontSize: 13, fill: 0xcccccc, wordWrap: true, wordWrapWidth: 420 },
  })
  hud.eventMode = 'none'
  hud.x = 8
  hud.y = 32
  app.stage.addChild(hud)

  const viewport = new Viewport({
    screenWidth: container.clientWidth,
    screenHeight: container.clientHeight,
    worldWidth: WORLD_WIDTH,
    worldHeight: WORLD_HEIGHT,
    events: app.renderer.events,
  })
  app.stage.addChild(viewport)
  viewport.drag().pinch().wheel().decelerate()

  const backgroundLayer = new Container()
  viewport.addChild(backgroundLayer)

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

  const gl = app.renderer.canvas.getContext('webgl2') ?? app.renderer.canvas.getContext('webgl')
  const maxTex = gl ? readMaxTextureSize(gl) : null
  const heapBefore = readGpuMemoryMb()

  const { tileCount, loadMs } = await loadTiledBackground(backgroundLayer, (loaded, total) => {
    hud.text = `Loading tiles ${loaded}/${total}…`
  })

  ;(window as Window & { __proto001LargeReady?: boolean }).__proto001LargeReady = true

  const heapAfter = readGpuMemoryMb()
  viewport.moveCenter(WORLD_WIDTH / 2, WORLD_HEIGHT / 2)
  fitZoom(viewport, container)

  hud.text = [
    `16k×16k procedural tiles: ${tileCount} sprites (${loadMs} ms load)`,
    `GPU MAX_TEXTURE_SIZE: ${maxTex ?? 'n/a'}`,
    `JS heap: ${heapBefore ?? '?'} → ${heapAfter ?? '?'} MB`,
    'Pan empty area / wheel zoom. FPS top-left.',
    'Add ?bench=1 to auto-measure (console + HUD).',
  ].join('\n')

  const resize = () => {
    app.renderer.resize(container.clientWidth, container.clientHeight)
    viewport.resize(container.clientWidth, container.clientHeight)
  }
  window.addEventListener('resize', resize)

  const params = new URLSearchParams(window.location.search)
  const win = window as Window & { __proto001BenchStarted?: boolean }
  if (params.get('bench') === '1' && !win.__proto001BenchStarted) {
    win.__proto001BenchStarted = true
    void runAutoBenchmark(viewport, fpsMonitor, hud, container)
  }

  return () => {
    window.removeEventListener('resize', resize)
    clearTimeout(zoomDebounce)
    app.destroy(true, { children: true })
  }
}

function fitZoom(viewport: Viewport, container: HTMLDivElement): void {
  const scaleX = container.clientWidth / WORLD_WIDTH
  const scaleY = container.clientHeight / WORLD_HEIGHT
  const scale = Math.min(scaleX, scaleY) * 0.95
  viewport.setZoom(scale, true)
  viewport.moveCenter(WORLD_WIDTH / 2, WORLD_HEIGHT / 2)
}

async function runAutoBenchmark(
  viewport: Viewport,
  fpsMonitor: FpsMonitor,
  hud: Text,
  container: HTMLDivElement,
): Promise<void> {
  hud.text = 'Running FPS benchmark…'
  const rows: FpsSampleRow[] = []
  const zoomLevels = [0.25, 1, 4] as const

  for (const zoom of zoomLevels) {
    applyZoomLevel(viewport, container, zoom)
    fpsMonitor.setZoom(viewport.scale.x)
    await sleep(400)

    for (const interaction of ['idle', 'pan', 'zoom'] as InteractionKind[]) {
      fpsMonitor.setInteraction(interaction)
      const driver = startInteractionDriver(viewport, interaction, container)
      const { avgFps, minFps, sampleCount } = await fpsMonitor.measureWindow(
        interaction === 'idle' ? SAMPLE_MS : interaction === 'pan' ? PAN_ANIM_MS : ZOOM_ANIM_MS,
      )
      driver.stop()
      rows.push({ zoom, interaction, avgFps, minFps })
      if (sampleCount < 30 || minFps < 30) {
        hud.text = [
          'Benchmark STOP: min FPS < 30 (baseline failure).',
          formatResultsTable(rows),
          'See console for full table.',
        ].join('\n\n')
        console.warn('[prototype-001] Task 2 benchmark failed at', { zoom, interaction, minFps })
        console.log(formatResultsTable(rows))
        publishBenchResults(rows, false)
        return
      }
    }
  }

  const table = formatResultsTable(rows)
  hud.text = `Benchmark done (all phases ≥30 min FPS).\n\n${table}`
  console.log('[prototype-001] Task 2 FPS results:\n' + table)
  publishBenchResults(rows, true)
}

function publishBenchResults(rows: FpsSampleRow[], pass: boolean): void {
  const el = document.getElementById('bench-results')
  if (el) {
    el.dataset.results = JSON.stringify({ rows, pass })
    el.dataset.benchDone = 'true'
  }
}

function applyZoomLevel(viewport: Viewport, container: HTMLDivElement, level: 0.25 | 1 | 4): void {
  fitZoom(viewport, container)
  const base = viewport.scale.x
  viewport.setZoom(base * level, true)
  viewport.moveCenter(WORLD_WIDTH / 2, WORLD_HEIGHT / 2)
}

function startInteractionDriver(
  viewport: Viewport,
  kind: InteractionKind,
  container: HTMLDivElement,
): { stop: () => void } {
  let t = 0
  let raf = 0
  let alive = true
  const baseScale = viewport.scale.x

  const tick = () => {
    if (!alive || !viewport.parent) return
    t += 0.016
    if (kind === 'pan') {
      viewport.position.x = Math.sin(t * 1.4) * container.clientWidth * 0.45
      viewport.position.y = Math.cos(t * 1.1) * container.clientHeight * 0.45
    } else if (kind === 'zoom') {
      const wobble = baseScale * (1 + Math.sin(t * 2.2) * 0.35)
      viewport.setZoom(Math.max(0.02, wobble), false)
    }
    raf = requestAnimationFrame(tick)
  }
  raf = requestAnimationFrame(tick)
  return {
    stop: () => {
      alive = false
      cancelAnimationFrame(raf)
    },
  }
}
