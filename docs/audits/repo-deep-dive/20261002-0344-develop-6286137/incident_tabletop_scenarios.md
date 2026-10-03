# Incident Tabletop Scenarios — Companion Artifact

- Audit name: repo-deep-dive
- Run: 20261002-0344-develop-6286137
- Repository: C:\temp\mainecybertech
- Branch: develop
- Commit SHA: 62861370 (6286137017c4b7c77e83ee420ec11382d984f263)
- Companion to: `33_incident_tabletop_exercise.md`
- Area code: IR
- Purpose: A ready-to-run scenario catalog, readiness inventory, and communication templates for MCT platform tabletops.

> All scenarios are grounded in this repository's real architecture: a single DigitalOcean droplet running Docker Compose (caddy/web/api/worker/redis) behind Cloudflare, hosted Supabase (Postgres + auth + storage), GitHub Actions for CI/CD, GHCR for images, S3 (STANDARD_IA) for dumps, DO Spaces for Terraform state, Sentry for errors, Prometheus (internal) for metrics. Evidence paths are cited per scenario. This is a documented-procedure exercise; nothing below was executed against a live system.

---

## 1. Incident Readiness Inventory

| Capability | Status | Evidence | Notes |
|---|---|---|---|
| Platform IR plan (roles/severity/comms/postmortem) | **Absent** | no `docs/INCIDENT_RESPONSE.md` | Closest: `MONITORING_AND_ALERTING.md` §8 |
| Data breach process | **Absent** | `SECURITY.md` covers report-in only | See IR-P0-002 |
| On-call / pager | **Absent** | `MONITORING_AND_ALERTING.md` §7 | Best-effort alerts |
| Error tracking | Implemented | Sentry init API/worker/web | Skipped if `SENTRY_DSN` unset |
| Alert rules (metrics) | Rules exist, no delivery | `infra/digitalocean/prometheus.rules.yml` | Alertmanager required, not deployed |
| Log aggregation | Absent (SSH only) | Handbook §Monitoring; `MONITORING_AND_ALERTING.md` §1 | `vector` forwarding listed as future |
| Health endpoints | Implemented | `apps/api/src/routes/health.ts`; worker port 3001 | Redis non-degrading |
| Deploy health gate + auto-revert | Implemented | `deploy-do.yml` | Reverts to `PREV_TAG` |
| Worker health in deploy | Implemented but non-fatal | `deploy-do.yml` lines 515-522 | IR-P1-003 |
| Docker rollback (SHA) | Implemented | `deploy-do.yml` `rollback_sha`; `ROLLBACK_PROCEDURES.md` §1 | Precondition: images exist |
| DB rollback | Manual only | `ROLLBACK_PROCEDURES.md` §3 | Reverse SQL / PITR / manual |
| Terraform rollback | Documented | `ROLLBACK_PROCEDURES.md` §4 | Untested state restore |
| Daily DB backup | Implemented | `db-backup.yml` + `scripts/backup-database.sh` | Slack on failure |
| Restore drill | Implemented (shallow) | `db-restore-test.yml` | Counts tables only |
| RPO/RTO targets | Documented | `docs/RTO_RPO.md` | Unproven |
| Secret scanning | Implemented | `.husky/pre-commit`, `scripts/scan-secrets.sh`, `test.yml` | Fixed since prior run |
| Secrets rotation docs | Implemented | `docs/SECRETS_ROTATION.md`, `JWT_ROTATION.md` | Rotation log unexercised |
| Audit logging | Implemented | `apps/api/src/services/audit.ts` | Gap logged, not alerted |
| RLS enforcement | Partial (allow-list) | `docs/RLS-rollout.md`, matrix | service-role default |
| Multi-tenant isolation tests | Static gate only | `scripts/verify-rls.mjs` in test/validate | No runtime alert |
| Dependency / supply chain | Implemented | `dependency-review.yml`, `test.yml`, `sbom.yml`, `dependabot.yml` | No runtime attestation |
| Status page (platform) | Absent | `public-status-page.md` is per-tenant | IR-P2-005 |
| Postmortem tracking | Absent | — | IR-P0-001 |

