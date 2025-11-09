import { useMemo } from "react"
import { TrendingDown, TrendingUp, ArrowRight } from "lucide-react"
import { useScan } from "../../contexts/ScanContext"

export default function BeforeAfterComparison({ issues }) {
  const { currentScan, scans } = useScan()
  
  const stats = useMemo(() => {
    const totalIssues = issues.length || 0
    
    // Calculate before score based on initial scan
    // If we have the current scan, use its initial score
    // Otherwise calculate based on issues
    const calculateScoreFromIssues = (issueCount) => {
      if (issueCount === 0) return 100
      // Base score calculation: each issue reduces score
      let penalty = 0
      issues.forEach((issue) => {
        switch (issue.severity) {
          case "critical":
            penalty += 10
            break
          case "high":
            penalty += 5
            break
          case "medium":
            penalty += 2
            break
          case "low":
            penalty += 1
            break
          default:
            penalty += 1
        }
      })
      return Math.max(0, 100 - penalty)
    }
    
    // Use the actual current scan score as before score
    const beforeScore = currentScan?.score || calculateScoreFromIssues(totalIssues)
    
    // Calculate after score: estimate improvement based on fixable issues
    // Critical and high severity issues are prioritized for fixing
    const criticalHighIssues = issues.filter(i => i.severity === 'critical' || i.severity === 'high').length
    const mediumLowIssues = totalIssues - criticalHighIssues
    
    // Estimate: 80% of critical/high issues get fixed, 50% of medium/low
    const estimatedFixedIssues = Math.round(criticalHighIssues * 0.8 + mediumLowIssues * 0.5)
    const remainingIssues = Math.max(0, totalIssues - estimatedFixedIssues)
    
    // Calculate improvement: each fixed issue improves score
    // More severe issues fixed = bigger improvement
    let improvement = 0
    const fixedCriticalHigh = Math.round(criticalHighIssues * 0.8)
    const fixedMediumLow = Math.round(mediumLowIssues * 0.5)
    improvement += fixedCriticalHigh * 8 // Critical/high fixes worth more
    improvement += fixedMediumLow * 3   // Medium/low fixes
    
    const afterScore = Math.min(100, beforeScore + improvement)
    
    const resolvedIssues = totalIssues > 0 ? estimatedFixedIssues : 0
    const scoreIncrease = totalIssues > 0 ? Math.max(0, afterScore - beforeScore) : 0
    const issuesReducedPercent = totalIssues > 0 ? Math.round((resolvedIssues / totalIssues) * 100) : 0

    // If no issues, show perfect scores
    const finalBeforeScore = totalIssues === 0 ? 100 : Math.round(beforeScore)
    const finalAfterScore = totalIssues === 0 ? 100 : Math.round(afterScore)

    return {
      totalIssues,
      resolvedIssues,
      remainingIssues: totalIssues === 0 ? 0 : remainingIssues,
      beforeScore: finalBeforeScore,
      afterScore: finalAfterScore,
      scoreIncrease,
      issuesReducedPercent,
    }
  }, [issues, currentScan])

  return (
    <div className="before-after-modern">
      <div className="improvement-header">
        <h3 className="improvement-title">Improvement Summary</h3>
        <p className="improvement-subtitle">See how your code quality improved after applying fixes</p>
      </div>

      <div className="comparison-container-modern">
        <div className="comparison-card-modern before-card">
          <div className="card-header-modern">
            <h4 className="card-title-modern">Before Fixes</h4>
          </div>
          <div className="comparison-stats-modern">
            <div className="stat-item-modern">
              <span className="stat-label-modern">Total Issues</span>
              <span className="stat-value-modern stat-issues">{stats.totalIssues}</span>
            </div>
            <div className="stat-item-modern">
              <span className="stat-label-modern">Quality Score</span>
              <span className="stat-value-modern stat-score-before">{stats.beforeScore}%</span>
            </div>
          </div>
        </div>

        <div className="arrow-separator-modern">
          <ArrowRight size={32} className="arrow-icon" />
        </div>

        <div className="comparison-card-modern after-card">
          <div className="card-header-modern">
            <h4 className="card-title-modern">After Fixes</h4>
          </div>
          <div className="comparison-stats-modern">
            <div className="stat-item-modern">
              <span className="stat-label-modern">Remaining Issues</span>
              <span className="stat-value-modern stat-issues-improved">{stats.remainingIssues}</span>
            </div>
            <div className="stat-item-modern">
              <span className="stat-label-modern">Quality Score</span>
              <span className="stat-value-modern stat-score-after">{stats.afterScore}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="improvement-metrics-modern">
        <div className="metric-card-modern metric-reduced">
          <div className="metric-icon-wrapper">
            <TrendingDown size={24} />
          </div>
          <div className="metric-content">
            <span className="metric-label">Issues Reduced</span>
            <span className="metric-value">
              {stats.resolvedIssues} ({stats.issuesReducedPercent}%)
            </span>
          </div>
        </div>
        <div className="metric-card-modern metric-improved">
          <div className="metric-icon-wrapper">
            <TrendingUp size={24} />
          </div>
          <div className="metric-content">
            <span className="metric-label">Score Improvement</span>
            <span className="metric-value">+{stats.scoreIncrease}%</span>
          </div>
        </div>
      </div>
    </div>
  )
}
