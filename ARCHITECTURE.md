# ARCHITECTURE.md

# 1. System Overview

A web-based **Scholarship and Scheme Eligibility Assistant**. A student enters their profile; the system matches it against a **curated set of scholarship/scheme rules**, evaluates the applicable conditions, and uses an LLM to reason over natural-language rule text where needed.

Each scheme returns one of:
- **Eligible**
- **Not Eligible**
- **Needs More Information**

Results include the **exact rule clause** behind the verdict plus missing information/documents needed to complete an uncertain decision.

**Source of truth:** curated scheme/rule data. The LLM interprets and explains supplied rules; it must not invent requirements.

**Assumption:** MVP uses a limited curated dataset, not complete coverage of all scholarships/schemes.

# 2. Core User Flow

```text
User
 ↓
React profile form
 ↓
POST /api/eligibility/check
 ↓
Express backend
 ↓
Retrieve relevant schemes from MongoDB
 ↓
Deterministic rule checks
 ↓
LLM reasoning over supplied rule text
 ↓
Normalize result:
Eligible / Not Eligible / Needs More Information
 ↓
Attach exact rule evidence + missing information/documents
 ↓
Return shortlist/results
 ↓
React results UI
 ↓
User
```

# 3. System Architecture

```text
┌──────────────┐
│     User     │
└──────┬───────┘
       ↓
┌──────────────────────┐
│ React + Vite         │
│ Profile / Results UI │
└──────┬───────────────┘
       │ JSON/HTTPS
       ↓
┌────────────────────────────┐
│ Node.js + Express API      │
│ Eligibility Orchestrator   │
└──────┬─────────────┬───────┘
       │             │
       ↓             ↓
┌──────────────┐  ┌────────────────┐
│ Rule Engine  │  │ LLM Service    │
│              │  │ Reason +       │
│ Structured   │  │ explain rules  │
│ conditions   │  │                │
└──────┬───────┘  └───────┬────────┘
       │                  │ HTTPS
       └─────────┬────────┘
                 ↓
        ┌──────────────────┐
        │ MongoDB          │
        │ Schemes + Rules  │
        └──────────────────┘
                 +
        ┌──────────────────┐
        │ External LLM API │
        └──────────────────┘
```

# 4. Technology Stack

- **Frontend — React + Vite:** fast single-page UI for profile entry, results, evidence, and shortlist.
- **Backend — Node.js + Express:** simple REST API and orchestration layer; keeps the project within the MERN stack.
- **Database — MongoDB:** flexible documents for schemes with different rule structures; MongoDB Atlas can host the demo data.
- **AI/ML — LLM API:** interprets natural-language eligibility rules and produces grounded explanations.
- **External APIs — LLM API only:** no live government API or scraping dependency for the MVP.
- **Authentication — None:** not needed for the core hackathon flow.
- **Deployment — Vercel + Render/Railway + MongoDB Atlas (optional):** simple hosted deployment; local demo must remain possible.

# 5. Frontend Architecture

### `ProfilePage`
Collect profile fields used by the curated rules and submit the eligibility check.

### `ResultsPage`
Display scheme results and the shortlist.

### `SchemeCard`
Show scheme name, status, matched/failed conditions, missing information, documents, and access to evidence.

### `EvidencePanel`
Show the exact rule clause and source metadata used for the decision.

### `LoadingState` / `ErrorState`
Show request progress and API/LLM failures without fabricating results.

Minimum frontend state:
```text
profile, results, loading, error
```

# 6. Backend Architecture

## API routes
- `GET /api/health` — backend health check.
- `GET /api/schemes` — list active curated schemes.
- `GET /api/schemes/:id` — return one scheme, rules, documents, and source.
- `POST /api/eligibility/check` — evaluate a profile against relevant schemes.

## Services
- **`schemeService`** — read/filter curated schemes from MongoDB.
- **`ruleEngine`** — deterministic checks for structured conditions such as income, state, course, year, category, and percentage.
- **`eligibilityService`** — orchestrate retrieval, rule checks, LLM reasoning, and final status.
- **`llmService`** — send profile + relevant rule text to the LLM and request structured output.
- **`responseService`** — normalize output and attach evidence, missing information, documents, and shortlist flag.

## Model
### `Scheme`
```text
_id
name
description
rules[]
documents[]
source
sourceUrl
active
```

### Embedded `Rule`
```text
ruleId
field
operator
value
text
section
priority
```

### Request-only `Profile`
```text
course
year
state
category
familyIncome
academicPercentage
domicileStatus
otherFields
```

