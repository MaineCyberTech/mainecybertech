# Architecture and Runtime Topology Audit

## Audit Metadata

- Audit name: repo-deep-dive (full-domain verification re-audit)
- Run: `mainecybertech-20261014-0033-full-main-7dd0402`
- Repository: `MaineCyberTech/mainecybertech` (read-only worktree `/tmp/opencode/mct-reaudit-g3`)
- Branch: `main` (detached) · Commit SHA: `7dd040234e8dfa40dd2d2b6fe1ca7379f2fba097` (`7dd0402`)
- Generated at: 2026-10-14 · Auditor: subagent (prompt 02) · Area code: ARCH
- Scope limitations: repository-only audit at 7dd0402. No droplet/live stack access; deployed RLS allow-list contents, GitHub environment secrets, actual alert delivery and the running container image digests are `unverified`. No build/test commands executed.
- Previous run re-verified: `mainecybertech-20261011-0426-full-main-8d299b8` (10 ARCH findings).

## Executive Summary

The as-built topology is unchanged (one droplet, one api/web/worker instance, one Redis, hosted Supabase, Caddy+Cloudflare ingress) but several previously-open architectural controls are now closed: the queue-backend contract is a single shared setting with fail-closed parity on both sides, Prometheus routes alerts to Alertmanager with an off-box watchdog that fails prod deploys when unset, server-side SSR now uses the runtime `API_INTERNAL_URL`, the request timeout aborts handlers and destroys the socket, the worker metrics endpoint is bearer-gated, and the architecture diagram + ADRs match the runtime (ADR 004 superseded by 012, rolling per-service recreate documented).

The remaining rows are owner decisions: the single-host SPOF (partially mitigated by the rolling recreate and documented runbooks), the service-role DB default with an opt-in RLS rollout (mitigated by the prod boot guard + bypass metrics), the unverified-JWT web middleware (documented as a UX-only gate), and the single non-replicated Redis (degradation is now metered, alerted and runbooked; replication/maxmemory is an infra decision). No new ARCH findings.

## Findings

| ID | Severity | Title | Status |
|---|---|---|---|
| ARCH-P2-001 | P2 | Single-droplet, single-instance runtime is a hard SPOF | partially-fixed |
| ARCH-P2-002 | P2 | API defaults to the service-role DB client (RLS bypass) | partially-fixed |
| ARCH-P2-003 | P2 | Prometheus loads rules but has no alert routing | verified-fixed |
| ARCH-P2-004 | P2 | API always enqueues to BullMQ while the worker backend is a separate setting | verified-fixed |
| ARCH-P2-005 | P2 | One non-replicated Redis backs queue, cache, idempotency and scan locks | partially-fixed |
| ARCH-P3-001 | P3 | Web middleware gates routes on an unverified JWT `exp` | partially-fixed |
| ARCH-P3-002 | P3 | Architecture diagram and ADR 004 contradict the as-built runtime | verified-fixed |
| ARCH-P3-003 | P3 | `NEXT_PUBLIC_API_URL` runtime override is inert for server-side code | verified-fixed |
| ARCH-P3-004 | P3 | Request timeout returns 408 but never cancels the handler | verified-fixed |
| ARCH-P3-005 | P3 | Worker metrics/health are unauthenticated while the API gates /metrics | verified-fixed |

### Re-verification evidence (headline rows)

- **ARCH-P2-003** — `infra/digitalocean/prometheus.yml` alerting → `alertmanager:9093`; `alertmanager.tmpl.yml:78-152`; `deploy-do.yml:845-863` fails prod without the watchdog URL.
- **ARCH-P2-004** — shared `QUEUE_BACKEND` (`docker-compose.yml:21`), production guards in `api/config/env.ts:156-167` + `worker/env.ts:81-91`, producer refusal on mismatch (`lib/task-producer.ts:100-111`), backend metric (`api/lib/metrics.ts:306-318`).
- **ARCH-P2-005** — degradation metrics/alerts (`prometheus.rules.yml:375-437`), runbook `docs/PLATFORM_FAILURE_RUNBOOKS.md:55-90`; Redis still single, no `maxmemory` policy, 48 MB cap.
- **ARCH-P3-002/003** — `docs/ARCHITECTURE_DIAGRAM.md:77,135,159`; `docs/adr/README.md:23,31,147`; `apps/web/lib/api.ts:11-15` + `docker-compose.yml:242`.
- **ARCH-P3-004/005** — `middleware/request-timeout.ts` (+ `app.ts:148`); `worker/src/health-server.ts:12-40`.

### Residual detail for the partially-fixed rows

- **ARCH-P2-001:** rolling per-service recreate (`deploy-do.yml:1007-1032`) removed the planned-outage risk; host loss remains a full outage (accepted, documented).
- **ARCH-P2-002:** prod refuses to boot with an empty `RLS_READS_ENABLED` (`lib/rls-startup-check.ts:26-55`, `main.ts:14`); per-module rollout is owner-gated.
- **ARCH-P2-005:** single non-replicated Redis; no `maxmemory`/`maxmemory-policy` in `redis-entrypoint.sh`, so hitting the 48 MB container limit OOM-kills Redis instead of evicting — the runbook treats repeated OOM as a capacity signal.
- **ARCH-P3-001:** documented non-authoritative UX gate (`apps/web/middleware.ts:4-16`); no test asserting no data access depends on it.

## Recommendations

1. **Next quarter (owner):** split queue vs cache or move Redis to a replicated/managed instance; set a `maxmemory` policy so eviction is graceful.
2. **Next quarter:** record the deployed RLS allow-list per environment (docs/RLS-rollout.md) so the rollout state is reviewable from the repo.
3. **Later:** add a regression test asserting no server data access relies on the web middleware's `isAuthenticated`.
4. **Later:** evaluate a second API replica + external rate-limit/idempotency store to reduce the SPOF blast radius.

## Quick Wins

| Quick win | Why it helps | Files |
|---|---|---|
| `maxmemory` + `maxmemory-policy allkeys-lru` for cache keys | Graceful eviction instead of OOM kill | `infra/digitalocean/redis-entrypoint.sh` |
| Assertion test for the web UX gate | Prevents a future data path from trusting it | `apps/web/__tests__` |

## Suggested Tests

- Compose/config lint: every service that the deploy gates on declares a healthcheck (image- or compose-level).
- Worker/API parity: a CI assertion that both parse the same `QUEUE_BACKEND` default.
- Ops drill: single-host restore + Redis-loss drill per `docs/PLATFORM_FAILURE_RUNBOOKS.md` (operator).

## Open Questions

| Question | Why it matters | Evidence needed |
|---|---|---|
| Which RLS modules are enabled per environment? | Determines the real defense-in-depth posture | Operator env values |
| Is a second API replica / managed Redis funded? | Determines whether the SPOF rows can close | Owner/budget decision |
