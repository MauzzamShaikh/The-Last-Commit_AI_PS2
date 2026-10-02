import { useState, useCallback } from 'react'
import { checkEligibility, ApiRequestError } from '../services/api'
import type {
  Recommendation,
  SchemeResult,
  StudentProfile,
} from '../types/eligibility'
import { emptyProfile } from '../utils/emptyProfile'

export interface EligibilityError {
  message: string
  details?: string[]
}

const STORAGE_KEY_PROFILE = 'scholar_lens_profile'
const STORAGE_KEY_RESULTS = 'scholar_lens_results'
const STORAGE_KEY_RECOMMENDATION = 'scholar_lens_recommendation'

export function useEligibility() {
  const [profile, setProfileState] = useState<StudentProfile>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY_PROFILE)
      if (saved) return JSON.parse(saved)
    } catch {
      // Ignore storage errors
    }
    return emptyProfile
  })

  const [results, setResultsState] = useState<SchemeResult[] | null>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY_RESULTS)
      if (saved) return JSON.parse(saved)
    } catch {
      // Ignore storage errors
    }
    return null
  })

  const [recommendation, setRecommendationState] = useState<Recommendation | null>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY_RECOMMENDATION)
      if (saved) return JSON.parse(saved)
    } catch {
      // Ignore storage errors
    }
    return null
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<EligibilityError | null>(null)

  // Sync profile changes to sessionStorage
  const setProfile = useCallback((updater: StudentProfile | ((prev: StudentProfile) => StudentProfile)) => {
    setProfileState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      try {
        sessionStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(next))
      } catch {
        // Ignore storage errors
      }
      return next
    })
  }, [])

  const run = useCallback(async (profileToRun: StudentProfile): Promise<boolean> => {
    setLoading(true)
    setError(null)
    setProfile(profileToRun)

    try {
      const response = await checkEligibility(profileToRun)
      setResultsState(response.results)
      setRecommendationState(response.recommendation)

      try {
        sessionStorage.setItem(STORAGE_KEY_RESULTS, JSON.stringify(response.results))
        sessionStorage.setItem(STORAGE_KEY_RECOMMENDATION, JSON.stringify(response.recommendation))
      } catch {
        // Ignore storage errors
      }

      return true
    } catch (caughtError: unknown) {
      // Never show fake or cached results on error
      setResultsState(null)
      setRecommendationState(null)
      try {
        sessionStorage.removeItem(STORAGE_KEY_RESULTS)
        sessionStorage.removeItem(STORAGE_KEY_RECOMMENDATION)
      } catch {
        // Ignore storage errors
      }

      if (caughtError instanceof ApiRequestError) {
        setError({
          message: caughtError.message,
          details: caughtError.details,
        })
      } else {
        setError({
          message: "Couldn't reach the server",
        })
      }
      return false
    } finally {
      setLoading(false)
    }
  }, [setProfile])

  const retry = useCallback(async (): Promise<boolean> => {
    return run(profile)
  }, [run, profile])

  const reset = useCallback(() => {
    setResultsState(null)
    setRecommendationState(null)
    setError(null)
    setLoading(false)
    try {
      sessionStorage.removeItem(STORAGE_KEY_RESULTS)
      sessionStorage.removeItem(STORAGE_KEY_RECOMMENDATION)
    } catch {
      // Ignore storage errors
    }
  }, [])

  return {
    profile,
    setProfile,
    results,
    recommendation,
    loading,
    error,
    run,
    retry,
    reset,
  }
}