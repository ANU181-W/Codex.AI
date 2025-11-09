// Transform backend models into UI-friendly shapes expected by components

// Compute score from issues and counts similar to codeAnalyzerService.calculateQualityScore
export function computeQualityScore(issues) {
  if (!issues || issues.length === 0) return 100
  let penalty = 0
  for (const issue of issues) {
    switch ((issue.severity || '').toLowerCase()) {
      case 'critical': penalty += 10; break
      case 'high': penalty += 5; break
      case 'medium': penalty += 2; break
      case 'low': penalty += 1; break
      default: penalty += 1
    }
  }
  return Math.max(0, 100 - penalty)
}

export function toUiScan(scan, project) {
  if (!scan) return null
  const issues = Array.isArray(scan.issues) ? scan.issues : []
  const score = computeQualityScore(issues)
  const ui = {
    id: scan.id,
    projectId: scan.projectId,
    projectName: project?.name || 'Project',
    filesCount: scan.totalFiles ?? (project?.files?.length || 0),
    fileNames: Array.isArray(project?.files) ? project.files.map(f => f.filename) : [],
    status: 'completed',
    issues,
    score,
    timestamp: scan.createdAt || new Date().toISOString(),
    raw: scan,
  }
  return ui
}
