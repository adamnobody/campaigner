import { useCallback, useEffect, useRef, useState } from 'react'
import {
  DEFAULT_POLYGON_FILL,
  DEFAULT_POLYLINE_STROKE,
  DEFAULT_TEXT,
  type DrawTool,
  type InProgressShape,
  newId,
  type SceneObject,
} from '../sceneTypes'
import type { InteractionKind } from '../shared/fpsMonitor'
import {
  createPrimitivesBridge,
  type BridgeCallbacks,
  type PrimitivesBridge,
} from './primitivesBridge'
import { createStressScene } from './stressSpawn'

/** True duplicate: both clicks of a double-click on the same screen pixel. */
const CLOSE_DUPLICATE_SCREEN_PX = 3

export function PrimitivesDemo() {
  const canvasHostRef = useRef<HTMLDivElement>(null)
  const bridgeRef = useRef<PrimitivesBridge | null>(null)
  const toolRef = useRef<DrawTool | null>(null)
  const textRotRef = useRef(0)
  const inProgressRef = useRef<InProgressShape | null>(null)

  const [objects, setObjects] = useState<SceneObject[]>([])
  const [activeTool, setActiveTool] = useState<DrawTool | null>(null)
  const [inProgress, setInProgress] = useState<InProgressShape | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [textRotationDeg, setTextRotationDeg] = useState(0)
  const objectsRef = useRef(objects)

  toolRef.current = activeTool
  textRotRef.current = textRotationDeg
  inProgressRef.current = inProgress
  objectsRef.current = objects

  const addPolygonVertex = useCallback((world: [number, number]) => {
    setInProgress((prog) => {
      const pts = prog?.kind === 'polygon' ? prog.points : []
      const next: InProgressShape = { kind: 'polygon', points: [...pts, world] }
      inProgressRef.current = next
      return next
    })
  }, [])

  /** Enter — close with all current vertices (no pop). */
  const commitPolygon = useCallback(() => {
    const prog = inProgressRef.current
    if (!prog || prog.kind !== 'polygon' || prog.points.length < 3) {
      setInProgress(null)
      return false
    }
    const points = [...prog.points]
    setObjects((objs) => [
      ...objs,
      { id: newId(), kind: 'polygon', points, fill: DEFAULT_POLYGON_FILL },
    ])
    setInProgress(null)
    setActiveTool(null)
    return true
  }, [])

  /**
   * Double-click adds the final vertex (first click of the pair) then closes.
   * Pop only when the last two vertices are a true duplicate (< 3 screen px).
   */
  const closePolygonFromDoubleClick = useCallback(() => {
    const prog = inProgressRef.current
    if (!prog || prog.kind !== 'polygon') return
    let points = [...prog.points]
    const n = points.length
    if (n >= 2) {
      const screenDist =
        bridgeRef.current?.screenDistanceBetweenWorldPoints(
          points[n - 1],
          points[n - 2],
        ) ?? Infinity
      if (screenDist < CLOSE_DUPLICATE_SCREEN_PX) {
        points.pop()
      }
    }
    if (points.length < 3) {
      inProgressRef.current = null
      setInProgress(null)
      return
    }
    setObjects((objs) => [
      ...objs,
      { id: newId(), kind: 'polygon', points, fill: DEFAULT_POLYGON_FILL },
    ])
    inProgressRef.current = null
    setInProgress(null)
    setActiveTool(null)
  }, [])

  const finishPolyline = useCallback(() => {
    const prog = inProgressRef.current
    if (!prog || prog.kind !== 'polyline' || prog.points.length < 2) return
    const points = [...prog.points]
    setObjects((objs) => [
      ...objs,
      { id: newId(), kind: 'polyline', points, stroke: DEFAULT_POLYLINE_STROKE },
    ])
    setInProgress(null)
    setActiveTool(null)
  }, [])

  const callbacksRef = useRef<BridgeCallbacks>({
    getActiveTool: () => null,
    getObjects: () => [],
    onSelect: () => {},
    onCanvasClick: () => {},
    onPolygonDoubleClick: () => {},
    onShapeDragMove: () => {},
    onShapeDragEnd: () => {},
  })

  callbacksRef.current = {
    getActiveTool: () => toolRef.current,
    getObjects: () => objectsRef.current,
    onSelect: (id) => {
      setSelectedId(id)
      if (id) {
        const obj = objectsRef.current.find((o) => o.id === id)
        if (obj?.kind === 'text') {
          setTextRotationDeg(Math.round((obj.rotation * 180) / Math.PI))
        }
      }
    },
    onCanvasClick: (world) => {
      const tool = toolRef.current
      if (!tool) return

      if (tool === 'text') {
        const id = newId()
        const rotation = (textRotRef.current * Math.PI) / 180
        setObjects((objs) => [
          ...objs,
          { id, kind: 'text', x: world[0], y: world[1], rotation, content: DEFAULT_TEXT },
        ])
        setSelectedId(id)
        return
      }

      if (tool === 'polygon') {
        addPolygonVertex(world)
        return
      }

      setInProgress((prog) => {
        const pts = prog?.kind === 'polyline' ? prog.points : []
        return { kind: 'polyline', points: [...pts, world] }
      })
    },
    onPolygonDoubleClick: closePolygonFromDoubleClick,
    onShapeDragMove: (id, dx, dy) => {
      setObjects((objs) =>
        objs.map((o) => {
          if (o.id !== id) return o
          if (o.kind === 'polygon' || o.kind === 'polyline') {
            return {
              ...o,
              points: o.points.map(([x, y]) => [x + dx, y + dy] as [number, number]),
            }
          }
          if (o.kind === 'text') {
            return { ...o, x: o.x + dx, y: o.y + dy }
          }
          return o
        }),
      )
    },
    onShapeDragEnd: () => {},
  }

  useEffect(() => {
    const host = canvasHostRef.current
    if (!host) return

    let cancelled = false

    void (async () => {
      const bridge = await createPrimitivesBridge(host, {
        getActiveTool: () => callbacksRef.current.getActiveTool(),
        getObjects: () => callbacksRef.current.getObjects(),
        onSelect: (id) => callbacksRef.current.onSelect(id),
        onCanvasClick: (w) => callbacksRef.current.onCanvasClick(w),
        onPolygonDoubleClick: () => callbacksRef.current.onPolygonDoubleClick(),
        onShapeDragMove: (id, dx, dy) => callbacksRef.current.onShapeDragMove(id, dx, dy),
        onShapeDragEnd: (id) => callbacksRef.current.onShapeDragEnd(id),
      })
      if (cancelled) {
        bridge.destroy()
        return
      }
      bridgeRef.current = bridge
      bridge.setPanForTool(activeTool !== null)
    })()

    return () => {
      cancelled = true
      bridgeRef.current?.destroy()
      bridgeRef.current = null
    }
  }, [])

  useEffect(() => {
    bridgeRef.current?.reconcile({ objects, inProgress, textRotationDeg, selectedId })
  }, [objects, inProgress, textRotationDeg, selectedId])

  useEffect(() => {
    bridgeRef.current?.setPanForTool(activeTool !== null)
  }, [activeTool])

  useEffect(() => {
    const w = window as Window & {
      __proto001Debug?: {
        objects: SceneObject[]
        inProgress: InProgressShape | null
        selectedId: string | null
        activeTool: DrawTool | null
      }
      __proto001ScreenToWorld?: (clientX: number, clientY: number) => [number, number]
      __proto001WorldDistScreen?: (a: [number, number], b: [number, number]) => number
      __proto001HasSelectionOutline?: () => boolean
      __proto001HitTestAtClient?: (clientX: number, clientY: number) => string | null
    }
    w.__proto001Debug = { objects, inProgress, selectedId, activeTool: activeTool }
    w.__proto001HasSelectionOutline = () => bridgeRef.current?.hasSelectionOutline() ?? false
    w.__proto001HitTestAtClient = (clientX: number, clientY: number) =>
      bridgeRef.current?.hitTestAtClient(clientX, clientY) ?? null
    w.__proto001ScreenToWorld = (clientX, clientY) =>
      bridgeRef.current?.clientToWorld(clientX, clientY) ?? [0, 0]
    w.__proto001WorldDistScreen = (a, b) =>
      bridgeRef.current?.screenDistanceBetweenWorldPoints(a, b) ?? Infinity
  }, [objects, inProgress, selectedId, activeTool])

  useEffect(() => {
    if (!selectedId) return
    const sel = objectsRef.current.find((o) => o.id === selectedId)
    if (!sel || sel.kind !== 'text') return
    const rad = (textRotationDeg * Math.PI) / 180
    setObjects((objs) =>
      objs.map((o) =>
        o.id === selectedId && o.kind === 'text' ? { ...o, rotation: rad } : o,
      ),
    )
  }, [textRotationDeg, selectedId])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        inProgressRef.current = null
        setInProgress(null)
        return
      }
      if (e.key === 'Enter') {
        if (toolRef.current === 'polyline') {
          e.preventDefault()
          finishPolyline()
        } else if (toolRef.current === 'polygon') {
          e.preventDefault()
          commitPolygon()
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [finishPolyline, commitPolygon])

  const selectTool = (tool: DrawTool) => {
    setActiveTool((t) => (t === tool ? null : tool))
    inProgressRef.current = null
    setInProgress(null)
  }

  const spawnStress = () => {
    setSelectedId(null)
    setInProgress(null)
    setActiveTool(null)
    inProgressRef.current = null
    setObjects(createStressScene())
    queueMicrotask(() => bridgeRef.current?.fitWorld())
  }

  useEffect(() => {
    const w = window as Window & {
      __proto001FpsDisplay?: () => number
      __proto001MeasureFps?: (ms: number, interaction: InteractionKind) => Promise<{
        avgFps: number
        minFps: number
        sampleCount: number
      }>
      __proto001FitWorld?: () => void
      __proto001SetZoomRelative?: (factor: number) => void
    }
    w.__proto001FpsDisplay = () => bridgeRef.current?.fpsMonitor.getDisplayFps() ?? 0
    w.__proto001MeasureFps = async (ms, interaction) => {
      const mon = bridgeRef.current?.fpsMonitor
      if (!mon) return { avgFps: 0, minFps: 0, sampleCount: 0 }
      mon.setInteraction(interaction)
      return mon.measureWindow(ms)
    }
    w.__proto001FitWorld = () => bridgeRef.current?.fitWorld()
    w.__proto001SetZoomRelative = (factor) => bridgeRef.current?.setZoomRelative(factor)
  }, [])

  return (
    <div className="primitives-root">
      <div className="primitives-toolbar">
        <span className="primitives-toolbar-label">Tool</span>
        <button
          type="button"
          className={activeTool === 'polygon' ? 'active' : ''}
          onClick={() => selectTool('polygon')}
        >
          Polygon
        </button>
        <button
          type="button"
          className={activeTool === 'polyline' ? 'active' : ''}
          onClick={() => selectTool('polyline')}
        >
          Polyline
        </button>
        <button
          type="button"
          className={activeTool === 'text' ? 'active' : ''}
          onClick={() => selectTool('text')}
        >
          Text
        </button>
        <span className="primitives-hint">
          {activeTool === 'polygon' &&
            'Click vertices, double-click to close (or Enter). Esc cancel. Right-drag pan.'}
          {activeTool === 'polyline' &&
            'Click vertices, Enter to finish. Esc cancel. Right-drag pan.'}
          {activeTool === 'text' && 'Click to place label. Esc cancel. Right-drag pan.'}
          {!activeTool &&
            'Click to select · drag to move · empty click deselects. Right-drag pan.'}
        </span>
      </div>
      <div className="primitives-sidebar">
        <label htmlFor="text-rotation">Text rotation (°)</label>
        <input
          id="text-rotation"
          type="range"
          min={-180}
          max={180}
          value={textRotationDeg}
          onChange={(e) => setTextRotationDeg(Number(e.target.value))}
        />
        <span>{textRotationDeg}°</span>
        <p className="primitives-sidebar-note">
          Adjusts the last placed text label after clicking with Text tool.
        </p>
        <button type="button" className="primitives-stress-btn" onClick={spawnStress}>
          Spawn 1000 polygons + 1000 labels
        </button>
      </div>
      <div ref={canvasHostRef} className="primitives-canvas" />
    </div>
  )
}
