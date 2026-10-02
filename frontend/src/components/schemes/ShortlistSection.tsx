import { Bookmark, Sparkles } from 'lucide-react'
import type { SchemeResult } from '../../types/eligibility'

interface ShortlistSectionProps {
  results: SchemeResult[]
  bestSchemeId?: string | null
}

export function ShortlistSection({ results, bestSchemeId }: ShortlistSectionProps) {
  // Filter shortlisted items
  const shortlistedItems = (results || []).filter((r) => r.shortlisted)

  if (shortlistedItems.length === 0) {
    return null
  }

  // Order ELIGIBLE first, then NEEDS_MORE_INFORMATION
  const sortedShortlist = [...shortlistedItems].sort((a, b) => {
    if (a.status === 'ELIGIBLE' && b.status !== 'ELIGIBLE') return -1
    if (a.status !== 'ELIGIBLE' && b.status === 'ELIGIBLE') return 1
    return 0
  })

  return (
    <section className="shortlist-section" aria-label="Your Scholarship Shortlist">
      <div className="shortlist-header">
        <div className="shortlist-title-group">
          <Bookmark size={18} className="shortlist-icon" />
          <h2>Your Scholarship Shortlist</h2>
          <span className="shortlist-count-badge">{sortedShortlist.length}</span>
        </div>
        <p className="shortlist-intro">
          Quick reference list of schemes you qualify for or can unlock with further details.
        </p>
      </div>

      <div className="shortlist-items-container">
        {sortedShortlist.map((scheme) => {
          const isEligible = scheme.status === 'ELIGIBLE'
          const isBest = bestSchemeId && scheme.schemeId === bestSchemeId

          return (
            <div
              key={`shortlist-${scheme.schemeId}`}
              className={`shortlist-chip ${isEligible ? 'shortlist-chip-eligible' : 'shortlist-chip-needs-info'} ${
                isBest ? 'shortlist-chip-best' : ''
              }`}
            >
              <span className="shortlist-symbol" aria-hidden="true">
                {isEligible ? '✓' : '?'}
              </span>
              <span className="shortlist-name">{scheme.schemeName}</span>
              {isBest && (
                <span className="shortlist-best-tag">
                  <Sparkles size={11} /> Best Match
                </span>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
