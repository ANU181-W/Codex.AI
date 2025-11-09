# Codex.AI — AI Code Copilot

Team: Team 55-Tribots-PS1

---

## Problem Statement
Modern front-end projects accumulate hidden issues across accessibility, security, SEO, performance, and design consistency. Teams struggle to:
- Detect issues early and at scale across diverse file types
- Prioritize by severity and category
- Generate actionable fixes quickly (ideally AI-assisted)
- Visualize quality trends and share results

## Solution Overview
Codex.AI is a full‑stack web app that scans uploaded project files, runs rule‑based static analyzers, and augments results with GenAI suggestions. It stores scan results and renders a dashboard with filterable issues, charts, and export options.

- Hybrid analysis:
  - Static analyzers for deterministic checks (accessibility, security, SEO, performance, i18n, structure, design system)
  - GenAI (OpenAI) for contextual, high‑impact suggestions and patch diffs
- Immediate feedback loop:
  - On upload, results and AI suggestions are synthesized into issues for instant UI visibility
  - Start-scan API now returns issues to avoid hydration blanks
- Robust UI/UX:
  - Filter/sort issues by category/severity, compute quality score from displayed issues
  - Charts (Recharts) with resilient color rendering
  - Branding fixed (explicit favicon)
- Data model (Prisma) for Projects, Files, Issues, Fixes, Scans, AIUsage, etc.

### High-level Architecture
- Client (Vite + React 19)
  - Contexts: `ProjectContext`, `ScanContext`
  - Services: `src/services/api/*` with a light fetch client
  - Pages: Scanner, Results, Dashboard; charts powered by Recharts
- Backend (Express + Prisma)
  - Routes: `/api/projects`, `/api/files`, `/api/scans`, `/api/analysis`, `/api/debug`
  - Controllers: file upload + parse, project/scan orchestration
  - Services: `ai.service.js` orchestrates analyzers and OpenAI calls; caching layer
- Database
  - Prisma schema targeting MySQL (can adapt to PostgreSQL with minimal changes)

### GenAI Usage
- Model: OpenAI Chat Completions (model auto-selected by content length: 3.5/4/4‑32k)
- Trigger: called when static analyzers find issues or for preferred types (html, css, scss, js, ts, jsx, tsx), or when `FORCE_AI/ALWAYS_AI` flags are set
- Output: structured suggestions (category, description, changes, rationale, example) with raw text fallback when parsing fails
- Telemetry: AI usage optionally persisted in `AIUsage` table

---

## Environment Setup

### Prerequisites
- Node.js 18+ (recommended)
- npm or pnpm (repo uses Vite; npm is fine)
- MySQL database (for Prisma). For quick starts you can run without DB; the backend falls back to in‑memory storage when Prisma client isn’t available.
- OpenAI API key for GenAI features (optional but recommended)

### Repository Structure
```
Backend/
  server.js
  Routes/*
  Controller/*
  services/*
  prisma/
  utils/*
Client/
  src/*
  public/*
  vite.config.js
```

### Environment Variables
Create two .env files: one for Backend, one for Client.

Backend/.env
```
# Server
PORT=5000
NODE_ENV=development

# Database (MySQL)
DATABASE_URL=mysql://user:password@localhost:3306/codexai

# OpenAI
OPENAI_API_KEY=sk-...
# Optional flags
FORCE_AI=false
ALWAYS_AI=false
FORCE_BYPASS_CACHE=false
```

Client/.env
```
# Point client to backend API base
VITE_API_BASE_URL=http://localhost:5000/api
# Optional feature flags
VITE_USE_DYNAMIC=false
```

Dependencies of note
- Backend: express, cors, dotenv, multer, openai, @prisma/client + prisma, zod, axios, eslint
- Client: react, react-dom, react-router-dom, recharts, radix-ui components, tailwindcss (v4), vite

Install dependencies
- Backend: `npm install`
- Client: `npm install`

---

## Execution Steps

### 1) Backend: generate client (if DB used) and run server
If you plan to use the Prisma DB:
1. In `Backend/`, ensure `.env` has a valid `DATABASE_URL`.
2. Generate Prisma client and apply migrations:
   - `npm run prisma generate`
   - `npx prisma migrate deploy` (or `npx prisma migrate dev` for local)
3. npm i
Start the backend server:
- Dev: `npm run dev` (nodemon) in `Backend/`
- Prod: `npm start` in `Backend/`

Server starts at `http://localhost:5000` and exposes APIs under `/api/*`.

API quick checks
- GET `http://localhost:5000/` → `{ message: "🚀 AI Code Copilot Backend is running!" }`
- Typical endpoints: `/api/projects`, `/api/files`, `/api/scans`, `/api/analysis`

### 2) Client: run the web app
1. Ensure `Client/.env` points to the backend API (default is fine).
2. if dependecies are mismatched with node version the use this command npm install --legacy-peer-deps

