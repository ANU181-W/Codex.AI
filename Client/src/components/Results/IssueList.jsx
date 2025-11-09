import { useState, useMemo } from "react"
import { issueValidationService } from "../../services/issueValidation"

export default function IssueList({ issues }) {
  const [expandedId, setExpandedId] = useState(null)
  const [filterSeverity, setFilterSeverity] = useState(null)
  const [sortBy, setSortBy] = useState("severity")

  // Apply filtering & sorting dynamically
  const processed = useMemo(() => {
    // Filter by severity if selected
    const severityFiltered = filterSeverity
      ? issueValidationService.filterBySeverity(issues, filterSeverity)
      : issues

    // Group after filtering
    let grouped = issueValidationService.groupByCategory(severityFiltered)

    // Sorting inside each category
    const severityWeight = { critical: 4, high: 3, medium: 2, low: 1 }
    Object.keys(grouped).forEach((cat) => {
      grouped[cat].issues.sort((a, b) => {
        if (sortBy === "severity") {
          return severityWeight[b.severity] - severityWeight[a.severity]
        }
        if (sortBy === "title") {
          return a.title.localeCompare(b.title)
        }
        // default keeps original priority order via prioritizeIssues if needed
        return 0
      })
    })

    // Optional category ordering
    let orderedCategoryKeys = Object.keys(grouped)
    if (sortBy === "category") {
      orderedCategoryKeys = orderedCategoryKeys.sort((a, b) => grouped[a].name.localeCompare(grouped[b].name))
    }

    const prioritizedFlat = issueValidationService.prioritizeIssues(severityFiltered)

    return {
      grouped,
      orderedCategoryKeys,
      filtered: severityFiltered,
      prioritized: prioritizedFlat,
    }
  }, [issues, filterSeverity, sortBy])

  // Stats should reflect the filtered set
  const stats = useMemo(() => issueValidationService.calculateIssueStats(processed.filtered), [processed])

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "critical":
        return "red"
      case "high":
        return "orange"
      case "medium":
        return "yellow"
      case "low":
        return "blue"
      default:
        return "gray"
    }
  }

  const categoryIcons = {
    accessibility: "♿",
    security: "🔐",
    performance: "⚡",
    seo: "🔍",
    structure: "📐",
    i18n: "🌍",
    design: "🎨",
    design_system: "🎨",
    "best-practices": "✅",
    structural: "📐",
  }

  const asFileLabel = (file) => {
    if (!file) return ""
    if (typeof file === 'string') return file
    if (typeof file === 'object') return file.filename || ""
    return String(file)
  }

  // Always render controls; show empty message below when no matches after filtering
  return (
    <div className="issue-list">
      <h3>Detected Issues ({processed.filtered.length})</h3>

      <div className="issue-stats-bar">
        <div className="stats-item">
          <span className="stat-icon critical">⚠️</span>
          <span className="stat-text">Critical: {stats.bySeverity.critical}</span>
        </div>
        <div className="stats-item">
          <span className="stat-icon high">🔴</span>
          <span className="stat-text">High: {stats.bySeverity.high}</span>
        </div>
        <div className="stats-item">
          <span className="stat-icon medium">🟡</span>
          <span className="stat-text">Medium: {stats.bySeverity.medium}</span>
        </div>
        <div className="stats-item">
          <span className="stat-icon low">🔵</span>
          <span className="stat-text">Low: {stats.bySeverity.low}</span>
        </div>
      </div>

      <div className="issue-controls">
        <div className="filter-group">
          <label>Filter by Severity:</label>
          <select value={filterSeverity || ""} onChange={(e) => setFilterSeverity(e.target.value || null)}>
            <option value="">All Severities</option>
            <option value="critical">Critical & Higher</option>
            <option value="high">High & Higher</option>
            <option value="medium">Medium & Higher</option>
            <option value="low">Low</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Sort by:</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="severity">Severity</option>
            <option value="category">Category</option>
            <option value="title">Title</option>
          </select>
        </div>
      </div>

      {/* Issue categories OR empty state */}
      {processed.filtered.length === 0 ? (
        <div className="issue-empty-state">
          {issues.length === 0 ? (
            <p>🎉 No issues detected! Your code looks great.</p>
          ) : (
            <p>No issues match the current filters.</p>
          )}
        </div>
      ) : (
        processed.orderedCategoryKeys.map((category) => {
          const categoryData = processed.grouped[category]
          return (
            <div key={category} className="issue-category">
              <h4>
                <span className="category-icon">{categoryIcons[category]}</span>
                {categoryData.name}
                <span className="category-count">
                  {categoryData.count} • Critical: {categoryData.critical} • High: {categoryData.high}
                </span>
              </h4>

              {categoryData.issues.map((issue, idx) => (
                <div key={idx} className="issue-item">
                  <div
                    className="issue-header"
                    onClick={() => setExpandedId(expandedId === `${category}-${idx}` ? null : `${category}-${idx}`)}
                  >
                    <div className="issue-left">
                      <span className={`severity-badge severity-${getSeverityColor(issue.severity)}`}>
                        {issue.severity?.toUpperCase()}
                      </span>
                      <span className="issue-title">{issue.title}</span>
                      <span className="issue-file">{asFileLabel(issue.file)}</span>
                    </div>
                    <span className="expand-icon">{expandedId === `${category}-${idx}` ? "▼" : "▶"}</span>
                  </div>

                  {expandedId === `${category}-${idx}` && (
                    <div className="issue-details">
                      <p className="issue-description">{issue.description}</p>
                      {issue.rationale && (
                        <div className="issue-rationale">
                          <strong>Why it matters:</strong> {issue.rationale}
                        </div>
                      )}
                      <div className="issue-code">
                        <pre>{issue.code}</pre>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        })
      )}
    </div>
  )
}
