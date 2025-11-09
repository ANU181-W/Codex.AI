# Codex.AI API Documentation

## Overview
The Codex.AI API provides endpoints for managing projects, files, and code analysis. It supports both Prisma database operations and an in-memory fallback mode.

## Base URL
All endpoints are relative to: `/api/v1`

## Authentication
Currently, no authentication is required for API endpoints.

## Error Handling
The API uses standard HTTP response codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `404`: Not Found
- `500`: Internal Server Error

Error responses follow this format:
```json
{
  "status": "fail|error",
  "error": "Error message"
}
```

## Project Endpoints

### Create Project
- **URL**: `/`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "name": "string (required)",
    "description": "string (optional)"
  }
  ```
- **Response**: Returns the created project object
  ```json
  {
    "id": "uuid",
    "name": "string",
    "description": "string",
    "createdAt": "date",
    "updatedAt": "date"
  }
  ```

### List Projects
- **URL**: `/`
- **Method**: `GET`
- **Response**: Returns an array of projects with file and scan counts
  ```json
  [{
    "id": "uuid",
    "name": "string",
    "description": "string",
    "_count": {
      "files": "number",
      "scanResults": "number"
    },
    "createdAt": "date",
    "updatedAt": "date"
  }]
  ```

### Get Project Details
- **URL**: `/:id`
- **Method**: `GET`
- **URL Parameters**: `id=[uuid]`
- **Response**: Returns project details with related files and scan results
  ```json
  {
    "id": "uuid",
    "name": "string",
    "description": "string",
    "files": ["array of files"],
    "scanResults": ["array of scan results"],
    "designTokens": ["array of design tokens"],
    "createdAt": "date",
    "updatedAt": "date"
  }
  ```

### Update Project
- **URL**: `/:id`
- **Method**: `PUT`
- **URL Parameters**: `id=[uuid]`
- **Body**:
  ```json
  {
    "name": "string (required)",
    "description": "string (optional)"
  }
  ```
- **Response**: Returns the updated project object

### Delete Project
- **URL**: `/:id`
- **Method**: `DELETE`
- **URL Parameters**: `id=[uuid]`
- **Response**: Returns success message
  ```json
  {
    "message": "Project deleted successfully"
  }
  ```

## File Management Endpoints

### Upload Files
- **URL**: `/:id/files`
- **Method**: `POST`
- **URL Parameters**: `id=[uuid]` (project ID)
- **Body**: Multipart form data with files
- **Response**: Returns array of uploaded file objects
  ```json
  [{
    "id": "uuid",
    "projectId": "uuid",
    "filename": "string",
    "path": "string",
    "type": "string",
    "hash": "string",
    "size": "number",
    "createdAt": "date",
    "updatedAt": "date"
  }]
  ```

### List Project Files
- **URL**: `/:id/files`
- **Method**: `GET`
- **URL Parameters**: `id=[uuid]` (project ID)
- **Response**: Returns array of file objects

### Get File Details
- **URL**: `/files/:id`
- **Method**: `GET`
- **URL Parameters**: `id=[uuid]` (file ID)
- **Response**: Returns file details with associated issues

### Delete File
- **URL**: `/files/:id`
- **Method**: `DELETE`
- **URL Parameters**: `id=[uuid]` (file ID)
- **Response**: Returns success message

## Scan & Analysis Endpoints

### Start Project Scan
- **URL**: `/:id/scan`
- **Method**: `POST`
- **URL Parameters**: `id=[uuid]` (project ID)
- **Response**: Returns scan result object
  ```json
  {
    "id": "uuid",
    "projectId": "uuid",
    "totalFiles": "number",
    "totalIssues": "number",
    "criticalIssues": "number",
    "highIssues": "number",
    "mediumIssues": "number",
    "lowIssues": "number",
    "infoIssues": "number",
    "fixesGenerated": "number",
    "fixesApplied": "number",
    "scanDuration": "number",
    "cacheHits": "number",
    "aiCallsMade": "number",
    "createdAt": "date"
  }
  ```

### List Scan Results
- **URL**: `/:id/scans`
- **Method**: `GET`
- **URL Parameters**: `id=[uuid]` (project ID)
- **Response**: Returns array of scan results with issues

### Get Latest Scan
- **URL**: `/:id/scans/latest`
- **Method**: `GET`
- **URL Parameters**: `id=[uuid]` (project ID)
- **Response**: Returns latest scan result with issues

## Models

### Project
```typescript
{
  id: string;            // UUID
  name: string;          // Project name
  description?: string;  // Optional project description
  files: File[];        // Associated files
  scanResults: Scan[];  // Scan history
  designTokens: any[];  // Design system tokens
  createdAt: Date;      // Creation timestamp
  updatedAt: Date;      // Last update timestamp
}
```

### File
```typescript
{
  id: string;          // UUID
  projectId: string;   // Parent project ID
  filename: string;    // Original filename
  path: string;        // File path within project
  type: string;       // File type (JS, TS, CSS, etc.)
  content: string;    // File content
  hash: string;       // Content hash for caching
  size: number;       // File size in bytes
  issues: Issue[];    // Associated issues
  createdAt: Date;    // Creation timestamp
  updatedAt: Date;    // Last update timestamp
}
```

### Scan Result
```typescript
{
  id: string;           // UUID
  projectId: string;    // Parent project ID
  totalFiles: number;   // Files scanned
  totalIssues: number;  // Total issues found
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  infoIssues: number;
  fixesGenerated: number;
  fixesApplied: number;
  scanDuration: number; // Duration in ms
  cacheHits: number;    // Cache utilization
  aiCallsMade: number;  // AI API calls made
  issues: Issue[];      // Found issues
  createdAt: Date;      // Scan timestamp
}
```

### Issue
```typescript
{
  id: string;           // UUID
  fileId: string;      // Parent file ID
  category: string;    // Issue category
  severity: string;    // CRITICAL|HIGH|MEDIUM|LOW|INFO
  title: string;       // Brief description
  message: string;     // Detailed message
  line: number;        // Line number
  column: number;      // Column number
  code: string;        // Problematic code
  rule: string;        // Rule identifier
  createdAt: Date;     // Creation timestamp
}
```