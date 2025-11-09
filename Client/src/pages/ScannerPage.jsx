import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useScan } from "../contexts/ScanContext"
import FileUploader from "../components/Scanner/FileUploader"
import ScanOptions from "../components/Scanner/ScanOptions"
import ScanProgress from "../components/Scanner/ScanProgress"
import { useProject } from "../contexts/ProjectContext"
import { FileAPI } from "../services/api"
import { computeQualityScore } from "../services/transformers"
import { notify } from "../services/notify"
import "../styles/pages.css"
import ProjectSelect from "../components/Projects/ProjectSelect"

export default function ScannerPage() {
  const navigate = useNavigate()
  const { addScan, setCurrentScan, setIssues, setSuggestions, updateScan, startScan } = useScan()
  const { currentProject, addProject, setCurrentProject, projects } = useProject()
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
        // Enforce project-first flow: require existing or explicit name
        if (!projectName) {
          setScanning(false)
          notify.warn('Please select or create a project before uploading')
          return
        }
        project = await addProject({ name: projectName })
        setCurrentProject(project)
      }

      const fileNames = files.map(file => file.name)

      const scan = addScan({
        projectName: project?.name,
        filesCount: files.length,
        fileNames: fileNames,
        status: "scanning",
        issues: [],
        score: 0,
        date: new Date().toISOString(),
      })

      setCurrentScan(scan)

      // Upload files to backend and immediately use AI issues from response
  notify.info('Uploading files...')
  const uploadSummary = await FileAPI.upload(project.id, files)
      setProgress(70)

      const immediateIssues = Array.isArray(uploadSummary?.files)
        ? uploadSummary.files.flatMap(f => f.issues || [])
        : []
      // Build suggestions from backend AI analysis per file, mapped to issues by category/line
      const immediateSuggestions = Array.isArray(uploadSummary?.files)
        ? uploadSummary.files.flatMap(f => {
            const suggs = (f.analysis && Array.isArray(f.analysis.suggestions)) ? f.analysis.suggestions : []
            const byCategory = suggs.reduce((acc, s) => {
              const key = String(s.category || '').toLowerCase()
              if (!acc[key]) acc[key] = []
              acc[key].push(s)
              return acc
            }, {})
            return (f.issues || []).map((iss, idx) => {
              const key = String(iss.category || '').toLowerCase()
              const matched = (byCategory[key] && byCategory[key].length) ? byCategory[key].shift() : null
              const suggested = matched?.example || (Array.isArray(matched?.changes) ? matched.changes.join('\n') : iss.suggestion || '')
              return {
                id: `${f.filename}-${iss.line || idx}`,
                issueId: iss.id || `${f.filename}:${iss.line}:${iss.column || ''}`,
                title: matched?.description || iss.title || 'AI suggestion',
                category: key,
                severity: (iss.severity || '').toLowerCase(),
                file: f.filename,
                line: iss.line,
                original: iss.code || '',
                suggested,
                rationale: matched?.rationale || '',
                confidence: 0.8,
                explanation: matched?.description || ''
              }
            })
          })
        : []
      const immediateScore = computeQualityScore(immediateIssues)

  setIssues(immediateIssues)
  setSuggestions(immediateSuggestions)

      const updated = {
        ...scan,
        issues: immediateIssues,
        score: immediateScore,
        status: "completed",
      }
      updateScan(scan.id, {
        issues: immediateIssues,
        score: immediateScore,
        status: "completed",
      })
  setCurrentScan(updated)

      // Optionally kick off a formal scan in the background to populate dashboard history
  startScan(project.id, project.name).catch(() => {})

      setProgress(100)
      setScanning(false)

  setTimeout(() => navigate("/results"), 300)
    } catch (error) {
      console.error("Scan error:", error)
      setScanning(false)
      notify.error(error.message || 'Error during scan')
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
              <ProjectSelect />
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
