import { useRef, useState } from "react"
import { Upload, FileText, X, FolderOpen } from "lucide-react"

export default function FileUploader({ onFilesSelected }) {
  const [isDragActive, setIsDragActive] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [projectName, setProjectName] = useState("")
  const [showProjectInput, setShowProjectInput] = useState(false)
  const inputRef = useRef(null)
  const folderInputRef = useRef(null)

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(e.type === "dragenter" || e.type === "dragover")
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)

    const files = Array.from(e.dataTransfer.files)
    processFiles(files)
  }

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files)
    processFiles(files)
  }

  const handleFolderSelect = async (e) => {
    const files = Array.from(e.target.files)
    processFiles(files)
  }

  const processFiles = (files) => {
    const validFiles = files.filter((file) => /\.(jsx|tsx|js|ts|html|css|scss|less)$/.test(file.name))

    if (validFiles.length === 0) {
      alert("Please select valid code files (.jsx, .tsx, .js, .ts, .html, .css)")
      return
    }

    handleFilesProcessed(validFiles)
  }

  const handleUpload = () => {
    if (selectedFiles.length === 0) {
      alert("Please select files first")
      return
    }
    if (!projectName.trim()) {
      alert("Please enter a project name")
      setShowProjectInput(true)
      return
    }
    onFilesSelected(selectedFiles, projectName.trim())
  }

  const handleFilesProcessed = (files) => {
    setSelectedFiles(files)
    if (files.length > 0 && !projectName) {
      setShowProjectInput(true)
    }
  }

  const removeFile = (index) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index))
  }

  return (
    <div className="file-uploader-modern">
      <div
        className={`upload-zone-modern ${isDragActive ? "active" : ""}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          onChange={handleFileChange}
          accept=".jsx,.tsx,.js,.ts,.html,.css,.scss,.less"
          style={{ display: "none" }}
        />

        <div className="upload-content-modern">
          <Upload size={48} className="upload-icon-modern" />
          <h3>Drop your code files or folder here</h3>
          <p>or click to browse</p>
          <p className="file-types-modern">Supports: .jsx, .tsx, .js, .ts, .html, .css, .scss, .less</p>
          <div className="upload-options">
            <input
              type="file"
              ref={folderInputRef}
              webkitdirectory=""
              directory=""
              multiple
              onChange={handleFolderSelect}
              style={{ display: "none" }}
            />
            <button
              className="btn-upload-option"
              onClick={(e) => {
                e.stopPropagation()
                inputRef.current?.click()
              }}
            >
              Upload Files
            </button>
            <button
              className="btn-upload-option"
              onClick={(e) => {
                e.stopPropagation()
                folderInputRef.current?.click()
              }}
            >
              Upload Folder
            </button>
          </div>
        </div>
      </div>

      {selectedFiles.length > 0 && (
        <div className="selected-files-modern">
          <div className="selected-files-header">
            <h4>Selected Files ({selectedFiles.length})</h4>
          </div>
          
          {(showProjectInput || !projectName) && (
            <div className="project-name-input-section">
              <label className="project-name-label">
                <FolderOpen size={18} />
                <span>Project Name</span>
              </label>
              <input
                type="text"
                className="project-name-input"
                placeholder="Enter project name (e.g., My Web App)"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && projectName.trim()) {
                    handleUpload()
                  }
                }}
                autoFocus
              />
            </div>
          )}

          <div className="files-list">
            {selectedFiles.map((file, idx) => (
              <div key={idx} className="file-item-modern">
                <FileText size={16} className="file-icon-modern" />
                <div className="file-info">
                  <span className="file-name-modern">{file.name}</span>
                  <span className="file-size-modern">{(file.size / 1024).toFixed(2)} KB</span>
                </div>
                <button 
                  className="file-remove-btn" 
                  onClick={(e) => {
                    e.stopPropagation()
                    removeFile(idx)
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
          <button 
            className="btn-scan-modern" 
            onClick={handleUpload}
            disabled={!projectName.trim()}
          >
            Start Scan
          </button>
        </div>
      )}
    </div>
  )
}