---

## 2. Severity Model (proposed, for tablets)

| Level | Definition | Example | Target ack |
|---|---|---|---|
| SEV1 | Total platform outage or confirmed tenant-data exposure/loss | Droplet down; service-role key leaked and used | Immediate |
| SEV2 | Major function degraded; recovery path at risk | Bad migration; worker dead; monitoring path down | 15 min |
| SEV3 | Partial/limited impact with workaround | One module failing; webhook backlog | 1 hour |
| SEV4 | Minor issue, no customer impact yet | Metric not wired; stale docs | Next business day |
| SEV5 | Cosmetic / hygiene | Naming, polish | Backlog |

Roles: **Incident Commander** (decides, owns timeline), **Operations Lead** (executes fixes), **Comms Lead** (status page + customer updates), **Scribe** (timeline + evidence). For MCT's current scale one person may hold several roles — state which.

---

## 3. Scenario Catalog

Each scenario lists: trigger → detection signal → triage → containment → recovery → target (from `docs/RTO_RPO.md`) → what the repo does/does not enable → injects for facilitation → evidence paths.

### Scenario 1 — Total database loss / restore (Supabase)

- **Trigger**: Supabase project unavailable or data corrupted; `SUPABASE_URL` points at a dead project.
- **Detection**: API `/health` returns 503 (`checks.database` unhealthy — `apps/api/src/routes/health.ts`); Sentry error spike; `pg_dump` workflow fails (`db-backup.yml`).
- **Triage**: Confirm DB outage vs app config; check Supabase status; check `db-backup.yml` last successful run.
- **Containment**: If key/config issue, rotate/repair env; if project loss, restore.
- **Recovery**: Restore from daily S3 dump (`db-restore-test.yml` pattern) or Supabase PITR (`ROLLBACK_PROCEDURES.md` §3 Option B: create instance, update `SUPABASE_URL`, restart containers).
- **Target**: Postgres RTO 1h / RPO 5m (`docs/RTO_RPO.md`).
- **Repo enables**: Daily dump with 30-day retention; documented PITR steps; health check.
- **Repo gaps**: Restore drill verifies table count only (IR-P1-004); bucket wiring inconsistent (IR-P1-005); PITR never drilled.
- **Injects**: (a) Backup object is 26h old; (b) restored DB missing last 3 hours — does RPO hold? (c) restore target is the same project.
- **Evidence**: `db-backup.yml`, `db-restore-test.yml`, `scripts/backup-database.sh`, `docs/RTO_RPO.md`, `docs/ROLLBACK_PROCEDURES.md` §3.

### Scenario 2 — Secret / key compromise (JWT or Supabase service-role)

- **Trigger**: Secret leaked (repo, CI log, laptop) or suspected misuse.
- **Detection**: Ideally a JWT-fallback or Supabase access-log alert — **does not exist**. Current detection is likely an external report.
- **Triage**: Identify which secret; determine blast radius (JWT = sessions; service-role = all tenant data).
- **Containment**: Emergency rotation per `docs/SECRETS_ROTATION.md` §Emergency Rotation; revoke in source system first.
- **Recovery**: Deploy new secrets (`gh workflow run deploy-do.yml`); force logout (clear Supabase sessions / rotate service-role key).
- **Target**: Not specified; aim "same day".
- **Repo enables**: 40-secret rotation inventory + emergency steps; JWT multi-secret zero-downtime rotation (`docs/JWT_ROTATION.md`); pre-commit + CI secret scanning.
- **Repo gaps**: No compromise detection/alert (IR-P0-003, IR-P1-006); rotation log unexercised (IR-P2-004); no automated force-logout.
- **Injects**: (a) Service-role key appears in a CI log; (b) shared JWT secret across dev/prod; (c) attacker holds valid admin session post-rotation.
- **Evidence**: `docs/SECRETS_ROTATION.md`, `docs/JWT_ROTATION.md`, `.husky/pre-commit`, `scripts/scan-secrets.sh`, `test.yml`.

