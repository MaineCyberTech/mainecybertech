# Incident Tabletop Scenarios — MCT Platform

**Owner:** Platform/Engineering lead · **Last reviewed:** 2026-10-11 · **Review cadence:** quarterly (and after any major topology change)

A ready-to-run scenario catalog, readiness inventory, and facilitation kit for
MCT platform tabletops. All scenarios are grounded in this repository's real
architecture: a single DigitalOcean droplet running Docker Compose
(caddy/web/api/worker/redis/prometheus/alertmanager) behind Cloudflare, hosted
Supabase (Postgres + auth + storage), GitHub Actions + GHCR for CI/CD, S3/DO
Spaces for backups and Terraform state, Sentry for errors, and the org ntfy
instance for alert delivery.

- **Replaces** the stale 20261002 catalog that lived only under
  `docs/audits/repo-deep-dive/20261002-0344-develop-6286137/` (it still claimed
  the IR plan was absent and Alertmanager was not deployed).
- **Refreshed against** `develop` at `ad0c720c` (2026-10-11), reconciling the
  `mainecybertech-20261011-0426-full-main-8d299b8` audit body with the fixes
  merged to `develop`.
- **Exercise status:** no live tabletop has been facilitated yet. The first
  recorded exercise is a **desk dry-run of IR-011** in
  [`INCIDENT_TABLETOP_DRYRUN_2026-10-11.md`](INCIDENT_TABLETOP_DRYRUN_2026-10-11.md);
  the live missed-heartbeat drill remains operator-gated (`IR-P0-003`).

## 1. Incident Readiness Inventory

| Capability | Status | Evidence | Notes |
|---|---|---|---|
| Platform IR plan (roles/severity/comms/postmortem) | **Implemented** | [`INCIDENT_RESPONSE.md`](INCIDENT_RESPONSE.md) | Rota unassigned (`IR-P2-008`); templates now under `docs/templates/` |
| Data breach process | **Implemented** | [`DATA_BREACH_RESPONSE.md`](DATA_BREACH_RESPONSE.md) | 459 lines; never exercised; Legal gates notification |
| On-call / pager | **Template only** | [`templates/ONCALL_ROTA.md`](templates/ONCALL_ROTA.md) | Not operational until names are committed (`IR-P2-008`) |
| Status / communication surface | **Configured, not verified** | [`STATUS_AND_COMMUNICATION.md`](STATUS_AND_COMMUNICATION.md) | ntfy `portal-status`; one-time ACL verification pending (`IR-P2-005`) |
| Error tracking | Implemented | Sentry init API/worker/web | Skipped when `SENTRY_DSN` unset |
| Alert rules (metrics) | Implemented (21 rules) | `infra/digitalocean/prometheus.rules.yml` | Availability, latency, breaker, auth, impersonation, RLS, webhook/notification/worker/billing |
| Alert delivery | **Live, unexercised** | `alertmanager.tmpl.yml` → ntfy `portal-alerts` | `critical`/`default` receivers; first exercise not yet recorded ([`ALERT_PATH_EXERCISE.md`](ALERT_PATH_EXERCISE.md)) |
| Off-box dead-man's switch | **Configured, not provisioned** | `Watchdog` rule + watchdog receiver | `ALERTMANAGER_WATCHDOG_WEBHOOK_URL` unset (operator context, not repo-verifiable) |
| Alert-rule unit tests | Implemented in CI | `prometheus.rules.test.yml`, `.github/actions/prometheus-rules` | `promtool check rules` + `test rules` |
| Health endpoints | Implemented | `apps/api/src/routes/health.ts`; worker health fatal in deploy | |
| Deploy health gate + auto-revert | Implemented | `.github/workflows/deploy-do.yml` | Prod deploy attaches `prod-approval` |
| Docker rollback (SHA) | Implemented | `deploy-do.yml` rollback input; [`ROLLBACK_PROCEDURES.md`](ROLLBACK_PROCEDURES.md) §1 | Precondition: images exist |
| DB rollback | Manual only | `ROLLBACK_PROCEDURES.md` §3 | Reverse SQL / PITR; drift check fail-closed |
| Terraform rollback | Documented, untested | `ROLLBACK_PROCEDURES.md` §4 | No state-restore drill (`IR-P3-001`) |
| Daily DB backup | Implemented | `db-backup.yml` + `scripts/backup-database.sh` | Encrypted when `BACKUP_ENCRYPTION_KEY` set; ntfy/Slack on failure |
| Storage backup | Implemented | `storage-backup.yml` + `storage-restore-test.yml` | Mirror + restore assertions |
| Restore drill | Implemented (deep) | `db-restore-test.yml` | Structure + freshness + RLS floors (`IR-P1-004`) |
| RPO/RTO targets | Documented, PITR unproven | [`RTO_RPO.md`](RTO_RPO.md) | 5-min PITR RPO needs a dated drill |
| Secret scanning | Implemented | `.husky/pre-commit`, `scripts/scan-secrets.sh`, `test.yml` | |
| Secrets rotation docs | Implemented, unexercised | [`SECRETS_ROTATION.md`](SECRETS_ROTATION.md) | Rotation log has no drill row |
| Audit logging | Implemented | `apps/api/src/services/audit.ts` | Gap logged, still not alerted (`IR-P2-002` residual) |
| RLS enforcement + runtime alert | Implemented | `docs/RLS-rollout.md`, `MCTTenantScopeRegression` | Service-role default remains a known risk |
| Supply chain | Implemented | `test.yml`, `dependency-review.yml`, `sbom.yml`, Trivy + provenance attestation in `build-push.yml` | No re-scan alert for already-shipped images |
| Postmortem tracking | Template only | [`templates/POSTMORTEM.md`](templates/POSTMORTEM.md) | No in-repo postmortem registry yet |

