import { useState } from "react"
import { useProject } from "../../contexts/ProjectContext"
import "../../styles/projects.css"

export default function ScanHistory() {
  const { currentProject, history } = useProject()
  const [filterSeverity, setFilterSeverity] = useState(null)

  const scanHistory = currentProject ? currentProject.scans : history
  const filtered = filterSeverity
    ? scanHistory.filter((s) => {
        const issues = s.issues || []
        return issues.some((i) => i.severity === filterSeverity)
      })
    : scanHistory

  return (
    <div className="scan-history">
      <div className="history-header">
        <h3>Scan History</h3>
        <div className="filter-controls">
          <select value={filterSeverity || ""} onChange={(e) => setFilterSeverity(e.target.value || null)}>
            <option value="">All Issues</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      <div className="history-list">
        {filtered.length === 0 ? (
          <p className="empty-state">No scan history yet.</p>
        ) : (
          filtered.map((scan, idx) => (
            <div key={idx} className="history-item">
              <div className="history-left">
                <div className="history-date">
                  {new Date(scan.timestamp || scan.addedAt).toLocaleDateString()}{" "}
                  {new Date(scan.timestamp || scan.addedAt).toLocaleTimeString()}
                </div>
                <div className="history-info">
                  <span className="scan-files">{scan.filesCount} files</span>
                  <span className="scan-issues">{scan.issues?.length || 0} issues</span>
                </div>
              </div>
              <div
                className={`history-score score-${scan.score >= 80 ? "excellent" : scan.score >= 60 ? "good" : "warning"}`}
              >
                {scan.score}%
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
