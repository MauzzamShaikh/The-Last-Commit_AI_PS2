import { CheckCircle2, XCircle, HelpCircle, FileText } from 'lucide-react'
import type { EvidenceItem, RuleEvaluation } from '../../types/eligibility'

interface EvidencePanelProps {
  evidence?: EvidenceItem[]
  matchedRules?: RuleEvaluation[]
  failedRules?: RuleEvaluation[]
}

export function EvidencePanel({
  evidence = [],
  matchedRules = [],
  failedRules = [],
}: EvidencePanelProps) {
  if (!evidence || evidence.length === 0) {
    return (
      <div className="evidence-empty">
        <FileText size={16} />
        <p>No rule evidence available for this scheme.</p>
      </div>
    )
  }

  const matchedSet = new Set(matchedRules.map((r) => r.ruleId))
  const failedSet = new Set(failedRules.map((r) => r.ruleId))

  return (
    <div className="evidence-panel-wrapper">
      <div className="evidence-list" aria-label="Official rule evidence and clauses">
        {evidence.map((item, index) => {
          const isMatched = matchedSet.has(item.ruleId)
          const isFailed = failedSet.has(item.ruleId)

          let statusTone = 'unknown'
          let statusLabel = 'Information Pending'
          let StatusIcon = HelpCircle

          if (isMatched) {
            statusTone = 'pass'
            statusLabel = 'Rule Condition Met'
            StatusIcon = CheckCircle2
          } else if (isFailed) {
            statusTone = 'fail'
            statusLabel = 'Rule Condition Failed'
            StatusIcon = XCircle
          }

          return (
            <article className={`evidence-item evidence-${statusTone}`} key={`${item.ruleId || index}`}>
              <div className="evidence-heading">
                <div className="evidence-rule-meta">
                  <span className="rule-id">{item.ruleId || 'Rule'}</span>
                  {item.section && <span className="evidence-section-tag">{item.section}</span>}
                </div>
                <span className={`evidence-badge evidence-badge-${statusTone}`}>
                  <StatusIcon size={13} aria-hidden="true" />
                  <span>{statusLabel}</span>
                </span>
              </div>

              {item.clause ? (
                <blockquote className="evidence-clause">“{item.clause}”</blockquote>
              ) : (
                <blockquote className="evidence-clause evidence-clause-missing">
                  (No clause text provided)
                </blockquote>
              )}

              <div className="evidence-footer">
                <span className="evidence-source-label">
                  <strong>Source:</strong> {item.source || 'Official Guidelines'}
                </span>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}