## 2. Severity Model

Use the platform severity model in [`INCIDENT_RESPONSE.md`](INCIDENT_RESPONSE.md)
§1 (Sev-1 / Sev-2 / Sev-3). For tabletop scoring, map the stale catalog's
SEV1–SEV5 scale onto it as: SEV1 → Sev-1, SEV2–SEV3 → Sev-2, SEV4 → Sev-3,
SEV5 → backlog/hygiene (not an incident).

Roles come from `INCIDENT_RESPONSE.md` §2; the **names** come from the on-call
rota ([`templates/ONCALL_ROTA.md`](templates/ONCALL_ROTA.md)) — until the rota is
filled, every exercise must record who is playing each role.

## 3. Scenario Catalog

Each scenario lists: trigger → detection → triage → containment → recovery →
target (`docs/RTO_RPO.md`) → what the repo does/does not enable → injects for
facilitation → evidence paths.

### IR-001 — Total database loss / restore (Supabase)

- **Trigger**: Supabase project unavailable or data corrupted; `SUPABASE_URL` points at a dead project.
- **Detection**: API `/health` degraded (`checks.database` — `apps/api/src/routes/health.ts`); `MCTServiceDown`/`MCTHighRequestErrorRate` via Alertmanager → ntfy; Sentry error spike; `db-backup.yml` failure notice.
- **Triage**: Confirm DB outage vs app config; check the Supabase status page; check the last successful `db-backup` run and restore-test freshness.
- **Containment**: Freeze writes to affected tables/jobs before restoring; if the failure is config, repair env and redeploy.
- **Recovery**: Restore from the latest S3 dump using the `db-restore-test` pattern, or Supabase PITR (`ROLLBACK_PROCEDURES.md` §3); pair storage restore (`storage-restore-test.yml`) so document links resolve.
- **Target**: Postgres RTO 1 h / RPO 5 min (`RTO_RPO.md`).
- **Repo enables**: Daily dump (30-day retention, encryption/offsite when configured); weekly deep restore test (structure + freshness + RLS); documented PITR steps.
- **Repo gaps**: PITR 5-min RPO never drilled; encryption/offsite activation is operator-gated (`RTO_RPO.md` §operator actions).
- **Injects**: (a) backup object is 26 h old — does ≤24 h dump RPO hold? (b) restored DB is missing the last 3 hours — PITR or accept? (c) restore target must be a throwaway project.
- **Evidence**: `db-backup.yml`, `db-restore-test.yml`, `storage-restore-test.yml`, `scripts/backup-database.sh`, `docs/RTO_RPO.md`, `docs/ROLLBACK_PROCEDURES.md` §3.

### IR-002 — Secret / key compromise (JWT or Supabase service-role)

