import { createContext, useContext, useState, useCallback, useEffect } from "react"
import { ProjectAPI } from "../services/api"
import { notify } from "../services/notify"

const ProjectContext = createContext()

export function ProjectProvider({ children }) {
  const [projects, setProjects] = useState([])
  const [currentProject, setCurrentProject] = useState(null)
  const [history, setHistory] = useState([])

  // Initial load from backend
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const list = await ProjectAPI.list()
        if (mounted) setProjects(Array.isArray(list) ? list : [])
        notify.info(`Loaded ${list?.length || 0} projects`)  
        // Auto-select first project if none chosen yet so dependent pages (Results) have context
        if (mounted && (!currentProject || !currentProject.id) && Array.isArray(list) && list.length > 0) {
          setCurrentProject(list[0])
        }
      } catch (e) {
        console.error("Failed to load projects:", e)
        notify.error("Failed to load projects")
      }
    })()
    return () => { mounted = false }
  }, [currentProject])

  const addProject = useCallback(async (projectData) => {
    try {
      const created = await ProjectAPI.create(projectData)
      setProjects((prev) => [...prev, created])
      notify.success(`Project '${created.name}' created`)
      return created
    } catch (e) {
      notify.error(e.message || 'Project creation failed')
      throw e
    }
  }, [])

  const updateProject = useCallback(async (projectId, updates) => {
    try {
      const updated = await ProjectAPI.update(projectId, updates)
      setProjects((prev) => prev.map((p) => (p.id === projectId ? updated : p)))
      if (currentProject?.id === projectId) setCurrentProject(updated)
      notify.success('Project updated')
      return updated
    } catch (e) {
      notify.error(e.message || 'Update failed')
      throw e
    }
  }, [currentProject])

  const deleteProject = useCallback(async (projectId) => {
    try {
      await ProjectAPI.delete(projectId)
      setProjects((prev) => prev.filter((p) => p.id !== projectId))
      if (currentProject?.id === projectId) setCurrentProject(null)
      notify.warn('Project deleted')
    } catch (e) {
      notify.error(e.message || 'Delete failed')
      throw e
    }
  }, [currentProject])

  // Keeps old signature so existing UI can append local history, optional
  const addScan = useCallback((scan) => {
    setHistory((prev) => [...prev, scan])
  }, [])

  return (
    <ProjectContext.Provider
      value={{
        projects,
        currentProject,
        setCurrentProject,
        addProject,
        updateProject,
        deleteProject,
        addScan,
        history,
      }}
    >
      {children}
    </ProjectContext.Provider>
  )
}

export function useProject() {
  const context = useContext(ProjectContext)
  if (!context) {
    throw new Error("useProject must be used within ProjectProvider")
  }
  return context
}
