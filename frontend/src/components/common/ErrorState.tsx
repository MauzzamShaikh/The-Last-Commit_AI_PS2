import { AlertTriangle, RotateCcw, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

interface ErrorStateProps {
  message?: string
  details?: string[]
  onRetry: () => void
  onEditProfile?: () => void
}

export function ErrorState({
  message = "Couldn't reach the server",
  details,
  onRetry,
  onEditProfile,
}: ErrorStateProps) {
  return (
    <div className="error-state-container page-width" role="alert">
      <div className="error-card">
        <div className="error-icon-wrapper">
          <AlertTriangle size={36} />
        </div>

        <p className="eyebrow">ERROR OCCURRED</p>
        <h2 className="error-title">{message}</h2>

        {details && details.length > 0 && (
          <div className="error-details-box">
            <p className="error-details-heading">Details reported by server:</p>
            <ul className="error-details-list">
              {details.map((detail, idx) => (
                <li key={`error-detail-${idx}`}>{detail}</li>
              ))}
            </ul>
          </div>
        )}

        {!details && (
          <p className="error-explanation">
            We could not complete the eligibility check at this moment. Your entered profile data is
            intact. You can retry immediately or return to edit your profile.
          </p>
        )}

        <div className="error-actions">
          <button type="button" className="primary-button error-retry-button" onClick={onRetry}>
            <RotateCcw size={16} /> Retry Check
          </button>
          {onEditProfile ? (
            <button type="button" className="secondary-button" onClick={onEditProfile}>
              <ArrowLeft size={16} /> Back to Profile
            </button>
          ) : (
            <Link className="secondary-button" to="/profile">
              <ArrowLeft size={16} /> Back to Profile
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