### Scenario 3 — Bad migration (destructive or breaking schema change)

- **Trigger**: `supabase db push --include-all` applies a migration that drops a column / breaks RLS / corrupts data.
- **Detection**: Post-deploy 5xx spike (`MCTHighRequestErrorRate` rule if delivered); Sentry errors; health DB check.
- **Triage**: Identify the migration; assess data vs schema damage.
- **Containment**: Stop further migrations; if writes are corrupting data, consider read-only/maintenance (`maintenance_notices` is product-level; no platform maintenance mode documented).
- **Recovery**: Reverse migration (manual), PITR, or manual SQL undo (`ROLLBACK_PROCEDURES.md` §3).
- **Target**: Postgres RTO 1h.
- **Repo enables**: Serialized migration runs; `db diff` dry-run (but swallowed).
- **Repo gaps**: No automated reverse; `|| true` on the diff (IR-P2-006); no staging proof (IR-P1-002).
- **Injects**: (a) Migration dropped a FK that 3 modules depend on; (b) migration ran on prod but not dev; (c) reverse migration itself fails.
- **Evidence**: `.github/workflows/supabase-migrations.yml`, `docs/ROLLBACK_PROCEDURES.md` §3, `docs/SUPABASE_MIGRATION_WORKFLOW.md`.

### Scenario 4 — Failed deploy / rollback

- **Trigger**: New deploy fails or degrades the app.
- **Detection**: `deploy-do.yml` container health gate fails; web/API health check fails; GitHub notification.
- **Triage**: Check whether auto-revert (`PREV_TAG`) already ran; inspect logs.
- **Containment**: Let auto-revert complete; if not, run manual SHA rollback.
- **Recovery**: `workflow_dispatch` with `rollback_sha`, or SSH `IMAGE_TAG=<sha> docker compose up -d` (`ROLLBACK_PROCEDURES.md` §2).
- **Target**: App RTO 15m (`docs/RTO_RPO.md`).
- **Repo enables**: Auto-revert on failed health; SHA input validated as hex; concurrency queues deploys (does not cancel in-flight).
- **Repo gaps**: Worker check non-fatal (IR-P1-003); docs contradict on SHA rollback (IR-P1-001); prerequisite images may be pruned (workflow prunes old tags after success).
- **Injects**: (a) Rollback SHA images were pruned; (b) Worker is dead but API green; (c) rollback itself fails health.
- **Evidence**: `.github/workflows/deploy-do.yml`, `docs/ROLLBACK_PROCEDURES.md` §§1-2, `docs/FINAL_DEPLOYMENT_OPERATIONS_HANDBOOK.md` §Rollback.

### Scenario 5 — Supabase outage (hosted dependency)

- **Trigger**: Hosted Supabase unavailable/rate-limited/degraded.
- **Detection**: API `/health` 503 (DB check); Sentry; `TROUBLESHOOTING.md` "Supabase connection errors".
- **Triage**: Confirm Supabase status page; check connection pool; distinguish from app config.
- **Containment**: Circuit breaker (`apps/api/src/lib/circuit-breaker.ts`) sheds load; verify it is open and metric `portal_circuit_breaker_status` is visible.
- **Recovery**: Wait for provider; if prolonged, fail over to a recovery project (PITR instance).
- **Target**: Postgres RTO 1h.
- **Repo enables**: Circuit breaker; health check; troubleshooting doc.
- **Repo gaps**: No provider-aware alert (only your own health); no documented degraded-mode UX; no external monitor proving it from outside.
- **Injects**: (a) Supabase is up but slow (connection pool exhausted); (b) outage exceeds 1h; (c) elevated error rate during recovery.
- **Evidence**: `apps/api/src/routes/health.ts`, `apps/api/src/lib/circuit-breaker.ts`, `docs/TROUBLESHOOTING.md` §Deploy & Infrastructure.

