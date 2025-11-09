import { useState } from "react"
import { useProject } from "../../contexts/ProjectContext"
import "../../styles/projects.css"

export default function ProjectManager() {
  const { projects, currentProject, setCurrentProject, addProject, deleteProject } = useProject()
  const [showNewProject, setShowNewProject] = useState(false)
  const [projectName, setProjectName] = useState("")
  const [projectDesc, setProjectDesc] = useState("")

  const handleCreateProject = () => {
    if (projectName.trim()) {
      const newProject = addProject({
        name: projectName,
        description: projectDesc,
      })
      setCurrentProject(newProject)
      setProjectName("")
      setProjectDesc("")
      setShowNewProject(false)
    }
  }

  return (
    <div className="project-manager">
      <div className="project-header">
        <h3>Projects</h3>
        <button className="btn-icon" onClick={() => setShowNewProject(!showNewProject)} title="New project">
          ➕
        </button>
      </div>

      {showNewProject && (
        <div className="new-project-form">
          <input
            type="text"
            placeholder="Project name"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="project-input"
          />
          <textarea
            placeholder="Project description (optional)"
            value={projectDesc}
            onChange={(e) => setProjectDesc(e.target.value)}
            className="project-input"
            rows={2}
          />
          <div className="form-actions">
            <button className="btn btn-primary btn-small" onClick={handleCreateProject}>
              Create
            </button>
            <button className="btn btn-secondary btn-small" onClick={() => setShowNewProject(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="projects-list">
        {projects.length === 0 ? (
          <p className="empty-state">No projects yet. Create one to get started!</p>
        ) : (
          projects.map((project) => (
            <div
              key={project.id}
              className={`project-item ${currentProject?.id === project.id ? "active" : ""}`}
              onClick={() => setCurrentProject(project)}
            >
              <div className="project-info">
                <h4>{project.name}</h4>
                <p>{project.scans.length} scans</p>
              </div>
              <button
                className="btn-delete"
                onClick={(e) => {
                  e.stopPropagation()
                  deleteProject(project.id)
                }}
                title="Delete project"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
