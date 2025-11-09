import { useNavigate } from "react-router-dom"
import { Folder, AlertCircle, CheckCircle2, Clock, TrendingUp } from "lucide-react"

export default function RecentScansTable({ scans }) {
  const navigate = useNavigate()

  const formatDate = (date) => {
    if (!date) return "N/A"
    const d = new Date(date)
    return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const getScoreColor = (score) => {
    if (score >= 90) return "excellent"
    if (score >= 80) return "good"
    if (score >= 60) return "warning"
    return "poor"
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 size={16} className="status-icon completed" />
      case "scanning":
        return <Clock size={16} className="status-icon scanning" />
      default:
        return <Clock size={16} className="status-icon" />
    }
  }

  if (scans.length === 0) {
    return (
      <div className="recent-scans-table-modern">
        <div className="table-header-modern">
          <h3 className="table-title-modern">Recent Scans</h3>
        </div>
        <div className="table-empty-state">
          <p>No scans yet. Start your first scan to see results here.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="recent-scans-table-modern">
      <div className="table-header-modern">
        <h3 className="table-title-modern">Recent Scans</h3>
        <span className="table-count">{scans.length} scan{scans.length !== 1 ? 's' : ''}</span>
      </div>
      
      <div className="table-container-modern">
        <table className="scans-table-modern">
          <thead>
            <tr>
              <th className="col-project">
                <Folder size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                Project
              </th>
              <th className="col-files">Files</th>
              <th className="col-issues">
                <AlertCircle size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                Issues
              </th>
              <th className="col-score">
                <TrendingUp size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                Score
              </th>
              <th className="col-date">Date</th>
              <th className="col-status">Status</th>
            </tr>
          </thead>
          <tbody>
            {scans.slice(0, 10).map((scan, index) => (
              <tr 
                key={scan.id || index} 
                className="table-row-modern"
                onClick={() => navigate("/results")}
              >
                <td className="col-project">
                  <div className="project-cell">
                    <Folder size={14} className="project-icon" />
                    <div className="project-info">
                      <span className="project-name">{scan.projectName || "New Project"}</span>
                      {scan.fileNames && scan.fileNames.length > 0 && (
                        <span className="project-files-hint">{scan.fileNames.length} file{scan.fileNames.length !== 1 ? 's' : ''}</span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="col-files">
                  <div className="files-cell">
                    <span className="files-count">{scan.filesCount || 0}</span>
                    {scan.fileNames && scan.fileNames.length > 0 && (
                      <div className="files-tooltip">
                        {scan.fileNames.slice(0, 3).map((name, idx) => (
                          <span key={idx} className="file-name-tag">{name}</span>
                        ))}
                        {scan.fileNames.length > 3 && (
                          <span className="file-name-tag">+{scan.fileNames.length - 3} more</span>
                        )}
                      </div>
                    )}
                  </div>
                </td>
                <td className="col-issues">
                  <span className={`issue-badge-modern ${(scan.issues?.length || 0) > 0 ? 'has-issues' : 'no-issues'}`}>
                    {scan.issues?.length || 0}
                  </span>
                </td>
                <td className="col-score">
                  <span className={`score-badge-modern score-${getScoreColor(scan.score || 0)}`}>
                    {scan.score || 0}%
                  </span>
                </td>
                <td className="col-date">
                  <span className="date-text">{formatDate(scan.timestamp || scan.date)}</span>
                </td>
                <td className="col-status">
                  <div className="status-cell">
                    {getStatusIcon(scan.status || "completed")}
                    <span className={`status-badge-modern status-${scan.status || "completed"}`}>
                      {scan.status || "completed"}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
