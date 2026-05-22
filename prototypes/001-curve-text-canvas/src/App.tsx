import { useEffect, useRef } from 'react'
import './App.css'
import { initCurveTextDemo } from './curveTextDemo'

function App() {
  const canvasRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (canvasRef.current) {
      initCurveTextDemo(canvasRef.current)
    }
  }, [])

  return (
    <div style={{ width: '100%', height: '100vh', overflow: 'hidden' }}>
      <div ref={canvasRef} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}

export default App
