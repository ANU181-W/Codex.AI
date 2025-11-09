import { useEffect, useState } from "react"
import { useScan } from "../contexts/ScanContext"
import { useProject } from "../contexts/ProjectContext"
import { notify } from "../services/notify"
import StatsCard from "../components/Dashboard/StatsCard"
import AnalyticsChart from "../components/Dashboard/AnalyticsChart"
import RecentScansTable from "../components/Dashboard/RecentScansTable"
import ProjectSelect from "../components/Projects/ProjectSelect"
import "../styles/pages.css"

export default function DashboardPage() {
  const { scans, loadScans, loadLatest } = useScan()
  const { currentProject, projects } = useProject()
  const [stats, setStats] = useState({
    totalScans: 0,
    totalIssues: 0,
    avgScore: 0,
    maxScore: 0,
    minScore: 0,
    filesScanned: 0,
  })

  useEffect(() => {
    document.title = "Dashboard - CodexAI"

    // Fetch scans when project available
      if (currentProject?.id) {
        loadScans(currentProject.id, currentProject.name)
          .then(() => loadLatest(currentProject.id, currentProject.name))
        .catch(e => notify.error(e.message || 'Failed to refresh scans'))
    } else if (projects.length === 0) {
      notify.info('Create a project to begin scanning')
    }

    if (scans.length > 0) {
      const totalIssues = scans.reduce((acc, scan) => acc + (scan.issues?.length || 0), 0)
      const scores = scans.map(scan => scan.score || 0).filter(score => score > 0)
      
      let maxScore = 0
      let minScore = 100
      
      if (scores.length > 0) {
        maxScore = Math.max(...scores)
        minScore = Math.min(...scores)
        // If only one scan, show same value but indicate it's the only scan
        if (scores.length === 1) {
          minScore = maxScore // Same value for single scan
        }
      }
      
      const avgScore = scores.length > 0 
        ? Math.round(scores.reduce((acc, score) => acc + score, 0) / scores.length) 
        : 0

      setStats({
        totalScans: scans.length,
        totalIssues,
        avgScore,
        maxScore,
        minScore,
        filesScanned: scans.reduce((acc, scan) => acc + (scan.filesCount || 0), 0),
      })
    }
  }, [scans, currentProject, loadScans, loadLatest])

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <div className="page-header">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Overview of your code quality metrics</p>
          <div style={{ marginTop: 12 }}>
            <ProjectSelect compact />
          </div>
        </div>

        <div className="stats-grid">
          <StatsCard title="Max Score" value={`${stats.maxScore || 0}%`} icon="📈" color="green" />
          <StatsCard title="Min Score" value={`${stats.minScore || 0}%`} icon="📉" color="orange" />
          <StatsCard title="Total Scans" value={stats.totalScans} icon="📊" color="blue" />
          <StatsCard title="Total Issues" value={stats.totalIssues} icon="⚠️" color="red" />
        </div>

        <div className="charts-section">
          <AnalyticsChart scans={scans} />
        </div>

        <div className="recent-scans-section">
          <RecentScansTable scans={scans} />
        </div>
      </div>
    </div>
  )
}
