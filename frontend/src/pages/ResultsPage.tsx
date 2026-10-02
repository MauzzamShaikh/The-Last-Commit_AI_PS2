import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronDown, ChevronUp, FileSearch, ShieldCheck } from 'lucide-react'
import { RecommendationCard } from '../components/schemes/RecommendationCard'
import { SchemeCard } from '../components/schemes/SchemeCard'
import { ShortlistSection } from '../components/schemes/ShortlistSection'
import { LoadingState } from '../components/common/LoadingState'
import { ErrorState } from '../components/common/ErrorState'
import type {
  Recommendation,
  SchemeResult,
} from '../types/eligibility'
import type { EligibilityError } from '../hooks/useEligibility'

interface ResultsPageProps {
  results: SchemeResult[] | null
  recommendation: Recommendation | null
  loading: boolean
  error: EligibilityError | null
  onRetry: () => void
}

export function ResultsPage({
  results,
  recommendation,
  loading,
  error,
  onRetry,
}: ResultsPageProps) {
  const navigate = useNavigate()
  const [showNotEligible, setShowNotEligible] = useState(false)

  // 1. Loading state
  if (loading) {
    return <LoadingState message="Checking 51 schemes..." />
  }

  // 2. Error state
  if (error) {
    return (
      <ErrorState
        message={error.message}
        details={error.details}
        onRetry={onRetry}
        onEditProfile={() => navigate('/profile')}
      />
    )
  }

  // 3. No data (e.g. page refreshed): redirect to profile page per contract
  if (results === null) {
    return <Navigate to="/profile" replace />
  }

  // 4. Empty state: results array is empty
  if (results.length === 0) {
    return (
      <div className="results-page page-width">
        <div className="results-topline">
          <button
            type="button"
            className="back-link-button"
            id="back-to-profile-button"
            onClick={() => navigate('/profile')}
          >
            <ArrowLeft size={16} /> Back to profile / Edit profile
          </button>
        </div>
        <div className="empty-state-card" id="empty-state-message">
          <FileSearch size={36} />
          <h2>No schemes found</h2>
          <p>
            No schemes matched your search parameters. Try adjusting your course, year, or
            leaving some fields blank to broaden your options.
          </p>
          <button
            type="button"
            className="primary-button"
            onClick={() => navigate('/profile')}
          >
            Update Profile
          </button>
        </div>
      </div>
    )
  }

  // Group schemes by status
  const eligibleGroup = results.filter((r) => r?.status === 'ELIGIBLE')
  const needsInfoGroup = results.filter((r) => r?.status === 'NEEDS_MORE_INFORMATION')
  const notEligibleGroup = results.filter((r) => r?.status === 'NOT_ELIGIBLE')

  const eligibleCount = eligibleGroup.length
  const needsInfoCount = needsInfoGroup.length
  const notEligibleCount = notEligibleGroup.length

  return (
    <div className="results-page page-width">
      <div className="results-topline">
        <button
          type="button"
          className="back-link-button"
          id="back-to-profile-button"
          onClick={() => navigate('/profile')}
        >
          <ArrowLeft size={16} /> Back to profile / Edit profile
        </button>
        <span className="results-security-tag">
          <ShieldCheck size={14} /> Evaluation complete · {results.length} schemes evaluated
        </span>
      </div>

      <header className="results-heading">
        <div>
          <p className="eyebrow">SCHOLARSHIP EVALUATION RESULTS</p>
          <h1>Your Scholarship Opportunities</h1>
          <p>
            Here is your personalized evaluation breakdown based on the details provided.
          </p>
        </div>
      </header>

      {/* Summary bar with counts per status */}
      <section className="summary-counts" aria-label="Status totals summary bar">
        <div className="summary-count count-green" id="count-eligible">
          <span className="count-number">{String(eligibleCount).padStart(2, '0')}</span>
          <span className="count-label">
            <span className="count-indicator" /> Eligible Schemes
          </span>
        </div>
        <div className="summary-count count-amber" id="count-needs-info">
          <span className="count-number">{String(needsInfoCount).padStart(2, '0')}</span>
          <span className="count-label">
            <span className="count-indicator" /> Needs More Information
          </span>
        </div>
        <div className="summary-count count-red" id="count-not-eligible">
          <span className="count-number">{String(notEligibleCount).padStart(2, '0')}</span>
          <span className="count-label">
            <span className="count-indicator" /> Not Eligible
          </span>
        </div>
      </section>

      {/* Recommendation Card (shown at the top when recommendation is not null) */}
      {recommendation && <RecommendationCard recommendation={recommendation} />}

      {/* Shortlist Section */}
      <ShortlistSection results={results} bestSchemeId={recommendation?.bestSchemeId} />

      {/* Groups: ELIGIBLE, NEEDS_MORE_INFORMATION, NOT_ELIGIBLE */}
      <div className="results-groups-container">
        {/* 1. ELIGIBLE Group (Expanded by default) */}
        <section className="result-group group-eligible-section" aria-labelledby="heading-eligible">
          <div className="group-heading group-eligible">
            <span className="status-indicator-dot" />
            <h2 id="heading-eligible">Eligible Schemes ({eligibleCount})</h2>
            <span className="group-count-pill">{eligibleCount} matched</span>
          </div>

          {eligibleCount === 0 ? (
            <p className="group-empty-hint">
              No schemes currently meet all criteria directly with your entered details.
            </p>
          ) : (
            <div className="scheme-grid">
              {eligibleGroup.map((scheme) => (
                <SchemeCard key={scheme.schemeId} scheme={scheme} />
              ))}
            </div>
          )}
        </section>

        {/* 2. NEEDS_MORE_INFORMATION Group (Expanded by default) */}
        <section
          className="result-group group-needs-info-section"
          aria-labelledby="heading-needs-info"
        >
          <div className="group-heading group-needs_more_information">
            <span className="status-indicator-dot" />
            <h2 id="heading-needs-info">Needs More Information ({needsInfoCount})</h2>
            <span className="group-count-pill">{needsInfoCount} pending details</span>
          </div>

          {needsInfoCount === 0 ? (
            <p className="group-empty-hint">
              No schemes require additional details based on your completed profile.
            </p>
          ) : (
            <div className="scheme-grid">
              {needsInfoGroup.map((scheme) => (
                <SchemeCard key={scheme.schemeId} scheme={scheme} />
              ))}
            </div>
          )}
        </section>

        {/* 3. NOT_ELIGIBLE Group (Collapsed behind toggle by default) */}
        <section
          className="result-group group-not-eligible-section"
          aria-labelledby="heading-not-eligible"
        >
          <div className="not-eligible-toggle-wrapper">
            <button
              type="button"
              id="toggle-not-eligible-button"
              className="toggle-not-eligible-btn"
              onClick={() => setShowNotEligible((prev) => !prev)}
              aria-expanded={showNotEligible}
            >
              <div className="toggle-btn-left">
                <span className="status-indicator-dot not-eligible-dot" />
                <span id="heading-not-eligible" className="toggle-heading-text">
                  {showNotEligible
                    ? `Hide not eligible (${notEligibleCount})`
                    : `Show not eligible (${notEligibleCount})`}
                </span>
              </div>
              {showNotEligible ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          </div>

          {showNotEligible && (
            <div className="not-eligible-content-expanded">
              {notEligibleCount === 0 ? (
                <p className="group-empty-hint">No schemes marked as not eligible.</p>
              ) : (
                <div className="scheme-grid">
                  {notEligibleGroup.map((scheme) => (
                    <SchemeCard key={scheme.schemeId} scheme={scheme} />
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      <div className="results-bottom-actions">
        <button
          type="button"
          className="primary-button"
          onClick={() => navigate('/profile')}
        >
          <ArrowLeft size={16} /> Edit Profile & Recheck
        </button>
      </div>
    </div>
  )
}