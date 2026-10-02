export type EligibilityStatus =
  | 'ELIGIBLE'
  | 'NOT_ELIGIBLE'
  | 'NEEDS_MORE_INFORMATION'

export type DomicileStatus = 'Yes' | 'No' | 'Unknown'

export interface StudentProfile {
  // Core contract fields
  course?: string
  year?: number
  state?: string
  category?: string
  familyIncome?: number
  academicPercentage?: number
  domicileStatus?: DomicileStatus

  // Detailed profile fields
  fullName?: string
  age?: number
  gender?: string
  domicileState?: string
  branch?: string
  institutionType?: string
  disabilityStatus?: string
  minorityStatus?: string
  admissionType?: string
  documents?: Record<string, string>
}

export interface RuleEvaluation {
  ruleId: string
  reason: string
}

export interface EvidenceItem {
  ruleId: string
  clause: string
  section: string
  source: string
}

export interface SchemeResult {
  schemeId: string
  schemeName: string
  status: EligibilityStatus
  matchedRules: RuleEvaluation[]
  failedRules: RuleEvaluation[]
  missingInformation: string[]
  requiredDocuments: string[]
  evidence: EvidenceItem[]
  shortlisted: boolean
  explanation: string
  explanationSource: 'llm' | 'template'
}

export interface RecommendationRankingItem {
  rank: number
  schemeId: string
  schemeName: string
  estimatedAnnualValue: number
  benefitType: string | null
  frequency: string | null
  documentCount: number
}

export interface CouldBeBetterItem {
  schemeId: string
  schemeName: string
  estimatedAnnualValue: number
  missingInformation: string[]
}

export interface Recommendation {
  bestSchemeId: string
  bestSchemeName: string
  estimatedAnnualValue: number
  ranking: RecommendationRankingItem[]
  couldBeBetter: CouldBeBetterItem[]
  caveat: string
  reasoning: string
  reasoningSource: 'llm' | 'template'
}

export interface EligibilityResponse {
  results: SchemeResult[]
  recommendation: Recommendation | null
}

export interface ApiErrorPayload {
  error: string
  details?: string[]
}