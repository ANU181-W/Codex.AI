# AI Code Copilot API Testing Guide

Base URL: `http://localhost:5000/api`

## Authentication
All requests should include appropriate CORS headers (handled by the server).

## 1. Projects API

### 1.1 Create Project
```http
POST /projects
Content-Type: application/json

{
  "name": "My Test Project",
  "description": "A sample project for testing the AI Code Copilot"
}
```

Expected Response (201):
```json
{
  "id": "uuid",
  "name": "My Test Project",
  "description": "A sample project for testing the AI Code Copilot",
  "status": "ACTIVE",
  "createdAt": "2025-11-08T...",
  "updatedAt": "2025-11-08T..."
}
```

### 1.2 Get All Projects
```http
GET /projects
```

Expected Response (200):
```json
{
  "projects": [
    {
      "id": "uuid",
      "name": "My Test Project",
      "description": "A sample project for testing the AI Code Copilot",
      "status": "ACTIVE",
      "createdAt": "2025-11-08T...",
      "updatedAt": "2025-11-08T..."
    }
  ]
}
```

### 1.3 Get Project by ID
```http
GET /projects/:id
```

Expected Response (200):
```json
{
  "id": "uuid",
  "name": "My Test Project",
  "description": "A sample project for testing the AI Code Copilot",
  "status": "ACTIVE",
  "createdAt": "2025-11-08T...",
  "updatedAt": "2025-11-08T...",
  "files": [],
  "designTokens": []
}
```

## 2. Files API

### 2.1 Upload Files
```http
POST /files/upload/:projectId
Content-Type: multipart/form-data

files: [file1, file2, ...]
```

Example file content (test.jsx):
```jsx
function TestComponent() {
  return (
    <div>
      <img src="test.png" />
      <p style={{color: '#000'}}>Test content</p>
    </div>
  );
}
```

Expected Response (201):
```json
{
  "totalFiles": 1,
  "metrics": {
    "accessibility": 75,
    "performance": 90,
    "seo": 85,
    "security": 95
  },
  "totalIssues": 2,
  "issuesBySeverity": {
    "critical": 0,
    "high": 1,
    "medium": 1,
    "low": 0
  },
  "files": [
    {
      "id": "uuid",
      "projectId": "project-uuid",
      "filename": "test.jsx",
      "path": "test.jsx",
      "type": "JSX",
      "content": "...",
      "hash": "sha256-hash",
      "size": 123,
      "issues": [
        {
          "category": "ACCESSIBILITY",
          "severity": "HIGH",
          "message": "Image missing alt attribute",
          "line": 4
        }
      ]
    }
  ]
}
```

### 2.2 Get Files by Project
```http
GET /files?projectId=:projectId
```

Expected Response (200):
```json
{
  "files": [
    {
      "id": "uuid",
      "projectId": "project-uuid",
      "filename": "test.jsx",
      "path": "test.jsx",
      "type": "JSX",
      "hash": "sha256-hash",
      "size": 123,
      "createdAt": "2025-11-08T...",
      "updatedAt": "2025-11-08T..."
    }
  ]
}
```

## 3. Analysis API

### 3.1 Analyze File
```http
POST /analysis/file/:fileId
```

Expected Response (200):
```json
{
  "issues": [
    {
      "id": "uuid",
      "category": "ACCESSIBILITY",
      "severity": "HIGH",
      "title": "Missing Image Alt",
      "message": "Images must have alt text for screen readers",
      "line": 4,
      "column": 7,
      "code": "<img src=\"test.png\" />",
      "rule": "img-alt",
      "status": "OPEN"
    }
  ],
  "fixes": [
    {
      "id": "uuid",
      "issueId": "issue-uuid",
      "patchDiff": "@@ ... @@\n-<img src=\"test.png\" />\n+<img src=\"test.png\" alt=\"Description\" />",
      "rationale": "Adding alt text improves accessibility for screen reader users",
      "aiGenerated": true,
      "confidence": 0.95
    }
  ],
  "metrics": {
    "accessibility": 75,
    "performance": 90,
    "seo": 85,
    "security": 95
  }
}
```

### 3.2 Get Analysis Results
```http
GET /analysis/results/:projectId
```

Expected Response (200):
```json
{
  "totalFiles": 1,
  "scanResults": {
    "id": "uuid",
    "projectId": "project-uuid",
    "totalFiles": 1,
    "totalIssues": 2,
    "criticalIssues": 0,
    "highIssues": 1,
    "mediumIssues": 1,
    "lowIssues": 0,
    "infoIssues": 0,
    "fixesGenerated": 1,
    "fixesApplied": 0,
    "scanDuration": 1500,
    "cacheHits": 0,
    "aiCallsMade": 1,
    "aiCostUsd": 0.002,
    "createdAt": "2025-11-08T..."
  }
}
```

