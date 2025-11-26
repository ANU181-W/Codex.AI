# Codex.AI – Azure Deployment Plan

This document outlines recommended Azure resources, networking, and CI/CD for hosting Codex.AI as part of the AI Café showcase.

## High-level architecture
- Client (React/Vite)
  - Host: Azure Static Web Apps (SWA) or Azure Storage (Static Website) + Azure Front Door (optional WAF)
  - CDN: Front Door or SWA built-in CDN
- Backend (Node/Express + Prisma)
  - Option A: Azure Container Apps (ACA) – preferred for easy scale-to-zero and background jobs
  - Option B: Azure App Service (Linux) – simpler PaaS
  - Container Registry: Azure Container Registry (ACR)
- Database
  - Azure Database for MySQL – Flexible Server (General Purpose, small tier for start)
- Cache
  - Azure Cache for Redis (Basic C0/C1 for dev, Standard for prod)
- Storage
  - Azure Storage Account (Blob): uploads, exports, logs
- AI
  - Azure OpenAI Service (deploy `gpt-4o-mini` for default, `gpt-4o` for complex cases)
- Secrets
  - Azure Key Vault (secrets, connection strings, API keys)
- Observability
  - Azure Monitor / Application Insights (logs, traces, metrics)
- Identity (optional now, recommended for prod)
  - Microsoft Entra ID (App Registration)

## Resource sizing (initial)
- Azure Container Apps: 0.5 vCPU / 1 GB RAM, min replicas 0–1, max 3
- App Service alt: B1 (dev), P1v3 (prod pilot)
- MySQL Flexible Server: B1ms or D2s v5 (dev), GP 2 vCores (prod pilot)
- Redis: Basic C1 (dev), Standard C1/C2 (prod pilot)
- Storage: Standard LRS
- Azure OpenAI: 1 deployment `gpt-4o-mini` (8k token context) + optional `gpt-4o` (higher context)

## Networking & security
- Restrict CORS to Client origin(s)
- Private endpoints (prod): MySQL, Redis, Storage, Key Vault
- Outbound network rules to allow Azure OpenAI endpoint
- Key Vault for secrets: DB connection, Redis, OpenAI keys, App Insights
- Add WAF (Front Door) if public-facing demo at scale

## Environment variables (Backend)
Required in Key Vault / ACA secrets:
- NODE_ENV=production
- PORT=5000
- DATABASE_URL=mysql://<user>:<pass>@<host>:3306/<db>?sslmode=required
- CORS_ORIGIN=https://<client-domain>
- OPENAI_API_KEY=<key or Azure OpenAI key>
- OPENAI_BASE_URL=https://<your-azure-openai>.openai.azure.com
- OPENAI_DEPLOYMENT_NAME=gpt-4o-mini
- OPENAI_API_VERSION=2024-08-01-preview
- FORCE_BYPASS_CACHE=false
- FORCE_AI=false
- ALWAYS_AI=false
- REDIS_URL=rediss://<host>:6380
- APPINSIGHTS_CONNECTION_STRING=InstrumentationKey=...;IngestionEndpoint=...

Client `.env`:
- VITE_API_BASE_URL=https://<backend-domain>/api
- VITE_ENV=production

## CI/CD (GitHub Actions outline)
1. On push to main:
   - Build client → upload to SWA or Storage
   - Build backend container → push to ACR
   - Run DB migrations: `prisma migrate deploy`
   - Deploy to ACA/App Service
2. Add environment protection rules and approvals for prod

## Health, readiness, scaling
- Add `/healthz` (returns 200) and `/readyz` (checks DB+Redis)
- Autoscale on CPU and RPS (ACA) or rule-based (App Service)
- Include structured logs to App Insights; enable distributed tracing

## Cost controls
- Track LLM usage in DB (`ai_usage`)
- Set QPS limits and max tokens per request
- Cache repeated prompts by file-hash + prompt signature (Redis TTL)

## Rollout checklist
- Secrets in Key Vault, not in app settings
- CORS locked down
- DB migrations applied
- Alerts configured (errors, high latency, budget)
- Run smoke tests post-deploy
