// Centralized endpoint path builders & constants.
// Keep paths relative to the backend /api base.

export const PROJECTS = '/projects';
export const FILES = '/files';
export const SCANS = '/scans';
export const ANALYSIS = '/analysis';
export const DEBUG = '/debug';

// Projects
export const projectList = () => PROJECTS; // GET
export const createProject = () => PROJECTS; // POST
export const projectById = (id) => `${PROJECTS}/${id}`; // GET/PUT/DELETE

// Files (note: upload uses /files/upload/:id where :id is project id)
export const uploadFiles = (projectId) => `${FILES}/upload/${projectId}`; // POST multipart
export const projectFiles = (projectId) => `${FILES}/project/${projectId}`; // GET
export const fileById = (fileId) => `${FILES}/${fileId}`; // GET/DELETE

// Scans
export const startScan = (projectId) => `${SCANS}/project/${projectId}`; // POST
export const scanResults = (projectId) => `${SCANS}/project/${projectId}`; // GET list
export const latestScan = (projectId) => `${SCANS}/project/${projectId}/latest`; // GET

// Analysis
export const analyzeCode = () => `${ANALYSIS}/code`; // POST
export const analyzeAccessibility = () => `${ANALYSIS}/accessibility`; // POST
export const analyzeSecurity = () => `${ANALYSIS}/security`; // POST
export const analyzeSEO = () => `${ANALYSIS}/seo`; // POST

// Debug
export const aiUsage = () => `${DEBUG}/ai-usage`; // GET (query: limit)
