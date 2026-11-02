# 13_resilience_recovery_failure_modes — Prompt 13 - Resilience, Recovery, and Failure Modes Audit

- Run: `mainecybertech-20261014-0033-full-main-7dd0402`
- Target: `mainecybertech` @ `7dd0402` (branch `main`)
- Domain: `13_resilience_recovery_failure_modes.md` (area RES, prompt)

## Verification Performed

Domain subagent produced 22 finding(s) at the bound commit; machine IDs assigned by tools/full_domain.py.

## Findings

| ID | Severity | Title |
|---|---|---|
| RES-P2-001 | P2 | Worker process has no `unhandledRejection` handler |
| RES-P2-002 | P2 | `WORKER_TIMEOUT` is not a real task timeout; generic task failures have no DLQ |
| RES-P2-003 | P2 | `QUEUE_BACKEND` default `inline` diverges from production and can silently stall all queued work |
| RES-P2-004 | P2 | External `fetch` calls without `AbortController` in `public.ts` and `auth.ts` |
| RES-P2-005 | P2 | Availability detection lives inside the failed domain; no external dead-man's switch or alert delivery |
| RES-P2-006 | P2 | Backup/restore recovery is configured but not evidenced as exercised, and the restore test verifies only table counts |
| RES-P2-007 | P2 | Inbound webhook handlers ACK 200 while ignoring persistence errors, dropping events during DB degradation |
| RES-P2-008 | P2 | Worker queue degradation is invisible to health checks and alerting |
| RES-P2-009 | P2 | Graceful shutdown is not effective in production: Redis handles are never closed and Docker's 10s stop timeout kills the worker before its 30s drain budget |
| RES-P2-010 | P2 | Deploys are stop-the-world: `docker compose down` before `up` takes the whole stack offline with no rolling replace |
| RES-P3-001 | P3 | Worker graceful shutdown has no force-exit fallback |
| RES-P3-002 | P3 | Worker queued webhook dispatcher inserts deliveries without an idempotency key |
| RES-P3-003 | P3 | `AGENTS.md` documents the worker consumer incorrectly and omits the queue backend divergence |
| RES-P3-004 | P3 | Deploy health gate treats worker unhealthiness as non-fatal |
| RES-P3-005 | P3 | Orphan cleanup lists at most 1000 objects per bucket and cannot verify the purge shrank anything |
| RES-P3-006 | P3 | Manual rollback script points at the wrong GHCR namespace and accepts non-2xx health codes |
| RES-P3-007 | P3 | Circuit breaker leaks an uncleared timer per call and does not abort the timed-out operation |
| RES-P3-008 | P3 | Service worker is shipped but never registered — offline capability is dead code |
| RES-P3-009 | P3 | Failure-injection and load tests exist but are never executed by CI |
| RES-P3-010 | P3 | `requestTimeout` responds 408 but does not abort the handler or close the connection |
| RES-P3-011 | P3 | Task deadline fails the task but does not cancel its in-flight work: no production task consumes the context signal |
| RES-P3-012 | P3 | Rolling deploy still hard-removes the Caddy ingress before recreating it, so every release has a short hard outage window |
