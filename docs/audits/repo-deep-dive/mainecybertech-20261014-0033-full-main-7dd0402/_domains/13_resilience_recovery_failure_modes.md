# Resilience, Recovery, and Failure Modes Audit (Re-audit)

## Audit Metadata

- Audit name: mainecybertech full-domain verification re-audit
- Run: `mainecybertech-20261014-0033-full-main-7dd0402`
- Repository: MaineCyberTech/mainecybertech
- Branch: `main` (worktree at `origin/main`)
- Commit SHA: `7dd040234e8dfa40dd2d2b6fe1ca7379f2fba097`
- Generated at: 2026-10-14T00:45:53Z
- Auditor: subagent (group 5)
- Area code: RES
- Previous run: `mainecybertech-20261011-0426-full-main-8d299b8` (20 RES findings)
- Scope limitations: static review plus read-only GitHub Actions run history; no chaos experiment or SIGTERM drill was executed against a live worker.

## Scope

Re-verified all 20 previous RES findings at `main@7dd0402` and re-ran the failure-mode lens over the current worker/API/deploy code: task deadline and DLQ, queue connectivity and health, graceful shutdown, circuit breaking, request deadlines, inbound webhook failure behavior, deploy/rollback mechanics, offline client, backup recovery, and failure-injection/load tests.

## Executive Summary

The resilience remediation wave landed almost completely. **16 of 20 previous findings are `verified-fixed`**, including every P2 except the two exercise-dependent rows: the worker now has a real task deadline plus a `task_dead_letters` DLQ with metrics and alert rules, queue loss flips `/health` to 503 and pages on `MCTWorkerQueueDisconnected`, inbound webhook handlers fail loud (5xx + released claim) on persistence errors, graceful shutdown actually closes Redis handles under a 60 s `stop_grace_period`, deploys roll service-by-service, and the manual rollback script, circuit breaker and request timeout were all repaired.

The four `partially-fixed` rows are all "mechanism done, exercise/verification missing": the off-box dead-man's switch URL is still unset and the alert-path exercise has no recorded run (RES-P2-005), no backup has ever been restored (RES-P2-006, tied to DR-P0-001), `AGENTS.md:363` still describes the SQS-only consumer (RES-P3-003), and orphan cleanup still cannot verify that a purge shrank the bucket (RES-P3-005). No previous row regressed.

Two new P3 findings: the task deadline fails a hung handler but nothing cancels its in-flight work (no production task consumes the context signal), and the rolling deploy still `docker rm -f`s the Caddy ingress before recreating it, so each release has a short hard ingress gap.

## Findings

| ID | Sev | Title | Status | Key evidence |
|---|---|---|---|---|
| RES-P2-001 | P2 | Worker process has no `unhandledRejection` handler | verified-fixed | `apps/worker/src/main.ts:48-53`; API `main.ts:93-98` |
| RES-P2-002 | P2 | `WORKER_TIMEOUT` is not a real task timeout; generic task failures have no DLQ | verified-fixed | `task-registry.ts:150-233`; `task-dead-letters.ts`; rules `:311-336`; tests |
| RES-P2-003 | P2 | `QUEUE_BACKEND` default `inline` diverges from production and can silently stall all queued work | verified-fixed | `env.ts:66-88`; parity gauges |
| RES-P2-004 | P2 | External `fetch` calls without `AbortController` in `public.ts` and `auth.ts` | verified-fixed | `public.ts:81`; `auth.ts:264,292`; `http-client.ts:36-49` |
| RES-P2-005 | P2 | Availability detection lives inside the failed domain; no external dead-man's switch or alert delivery | partially-fixed | mechanism + fail-closed deploy; URL unset (`INCIDENT_RESPONSE.md:150-156`); 0 exercise runs |
| RES-P2-006 | P2 | Backup/restore recovery is configured but not evidenced as exercised, and the restore test verifies only table counts | partially-fixed | assertions fixed; no successful backup/restore (DR-P0-001) |
| RES-P2-007 | P2 | Inbound webhook handlers ACK 200 while ignoring persistence errors, dropping events during DB degradation | verified-fixed | `webhooks.ts:42-61` + throw sites in every provider handler |
| RES-P2-008 | P2 | Worker queue degradation is invisible to health checks and alerting | verified-fixed | `health-server.ts:60-84`; rules `:338-438`; deploy gate `:1056-1172` |
| RES-P2-009 | P2 | Graceful shutdown is not effective in production: Redis handles are never closed and Docker's 10s stop timeout kills the worker before its 30s drain budget | verified-fixed | `shutdown.ts:76-78`; `consumer-bullmq.ts:101-118`; `docker-compose.yml:215` `stop_grace_period: 60s` |
| RES-P2-010 | P2 | Deploys are stop-the-world: `docker compose down` before `up` takes the whole stack offline with no rolling replace | verified-fixed | `deploy-do.yml:1004-1030` rolling recreate |
| RES-P3-001 | P3 | Worker graceful shutdown has no force-exit fallback | verified-fixed | `shutdown.ts:16-42` + tests |
| RES-P3-002 | P3 | Worker queued webhook dispatcher inserts deliveries without an idempotency key | verified-fixed | `webhook-dispatcher.ts:43-63,108-127,146-250` |
| RES-P3-003 | P3 | `AGENTS.md` documents the worker consumer incorrectly and omits the queue backend divergence | partially-fixed | `AGENTS.md:17,218-219` updated; `:363` still "SQS-based" |
| RES-P3-004 | P3 | Deploy health gate treats worker unhealthiness as non-fatal | verified-fixed | `deploy-do.yml:1056-1085,1155-1172` |
| RES-P3-005 | P3 | Orphan cleanup lists at most 1000 objects per bucket and cannot verify the purge shrank anything | partially-fixed | pagination/ceiling fixed; no post-remove verification |
| RES-P3-006 | P3 | Manual rollback script points at the wrong GHCR namespace and accepts non-2xx health codes | verified-fixed | `rollback.sh:32-34,129-173` |
| RES-P3-007 | P3 | Circuit breaker leaks an uncleared timer per call and does not abort the timed-out operation | verified-fixed | `circuit-breaker.ts:73-110`; `http-client.ts:36-49` |
| RES-P3-008 | P3 | Service worker is shipped but never registered — offline capability is dead code | verified-fixed | `ServiceWorkerRegistrar.tsx` |
| RES-P3-009 | P3 | Failure-injection and load tests exist but are never executed by CI | verified-fixed | `load-test.yml` (budgets + failure-injection) |
| RES-P3-010 | P3 | `requestTimeout` responds 408 but does not abort the handler or close the connection | verified-fixed | `middleware/request-timeout.ts` |
| RES-P3-011 | P3 | Task deadline fails the task but does not cancel its in-flight work: no production task consumes the context signal | **open (new)** | `task-registry.ts:23-37,150-233`; no `context.signal` consumers under `tasks/` |
| RES-P3-012 | P3 | Rolling deploy still hard-removes the Caddy ingress before recreating it, so every release has a short hard outage window | **open (new)** | `deploy-do.yml:1030-1043` |

