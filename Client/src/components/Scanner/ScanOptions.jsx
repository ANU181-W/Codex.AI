import { Shield, Zap, Search, Code, Globe, Accessibility } from "lucide-react"

export default function ScanOptions({ options, onChange }) {
  const handleToggle = (key) => {
    onChange({
      ...options,
      [key]: !options[key],
    })
  }

  const optionsList = [
    { key: "checkAccessibility", label: "Accessibility", sublabel: "WCAG 2.2 compliance", icon: Accessibility },
    { key: "checkSecurity", label: "Security", sublabel: "Vulnerability scan", icon: Shield },
    { key: "checkPerformance", label: "Performance", sublabel: "Optimization checks", icon: Zap },
    { key: "checkSEO", label: "SEO", sublabel: "Search optimization", icon: Search },
    { key: "checkStructure", label: "Code Structure", sublabel: "Best practices", icon: Code },
    { key: "checkI18n", label: "Internationalization", sublabel: "Multi-language support", icon: Globe },
  ]

  return (
    <div className="scan-options-modern">
      <h3 className="options-title">Scan Configuration</h3>
      <div className="options-grid-modern">
        {optionsList.map((opt) => {
          const Icon = opt.icon
          return (
            <label key={opt.key} className={`option-card-modern ${options[opt.key] ? "active" : ""}`}>
              <input 
                type="checkbox" 
                checked={options[opt.key]} 
                onChange={() => handleToggle(opt.key)}
                className="option-checkbox-modern"
              />
              <div className="option-content-modern">
                <Icon size={20} className="option-icon-modern" />
                <div className="option-text">
                  <span className="option-label-modern">{opt.label}</span>
                  <span className="option-sublabel-modern">{opt.sublabel}</span>
                </div>
              </div>
            </label>
          )
        })}
      </div>
    </div>
  )
}
