import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { registerServiceWorker } from './pwa'

const root = document.getElementById('root')

if (!root) {
  throw new Error('CAPTA CITY root element not found')
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

void registerServiceWorker()
