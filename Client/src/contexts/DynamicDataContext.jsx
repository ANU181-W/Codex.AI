import { createContext, useContext, useMemo, useState, useCallback, useEffect } from 'react'
import useProjectsApi from '@/src/hooks/api/useProjectsApi'
import useFilesApi from '@/src/hooks/api/useFilesApi'
import useScansApi from '@/src/hooks/api/useScansApi'
import { FileAPI, ScanAPI } from '@/src/services/api'

const DynamicDataContext = createContext(null)

export function DynamicDataProvider({ children }) {
  const [activeProjectId, setActiveProjectId] = useState(null)
  const projectsApi = useProjectsApi()
  const activeProject = useMemo(() => projectsApi.projects.find(p => p.id === activeProjectId) || null, [projectsApi.projects, activeProjectId])
  const filesApi = useFilesApi(activeProject)
  const scansApi = useScansApi(activeProject)

  const selectProject = useCallback((id) => setActiveProjectId(id), [])

  // Auto-select first available project once loaded so dashboards/charts call APIs by default
  // This keeps UI dynamic without requiring edits to presentational components
  // Auto-select first project OR create one automatically if none exist to ensure API calls start.
  useEffect(() => {
    async function ensure() {
      if (Array.isArray(projectsApi.projects)) {
        if (projectsApi.projects.length === 0) {
          // Create a default project so subsequent pages have something to work with
          const created = await projectsApi.create({ name: 'Default Project', description: 'Auto-created' })
          setActiveProjectId(created.id)
        } else if (!activeProjectId) {
          setActiveProjectId(projectsApi.projects[0].id)
        }
      }
    }
    ensure()
  }, [projectsApi.projects, activeProjectId, projectsApi])

  // When a project becomes active, ensure latest scans & files are loaded.
  useEffect(() => {
    async function hydrate() {
      if (!activeProject) return
      try { await filesApi.refresh() } catch {}
      try { await scansApi.loadList(); await scansApi.loadLatest() } catch {}
    }
    hydrate()
  }, [activeProject, filesApi, scansApi])

  // External trigger to perform a full scan cycle (upload + start scan) for given FileList
  const performScanWithFiles = useCallback(async (fileList) => {
    let project = activeProject
    if (!project) {
      project = await projectsApi.create({ name: 'Scan Project', description: 'Auto-created for scan' })
      setActiveProjectId(project.id)
    }
    const filesArr = Array.from(fileList)
    await FileAPI.upload(project.id, filesArr)
    await ScanAPI.start(project.id)
    await scansApi.loadLatest()
    await scansApi.loadList()
  }, [activeProject, projectsApi, scansApi])

  // Helper to create and select a project in one step
  const createAndSelectProject = useCallback(async (payload) => {
    const p = await projectsApi.create(payload)
    setActiveProjectId(p.id)
    return p
  }, [projectsApi])

  const value = useMemo(() => ({
    projectsApi,
    filesApi,
    scansApi,
    activeProject,
    selectProject,
    createAndSelectProject,
    performScanWithFiles,
  }), [projectsApi, filesApi, scansApi, activeProject, selectProject, createAndSelectProject])

  return <DynamicDataContext.Provider value={value}>{children}</DynamicDataContext.Provider>
}

export function useDynamicData() {
  const ctx = useContext(DynamicDataContext)
  if (!ctx) throw new Error('useDynamicData must be used within DynamicDataProvider')
  return ctx
}