- **Trigger**: Secret leaked (repo, CI log, laptop) or suspected misuse.
- **Detection**: No dedicated compromise-detection alert; current detection is likely an external report or a secret-scan hit. `MCTImpersonationActivity` may catch misuse.
- **Triage**: Identify which secret; determine blast radius (JWT = sessions; service-role = all tenant data, RLS bypass).
- **Containment**: Revoke in the source system first, then rotate all consumers per [`SECRETS_ROTATION.md`](SECRETS_ROTATION.md) §Emergency Rotation.
- **Recovery**: Redeploy with new secrets (`deploy-do.yml`); force logout (JWT rotation per [`JWT_ROTATION.md`](JWT_ROTATION.md) / Supabase session invalidation).
- **Target**: Not specified; aim "same day".
- **Repo enables**: 40-secret rotation inventory + emergency procedure; multi-secret zero-downtime JWT rotation; pre-commit + CI secret scanning.
- **Repo gaps**: No compromise-detection alert; rotation log has no exercised row (`IR-P2-004`); no automated force-logout.
- **Injects**: (a) service-role key appears in a CI log; (b) JWT secret shared across dev/prod; (c) attacker holds a valid admin session after rotation.
- **Evidence**: `docs/SECRETS_ROTATION.md`, `docs/JWT_ROTATION.md`, `.husky/pre-commit`, `scripts/scan-secrets.sh`, `test.yml`.

### IR-003 — Bad migration (destructive or breaking schema change)

- **Trigger**: `supabase db push --include-all` applies a migration that drops a column, breaks RLS, or corrupts data.
- **Detection**: Post-deploy 5xx spike (`MCTHighRequestErrorRate` → ntfy); Sentry; health DB check; migration drift gate.
- **Triage**: Identify the migration; assess data vs schema damage; read the dry-run plan artifact from the run.
- **Containment**: Stop further migrations; stop writes to affected tables if corruption is ongoing.
- **Recovery**: Reverse migration (manual) or PITR (`ROLLBACK_PROCEDURES.md` §3); re-run the drift check.
- **Target**: Postgres RTO 1 h.
- **Repo enables**: Serialized migration runs; dry-run plan uploaded as an artifact (`IR-P2-006`); fail-closed post-push drift check.
- **Repo gaps**: No automated reverse; reverse/PITR still manual and undrilled.
- **Injects**: (a) migration dropped an FK three modules depend on; (b) migration ran on prod but not dev; (c) the reverse migration itself fails.
- **Evidence**: `.github/workflows/supabase-migrations.yml`, `docs/ROLLBACK_PROCEDURES.md` §3, `docs/SUPABASE_MIGRATION_WORKFLOW.md`.

### IR-004 — Failed deploy / rollback

- **Trigger**: A deploy fails or degrades the app.
- **Detection**: `deploy-do.yml` container health gate fails; `MCTServiceDown`; GitHub notification.
- **Triage**: Check whether auto-revert already ran; inspect the deploy logs and the failing container's health.
- **Containment**: Let auto-revert complete; if not, run a manual SHA rollback.
- **Recovery**: `workflow_dispatch` with `rollback_sha` input, or `IMAGE_TAG=<sha> docker compose up -d` (`ROLLBACK_PROCEDURES.md` §1).
- **Target**: App RTO 15 min (`RTO_RPO.md`).
- **Repo enables**: Auto-revert on failed health; **worker health is now fatal** (`IR-P1-003`); SHA input validated; deploy concurrency control; prod deploy is approval-gated (`prod-approval`).
- **Repo gaps**: Rollback requires the previous image tag to still exist (workflow prunes old tags after success).
- **Injects**: (a) rollback SHA images were pruned; (b) worker is dead but API green — does the gate catch it? (c) the rollback itself fails health.
- **Evidence**: `.github/workflows/deploy-do.yml`, `docs/ROLLBACK_PROCEDURES.md` §§1–2, `docs/FINAL_DEPLOYMENT_OPERATIONS_HANDBOOK.md` §Rollback.

### IR-005 — Supabase outage (hosted dependency)