### Scenario 6 — Dependency / supply-chain compromise

- **Trigger**: Malicious or vulnerable package enters the tree (or a transitive dep is compromised upstream).
- **Detection**: `pnpm audit --audit-level=high --prod` gate, Trivy, Dependency Review (`fail-on-severity: high`), Dependabot.
- **Triage**: Identify the package and reach (runtime vs build-only); check whether it shipped in a released image.
- **Containment**: Block/rollback the PR; pin/override the dependency; rebuild affected images.
- **Recovery**: Deploy patched images; rotate any secrets the package could have accessed.
- **Target**: Not specified.
- **Repo enables**: Multiple gates; SBOM generation (`sbom.yml`); SHA-pinned actions.
- **Repo gaps**: No runtime SBOM attestation/provenance; no alert if an already-shipped image is later found vulnerable; `skip-files: pnpm-lock.yaml` in Trivy (delegated to `pnpm audit`).
- **Injects**: (a) Compromise is in a build-only dep with no runtime reach; (b) vuln discovered after release; (c) lockfile altered in a PR.
- **Evidence**: `test.yml` §security-scan, `dependency-review.yml`, `sbom.yml`, `.github/dependabot.yml`, `pnpm-lock.yaml`.

### Scenario 7 — CI/CD compromise

- **Trigger**: Workflow/token/action compromised; attacker gains deploy or secrets access.
- **Detection**: Unusual workflow runs; unexpected deploy; GitHub security alerts — **no out-of-band CI alert in repo**.
- **Triage**: Identify compromised token/action; determine if a deploy ran.
- **Containment**: Revoke tokens; disable workflows; rotate secrets (`SECRETS_ROTATION.md`).
- **Recovery**: Rebuild from a known-good SHA; verify images.
- **Target**: Not specified.
- **Repo enables**: Least-privilege `permissions:` blocks; SHA-pinned third-party actions; no `pull_request_target`; concurrency control.
- **Repo gaps**: `actions: write` on several workflows; no external CI anomaly alert (IR-P0-003); deploy SSH key is root (`CI_SSH_PRIVATE_KEY`).
- **Injects**: (a) Compromised action version pushed upstream; (b) leaked `GITHUB_TOKEN` with `packages: write`; (c) malicious workflow added on a branch.
- **Evidence**: `.github/workflows/*` (permissions blocks), prior run `10_github_actions_cicd_governance.md`.

### Scenario 8 — RLS regression exposing tenant data

- **Trigger**: RLS allow-list change or policy bug lets one tenant read another's data.
- **Detection**: **None in repo** — only "watch API logs for DB_ERROR / empty-result regressions". Sentry may catch errors.
- **Triage**: Identify module + table; confirm cross-tenant read with a seeded probe.
- **Containment**: Remove the module key from `RLS_READS_ENABLED`/`RLS_WRITES_ENABLED` and redeploy (`RLS-rollout.md` Rollback).
- **Recovery**: Fix policies; re-enable; verify isolation.
- **Target**: Not specified; treat as SEV1 if exposure confirmed.
- **Repo enables**: Static RLS hygiene gate (`scripts/verify-rls.mjs`); per-module reversible allow-list; coverage matrix.
- **Repo gaps**: No runtime detection/alert (IR-P1-006); service-role default; 4 service-role-only + 6 open-policy tables flagged.
- **Injects**: (a) A new migration adds an open policy (`using (true)`); (b) admin path inadvertently uses user-scoped client; (c) exposure only for pending members.
- **Evidence**: `docs/RLS-rollout.md`, `docs/RLS-coverage-matrix.md`, `docs/MT-P0-001-RLS-remediation-design.md`, `apps/api/src/services/supabase.ts:164`.

### Scenario 9 — Webhook / payment / notification failure

