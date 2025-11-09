import { useCallback, useEffect, useMemo, useState } from 'react'
import { ProjectAPI } from '@/src/services/api'

export function useProjectsApi() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const data = await ProjectAPI.list()
      setProjects(data || [])
    } catch (e) {
      setError(e?.message || 'Failed to load projects')
    } finally {
      setLoading(false)
    }
  }, [])

  const create = useCallback(async (payload) => {
    const created = await ProjectAPI.create(payload)
    setProjects((prev) => [...prev, created])
    return created
  }, [])

  const get = useCallback(async (id) => {
    return await ProjectAPI.get(id)
  }, [])

  const update = useCallback(async (id, payload) => {
    const updated = await ProjectAPI.update(id, payload)
    setProjects((prev) => prev.map(p => p.id === id ? updated : p))
    return updated
  }, [])

  const remove = useCallback(async (id) => {
    await ProjectAPI.delete(id)
    setProjects((prev) => prev.filter(p => p.id !== id))
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const hasProjects = useMemo(() => (projects?.length || 0) > 0, [projects])

  return { projects, loading, error, refresh, create, get, update, remove, hasProjects }
}

export default useProjectsApi
