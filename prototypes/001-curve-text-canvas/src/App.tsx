import { useEffect, useRef, useState } from 'react'
import './App.css'
import { initCurveTextDemo } from './curveTextDemo'
import { initLargeImageDemo } from './largeImageDemo'
import { PrimitivesDemo } from './primitives/PrimitivesDemo'

export type DemoMode = 'curve' | 'large' | 'primitives'

const MODE_LABELS: Record<DemoMode, string> = {
  curve: 'Curve text demo',
  large: 'Large image demo',
  primitives: 'Primitives demo',
}

function initialMode(): DemoMode {
  const m = new URLSearchParams(window.location.search).get('mode')
  if (m === 'large') return 'large'
  if (m === 'primitives') return 'primitives'
  return 'curve'
}

function App() {
  const [mode, setMode] = useState<DemoMode>(initialMode)
  const canvasHostRef = useRef<HTMLDivElement>(null)
  const destroyRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (mode === 'primitives') return

    const host = canvasHostRef.current
    if (!host) return

    let cancelled = false

    void (async () => {
      destroyRef.current?.()
      destroyRef.current = null
      host.replaceChildren()

      const destroy =
        mode === 'curve' ? await initCurveTextDemo(host) : await initLargeImageDemo(host)

      if (cancelled) {
        destroy()
      } else {
        destroyRef.current = destroy
      }
    })()

    return () => {
      cancelled = true
      destroyRef.current?.()
      destroyRef.current = null
    }
  }, [mode])

  return (
    <div className="app-root">
      {mode === 'primitives' ? (
        <PrimitivesDemo />
      ) : (
        <>
          <div ref={canvasHostRef} className="canvas-host" />
          <button
            type="button"
            className="app-export-btn"
            onClick={() => {
              const w = window as Window & {
                __proto001ExportViewportPng?: () => Promise<unknown>
              }
              void w.__proto001ExportViewportPng?.()
            }}
          >
            Export viewport to PNG
          </button>
        </>
      )}
      <label className="mode-switch">
        <span>Demo</span>
        <select value={mode} onChange={(e) => setMode(e.target.value as DemoMode)}>
          {(Object.keys(MODE_LABELS) as DemoMode[]).map((key) => (
            <option key={key} value={key}>
              {MODE_LABELS[key]}
            </option>
          ))}
        </select>
      </label>
      <div id="bench-results" hidden aria-hidden="true" />
    </div>
  )
}

export default App
