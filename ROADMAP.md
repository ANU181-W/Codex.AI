# Codex.AI – Production Readiness Roadmap

This roadmap outlines concrete improvements to take Codex.AI from hackathon MVP to a production-ready showcase for AI Café.

## Objectives
- Ship a stable, secure, and observable web app (Client + Backend)
- Make AI analysis cost-efficient, fast, and privacy-aware
- Provide a smooth UX with clear progress, history, and exports

## Quick wins (1–2 weeks)
- Backend hardening
  - Add HTTP security headers via `helmet`
  - Tighten CORS: restrict to AI Café domains via `CORS_ORIGIN`
  - Add `express-rate-limit` and basic API key/JWT or Entra ID auth guard on write/scan endpoints
  - Structured logging with `pino` (+ request ID middleware) and request logging
  - Centralized error class + consistent status codes; include a correlationId in errors
  - Swap in-memory cache to Redis (Azure Cache for Redis); keep current DB cache as fallback
- AI service
  - Parameterize model routing with env (support Azure OpenAI deployments + standard OpenAI)
  - Add safety filters + content redaction before LLM calls (reuse `utils/security.js`)
  - Track real token usage and estimated cost; persist to `ai_usage` table
  - Timeouts + retries with jitter/backoff
- APIs & docs
  - Generate OpenAPI/Swagger from routes; serve at `/api/docs`
  - Health endpoints: `/healthz` (app), `/readyz` (DB/Redis)
  - Add `Backend/.env.example` and `Client/.env.example`
- Data & Prisma
  - Run `prisma generate` in CI; add `prisma migrate deploy` to startup scripts in container
  - Minimal seed script for demo data
- Testing
  - Add Jest + Supertest for 5–8 happy-path API tests
  - Add lightweight unit tests for analyzers and the AI prompt builder
- DX & CI/CD
  - Dockerize backend and client; GitHub Actions to build/push images; deploy to Azure (preview)

## Near-term (3–6 weeks)
- Background processing
  - Offload long scans to a queue (Azure Service Bus or Storage Queue) with worker (Azure Functions or Container Apps job)
  - Webhook/SignalR/websockets to stream progress back to UI
- Observability
  - App Insights traces + logs + metrics; distributed tracing (propagate correlation IDs)
  - Error tracking (Sentry or App Insights exceptions)
- Performance & scale
  - CDN + static hosting for Client (Azure Static Web Apps or Front Door + Storage)
  - Cache AI responses by file-hash + prompts; set TTL per severity
  - Parallelize per-file static analyzers; control concurrency to protect LLM QPS
- Security & compliance
  - Microsoft Entra ID auth; per-project RBAC (viewer/editor)
  - Key Vault-managed secrets; private endpoints to DB/Redis
  - Basic DLP guardrails in backend for user uploads
- Product polish
  - Stream AI suggestions to UI; show token/latency; allow accept/reject
  - Export results (PDF/CSV) + shareable scan links
  - Project history view, diffs across scans, trend charts
  - i18n for the Client (react-i18next)

## Stretch (6–12 weeks)
- AI
  - Hybrid static + LLM analysis strategy; selective model escalation (o4-mini -> gpt-4o)
  - Embedding-based similarity cache to avoid re-asking similar prompts
- Integrations
  - GitHub/GitLab repo scan; PR comments with findings
  - Jira/Trello issue export
- UX
  - PWA offline cache; background sync; keyboard nav and full A11y pass

## Acceptance criteria
- Security: CORS locked down, secrets in Key Vault, rate limits, headers hardened
- Reliability: SLOs defined, health checks, rollbacks, basic load-tested
- Observability: traces, dashboards, error alerts
- Cost: LLM usage tracked with budgets and guardrails
- UX: non-blocking scans, progress indicator, clear results and export

---

See `DEPLOYMENT-AZURE.md` and `LLM-REQUIREMENTS.md` for infra and model details.
