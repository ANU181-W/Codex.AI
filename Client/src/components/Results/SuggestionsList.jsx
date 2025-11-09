import { useState, useMemo } from "react"
import { aiSuggestionsService } from "../../services/aiSuggestionsService"

export default function SuggestionsList({ issues }) {
  const [appliedSuggestions, setAppliedSuggestions] = useState(new Set())
  const [expandedId, setExpandedId] = useState(null)
  const [showImplementationGuide, setShowImplementationGuide] = useState(null)
  const [copiedId, setCopiedId] = useState(null)

  const suggestions = useMemo(() => {
    return aiSuggestionsService.generateSuggestions(issues)
  }, [issues])

  const prioritized = useMemo(() => aiSuggestionsService.prioritizeSuggestions(suggestions), [suggestions])

  const batchImpact = useMemo(
    () => aiSuggestionsService.calculateBatchImpact(suggestions.map((s) => ({ issue: issues[s.id] }))),
    [suggestions, issues],
  )

  const handleApplySuggestion = (id) => {
    setAppliedSuggestions(new Set([...appliedSuggestions, id]))
  }

  const handleCopyCode = (code, id) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    })
  }

  if (suggestions.length === 0) {
    return (
      <div className="suggestions-list">
        <h3>AI Suggestions (0)</h3>
        <div className="suggestion-empty-state">
          <p>No suggestions available. Your code is already optimized!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="suggestions-list">
      <div className="suggestions-header">
        <h3>AI Suggestions ({suggestions.length})</h3>
        <div className="suggestion-stats">
          <span className="stat-item">
            <strong>{batchImpact.totalImpact}</strong> Avg Impact
          </span>
          <span className="stat-item">
            <strong>~{batchImpact.estimatedTime}min</strong> Est. Fix Time
          </span>
        </div>
      </div>

      {/* Quick overview of fixes */}
      <div className="suggestion-quick-view">
        <p className="quick-summary">
          Applying all {suggestions.length} suggestions could improve your code quality by approximately{" "}
          <strong>{Math.round((appliedSuggestions.size / suggestions.length) * 100)}%</strong>
        </p>
      </div>

      {prioritized.map((suggestion) => {
        const issue = issues[suggestion.id] || issues[suggestion.issueId] || suggestion
        const timeEstimate = aiSuggestionsService.estimateFixTime(issue)
        const isExpanded = expandedId === suggestion.id
        const isApplied = appliedSuggestions.has(suggestion.id)
        const isCopied = copiedId === suggestion.id

        return (
          <div key={suggestion.id} className={`suggestion-item ${isApplied ? "suggestion-applied" : ""}`}>
            <div className="suggestion-header" onClick={() => setExpandedId(isExpanded ? null : suggestion.id)}>
              <div className="suggestion-left">
                <span className="suggestion-icon">💡</span>
                <div className="suggestion-info">
                  <span className="suggestion-title">{suggestion.title || issue.title || "Code Improvement"}</span>
                  <span className="suggestion-category">{suggestion.category}</span>
                </div>
              </div>
              <div className="suggestion-right">
                <span className={`confidence-badge confidence-${Math.round(suggestion.confidence * 10)}`}>
                  {Math.round(suggestion.confidence * 100)}% confidence
                </span>
                <span className="expand-icon">{isExpanded ? "▼" : "▶"}</span>
              </div>
            </div>

            {isExpanded && (
              <div className="suggestion-details">
                <div className="suggestion-explanation">
                  <h5>Why This Matters</h5>
                  <p>{suggestion.explanation}</p>
                </div>

                <div className="suggestion-impact">
                  <div className="impact-item">
                    <span className="impact-label">Fix Impact</span>
                    <div className="impact-bar">
                      <div
                        className="impact-fill"
                        style={{ width: `${aiSuggestionsService.calculateFixImpact(issue)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="impact-item">
                    <span className="impact-label">Estimated Time</span>
                    <span className="impact-value">
                      {timeEstimate.min}-{timeEstimate.max} minutes
                    </span>
                  </div>
                </div>

                <div className="code-comparison">
                  <div className="code-block original">
                    <div className="code-block-header">
                      <span className="label">Before</span>
                      {suggestion.file && (
                        <span className="file-info">{suggestion.file}{suggestion.line && `:${suggestion.line}`}</span>
                      )}
                    </div>
                    <pre><code>{suggestion.original || "No code available"}</code></pre>
                    <button
                      className="copy-btn"
                      onClick={() => handleCopyCode(suggestion.original, `orig-${suggestion.id}`)}
                      title="Copy original code"
                    >
                      {copiedId === `orig-${suggestion.id}` ? "✓ Copied" : "Copy"}
                    </button>
                  </div>
                  <span className="arrow">→</span>
                  <div className="code-block suggested">
                    <div className="code-block-header">
                      <span className="label">After</span>
                      <span className="improvement-badge">Improved</span>
                    </div>
                    <pre><code>{suggestion.suggested || "No suggestion available"}</code></pre>
                    <button
                      className="copy-btn"
                      onClick={() => handleCopyCode(suggestion.suggested, `sugg-${suggestion.id}`)}
                      title="Copy suggested code"
                    >
                      {copiedId === `sugg-${suggestion.id}` ? "✓ Copied" : "Copy"}
                    </button>
                  </div>
                </div>

                <div className="suggestion-actions">
                  <button
                    className={`btn ${isApplied ? "btn-success" : "btn-secondary"}`}
                    onClick={() => handleApplySuggestion(suggestion.id)}
                  >
                    {isApplied ? "✓ Applied" : "Apply Fix"}
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowImplementationGuide(isExpanded ? null : suggestion.id)}
                  >
                    📖 Implementation Guide
                  </button>
                </div>

                {showImplementationGuide === suggestion.id && (
                  <div className="implementation-guide">
                    <h5>Implementation Guide</h5>
                    <pre>{aiSuggestionsService.generateImplementationGuide(suggestion)}</pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
