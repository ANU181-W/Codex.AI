import { Search, Zap, Target, Shield, Settings, BarChart3 } from "lucide-react"

export default function FeaturesSection() {
  const features = [
    {
      icon: Search,
      title: "Smart Scanning",
      description: "Parse and analyze HTML, JSX, TSX, and CSS files for common issues",
      color: "#3b82f6",
    },
    {
      icon: Zap,
      title: "AI Suggestions",
      description: "Get intelligent, minimal patch suggestions with detailed rationale",
      color: "#f59e0b",
    },
    {
      icon: Target,
      title: "Design Validation",
      description: "Validate components against design tokens and lint rules",
      color: "#10b981",
    },
    {
      icon: Shield,
      title: "Security First",
      description: "Auto-detect and redact secrets, PII, and API keys",
      color: "#ef4444",
    },
    {
      icon: Settings,
      title: "Smart Caching",
      description: "Warm caching mechanism to reuse results and reduce redundant analysis",
      color: "#8b5cf6",
    },
    {
      icon: BarChart3,
      title: "Verification",
      description: "After-fix re-scan with before/after improvement summary",
      color: "#06b6d4",
    },
  ]

  return (
    <section className="features-section-modern">
      <div className="features-header">
        <h2 className="features-title">Powerful Features</h2>
        <p className="features-subtitle">Everything you need to improve your code quality</p>
      </div>
      <div className="features-grid-modern">
        {features.map((feature, idx) => {
          const Icon = feature.icon
          return (
            <div key={idx} className="feature-card-modern">
              <div className="feature-icon-wrapper" style={{ backgroundColor: `${feature.color}15`, color: feature.color }}>
                <Icon size={24} />
              </div>
              <h3 className="feature-card-title">{feature.title}</h3>
              <p className="feature-card-description">{feature.description}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
