import { useState, type FormEvent, type ReactNode } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  Info,
  RotateCcw,
  Sparkles,
  UserRound,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import type { DomicileStatus, StudentProfile } from '../types/eligibility'
import { demoProfile, emptyProfile, defaultDocuments } from '../utils/emptyProfile'

const STATES = [
  'Maharashtra',
  'Karnataka',
  'Gujarat',
  'Tamil Nadu',
  'Delhi',
  'Uttar Pradesh',
  'Rajasthan',
  'Madhya Pradesh',
  'West Bengal',
  'Kerala',
  'Other',
] as const

const COURSES = [
  'B.Tech',
  'B.E.',
  'B.Pharm',
  'MBBS',
  'BDS',
  'MBA',
  'M.Tech',
  'M.Sc',
  'MA',
  'M.Com',
  'M.Pharm',
  'B.Sc',
  'B.Com',
  'BA',
  'Diploma',
  'ITI',
] as const

const CATEGORIES = [
  'General',
  'OBC',
  'SC',
  'ST',
  'EBC',
  'VJNT',
  'SBC',
  'Minority',
] as const

const YEARS = [1, 2, 3, 4, 5, 6] as const

const DOCUMENT_NAMES = [
  'Income Certificate',
  'Caste Certificate',
  'Domicile Certificate',
  'Latest Marksheet',
  'Disability Certificate',
  'Identity Document',
] as const

interface ProfilePageProps {
  initialProfile: StudentProfile
  loading?: boolean
  onSubmit: (profile: StudentProfile) => void
}

