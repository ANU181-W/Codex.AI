import { createContext, useContext, useState, useCallback } from "react"
import { ScanAPI } from "../services/api"
import { computeQualityScore } from "../services/transformers"
import { notify } from "../services/notify"

const ScanContext = createContext()

export function ScanProvider({ children }) {
  const [scans, setScans] = useState([])
  const [currentScan, setCurrentScan] = useState(null)
  const [issues, setIssues] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [cache, setCache] = useState({})

  const addScan = useCallback((scanData) => {
    const newScan = {
      id: Date.now(),
      timestamp: new Date(),
      ...scanData,
    }
    setScans((prev) => [newScan, ...prev])
    return newScan
  }, [])

  const updateScan = useCallback((id, updates) => {
    setScans((prev) => prev.map((scan) => (scan.id === id ? { ...scan, ...updates } : scan)))
  }, [])

  // Backend integrations (idempotent APIs that preserve existing state shape)
  const loadScans = useCallback(async (projectId, projectName) => {
    if (!projectId) return []
    try {
      const list = await ScanAPI.list(projectId)
      const normalizeIssue = (i) => ({
        ...i,
        file: (i && i.file && i.file.filename) ? i.file.filename : (i?.file || ''),
        severity: (i?.severity || '').toLowerCase(),
        category: (i?.category || '').toLowerCase(),
      })
      const normalized = Array.isArray(list) ? list.map(s => ({
        id: s.id,
        projectId: s.projectId,
        projectName: projectName,
        filesCount: s.totalFiles || 0,
        fileNames: Array.isArray(s.fileNames) ? s.fileNames : (Array.isArray(s.metadata?.fileNames) ? s.metadata.fileNames : []),
        issues: Array.isArray(s.issues) ? s.issues.map(normalizeIssue) : [],
        score: computeQualityScore((s.issues || []).map(normalizeIssue)),
        status: 'completed',
        timestamp: s.createdAt,
      })) : []
      setScans(normalized)
      return normalized
    } catch (e) {
      notify.error(e.message || 'Failed to load scans')
      return []
    }
  }, [])

  const loadLatest = useCallback(async (projectId, projectName, retries = 3) => {
    if (!projectId) return null
    try {
      const s = await ScanAPI.latest(projectId)
      if (!s) return null
      const normalizeIssue = (i) => ({
        ...i,
        file: (i && i.file && i.file.filename) ? i.file.filename : (i?.file || ''),
        severity: (i?.severity || '').toLowerCase(),
        category: (i?.category || '').toLowerCase(),
      })
      const latest = {
        id: s.id,
        projectId: s.projectId,
        projectName: projectName,
        filesCount: s.totalFiles || 0,
        fileNames: Array.isArray(s.fileNames) ? s.fileNames : (Array.isArray(s.metadata?.fileNames) ? s.metadata.fileNames : []),
        issues: Array.isArray(s.issues) ? s.issues.map(normalizeIssue) : [],
        score: computeQualityScore((s.issues || []).map(normalizeIssue)),
        status: 'completed',
        timestamp: s.createdAt,
        aiSuggestions: Array.isArray(s.aiSuggestions) ? s.aiSuggestions : [],
      }
      // If backend synthesized placeholder issues (ids start with synth-) include them in scoring fallback
      if (latest.issues.length === 0 && latest.aiSuggestions.length > 0) {
        latest.issues = latest.aiSuggestions.map(s => ({
          id: s.issueId || `synth-${latest.id}-${Math.random().toString(36).slice(2,8)}`,
          title: s.title,
          description: s.explanation || s.rationale || s.title,
          category: s.category,
          severity: s.severity || 'low',
          file: s.file,
          line: s.line,
          code: s.original || '',
        }))
        latest.score = computeQualityScore(latest.issues)
      }
      // Only overwrite issues if we currently have none to avoid flicker if user navigated mid-update
      setCurrentScan(latest)
      setIssues(prev => (prev && prev.length > 0 ? prev : latest.issues))
      setSuggestions(prev => (prev && prev.length > 0 ? prev : latest.aiSuggestions))
      // If the backend is still hydrating and issues are empty while suggestions/files exist, retry briefly
      const needRetry = (!latest.issues || latest.issues.length === 0) && (Array.isArray(latest.fileNames) ? latest.fileNames.length > 0 : false)
      if (needRetry && retries > 0) {
        await new Promise(r => setTimeout(r, 700))
        return await loadLatest(projectId, projectName, retries - 1)
      }
      return latest
    } catch (e) {
      notify.error(e.message || 'Failed to load latest scan')
      return null
    }
  }, [])

  const startScan = useCallback(async (projectId, projectName) => {
    if (!projectId) throw new Error('projectId is required')
    try {
      const s = await ScanAPI.start(projectId)
      const normalizeIssue = (i) => ({
        ...i,
        file: (i && i.file && i.file.filename) ? i.file.filename : (i?.file || ''),
        severity: (i?.severity || '').toLowerCase(),
        category: (i?.category || '').toLowerCase(),
      })
      const started = {
        id: s.id,
        projectId: s.projectId,
        projectName: projectName,
        filesCount: s.totalFiles || 0,
        fileNames: Array.isArray(s.fileNames) ? s.fileNames : (Array.isArray(s.metadata?.fileNames) ? s.metadata.fileNames : []),
        issues: Array.isArray(s.issues) ? s.issues.map(normalizeIssue) : [],
        score: computeQualityScore((s.issues || []).map(normalizeIssue)),
        status: 'completed',
        timestamp: s.createdAt,
      }
      setCurrentScan(started)
      setIssues(started.issues)
      if (Array.isArray(s.aiSuggestions)) setSuggestions(s.aiSuggestions)
      setScans(prev => [started, ...prev])
      notify.success('Scan completed')
      return started
    } catch (e) {
      notify.error(e.message || 'Scan failed')
      throw e
    }
  }, [])

  const getCachedResult = useCallback(
    (fileHash) => {
      return cache[fileHash]
    },
    [cache],
  )

  const setCachedResult = useCallback((fileHash, result) => {
    setCache((prev) => ({ ...prev, [fileHash]: result }))
  }, [])

  return (
    <ScanContext.Provider
      value={{
        scans,
        currentScan,
        setCurrentScan,
  issues,
  suggestions,
  setSuggestions,
        setIssues,
        addScan,
        updateScan,
        loadScans,
        loadLatest,
        startScan,
        getCachedResult,
        setCachedResult,
      }}
    >
      {children}
    </ScanContext.Provider>
  )
}

export function useScan() {
  const context = useContext(ScanContext)
  if (!context) {
    throw new Error("useScan must be used within ScanProvider")
  }
  return context
}
