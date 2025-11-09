import { useCallback, useEffect, useMemo, useState } from 'react'
import { ScanAPI } from '@/src/services/api'
import { toUiScan } from '@/src/services/transformers'

export function useScansApi(project) {
  const projectId = project?.id
  const [scans, setScans] = useState([])
  const [currentScan, setCurrentScan] = useState(null)
  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const loadList = useCallback(async () => {
    if (!projectId) return
    setLoading(true); setError(null)
    try {
      const data = await ScanAPI.list(projectId)
      const list = Array.isArray(data) ? data : []
      setScans(list.map(s => toUiScan(s, project)))
    } catch (e) {
      setError(e?.message || 'Failed to load scans')
    } finally { setLoading(false) }
  }, [projectId, project])

  const loadLatest = useCallback(async () => {
    if (!projectId) return null
    try {
      const s = await ScanAPI.latest(projectId)
      const ui = toUiScan(s, project)
      setCurrentScan(ui)
      setIssues(ui.issues || [])
      return ui
    } catch (e) {
      setError(e?.message || 'Failed to load latest scan')
      return null
    }
  }, [projectId, project])

  const start = useCallback(async () => {
    if (!projectId) throw new Error('No project selected')
    const s = await ScanAPI.start(projectId)
    const ui = toUiScan(s, project)
    setCurrentScan(ui)
    setIssues(ui.issues || [])
    setScans(prev => [ui, ...prev])
    return ui
  }, [projectId, project])

  useEffect(() => { setScans([]); setCurrentScan(null); setIssues([]); if (projectId) loadList() }, [projectId, loadList])

  const stats = useMemo(() => {
    const totalIssues = scans.reduce((acc, s) => acc + (s.issues?.length || 0), 0)
    const scores = scans.map(s => s.score || 0)
    const avgScore = scores.length ? Math.round(scores.reduce((a,b)=>a+b,0)/scores.length) : 0
    const maxScore = scores.length ? Math.max(...scores) : 0
    const minScore = scores.length ? Math.min(...scores) : 0
    const filesScanned = scans.reduce((acc, s) => acc + (s.filesCount || 0), 0)
    return { totalIssues, scores, avgScore, maxScore, minScore, filesScanned }
  }, [scans])

  return { scans, currentScan, issues, setIssues, setCurrentScan, loading, error, loadList, loadLatest, start, stats }
}

export default useScansApi
