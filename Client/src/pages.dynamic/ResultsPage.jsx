import { useEffect } from 'react'
import { useDynamicData } from '@/src/contexts/DynamicDataContext'
import IssueList from '@/src/components/Results/IssueList'
import SuggestionsList from '@/src/components/Results/SuggestionsList'
import BeforeAfterComparison from '@/src/components/Results/BeforeAfterComparison'
import '@/src/styles/pages.css'

export default function ResultsPageDynamic() {
  const { scansApi } = useDynamicData()
  const { currentScan, issues } = scansApi

  useEffect(() => { document.title = 'Scan Results - CodexAI (Dynamic)' }, [])

  if (!currentScan) {
  return <div className="results-page"><div className="no-results"><p>No backend scan results yet. Run a scan in Scanner.</p></div></div>
  }

  return (
    <div className="results-page">
      <div className="results-container">
        <div className="results-header">
          <div>
            <h1 className="page-title">Scan Results (Dynamic)</h1>
            <p className="page-subtitle">Backend analysis aggregated</p>
          </div>
          <div className="score-badge">
            <span className="score-label">Quality Score</span>
            <span className={`score-value ${currentScan.score >= 80 ? 'excellent' : currentScan.score >= 60 ? 'good' : 'needs-improvement'}`}>{currentScan.score}%</span>
          </div>
        </div>

        <div className="results-grid">
          <div className="issues-section"><IssueList issues={issues} /></div>
          <div className="suggestions-section"><SuggestionsList issues={issues} /></div>
        </div>
        <div className="comparison-section"><BeforeAfterComparison issues={issues} /></div>
      </div>
    </div>
  )
}
