# API Client Layer

Centralized, non-invasive API integration for the backend. Existing code remains unchanged; components or contexts can import these helpers ad hoc.

## Base URL
Defaults to `http://localhost:5000/api`. Override by setting `VITE_API_BASE_URL` in a `.env` file at the project root:

```
VITE_API_BASE_URL=http://localhost:5000/api
```

## Structure
```
src/services/api/
  httpClient.js   // low-level fetch wrapper
  endpoints.js    // path builders
  index.js        // grouped domain APIs
```

## Usage Examples
```js
import { ProjectAPI, FileAPI, ScanAPI, AnalysisAPI, DebugAPI, safe } from '@/services/api';

// List projects
const projects = await ProjectAPI.list();

// Create project
const created = await ProjectAPI.create({ name: 'My Project', description: 'Test' });

// Upload files
await FileAPI.upload(projectId, fileListArray); // fileListArray: File[]

// Start a scan
const scan = await ScanAPI.start(projectId);

// Latest scan
const latest = await ScanAPI.latest(projectId);

// Code analysis
const analysis = await AnalysisAPI.code({ content: 'function x(){}', language: 'javascript' });

// Safe wrapper usage
const [data, err] = await safe(() => ProjectAPI.list());
if (err) console.error(err);
```

## Error Handling
Errors throw `ApiError` with shape:
```ts
{
  name: 'ApiError',
  message: string,
  status: number, // 0 for network/timeout
  data: any,      // parsed response payload if available
  url: string,
  method: string
}
```
Use the `safe` helper for tuple-style error handling.

## Extending
Add new endpoint builders to `endpoints.js`, then surface functions in `index.js`. Keep fetch logic in `httpClient.js` minimal.

## Notes
- File upload uses field name `index` to match backend `upload.array('index', 200)`.
- Timeouts default to 30s; adjust per-request by passing `{ timeout: ms }` in options on http methods.
- No global state or interceptors are mutating external code.