- **Trigger**: Hosted Supabase unavailable, rate-limited, or degraded.
- **Detection**: API `/health` degraded; `MCTCircuitBreakerOpen` (critical) or `MCTHighRequestErrorRate` → ntfy; Supabase status page.
- **Triage**: Confirm provider scope; check connection pool and circuit-breaker state; distinguish from app config.
- **Containment**: The circuit breaker sheds load (`apps/api/src/lib/circuit-breaker.ts`); the web storefront serves the bundled offline catalog while the API is degraded.
- **Recovery**: Follow the provider incident; if prolonged, fail over to a PITR recovery project (`ROLLBACK_PROCEDURES.md` §3).
- **Target**: Postgres RTO 1 h.
- **Repo enables**: Circuit breaker + alert rule; health checks; troubleshooting doc; documented PITR failover.
- **Repo gaps**: No provider-aware alert (only self-observed symptoms); no external synthetic monitor proving reachability from outside; the status surface is not yet ACL-verified.
- **Injects**: (a) Supabase is up but slow (connection pool exhausted); (b) outage exceeds 1 h; (c) elevated error rate during recovery.
- **Evidence**: `apps/api/src/routes/health.ts`, `apps/api/src/lib/circuit-breaker.ts`, `infra/digitalocean/prometheus.rules.yml` (`MCTCircuitBreakerOpen`), `docs/TROUBLESHOOTING.md`, `docs/STATUS_AND_COMMUNICATION.md`.

### IR-006 — Dependency / supply-chain compromise

- **Trigger**: A malicious or vulnerable package enters the tree, or a transitive dependency is compromised upstream.
- **Detection**: `pnpm audit` gate, Trivy image scans, Dependency Review, Dependabot alerts, SBOM diff.
- **Triage**: Identify the package and reach (runtime vs build-only); check whether it shipped in a released image.
- **Containment**: Block/rollback the PR; pin or override the dependency; rebuild affected images.
- **Recovery**: Deploy patched images; rotate any secrets the package could have accessed.
- **Target**: Not specified.
- **Repo enables**: Multiple gates; SBOM generation; build provenance attestation for api/worker/web images; SHA-pinned actions.
- **Repo gaps**: No alert if an already-shipped image is later found vulnerable; Trivy skips `pnpm-lock.yaml` (delegated to `pnpm audit`).
- **Injects**: (a) compromise is in a build-only dependency with no runtime reach; (b) a vuln is discovered after release; (c) the lockfile is altered in a PR.
- **Evidence**: `test.yml` security-scan, `dependency-review.yml`, `sbom.yml`, `build-push.yml` (Trivy + attestation), `.github/dependabot.yml`, `pnpm-lock.yaml`.

### IR-007 — CI/CD compromise

- **Trigger**: A workflow, token, or action is compromised; the attacker gains deploy or secrets access.
- **Detection**: Unusual workflow runs, an unexpected deploy, GitHub security alerts — **no out-of-band CI anomaly alert exists**.
- **Triage**: Identify the compromised token/action; determine whether a deploy ran and from which SHA.
- **Containment**: Revoke tokens; disable workflows; rotate secrets (`SECRETS_ROTATION.md`).
- **Recovery**: Rebuild and redeploy from a known-good SHA; verify image provenance.
- **Target**: Not specified.
- **Repo enables**: Least-privilege `permissions:` blocks; SHA-pinned third-party actions; no `pull_request_target`; concurrency control; provenance attestation.
- **Repo gaps**: No external CI anomaly alert; deploy SSH key is root (`CI_SSH_PRIVATE_KEY`).
- **Injects**: (a) a compromised action version is pushed upstream; (b) a leaked `GITHUB_TOKEN` with `packages: write`; (c) a malicious workflow is added on a branch.
- **Evidence**: `.github/workflows/*` permissions blocks, `docs/CI.md`, prior audit `10_github_actions_cicd_governance.md`.

### IR-008 — RLS regression exposing tenant data