export function ProfilePage({ initialProfile, loading = false, onSubmit }: ProfilePageProps) {
  const [profile, setProfile] = useState<StudentProfile>(() => initialProfile || emptyProfile)
  const [errors, setErrors] = useState<{
    familyIncome?: string
    academicPercentage?: string
    year?: string
  }>({})

  function setField<Key extends keyof StudentProfile>(key: Key, value: StudentProfile[Key]) {
    setProfile((current) => ({ ...current, [key]: value }))
  }

  function validate(p: StudentProfile) {
    const nextErrors: {
      familyIncome?: string
      academicPercentage?: string
      year?: string
    } = {}

    if (p.familyIncome !== undefined && p.familyIncome !== null && !Number.isNaN(p.familyIncome)) {
      if (p.familyIncome < 0) {
        nextErrors.familyIncome = 'Annual family income must be 0 or greater.'
      }
    }

    if (
      p.academicPercentage !== undefined &&
      p.academicPercentage !== null &&
      !Number.isNaN(p.academicPercentage)
    ) {
      if (p.academicPercentage < 0 || p.academicPercentage > 100) {
        nextErrors.academicPercentage = 'Academic percentage must be between 0 and 100.'
      }
    }

    if (p.year !== undefined && p.year !== null && !Number.isNaN(p.year)) {
      if (p.year < 1 || p.year > 6) {
        nextErrors.year = 'Year of study must be between 1 and 6.'
      }
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function handleNumberChange(key: 'familyIncome' | 'academicPercentage' | 'year' | 'age', value: string) {
    const trimmed = value.trim()
    const num = trimmed === '' ? undefined : Number(trimmed)
    setField(key, num)
  }

  function handleDocumentChange(name: string, status: string) {
    const currentDocs = profile.documents || { ...defaultDocuments }
    setField('documents', {
      ...currentDocs,
      [name]: status,
    })
  }

  function handleLoadDemo() {
    setProfile({ ...demoProfile })
    setErrors({})
  }

  function handleReset() {
    setProfile({ ...emptyProfile })
    setErrors({})
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!validate(profile)) {
      return
    }
    onSubmit(profile)
  }

  const summaryIncome =
    profile.familyIncome !== undefined && profile.familyIncome !== null
      ? `₹${Number(profile.familyIncome).toLocaleString('en-IN')} annual income`
      : 'Not provided annual income'

  const docs = profile.documents || defaultDocuments

  return (
    <div className="profile-page page-width">
      <div className="profile-top-bar">
        <Link className="back-link" to="/">
          <ArrowLeft size={16} /> Back to home
        </Link>
        <div className="demo-actions">
          <button
            type="button"
            className="demo-button"
            id="load-demo-button"
            onClick={handleLoadDemo}
            title="Load demo student profile"
          >
            <Sparkles size={14} /> Load demo profile
          </button>
          <button
            type="button"
            className="clear-button"
            onClick={handleReset}
            title="Clear all fields"
          >
            <RotateCcw size={13} /> Reset
          </button>
        </div>
      </div>

      <div className="page-heading">
        <p className="eyebrow">YOUR PROFILE <span>·</span> ABOUT 2 MIN</p>
        <h1>Tell us about yourself.</h1>
        <p>
          Share only what helps us find relevant scholarships. All fields are optional—you can mark
          anything you are unsure about as Unknown.
        </p>
      </div>

      <form className="profile-form" onSubmit={handleSubmit} noValidate>
        {/* SECTION 01: PERSONAL */}
        <section className="form-section" aria-labelledby="personal-title">
          <SectionHeading
            icon={<UserRound size={17} />}
            eyebrow="SECTION 01"
            title="Personal"
            id="personal-title"
          />
          <div className="form-grid form-grid-three">
            <Field label="Full name" hint="Optional">
              <input
                id="field-fullname"
                value={profile.fullName || ''}
                onChange={(e) => setField('fullName', e.target.value)}
                autoComplete="name"
                placeholder="Your name"
              />
            </Field>

            <Field label="Age (in years)" hint="Optional">
              <input
                id="field-age"
                type="number"
                min="10"
                max="100"
                value={profile.age ?? ''}
                onChange={(e) => handleNumberChange('age', e.target.value)}
                placeholder="e.g. 20"
              />
            </Field>

            <Field label="Gender" hint="Optional; only used when scheme criteria require it">
              <select
                id="field-gender"
                value={profile.gender || 'Unknown'}
                onChange={(e) => setField('gender', e.target.value)}
              >
                <option value="Unknown">Unknown</option>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </Field>

            <Field label="State of residence">
              <select
                id="field-state"
                value={profile.state || ''}
                onChange={(e) => setField('state', e.target.value || undefined)}
              >
                <option value="">Select state</option>
                {STATES.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Domicile status" hint="Yes / No / Unknown">
              <select
                id="field-domicile"
                value={profile.domicileStatus || 'Unknown'}
                onChange={(e) => setField('domicileStatus', (e.target.value as DomicileStatus) || undefined)}
              >
                <option value="Unknown">Unknown</option>
                <option value="Yes">Yes (Confirmed)</option>
                <option value="No">No (Not confirmed)</option>
              </select>
            </Field>

            <Field label="Domicile state" hint="Needed if domicile is confirmed">
              <select
                id="field-domicile-state"
                value={profile.domicileState || ''}
                onChange={(e) => setField('domicileState', e.target.value || undefined)}
              >
                <option value="">Select state</option>
                {STATES.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </section>

        {/* SECTION 02: ACADEMIC */}
        <section className="form-section" aria-labelledby="academic-title">
          <SectionHeading
            icon={<GraduationIcon />}
            eyebrow="SECTION 02"
            title="Academic"
            id="academic-title"
          />
          <div className="form-grid form-grid-three">
            <Field label="Course / degree">
              <select
                id="field-course"
                value={profile.course || ''}
                onChange={(e) => setField('course', e.target.value || undefined)}
              >
                <option value="">Select course</option>
                {COURSES.map((course) => (
                  <option key={course} value={course}>
                    {course}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Branch / stream" hint="Optional for branch-specific schemes">
              <input
                id="field-branch"
                value={profile.branch || ''}
                onChange={(e) => setField('branch', e.target.value)}
                placeholder="e.g. Computer Engineering"
              />
            </Field>

            <Field label="Year of study" hint="1 to 6">
              <select
                id="field-year"
                value={profile.year ?? ''}
                onChange={(e) => handleNumberChange('year', e.target.value)}
              >
                <option value="">Select year</option>
                {YEARS.map((y) => (
                  <option key={y} value={y}>
                    Year {y}
                  </option>
                ))}
              </select>
              {errors.year && <span className="field-error-text">{errors.year}</span>}
            </Field>

            <Field label="Institution type" hint="Optional for institution-specific schemes">
              <select
                id="field-institution-type"
                value={profile.institutionType || 'Unknown'}
                onChange={(e) => setField('institutionType', e.target.value)}
              >
                <option value="Unknown">Unknown</option>
                <option value="Government">Government</option>
                <option value="Private">Private</option>
                <option value="Aided">Aided</option>
                <option value="Other">Other</option>
              </select>
            </Field>

            <Field label="Academic percentage" hint="0 to 100%">
              <div className="input-suffix">
                <input
                  id="field-percentage"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="e.g. 78"
                  value={profile.academicPercentage ?? ''}
                  onChange={(e) => handleNumberChange('academicPercentage', e.target.value)}
                />
                <span>%</span>
              </div>
              {errors.academicPercentage && (
                <span className="field-error-text">{errors.academicPercentage}</span>
              )}
            </Field>
          </div>
        </section>

        {/* SECTION 03: ELIGIBILITY DETAILS */}
        <section className="form-section" aria-labelledby="eligibility-title">
          <SectionHeading
            icon={<Info size={17} />}
            eyebrow="SECTION 03"
            title="Eligibility details"
            id="eligibility-title"
          />
          <div className="form-grid form-grid-three">
            <Field label="Category">
              <select
                id="field-category"
                value={profile.category || ''}
                onChange={(e) => setField('category', e.target.value || undefined)}
              >
                <option value="">Select category</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Annual family income" hint="₹ per year">
              <div className="input-prefix">
                <span aria-hidden="true">₹</span>
                <input
                  id="field-income"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="e.g. 250000"
                  value={profile.familyIncome ?? ''}
                  onChange={(e) => handleNumberChange('familyIncome', e.target.value)}
                />
              </div>
              {errors.familyIncome && (
                <span className="field-error-text">{errors.familyIncome}</span>
              )}
            </Field>

            <Field label="Disability status">
              <select
                id="field-disability"
                value={profile.disabilityStatus || 'No'}
                onChange={(e) => setField('disabilityStatus', e.target.value)}
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
                <option value="Unknown">Unknown</option>
              </select>
            </Field>

            <Field label="Minority status">
              <select
                id="field-minority"
                value={profile.minorityStatus || 'Unknown'}
                onChange={(e) => setField('minorityStatus', e.target.value)}
              >
                <option value="Unknown">Unknown</option>
                <option value="No">No</option>
                <option value="Yes">Yes</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </Field>

            <Field label="Admission type">
              <select
                id="field-admission"
                value={profile.admissionType || 'Unknown'}
                onChange={(e) => setField('admissionType', e.target.value)}
              >
                <option value="Unknown">Unknown</option>
                <option value="Merit">Merit</option>
                <option value="Management">Management</option>
                <option value="Other">Other</option>
              </select>
            </Field>
          </div>
        </section>

        {/* SECTION 04: DOCUMENTS */}
        <section className="form-section document-form-section" aria-labelledby="documents-title">
          <SectionHeading
            icon={<FileText size={17} />}
            eyebrow="SECTION 04"
            title="Documents"
            id="documents-title"
          />
          <p className="form-section-intro">
            No uploads needed. Let us know which documents you already have.
          </p>
          <div className="document-input-grid">
            {DOCUMENT_NAMES.filter(
              (name) => name !== 'Disability Certificate' || profile.disabilityStatus === 'Yes'
            ).map((name) => (
              <label className="document-input" key={name}>
                <span>{name}</span>
                <select
                  aria-label={`${name} status`}
                  value={docs[name] || 'UNKNOWN'}
                  onChange={(e) => handleDocumentChange(name, e.target.value)}
                >
                  <option value="UNKNOWN">Unknown</option>
                  <option value="AVAILABLE">Available</option>
                  <option value="MISSING">Not available</option>
                </select>
              </label>
            ))}
          </div>
        </section>

        {/* SIDEBAR SUMMARY */}
        <section className="profile-summary" aria-label="Profile summary">
          <div className="summary-topline">
            <div>
              <p className="eyebrow">PROFILE SUMMARY</p>
              <h2>What we’ll use to look for matches</h2>
            </div>
            <span className="summary-icon">
              <Info size={17} />
            </span>
          </div>

          <div className="summary-facts">
            <span>{profile.state || 'State not selected'}</span>
            <span>{[profile.course, profile.branch].filter(Boolean).join(' ') || 'Course not selected'}</span>
            <span>{profile.year ? `Year ${profile.year}` : 'Year not selected'}</span>
            <span>{profile.category || 'Category not selected'}</span>
            <span>{profile.domicileStatus ? `Domicile: ${profile.domicileStatus}` : 'Domicile not selected'}</span>
            <span>{summaryIncome}</span>
            {profile.academicPercentage !== undefined && profile.academicPercentage !== null && (
              <span>{profile.academicPercentage}% marks</span>
            )}
          </div>

          <div className="summary-actions">
            <span>
              <ShieldSmall /> Your profile is used for this check only.
            </span>
            <button
              id="check-eligibility-button"
              className="primary-button"
              type="submit"
              disabled={loading || Object.keys(errors).length > 0}
            >
              {loading ? (
                <>
                  <span className="spinner-inline" /> Checking 51 schemes...
                </>
              ) : (
                <>
                  Find scholarships <ArrowRight size={17} />
                </>
              )}
            </button>
          </div>
        </section>
      </form>
    </div>
  )
}

function SectionHeading({
  icon,
  eyebrow,
  title,
  id,
}: {
  icon: ReactNode
  eyebrow: string
  title: string
  id: string
}) {
  return (
    <div className="section-heading">
      <span className="section-heading-icon">{icon}</span>
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2 id={id}>{title}</h2>
      </div>
    </div>
  )
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <label className="field">
      <span className="field-label">
        {label}
        {hint && <span className="optional-mark">{hint}</span>}
      </span>
      {children}
    </label>
  )
}

function GraduationIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m2 10 10-5 10 5-10 5-10-5Z" />
      <path d="M6 12v5c4 3 8 3 12 0v-5M22 10v6" />
    </svg>
  )
}

function ShieldSmall() {
  return (
    <span className="shield-dot" aria-hidden="true">
      ✓
    </span>
  )
}