Counts: 16 verified-fixed / 4 partially-fixed / 0 regressed / 2 open (both new P3).

## Recommendations

### Immediate / Release blocking

None new. The domain's blocking dependency is the operator action in DR-P0-001 (provision backup secrets, produce a green restore).

### This week

1. Record one alert-path exercise run (`alert-path-exercise.yml` dispatch) and provision `ALERTMANAGER_WATCHDOG_WEBHOOK_URL`; then run the stop-Alertmanager missed-heartbeat drill and record it in `docs/ALERT_PATH_EXERCISE.md` (closes the RES-P2-005 / OBS-P2-014 residual).
2. Fix `AGENTS.md:363` to describe the BullMQ-first consumer (RES-P3-003).

### This month

3. Make the task deadline actually cancel work: consume `context.signal` in the long-running handlers (retention/purge, orphan cleanup, webhook dispatcher/retry, provider syncs) or document that the deadline is advisory for non-cooperative handlers (RES-P3-011).
4. Add a post-remove verification pass to orphan cleanup (re-list and compare, or at least a removed-vs-expected counter metric) (RES-P3-005).

### Later / Platform evolution

5. Replace the `docker rm -f` Caddy recreate with an in-place/`--force-recreate` + health wait to remove the per-deploy ingress gap (RES-P3-012).
6. Add a SIGTERM mid-task integration test asserting a clean exit, no duplicate side effect, and DLQ only on exhausted retries.

## Quick Wins

| Quick win | Why it helps | Files likely involved | Validation |
|---|---|---|---|
| Dispatch the alert-path exercise once | Converts "configured" to "exercised" for the dead-man's switch | `.github/workflows/alert-path-exercise.yml`, `docs/ALERT_PATH_EXERCISE.md` | run URL + observed ntfy |
| One-line AGENTS.md fix | Removes the last stale consumer claim | `AGENTS.md:363` | read-through |
| Post-remove re-list in orphan cleanup | Proves the purge shrank the bucket | `apps/worker/src/tasks/orphan-cleanup.ts` | unit test with a shrinking fake bucket |

## Suggested Tests

- **Worker unit**: handler that ignores the signal keeps running after the registry times out (documents RES-P3-011) and assert the new cancellation behavior once implemented.
- **Integration**: `docker compose stop redis` → worker `/health` 503 within the healthcheck window, `MCTWorkerQueueDisconnected` fires, BullMQ waiting set survives restart.
- **Deploy**: SIGTERM the worker mid-task; assert clean exit 0, no duplicate side effect, and a DLQ row only when retries are exhausted.
- **Chaos (manual)**: stop alertmanager → external watchdog pages within its grace period; record in the drill ledger.
- **Load**: dispatch `load-test.yml` with `scenario=spike` against dev and confirm budgets hold.

## Suggested Documentation Updates

- `AGENTS.md:363` (worker consumer) and the worker section's shutdown description (it still says "10s drain" at :350).
- `docs/PLATFORM_FAILURE_RUNBOOKS.md`: record the first exercised drill rows (currently all `_pending_`).
- `docs/ALERT_PATH_EXERCISE.md`: first evidence row.

## Open Questions

| Question | Why it matters | Evidence needed |
|---|---|---|
| Are the `WORKER_TIMEOUT` lock and `WORKER_TASK_TIMEOUT_MS` deadline values safe together under CPU pressure? | A blocked event loop prevents lock renewal and can cause stalled-job redelivery while the handler still runs | A stalled-job experiment or BullMQ metrics on the deployed worker |
| Does any task legitimately need >10 min (the default deadline)? | A too-short deadline could fail long scans and cause duplicate work | Task duration histograms (`worker_task_execution_duration_seconds`) |

## Appendix

- GitHub Actions (read-only, 2026-10-14): alert-path-exercise 0 runs; load-test 0 runs (both only landed on main with this promotion); external-uptime-probe hourly runs failing on `prod-api-health` (see OBS); smoke-check green.
- No regressions found in any of the 20 previous RES rows.
