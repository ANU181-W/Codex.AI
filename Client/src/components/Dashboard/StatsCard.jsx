import { TrendingUp, TrendingDown, AlertTriangle, Star, Folder, BarChart3, Award, AlertCircle } from "lucide-react"

const iconMap = {
  "📈": TrendingUp,
  "📉": TrendingDown,
  "⚠️": AlertTriangle,
  "⭐": Star,
  "📁": Folder,
  "📊": BarChart3,
}

export default function StatsCard({ title, value, icon, color }) {
  const IconComponent = iconMap[icon] || TrendingUp
  
  // Get gradient colors based on card type
  const getGradient = (color) => {
    const gradients = {
      green: "linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)",
      orange: "linear-gradient(135deg, rgba(249, 115, 22, 0.1) 0%, rgba(234, 88, 12, 0.05) 100%)",
      blue: "linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%)",
      red: "linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%)",
    }
    return gradients[color] || gradients.blue
  }
  
  return (
    <div className={`stats-card-modern stats-card-${color}`} style={{ background: getGradient(color) }}>
      <div className="stats-icon-modern">
        <IconComponent size={28} />
      </div>
      <div className="stats-content-modern">
        <p className="stats-label-modern">{title}</p>
        <p className="stats-value-modern">{value}</p>
      </div>
      <div className="stats-decoration"></div>
    </div>
  )
}
