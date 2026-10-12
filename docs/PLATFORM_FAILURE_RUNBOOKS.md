# Platform Failure Runbooks

**Owner:** Platform/Engineering lead · **Last reviewed:** 2026-10-11 · **Review cadence:** quarterly

Companion to [`INCIDENT_RESPONSE.md`](INCIDENT_RESPONSE.md) and
[`ROLLBACK_PROCEDURES.md`](ROLLBACK_PROCEDURES.md). These are the operator
runbooks for the top platform failure modes identified by the repo-deep-dive
audit (`ARCH-P2-001`, `OBS-P3-001`). Each section states the signal, the first
actions, and the recovery path.

> Scope: the current single-droplet topology (api, web, worker, caddy, redis,
> prometheus, alertmanager on one DigitalOcean droplet). The droplet is the
> single point of failure; these runbooks exist so host loss has a rehearsed
> path before a multi-node topology is funded (`ARCH-P2-001`).

See also [`SLO.md`](SLO.md) for the availability/latency objectives these
runbooks protect.

## 0. Single-host loss / full-outage recovery (ARCH-P2-001)

**Signal:** `MCTServiceDown` for both `mct-api` and `mct-worker`; the public
site and API are unreachable; SSH to the droplet fails or the droplet is gone.

**Impact:** full outage — API, web, jobs and realtime are all down together.

**Recovery path (snapshot/restore):**

1. Confirm the droplet state in the DigitalOcean console (`infra/terraform/digitalocean/droplet.tf`
   defines the host; Terraform state is remote in DO Spaces).
2. If the host is lost, create a replacement from the most recent snapshot, or
   re-create the droplet with Terraform:
   ```bash
   cd infra/terraform/digitalocean
   terraform init -backend-config=env/backend.prod.hcl
   terraform plan  -var-file=prod.tfvars
   terraform apply -var-file=prod.tfvars
   ```
   Terraform re-applies the firewall, DNS and droplet; the cloud-init bootstrap
   in `infra/terraform/digitalocean/cloud-init.yml` installs Docker, and the
   compose stack in `infra/digitalocean/docker-compose.yml` starts the services.
3. Rehydrate the droplet `.env` from the GitHub Environment secrets
   (`deploy-do.yml` renders it). Do **not** hand-copy secrets.
4. Restore data using [`ROLLBACK_PROCEDURES.md`](ROLLBACK_PROCEDURES.md) and the
   database/storage backup workflows. Supabase is managed externally; only the
   droplet-local state (Redis, Prometheus/Alertmanager volumes) is lost.
5. Verify: `/health` returns `ok`, `MCTServiceDown` clears, and a test job runs.

**Prevention / next step:** move Redis to a managed/replicated instance, add a
second API replica with an external rate-limit store, and take scheduled droplet
snapshots. This is an infra/budget decision (open question in PATCH-013).

## 1. Redis down / OOM (ARCH-P2-005)

**Signal:** `MCTApiRedisDegraded` (API probe failing), `MCTRedisOperationFailures`
(a cache/idempotency/scan-lock fallback), `MCTWorkerQueueDisconnected`, or
`MCTServiceDown` for the worker; the `redis` container restarting; BullMQ jobs
stalled.

**Why it matters:** a single non-replicated Redis (48 MB cap, no replica or
sentinel) backs four things at once — the BullMQ task queue, the response
cache, idempotency keys and the worker scan locks. Its loss does not stop the
API, because each consumer degrades on its own, which is exactly why the
degradation is easy to miss. The fail-open/fail-closed behavior per consumer:

- **Queue:** the worker `/health` returns 503 and `worker_queue_connected`
  drops to 0 (critical alert). Scheduled scans run directly instead of via the
  queue; request-time tasks enqueued by the API fall back to inline execution.
- **Cache:** reads/writes fall back to a per-process in-memory map (fail-open;
  entries are no longer shared or invalidated across processes).
- **Idempotency:** keys fall back to per-process memory (fail-open; only safe
  while single-replica — with more than one API/worker process, duplicate side
  effects become possible).
- **Scan locks:** scans run without the lock (fail-open; single-replica safe).

**Actions:**
1. `docker compose -f infra/digitalocean/docker-compose.yml ps` and
   `docker compose logs --tail=200 redis`.
2. Confirm the degradation from the metrics: `portal_redis_connected` (API
   probe), `portal_redis_failures_total` / `worker_redis_failures_total`
   (fallbacks), `worker_queue_connected` (queue).
3. If OOM: raise the Redis memory cap or reduce worker concurrency, then
   `docker compose up -d redis`. Redis is a single non-replicated instance with a
   48 MB cap (`ARCH-P2-005`), so treat repeated OOM as a capacity signal.
4. Jobs that failed mid-flight are retried by BullMQ; check the dead-letter
   view and re-drive only after Redis is stable.

**Prevention / next step:** split queue vs cache (or replicate Redis) and add
the OOM/queue-depth alerting the audit recommended; that is an infra/budget
decision, tracked as the residual of `ARCH-P2-005`.