- **Trigger**: Teams/lead webhooks fail; Stripe reconciliation drifts; email notifications stop.
- **Detection**: `portal_webhook_deliveries_total` metric (live) but no alert; Worker task errors in Sentry; Stripe/JSM health checks.
- **Triage**: Check `webhook_dead_letters`, `webhook_deliveries`, Stripe reconcile output.
- **Containment**: Requeue/retry; disable failing endpoint.
- **Recovery**: `webhook-retry` drains retries; `stripe-reconcile` re-syncs billing.
- **Target**: Not specified.
- **Repo enables**: Retry with backoff; dead-letter set; reconciliation task; health checks.
- **Repo gaps**: No dead-letter/drift alert (IR-P2-003); visitor alerts are marketing-only.
- **Injects**: (a) Teams webhook returns 401 after secret rotation; (b) Stripe webhook secret rotated out of sync; (c) notification queue backs up.
- **Evidence**: `apps/worker/src/tasks/webhook-dispatcher.ts`, `webhook-retry.ts`, `stripe-reconcile.ts`, `apps/api/src/routes/health.ts`, `docs/BILLING.md`, `docs/VISITOR_ALERTS.md`.

### Scenario 10 — Admin abuse / insider action

- **Trigger**: An admin (or stolen admin session) exports data or impersonates tenants.
- **Detection**: `audit_logs` + `impersonation_log` exist but **nothing alerts**.
- **Triage**: Pull admin audit events (`GET /audit`, `/audit/export`); review impersonation usage.
- **Containment**: Revoke sessions/keys; disable impersonation; adjust roles.
- **Recovery**: Restore any damaged data; tighten permissions.
- **Target**: Not specified; treat exposure as SEV1.
- **Repo enables**: Admin-gated audit read/export; `requireOrgAccess`; impersonation logged (service-role-only sink).
- **Repo gaps**: No real-time abuse alert; audit gaps silent (IR-P2-002); audit is not asserted tamper-evident.
- **Injects**: (a) Admin exports 10k rows (matches export limit); (b) repeated impersonations across tenants; (c) audit insert failures during the abuse window.
- **Evidence**: `apps/api/src/routes/audit.ts`, `apps/api/src/services/audit.ts`, migration `5302133`, `docs/RLS-coverage-matrix.md`, `docs/portal_admin_permissions_guide.md`.

### Scenario 11 — Total loss of the monitoring/alerting path

- **Trigger**: Prometheus/Alertmanager/Sentry/droplet monitoring all fail, or network egress is cut.
- **Detection**: **None** — the Watchdog rule has no receiver; the primary channel is inside the failing path.
- **Triage**: Only possible from outside (customer report / external monitor).
- **Containment**: Restore monitoring components; restore egress.
- **Recovery**: Rebuild Prometheus; re-point scrape targets; confirm Watchdog resumes.
- **Target**: Not specified.
- **Repo enables**: Watchdog rule (unwired); internal-only metrics; Docker healthchecks.
- **Repo gaps**: No out-of-band receiver; no external synthetic monitor (IR-P0-003).
- **Injects**: (a) Droplet is up but Prometheus is down; (b) Sentry DSN unset so errors are silent; (c) alert egress blocked by firewall.
- **Evidence**: `infra/digitalocean/prometheus.rules.yml`, `docs/MONITORING_AND_ALERTING.md` §§4,7, `infra/digitalocean/docker-compose.yml`.

### Scenario 12 — Recurring incident / fix durability

- **Trigger**: A previously fixed incident recurs (e.g. prior-run INC findings).
- **Detection**: Depends on the original signal.
- **Triage**: Compare against prior postmortems — **no postmortem registry exists**.
- **Containment/Recovery**: As per the original scenario.
- **Target**: N/A.
- **Repo enables**: Prior audit reports under `prompts/repo-deep-dive/` and `docs/audits/`; some fixes landed (secret scanning).
- **Repo gaps**: No postmortem store; no regression test tying a fix to a permanent guard (IR-P0-001).
- **Injects**: (a) The Worker-health non-fatality recurs across deploys; (b) a rotation is again skipped; (c) monitoring path fails a second time.
- **Evidence**: prior run `prompts/repo-deep-dive/20260728-0142-develop-21a10d6/33_incident_tabletop_exercise.md`; this run's Appendix A.

