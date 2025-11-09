/*
  Lightweight HTTP client for the frontend using native fetch.
  - Base URL from VITE_API_BASE_URL (defaults to http://localhost:5000/api)
  - JSON helpers and multipart upload support
  - Abort/timeout support
  - Normalized ApiError with status and payload
*/

const DEFAULT_TIMEOUT_MS = 30000;

export class ApiError extends Error {
  constructor(message, { status, data, url, method }) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    this.url = url;
    this.method = method;
  }
}

function getBaseUrl() {
  const envUrl = import.meta?.env?.VITE_API_BASE_URL;
  // Backend mounts routes under /api; default to localhost:5000
  return (envUrl && envUrl.trim()) || 'http://localhost:5000/api';
}

function buildUrl(path, query) {
  const base = getBaseUrl().replace(/\/$/, '');
  const p = String(path || '').startsWith('/') ? path : `/${path || ''}`;
  const url = new URL(base + p);
  if (query && typeof query === 'object') {
    Object.entries(query).forEach(([k, v]) => {
      if (v === undefined || v === null) return;
      if (Array.isArray(v)) v.forEach((item) => url.searchParams.append(k, String(item)));
      else url.searchParams.set(k, String(v));
    });
  }
  return url.toString();
}

async function request(path, { method = 'GET', headers, query, body, isJson = true, timeout = DEFAULT_TIMEOUT_MS } = {}) {
  const url = buildUrl(path, query);

  const controller = new AbortController();
  const id = timeout ? setTimeout(() => controller.abort(), timeout) : null;

  const finalHeaders = new Headers(headers || {});
  if (isJson && !(body instanceof FormData)) {
    if (!finalHeaders.has('Content-Type')) finalHeaders.set('Content-Type', 'application/json');
    if (!finalHeaders.has('Accept')) finalHeaders.set('Accept', 'application/json');
  }

  const options = {
    method,
    headers: finalHeaders,
    signal: controller.signal,
  };

  if (body !== undefined) {
    options.body = body instanceof FormData || !isJson ? body : JSON.stringify(body);
  }

  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';
    let data = null;

    if (contentType.includes('application/json')) {
      data = await res.json().catch(() => null);
    } else if (contentType.includes('text/')) {
      data = await res.text().catch(() => null);
    } else {
      // try json, else as blob
      try { data = await res.json(); }
      catch { try { data = await res.text(); } catch { data = null; } }
    }

    if (!res.ok) {
      const message = (data && (data.error || data.message)) || `Request failed with status ${res.status}`;
      throw new ApiError(message, { status: res.status, data, url, method });
    }

    return data;
  } catch (err) {
    if (err?.name === 'AbortError') {
      throw new ApiError('Request timed out', { status: 0, data: null, url, method });
    }
    if (err instanceof ApiError) throw err;
    throw new ApiError(err?.message || 'Network error', { status: 0, data: null, url, method });
  } finally {
    if (id) clearTimeout(id);
  }
}

export const http = {
  get: (path, opts = {}) => request(path, { ...opts, method: 'GET' }),
  post: (path, body, opts = {}) => request(path, { ...opts, method: 'POST', body }),
  put: (path, body, opts = {}) => request(path, { ...opts, method: 'PUT', body }),
  patch: (path, body, opts = {}) => request(path, { ...opts, method: 'PATCH', body }),
  delete: (path, opts = {}) => request(path, { ...opts, method: 'DELETE' }),
  // specialized helpers
  json: {
    get: (path, query, opts = {}) => request(path, { ...opts, method: 'GET', query, isJson: true }),
    post: (path, body, opts = {}) => request(path, { ...opts, method: 'POST', body, isJson: true }),
    put: (path, body, opts = {}) => request(path, { ...opts, method: 'PUT', body, isJson: true }),
    delete: (path, opts = {}) => request(path, { ...opts, method: 'DELETE', isJson: true }),
  },
  multipart: {
    post: (path, formData, opts = {}) => request(path, { ...opts, method: 'POST', body: formData, isJson: false }),
  },
  buildUrl,
  getBaseUrl,
};
