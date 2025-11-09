// Loader that switches between static App and backend-powered AppDynamic based on env.
// Keeps all presentational components untouched.

import App from './App'
import AppDynamic from './App.dynamic'

function shouldUseDynamic() {
  // Env flag
  const envFlag = (import.meta?.env?.VITE_USE_DYNAMIC || '').toString().toLowerCase() === 'true'
  if (envFlag) return true
  // Query param override: ?dynamic=1
  try {
    const usp = new URLSearchParams(window.location.search)
    if (['1','true','yes','on'].includes((usp.get('dynamic') || '').toLowerCase())) return true
  } catch {}
  // Local preference
  try {
    const pref = (localStorage.getItem('useDynamic') || '').toLowerCase()
    if (['1','true','yes','on'].includes(pref)) return true
  } catch {}
  return false
}

export default function AppLoader() {
  return shouldUseDynamic() ? <AppDynamic /> : <App />
}
