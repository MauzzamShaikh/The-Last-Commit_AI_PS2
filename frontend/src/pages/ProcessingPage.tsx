import { LoadingState } from '../components/common/LoadingState'

export function ProcessingPage({ loading = true }: { loading?: boolean }) {
  return (
    <div className="page-width">
      <LoadingState message={loading ? 'Checking 51 schemes...' : 'Your results are ready'} />
    </div>
  )
}