import { createContext, useContext, useState, useCallback } from "react"
import { ScanAPI } from "../services/api"
import { computeQualityScore } from "../services/transformers"

const ScanContext = createContext()

export function ScanProvider({ children }) {
  const [scans, setScans] = useState([])
  const [currentScan, setCurrentScan] = useState(null)
  const [issues, setIssues] = useState([])
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
  const loadScans = useCallback(async (projectId) => {
    if (!projectId) return []
    const list = await ScanAPI.list(projectId)
    const normalized = Array.isArray(list) ? list.map(s => ({
      id: s.id,
      projectId: s.projectId,
      filesCount: s.totalFiles || 0,
      issues: s.issues || [],
      score: computeQualityScore(s.issues || []),
      status: 'completed',
      timestamp: s.createdAt,
    })) : []
    setScans(normalized)
    return normalized
  }, [])

  const loadLatest = useCallback(async (projectId) => {
    if (!projectId) return null
    const s = await ScanAPI.latest(projectId)
    if (!s) return null
    const latest = {
      id: s.id,
      projectId: s.projectId,
      filesCount: s.totalFiles || 0,
      issues: s.issues || [],
      score: computeQualityScore(s.issues || []),
      status: 'completed',
      timestamp: s.createdAt,
    }
    setCurrentScan(latest)
    setIssues(latest.issues)
    return latest
  }, [])

  const startScan = useCallback(async (projectId) => {
    if (!projectId) throw new Error('projectId is required')
    const s = await ScanAPI.start(projectId)
    const started = {
      id: s.id,
      projectId: s.projectId,
      filesCount: s.totalFiles || 0,
      issues: s.issues || [],
      score: computeQualityScore(s.issues || []),
      status: 'completed',
      timestamp: s.createdAt,
    }
    setCurrentScan(started)
    setIssues(started.issues)
    setScans(prev => [started, ...prev])
    return started
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
