# Resilience, Recovery, and Failure Modes Audit (Re-audit)

## Audit Metadata

- Audit name: repo-deep-dive (full-domain verification re-audit)
- Run: `mainecybertech-20261103-0748-full-main-6b7aa1a`
- Repository: `MaineCyberTech/mainecybertech`
- Branch / Commit: `origin/main` @ `6b7aa1a5505d4f75b334b36e9e87737cd98e589c`
- Generated at: 2026-11-03 (UTC)
- Auditor: subagent (re-audit of `mainecybertech-20261014-0033-full-main-7dd0402`)
- Area code: RES
- Scope limitations: read-only static review plus the public GitHub Actions API. No live outage, queue failure, Redis loss or restore was injected. Job logs (admin-only) were not downloaded; run conclusions are at job/step granularity.

## Scope

Re-verified all 22 previous RES findings at `6b7aa1a`: timeouts, retries/backoff, idempotency, circuit breakers, queue/DLQ, webhook recovery, worker recovery, graceful shutdown, DB/Redis/API/email/file/realtime failure, offline client, transactions/partial writes, duplicate events, backups/restore, rollback, runbooks and failure/load tests. The `7dd0402..6b7aa1a` diff was reviewed for cooperative task cancellation, the Caddy reload path, load-test executions and the alert-path exercise.

## Verification Performed

| Evidence | Type | Why relevant | Notes |
|---|---|---|---|
| `apps/worker/src/{main,shutdown,task-registry}.ts` | Read | Worker failure handling, cancellation, shutdown | Current at `6b7aa1a` |
| `apps/worker/src/{lib/purge,tasks/orphan-cleanup,tasks/api-key-prune,tasks/retention}.ts` | Read | Task deadline cooperation | Signal checks present |
| `.github/workflows/deploy-do.yml` | Read | Rolling deploy/rollback and Caddy refresh | `caddy reload`, no `docker rm -f` |
| `.github/workflows/{load-test,alert-path-exercise}.yml` | Read + API | Exercised failure/monitoring paths | Load green; alert path failed |
| `apps/worker/src/{queue-health,health-server,health-state}.ts` | Read | Queue degradation visibility | Current |
| `apps/api/src/{middleware/request-timeout,lib/circuit-breaker,lib/http-client}.ts` | Read | Request/breaker failure semantics | Current |
| Public GitHub Actions API | Read-only | Backup/load/alert-path run history | Run IDs cited |

## Executive Summary

Eighteen of the 22 previous findings are `verified-fixed`; four are `partially-fixed`; none are open and none regressed. The material improvements in this diff are RES-P3-011 (destructive tasks now consume the task-deadline signal) and RES-P3-012 (Caddy is reloaded through its admin API instead of being SIGKILLed), and the load/failure suite now has green scheduled and dispatch runs.

The remaining resilience gaps are unchanged and operational: the external dead-man's switch is unset and the first scheduled alert-path exercise failed; no backup/restore has ever succeeded; orphan cleanup still cannot prove a removal shrank the bucket; and non-destructive long-running handlers still ignore the cancellation signal.

## Findings

