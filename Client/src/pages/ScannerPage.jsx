import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useScan } from "../contexts/ScanContext"
import FileUploader from "../components/Scanner/FileUploader"
import ScanOptions from "../components/Scanner/ScanOptions"
import ScanProgress from "../components/Scanner/ScanProgress"
import { useProject } from "../contexts/ProjectContext"
import { FileAPI } from "../services/api"
import "../styles/pages.css"

export default function ScannerPage() {
  const navigate = useNavigate()
  const { addScan, setCurrentScan, setIssues, updateScan, startScan } = useScan()
  const { currentProject, addProject, setCurrentProject } = useProject()
  const [scanning, setScanning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [scanOptions, setScanOptions] = useState({
    checkAccessibility: true,
    checkSecurity: true,
    checkPerformance: true,
    checkSEO: true,
    checkStructure: true,
    checkI18n: true,
  })

  const handleFilesSelected = async (files, projectName) => {
    setScanning(true)
    setProgress(0)

    try {
      // Ensure backend project exists
      let project = currentProject
      if (!project) {
        project = await addProject({ name: projectName || "New Project" })
        setCurrentProject(project)
      }

      const fileNames = files.map(file => file.name)

      const scan = addScan({
        projectName: projectName || "New Project",
        filesCount: files.length,
        fileNames: fileNames,
        status: "scanning",
        issues: [],
        score: 0,
        date: new Date().toISOString(),
      })

      setCurrentScan(scan)

      // Upload files to backend
      await FileAPI.upload(project.id, files)
      setProgress(60)

      // Start backend scan and fetch results
      const started = await startScan(project.id)
      setIssues(started.issues)

      updateScan(scan.id, {
        issues: started.issues,
        score: started.score,
        status: "completed",
      })

      setProgress(100)
      setScanning(false)

  setTimeout(() => navigate("/results"), 500)
    } catch (error) {
      console.error("Scan error:", error)
      setScanning(false)
      alert("Error during scan: " + error.message)
    }
  }

  return (
    <div className="scanner-page">
      <div className="scanner-container">
        {!scanning ? (
          <>
            <div className="scanner-header">
              <h1 className="page-title">Code Scanner</h1>
              <p className="page-subtitle">Upload your code files for comprehensive AI-powered analysis</p>
            </div>
            
            <div className="scanner-content">
              <ScanOptions options={scanOptions} onChange={setScanOptions} />
              <FileUploader onFilesSelected={handleFilesSelected} />
            </div>
          </>
        ) : (
          <div className="scanning-container">
            <ScanProgress progress={progress} />
          </div>
        )}
      </div>
    </div>
  )
}
