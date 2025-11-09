import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import MainLayout from "./layouts/MainLayout"
import HomePage from "./pages/HomePage"
import DashboardPage from "./pages/DashboardPage"
import ScannerPage from "./pages/ScannerPage"
import ResultsPage from "./pages/ResultsPage"
import { ScanProvider } from "./contexts/ScanContext"
import { ProjectProvider } from "./contexts/ProjectContext"
import { ThemeProvider } from "../components/theme-provider"

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <ProjectProvider>
        <Router>
          <ScanProvider>
            <MainLayout>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/scanner" element={<ScannerPage />} />
                <Route path="/results" element={<ResultsPage />} />
              </Routes>
            </MainLayout>
          </ScanProvider>
        </Router>
      </ProjectProvider>
    </ThemeProvider>
  )
}
