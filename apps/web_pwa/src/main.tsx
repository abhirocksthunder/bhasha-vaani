import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './ui/theme.css'
import App from './App.tsx'
import { registerServiceWorker } from './registerServiceWorker'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Production only: registering the service worker during `vite dev` fights
// with Vite's own HMR/module caching and makes "why isn't my change
// showing up" debugging worse, not better -- exactly the kind of stale-
// cache confusion already hit once with the Flutter build (see
// BV-WASMBUILD-WHITESCREEN-001) and the port/launcher issues in this
// app's own history. Only `npm run build` + `npm run preview` (or a real
// deployment) will ever have a service worker active.
if (import.meta.env.PROD) {
  void registerServiceWorker();
}
