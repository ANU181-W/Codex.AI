import { useEffect } from "react"
import HeroSection from "../components/Home/HeroSection"
import FeaturesSection from "../components/Home/FeaturesSection"
import CTASection from "../components/Home/CTASection"
import "../styles/pages.css"

export default function HomePage() {
  useEffect(() => {
    document.title = "CodexAI - AI-Powered Code Copilot"
  }, [])

  return (
    <div className="home-page">
      <div className="home-container">
        <HeroSection />
        <FeaturesSection />
        <CTASection />
      </div>
    </div>
  )
}
