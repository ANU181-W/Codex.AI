import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { Home, BarChart3, ScanSearch, CheckCircle2, Menu, X } from "lucide-react"
import Logo from "../components/Logo"
import "../styles/layout.css"

export default function MainLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const location = useLocation()

  const menuItems = [
    { path: "/", label: "Home", icon: Home },
    { path: "/dashboard", label: "Dashboard", icon: BarChart3 },
    { path: "/scanner", label: "Scanner", icon: ScanSearch },
    { path: "/results", label: "Results", icon: CheckCircle2 },
  ]

  return (
    <div className="layout-container">
      <aside className={`sidebar ${sidebarOpen ? "open" : "closed"}`}>
        <div className="sidebar-header">
          <Logo />
          <button 
            className="toggle-btn" 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-link ${location.pathname === item.path ? "active" : ""}`}
              >
                <Icon size={18} className="nav-icon" />
                {sidebarOpen && <span className="nav-label">{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        <div className="sidebar-footer">
          {sidebarOpen && (
            <div className="new-chat-btn">
              <span>+</span>
              <span>New Scan</span>
            </div>
          )}
        </div>
      </aside>

      <main className="main-content">
        <div className="content-wrapper">{children}</div>
      </main>
    </div>
  )
}
