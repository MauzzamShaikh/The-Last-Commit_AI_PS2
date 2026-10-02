import { BrowserRouter, Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, GraduationCap, Landmark, ShieldCheck } from 'lucide-react'
import { useEligibility } from './hooks/useEligibility'
import { HomePage } from './pages/HomePage'
import { ProfilePage } from './pages/ProfilePage'
import { ProcessingPage } from './pages/ProcessingPage'
import { ResultsPage } from './pages/ResultsPage'
import { SchemePage } from './pages/SchemePage'
import type { StudentProfile } from './types/eligibility'
import './App.css'

function SiteHeader() {
  const location = useLocation()
  return (
    <header className="site-header">
      <Link className="brand" to="/" aria-label="ScholarLens scholarship assistant home">
        <span className="brand-mark">
          <GraduationCap size={19} strokeWidth={2.1} />
        </span>
        <span className="brand-name">ScholarLens</span>
        <span className="brand-divider" />
        <span className="brand-product">Scholarship guide</span>
      </Link>
      <nav className="header-nav" aria-label="Main navigation">
        {location.pathname === '/results' && (
          <span className="nav-note">
            <ShieldCheck size={15} /> Your results stay on this device
          </span>
        )}
        <Link className="header-link" to="/profile">
          Check eligibility <ArrowRight size={15} />
        </Link>
      </nav>
    </header>
  )
}

function EligibilityApp() {
  const navigate = useNavigate()
  const {
    profile,
    setProfile,
    results,
    recommendation,
    loading,
    error,
    run,
    retry,
  } = useEligibility()

  async function handleSubmitProfile(nextProfile: StudentProfile) {
    setProfile(nextProfile)
    navigate('/results')
    await run(nextProfile)
  }

  return (
    <div className="app-shell">
      <SiteHeader />
      <main id="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/profile"
            element={
              <ProfilePage
                initialProfile={profile}
                loading={loading}
                onSubmit={handleSubmitProfile}
              />
            }
          />
          <Route path="/processing" element={<ProcessingPage loading={loading} />} />
          <Route
            path="/results"
            element={
              <ResultsPage
                results={results}
                recommendation={recommendation}
                loading={loading}
                error={error}
                onRetry={retry}
              />
            }
          />
          <Route path="/scheme/:schemeId" element={<SchemePage results={results} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="site-footer">
        <span>
          <Landmark size={14} /> ScholarLens · Student opportunity desk
        </span>
      </footer>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <EligibilityApp />
    </BrowserRouter>
  )
}
