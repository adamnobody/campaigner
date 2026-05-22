import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'
import { initCurveTextDemo } from './curveTextDemo'
import { initLargeImageDemo } from './largeImageDemo'

export type DemoMode = 'curve' | 'large'

function initialMode(): DemoMode {
  const params = new URLSearchParams(window.location.search)
  return params.get('mode') === 'large' ? 'large' : 'curve'
}

function App() {
  const [mode, setMode] = useState<DemoMode>(initialMode)
  const canvasHostRef = useRef<HTMLDivElement>(null)
  const destroyRef = useRef<(() => void) | null>(null)

  useEffect(() => {
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

  const toggleMode = useCallback(() => {
    setMode((m) => (m === 'curve' ? 'large' : 'curve'))
  }, [])

  return (
    <div className="app-root">
      <div ref={canvasHostRef} className="canvas-host" />
      <button type="button" className="mode-switch" onClick={toggleMode}>
        Switch to: {mode === 'curve' ? 'large image demo' : 'curve text demo'}
      </button>
      <div id="bench-results" hidden aria-hidden="true" />
    </div>
  )
}

export default App
