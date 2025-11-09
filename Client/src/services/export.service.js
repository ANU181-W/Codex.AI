// Utilities to export scan results as JSON or CSV and trigger browser download

function normalizeText(s) {
  if (s === undefined || s === null) return ''
  if (typeof s === 'string') return s
  try { return JSON.stringify(s) } catch { return String(s) }
}

export function buildExportJSON(currentScan, issues, suggestions) {
  const fileNames = Array.isArray(currentScan?.fileNames) ? currentScan.fileNames : []
  const fileName = fileNames.length === 1 ? fileNames[0] : (currentScan?.projectName || 'project-scan')
  const fileType = fileNames.length > 1 ? 'MIXED' : inferTypeFromName(fileNames[0])

  const json = {
    fileName,
    fileType,
    isValid: !issues || issues.length === 0,
    issues: (issues || []).map(i => ({
      category: String(i.category || '').toLowerCase(),
      description: i.description || i.message || i.title || '',
      severity: String(i.severity || '').toLowerCase(),
      file: typeof i.file === 'string' ? i.file : (i?.file?.filename || undefined),
      line: i.line ?? undefined,
      column: i.column ?? undefined,
      rule: i.rule ?? undefined,
    })),
    aiSuggestedPatches: (suggestions || []).map(s => ({
      diff: s.suggested || s.patchDiff || `Suggested fix: ${s.title || ''}`,
      rationale: s.rationale || 'Auto-suggested improvement.',
      file: s.file || undefined,
      line: s.line ?? undefined,
    })),
  }
  return json
}

export function buildExportCSV(currentScan, issues, suggestions) {
  const headers = [
    'file', 'line', 'category', 'severity', 'title', 'description', 'suggested'
  ]
  const rows = (issues || []).map(i => [
    typeof i.file === 'string' ? i.file : (i?.file?.filename || ''),
    i.line ?? '',
    String(i.category || '').toLowerCase(),
    String(i.severity || '').toLowerCase(),
    normalizeText(i.title || ''),
    normalizeText(i.description || i.message || ''),
    ''
  ])

  // Merge first matching suggestion per issue by (issueId) or (file+line)
  const suggs = Array.isArray(suggestions) ? suggestions : []
  for (const row of rows) {
    const [file, line] = row
    const match = suggs.find(s => (s.issueId && s.issueId === (row.issueId || '')) || (s.file === file && String(s.line || '') === String(line || '')))
    if (match) {
      row[row.length - 1] = normalizeText(match.suggested || match.patchDiff || '')
    }
  }

  const lines = [headers.join(','), ...rows.map(r => r.map(csvEscape).join(','))]
  return lines.join('\n')
}

function csvEscape(value) {
  const s = value === undefined || value === null ? '' : String(value)
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"'
  }
  return s
}

function inferTypeFromName(name) {
  if (!name) return 'UNKNOWN'
  const ext = (name.split('.').pop() || '').toUpperCase()
  if (['HTML', 'JSX', 'TSX', 'CSS', 'SCSS', 'LESS', 'JSON', 'YAML', 'JS', 'TS'].includes(ext)) return ext
  return 'UNKNOWN'
}

export function triggerDownload(data, filename, mime) {
  const blob = new Blob([data], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
