// Alternate dynamic App entry that uses backend-powered contexts and pages
// Does not modify existing App.jsx. Switch by changing import in main.jsx if desired.

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import HomePage from './pages/HomePage'
import DashboardPageDynamic from './pages.dynamic/DashboardPage'
import ScannerPageDynamic from './pages.dynamic/ScannerPage'
import ResultsPageDynamic from './pages.dynamic/ResultsPage'
import { DynamicDataProvider } from './contexts/DynamicDataContext'
import { ThemeProvider } from '../components/theme-provider'

export default function AppDynamic() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <DynamicDataProvider>
        <Router>
          <MainLayout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              {/* Dynamic routes mirror existing paths so the UI appears backed by the API */}
              <Route path="/dashboard" element={<DashboardPageDynamic />} />
              <Route path="/scanner" element={<ScannerPageDynamic />} />
              <Route path="/results" element={<ResultsPageDynamic />} />
              {/* Also keep alternative routes to avoid conflicts if you want to compare */}
              <Route path="/dashboard-dynamic" element={<DashboardPageDynamic />} />
              <Route path="/scanner-dynamic" element={<ScannerPageDynamic />} />
              <Route path="/results-dynamic" element={<ResultsPageDynamic />} />
            </Routes>
          </MainLayout>
        </Router>
      </DynamicDataProvider>
    </ThemeProvider>
  )
}