- **Trigger**: An RLS allow-list change or policy bug lets one tenant read another's data.
- **Detection**: `MCTTenantScopeRegression` / `MCTRlsEnforcedShareCollapsed` → ntfy; multi-tenant isolation tests; Sentry may catch errors.
- **Triage**: Identify module + table; confirm cross-tenant read with a seeded probe; check `portal_rls_bypass_total`.
- **Containment**: Remove the module key from `RLS_READS_ENABLED`/`RLS_WRITES_ENABLED` and redeploy (`docs/RLS-rollout.md` Rollback), or roll back the offending migration.
- **Recovery**: Fix policies; re-enable; verify isolation; assess exposure window (breach decision if confirmed).
- **Target**: Not specified; treat confirmed exposure as Sev-1 / B-1.
- **Repo enables**: Runtime RLS metrics + alert rules; static RLS hygiene gate (`scripts/verify-rls.mjs`); per-module reversible allow-list; coverage matrix.
- **Repo gaps**: Service-role is the API default client (RLS is not a DB backstop for API traffic).
- **Injects**: (a) a new migration adds an open policy (`using (true)`); (b) an admin path uses a user-scoped client by mistake; (c) exposure affects only pending members.
- **Evidence**: `docs/RLS-rollout.md`, `docs/RLS-coverage-matrix.md`, `docs/MT-P0-001-RLS-remediation-design.md`, `infra/digitalocean/prometheus.rules.yml`.

### IR-009 — Webhook / payment / notification failure

- **Trigger**: Teams/JSM/M365 webhooks fail; Stripe reconciliation drifts; email notifications stop.
- **Detection**: `MCTWebhookDeadLettersAccumulating`, `MCTWebhookDeliveryFailureRateHigh`, `MCTNotificationDeliveryFailureRateHigh`, `MCTStripeReconcileDrift`, `MCTWorkerTaskFailures`/`MCTWorkerTaskDeadLettered` → ntfy; worker Sentry.
- **Triage**: Check `webhook_dead_letters`, `webhook_deliveries`, Stripe reconcile output, and worker queue depth.
- **Containment**: Requeue/retry; disable a failing endpoint; pause the offending task type if it amplifies damage.
- **Recovery**: `webhook-retry` drains retries; `stripe-reconcile` re-syncs billing; re-drive dead letters after fixing the endpoint/secret.
- **Target**: Not specified; SLO in `docs/SLO.md`.
- **Repo enables**: Retry with backoff; dead-letter set; reconciliation task + drift alert; queue health rules; admin webhook view.
- **Repo gaps**: Alert delivery for these rules is itself unexercised end-to-end (first `ALERT_PATH_EXERCISE.md` evidence row pending).
- **Injects**: (a) Teams webhook returns 401 after secret rotation; (b) Stripe webhook secret rotated out of sync; (c) notification queue backs up.
- **Evidence**: `apps/worker/src/tasks/webhook-dispatcher.ts`, `webhook-retry.ts`, `stripe-reconcile.ts`, `infra/digitalocean/prometheus.rules.yml`, `docs/BILLING.md`.

### IR-010 — Admin abuse / insider action

- **Trigger**: An admin (or a stolen admin session) exports data or impersonates tenants.
- **Detection**: `MCTImpersonationBurst` / `MCTImpersonationActivity` → ntfy; `audit_logs` + `impersonation_log` (manual review). Audit-write gaps remain log-only.
- **Triage**: Pull admin audit events (`GET /audit`, `/audit/export`); review impersonation usage and unexpected orgs.
- **Containment**: Revoke sessions/keys; disable impersonation; adjust roles; rotate the service-role key if it is in scope.
- **Recovery**: Restore damaged data; tighten permissions; assess exposure as a breach if personal data was touched.
- **Target**: Not specified; treat confirmed exposure as Sev-1 / B-1.
- **Repo enables**: Admin-gated audit read/export; impersonation alert rules + tests; audit writes retried with PII redaction.
- **Repo gaps**: No alert on audit-write gaps; audit trail is not asserted tamper-evident.
- **Injects**: (a) an admin exports 10k rows (matches the export limit); (b) repeated impersonations across tenants; (c) audit inserts fail during the abuse window.
- **Evidence**: `apps/api/src/routes/audit.ts`, `apps/api/src/services/audit.ts`, `infra/digitalocean/prometheus.rules.yml`, `docs/portal_admin_permissions_guide.md`.

### IR-011 — Total loss of the monitoring/alerting path

