import { useEffect, useState } from "react"

export default function ScanProgress({ progress }) {
  const [status, setStatus] = useState("Initializing...")

  useEffect(() => {
    if (progress < 30) setStatus("Analyzing file structure...")
    else if (progress < 60) setStatus("Checking accessibility...")
    else if (progress < 80) setStatus("Running security checks...")
    else if (progress < 95) setStatus("Generating suggestions...")
    else setStatus("Finalizing results...")
  }, [progress])

  return (
    <div className="scan-progress">
      <div className="progress-content">
        <h2>Scanning Your Code</h2>
        <p>{status}</p>

        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }}></div>
        </div>

        <p className="progress-percent">{progress}%</p>

        <div className="scanning-animation">
          <div className="scan-line"></div>
          <div className="scan-line"></div>
          <div className="scan-line"></div>
        </div>

        <div className="ai-loader-text mt-4 text-sm opacity-80 tracking-wider">
          <span className="dot">c</span>
          <span className="dot">o</span>
          <span className="dot">d</span>
          <span className="dot">e</span>
          <span className="dot">x</span>
          <span className="dot">.</span>
          <span className="dot">A</span>
          <span className="dot">i</span>
          <span className="ml-2 animate-pulse">is scanning...</span>
        </div>
      </div>
    </div>
  )
}
