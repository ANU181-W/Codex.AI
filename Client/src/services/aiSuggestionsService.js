export const aiSuggestionsService = {
  // Generate AI suggestions for detected issues
  generateSuggestions: (issues) => {
    if (!issues || issues.length === 0) {
      return []
    }
    
    return issues.map((issue, idx) => {
      const originalCode = issue.code || issue.codeContext || "Code snippet not available"
      const suggestedCode = generateFix(issue)
      
      return {
        id: idx,
        issueId: issue.id || idx,
        original: originalCode,
        suggested: suggestedCode,
        rationale: issue.rationale || getDefaultRationale(issue.category),
        category: issue.category,
        severity: issue.severity,
        confidence: calculateConfidence(issue),
        explanation: generateExplanation(issue),
        copyableCode: true,
        file: issue.file,
        line: issue.line,
        title: issue.title,
        description: issue.description,
      }
    })
  },

  // Generate detailed fix explanation
  generateFixExplanation: (issue) => {
    const explanations = {
      accessibility: `This fix improves accessibility by ensuring screen readers and assistive technologies can properly interpret your code. It follows WCAG 2.1 guidelines to make your application more inclusive.`,
      security: `This fix addresses a security vulnerability that could expose your application to attacks. Implementing this change helps protect user data and prevents potential exploits.`,
      performance: `This fix optimizes your code's performance by reducing render cycles and improving load times. It follows best practices for modern web applications.`,
      seo: `This fix improves your page's search engine optimization, making it more discoverable and improving rankings in search results.`,
      structure: `This fix improves code structure and maintainability, making your codebase easier to understand and modify in the future.`,
      i18n: `This fix enables internationalization support, allowing your application to serve users in different languages and regions.`,
    }
    return explanations[issue.category] || "This fix improves code quality and best practices."
  },

  // Estimate time to fix
  estimateFixTime: (issue) => {
    const timeMap = {
      critical: { min: 15, max: 45 },
      high: { min: 10, max: 30 },
      medium: { min: 5, max: 15 },
      low: { min: 2, max: 8 },
    }
    return timeMap[issue.severity] || { min: 5, max: 15 }
  },

  // Calculate fix impact score
  calculateFixImpact: (issue) => {
    const impactMap = {
      critical: 95,
      high: 80,
      medium: 60,
      low: 30,
    }
    return impactMap[issue.severity] || 50
  },

  // Generate before/after preview
  generatePreview: (issue, suggestion) => {
    return {
      before: {
        code: issue.code || "",
        issues: [issue],
        score: 65,
      },
      after: {
        code: suggestion.suggested || "",
        issues: [],
        score: 87,
      },
      improvement: 22,
    }
  },

  // Group suggestions by category
  groupSuggestionsByCategory: (suggestions) => {
    return suggestions.reduce((acc, suggestion) => {
      const category = suggestion.category || "other"
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(suggestion)
      return acc
    }, {})
  },

  // Prioritize suggestions for fixing
  prioritizeSuggestions: (suggestions) => {
    const priorityMap = {
      critical: 1,
      high: 2,
      medium: 3,
      low: 4,
    }

    return [...suggestions].sort((a, b) => {
      const priorityDiff = priorityMap[a.severity] - priorityMap[b.severity]
      if (priorityDiff !== 0) return priorityDiff
      return b.confidence - a.confidence
    })
  },

  // Calculate batch fix impact
  calculateBatchImpact: (suggestions) => {
    const totalImpact = suggestions.reduce((sum, s) => sum + aiSuggestionsService.calculateFixImpact(s.issue), 0)
    const estimatedTime = suggestions.reduce((sum, s) => {
      const time = aiSuggestionsService.estimateFixTime(s.issue)
      return sum + (time.min + time.max) / 2
    }, 0)

    return {
      totalImpact: Math.round(totalImpact / suggestions.length),
      estimatedTime: Math.round(estimatedTime),
      suggestionCount: suggestions.length,
    }
  },

  // Generate implementation guide
  generateImplementationGuide: (suggestion) => {
    return `
Step 1: Understand the Issue
${suggestion.explanation || "Review the issue description and understand why this change is needed."}

Step 2: Review the Fix
Compare the original code with the suggested fix to understand the changes.

Step 3: Apply the Fix
Copy the suggested code and replace the original implementation.

Step 4: Test
Verify that the fix works correctly and doesn't break existing functionality.

Step 5: Commit
Save your changes and commit to your version control system.
    `.trim()
  },
}

// Helper functions
function generateFix(issue) {
  const fixStrategies = {
    accessibility: generateAccessibilityFix,
    security: generateSecurityFix,
    performance: generatePerformanceFix,
    seo: generateSeoFix,
    structure: generateStructureFix,
  }

  const generator = fixStrategies[issue.category] || generateGenericFix
  return generator(issue)
}