- **Trigger**: Prometheus/Alertmanager/Sentry/droplet monitoring all fail, or network egress is cut.
- **Detection**: **Still not independent.** The `Watchdog` route and receiver exist, but `ALERTMANAGER_WATCHDOG_WEBHOOK_URL` is unset, so the heartbeat stays on the box; the primary channel (ntfy delivery) is inside the failing path. Fallback: customer report or manual check.
- **Triage**: Only possible from outside (customer report / external monitor) — SSH and inspect container health, disk, and egress.
- **Containment**: Restore the monitoring components; restore egress; do not silence the watchdog while doing so.
- **Recovery**: Rebuild Prometheus/Alertmanager; re-point scrape targets; confirm the Watchdog heartbeat resumes.
- **Target**: Not specified; treat as Sev-2 until the off-box receiver is live.
- **Repo enables**: Watchdog rule + receiver config + fail-closed deploy guard; `alert-path-exercise.yml` (synthetic delivery check, monthly); [`ALERT_PATH_EXERCISE.md`](ALERT_PATH_EXERCISE.md) runbook + evidence table.
- **Repo gaps**: Off-box receiver unset (`IR-P0-003` residual); the alert-path exercise has **no recorded run** yet; the status surface is configured but not ACL-verified.
- **Injects**: (a) droplet is up but Prometheus is down; (b) `SENTRY_DSN` unset so errors are silent; (c) alert egress is blocked by a firewall rule.
- **Evidence**: `infra/digitalocean/prometheus.rules.yml`, `infra/digitalocean/alertmanager.tmpl.yml`, `docs/MONITORING_AND_ALERTING.md` §9, `docs/ALERT_PATH_EXERCISE.md`.
- **First exercise**: desk dry-run recorded in [`INCIDENT_TABLETOP_DRYRUN_2026-10-11.md`](INCIDENT_TABLETOP_DRYRUN_2026-10-11.md).

### IR-012 — Recurring incident / fix durability

- **Trigger**: A previously fixed incident recurs (e.g. a prior-run finding).
- **Detection**: Depends on the original signal; compare against prior postmortems — there is **no in-repo postmortem registry yet** (the template now exists).
- **Triage**: Find the original finding/postmortem and check whether its regression guard still runs.
- **Containment/Recovery**: As per the original scenario.
- **Target**: N/A.
- **Repo enables**: Prior audit reports under `docs/audits/`; postmortem template; the IR plan's "no doc/config change = not closed" rule.
- **Repo gaps**: No postmortem store; not every fix is bound to a permanent guard.
- **Injects**: (a) worker-health non-fatality recurs across deploys; (b) a rotation is skipped again; (c) the monitoring path fails a second time.
- **Evidence**: `docs/audits/repo-deep-dive/`, `docs/templates/POSTMORTEM.md`, `docs/INCIDENT_RESPONSE.md` §4.4.

## 4. Scenario / Control Matrix

Repo-readiness rating per scenario (0–5): would the repository, as it stands,
enable detection → triage → recovery within `docs/RTO_RPO.md` targets? These are
documented-procedure ratings, **not** measured exercise results.

| ID | Scenario | Detection | Triage | Recovery | Overall | Weakest link / change since 20261002 |
|---|---|---:|---:|---:|---:|---|
| IR-001 | Total database loss / restore | 4 | 3 | 3 | 3.3 | Deep restore assertions; PITR still undrilled |
| IR-002 | Secret/key compromise | 2 | 3 | 3 | 2.7 | No compromise-detection alert; rotation undrilled |
| IR-003 | Bad migration | 3 | 3 | 2 | 2.7 | Dry-run artifact + fail-closed drift; reverse manual |
| IR-004 | Failed deploy / rollback | 4 | 4 | 4 | 4.0 | Worker health now fatal |
| IR-005 | Supabase outage | 3 | 3 | 3 | 3.0 | Breaker alert added; status surface unverified |
| IR-006 | Dependency / supply-chain compromise | 4 | 3 | 3 | 3.3 | Trivy + provenance attestation; no post-release re-scan alert |
| IR-007 | CI/CD compromise | 2 | 3 | 3 | 2.7 | No out-of-band CI anomaly alert |
| IR-008 | RLS regression / tenant exposure | 4 | 3 | 3 | 3.3 | Runtime metrics + rules + tests |
| IR-009 | Webhook / payment / notification failure | 4 | 3 | 4 | 3.7 | Dead-letter/reconcile rules added; delivery unexercised |
| IR-010 | Admin abuse / insider action | 3 | 3 | 3 | 3.0 | Impersonation alerts; audit gap still silent |
| IR-011 | **Total loss of the monitoring/alerting path** | 2 | 2 | 3 | 2.3 | Watchdog receiver unset and unexercised → still undetected |
| IR-012 | Recurring incident / fix durability | 3 | 3 | 2 | 2.7 | Postmortem template added; no postmortem registry |

