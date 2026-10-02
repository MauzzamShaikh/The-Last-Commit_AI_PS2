import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import type { EligibilityStatus } from '../../types/eligibility'

const statusConfig: Record<
  EligibilityStatus,
  {
    label: string
    tone: string
    Icon: typeof CheckCircle2
  }
> = {
  ELIGIBLE: {
    label: 'Eligible',
    tone: 'status-eligible',
    Icon: CheckCircle2,
  },
  NOT_ELIGIBLE: {
    label: 'Not Eligible',
    tone: 'status-not_eligible',
    Icon: XCircle,
  },
  NEEDS_MORE_INFORMATION: {
    label: 'Needs More Information',
    tone: 'status-needs_more_information',
    Icon: AlertCircle,
  },
}

export function StatusBadge({ status }: { status: EligibilityStatus }) {
  const config = statusConfig[status] || statusConfig.NEEDS_MORE_INFORMATION
  const IconComponent = config.Icon

  return (
    <span className={`status-badge ${config.tone}`}>
      <IconComponent size={14} strokeWidth={2.4} aria-hidden="true" />
      <span>{config.label}</span>
    </span>
  )
}