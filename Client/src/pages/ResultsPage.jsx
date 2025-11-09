import { useEffect, useRef } from "react"
import { useScan } from "../contexts/ScanContext"
import { useProject } from "../contexts/ProjectContext"
import { notify } from "../services/notify"
import IssueList from "../components/Results/IssueList"
import SuggestionsList from "../components/Results/SuggestionsList"
import BeforeAfterComparison from "../components/Results/BeforeAfterComparison"
import "../styles/pages.css"
import { useState, useMemo } from "react"
import { buildExportJSON, buildExportCSV, triggerDownload } from "../services/export.service"
import { computeQualityScore } from "../services/transformers"

export default function ResultsPage() {
  const { currentScan, issues, suggestions, loadLatest, setSuggestions } = useScan()
  const [exportFormat, setExportFormat] = useState('json')
  const { currentProject } = useProject()

  const requestedLatestRef = useRef(false)
  useEffect(() => {
    document.title = "Scan Results - CodexAI"
    // Avoid duplicate fetch spam on rapid project -> scan context hydration
    if (!currentScan && currentProject?.id && !requestedLatestRef.current) {
      requestedLatestRef.current = true
      loadLatest(currentProject.id).then(latest => {
        if (latest && latest.aiSuggestions && latest.aiSuggestions.length) {
          setSuggestions(latest.aiSuggestions)
        }
      }).catch(e => notify.error(e.message || 'Failed to load results'))
    }
  }, [currentScan, currentProject?.id, loadLatest])

  if (!currentScan) {
    return (
      <div className="results-page">
        <div className="no-results">
          <p>No scan results available. Please run a scan first.</p>
        </div>
      </div>
    )
  }

  // Fallback: if context issues not yet set, derive from currentScan
  const renderIssues = (Array.isArray(issues) && issues.length > 0)
    ? issues
    : (Array.isArray(currentScan.issues) ? currentScan.issues : [])

  const renderSuggestions = (Array.isArray(suggestions) && suggestions.length > 0)
    ? suggestions
    : (Array.isArray(currentScan.aiSuggestions) ? currentScan.aiSuggestions : [])

  const handleDownload = () => {
    try {
      if (exportFormat === 'json') {
        const payload = buildExportJSON(currentScan, renderIssues, renderSuggestions)
        triggerDownload(JSON.stringify(payload, null, 2), `scan-results.json`, 'application/json')
      } else {
        const csv = buildExportCSV(currentScan, renderIssues, renderSuggestions)
        triggerDownload(csv, `scan-results.csv`, 'text/csv')
      }
    } catch (e) {
      notify.error(e?.message || 'Failed to export results')
    }
  }

  const displayScore = computeQualityScore(renderIssues)

  return (
    <div className="results-page">
      <div className="results-container">
        <div className="results-header">
          <div>
            <h1 className="page-title">Scan Results</h1>
            <p className="page-subtitle">Analysis of your code files</p>
          </div>
          <div className="score-badge">
            <span className="score-label">Quality Score</span>
            <span
              className={`score-value ${displayScore >= 80 ? "excellent" : displayScore >= 60 ? "good" : "needs-improvement"}`}>
              {displayScore}%
            </span>
          </div>
        </div>

        <div className="export-controls">
          <label className="export-label">Download as:</label>
          <select className="export-select" value={exportFormat} onChange={(e) => setExportFormat(e.target.value)}>
            <option value="json">JSON (schema)</option>
            <option value="csv">CSV (issues)</option>
          </select>
          <button className="export-btn" onClick={handleDownload}>Download</button>
        </div>

        <div className="results-grid">
          <div className="issues-section">
            <IssueList issues={renderIssues} />
          </div>
          <div className="suggestions-section">
            <SuggestionsList issues={renderIssues} suggestionsOverride={renderSuggestions} />
          </div>
        </div>

        <div className="comparison-section">
          <BeforeAfterComparison issues={renderIssues} />
        </div>
      </div>
    </div>
  )
}
