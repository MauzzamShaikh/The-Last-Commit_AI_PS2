import { ArrowRight, Check, CircleHelp, FileSearch, X } from 'lucide-react'
import { Link } from 'react-router-dom'

const outcomes = [
  { label: 'Eligible', Icon: Check, tone: 'green' },
  { label: 'Needs more information', Icon: CircleHelp, tone: 'amber' },
  { label: 'Not eligible', Icon: X, tone: 'red' },
]

export function HomePage() {
  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="hero-content">
          <p className="hero-kicker">
            <span className="kicker-mark" /> SCHOLARSHIP & SCHEME GUIDE
          </p>
          <h1>
            Find scholarships
            <br />
            you may qualify for.
          </h1>
          <p className="hero-description">
            Share a little about your studies and circumstances. See relevant schemes, why they
            match, and what you may still need.
          </p>
          <Link className="primary-button hero-button" to="/profile">
            Check my eligibility <ArrowRight size={17} />
          </Link>
          <p className="hero-footnote">
            <ShieldIcon /> Takes about 2 minutes · No account needed
          </p>
        </div>
        <div className="hero-caption">
          <span>STUDENT OPPORTUNITY DESK</span>
          <span>ScholarLens</span>
        </div>
      </section>
      <section className="home-proof" aria-label="How results are presented">
        <div className="proof-heading">
          <p className="eyebrow">Clear answers, not guesswork</p>
          <h2>Every result has a next step.</h2>
        </div>
        <div className="outcome-list">
          {outcomes.map(({ label, Icon, tone }) => (
            <div className={`outcome-item outcome-${tone}`} key={label}>
              <Icon size={17} />
              <span>{label}</span>
            </div>
          ))}
        </div>
        <div className="proof-note">
          <FileSearch size={17} />
          <span>
            Results cite the relevant scheme rule and source.
            <br />
            <strong>We show what is known, and what is not.</strong>
          </span>
        </div>
      </section>
      <div className="home-data-note">
        <span className="demo-dot" /> Evaluates 51 government and institutional schemes in real-time.
      </div>
    </div>
  )
}

function ShieldIcon() {
  return (
    <span className="shield-dot" aria-hidden="true">
      ✓
    </span>
  )
}