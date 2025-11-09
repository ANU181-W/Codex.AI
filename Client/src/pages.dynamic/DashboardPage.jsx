import { useEffect } from 'react'
import { useDynamicData } from '@/src/contexts/DynamicDataContext'
import StatsCard from '@/src/components/Dashboard/StatsCard'
import AnalyticsChart from '@/src/components/Dashboard/AnalyticsChart'
import RecentScansTable from '@/src/components/Dashboard/RecentScansTable'
import '@/src/styles/pages.css'

export default function DashboardPageDynamic() {
  const { scansApi, activeProject } = useDynamicData()
  const { scans, stats, loadList, loadLatest } = scansApi

  // Ensure we pull scans for the selected (auto-selected) project on mount
  useEffect(() => {
    if (activeProject) {
      loadList()
      loadLatest()
    }
  }, [activeProject, loadList, loadLatest])

  useEffect(() => { document.title = 'Dashboard - CodexAI (Dynamic)' }, [])

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <div className="page-header">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Live metrics from backend scans (API powered)</p>
        </div>

        <div className="stats-grid">
          <StatsCard title="Max Score" value={`${stats.maxScore || 0}%`} icon="📈" color="green" />
          <StatsCard title="Min Score" value={`${stats.minScore || 0}%`} icon="📉" color="orange" />
          <StatsCard title="Total Scans" value={scans.length} icon="📊" color="blue" />
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