function generateAccessibilityFix(issue) {
  if (issue.title.includes("alt")) {
    if (issue.code) {
      return issue.code.replace(/>/, ' alt="Descriptive text for image" />')
    }
    return issue.suggestion || '<img src="..." alt="Descriptive text for image" />'
  }
  if (issue.title.includes("button")) {
    if (issue.code) {
      return issue.code.replace('</button>', 'aria-label="Action description">Button Label</button>')
        .replace('><', '>Button Label<')
    }
    return issue.suggestion || '<button aria-label="Action description">Button Label</button>'
  }
  if (issue.title.includes("lang")) {
    if (issue.code) {
      return issue.code.replace(/>/, ' lang="en">')
    }
    return issue.suggestion || '<html lang="en">'
  }
  return issue.suggestion || issue.code || "Apply accessibility improvements"
}

function generateSecurityFix(issue) {
  if (issue.title.includes("target")) {
    if (issue.code) {
      return issue.code.replace(/>/, ' rel="noopener noreferrer">')
    }
    return issue.suggestion || '<a href="..." target="_blank" rel="noopener noreferrer">Link</a>'
  }
  if (issue.title.includes("inline script")) {
    return issue.suggestion || "// Move script to external file\n// <script src='external.js'></script>"
  }
  return issue.suggestion || issue.code || "Apply security improvements"
}

function generatePerformanceFix(issue) {
  if (issue.title.includes("lazy loading")) {
    return issue.code?.replace("/>", ' loading="lazy" />') || 'loading="lazy"'
  }
  if (issue.title.includes("image")) {
    return "<!-- Optimize image: compress, use modern format like WebP -->"
  }
  return issue.suggestion || "Apply performance optimizations"
}

function generateSeoFix(issue) {
  if (issue.title.includes("title")) {
    return "<title>Page Title - Website Name</title>"
  }
  if (issue.title.includes("description")) {
    return '<meta name="description" content="Clear page description" />'
  }
  if (issue.title.includes("h1")) {
    return "<h1>Main Page Heading</h1>"
  }
  return issue.suggestion || "Apply SEO improvements"
}

function generateStructureFix(issue) {
  if (issue.title.includes("nesting")) {
    return "<!-- Refactor to reduce nesting depth -->"
  }
  if (issue.title.includes("duplicate")) {
    return "<!-- Use unique IDs or replace with classes -->"
  }
  if (issue.title.includes("console") || issue.code?.includes("consoole") || issue.code?.includes("consol")) {
    // Fix console typos
    if (issue.code) {
      return issue.code.replace(/consoole|consol|consloe/gi, 'console')
    }
    return issue.suggestion || "console.log('hello');"
  }
  if (issue.title.includes("getelementByUserName") || issue.title.includes("getelementbyusername")) {
    // Fix invalid document method
    if (issue.code) {
      // Try to extract the selector and suggest proper method
      const selectorMatch = issue.code.match(/getelementByUserName\s*\(\s*['"]([^'"]+)['"]\s*\)/i)
      if (selectorMatch) {
        return `document.getElementById('${selectorMatch[1]}')`
      }
      return issue.code.replace(/getelementByUserName|getelementbyusername/gi, 'getElementById')
    }
    return issue.suggestion || "document.getElementById('elementId')"
  }
  if (issue.title.includes("getelementbyid")) {
    if (issue.code) {
      return issue.code.replace(/getelementbyid/gi, 'getElementById')
    }
    return issue.suggestion || "document.getElementById('elementId')"
  }
  if (issue.title.includes("Unclosed")) {
    return issue.suggestion || "Check for matching brackets/parentheses"
  }
  return issue.suggestion || issue.code || "Improve code structure"
}

function generateGenericFix(issue) {
  return issue.suggestion || "Apply recommended fix"
}

function calculateConfidence(issue) {
  const severityConfidence = {
    critical: 0.95,
    high: 0.85,
    medium: 0.75,
    low: 0.65,
  }
  // Add variance based on category clarity
  const baseConfidence = severityConfidence[issue.severity] || 0.7
  return Math.min(1, baseConfidence + 0.1)
}

function getDefaultRationale(category) {
  const rationales = {
    accessibility: "Improves accessibility and user experience for all users",
    security: "Prevents security vulnerabilities and protects user data",
    performance: "Enhances application speed and responsiveness",
    seo: "Improves search engine visibility and rankings",
    structure: "Enhances code maintainability and readability",
    i18n: "Enables multi-language support for global audiences",
  }
  return rationales[category] || "Improves code quality and best practices"
}

function generateExplanation(issue) {
  return aiSuggestionsService.generateFixExplanation(issue)
}

export default aiSuggestionsService
