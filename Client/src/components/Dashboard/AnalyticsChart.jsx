import { useMemo } from "react"
import {
  Line,
  BarChart,
  Bar,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
} from "recharts"

export default function AnalyticsChart({ scans }) {
  const chartData = useMemo(() => {
    return scans.slice(-10).map((scan, idx) => ({
      name: `Scan ${idx + 1}`,
      score: scan.score || 0,
      issues: scan.issues?.length || 0,
      time: new Date(scan.timestamp).getHours(),
      timestamp: new Date(scan.timestamp).toLocaleDateString(),
    }))
  }, [scans])

  const issueDistribution = useMemo(() => {
    const distribution = {
      accessibility: 0,
      security: 0,
      performance: 0,
      seo: 0,
      structure: 0,
    }

    scans.forEach((scan) => {
      scan.issues?.forEach((issue) => {
        distribution[issue.category] = (distribution[issue.category] || 0) + 1
      })
    })

    return Object.entries(distribution)
      .map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
      }))
      .filter((d) => d.value > 0)
  }, [scans])

  const severityDistribution = useMemo(() => {
    const severity = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    }

    scans.forEach((scan) => {
      scan.issues?.forEach((issue) => {
        severity[issue.severity] = (severity[issue.severity] || 0) + 1
      })
    })

    return Object.entries(severity)
      .map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
      }))
      .filter((d) => d.value > 0)
  }, [scans])

  const trendData = useMemo(() => {
    const data = scans.slice(-10).map((scan) => ({
      score: scan.score || 0,
    }))

    // Calculate 3-point moving average
    return data.map((d, idx) => ({
      ...d,
      trend:
        idx === 0
          ? d.score
          : idx === 1
            ? (data[0].score + d.score) / 2
            : (data[idx - 2].score + data[idx - 1].score + d.score) / 3,
    }))
  }, [scans])

  const COLORS = ["#3b82f6", "#ef4444", "#f59e0b", "#10b981", "#8b5cf6"]
  const SEVERITY_COLORS = ["#dc2626", "#ea580c", "#eab308", "#6366f1"]

  const stats = useMemo(() => {
    if (scans.length === 0) return { maxScore: 0, minScore: 0, avgScore: 0, trend: "neutral" }

    const scores = scans.map((s) => s.score || 0)
    const maxScore = Math.max(...scores)
    const minScore = Math.min(...scores)
    const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)

    // Determine trend based on last 3 scans
    const recentScores = scores.slice(-3)
    const trend =
      recentScores[2] > recentScores[1] && recentScores[1] > recentScores[0]
        ? "up"
        : recentScores[2] < recentScores[1] && recentScores[1] < recentScores[0]
          ? "down"
          : "neutral"

    return { maxScore, minScore, avgScore, trend }
  }, [scans])

  if (scans.length === 0) {
    return (
      <div className="analytics-charts">
        <div className="chart-container chart-container-large">
          <div className="chart-header">
            <h3>Analytics</h3>
          </div>
          <div className="table-empty-state">
            <p>No scan data available. Run your first scan to see analytics here.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="analytics-charts">
      {/* Quality Score Trend - Primary Chart */}
      <div className="chart-container chart-container-large">
        <div className="chart-header">
          <h3>Quality Score Trend</h3>
          <div className="chart-stats">
            <span className="stat-badge">Avg: {stats.avgScore}%</span>
            <span className={`stat-badge trend-${stats.trend}`}>
              {stats.trend === "up" ? "📈" : stats.trend === "down" ? "📉" : "➡️"} {stats.trend.toUpperCase()}
            </span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" />
            <YAxis stroke="rgba(255,255,255,0.5)" domain={[0, 100]} />
            <Tooltip contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", border: "1px solid rgba(255,255,255,0.1)" }} />
            <Legend />
            <Area type="monotone" dataKey="score" fill="rgba(59,130,246,0.1)" stroke="#3b82f6" strokeWidth={2} />
            <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={3} dot={{ fill: "#3b82f6", r: 4 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Issues Per Scan */}
      <div className="chart-container">
        <h3>Issues Per Scan</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" />
            <YAxis stroke="rgba(255,255,255,0.5)" />
            <Tooltip contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", border: "1px solid rgba(255,255,255,0.1)" }} />
            <Legend />
            <Bar dataKey="issues" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Issue Category Distribution */}
      {issueDistribution.length > 0 && (
        <div className="chart-container">
          <h3>Issue Distribution by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={issueDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {issueDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", border: "1px solid rgba(255,255,255,0.1)" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Severity Distribution */}
      {severityDistribution.length > 0 && (
        <div className="chart-container">
          <h3>Issues by Severity</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={severityDistribution} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis type="number" stroke="rgba(255,255,255,0.5)" />
              <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.5)" width={80} />
              <Tooltip
                contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", border: "1px solid rgba(255,255,255,0.1)" }}
              />
              <Bar dataKey="value" fill="#f59e0b" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Analytics Summary Cards */}
      <div className="analytics-summary">
        <div className="summary-card">
          <div className="summary-label">Max Score</div>
          <div className="summary-value">{stats.maxScore}%</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Min Score</div>
          <div className="summary-value">{stats.minScore}%</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Total Scans</div>
          <div className="summary-value">{scans.length}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Total Issues</div>
          <div className="summary-value">{scans.reduce((acc, s) => acc + (s.issues?.length || 0), 0)}</div>
        </div>
      </div>
    </div>
  )
}