| ID | Sev | Status | Title | Key evidence |
|---|---|---|---|---|
| RES-P2-001 | P2 | verified-fixed | Worker has no `unhandledRejection` handler | `main.ts:48-53` logs/Sentry-captures; API `main.ts:93-99` |
| RES-P2-002 | P2 | verified-fixed | `WORKER_TIMEOUT` is not a task timeout; no DLQ | `task-registry.ts:150-233`; `consumer-bullmq.ts:51-61`; dead-letter metrics |
| RES-P2-003 | P2 | verified-fixed | `QUEUE_BACKEND=inline` default could stall queues | `env.ts:80-88` rejects non-BullMQ in prod; Redis required |
| RES-P2-004 | P2 | verified-fixed | External fetches without abort | `public.ts:81` 5s; `auth.ts:264,292` 10s; breaker-aware client |
| RES-P2-005 | P2 | partially-fixed | Availability detector lives inside the failed domain | Watchdog wired but URL unset; alert-path run 41323651243 failed |
| RES-P2-006 | P2 | partially-fixed | Backup/restore configured but not exercised | 0 green backup/restore runs; ledger all `planned` |
| RES-P2-007 | P2 | verified-fixed | Inbound webhooks ACK while dropping events | `webhooks.ts:42-61` throw-on-write; outer catch 5xx |
| RES-P2-008 | P2 | verified-fixed | Queue degradation invisible to health/alerts | `queue-health.ts`; `/health` 503; `MCTWorkerQueueDisconnected` |
| RES-P2-009 | P2 | verified-fixed | Graceful shutdown leaves Redis handles open | `shutdown.ts:76-78`; `consumer-bullmq.ts:101-118`; 60s stop grace |
| RES-P2-010 | P2 | verified-fixed | `compose down` made deploys stop-the-world | `deploy-do.yml:1004-1030` one-service-at-a-time rolling recreate |
| RES-P3-001 | P3 | verified-fixed | Shutdown has no force-exit fallback | `shutdown.ts:16-42`; tests |
| RES-P3-002 | P3 | verified-fixed | Dispatcher inserts without idempotency key | `webhook-dispatcher.ts:43-63,108-126`; upsert on key |
| RES-P3-003 | P3 | verified-fixed | AGENTS.md documents worker consumer incorrectly | `AGENTS.md:17,363` now BullMQ in production |
| RES-P3-004 | P3 | verified-fixed | Deploy health gate treated worker unhealthiness as non-fatal | `deploy-do.yml:1067-1086`, `1155-1172` |
| RES-P3-005 | P3 | partially-fixed | Orphan cleanup cannot verify the purge shrank a bucket | Pagination/ceiling ok; no post-remove re-list or dedicated metric |
| RES-P3-006 | P3 | verified-fixed | Manual rollback wrong namespace/non-2xx health | `scripts/rollback.sh:32-34,129-173` |
| RES-P3-007 | P3 | verified-fixed | Circuit breaker leaks timer / no abort | `circuit-breaker.ts:73-110`; signal propagated |
| RES-P3-008 | P3 | verified-fixed | Service worker shipped but never registered | `ServiceWorkerRegistrar.tsx`; static assets only |
| RES-P3-009 | P3 | verified-fixed | Load/failure tests never executed by CI | `load-test.yml`; green 41511827450, 41515001890 |
| RES-P3-010 | P3 | verified-fixed | `requestTimeout` 408 does not abort handler | `middleware/request-timeout.ts` aborts and destroys socket |
| RES-P3-011 | P3 | partially-fixed | Task deadline fails task but does not cancel in-flight work | Signal consumed by purge/orphan/prune/retention; most other handlers ignore it |
| RES-P3-012 | P3 | verified-fixed | Rolling deploy hard-removes Caddy before recreating | `deploy-do.yml:1030-1043` `caddy reload`; recreate only on failure |

Counts: **18 verified-fixed / 4 partially-fixed / 0 regressed / 0 open** (no new RES finding).

## Residual detail

### RES-P2-005 — dead-man's switch is still unprovisioned and unexercised

The Alertmanager `Watchdog` rule, dedicated receiver and fail-closed prod deploy guard remain in place, but `ALERTMANAGER_WATCHDOG_WEBHOOK_URL` is still unset (`docs/INCIDENT_RESPONSE.md:158`; `docs/DATA_BREACH_RESPONSE.md:149`). The first scheduled alert-path exercise (41323651243, 2026-11-01) **failed at the “Exercise alert delivery on the droplet” step (exit 1)**, and `docs/ALERT_PATH_EXERCISE.md:104-110` still records no exercise. A total loss of the monitoring path is still invisible off-box.

### RES-P2-006 — recovery is configured but never exercised

`db-restore-test.yml:196-293` and `restore-storage.sh:114-137` contain real integrity assertions, but there is still **no successful backup or restore run**. Latest failures on 2026-11-02: db-backup 41440899317 and storage-backup 41448770549 in their backup scripts; db-restore-test 41471860987 and storage-restore-test 41484522284 at "Find latest backup" (exit 254), before any restore assertion. `docs/runbooks/backup-restore-drill-ledger.md:12-26` marks every drill `planned`. This is the operational face of DR-P0-001.

### RES-P3-005 — no proof a purge removed anything

