export const issueValidationService = {
  // Validate detected issues for accuracy and eliminate duplicates
  validateAndDeduplicateIssues: (issues) => {
    const seen = new Set()
    const validated = []

    issues.forEach((issue) => {
      // Create unique key for deduplication
      const key = `${issue.category}:${issue.title}:${issue.file}`

      if (!seen.has(key)) {
        // Validate issue structure
        if (validateIssueStructure(issue)) {
          validated.push({
            ...issue,
            id: generateIssueId(),
            timestamp: new Date().toISOString(),
            validated: true,
          })
          seen.add(key)
        }
      }
    })

    return validated
  },

  // Filter issues by severity level
  filterBySeverity: (issues, severityLevel) => {
    const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
    return issues.filter((issue) => severityOrder[issue.severity] >= severityOrder[severityLevel])
  },

  // Group issues by category for better organization
  groupByCategory: (issues) => {
    return issues.reduce((acc, issue) => {
      const category = issue.category || "other"
      if (!acc[category]) {
        acc[category] = {
          name: category.charAt(0).toUpperCase() + category.slice(1),
          count: 0,
          issues: [],
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
        }
      }
      acc[category].issues.push(issue)
      acc[category].count++
      acc[category][issue.severity]++
      return acc
    }, {})
  },

  // Calculate issue statistics and insights
  calculateIssueStats: (issues) => {
    const stats = {
      total: issues.length,
      bySeverity: { critical: 0, high: 0, medium: 0, low: 0 },
      byCategory: {},
      estimatedFixTime: 0,
      riskScore: 0,
    }

    issues.forEach((issue) => {
      stats.bySeverity[issue.severity]++

      const category = issue.category || "other"
      if (!stats.byCategory[category]) {
        stats.byCategory[category] = 0
      }
      stats.byCategory[category]++

      // Estimate fix time based on severity (in minutes)
      const timeMap = { critical: 30, high: 20, medium: 10, low: 5 }
      stats.estimatedFixTime += timeMap[issue.severity] || 5
    })

    // Calculate risk score (0-100)
    stats.riskScore = Math.min(
      100,
      (stats.bySeverity.critical * 25 + stats.bySeverity.high * 15 + stats.bySeverity.medium * 5) /
        Math.max(1, issues.length),
    )

    return stats
  },

  // Validate that issues meet quality standards
  validateIssueQuality: (issue) => {
    const errors = []

    if (!issue.title || issue.title.length === 0) {
      errors.push("Issue title is required")
    }

    if (
      !issue.category ||
      !["accessibility", "security", "performance", "seo", "structure", "i18n"].includes(issue.category)
    ) {
      errors.push("Issue category is invalid")
    }

    if (!issue.severity || !["critical", "high", "medium", "low"].includes(issue.severity)) {
      errors.push("Issue severity is invalid")
    }

    if (!issue.description || issue.description.length === 0) {
      errors.push("Issue description is required")
    }

    if (!issue.file) {
      errors.push("Issue file reference is required")
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  },

  // Find similar issues to prevent redundant detections
  findSimilarIssues: (issue, allIssues, threshold = 0.8) => {
    return allIssues.filter((other) => {
      if (other === issue) return false

      const categoryMatch = issue.category === other.category ? 1 : 0
      const severityMatch = issue.severity === other.severity ? 1 : 0
      const titleSimilarity = calculateStringSimilarity(issue.title, other.title)

      const overallSimilarity = (categoryMatch + severityMatch + titleSimilarity) / 3
      return overallSimilarity >= threshold
    })
  },

  // Prioritize issues for fixing
  prioritizeIssues: (issues) => {
    const priorityMap = {
      critical: 1,
      high: 2,
      medium: 3,
      low: 4,
    }

    return [...issues].sort((a, b) => {
      const priorityDiff = priorityMap[a.severity] - priorityMap[b.severity]
      if (priorityDiff !== 0) return priorityDiff

      // Secondary sort by category importance
      const categoryPriority = { security: 1, accessibility: 2, performance: 3, seo: 4, structure: 5, i18n: 6 }
      return (categoryPriority[a.category] || 7) - (categoryPriority[b.category] || 7)
    })
  },

  // Track issue trends over time
  calculateIssueTrends: (scanHistory) => {
    if (scanHistory.length < 2) return null

    const trends = {}
    scanHistory.forEach((scan) => {
      scan.issues?.forEach((issue) => {
        if (!trends[issue.category]) {
          trends[issue.category] = []
        }
        trends[issue.category].push(scan.timestamp)
      })
    })

    return Object.entries(trends).map(([category, timestamps]) => ({
      category,
      count: timestamps.length,
      trend: calculateTrendDirection(timestamps),
    }))
  },
}

// Helper functions
function generateIssueId() {
  return `issue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

function validateIssueStructure(issue) {
  return (
    typeof issue === "object" &&
    issue !== null &&
    typeof issue.title === "string" &&
    typeof issue.description === "string" &&
    typeof issue.category === "string" &&
    typeof issue.severity === "string"
  )
}

function calculateStringSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2
  const shorter = str1.length > str2.length ? str2 : str1

  if (longer.length === 0) return 1.0

  const editDistance = getEditDistance(longer, shorter)
  return (longer.length - editDistance) / longer.length
}

function getEditDistance(s1, s2) {
  const costs = []
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j
      } else if (j > 0) {
        let newValue = costs[j - 1]
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1
        }
        costs[j - 1] = lastValue
        lastValue = newValue
      }
    }
    if (i > 0) costs[s2.length] = lastValue
  }
  return costs[s2.length]
}

function calculateTrendDirection(timestamps) {
  if (timestamps.length < 2) return "stable"

  const recentThreshold = 7 * 24 * 60 * 60 * 1000 // 7 days
  const now = Date.now()
  const recent = timestamps.filter((t) => now - new Date(t).getTime() < recentThreshold)
  const older = timestamps.filter((t) => now - new Date(t).getTime() >= recentThreshold)

  if (recent.length > older.length * 1.2) return "increasing"
  if (older.length > recent.length * 1.2) return "decreasing"
  return "stable"
}

export default issueValidationService
