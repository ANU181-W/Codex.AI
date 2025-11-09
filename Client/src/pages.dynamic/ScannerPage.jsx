import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDynamicData } from '@/src/contexts/DynamicDataContext'
import { FileAPI, ScanAPI } from '@/src/services/api'
import FileUploader from '@/src/components/Scanner/FileUploader'
import ScanOptions from '@/src/components/Scanner/ScanOptions'
import ScanProgress from '@/src/components/Scanner/ScanProgress'
import '@/src/styles/pages.css'

export default function ScannerPageDynamic() {
  const navigate = useNavigate()
  const { filesApi, scansApi, activeProject, projectsApi, selectProject } = useDynamicData()
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

  const ensureProject = async () => {
    if (activeProject) return activeProject
    // create a temporary project and select it
    const p = await projectsApi.create({ name: 'Dynamic Project', description: 'Auto-created for scan' })
    selectProject(p.id)
    // small tick to allow context to propagate
    await new Promise(r => setTimeout(r, 10))
    return p
  }

  const handleFilesSelected = async (files) => {
    setScanning(true); setProgress(0)
    try {
  const proj = await ensureProject()
  // upload files explicitly to selected project to avoid race conditions
  await FileAPI.upload(proj.id, Array.from(files))
  // start backend scan for this project id
  await ScanAPI.start(proj.id)
  // refresh latest/current in context
  await scansApi.loadLatest()
  setProgress(100)
  setTimeout(() => { setScanning(false); navigate('/results') }, 400)
    } catch (e) {
      console.error(e)
      alert(e.message || 'Scan failed')
      setScanning(false)
    }
  }

  return (
    <div className="scanner-page">
      <div className="scanner-container">
        {!scanning ? (
          <>
            <div className="scanner-header">
              <h1 className="page-title">Code Scanner (Dynamic)</h1>
              <p className="page-subtitle">Upload files to trigger backend scan</p>
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
