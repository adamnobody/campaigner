import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// StrictMode disabled: double mount/teardown breaks Pixi Application lifecycle.
createRoot(document.getElementById('root')!).render(<App />)
