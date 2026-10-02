import { Sparkles, Trophy, ArrowUpRight, AlertCircle, FileCheck, Layers } from 'lucide-react'
import type { Recommendation } from '../../types/eligibility'
import { formatCurrencyINR } from '../../utils/formatters'

interface RecommendationCardProps {
  recommendation: Recommendation | null
}

export function RecommendationCard({ recommendation }: RecommendationCardProps) {
  if (!recommendation) {
    return null
  }

  const {
    bestSchemeName,
    estimatedAnnualValue,
    reasoning,
    reasoningSource,
    ranking = [],
    couldBeBetter = [],
    caveat,
  } = recommendation

  return (
    <section className="recommendation-card" id="recommendation-card" aria-label="Best Scholarship Recommendation">
      <header className="recommendation-header">
        <div className="recommendation-badge">
          <Trophy size={16} />
          <span>Best match for you</span>
        </div>
        {reasoningSource === 'llm' && (
          <span className="recommendation-source-tag">
            <Sparkles size={12} /> AI Powered
          </span>
        )}
      </header>

      <div className="recommendation-main">
        <div className="recommendation-hero-info">
          <h2 className="recommendation-title">{bestSchemeName || 'Top Eligible Scheme'}</h2>
          <div className="recommendation-value-badge">
            <span className="value-label">Estimated Annual Value</span>
            <span className="value-amount">{formatCurrencyINR(estimatedAnnualValue)}</span>
            <span className="value-subtitle">(estimated)</span>
          </div>
        </div>

        {reasoning && (
          <div className="recommendation-reasoning">
            <p className="reasoning-text">{reasoning}</p>
          </div>
        )}
      </div>

      {/* Ranking List */}
      {ranking.length > 0 && (
        <div className="recommendation-ranking-section">
          <div className="ranking-header">
            <Layers size={15} />
            <h3>Eligible Schemes Ranking ({ranking.length})</h3>
          </div>
          <div className="ranking-list">
            {ranking.map((item) => (
              <div
                key={item.schemeId || `rank-${item.rank}`}
                className={`ranking-row ${item.rank === 1 ? 'ranking-row-top' : ''}`}
              >
                <span className="ranking-position">#{item.rank}</span>
                <div className="ranking-info">
                  <span className="ranking-name">{item.schemeName}</span>
                  <div className="ranking-meta">
                    {item.benefitType && <span className="meta-pill">{item.benefitType}</span>}
                    {item.frequency && <span className="meta-pill">{item.frequency}</span>}
                    <span className="meta-pill">
                      <FileCheck size={11} /> {item.documentCount} documents
                    </span>
                  </div>
                </div>
                <div className="ranking-value">
                  <span className="ranking-amount">{formatCurrencyINR(item.estimatedAnnualValue)}</span>
                  <span className="ranking-amount-label">estimated/yr</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Could Be Better - Unlock opportunities */}
      {couldBeBetter.length > 0 && (
        <div className="recommendation-unlock-section">
          <div className="unlock-header">
            <ArrowUpRight size={15} />
            <h3>Higher Value Opportunities with Missing Information</h3>
          </div>
          <ul className="unlock-list">
            {couldBeBetter.map((item, idx) => {
              const missingStr =
                item.missingInformation && item.missingInformation.length > 0
                  ? item.missingInformation.join(', ')
                  : 'additional details'
              const formattedVal = formatCurrencyINR(item.estimatedAnnualValue)
              return (
                <li key={item.schemeId || `unlock-${idx}`} className="unlock-item">
                  <AlertCircle size={15} className="unlock-icon" />
                  <span>
                    Provide <strong>{missingStr}</strong> to unlock <strong>{item.schemeName}</strong> (about {formattedVal}/year estimated).
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {/* Caveat */}
      {caveat && (
        <footer className="recommendation-caveat">
          <small>{caveat}</small>
        </footer>
      )}
    </section>
  )
}
