import { useState } from "react"
import { useProject } from "../../contexts/ProjectContext"
import { projectService } from "../../services/projectService"
import "../../styles/projects.css"

export default function ProjectSettings() {
  const { currentProject, updateProject } = useProject()
  const [settings, setSettings] = useState(currentProject?.settings || {})

  if (!currentProject) {
    return <div className="project-settings empty">Select a project to view settings</div>
  }

  const handleSettingChange = (key) => {
    const updated = { ...settings, [key]: !settings[key] }
    setSettings(updated)
    updateProject(currentProject.id, { settings: updated })
  }

  const handleExport = () => {
    projectService.exportProject(currentProject.id)
  }

  return (
    <div className="project-settings">
      <h3>Project Settings</h3>

      <div className="settings-section">
        <h4>Scan Options</h4>
        <div className="setting-item">
          <label>
            <input
              type="checkbox"
              checked={settings.checkAccessibility}
              onChange={() => handleSettingChange("checkAccessibility")}
            />
            Accessibility Checks
          </label>
        </div>
        <div className="setting-item">
          <label>
            <input
              type="checkbox"
              checked={settings.checkSecurity}
              onChange={() => handleSettingChange("checkSecurity")}
            />
            Security Checks
          </label>
        </div>
        <div className="setting-item">
          <label>
            <input
              type="checkbox"
              checked={settings.checkPerformance}
              onChange={() => handleSettingChange("checkPerformance")}
            />
            Performance Checks
          </label>
        </div>
        <div className="setting-item">
          <label>
            <input type="checkbox" checked={settings.checkSEO} onChange={() => handleSettingChange("checkSEO")} />
            SEO Checks
          </label>
        </div>
        <div className="setting-item">
          <label>
            <input
              type="checkbox"
              checked={settings.checkStructure}
              onChange={() => handleSettingChange("checkStructure")}
            />
            Structure Checks
          </label>
        </div>
      </div>

      <div className="settings-section">
        <h4>Data Management</h4>
        <button className="btn btn-secondary" onClick={handleExport}>
          📥 Export Project
        </button>
      </div>
    </div>
  )
}
