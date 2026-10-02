import type { StudentProfile } from '../types/eligibility'

export const defaultDocuments: Record<string, string> = {
  'Income Certificate': 'UNKNOWN',
  'Caste Certificate': 'UNKNOWN',
  'Domicile Certificate': 'UNKNOWN',
  'Latest Marksheet': 'UNKNOWN',
  'Disability Certificate': 'UNKNOWN',
  'Identity Document': 'UNKNOWN',
}

export const emptyProfile: StudentProfile = {
  fullName: '',
  age: undefined,
  gender: 'Unknown',
  state: undefined,
  domicileStatus: 'Unknown',
  domicileState: undefined,
  course: undefined,
  branch: '',
  year: undefined,
  institutionType: 'Unknown',
  academicPercentage: undefined,
  category: undefined,
  familyIncome: undefined,
  disabilityStatus: 'No',
  minorityStatus: 'Unknown',
  admissionType: 'Unknown',
  documents: { ...defaultDocuments },
}

export const demoProfile: StudentProfile = {
  fullName: 'Aditya Patil',
  age: 20,
  gender: 'Male',
  state: 'Maharashtra',
  domicileStatus: 'Yes',
  domicileState: 'Maharashtra',
  course: 'B.Tech',
  branch: 'Computer Engineering',
  year: 2,
  institutionType: 'Government',
  academicPercentage: 78,
  category: 'OBC',
  familyIncome: 450000,
  disabilityStatus: 'No',
  minorityStatus: 'No',
  admissionType: 'Merit',
  documents: {
    'Income Certificate': 'AVAILABLE',
    'Caste Certificate': 'AVAILABLE',
    'Domicile Certificate': 'AVAILABLE',
    'Latest Marksheet': 'AVAILABLE',
    'Disability Certificate': 'UNKNOWN',
    'Identity Document': 'AVAILABLE',
  },
}

export function cleanProfileForRequest(profile: StudentProfile): Record<string, unknown> {
  const payload: Record<string, unknown> = {}

  if (profile.course && profile.course.trim() !== '') {
    payload.course = profile.course.trim()
  }

  if (profile.year !== undefined && profile.year !== null && !Number.isNaN(profile.year)) {
    payload.year = Number(profile.year)
  }

  if (profile.state && profile.state.trim() !== '') {
    payload.state = profile.state.trim()
  }

  if (profile.category && profile.category.trim() !== '') {
    payload.category = profile.category.trim()
  }

  if (
    profile.familyIncome !== undefined &&
    profile.familyIncome !== null &&
    !Number.isNaN(profile.familyIncome)
  ) {
    payload.familyIncome = Number(profile.familyIncome)
  }

  if (
    profile.academicPercentage !== undefined &&
    profile.academicPercentage !== null &&
    !Number.isNaN(profile.academicPercentage)
  ) {
    payload.academicPercentage = Number(profile.academicPercentage)
  }

  if (profile.domicileStatus && profile.domicileStatus.trim() !== '') {
    payload.domicileStatus = profile.domicileStatus.trim()
  }

  return payload
}