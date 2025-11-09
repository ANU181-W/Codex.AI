export const projectService = {
  // Store projects in localStorage
  projectsKey: "codexai_projects",
  historyKey: "codexai_history",

  // Get all projects
  getAllProjects: () => {
    const stored = localStorage.getItem(projectService.projectsKey)
    return stored ? JSON.parse(stored) : []
  },

  // Create new project
  createProject: (projectData) => {
    const projects = projectService.getAllProjects()
    const newProject = {
      id: `project_${Date.now()}`,
      name: projectData.name,
      description: projectData.description || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      scans: [],
      settings: {
        checkAccessibility: true,
        checkSecurity: true,
        checkPerformance: true,
        checkSEO: true,
        checkStructure: true,
      },
    }
    projects.push(newProject)
    localStorage.setItem(projectService.projectsKey, JSON.stringify(projects))
    return newProject
  },

  // Get project by ID
  getProject: (projectId) => {
    const projects = projectService.getAllProjects()
    return projects.find((p) => p.id === projectId)
  },

  // Update project
  updateProject: (projectId, updates) => {
    const projects = projectService.getAllProjects()
    const project = projects.find((p) => p.id === projectId)
    if (project) {
      Object.assign(project, updates, { updatedAt: new Date().toISOString() })
      localStorage.setItem(projectService.projectsKey, JSON.stringify(projects))
    }
    return project
  },

  // Delete project
  deleteProject: (projectId) => {
    const projects = projectService.getAllProjects()
    const filtered = projects.filter((p) => p.id !== projectId)
    localStorage.setItem(projectService.projectsKey, JSON.stringify(filtered))
  },

  // Add scan to project
  addScanToProject: (projectId, scan) => {
    const project = projectService.getProject(projectId)
    if (project) {
      project.scans.push({
        ...scan,
        addedAt: new Date().toISOString(),
      })
      projectService.updateProject(projectId, project)
    }
    return project
  },

  // Get project history
  getProjectHistory: (projectId) => {
    const project = projectService.getProject(projectId)
    return project ? project.scans : []
  },

  // Get all scan history
  getAllHistory: () => {
    const stored = localStorage.getItem(projectService.historyKey)
    return stored ? JSON.parse(stored) : []
  },

  // Add to global history
  addToHistory: (scan) => {
    const history = projectService.getAllHistory()
    history.push({
      ...scan,
      id: `scan_${Date.now()}`,
      timestamp: new Date().toISOString(),
    })
    localStorage.setItem(projectService.historyKey, JSON.stringify(history))
  },

  // Clear history
  clearHistory: () => {
    localStorage.removeItem(projectService.historyKey)
  },

  // Search projects
  searchProjects: (query) => {
    const projects = projectService.getAllProjects()
    const lowerQuery = query.toLowerCase()
    return projects.filter(
      (p) => p.name.toLowerCase().includes(lowerQuery) || p.description.toLowerCase().includes(lowerQuery),
    )
  },

  // Get project statistics
  getProjectStats: (projectId) => {
    const project = projectService.getProject(projectId)
    if (!project || project.scans.length === 0) {
      return null
    }

    const scans = project.scans
    const scores = scans.map((s) => s.score || 0)
    const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    const maxScore = Math.max(...scores)
    const minScore = Math.min(...scores)
    const totalIssues = scans.reduce((sum, s) => sum + (s.issues?.length || 0), 0)

    return {
      totalScans: scans.length,
      avgScore,
      maxScore,
      minScore,
      totalIssues,
      lastScanDate: scans[scans.length - 1]?.timestamp,
    }
  },

  // Export project data
  exportProject: (projectId) => {
    const project = projectService.getProject(projectId)
    if (!project) return null

    const dataStr = JSON.stringify(project, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${project.name}_${Date.now()}.json`
    link.click()
    URL.revokeObjectURL(url)
  },

  // Import project data
  importProject: (fileContent) => {
    try {
      const projectData = JSON.parse(fileContent)
      const newProject = {
        ...projectData,
        id: `project_${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      const projects = projectService.getAllProjects()
      projects.push(newProject)
      localStorage.setItem(projectService.projectsKey, JSON.stringify(projects))
      return newProject
    } catch (error) {
      console.error("Failed to import project:", error)
      return null
    }
  },
}

export default projectService
