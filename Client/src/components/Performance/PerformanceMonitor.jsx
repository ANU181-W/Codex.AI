import { useState, useEffect } from "react"
import { performanceService, memoryService, cacheService } from "../../services/cacheService"

export default function PerformanceMonitor() {
  const [isOpen, setIsOpen] = useState(false)
  const [metrics, setMetrics] = useState([])
  const [cacheStats, setCacheStats] = useState(null)
  const [memoryTrend, setMemoryTrend] = useState(null)

  useEffect(() => {
    const interval = setInterval(() => {
      const allMetrics = performanceService.getAllMetrics()
      setMetrics(allMetrics)

      const stats = cacheService.getStats()
      setCacheStats(stats)

      const trend = memoryService.getMemoryTrends()
      setMemoryTrend(trend)
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  if (!isOpen) {
    return (
      <button className="performance-toggle" onClick={() => setIsOpen(true)} title="Show performance metrics">
        ⚡
      </button>
    )
  }

  return (
    <div className="performance-monitor">
      <div className="monitor-header">
        <h4>Performance Monitor</h4>
        <button className="monitor-close" onClick={() => setIsOpen(false)}>
          ✕
        </button>
      </div>

      <div className="monitor-content">
        <div className="monitor-section">
          <h5>Cache Statistics</h5>
          {cacheStats && (
            <div className="stat-item">
              <span>Size:</span>
              <strong>{cacheStats.size} entries</strong>
            </div>
          )}
          {memoryTrend && (
            <div className="stat-item">
              <span>Trend:</span>
              <strong className={memoryTrend.isIncreasing ? "trending-up" : "trending-down"}>
                {memoryTrend.isIncreasing ? "↑" : "↓"}
              </strong>
            </div>
          )}
        </div>

        <div className="monitor-section">
          <h5>Top Metrics</h5>
          {metrics.slice(0, 5).map((metric) => (
            <div key={metric.label} className="metric-item">
              <span>{metric.label}</span>
              <div className="metric-bar">
                <div className="metric-fill" style={{ width: `${Math.min(100, (metric.avg / 100) * 100)}%` }}></div>
              </div>
              <span className="metric-value">{metric.avg}ms</span>
            </div>
          ))}
        </div>

        <div className="monitor-actions">
          <button
            className="btn-small"
            onClick={() => {
              performanceService.clearMetrics()
              cacheService.clear()
              setMetrics([])
              setCacheStats(null)
            }}
          >
            Clear All
          </button>
        </div>
      </div>
    </div>
  )
}
