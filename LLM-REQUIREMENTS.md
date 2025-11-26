# Codex.AI – LLM Requirements

This document captures model, throughput, and operational needs for the AI Café deployment.

## Model & provider
- Primary: Azure OpenAI `gpt-4o-mini` (chat completions)
- Secondary (escalation): Azure OpenAI `gpt-4o` for large/complex files
- Fallback: Standard OpenAI-compatible endpoint (configurable baseURL and key)

## API usage
- Endpoint: Chat Completions
- Temperature: 0.2–0.4 (default 0.3 in code)
- Max tokens per call: 800–1200 (currently 1000)
- Requests per second (target): 2–5 RPS steady; short spikes to 10 RPS during batch scans
- Latency target: p95 ≤ 3.5s on mini model; ≤ 8s on gpt-4o

## Configuration knobs (Backend)
- OPENAI_API_KEY
- OPENAI_BASE_URL (for Azure: https://<resource>.openai.azure.com)
- OPENAI_DEPLOYMENT_NAME (e.g., `gpt-4o-mini`)
- OPENAI_API_VERSION (e.g., 2024-08-01-preview)
- OPENAI_PROVIDER=openai|azure (optional flag to drive SDK config)
- MODEL_ROUTING_SMALL, MODEL_ROUTING_MEDIUM, MODEL_ROUTING_LARGE (override defaults)
- MAX_TOKENS=1000, TEMPERATURE=0.3

## Safety & privacy
- Redact PII and secrets prior to LLM calls (use `utils/security.js` with opt-in strict mode)
- Disable prompt logging in production; only store minimal usage metrics
- Block uploads above size threshold; reject executable/binary files
- Content filter policies enabled on Azure OpenAI

## Caching & cost
- Cache by file-hash + prompt-signature (Redis TTL: 24–72h)
- Log token usage and estimated cost to `ai_usage`; build dashboards
- Add per-scan token budgets and hard limits

## Observability
- Emit model, latencyMs, token counts per request
- Correlate LLM calls with scan IDs (traceparent)

## Open items (support needed)
- Provision Azure OpenAI with above deployments and quota for ~5 RPS
- Provide endpoint URL, api-version, and keys
- Confirm data retention policy (Azure OpenAI data logging disabled)
