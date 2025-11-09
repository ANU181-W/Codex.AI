import { useEffect } from "react"
import { useScan } from "../contexts/ScanContext"
import { useProject } from "../contexts/ProjectContext"
import IssueList from "../components/Results/IssueList"
import SuggestionsList from "../components/Results/SuggestionsList"
import BeforeAfterComparison from "../components/Results/BeforeAfterComparison"
import "../styles/pages.css"

export default function ResultsPage() {
  const { currentScan, issues, loadLatest } = useScan()
  const { currentProject } = useProject()

  useEffect(() => {
    document.title = "Scan Results - CodexAI"
    if (!currentScan && currentProject?.id) {
      loadLatest(currentProject.id).catch(() => {})
    }
  }, [currentScan, currentProject, loadLatest])

  if (!currentScan) {
    return (
      <div className="results-page">
        <div className="no-results">
          <p>No scan results available. Please run a scan first.</p>
        </div>
      </div>
    )
  }

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
              className={`score-value ${currentScan.score >= 80 ? "excellent" : currentScan.score >= 60 ? "good" : "needs-improvement"}`}
            >
              {currentScan.score}%
            </span>
          </div>
        </div>

        <div className="results-grid">
          <div className="issues-section">
            <IssueList issues={issues} />
          </div>
          <div className="suggestions-section">
            <SuggestionsList issues={issues} />
          </div>
        </div>

        <div className="comparison-section">
          <BeforeAfterComparison issues={issues} />
        </div>
      </div>
    </div>
  )
}
