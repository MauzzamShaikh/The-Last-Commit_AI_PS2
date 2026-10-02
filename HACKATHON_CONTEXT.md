# HACKATHON_CONTEXT.md

## Problem Statement
**Scholarship and Scheme Eligibility Assistant**

Students and families often miss scholarships and welfare schemes they qualify for because eligibility rules are spread across long documents and contain many conditions such as income limits, category, state of residence, course, year of study, and required documents. Reading and interpreting all of this is slow, and a small misunderstanding can lead to a wasted application or a missed opportunity.

**Objective:** Build an AI-powered assistant that matches a user's profile against a **curated set of scholarship and scheme rules** and uses an LLM to reason over the rule text. For each scheme, it must classify the result as **Eligible, Not Eligible, or Needs More Information**, cite the **exact rule clause** behind the decision, and list **missing details or documents** required to complete the decision.

## Problem Understanding
This is an **explainable eligibility-matching system**, not just a chatbot. The core value is:
**Profile → Rule matching/reasoning → Eligibility status → Evidence/citation → Missing information/documents → Shortlist**

## Target User
Primary: **Students and their families** seeking scholarships/schemes.

## Proposed Solution
A web-based assistant where a user enters their profile, the system checks it against a curated scholarship/scheme dataset, uses deterministic checks where possible plus an LLM for natural-language rule reasoning, and returns evidence-backed eligibility results.

**Assumption:** The MVP uses a curated, limited dataset rather than claiming complete coverage of all schemes.

## MVP
- Student profile form
- Curated scholarship/scheme dataset
- Eligibility evaluation
- Three required statuses:
  - Eligible
  - Not Eligible
  - Needs More Information
- Exact rule-clause evidence/citation
- Missing information and required documents
- Shortlist/results view

## Must-Have Features
- Profile input for fields used by the curated rules
- Matching against scheme rules
- LLM-based reasoning over rule text
- Evidence-backed explanation for each verdict
- Missing information/documents for incomplete cases
- Clear shortlist of results

## Features We Are Cutting
- Live web scraping / automatic scheme discovery
- Full nationwide/comprehensive scheme coverage
- User authentication/accounts
- Mobile app
- Automatic application submission
- Document OCR/verification
- Deadline/reminder system
- Admin dashboard
- Unnecessary complex infrastructure

These may be future extensions, not MVP requirements.

## Tech Stack
**Assumption / implementation choice:**
- Frontend: Streamlit (or existing team web stack if already established)
- Backend: Python
- Data: JSON/SQLite
- AI: LLM API
- Deployment: simplest reliable option available during the hackathon

## Architecture
**Frontend → Backend → Candidate Scheme Retrieval → Rule/Eligibility Engine → LLM Reasoning/Explanation → Results**

The scholarship/scheme rule data remains the source of truth. The LLM interprets rule text and explains decisions; it should not invent rules.

## Data Flow
1. User enters profile.
2. System selects relevant curated schemes.
3. Known structured conditions are evaluated.
4. Rule text is supplied to the LLM for natural-language reasoning where needed.
5. System assigns Eligible / Not Eligible / Needs More Information.
6. Result includes supporting rule clause, missing information/documents, and scheme shortlist.

## AI/ML Components
- LLM for reasoning over scholarship/scheme rule text
- LLM for grounded, user-readable explanations
- Structured output for consistent result fields

**Important:** LLM outputs must be grounded in the provided rule text.

## External APIs
- **LLM API:** required by the solution; provider is **TBD**
- No other external API is required for the MVP.

## Team Responsibilities
**Assumption: 3-person team**
- Person 1: scholarship data + rule/eligibility engine + backend
- Person 2: frontend + results/evidence UI
- Person 3: LLM integration + prompt/structured output + end-to-end integration

All members: testing, debugging, and demo preparation.

## Development Plan
**9:00–10:00:** Freeze scope + prepare curated scheme data  
**10:00–11:30:** Build frontend, backend/rules, and LLM integration in parallel  
**11:30–12:15:** First end-to-end working flow  
**12:15–1:30:** Evidence, missing-info handling, UI polish, reliability  
**1:30–2:30:** Test edge cases + prepare 3 demo profiles  
**2:30–3:00:** Freeze features + rehearse demo/pitch

## Current Status
**Planning complete; implementation not started.**

## Known Risks
- LLM hallucination or unsupported eligibility claims
- API/network failure during demo
- Incorrect handling of missing information
- Rule interpretation edge cases/boundaries
- Citation/evidence not matching the verdict
- Scope creep within the 6-hour limit

## Demo Flow
1. Enter a realistic student profile.
2. Run eligibility check.
3. Show an **Eligible** scheme with matched rules.
4. Show a **Not Eligible** scheme with the failed rule quoted/cited.
5. Show a **Needs More Information** scheme with the missing field/document.
6. Show the final shortlist.

## Likely Judge Questions
- How do you prevent LLM hallucinations?
- What is the source of truth for eligibility decisions?
- Why is **Needs More Information** separate from Not Eligible?
- How are exact rule citations produced?
- How would the system scale to more schemes/documents?
- What happens if the LLM/API is unavailable?
- What part is AI and what part is deterministic?

## Important Technical Decisions
- **Hybrid approach:** deterministic checks for structured conditions + LLM for natural-language rule reasoning/explanation.
- **Grounded AI:** provide the relevant rule text to the LLM; do not ask it to rely on memory.
- **Three-state result model:** Eligible / Not Eligible / Needs More Information.
- **Evidence first:** every verdict should point to the exact supporting rule clause.
- **Curated dataset for MVP:** reliability and demo quality take priority over broad coverage.
- **Keep architecture simple:** no unnecessary microservices, scraping pipeline, authentication, or complex retrieval infrastructure during the hackathon.