---

## 4. Scenario / Control Matrix (compact)

| ID | Scenario | Detection | Triage | Recovery | Overall (0-5) | Weakest link |
|---|---|---:|---:|---:|---:|---|
| S1 | DB loss / restore | 3 | 3 | 3 | 3.0 | shallow restore proof |
| S2 | Secret/key compromise | 2 | 3 | 3 | 2.7 | no compromise detection |
| S3 | Bad migration | 2 | 3 | 2 | 2.3 | manual-only reverse |
| S4 | Deploy rollback | 4 | 4 | 4 | 4.0 | Worker non-fatal |
| S5 | Supabase outage | 3 | 3 | 3 | 3.0 | no external monitor |
| S6 | Dependency compromise | 4 | 3 | 3 | 3.3 | no runtime attestation |
| S7 | CI compromise | 2 | 3 | 3 | 2.7 | no out-of-band CI alert |
| S8 | RLS regression | 2 | 2 | 3 | 2.3 | no runtime detection |
| S9 | Webhook/payment/notification | 2 | 3 | 4 | 3.0 | no dead-letter alert |
| S10 | Admin abuse | 2 | 3 | 3 | 2.7 | no abuse alert |
| S11 | Monitoring-path loss | 1 | 2 | 3 | 2.0 | no receiver |
| S12 | Recurring incident durability | 3 | 3 | 2 | 2.7 | no postmortem registry |

---

## 5. Communication Templates

### 5.1 Internal incident declaration (post to the chosen ops channel)

```text
[INCIDENT DECLARED] SEV<n> — <short title>
Time (UTC): <HH:MM>
Incident Commander: <name>
Current impact: <what users/customers cannot do>
Known scope: <env: dev|prod; services; tenants affected>
Suspected cause: <hypothesis or "unknown">
Next update in: 30 min (or 15 min for SEV1)
Tracking: <issue/run link>
```

### 5.2 Status update cadence

```text
[INCIDENT UPDATE] SEV<n> — <title> — <HH:MMZ>
Status: investigating | identified | monitoring | resolved
What changed since last update: <...>
Current impact: <...>
Action in progress: <...>
Next update in: <...>
```

### 5.3 Resolution note

```text
[INCIDENT RESOLVED] SEV<n> — <title> — <HH:MMZ>
Duration: <HH:MM>
Root cause (preliminary): <...>
Fix applied: <...>
Data impact: none | <describe> 
Postmortem owner: <name> — due <date>
```

### 5.4 Customer/tenant notification (platform outage)

```text
Subject: MCT platform service interruption — <date/time window>

We are aware of an interruption affecting <service(s)> between <start> and <end> (<timezone>).
Impact: <what tenants experienced>.
Current status: <resolved | monitoring>.
Data: <none known affected | under assessment; no action required | action required: ...>.
We will provide a follow-up within <window> and a written summary on request.
Contact: <support address>.
```

### 5.5 Data-breach notification decision record (fill for IR-P0-002)

```text
Breach register entry #<n>
Detected at (UTC): <...>       Detection source: <audit/RLS/Sentry/report>
Data classes involved: <...>   Tenants affected (count): <...>
Containment steps + time: <...>
Legal/counsel consulted: <yes/no>  Regulator(s): <...>
Notification decision: notify | not notify  Rationale: <...>
Notified parties + time: <...>
Evidence preserved at: <...>
Owner: <...>
```

### 5.6 Postmortem template (also proposed as `docs/templates/POSTMORTEM.md`)

