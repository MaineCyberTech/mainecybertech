# Platform Failure Runbooks

**Owner:** Platform/Engineering lead · **Last reviewed:** 2026-10-03 · **Review cadence:** quarterly

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

## 1. Redis down / OOM

**Signal:** `MCTServiceDown` for the worker, or API 5xx after a Redis OOM; the
`redis` container restarting; BullMQ jobs stalled.

**Actions:**
1. `docker compose -f infra/digitalocean/docker-compose.yml ps` and
   `docker compose logs --tail=200 redis`.
2. If OOM: raise the Redis memory cap or reduce worker concurrency, then
   `docker compose up -d redis`. Redis is a single non-replicated instance with a
   48 MB cap (`ARCH-P2-001`), so treat repeated OOM as a capacity signal.
3. Jobs that failed mid-flight are retried by BullMQ; check the dead-letter
   view and re-drive only after Redis is stable.

## 2. Supabase unavailable

**Signal:** API `/health` degraded, `MCTHighRequestErrorRate`, or Supabase status
page incident.

**Actions:**
1. Confirm scope on the Supabase status page and the API logs.
2. This is an external dependency — there is no self-hosted fallback. The web
   storefront falls back to the bundled offline catalog
   (`apps/web/lib/catalog/catalog-source.ts`), so static pages stay up while the
   API is degraded.
3. Post a status-page update (`docs/features/public-status-page.md`) and follow
   the Supabase incident. Do **not** fail over the database by hand.

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

## 5. Verification and drills

- **Runbooks are only real once exercised.** Record each drill below with date,
  operator, variant, and the observed pass/fail — an empty row is an unverified
  path.
- At minimum exercise once before go-live: single-host restore (section 0) and
  the database restore (`db-restore-test.yml`).

| Date | Runbook | Operator | Variant | Result | Evidence |
| ---- | ------- | -------- | ------- | ------ | -------- |
| _pending_ | 0. Host restore | _unassigned_ | snapshot restore to a scratch droplet | — | — |
| _pending_ | 1. Redis down | _unassigned_ | OOM + restart | — | — |
| _pending_ | 2. Supabase unavailable | _unassigned_ | status-page + storefront fallback | — | — |
| _pending_ | 3. Failed deploy | _unassigned_ | rollback to previous tag | — | — |
| _pending_ | 4. Webhook backlog | _unassigned_ | re-drive dead letters | — | — |
