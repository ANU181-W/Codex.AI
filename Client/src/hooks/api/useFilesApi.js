import { useCallback, useEffect, useState } from 'react'
import { FileAPI } from '@/src/services/api'

export function useFilesApi(project) {
  const projectId = project?.id
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    if (!projectId) return
    setLoading(true); setError(null)
    try {
      const data = await FileAPI.listForProject(projectId)
      setFiles(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e?.message || 'Failed to load files')
    } finally { setLoading(false) }
  }, [projectId])

  const upload = useCallback(async (fileList) => {
    if (!projectId) throw new Error('No project selected')
    const arr = Array.from(fileList)
    const uploaded = await FileAPI.upload(projectId, arr)
    setFiles(prev => [...prev, ...uploaded])
    return uploaded
  }, [projectId])

  const remove = useCallback(async (fileId) => {
    await FileAPI.delete(fileId)
    setFiles(prev => prev.filter(f => f.id !== fileId))
  }, [])

  useEffect(() => { refresh() }, [refresh])

  return { files, loading, error, refresh, upload, remove }
}

export default useFilesApi