## Suggested backend structure
```text
server/
├── routes/
├── controllers/
├── services/
├── models/
├── prompts/
└── utils/
```

Keep this as a single Express backend; no microservices.

# 7. Database Design

## Collection: `schemes`

One document per scholarship/scheme.

```json
{
  "_id": "SCH001",
  "name": "Example Scholarship",
  "description": "Short description",
  "rules": [
    {
      "ruleId": "SCH001-R01",
      "field": "familyIncome",
      "operator": "<=",
      "value": 600000,
      "text": "Annual family income must not exceed ₹6 lakh.",
      "section": "Eligibility Criteria"
    }
  ],
  "documents": ["Income Certificate", "Domicile Certificate"],
  "source": "Official scheme guideline",
  "sourceUrl": "https://example.com/source",
  "active": true
}
```

Important decisions:
- Every rule gets a stable `ruleId`.
- Store original rule `text`.
- Store source/section for evidence.
- Keep the curated dataset small and manually testable.

**No user collection for MVP.** Profiles need not be persisted.

# 8. API Contracts

## 8.1 Health Check

**Method:** `GET`  
**Endpoint:** `/api/health`  
**Purpose:** Verify backend availability.

**Request:**
```json
{}
```

**Response:**
```json
{ "status": "ok" }
```

## 8.2 List Schemes

**Method:** `GET`  
**Endpoint:** `/api/schemes`  
**Purpose:** Return active curated schemes.

**Request:**
```json
{}
```

**Response:**
```json
{
  "schemes": [
    {
      "id": "SCH001",
      "name": "Example Scholarship",
      "description": "Short description"
    }
  ]
}
```

## 8.3 Get Scheme

**Method:** `GET`  
**Endpoint:** `/api/schemes/:id`  
**Purpose:** Return a scheme's rules, documents, and source.

**Request:**
```json
{}
```

**Response:**
```json
{
  "id": "SCH001",
  "name": "Example Scholarship",
  "rules": [
    {
      "ruleId": "SCH001-R01",
      "text": "Annual family income must not exceed ₹6 lakh.",
      "section": "Eligibility Criteria"
    }
  ],
  "documents": ["Income Certificate"],
  "source": "Official scheme guideline",
  "sourceUrl": "https://example.com/source"
}
```

## 8.4 Check Eligibility

**Method:** `POST`  
**Endpoint:** `/api/eligibility/check`  
**Purpose:** Evaluate the profile against the curated schemes and return explainable results.

**Request:**
```json
{
  "profile": {
    "course": "B.Tech",
    "year": 2,
    "state": "Maharashtra",
    "category": "OBC",
    "familyIncome": 450000,
    "academicPercentage": 78,
    "domicileStatus": "Yes"
  }
}
```

**Response:**
```json
{
  "results": [
    {
      "schemeId": "SCH001",
      "schemeName": "Example Scholarship",
      "status": "ELIGIBLE",
      "matchedRules": [
        {
          "ruleId": "SCH001-R01",
          "reason": "Family income satisfies the rule."
        }
      ],
      "failedRules": [],
      "missingInformation": [],
      "requiredDocuments": ["Income Certificate"],
      "evidence": [
        {
          "ruleId": "SCH001-R01",
          "clause": "Annual family income must not exceed ₹6 lakh.",
          "section": "Eligibility Criteria",
          "source": "Official scheme guideline"
        }
      ],
      "shortlisted": true
    }
  ]
}
```

### Allowed status values
```text
ELIGIBLE
NOT_ELIGIBLE
NEEDS_MORE_INFORMATION
```

### Status rules
- **ELIGIBLE:** required conditions are satisfied and enough information is available.
- **NOT_ELIGIBLE:** at least one applicable condition clearly fails.
- **NEEDS_MORE_INFORMATION:** a required condition cannot be decided because needed information is missing/unknown.

### Internal LLM request

```json
{
  "profile": {},
  "scheme": {
    "name": "Example Scholarship",
    "rules": [
      {
        "ruleId": "SCH001-R01",
        "text": "Annual family income must not exceed ₹6 lakh."
      }
    ]
  }
}
```

### Internal LLM response

```json
{
  "status": "ELIGIBLE",
  "matchedRuleIds": ["SCH001-R01"],
  "failedRuleIds": [],
  "missingInformation": [],
  "reason": "The supplied profile satisfies the provided rule text."
}
```

The backend validates and normalizes the LLM response before returning it to the frontend.