```markdown
# Postmortem — <title> (SEV<n>)

- Date / duration:
- Incident Commander / authors:
- Status: draft | reviewed

## Summary
<2-3 sentences>

## Impact
<users, tenants, services, data, duration, RTO/RPO targets met or missed>

## Timeline (UTC)
| Time | Event |
|---|---|

## Detection
<what alerted, how long the gap was, would an external signal have caught it sooner?>

## Root cause
<technical + contributing factors>

## Resolution / recovery
<steps actually taken, including exact rollback/restore commands>

## What went well / what went badly

## Action items
| Action | Owner | Due | Tracking |
|---|---|---|---|

## Regression guard
<test/alert/monitor added so this cannot recur silently>
```

---

## 6. Facilitation Kit

- **Ground rules**: no blame; the goal is finding detection/triage/recovery gaps; use only repo docs (no tribal knowledge) for the first pass.
- **Metrics to record per scenario**: time to detect (TTD), time to triage (TTT), time to recover (TTR), and whether RTO/RPO were met.
- **Inject cadence**: start with the trigger, then add one complication every 5 minutes.
- **Debrief questions**: Which signal would have caught this fastest? Which doc failed you? What did you have to invent on the spot? What single alert/test would prevent recurrence?
- **Output**: a postmortem per scenario (template 5.6) and a tracked action-item list; add a regression guard for each resolved finding.

---

## 7. Evidence Index

| Area | Path |
|---|---|
| Monitoring/alerting | `docs/MONITORING_AND_ALERTING.md`, `infra/digitalocean/prometheus.rules.yml`, `infra/digitalocean/prometheus.yml` |
| Deploy / rollback | `.github/workflows/deploy-do.yml`, `docs/ROLLBACK_PROCEDURES.md`, `docs/FINAL_DEPLOYMENT_OPERATIONS_HANDBOOK.md` |
| RTO/RPO | `docs/RTO_RPO.md` |
| Backups | `.github/workflows/db-backup.yml`, `.github/workflows/db-restore-test.yml`, `scripts/backup-database.sh` |
| Migrations | `.github/workflows/supabase-migrations.yml`, `docs/SUPABASE_MIGRATION_WORKFLOW.md`, `docs/SUPABASE_MIGRATION_CHEATSHEET.md` |
| Secrets | `docs/SECRETS_ROTATION.md`, `docs/JWT_ROTATION.md`, `SECURITY.md`, `.husky/pre-commit`, `scripts/scan-secrets.sh` |
| RLS/tenancy | `docs/RLS-rollout.md`, `docs/RLS-coverage-matrix.md`, `docs/MT-P0-001-RLS-remediation-design.md`, `scripts/verify-rls.mjs` |
| Audit | `apps/api/src/services/audit.ts`, `apps/api/src/routes/audit.ts`, migration `5302133` |
| Health/metrics | `apps/api/src/routes/health.ts`, `apps/api/src/lib/metrics.ts`, `apps/apps/worker/src/metrics.ts` (see `apps/worker/src/metrics.ts`) |
| Webhooks/payments | `apps/worker/src/tasks/webhook-dispatcher.ts`, `webhook-retry.ts`, `stripe-reconcile.ts`, `docs/BILLING.md` |
| Supply chain | `.github/workflows/test.yml`, `dependency-review.yml`, `sbom.yml`, `.github/dependabot.yml` |
| Operator docs | `docs/TROUBLESHOOTING.md`, `docs/FINAL_OPERATOR_MAP.md`, `docs/runbooks/README.md` |
| Product IR (not platform IR) | `docs/modules/incident-response.md`, `docs/features/security-incident-response.md`, `docs/runbooks/security-incident-response.md` |

---

## 8. Maintenance

Re-run these scenarios quarterly and after any major topology change (new service, new datastore, new provider). Keep this artifact in sync with `33_incident_tabletop_exercise.md`; every scenario that exposes a gap should produce an IR finding with a regression guard.
