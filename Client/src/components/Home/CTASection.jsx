import { useNavigate } from "react-router-dom"
import { ArrowRight, Sparkles } from "lucide-react"

export default function CTASection() {
  const navigate = useNavigate()

  return (
    <section className="cta-section-modern">
      <div className="cta-content-modern">
        <div className="cta-icon-wrapper">
          <Sparkles size={32} />
        </div>
        <h2 className="cta-title">Ready to improve your code quality?</h2>
        <p className="cta-subtitle">Get started with CodexAI today and ship better, faster</p>
        <button className="btn-cta-modern" onClick={() => navigate("/scanner")}>
          Start Free Scan
          <ArrowRight size={20} />
        </button>
      </div>
    </section>
  )
}
