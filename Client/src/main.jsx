import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Use loader that can switch static vs dynamic based on VITE_USE_DYNAMIC env flag
import AppLoader from './App.loader'
import '../app/globals.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
  <AppLoader />
  </StrictMode>,
)