`orphan-cleanup.ts` paginates the listing, refuses unsafe folder paths and enforces a 10k ceiling, but after `storage.from(bucket).remove(orphaned)` it logs the requested count and does not re-list/compare. A silently incomplete delete therefore looks like success. Fix: re-list the bucket (or the removed prefixes) after removal, compare against the expected deletion set, and return `ok:false` on a shortfall; expose a removal-shortfall counter.

### RES-P3-011 — cancellation is cooperative, not enforced

The registry still races the handler against a deadline (`task-registry.ts:150-233`) and returns a timeout while the handler can keep running. This diff added checks to the destructive/long paths (`lib/purge.ts:66-72`, `tasks/orphan-cleanup.ts:108,162,207,272`, `tasks/api-key-prune.ts:57`, retention/public-interaction handlers), which is a real improvement. But integration syncs, monitor checks and most other task handlers still do not read `context.signal`, so expensive non-idempotent work can continue after the task was failed and BullMQ retries it.

## Recommendations

### Immediate / release blocking

1. Provision `ALERTMANAGER_WATCHDOG_WEBHOOK_URL` and run the missed-heartbeat drill; link the artifact in `docs/ALERT_PATH_EXERCISE.md`.
2. Provision the backup secrets and run db-backup + db-restore-test manually; record green run URLs and the first ledger row.

### This week

3. Run the alert-path exercise on dev and fix the failed first run (41323651243), then record the evidence row.
4. Add a post-remove verification to orphan cleanup (RES-P3-005).

### This month

5. Extend cooperative cancellation to the remaining long handlers, or document the non-cancellable allowlist explicitly.
6. Re-run the load/failure suite on the promoted SHA and record the run.

## Quick Wins

| Quick win | Why it helps | Files likely involved | Validation |
|---|---|---|---|
| Record the failed alert-path run and its cause | Converts a silent failure into a tracked action | `docs/ALERT_PATH_EXERCISE.md` | failed run linked + owner |
| Add post-remove re-list to orphan cleanup | Proves deletions actually happened | `apps/worker/src/tasks/orphan-cleanup.ts` | new assertion test |
| Record first green load-test URL | Proves budgets are exercised | `docs/CI.md` | run URL green |
| Re-run backup workflows after secrets | Converts configured DR to exercised DR | `.github/workflows/db-backup.yml` | green run + ledger row |

## Suggested Tests

- **Chaos**: kill Redis during a BullMQ job; assert `/health` 503, queue alert fires and no duplicate side effects.
- **Cancellation**: a handler that sleeps past `WORKER_TASK_TIMEOUT_MS` with/without signal cooperation; assert in-flight work stops for the destructive tasks.
- **Orphan cleanup**: mock a partial `remove()` and assert the task returns `ok:false` after the post-remove re-list.
- **Deploy**: a policy test that no success path contains `docker rm -f` for the ingress and that `caddy reload` is attempted first.

## Suggested Documentation Updates

- `docs/ALERT_PATH_EXERCISE.md`: replace `none recorded yet` with the first run and its failure/fix.
- `docs/runbooks/backup-restore-drill-ledger.md`: record the first drill once green.
- `AGENTS.md` / `docs/CI.md`: note that load/failure tests now run green and that Caddy reloads in place.
- `docs/RTO_RPO.md`: add the measured restore exercise when available.

## Open Questions

| Question | Why it matters | Evidence needed |
|---|---|---|
| Why did alert-path run 41323651243 fail? | Distinguishes missing secrets from a broken delivery path | Failed run log / step output |
| Which backup secret is missing today? | Determines the operator action | Failing step log (admin) |
| How many handlers still ignore `context.signal`? | Scopes the residual cancellation work | Static inventory of registered tasks |

## Appendix

- GitHub Actions evidence (public API, read-only, 2026-11-03): load-test 41511827450 scheduled and 41515001890 dispatch success on 2026-11-02; alert-path-exercise 41323651243 failed on 2026-11-01; backup/restore runs all failed on 2026-11-02 (41440899317, 41448770549, 41471860987, 41484522284); smoke 41592985890 success.
- No new RES finding was raised; the only status movement is RES-P3-011 (open → partially-fixed) and RES-P3-012 (open → verified-fixed).
