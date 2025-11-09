import { useNavigate } from "react-router-dom"
import { Sparkles, ArrowRight } from "lucide-react"

export default function HeroSection() {
  const navigate = useNavigate()

  return (
    <section className="hero-section-modern">
      <div className="hero-content-modern">
        <div className="hero-badge">
          <Sparkles size={16} />
          <span>AI-Powered Code Analysis</span>
        </div>
        <h1 className="hero-title-modern">
          Improve Your Code Quality
          <br />
          with Intelligent Analysis
        </h1>
        <p className="hero-subtitle-modern">
          Scan, analyze, and improve your web applications with intelligent code suggestions powered by advanced AI technology
        </p>

        <div className="hero-features-modern">
          <div className="feature-chip-modern">
            <span className="check-icon">✓</span>
            <span>Accessibility (WCAG 2.2)</span>
          </div>
          <div className="feature-chip-modern">
            <span className="check-icon">✓</span>
            <span>Security Scan</span>
          </div>
          <div className="feature-chip-modern">
            <span className="check-icon">✓</span>
            <span>Performance</span>
          </div>
          <div className="feature-chip-modern">
            <span className="check-icon">✓</span>
            <span>SEO Optimization</span>
          </div>
        </div>

        <div className="hero-actions-modern">
          <button className="btn-primary-modern" onClick={() => navigate("/scanner")}>
            Start Scanning
            <ArrowRight size={18} />
          </button>
          <button className="btn-secondary-modern" onClick={() => navigate("/dashboard")}>
            View Dashboard
          </button>
        </div>
      </div>
    </section>
  )
}
