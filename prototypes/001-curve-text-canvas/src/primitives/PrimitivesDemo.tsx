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
import {
  createPrimitivesBridge,
  type BridgeCallbacks,
  type PrimitivesBridge,
} from './primitivesBridge'

export function PrimitivesDemo() {
  const canvasHostRef = useRef<HTMLDivElement>(null)
  const bridgeRef = useRef<PrimitivesBridge | null>(null)
  const toolRef = useRef<DrawTool | null>(null)
  const textRotRef = useRef(0)

  const [objects, setObjects] = useState<SceneObject[]>([])
  const [activeTool, setActiveTool] = useState<DrawTool | null>(null)
  const [inProgress, setInProgress] = useState<InProgressShape | null>(null)
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null)
  const [textRotationDeg, setTextRotationDeg] = useState(0)

  toolRef.current = activeTool
  textRotRef.current = textRotationDeg

  const callbacksRef = useRef<BridgeCallbacks>({
    getActiveTool: () => null,
    onCanvasClick: () => {},
    onCanvasDoubleClick: () => {},
    onShapeDragMove: () => {},
    onShapeDragEnd: () => {},
  })

  const closePolygon = useCallback(() => {
    setInProgress((prog) => {
      if (!prog || prog.kind !== 'polygon' || prog.points.length < 3) return prog
      const id = newId()
      setObjects((objs) => [
        ...objs,
        { id, kind: 'polygon', points: [...prog.points], fill: DEFAULT_POLYGON_FILL },
      ])
      return null
    })
  }, [])

  const finishPolyline = useCallback(() => {
    setInProgress((prog) => {
      if (!prog || prog.kind !== 'polyline' || prog.points.length < 2) return prog
      const id = newId()
      setObjects((objs) => [
        ...objs,
        { id, kind: 'polyline', points: [...prog.points], stroke: DEFAULT_POLYLINE_STROKE },
      ])
      return null
    })
  }, [])

  callbacksRef.current = {
    getActiveTool: () => toolRef.current,
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
        setSelectedTextId(id)
        return
      }

      if (tool === 'polygon') {
        setInProgress((prog) => {
          const pts = prog?.kind === 'polygon' ? prog.points : []
          return { kind: 'polygon', points: [...pts, world] }
        })
        return
      }

      setInProgress((prog) => {
        const pts = prog?.kind === 'polyline' ? prog.points : []
        return { kind: 'polyline', points: [...pts, world] }
      })
    },
    onCanvasDoubleClick: () => {
      if (toolRef.current === 'polygon') closePolygon()
    },
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
        onCanvasClick: (w) => callbacksRef.current.onCanvasClick(w),
        onCanvasDoubleClick: (w) => callbacksRef.current.onCanvasDoubleClick(w),
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
    bridgeRef.current?.reconcile({ objects, inProgress, textRotationDeg })
  }, [objects, inProgress, textRotationDeg])

  useEffect(() => {
    bridgeRef.current?.setPanForTool(activeTool !== null)
  }, [activeTool])

  useEffect(() => {
    if (!selectedTextId) return
    const rad = (textRotationDeg * Math.PI) / 180
    setObjects((objs) =>
      objs.map((o) =>
        o.id === selectedTextId && o.kind === 'text' ? { ...o, rotation: rad } : o,
      ),
    )
  }, [textRotationDeg, selectedTextId])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setInProgress(null)
        return
      }
      if (e.key === 'Enter' && toolRef.current === 'polyline') {
        e.preventDefault()
        finishPolyline()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [finishPolyline])

  const selectTool = (tool: DrawTool) => {
    setActiveTool((t) => (t === tool ? null : tool))
    setInProgress(null)
  }

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
          {activeTool === 'polygon' && 'Click vertices, double-click to close. Esc cancel.'}
          {activeTool === 'polyline' && 'Click vertices, Enter to finish. Esc cancel.'}
          {activeTool === 'text' && 'Click to place label. Esc cancel.'}
          {!activeTool && 'No tool: left-drag pan. With tool: right-drag pan.'}
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
      </div>
      <div ref={canvasHostRef} className="primitives-canvas" />
    </div>
  )
}
