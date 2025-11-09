# AI-Powered Code Analysis & Fix API Testing Guide

## Base URL
```
http://localhost:3000/api/v1
```

## Project Upload & Analysis

### 1. Upload Project Files
```http
POST /:projectId/files
```

**Headers:**
```
Content-Type: multipart/form-data
```

**Path Parameters:**
- `projectId`: UUID of the project

**Form Data:**
- Key: `files[]`
- Value: Select multiple files (up to 200)
- Supported file types: `.html`, `.jsx`, `.tsx`, `.css`, `.scss`

**Example Response (201):**
```json
{
    "totalFiles": 3,
    "metrics": {
        "accessibility": 85.5,
        "performance": 92.0,
        "seo": 78.5,
        "security": 88.0
    },
    "totalIssues": 12,
    "issuesBySeverity": {
        "critical": 1,
        "high": 3,
        "medium": 5,
        "low": 3
    },
    "files": [
        {
            "id": "file-uuid-1",
            "filename": "App.jsx",
            "type": "JSX",
            "metrics": {
                "accessibility": 88.0,
                "performance": 95.0,
                "seo": 82.0,
                "security": 90.0
            },
            "issues": [
                {
                    "severity": "high",
                    "category": "accessibility",
                    "message": "Image missing alt text",
                    "line": 45,
                    "column": 7,
                    "code": "<img src=\"logo.png\" />"
                }
            ],
            "suggestions": [
                {
                    "category": "accessibility",
                    "description": "Add alt text to image",
                    "changes": [
                        "Add descriptive alt text for logo image"
                    ],
                    "rationale": "Screen readers require alt text to convey image content"
                }
            ]
        }
    ]
}
```

### 2. Start Project Analysis
```http
POST /:projectId/scan
```

**Path Parameters:**
- `projectId`: UUID of the project

**Example Response (200):**
```json
{
    "id": "scan-uuid",
    "projectId": "project-uuid",
    "totalFiles": 3,
    "totalIssues": 12,
    "criticalIssues": 1,
    "highIssues": 3,
    "mediumIssues": 5,
    "lowIssues": 3,
    "infoIssues": 0,
    "fixesGenerated": 8,
    "fixesApplied": 0,
    "scanDuration": 1500,
    "cacheHits": 1,
    "aiCallsMade": 2,
    "createdAt": "2025-11-08T12:00:00.000Z"
}
```

### 3. Get Latest Scan Results
```http
GET /:projectId/scans/latest
```

**Path Parameters:**
- `projectId`: UUID of the project

**Example Response (200):**
```json
{
    "id": "scan-uuid",
    "projectId": "project-uuid",
    "metrics": {
        "accessibility": 85.5,
        "performance": 92.0,
        "seo": 78.5,
        "security": 88.0
    },
    "issues": [
        {
            "id": "issue-uuid",
            "fileId": "file-uuid",
            "category": "accessibility",
            "severity": "high",
            "title": "Missing alt text",
            "message": "Images must have alt text for screen readers",
            "line": 45,
            "column": 7,
            "code": "<img src=\"logo.png\" />",
            "rule": "img-alt"
        }
    ]
}
```

### 4. Apply Suggested Fixes
```http
POST /files/:fileId/fixes
```

**Path Parameters:**
- `fileId`: UUID of the file

**Request Body:**
```json
{
    "fixes": [
        {
            "id": "fix-uuid",
            "type": "accessibility",
            "action": "add-alt-text",
            "line": 45,
            "content": "<img src=\"logo.png\" alt=\"Company Logo\" />"
        }
    ]
}
```

**Example Response (200):**
```json
{
    "success": true,
    "improvement": {
        "accessibility": 10.5,
        "performance": 0,
        "seo": 5.0,
        "security": 0
    },
    "newIssueCount": 11,
    "metrics": {
        "accessibility": 96.0,
        "performance": 92.0,
        "seo": 83.5,
        "security": 88.0
    },
    "verificationResults": {
        "beforeFix": {
            "issues": 12,
            "metrics": {
                "accessibility": 85.5,
                "performance": 92.0,
                "seo": 78.5,
                "security": 88.0
            }
        },
        "afterFix": {
            "issues": 11,
            "metrics": {
                "accessibility": 96.0,
                "performance": 92.0,
                "seo": 83.5,
                "security": 88.0
            }
        },
        "improvements": {
            "issuesReduced": 1,
            "percentageImprovement": {
                "accessibility": "12.28",
                "performance": "0.00",
                "seo": "6.37",
                "security": "0.00"
            }
        }
    }
}
```

## Testing Steps for AI Features

1. Create a test project with multiple files:
   ```javascript
   // App.jsx
   function App() {
     return (
       <div>
         <img src="logo.png" /> // Missing alt
         <div style={{color: '#666'}}> // Poor contrast
           <button onclick="void(0)">Click</button> // Non-semantic handler
         </div>
       </div>
     )
   }
   ```

   ```css
   /* styles.css */
   .important {
     color: red !important; /* Avoid !important */
   }
   ```

2. Upload these files to a project:
   - Create multipart form request
   - Add files under 'files[]' key
   - Send to `POST /:projectId/files`

3. Check initial analysis:
   - Call `GET /:projectId/scans/latest`
   - Note the issues and metrics

4. Apply fixes:
   - For each file with issues:
     - Review suggested fixes
     - Apply selected fixes using `POST /files/:fileId/fixes`
     - Verify improvements in the response

5. Verify final state:
   - Call scan endpoint again
   - Compare before/after metrics
   - Check resolved issues

## Common Test Cases

1. Accessibility Issues:
   ```jsx
   // Test missing alt text
   <img src="logo.png" />
   
   // Test color contrast
   <div style={{color: '#666'}}>Text</div>
   
   // Test missing aria labels
   <button onClick={handler}></button>
   ```

2. Performance Issues:
   ```jsx
   // Test large inline styles
   <div style={{/* large object */}}></div>
   
   // Test unoptimized images
   <img src="large-image.jpg" />
   ```

3. Security Issues:
   ```jsx
   // Test unsafe links
   <a href="http://example.com" target="_blank">Link</a>
   
   // Test inline scripts
   <script>alert('test')</script>
   ```

4. SEO Issues:
   ```jsx
   // Test missing meta
   <div>Content without proper headings</div>
   
   // Test non-semantic markup
   <div role="button">Click me</div>
   ```

## Expected Results

After applying fixes, verify:

1. Accessibility improvements:
   - All images have alt text
   - Color contrast meets WCAG 2.2 AA
   - Proper ARIA attributes

2. Performance optimizations:
   - Removed unused styles
   - Optimized image loading
   - Reduced DOM depth

3. Security enhancements:
   - Added proper rel attributes
   - Removed inline scripts
   - Improved CSP compatibility

4. SEO optimizations:
   - Added meta tags
   - Proper heading structure
   - Semantic HTML usage

## Error Responses

### 1. File Limit Exceeded
```json
{
    "status": "fail",
    "error": "Maximum 200 files allowed per project"
}
```

### 2. Unsupported File Type
```json
{
    "status": "fail",
    "error": "File type not supported. Supported types: .html, .jsx, .tsx, .css, .scss"
}
```

### 3. Invalid Fix Request
```json
{
    "status": "fail",
    "error": "Invalid fix parameters provided"
}
```

### 4. Analysis Failed
```json
{
    "status": "error",
    "error": "Failed to analyze file content"
}
```