## 2. Supabase unavailable

**Signal:** API `/health` degraded, `MCTHighRequestErrorRate`, or Supabase status
page incident.

**Actions:**
1. Confirm scope on the Supabase status page and the API logs.
2. This is an external dependency — there is no self-hosted fallback. The web
   storefront falls back to the bundled offline catalog
   (`apps/web/lib/catalog/catalog-source.ts`), so static pages stay up while the
   API is degraded.
3. Post a status update to the platform status topic
   ([`STATUS_AND_COMMUNICATION.md`](STATUS_AND_COMMUNICATION.md)) and follow
   the Supabase incident. The per-tenant status-page *product feature*
   (`docs/features/public-status-page.md`) is unrelated — it publishes tenants'
   own service status, not MCT's. Do **not** fail over the database by hand.

## 3. Failed deploy

**Signal:** `deploy-do.yml` fails or the new revision is unhealthy after deploy.

**Actions:**
1. Follow [`ROLLBACK_PROCEDURES.md`](ROLLBACK_PROCEDURES.md) to redeploy the
   previous image/tag.
2. Check `deploy-do.yml` logs and the `migrate-gate`; a failed migration blocks
   prod deploy by design.
3. If the failure is a bad migration, do not re-run blindly — use the migration
   rollback guidance in `ROLLBACK_PROCEDURES.md`.

## 4. Webhook backlog

**Signal:** `webhook_deliveries` failures, worker dead-letter growth, or Stripe /
JSM / M365 delivery failures.

**Actions:**
1. Inspect failed deliveries (`apps/worker/src/tasks/webhook-retry.ts` retries
   with backoff; dead letters surface in the admin webhook view).
2. Fix the downstream endpoint or secret, then re-drive dead letters.
3. If a provider is replaying, verify idempotency keys are intact before
   re-driving (`apps/api/src/lib/idempotency.ts`).

## 5. Client offline / poor network (USE-P3-002)

**Signal:** user reports "nothing loads", stale pages, or the amber "You are
offline" banner (`apps/web/components/OfflineIndicator.tsx`).

**How the client behaves:**
- `apps/web/public/sw.js` is registered by
  `apps/web/components/ServiceWorkerRegistrar.tsx` in production, scoped to
  `/`. It caches only public static assets (script/style/font/image/manifest),
  never `/api/` responses or authenticated page HTML.
- Navigation requests are network-first; when the network is unavailable the
  worker serves the precached `/offline` fallback page.
- In-app, `OfflineIndicator` shows a banner while `navigator.onLine` is false
  and offers Retry; forms surface a timeout message instead of hanging.
- The storefront additionally falls back to the bundled catalog
  (`apps/web/lib/catalog/catalog-source.ts`) when the API is degraded.

**Actions:**
1. Ask the user to confirm connectivity and press Retry (a reload re-checks the
   network; the worker updates itself on the next navigation).
2. If a stale asset is suspected, clear site data for the origin or send
   `{ type: "PURGE_CACHES" }` to the worker; `activate` also deletes caches
   whose name is not the current `CACHE_NAME`.
3. Do not "fix" offline behavior by caching API responses — authenticated JSON
   must stay network-only (MOB-P2-002).

## 6. Verification and drills

- **Runbooks are only real once exercised.** Record each drill below with date,
  operator, variant, and the observed pass/fail — an empty row is an unverified
  path. Operators are assigned from the on-call rota
  ([`templates/ONCALL_ROTA.md`](templates/ONCALL_ROTA.md)); until the rota is
  filled, every `_unassigned_` row is itself a gap (`IR-P2-008`).
- At minimum exercise once before go-live: single-host restore (section 0) and
  the database restore (`db-restore-test.yml`).
- The backup/restore drill program (D1–D7) lives at
  [`runbooks/backup-restore-drill-plan.md`](runbooks/backup-restore-drill-plan.md)
  with its results ledger at
  [`runbooks/backup-restore-drill-ledger.md`](runbooks/backup-restore-drill-ledger.md)
  (relocated from the dated audit folder, DR-P3-001). Record D1–D7 results
  there, not in this table.

| Date | Runbook | Operator | Variant | Result | Evidence |
| ---- | ------- | -------- | ------- | ------ | -------- |
| _pending_ | 0. Host restore | _unassigned_ | snapshot restore to a scratch droplet | — | — |
| _pending_ | 1. Redis down | _unassigned_ | OOM + restart | — | — |
| _pending_ | 2. Supabase unavailable | _unassigned_ | status-page + storefront fallback | — | — |
| _pending_ | 3. Failed deploy | _unassigned_ | rollback to previous tag | — | — |
| _pending_ | 4. Webhook backlog | _unassigned_ | re-drive dead letters | — | — |
| _pending_ | 5. Client offline | _unassigned_ | offline navigation + banner | — | — |
| _pending_ | 6. Terraform state restore | _unassigned_ | `scripts/terraform-state-restore.sh` scratch copy + plan-only verify (`docs/ROLLBACK_PROCEDURES.md` §4) | — | — |
