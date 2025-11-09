import { createContext, useContext, useState, useCallback, useEffect } from "react"
import { ProjectAPI } from "../services/api"

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
      } catch (e) {
        console.error("Failed to load projects:", e)
      }
    })()
    return () => { mounted = false }
  }, [])

  const addProject = useCallback(async (projectData) => {
    const created = await ProjectAPI.create(projectData)
    setProjects((prev) => [...prev, created])
    return created
  }, [])

  const updateProject = useCallback(async (projectId, updates) => {
    const updated = await ProjectAPI.update(projectId, updates)
    setProjects((prev) => prev.map((p) => (p.id === projectId ? updated : p)))
    if (currentProject?.id === projectId) setCurrentProject(updated)
    return updated
  }, [currentProject])

  const deleteProject = useCallback(async (projectId) => {
    await ProjectAPI.delete(projectId)
    setProjects((prev) => prev.filter((p) => p.id !== projectId))
    if (currentProject?.id === projectId) setCurrentProject(null)
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