## 5. Facilitation Kit

- **Ground rules**: no blame; the goal is finding detection/triage/recovery gaps;
  use only repo docs (no tribal knowledge) for the first pass.
- **Metrics per scenario**: time to detect (TTD), time to triage (TTT), time to
  recover (TTR), and whether RTO/RPO were met (`docs/RTO_RPO.md`).
- **Inject cadence**: start with the trigger, then add one complication every
  5 minutes.
- **Debrief questions**: Which signal would have caught this fastest? Which doc
  failed you? What did you have to invent on the spot? What single alert/test
  would prevent recurrence?
- **Output**: a postmortem per scenario
  ([`templates/POSTMORTEM.md`](templates/POSTMORTEM.md)) and a tracked
  action-item list; add a regression guard for each resolved finding.
- **Communication templates**: [`templates/INCIDENT_COMMS.md`](templates/INCIDENT_COMMS.md)
  (declaration, update, resolution, tenant notification) and the publishing
  procedure in [`STATUS_AND_COMMUNICATION.md`](STATUS_AND_COMMUNICATION.md).

## 6. Evidence Index

| Area | Path |
|---|---|
| Incident plans | `docs/INCIDENT_RESPONSE.md`, `docs/DATA_BREACH_RESPONSE.md`, `docs/PLATFORM_FAILURE_RUNBOOKS.md` |
| Status surface | `docs/STATUS_AND_COMMUNICATION.md`, `docs/templates/INCIDENT_COMMS.md` |
| Monitoring/alerting | `docs/MONITORING_AND_ALERTING.md`, `docs/ALERT_PATH_EXERCISE.md`, `infra/digitalocean/prometheus.rules.yml`, `alertmanager.tmpl.yml` |
| Deploy / rollback | `.github/workflows/deploy-do.yml`, `docs/ROLLBACK_PROCEDURES.md` |
| RTO/RPO | `docs/RTO_RPO.md` |
| Backups | `db-backup.yml`, `db-restore-test.yml`, `storage-backup.yml`, `storage-restore-test.yml`, `scripts/backup-database.sh` |
| Migrations | `supabase-migrations.yml`, `docs/SUPABASE_MIGRATION_WORKFLOW.md` |
| Secrets | `docs/SECRETS_ROTATION.md`, `docs/JWT_ROTATION.md`, `scripts/scan-secrets.sh` |
| RLS/tenancy | `docs/RLS-rollout.md`, `docs/RLS-coverage-matrix.md`, `scripts/verify-rls.mjs` |
| Audit | `apps/api/src/services/audit.ts`, `apps/api/src/routes/audit.ts` |
| Webhooks/payments | `apps/worker/src/tasks/webhook-dispatcher.ts`, `webhook-retry.ts`, `stripe-reconcile.ts`, `docs/BILLING.md` |
| Supply chain | `test.yml`, `dependency-review.yml`, `sbom.yml`, `build-push.yml`, `.github/dependabot.yml` |
| Operator docs | `docs/TROUBLESHOOTING.md`, `docs/FINAL_OPERATOR_MAP.md`, `docs/runbooks/README.md` |
| Product IR (not platform IR) | `docs/modules/incident-response.md`, `docs/features/security-incident-response.md` |

## 7. Recorded Exercises

| Date (UTC) | Scenario | Mode | Record | Result |
|---|---|---|---|---|
| 2026-10-11 | IR-011 monitoring-path loss | Desk dry-run (repo docs only; no live system) | [`INCIDENT_TABLETOP_DRYRUN_2026-10-11.md`](INCIDENT_TABLETOP_DRYRUN_2026-10-11.md) | Gaps documented; live drill still operator-gated |

## 8. Maintenance

Re-run these scenarios quarterly and after any major topology change (new
service, new datastore, new provider). Keep this catalog in sync with the IR and
breach plans; every scenario that exposes a gap produces an IR finding with a
regression guard, and every exercise gets a record in §7 plus an after-action
write-up.