## 4. Fixes API

### 4.1 Generate Fix
```http
POST /fixes/generate
Content-Type: application/json

{
  "issueId": "issue-uuid",
  "useAI": true
}
```

Expected Response (200):
```json
{
  "fix": {
    "id": "uuid",
    "issueId": "issue-uuid",
    "patchDiff": "@@ ... @@\n-<img src=\"test.png\" />\n+<img src=\"test.png\" alt=\"Description\" />",
    "rationale": "Adding alt text improves accessibility for screen reader users",
    "aiGenerated": true,
    "aiModel": "gpt-4",
    "confidence": 0.95,
    "applied": false,
    "createdAt": "2025-11-08T..."
  }
}
```

### 4.2 Apply Fix
```http
POST /fixes/apply/:fixId
```

Expected Response (200):
```json
{
  "success": true,
  "fix": {
    "id": "uuid",
    "applied": true,
    "appliedAt": "2025-11-08T...",
    "file": {
      "id": "file-uuid",
      "content": "... updated content ..."
    }
  }
}
```

## 5. Design Tokens API

### 5.1 Create Design Token
```http
POST /design-tokens
Content-Type: application/json

{
  "projectId": "project-uuid",
  "name": "primary-color",
  "category": "COLOR",
  "value": "#0066CC",
  "cssVariable": "--primary-color"
}
```

Expected Response (201):
```json
{
  "id": "uuid",
  "projectId": "project-uuid",
  "name": "primary-color",
  "category": "COLOR",
  "value": "#0066CC",
  "cssVariable": "--primary-color",
  "createdAt": "2025-11-08T...",
  "updatedAt": "2025-11-08T..."
}
```

## Testing Flow

1. Create a new project
2. Upload test files to the project
3. Get analysis results for the uploaded files
4. Generate fixes for identified issues
5. Apply fixes to the files
6. Verify the changes through a new analysis

## Example Test Files

### test.jsx
```jsx
function TestComponent() {
  return (
    <div>
      <img src="test.png" />
      <p style={{color: '#000'}}>Test content</p>
    </div>
  );
}
```

