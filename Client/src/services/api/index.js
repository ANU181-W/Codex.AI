// High-level API functions organized by domain.
// Import these in components/contexts without modifying existing code.

import { http } from './httpClient';
import * as ep from './endpoints';

// Utility to unwrap and provide friendly error messages
function mapError(e) {
  if (!e) return 'Unknown error';
  if (e.data?.error) return e.data.error;
  if (e.data?.message) return e.data.message;
  return e.message || 'Request failed';
}

// PROJECTS
export const ProjectAPI = {
  list: () => http.get(ep.projectList()),
  create: (payload) => http.post(ep.createProject(), payload),
  get: (id) => http.get(ep.projectById(id)),
  update: (id, payload) => http.put(ep.projectById(id), payload),
  delete: (id) => http.delete(ep.projectById(id)),
};

// FILES
export const FileAPI = {
  upload: (projectId, files) => {
    const form = new FormData();
    // Backend expects field name 'index' per fileRoutes.js (upload.array('index'))
    files.forEach((f) => form.append('index', f));
    return http.multipart.post(ep.uploadFiles(projectId), form);
  },
  listForProject: (projectId) => http.get(ep.projectFiles(projectId)),
  get: (fileId) => http.get(ep.fileById(fileId)),
  delete: (fileId) => http.delete(ep.fileById(fileId)),
};

// SCANS
export const ScanAPI = {
  start: (projectId) => http.post(ep.startScan(projectId)),
  list: (projectId) => http.get(ep.scanResults(projectId)),
  latest: (projectId) => http.get(ep.latestScan(projectId)),
};

// ANALYSIS
export const AnalysisAPI = {
  code: (payload) => http.post(ep.analyzeCode(), payload),
  accessibility: (payload) => http.post(ep.analyzeAccessibility(), payload),
  security: (payload) => http.post(ep.analyzeSecurity(), payload),
  seo: (payload) => http.post(ep.analyzeSEO(), payload),
};

// DEBUG
export const DebugAPI = {
  aiUsage: (limit = 20) => http.get(ep.aiUsage() + `?limit=${encodeURIComponent(limit)}`),
};

// Generic helper with safe error handling (optional usage)
export async function safe(promiseFn) {
  try {
    const data = await promiseFn();
    return [data, null];
  } catch (e) {
    return [null, mapError(e)];
  }
}

// Example usage (non-executed comment):
// import { ProjectAPI } from '@/services/api';
// const projects = await ProjectAPI.list();