3. In `Client/`, run:
   - Dev: `npm run dev` → Vite dev server (default `http://localhost:5173`)
   - Build: `npm run build` and `npm run preview`

### 3) End-to-end flow
- Create a project (UI or POST `/api/projects`)
- Upload files to the project (UI or POST `/api/files/upload/:projectId` with form-data field `index`)
- Start a scan (UI or POST `/api/scans/project/:projectId`)
- View Results/Dashboard pages
  - Issues are filterable and sortable; quality score is computed from displayed issues
  - Charts show category/severity breakdowns
- Export results (JSON/CSV export pages)

Notes
- On upload, the backend runs static analyzers and calls AI (for preferred types); if static output is empty but AI suggests items, it synthesizes issue records so the UI isn’t blank.
- The scan endpoint now returns issues immediately (Prisma and in‑memory), improving first render stability.

---

## Backend System Design

### Key Modules
- `Controller/fileController.js` — file upload, parsing, storage (Prisma or in‑memory). Invokes `ai.service` per file; persists issues and AI‑derived fixes.
- `Controller/scanController.js` — orchestrates project scans, aggregates issues, returns issues in response.
- `services/ai.service.js` —
  - Runs static analyzers: accessibility, security, SEO, performance, i18n, structure, design heuristics
  - Decides when to call OpenAI and parses/normalizes suggestions; caches results and optionally records AI usage
- `services/analyzers.js` — rule-based checks (with rule dictionary mapping and line/column augmentation)
- `utils/prisma.js` — Prisma client helper (falls back when not available)
- `middleware/*` — input validation (zod), error handling

### Data Model (Prisma)
- Project, File, Issue, Fix, ScanResult, DesignToken, Cache, UserPreference, ClarificationQuestion, AuditLog, VerificationResult, AIUsage
- Issue fields include fileId, category, severity, title, message, line/column, rule and ruleUrl, plus relations to Fix

### Caching
- Content hash keyed cache layer to avoid repeated AI calls; controlled with `FORCE_BYPASS_CACHE`

### API Surface
- `/api/projects` — CRUD for projects
- `/api/files` — upload/get/delete files; `upload/:id` expects field name `index`
- `/api/scans` — start scan, get by project, latest
- `/api/analysis` — programmatic code analysis (POST `/code`)
- `/api/debug` — diagnostics

---

## Web Application Flow

1. User creates/selects a project
2. Uploads source files (HTML/CSS/JS/TS/JSX/TSX, etc.)
3. Backend analyzes files (static + AI) and stores Issues and Fixes
4. User starts a scan to aggregate results; backend returns issues
5. Client displays Results and Dashboard (filters, charts, exports)

### Client Services
- `src/services/api/httpClient.js` — fetch wrapper with timeout, error normalization, and env‑driven base URL
- `src/services/api/index.js` — domain APIs (ProjectAPI, FileAPI, ScanAPI, AnalysisAPI, DebugAPI)

### Notable UI
- Dynamic filters and sorting
- Quality score from current displayed issues
- Charts with inline fill styling to avoid theme overrides
- Explicit favicon `public/icon.svg`

---

## How to Run From Scratch

1) Clone and install
- Clone repo
- Backend: `cd Backend && npm install`
- Client: `cd Client && npm install`

2) Configure env
- Create `Backend/.env` and `Client/.env` as shown above
- Optional: run MySQL locally and update `DATABASE_URL`

3) Database (optional but recommended)
- Generate Prisma client and migrate: `npm run prisma generate` then `npx prisma migrate dev`

4) Start services
- In `Backend/`: `npm run dev` (or `npm start`)
- In `Client/`: `npm run dev`

5) Open the app
- Visit the Vite dev URL (default `http://localhost:5173`)

---

## Limitations and Future Enhancements

Current Limitations
- AI line/column mapping is heuristic when the LLM doesn’t specify precise ranges
- Exports (JSON/CSV) exist but the mapping to “real data fields” is being finalized
- In‑memory mode is great for demos but not for persistence; prefer running the DB for real projects
- OpenAI model choice is static per size; cost estimation is not yet implemented

Future Enhancements
- Improved LLM parser to extract precise ranges and map categories to rule dictionary consistently
- Centralized chart theming through `ChartContainer` config instead of per‑element inline fills
- Full export mapping with file:line and fix metadata; import pipeline for CI usage
- Additional analyzers (Lighthouse integration, dependency risk checks)
- Role‑based access and multi‑user workspaces
- Cost tracking for AI usage with per‑project budgets and caching analytics

---

## Troubleshooting
- Backend 404s: ensure routes are under `/api/*` and Client `VITE_API_BASE_URL` matches
- CORS issues: backend enables `cors()` by default; confirm origins if deploying
- Prisma client errors: run `npx prisma generate` and ensure `DATABASE_URL` is reachable
- AI not returning suggestions: check `OPENAI_API_KEY` and consider `FORCE_AI=true` for debugging

---

## License
This repository is for hackathon/demo use. Add a suitable open‑source license before public release.
