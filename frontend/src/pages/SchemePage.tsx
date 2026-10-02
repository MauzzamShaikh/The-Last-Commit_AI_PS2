import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { SchemeCard } from '../components/schemes/SchemeCard'
import type { SchemeResult } from '../types/eligibility'

export function SchemePage({ results }: { results: SchemeResult[] | null }) {
  const { schemeId } = useParams()
  const scheme = results?.find((result) => result.schemeId === schemeId)
  if (!scheme) return <Navigate to={results ? '/results' : '/profile'} replace />
  return (
    <div className="page-width scheme-page-container" style={{ padding: '24px 0 48px' }}>
      <Link className="back-link" to="/results">
        <ArrowLeft size={16} /> Back to all results
      </Link>
      <div style={{ marginTop: '16px' }}>
        <SchemeCard scheme={scheme} />
      </div>
    </div>
  )
}