import type { EligibilityResponse, StudentProfile } from '../types/eligibility'
import { cleanProfileForRequest } from '../utils/emptyProfile'

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '')

export class ApiRequestError extends Error {
  statusCode?: number
  details?: string[]

  constructor(message: string, statusCode?: number, details?: string[]) {
    super(message)
    this.name = 'ApiRequestError'
    this.statusCode = statusCode
    this.details = details
  }
}

export async function checkEligibility(
  profile: StudentProfile,
): Promise<EligibilityResponse> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000)

  const payloadProfile = cleanProfileForRequest(profile)

  try {
    const response = await fetch(`${API_BASE_URL}/api/eligibility/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ profile: payloadProfile }),
      signal: controller.signal,
    })

    if (!response.ok) {
      let responseBody: { error?: string; details?: string[] } | null = null
      try {
        responseBody = await response.json()
      } catch {
        // Response is not JSON
      }

      if (response.status === 400) {
        const errorMsg = responseBody?.error || 'Invalid profile'
        const details = Array.isArray(responseBody?.details) ? responseBody.details : undefined
        throw new ApiRequestError(errorMsg, 400, details)
      }

      const serverMsg = responseBody?.error || "Couldn't reach the server"
      throw new ApiRequestError(serverMsg, response.status)
    }

    const data = (await response.json()) as EligibilityResponse
    return {
      results: Array.isArray(data?.results) ? data.results : [],
      recommendation: data?.recommendation ?? null,
    }
  } catch (err: unknown) {
    if (err instanceof ApiRequestError) {
      throw err
    }
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new ApiRequestError('Request timed out after 30 seconds. Please try again.', 408)
    }
    throw new ApiRequestError("Couldn't reach the server")
  } finally {
    clearTimeout(timeoutId)
  }
}