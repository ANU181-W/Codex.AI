# Dynamic Mode (Backend-Integrated) — No Changes to Existing Files

This adds a parallel, backend-powered experience without modifying your current app. It reuses the existing UI components and styles.

## What's included
- Context: `src/contexts/DynamicDataContext.jsx` providing projects, files, scans via backend APIs
- Hooks: `src/hooks/api/*` for projects, files, scans
- Transformers: `src/services/transformers.js` to adapt backend data to UI shape
- Pages: `src/pages.dynamic/*` that pass API data to existing presentational components
- App entry: `src/App.dynamic.jsx` wiring the dynamic pages and context

## Try it locally (optional)
No files are modified automatically. To test dynamic mode, you can TEMPORARILY switch the app entry:

1) Open `src/main.jsx` and replace `App` import with `AppDynamic`:

```diff
- import App from './App.jsx'
+ import AppDynamic from './App.dynamic.jsx'
```

and replace `<App />` with `<AppDynamic />`.

2) Ensure your backend runs on `http://localhost:5000/api`, or set in `Client/.env`:

```
VITE_API_BASE_URL=http://localhost:5000/api
```

3) Start the client and backend, then navigate to:
- `/dashboard-dynamic` — shows analytics from backend
- `/scanner-dynamic` — upload files, start backend scan
- `/results-dynamic` — view scan results

Revert the `main.jsx` changes any time. Your original app remains intact.

## Notes
- File uploads expect the backend field name `index` and are already configured in the API client.
- Scan scores are computed client-side based on issue severity, mirroring the local analyzer logic.
- No existing file is modified by this feature set.
