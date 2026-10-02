# Scholar Lens: Scholarship & Scheme Eligibility Assistant

Students and families often miss scholarships they qualify for because eligibility rules are buried in long documents. **[Project Name]** matches a student's profile against a curated set of scheme rules and returns, for every scheme:

- 🟢 **Eligible**
- 🔴 **Not Eligible**, with the exact failed rule quoted
- 🟡 **Needs More Information**, with exactly what is missing

Every verdict is backed by the **exact rule clause** (with section and source) and a list of **required documents**. If a student is eligible for several schemes, the app recommends the **best one** by estimated benefit and explains why.

## How it works

```text
Profile form (React)
   ↓  POST /api/eligibility/check
Express API
   ↓
Rule engine (deterministic): each rule → PASS / FAIL / UNKNOWN
   ↓
Status: any FAIL → Not Eligible · else any UNKNOWN → Needs More Information · else Eligible
   ↓
LLM (Groq): plain-language explanation using ONLY the supplied rule text
   ↓
Ranking + recommendation → results UI with evidence panel and shortlist
```

**Key design decisions**

- **The code decides, the AI explains.** The LLM can never change a verdict, an evidence clause, or a ranking.
- **Unknown ≠ Not Eligible.** Missing information produces *Needs More Information*, not a rejection. A clear FAIL always outranks an UNKNOWN.
- **Exact evidence.** Clauses are returned directly from the stored rule text, never paraphrased by the AI.
- **Graceful degradation.** If the LLM is slow or unavailable, template explanations are built from the same rules, with identical verdicts and evidence.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| Backend | Node.js + Express |
| Database | MongoDB Atlas (Mongoose) |
| AI | Groq API (`openai/gpt-oss-120b`), JSON mode |
| Tests | Node built-in test runner |

## Project structure

```text
├── client/                  # React + Vite frontend
├── server/
│   ├── index.js             # Express app + routes
│   ├── models/Scheme.js
│   ├── services/            # ruleEngine, eligibilityService, llmService, recommendationService
│   ├── seed/schemes.json    # curated dataset (51 schemes)
│   └── tests/               # automated tests
├── ARCHITECTURE.md
└── HACKATHON_CONTEXT.md
```

## Getting started

**Prerequisites:** Node.js 18+ (LTS), a MongoDB Atlas cluster, and a Groq API key.

```bash
# 1. Backend
cd server
npm install
cp .env.example .env      # fill in your own values
npm run seed              # loads the schemes into MongoDB
npm run dev               # http://localhost:5000

# 2. Frontend (new terminal)
cd client
npm install
cp .env.example .env      # VITE_API_URL=http://localhost:5000
npm run dev               # http://localhost:5173
```

**`server/.env`**

```dotenv
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/scholarships?retryWrites=true&w=majority
PORT=5000
LLM_PROVIDER=groq
LLM_API_KEY=your_groq_key
LLM_MODEL=openai/gpt-oss-120b
USE_LLM=true
CLIENT_ORIGIN=http://localhost:5173
```

> Never commit `.env`. Set `USE_LLM=false` to run without the AI (template explanations are used).

## API

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/schemes` | List active schemes |
| GET | `/api/schemes/:id` | One scheme with rules, documents, benefits, source |
| POST | `/api/eligibility/check` | Evaluate a profile; returns `{ results, recommendation }` |
| GET | `/api/llm/test` | Verify the LLM connection |

**Example request**

```json
{
  "profile": {
    "course": "B.Tech", "year": 2, "state": "Maharashtra", "category": "OBC",
    "familyIncome": 450000, "academicPercentage": 78, "domicileStatus": "Yes"
  }
}
```

Omit a field (or send `"domicileStatus": "Unknown"`) to get *Needs More Information* instead of a rejection.

## Tests

```bash
cd server
npm test
```

Covers the eligible case, income boundaries, wrong state/course/category, missing information, evidence exactness, status invariants, recommendation ranking, and LLM failure fallback.


## Scope and roadmap

**Not in the MVP:** live scraping, authentication, OCR/document verification, application submission, deadline reminders, benefit-stacking rules.

**Next:** ingest official guideline PDFs with human-reviewed rule extraction, Marathi/Hindi explanations, combined document checklist, and an inline "resolve missing info" flow.

## Team

- Mauzzam Shaikh: backend, rule engine, database, LLM integration
- Junaid Mulla: frontend and UX

Built for Tektonix, 2026.