### styles.css
```css
* {
  box-sizing: border-box;
}

.header {
  background: #000;
  color: #666;
}
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid request parameters",
  "details": ["name is required"]
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

## Base URL
```
http://localhost:3000/api/v1
```

## Project Endpoints

### 1. Create Project
```http
POST /
```

**Request Body:**
```json
{
    "name": "My Test Project",
    "description": "A project for testing code analysis features"
}
```

**Expected Response (201):**
```json
{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "My Test Project",
    "description": "A project for testing code analysis features",
    "createdAt": "2025-11-08T12:00:00.000Z",
    "updatedAt": "2025-11-08T12:00:00.000Z"
}
```

### 2. List Projects
```http
GET /
```

**Expected Response (200):**
```json
[
    {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "My Test Project",
        "description": "A project for testing code analysis features",
        "_count": {
            "files": 0,
            "scanResults": 0
        },
        "createdAt": "2025-11-08T12:00:00.000Z",
        "updatedAt": "2025-11-08T12:00:00.000Z"
    }
]
```

### 3. Get Project Details
```http
GET /:id
```

**Example URL:**
```
GET /550e8400-e29b-41d4-a716-446655440000
```

**Expected Response (200):**
```json
{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "My Test Project",
    "description": "A project for testing code analysis features",
    "files": [],
    "scanResults": [],
    "designTokens": [],
    "createdAt": "2025-11-08T12:00:00.000Z",
    "updatedAt": "2025-11-08T12:00:00.000Z"
}
```

### 4. Update Project
```http
PUT /:id
```

**Example URL:**
```
PUT /550e8400-e29b-41d4-a716-446655440000
```

**Request Body:**
```json
{
    "name": "Updated Project Name",
    "description": "Updated project description"
}
```

**Expected Response (200):**
```json
{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Updated Project Name",
    "description": "Updated project description",
    "createdAt": "2025-11-08T12:00:00.000Z",
    "updatedAt": "2025-11-08T12:15:00.000Z"
}
```

## File Management Endpoints

### 1. Upload Files
```http
POST /:id/files
```

**Example URL:**
```
POST /550e8400-e29b-41d4-a716-446655440000/files
```

**Request (Multipart Form):**
- Key: `files`
- Type: `File`
- Value: Select file(s)

Example test files:
1. `test.js`:
```javascript
console.log('test');
function test() {
    debugger;
    return true;
}
```

2. `styles.css`:
```css
.important {
    color: red !important;
}
```

**Expected Response (201):**
```json
[
    {
        "id": "650e8400-e29b-41d4-a716-446655440001",
        "projectId": "550e8400-e29b-41d4-a716-446655440000",
        "filename": "test.js",
        "path": "test.js",
        "type": "JS",
        "hash": "sha256-hash",
        "size": 78,
        "createdAt": "2025-11-08T12:30:00.000Z",
        "updatedAt": "2025-11-08T12:30:00.000Z"
    }
]
```

### 2. List Project Files
```http
GET /:id/files
```

**Example URL:**
```
GET /550e8400-e29b-41d4-a716-446655440000/files
```

**Expected Response (200):**
```json
[
    {
        "id": "650e8400-e29b-41d4-a716-446655440001",
        "projectId": "550e8400-e29b-41d4-a716-446655440000",
        "filename": "test.js",
        "path": "test.js",
        "type": "JS",
        "hash": "sha256-hash",
        "size": 78,
        "createdAt": "2025-11-08T12:30:00.000Z",
        "updatedAt": "2025-11-08T12:30:00.000Z"
    }
]
```

## Scan & Analysis Endpoints

### 1. Start Project Scan
```http
POST /:id/scan
```

**Example URL:**
```
POST /550e8400-e29b-41d4-a716-446655440000/scan
```

**Expected Response (200):**
```json
{
    "id": "750e8400-e29b-41d4-a716-446655440000",
    "projectId": "550e8400-e29b-41d4-a716-446655440000",
    "totalFiles": 1,
    "totalIssues": 2,
    "criticalIssues": 0,
    "highIssues": 0,
    "mediumIssues": 1,
    "lowIssues": 1,
    "infoIssues": 0,
    "fixesGenerated": 0,
    "fixesApplied": 0,
    "scanDuration": 1500,
    "cacheHits": 0,
    "aiCallsMade": 0,
    "createdAt": "2025-11-08T12:45:00.000Z"
}
```

### 2. List Scan Results
```http
GET /:id/scans
```

**Example URL:**
```
GET /550e8400-e29b-41d4-a716-446655440000/scans
```

**Expected Response (200):**
```json
[
    {
        "id": "750e8400-e29b-41d4-a716-446655440000",
        "projectId": "550e8400-e29b-41d4-a716-446655440000",
        "totalFiles": 1,
        "totalIssues": 2,
        "criticalIssues": 0,
        "highIssues": 0,
        "mediumIssues": 1,
        "lowIssues": 1,
        "infoIssues": 0,
        "fixesGenerated": 0,
        "fixesApplied": 0,
        "scanDuration": 1500,
        "cacheHits": 0,
        "aiCallsMade": 0,
        "issues": [
            {
                "id": "850e8400-e29b-41d4-a716-446655440000",
                "fileId": "650e8400-e29b-41d4-a716-446655440001",
                "category": "best-practices",
                "severity": "LOW",
                "title": "Console statement found",
                "message": "Avoid using console statements in production code",
                "line": 1,
                "column": 1,
                "code": "console.log('test');",
                "rule": "no-console"
            },
            {
                "id": "850e8400-e29b-41d4-a716-446655440001",
                "fileId": "650e8400-e29b-41d4-a716-446655440001",
                "category": "best-practices",
                "severity": "MEDIUM",
                "title": "Debugger statement found",
                "message": "Remove debugger statements before deploying",
                "line": 3,
                "column": 5,
                "code": "debugger;",
                "rule": "no-debugger"
            }
        ],
        "createdAt": "2025-11-08T12:45:00.000Z"
    }
]
```

### 3. Get Latest Scan
```http
GET /:id/scans/latest
```

**Example URL:**
```
GET /550e8400-e29b-41d4-a716-446655440000/scans/latest
```

**Expected Response (200):**
Similar to the scan results list, but returns only the most recent scan.

## Error Responses

### 1. Invalid Project ID
```json
{
    "status": "fail",
    "error": "Invalid project ID"
}
```

### 2. Project Not Found
```json
{
    "status": "fail",
    "error": "Project not found"
}
```

### 3. File Upload Error
```json
{
    "status": "fail",
    "error": "No files provided"
}
```

### 4. Validation Error
```json
{
    "status": "fail",
    "error": "Validation failed: Project name is required"
}
```

## Testing Steps

1. Create a new project
2. Verify project creation by listing all projects
3. Upload test files to the project
4. Verify file upload by listing project files
5. Start a scan on the project
6. Check scan results and verify issues are detected
7. Update project details
8. Delete test files
9. Delete project

## Environment Variables
Make sure to have these environment variables set in your Postman environment:

```
BASE_URL = http://localhost:3000/api/v1
```

## Headers
For file uploads, ensure you're using:
```
Content-Type: multipart/form-data
```

For other requests:
```
Content-Type: application/json
```