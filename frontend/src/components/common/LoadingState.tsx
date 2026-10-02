import { Loader2, Sparkles, BookOpen, ShieldCheck } from 'lucide-react'

interface LoadingStateProps {
  message?: string
}

export function LoadingState({ message = 'Checking 51 schemes...' }: LoadingStateProps) {
  return (
    <div className="loading-state-wrapper" aria-live="polite">
      <div className="loading-card">
        <div className="loading-spinner-container">
          <Loader2 size={40} className="spin main-spinner" />
          <Sparkles size={20} className="sparkle-accent" />
        </div>

        <p className="eyebrow">INTELLIGENT MATCHING IN PROGRESS</p>
        <h2 className="loading-title">{message}</h2>
        <p className="loading-description">
          We are evaluating your criteria against all national and state scholarship regulations,
          verifying rules, and synthesizing personalized recommendations.
        </p>

        {/* Skeleton items */}
        <div className="skeleton-container" aria-hidden="true">
          <div className="skeleton-bar skeleton-title" />
          <div className="skeleton-grid">
            <div className="skeleton-card" />
            <div className="skeleton-card" />
          </div>
        </div>

        <div className="loading-footer-note">
          <span>
            <BookOpen size={14} /> Evaluating state and central portals
          </span>
          <span>
            <ShieldCheck size={14} /> Safe & private profile analysis
          </span>
        </div>
      </div>
    </div>
  )
}
