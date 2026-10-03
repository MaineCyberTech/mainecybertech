# Observability, Monitoring, and Incident Readiness Audit

**Run ID:** `20260728-0142-develop-21a10d6`
**Finding Area Code:** OBS

## Executive Summary

**Overall: 4.3/10.** Strong foundations: pino structured logging with PII redaction, Sentry in all 3 services, X-Request-ID correlation, health endpoints, graceful shutdown. **Critical gap:** all 14 Prometheus metrics are defined but zero are wired into code. No centralized log aggregation, no automated incident alerting, monitoring docs are stale.

**26 findings** (1 P0, 6 P1, 19 P2)

## P0 Finding

### OBS-007: All 14 Prometheus Metrics Defined But Zero Wired

**Evidence:** `metrics.ts` defines 14 metrics and 12 helper functions. Grep shows zero calls to `httpRequestsTotal.inc()`, `httpRequestDuration.observe()`, `recordDbQuery()`, `recordAuthAttempt()`, etc. in any route file. The `/metrics` endpoint returns only default Node.js metrics.
**Recommendation:** Wire metrics middleware into app.ts, add `recordDbQuery()` to Supabase wrapper, wire `recordWebhookDelivery()`, `setCircuitBreakerStatus()`, and entity creation counters.

## P1 Findings

- **OBS-002:** Worker logger missing `email`, `phone`, `fullName` from redaction paths
- **OBS-003:** Worker logger reads `LOG_LEVEL` via raw `process.env` instead of Zod-validated `env`
- **OBS-010:** Worker Sentry captures full task payload — no PII redaction before Sentry transmission
- **OBS-022:** No centralized log aggregation — Docker logs lost on container restart
- **OBS-023:** `docs/MONITORING_AND_ALERTING.md` is stale AWS-era documentation
- **OBS-026:** No automated incident alerting — no PagerDuty, Slack, or uptime monitoring

## P2 Highlights

- **OBS-004:** Web server logger has zero redaction configuration
- **OBS-012:** ~20 route/service files import root logger without `requestId` correlation
- **OBS-018:** Worker and Web services in docker-compose.yml lack `healthcheck` blocks
- **OBS-020:** Deploy health check does not verify Worker service
- **OBS-024:** Caddyfile has no `log` directive — access logs disabled

## Quick Wins

1. Wire Prometheus metrics into middleware — 2 hours
2. Add email/phone to worker logger redaction — 15 min
3. Add Sentry capture to error boundary components — 1 hour
4. Add healthcheck blocks for Worker/Web in docker-compose — 30 min
5. Add Caddy access logging — 15 min
