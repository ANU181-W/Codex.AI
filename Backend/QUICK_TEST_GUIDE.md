# Quick Postman Testing Guide for Codex.AI

## Setup
1. Base URL: `http://localhost:3000/api/v1`
2. Create a new Postman collection named "Codex.AI"
3. Set environment variable: `BASE_URL`

## 1. Project Management

### Create Project
```http
POST {{BASE_URL}}/
```
```json
{
    "name": "My Test Website",
    "description": "A React-based web application for testing"
}
```

### List Projects
```http
GET {{BASE_URL}}/
```

### Get Project Details
```http
GET {{BASE_URL}}/550e8400-e29b-41d4-a716-446655440000
```

### Update Project
```http
PUT {{BASE_URL}}/550e8400-e29b-41d4-a716-446655440000
```
```json
{
    "name": "Updated Website Name",
    "description": "Updated project description"
}
```

## 2. File Management

### Upload Files
```http
POST {{BASE_URL}}/550e8400-e29b-41d4-a716-446655440000/files
```
**Form-Data:**
- Key: `files`
- Type: File
- Select these test files:

`index.html`:
```html
<!DOCTYPE html>
<html>
<head>
    <title>Test Page</title>
</head>
<body>
    <div>
        <img src="logo.png" />
        <a href="https://example.com" target="_blank">Link</a>
    </div>
</body>
</html>
```

`App.jsx`:
```jsx
function App() {
  return (
    <div>
      <img src="hero.jpg" />
      <div style={{color: '#666'}}>
        <button onclick="handleClick()">Click me</button>
      </div>
    </div>
  )
}
```

`styles.css`:
```css
.important {
    color: red !important;
}
.menu {
    background: #fff;
}
```

### List Project Files
```http
GET {{BASE_URL}}/550e8400-e29b-41d4-a716-446655440000/files
```

### Get File Details
```http
GET {{BASE_URL}}/files/650e8400-e29b-41d4-a716-446655440001
```

## 3. Code Analysis & Fixes

### Start Project Scan
```http
POST {{BASE_URL}}/550e8400-e29b-41d4-a716-446655440000/scan
```

### Get Latest Scan Results
```http
GET {{BASE_URL}}/550e8400-e29b-41d4-a716-446655440000/scans/latest
```

### Apply Fixes
```http
POST {{BASE_URL}}/files/650e8400-e29b-41d4-a716-446655440001/fixes
```
```json
{
    "fixes": [
        {
            "id": "fix-1",
            "type": "accessibility",
            "action": "add-alt-text",
            "line": 7,
            "content": "<img src=\"logo.png\" alt=\"Company Logo\" />"
        },
        {
            "id": "fix-2",
            "type": "security",
            "action": "add-rel-noopener",
            "line": 8,
            "content": "<a href=\"https://example.com\" target=\"_blank\" rel=\"noopener noreferrer\">Link</a>"
        }
    ]
}
```

## Expected Responses

### Project Creation Response
```json
{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "My Test Website",
    "description": "A React-based web application for testing",
    "createdAt": "2025-11-08T12:00:00.000Z",
    "updatedAt": "2025-11-08T12:00:00.000Z"
}
```

### File Upload Response
```json
{
    "totalFiles": 3,
    "metrics": {
        "accessibility": 75.5,
        "performance": 88.0,
        "seo": 82.5,
        "security": 70.0
    },
    "totalIssues": 5,
    "issuesBySeverity": {
        "critical": 0,
        "high": 2,
        "medium": 2,
        "low": 1
    },
    "files": [
        {
            "id": "650e8400-e29b-41d4-a716-446655440001",
            "filename": "index.html",
            "issues": [
                {
                    "severity": "high",
                    "category": "accessibility",
                    "message": "Image missing alt text",
                    "line": 7
                },
                {
                    "severity": "high",
                    "category": "security",
                    "message": "target=\"_blank\" without rel=\"noopener noreferrer\"",
                    "line": 8
                }
            ]
        }
    ]
}
```

### Scan Results Response
```json
{
    "id": "750e8400-e29b-41d4-a716-446655440000",
    "projectId": "550e8400-e29b-41d4-a716-446655440000",
    "totalFiles": 3,
    "totalIssues": 5,
    "metrics": {
        "accessibility": 75.5,
        "performance": 88.0,
        "seo": 82.5,
        "security": 70.0
    },
    "issuesBySeverity": {
        "critical": 0,
        "high": 2,
        "medium": 2,
        "low": 1
    }
}
```

### Fix Application Response
```json
{
    "success": true,
    "improvement": {
        "accessibility": 20.5,
        "security": 25.0
    },
    "newIssueCount": 3,
    "metrics": {
        "accessibility": 96.0,
        "performance": 88.0,
        "seo": 82.5,
        "security": 95.0
    },
    "verificationResults": {
        "beforeFix": {
            "issues": 5,
            "metrics": {
                "accessibility": 75.5,
                "security": 70.0
            }
        },
        "afterFix": {
            "issues": 3,
            "metrics": {
                "accessibility": 96.0,
                "security": 95.0
            }
        }
    }
}
```

## Quick Test Flow

1. Create project:
```bash
POST / with project JSON
↓
Save project ID from response
```

2. Upload test files:
```bash
POST /:projectId/files with test files
↓
Save file IDs from response
```

3. Analyze code:
```bash
POST /:projectId/scan
↓
GET /:projectId/scans/latest
```

4. Apply fixes:
```bash
POST /files/:fileId/fixes with fixes JSON
↓
Verify improvements in response
```

## Common Issues to Test

1. **Accessibility:**
- Missing alt text
- Poor color contrast
- Improper button labels

2. **Security:**
- Unsafe external links
- Missing CORS headers
- Inline scripts

3. **Performance:**
- Unoptimized images
- Unused CSS
- Deep DOM nesting

4. **SEO:**
- Missing meta tags
- Non-semantic HTML
- Missing headings

Each test file provided above contains examples of these issues for testing the analysis and fix features.