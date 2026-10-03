# Incident Tabletop Exercise

## Audit Metadata

- Audit name: repo-deep-dive
- Run: 20261002-0344-develop-6286137
- Repository: C:\temp\mainecybertech
- Branch: develop
- Commit SHA: 62861370 (6286137017c4b7c77e83ee420ec11382d984f263, 2026-10-01 23:25:45 -0400, "docs: record the widened a11y default gate")
- Generated at: 2026-10-02T03:44Z (run clock) / report authoring time 2026-10-01
- Auditor: repo-deep-dive subagent (prompt 33)
- Area code: IR
- Output path: docs/audits/repo-deep-dive/20261002-0344-develop-6286137/33_incident_tabletop_exercise.md
- Companion artifact: docs/audits/repo-deep-dive/20261002-0344-develop-6286137/incident_tabletop_scenarios.md
- Scope limitations:
  - Audit-only. No live system was contacted; no droplet, Supabase project, Sentry org, S3 bucket, or GitHub environment was queried. All findings are from repository artifacts at the audited commit.
  - GitHub Actions run history (actual exercise/restore/backup run results) is not readable from the repo; those are marked `not reproducible` / `Unknown` where they would be needed.
  - This run is a *documented-procedure* exercise. No tabletop was actually facilitated; scenarios are evaluated against whether the repository's docs, code, and CI would enable detection → triage → recovery within the documented RTO/RPO targets.
  - A prior run exists at `prompts/repo-deep-dive/20260728-0142-develop-21a10d6/33_incident_tabletop_exercise.md` (area code was `INC`, scored 5.8/10). It was used only for continuity; every claim below was re-verified at commit 62861370. Several prior findings have since been remediated (see Verification Performed).

## Scope

Reviewed (repository evidence at commit 62861370):

- Incident docs: platform-level incident response is **absent as a standalone document**; the product-level `docs/modules/incident-response.md` and `docs/features/security-incident-response.md` (portfolio/tenant tooling) were reviewed and distinguished from platform IR.
- Monitoring/alerting: `docs/MONITORING_AND_ALERTING.md`, `infra/digitalocean/prometheus.rules.yml`, `infra/digitalocean/prometheus.yml`, `apps/api/src/routes/health.ts`, `apps/api/src/lib/circuit-breaker.ts`, `apps/api/src/lib/metrics.ts`, `apps/worker/src/metrics.ts`, Sentry init in API/Worker/Web.
- Rollback: `docs/ROLLBACK_PROCEDURES.md`, `.github/workflows/deploy-do.yml`, `docs/FINAL_DEPLOYMENT_OPERATIONS_HANDBOOK.md`, `docs/RTO_RPO.md`.
- Security docs: `SECURITY.md`, `docs/SECRETS_ROTATION.md`, `docs/JWT_ROTATION.md`, `docs/RLS-rollout.md`, `docs/RLS-coverage-matrix.md`, `docs/MFA.md`.
- Deployment docs: `docs/FINAL_DEPLOYMENT_OPERATIONS_HANDBOOK.md`, `docs/RELEASING.md`, `docs/CI.md`, `docs/GITHUB_SECRETS_AND_VARIABLES_MATRIX.md`, `docs/ENVIRONMENT_VARIABLES.md`.
- Operator docs: `docs/TROUBLESHOOTING.md`, `docs/FINAL_OPERATOR_MAP.md`, `docs/runbooks/README.md` (60 module runbooks).
- Data breach process: searched; no platform data-breach/notification runbook found. `SECURITY.md` covers *reporting an issue to us*, not *our breach response*.
- Backups: `docs/RTO_RPO.md`, `.github/workflows/db-backup.yml`, `.github/workflows/db-restore-test.yml`, `scripts/backup-database.sh`, `docs/runbooks/backup-disaster-recovery.md` (product feature).
- Audit logs: `apps/api/src/services/audit.ts`, `apps/api/src/routes/audit.ts`, `supabase/migrations/*` (`audit_logs`, `impersonation_log`), `docs/RLS-coverage-matrix.md`.
- Observability: as Monitoring plus `docs/MONITORING_AND_ALERTING.md` §4 (metrics table, "defined, not wired" rows), pino logging + PII redaction.
- CI/CD failures: all 16 workflows in `.github/workflows/`, with emphasis on `deploy-do.yml`, `supabase-migrations.yml`, `test.yml`, `db-backup.yml`, `db-restore-test.yml`, `sbom.yml`, `dependency-review.yml`, `codeql.yml`, `terraform-do.yml`.
- Admin abuse: `apps/api/src/routes/audit.ts`, `docs/RLS-coverage-matrix.md` (`impersonation_log`), `SECURITY.md`, `docs/portal_admin_permissions_guide.md`.
- Tenant isolation: `docs/RLS-rollout.md`, `docs/RLS-coverage-matrix.md`, `docs/MT-P0-001-RLS-remediation-design.md`, `scripts/verify-rls.mjs` (referenced by test/validate gates).
- Webhook/payment/notification failures: `apps/worker/src/tasks/webhook-dispatcher.ts`, `webhook-retry.ts`, `stripe-reconcile.ts`, `apps/api/src/routes/health.ts` (Stripe/JSM checks), `docs/BILLING.md`.

Not reviewed / out of scope: live incident history, actual pager rotations (none exist), customer contractual SLAs, and the 60 product-module runbooks except where they define platform recovery (e.g. `backup-disaster-recovery.md`).

## Evidence Reviewed

| Evidence | Type | Why relevant | Notes |
|---|---|---|---|
| `docs/MONITORING_AND_ALERTING.md` | Doc | Canonical monitoring/alerting strategy; contains IR checklist and alert triggers | Defines Sentry rules, health endpoints, Prometheus metrics, "no dedicated pager/on-call" |
| `docs/ROLLBACK_PROCEDURES.md` | Doc | Docker/Supabase/Terraform rollback + emergency contacts | Documents `rollback_sha` workflow_dispatch |
| `.github/workflows/deploy-do.yml` | CI | Deploy, rollback input, health gate, auto-revert, worker health check | 535 lines; concurrency queues (cancel-in-progress: false), `rollback_sha` input validated as hex |
| `docs/FINAL_DEPLOYMENT_OPERATIONS_HANDBOOK.md` | Doc | Operator manual, env mapping, secrets list, promotion | Rollback section says workflow deploys HEAD only — **conflicts** with ROLLBACK_PROCEDURES |
| `docs/RTO_RPO.md` | Doc | RTO/RPO targets per service | Postgres RTO 1h / RPO 5m; Redis RTO 30m / RPO 24h |
| `.github/workflows/db-backup.yml` | CI | Daily pg_dump to S3, failure notify to Slack | Cron 04:00; uses `SLACK_WEBHOOK_URL` |
| `.github/workflows/db-restore-test.yml` | CI | Weekly restore drill to temp Postgres | Cron Mon 06:00; verifies table count only |
| `scripts/backup-database.sh` | Script | Backs up via pg_dump, uploads S3 STANDARD_IA, 30-day retention | Bucket default `mainecybertech-backups`; env `S3_BUCKET` |
| `.github/workflows/supabase-migrations.yml` | CI | Applies migrations on develop/main | `supabase db push --include-all`; no reverse-migration step, no automated rollback |
| `docs/SECRETS_ROTATION.md` | Doc | 40-secret inventory + emergency rotation | Emergency rotation steps exist; rotation log has only the initial row |
| `docs/JWT_ROTATION.md` | Doc | Zero-downtime multi-secret rotation | Comma-separated `JWT_SECRET`, first signs, all verify |
| `SECURITY.md` | Doc | Vulnerability reporting, sensitive areas | Reporting to `security@mainecybertech.com`; no breach-notification process |
| `docs/RLS-rollout.md` | Doc | RLS allow-list model, preconditions, rollback | Flags live in repo-level secrets; ~44 read modules / ~17 write modules enabled |
| `docs/RLS-coverage-matrix.md` | Doc | 140 tables, 139 RLS-enabled, service-role-only set | Live source is `scripts/verify-rls.mjs` |
| `apps/api/src/routes/health.ts` | Code | API health checks DB + Stripe + JSM + Redis | Redis non-degrading; external checks cached 30s |
| `infra/digitalocean/prometheus.rules.yml` | Config | Alert rules (ServiceDown, 5xx rate, Watchdog) | Comment: Alertmanager required for delivery — not deployed |
| `apps/api/src/services/audit.ts` | Code | Audit write with retry + PII redaction | 3 retries w/ exponential backoff; logs "audit trail gap" on final failure |
| `apps/api/src/routes/audit.ts` | Code | Audit read/export, admin-gated | `router.use(requireAuth, requireAdmin)`; export limit 10000 |
| `apps/worker/src/tasks/webhook-dispatcher.ts` | Code | Webhook delivery + dead-letter | Blocked URL → dead-letter; sets `next_retry_at` |
| `docs/features/security-incident-response.md`, `docs/modules/incident-response.md` | Doc | Product IR tooling (tenant-facing) | NOT platform IR |
| `.github/workflows/test.yml` §§ security-scan/secrets-scan | CI | Trivy + `pnpm audit` + diff secret scan | Secret scan mirrors `scripts/scan-secrets.sh` |
| `.github/workflows/sbom.yml`, `dependency-review.yml` | CI | CycloneDX SBOM + dependency review | SBOM 30-day artifact; dep-review fails on high |
| Prior run `prompts/repo-deep-dive/20260728-0142-develop-21a10d6/33_incident_tabletop_exercise.md` | Doc | Continuity baseline (5.8/10, INC-*) | Used to check whether prior fixes stuck |

## Verification Performed

| Evidence | Type | Why relevant | Notes |
|---|---|---|---|
| `git log -1` at repo | Command | Confirm audited commit | `6286137017c4...` on `develop`; matches requested short SHA |
| `.husky/pre-commit` → `scripts/scan-secrets.sh` | Read | Prior P0 "no pre-commit secret scanning" | **Supported (fixed)**: hook calls scanner; scanner exists with provider patterns |
| `.github/workflows/test.yml` `secrets-scan` job | Read | Prior finding "no CI secret scan" | **Supported (fixed)**: diff secret scan in CI, fetch-depth 0 |
| `deploy-do.yml` worker health check step | Read | Prior finding "deploy does not health-check Worker" | **Partially supported (fixed)**: SSH `docker exec ... /health`, but failure is explicitly non-fatal ("worker is restart-loop tolerant") — see IR-P1-003 |
| `deploy-do.yml` auto-revert on failed health gate | Read | Prior "Supabase rollback manual-only" | **Supported (fixed) for Docker**: `PREV_TAG` captured and re-applied when health fails |
| `docs/FINAL_DEPLOYMENT_OPERATIONS_HANDBOOK.md` §Rollback vs `ROLLBACK_PROCEDURES.md` §1 | Read | Self-consistency of rollback docs | **Unsupported (contradiction)**: docs disagree on whether workflow_dispatch can target a SHA — see IR-P1-001. Code (`rollback_sha` input) matches ROLLBACK_PROCEDURES |
| `docs/MONITORING_AND_ALERTING.md` §6 vs §4 vs `prometheus.rules.yml` | Read | Self-consistency of alerting docs | **Partially supported**: rules exist but no Alertmanager delivery; doc says "for delivery... Alertmanager required" |
| `docs/MONITORING_AND_ALERTING.md` §2 vs `apps/api/src/routes/health.ts` | Read | Health endpoint contract | **Partially supported**: doc shows DB+uptime; code adds Stripe/JSM/Redis. Redis doc-level treat differently |
| `db-restore-test.yml` | Read | Backup restoration exercise | **Supported as a procedure**: weekly CI restore runs against a temp DB; does NOT restore into the real project, does NOT verify row-level/PITR, does not prove RPO |
| `db-backup.yml` bucket env vs `scripts/backup-database.sh` | Read | Backup path consistency | **Partially supported**: workflow injects `SUPABASE_DB_URL` etc. but does NOT set `S3_BACKET`; script default bucket `mainecybertech-backups`; restore-test uses `S3_BACKUP_BUCKET` secret — see IR-P1-005 |
| `supabase-migrations.yml` | Read | Bad-migration recovery | **Supported (gap)**: `db push --include-all`, `diff` is `|| true`; no reverse migration or auto-rollback; docs only offer manual reverse/PITR |
| `docs/SECRETS_ROTATION.md` rotation log | Read | Rotation exercised? | **Not reproducible**: only the "(Initial deployment)" row; no evidence of a real rotation |
| RLS matrix + `RLS-rollout.md` | Read | Tenant-isolation regression risk | **Supported**: broad allow-list on repo secrets, service-role default, `impersonation_log` service-role-only |
| `apps/api/src/routes/audit.ts` | Read | Admin-abuse audit visibility | **Supported**: admin-gated read/export; no tamper-evidence (append-only policy not in matrix — S,I only, no DELETE policy) |
| `apps/api/src/services/audit.ts` | Read | Audit durability | **Supported**: retry+backoff; final failure only logs, does not page |
| `webhook-dispatcher.ts` dead-letter + `health.ts` | Read | Webhook/payment failure detection | **Partially supported**: dead-lettering exists; no alert when dead-letter count grows |
| `prompts/.../20260728.../33_...md` | Doc | Continuity | Re-verified; several INC-* findings closed, others persist under new IR IDs |

Verification vocabulary used: `supported`, `partially supported`, `unsupported`, `not reproducible`. Where a documented procedure was read but never actually exercised at this commit, it is recorded as **documented procedure, not exercised procedure**.

## Executive Summary

The repository's *operational* incident readiness is real but is concentrated in deploy-time automation and error tracking, not in a platform-level incident management process. The Docker deploy path is genuinely hardened: `deploy-do.yml` captures the previously running image tag, runs an internal container health gate, and automatically reverts to the prior tag when the gate fails; `rollback_sha` is a validated hex input. Health checks now include the Worker over SSH. Pre-commit and CI secret scanning are present. Backups run daily to S3 and a weekly CI restore drill exists.

However, three structural gaps dominate a tabletop:

1. **There is no platform incident-response document.** The only "incident response" artifacts in the repo are product features for managing *clients'* incidents (`docs/modules/incident-response.md`, `docs/features/security-incident-response.md`, `docs/runbooks/security-incident-response.md`). There is no runbook defining roles, severity taxonomy, containment, communication, or postmortem for the MCT platform itself. `docs/MONITORING_AND_ALERTING.md` §8 has a 16-step checklist that is a useful seed (and it is the closest thing to a platform IR runbook), but it is embedded in a monitoring doc, has no roles, no severity model, no communication templates, and no postmortem requirement.

2. **Detection is best-effort and the alert delivery path is incomplete.** `prometheus.rules.yml` explicitly states Alertmanager is required for delivery and it is not deployed. The primary durable alert channel in the repo is a `SLACK_WEBHOOK_URL` used only by the DB-backup workflow, plus Sentry email and GitHub notifications. There is no on-call/pager, and `docs/MONITORING_AND_ALERTING.md` §7 says so plainly. Several important signals (audit-trail gaps, webhook dead-letters, JWT fallback, RLS regressions, data exfiltration) have no alert at all.

3. **The two recovery paths that matter most — database and migrations — are manual and under-verified.** Bad migrations have no automated reverse; recovery relies on hand-written SQL, Supabase PITR (a Pro-plan dashboard action), or point-in-time restore with a `.env` rewrite; the weekly restore drill only counts tables and never restores into the real project or proves the 5-minute RPO. The backup bucket wiring is inconsistent between script default, backup workflow, and restore-test workflow.

The net effect: the *Docker deploy* scenarios would likely be contained and recovered inside the documented 15-minute RTO. The *database, secret-compromise, RLS-regression, and total-monitoring-loss* scenarios would not, because detection and documented triage are missing or manual-only.

Prior-run continuity: of the 21 INC-* findings from run `20260728`, the pre-commit secret scan and CI secret scan are now **fixed**, the Worker health check is **partially fixed** (non-fatal), and automated Docker auto-revert now exists. The prior "no alerting on direct Supabase access / no bulk exfiltration detection", "no automated migration rollback", and "service-role key bypasses RLS" findings **persist**.

## Inventory

| Item | Path / symbol | Purpose | Current state | Risk | Notes |
|---|---|---|---|---|---|
| Platform IR runbook | (none) | Define roles/severity/containment/comms/postmortem | **Absent** | P0/P1 | Closest seed is `MONITORING_AND_ALERTING.md` §8 |
| Product IR tooling | `docs/modules/incident-response.md`, `docs/features/security-incident-response.md`, `docs/runbooks/security-incident-response.md` | Tenant-facing incident lifecycle product | Present, unrelated to platform IR | Confusion risk | Do not mistake for platform runbook |
| Monitoring/alerting strategy | `docs/MONITORING_AND_ALERTING.md` | Sentry/logs/health/metrics/alert triggers | Present, detailed | Medium | No Alertmanager; no pager |
| Prometheus rules | `infra/digitalocean/prometheus.rules.yml` | Alert expressions | Rules exist, delivery not wired | High | Comment says Alertmanager required |
| API health | `apps/api/src/routes/health.ts` | DB/Stripe/JSM/Redis checks | Implemented; Redis non-degrading | Low | External checks 30s cache |
| Worker health | `apps/worker/src/main.ts`, port 3001 | Worker liveness | Implemented; deploy check non-fatal | Medium | Deploy logs a warning, does not fail |
| Circuit breaker | `apps/api/src/lib/circuit-breaker.ts` | Supabase call protection | Implemented, metric `portal_circuit_breaker_status` | Low | |
| Metrics | `apps/api/src/lib/metrics.ts`, `apps/worker/src/metrics.ts` | Prometheus counters/histograms | Partial; several "defined, not wired" | Medium | `portal_db_query_duration_seconds` etc. |
| Sentry | `apps/api/src/lib/sentry.ts`, worker/web init | Error tracking | Implemented; skipped if DSN unset | Medium | Alert rules "set in Sentry" — not in repo |
| Structured logging | pino + `X-Request-ID`, PII redaction | Correlation + redaction | Implemented | Low | Redaction list in doc |
| Docker rollback (auto) | `deploy-do.yml` health gate + `PREV_TAG` | Auto-revert on failed health | Implemented | Low | Restores previous tag |
| Docker rollback (manual) | `ROLLBACK_PROCEDURES.md` §2 | SSH `IMAGE_TAG=<sha>` | Documented | Medium | Requires images retained |
| Supabase rollback | `ROLLBACK_PROCEDURES.md` §3 | Reverse migration / PITR / manual SQL | Documented, manual-only | High | No automation |
| Terraform rollback | `ROLLBACK_PROCEDURES.md` §4 | git revert / targeted apply / state restore | Documented | Medium | State restore from DO Spaces |
| DB backup | `db-backup.yml` + `scripts/backup-database.sh` | Daily pg_dump → S3 | Implemented; Slack notify on fail | High | Bucket env inconsistency |
| DB restore drill | `db-restore-test.yml` | Weekly restore into temp Postgres | Implemented; shallow verification | High | Counts tables only |
| RTO/RPO | `docs/RTO_RPO.md` | Targets | Documented | Medium | Postgres 1h/5m; not proven |
| Secret rotation | `docs/SECRETS_ROTATION.md` | 40-secret inventory + emergency steps | Documented; log unexercised | High | Rotation log single row |
| JWT rotation | `docs/JWT_ROTATION.md` | Zero-downtime multi-secret rotation | Documented + code supports | Low | |
| RLS allow-list | `docs/RLS-rollout.md` | Per-module tenant isolation | ~44 read / ~17 write modules enabled | High | Live values in GitHub secrets |
| RLS coverage/matrix | `docs/RLS-coverage-matrix.md` | 140 tables, 139 RLS-enabled | Present; generated artifact | Medium | Live source `scripts/verify-rls.mjs` |
| Audit service | `apps/api/src/services/audit.ts` | Write audit events | Implemented; retry; gap logged | Medium | No page on gap |
| Audit read/export | `apps/api/src/routes/audit.ts` | Admin audit visibility | Admin-gated | Low | No tamper-evidence |
| Impersonation log | migration `5302133`, `impersonation_log` | Platform-admin audit sink | service_role-only policy | Medium | Intentionally service-only |
| CI/CD workflows | `.github/workflows/*` (16) | Build/test/deploy/migrate/backup | Mature, SHA-pinned | Low | |
| Supply chain | `test.yml`, `dependency-review.yml`, `sbom.yml`, `dependabot.yml` | Dep audit, SBOM, review | Implemented | Low | No runtime SBOM attestation |
| Status page | `docs/features/public-status-page.md` | Product status page | Product-level | Medium | Not MCT platform status |
| Webhook/payment failure | `webhook-dispatcher.ts`, `webhook-retry.ts`, `stripe-reconcile.ts` | Delivery + reconciliation | Implemented; dead-letter | Medium | No dead-letter alert |
| Product backup runbook | `docs/runbooks/backup-disaster-recovery.md` | Tenant backup tool runbook | Product-level | Confusion risk | Not platform DB recovery |

## Domain Scorecard

| Category | Score | Evidence | Gap | Recommended action |
|---|---:|---|---|---|
| Incident docs | 1 | No platform IR doc; `MONITORING_AND_ALERTING.md` §8 checklist; product IR docs elsewhere | No roles, severity taxonomy, comms templates, postmortem, breach notification | Create `docs/INCIDENT_RESPONSE.md` (platform) |
| Monitoring/alerting | 2 | `MONITORING_AND_ALERTING.md`; `prometheus.rules.yml`; Sentry; health endpoints | Alertmanager not deployed; no pager; several blind spots | Deploy Alertmanager receiver + wire critical signals |
| Rollback | 3 | `deploy-do.yml` auto-revert; `ROLLBACK_PROCEDURES.md`; Terraform | DB/migration rollback manual; doc contradiction | Automate reverse-migration path; reconcile docs |
| Security docs | 3 | `SECURITY.md`, `SECRETS_ROTATION.md`, `JWT_ROTATION.md`, RLS docs | No breach-response process; rotation unexercised | Add breach runbook; exercise rotation |
| Deployment docs | 4 | Handbook, `RELEASING.md`, `CI.md`, secrets matrix | Rollback section contradicts ROLLBACK_PROCEDURES | Fix the rollback section |
| Operator docs | 3 | `TROUBLESHOOTING.md`, `FINAL_OPERATOR_MAP.md`, 60 module runbooks | No platform IR/on-call runbook; product runbooks dominate | Add platform operator IR runbook |
| Data breach process | 0 | Absent (only `SECURITY.md` report-in) | No detection→containment→notification→disclosure | Create breach runbook incl. regulatory notification |
| Backups | 3 | `db-backup.yml`, restore-test, RTO_RPO | Shallow restore verification; bucket inconsistency; no PITR drill | Deepen restore test; fix bucket wiring |
| Audit logs | 3 | `audit.ts`, `audit_logs`, `impersonation_log` | No tamper-evidence, no alert on gaps/abuse | Append-only + alerting |
| Observability | 2 | Metrics partial; logging + Sentry; Prometheus rules | "Defined, not wired" metrics; no Alertmanager; `/metrics` not scraped publicly by design | Wire metrics; deploy alert delivery |
| CI/CD failures | 4 | 16 workflows; deploy gates; auto-revert; concurrency queue | Migration `diff` swallowed; prod rollback UX | Fix migration dry-run; documented rollback UX |
| Admin abuse | 2 | `audit.ts`, `impersonation_log`, `SECURITY.md` | No real-time admin-abuse alert; audit gap silent | Alert on impersonation + audit failures |

## Detailed Review

### Item: Platform incident response documentation

- Evidence: No `docs/INCIDENT_RESPONSE.md` / `POSTMORTEM` / `ONCALL` file in `docs/` (directory listing). Closest: `docs/MONITORING_AND_ALERTING.md` §8 "Incident Response Checklist" (16 steps; immediate/diagnosis/resolution/post-incident) and §7 "No dedicated pager/on-call".
- What it does: Gives an operator a linear checklist for a generic outage.
- How it appears to work: Operator notices a failure (Sentry email / GitHub notification / customer report), SSHes in, checks containers, logs, health, then restarts or rolls back.
- Dependencies: `ROLLBACK_PROCEDURES.md`, `TROUBLESHOOTING.md`, droplet SSH access.
- Current controls: Deploy health gate + auto-revert; health endpoints; Sentry.
- Missing controls: roles/incident commander, severity taxonomy, declared incident state, comms templates, customer/status updates, postmortem template + tracking, breach notification.
- Risks: Ad-hoc response; no single source of truth; findings not systematically closed.
- Recommended improvement: Create platform IR doc (see Recommendations).
- Suggested tests: Facilitated tabletop; timed drill using only the doc.
- Suggested docs: `docs/INCIDENT_RESPONSE.md`, `docs/templates/POSTMORTEM.md`.

### Item: Monitoring and alert delivery

- Evidence: `docs/MONITORING_AND_ALERTING.md` §7 tables; `prometheus.rules.yml` header comment ("for delivery... an Alertmanager deployment is required"); no Alertmanager service in `infra/digitalocean/docker-compose.yml` or `docker-compose.yml`.
- What it does: Collects metrics, evaluates three rules, ships errors to Sentry.
- How it appears to work: Prometheus evaluates expressions; without Alertmanager, firing alerts are visible only in the Prometheus UI (internal-only per §4).
- Dependencies: Sentry DSN set; `SLACK_WEBHOOK_URL` (backup only); GitHub notifications.
- Current controls: Sentry alert rules (email/#alerts — configured in Sentry, not repo-verifiable); deploy failure GitHub notification.
- Missing controls: Alertmanager + receiver; alert on service-down via an external path; paging/on-call; Watchdog receiver.
- Risks: Silent outages when Sentry DSN unset or when the failure is infra-level (disk, droplet, Redis).
- Recommended improvement: Deploy Alertmanager with at least one receiver; add external uptime check independent of the droplet.
- Suggested tests: Kill a container; assert an alert is delivered to the receiver.
- Suggested docs: Update `MONITORING_AND_ALERTING.md` §4/§7 with the delivery path.

### Item: Database backup and restore

- Evidence: `db-backup.yml` (cron 04:00, `scripts/backup-database.sh`, `SLACK_WEBHOOK_URL` on failure); `db-restore-test.yml` (cron Mon 06:00, `S3_BACKUP_BUCKET`, temp `postgres:16-alpine`, table-count check); `scripts/backup-database.sh` (default `S3_BUCKET=mainecybertech-backups`, STANDARD_IA, 30-day retention); `docs/RTO_RPO.md` (Postgres RTO 1h / RPO 5m).
- What it does: Daily logical dump to S3; weekly restore into a throwaway DB; verifies table count.
- How it appears to work: On schedule, dump → upload → prune; weekly, pull latest → restore → count tables.
- Dependencies: `SUPABASE_DB_URL`, AWS keys, `S3_BACKUP_BUCKET`, `SLACK_WEBHOOK_URL`.
- Current controls: Daily cadence; retention; failure Slack; weekly restore smoke.
- Missing controls: Bucket env consistency; row-level/PITR verification; restore into an isolated clone; RPO measurement; encryption assertion; backup of Supabase auth/storage.
- Risks: Green restore that hides truncation; wrong bucket; unproven 5-minute RPO.
- Recommended improvement: Fix bucket wiring; add checksum/row-count/spot-check and PITR drill.
- Suggested tests: Restore into a Supabase branch and diff counts against prod read-only.
- Suggested docs: Extend `RTO_RPO.md` with the exercised procedure and results location.

### Item: Secret/key compromise

- Evidence: `docs/SECRETS_ROTATION.md` (40-secret inventory, emergency rotation steps 1-9), `docs/JWT_ROTATION.md` (multi-secret rotation), `deploy-do.yml` (secrets written to `.env` via env-forwarded heredoc, `chmod 600`), `scripts/scan-secrets.sh` + `.husky/pre-commit` + `test.yml` `secrets-scan`.
- What it does: Documents rotation; prevents accidental commits; supports zero-downtime JWT rotation.
- How it appears to work: Update GitHub env secret → redeploy writes `.env`.
- Dependencies: GitHub env secrets, droplet redeploy, source-system revocation.
- Current controls: Pre-commit + CI secret scanning; deployment secret hygiene; rotation docs.
- Missing controls: No alert on JWT fallback/rotated-key use; no worked evidence of a rotation; no automated "force logout".
- Risks: A leaked service-role/JWT could be used undetected.
- Recommended improvement: Add compromise detection + a completed rotation log entry from a drill.
- Suggested tests: Plant a fake key in a branch, confirm both scanner layers fail the build.
- Suggested docs: Add a compromise-detection section to `SECRETS_ROTATION.md`.

### Item: Tenant isolation / RLS regression

- Evidence: `docs/RLS-rollout.md` (service-role default; allow-list via repo secrets; ~44 read / ~17 write modules), `docs/RLS-coverage-matrix.md` (139 RLS-enabled tables; 4 service-role-only; 6 open policies), `scripts/verify-rls.mjs` gating migrations in `test.yml`/`validate.yml`.
- What it does: Switches selected modules to a user-scoped client where `req.userJwt` is set.
- How it appears to work: Module key present → RLS enforced for regular members; platform admins keep service-role.
- Dependencies: GitHub repo/env secrets; correct policies; migration hygiene gate.
- Current controls: RLS hygiene gate; coverage matrix; per-module rollback.
- Missing controls: No runtime alert on cross-tenant read regressions or RLS errors; rollback requires secret edit + redeploy.
- Risks: A regression could expose tenant data with only DB_ERROR/empty-result symptoms in logs.
- Recommended improvement: Add RLS-regression detection (error/mismatch alerting), assert isolation in CI against a seeded multi-tenant DB.
- Suggested tests: Multi-tenant E2E asserting org-B cannot read org-A ids per enabled module.
- Suggested docs: Add a regression-detection section to `RLS-rollout.md`.

### Item: Audit logging and admin abuse

- Evidence: `apps/api/src/services/audit.ts` (3 retries, PII redaction, gap logged), `apps/api/src/routes/audit.ts` (requireAuth+requireAdmin, export limit 10000), `docs/RLS-coverage-matrix.md` (`audit_logs` S,I; no DELETE policy; `impersonation_log` service_role-only).
- What it does: Records auditable mutations; provides admin read/export.
- How it appears to work: Mutations call `logAuditEvent`; admins query `/audit`.
- Dependencies: `audit_logs` table; service-role insert; admin role.
- Current controls: Retry + backoff; PII redaction; admin gating.
- Missing controls: No alert on audit write failures; no real-time admin/impersonation-abuse alert; tamper-evidence not asserted.
- Risks: An attacker with service-role could act; gaps may go unnoticed.
- Recommended improvement: Alert on audit-write failure and on impersonation volume.
- Suggested tests: Force audit insert failures; assert an alert fires.
- Suggested docs: Document audit alerting in `MONITORING_AND_ALERTING.md`.

### Item: Webhook / payment / notification failures

- Evidence: `apps/worker/src/tasks/webhook-dispatcher.ts` (dead-letter on blocked URL, `next_retry_at`), `webhook-retry.ts`, `stripe-reconcile.ts`, `apps/api/src/routes/health.ts` (Stripe/JSM checks), `docs/BILLING.md`.
- What it does: Dispatches/retries webhooks, reconciles Stripe, health-checks Stripe/JSM.
- How it appears to work: Failed deliveries retried until dead-letter; reconciliation suspends on staleness.
- Dependencies: Redis/BullMQ, Stripe/JSM credentials.
- Current controls: Retry with backoff; dead-letter set; reconciliation task; health checks.
- Missing controls: No alert when dead-letter count grows; no metric for payment-reconciliation drift in the alert rules.
- Risks: Silent lead/payment-billing failures.
- Recommended improvement: Alert on dead-letter growth and reconciliation drift.
- Suggested tests: Force a webhook 5xx; assert dead-letter and (with fix) an alert.
- Suggested docs: Add failure-mode alerting to `BILLING.md`.

## Scenario / Control Matrix

| ID | Scenario or control | Evidence | Current control | Gap | Severity | Recommendation |
|---|---|---|---|---|---|---|
| IR-001 | Incident docs | `MONITORING_AND_ALERTING.md` §8; no platform IR doc | 16-step checklist | No roles/severity/comms/postmortem | P0 | Create platform IR doc |
| IR-002 | Monitoring/alerting | `prometheus.rules.yml`; `MONITORING_AND_ALERTING.md` §7 | Sentry + GitHub + Slack(backup) | Alertmanager not deployed; no pager | P1 | Deploy Alertmanager receiver |
| IR-003 | Rollback | `deploy-do.yml`; `ROLLBACK_PROCEDURES.md`; Handbook | Auto-revert + manual | DB/migration manual; doc contradiction | P1 | Automate reverse migration; reconcile docs |
| IR-004 | Security docs | `SECURITY.md`, `SECRETS_ROTATION.md`, `JWT_ROTATION.md` | Reporting + rotation | No breach process; rotation unexercised | P1 | Breach runbook + rotation drill |
| IR-005 | Deployment docs | Handbook vs ROLLBACK_PROCEDURES | Rich deploy docs | Rollback sections conflict | P2 | Fix Handbook rollback section |
| IR-006 | Operator docs | `TROUBLESHOOTING.md`, `FINAL_OPERATOR_MAP.md` | Good troubleshooting | No platform IR/on-call runbook | P2 | Add operator IR runbook |
| IR-007 | Data breach process | Absent | None | No detection→notification→disclosure | P0 | Create breach runbook |
| IR-008 | Backups | `db-backup.yml`, `db-restore-test.yml` | Daily dump + weekly restore | Shallow verify; bucket inconsistency | P1 | Fix wiring; deepen drill |
| IR-009 | Audit logs | `audit.ts`, `audit.ts` route | Retry + admin gate | No alert on gaps/abuse; no tamper-evidence | P2 | Alert + append-only assertion |
| IR-010 | Observability | metrics docs §4 | Partial metrics + logs | "Defined, not wired"; no Alertmanager | P2 | Wire metrics |
| IR-011 | CI/CD failures | 16 workflows; `deploy-do.yml` | Gates + auto-revert + queue | Migration `diff` swallowed; prod rollback UX | P2 | Fix dry-run; document rollback UX |
| IR-012 | Admin abuse | `audit.ts`, `impersonation_log` | Audited | No real-time abuse alert | P2 | Alert on impersonation/audit gap |
| IR-013 | Tenant isolation regression | `RLS-rollout.md`, `RLS-coverage-matrix.md` | RLS hygiene gate | No runtime regression alert | P1 | Add RLS-regression alerts |
| IR-014 | Total loss of monitoring path | `prometheus.rules.yml` Watchdog; no receiver | Watchdog rule | No receiver → silent | P0 | External dead-man's-switch |

## Findings

### Finding ID: IR-P0-001 - No platform-level incident response plan, roles, or postmortem process

- Severity: P0
- Confidence: High
- Area: IR / Incident docs
- Evidence:
  - `docs/` directory listing — no `INCIDENT_RESPONSE.md`, `POSTMORTEM`, `ONCALL`, or `DISASTER` file.
  - `docs/MONITORING_AND_ALERTING.md` §7 ("No dedicated pager/on-call") and §8 (16-step checklist embedded in a monitoring doc).
  - `docs/modules/incident-response.md`, `docs/features/security-incident-response.md`, `docs/runbooks/security-incident-response.md` — these describe a **product feature for tenants**, not MCT platform IR.
  - Symbol: no incident-commander role, severity taxonomy, comms channel, or postmortem template exists anywhere in the repo.
- What is happening: The platform has no single authoritative incident-response process. The nearest artifact is a monitoring-doc checklist with no roles, severity levels, communication plan, or postmortem requirement.
- Why it matters: Without declared severity, ownership, and communication norms, response is ad hoc and inconsistent; post-incident learning is not captured, so the same failure modes recur.
- User / business impact: Longer outages and slower, less predictable customer communication; harder to demonstrate response maturity to clients and insurers.
- Security / privacy / reliability impact: Breach containment can be delayed and made inconsistent with notification obligations; no single decision-maker for containment.
- Recommended fix: Create `docs/INCIDENT_RESPONSE.md` defining severity (SEV1–SEV5), roles (incident commander, comms lead, scribe), containment/eradication/recovery steps per scenario, communication templates, and a postmortem process; add `docs/templates/POSTMORTEM.md`. Link it from `docs/INDEX.md` and `SECURITY.md`.
- Suggested validation: Timed tabletop where the facilitator withholds all guidance except `INCIDENT_RESPONSE.md`; success = severity declared, owner assigned, comms template used, postmortem produced within target.
- Owner suggestion: Platform lead / security reviewer
- Effort estimate: M
- Dependencies: Agreement on severity model and comms channels
- Status: open
- Endpoint / data path: N/A (process)
- Attack path: none identified

### Finding ID: IR-P0-002 - No data breach response / notification process

- Severity: P0
- Confidence: High
- Area: IR / Data breach process
- Evidence:
  - `SECURITY.md` covers *reporting a vulnerability to us* (`security@mainecybertech.com`) and sensitive areas, but defines no internal breach-response or notification workflow.
  - No `docs/**/*BREACH*` or breach-notification doc exists (directory listing).
  - `docs/RLS-rollout.md` and `docs/RLS-coverage-matrix.md` document tenant-data isolation, and `apps/api/src/services/audit.ts` notes an "audit trail gap" on write failure — both are data-breach-relevant, yet no process consumes them.
- What is happening: There is no documented detection → containment → assessment → notification → disclosure process for a breach of tenant or customer data.
- Why it matters: A breach involving tenant data would be handled reactively; notification timelines and evidence-preservation steps are undefined.
- User / business impact: Regulatory and contractual notification exposure; loss of customer trust; potential MSP-client churn.
- Security / privacy / reliability impact: Evidence could be destroyed during remediation; affected parties may not be notified in time.
- Recommended fix: Add `docs/DATA_BREACH_RESPONSE.md`: detection sources (audit anomalies, RLS logs, Sentry, Supabase access logs), containment (rotate keys, revoke sessions, disable routes), assessment (scope tenants/records), notification (counsel, clients, regulators) and a maintained breach register. Cross-link `SECRETS_ROTATION.md` emergency rotation.
- Suggested validation: Tabletop scenario "service-role key used to read multiple tenants" — success = containment within documented target and a completed notification decision record.
- Owner suggestion: Security reviewer / legal liaison
- Effort estimate: M
- Dependencies: IR-P0-001; legal input on notification jurisdiction
- Status: open
- Attack path: none identified

### Finding ID: IR-P0-003 - Total loss of the monitoring/alerting path has no independent dead-man's-switch receiver

- Severity: P0
- Confidence: High
- Area: IR / Monitoring & alerting
- Evidence:
  - `infra/digitalocean/prometheus.rules.yml` header: "for delivery (email/Slack/etc.) an Alertmanager deployment is required." No `alertmanager` service exists in `infra/digitalocean/docker-compose.yml` or `docker-compose.yml`.
  - The `Watchdog` rule (`expr: vector(1)`) is defined but has no receiver, so its daily liveness signal goes nowhere.
  - `docs/MONITORING_AND_ALERTING.md` §7 lists channels: GitHub notifications, Sentry email, DO monitoring, Teams webhooks (marketing), and states alerts are best-effort with no pager.
  - Prometheus scrapes internally only (doc §4: `/metrics` returns 404 through Caddy).
- What is happening: If the monitoring path itself fails (droplet down, Prometheus down, Sentry DSN unset, network egress broken), nothing outside that path will alert. The Watchdog rule exists but is not delivered.
- Why it matters: The "who watches the watcher" case fails silently; the very scenario the extended checks require cannot be detected by the current stack.
- User / business impact: Prolonged undetected outages; SLA breaches discovered by customers first.
- Security / privacy / reliability impact: Extended MTTR; security events could go unnoticed during a monitoring outage.
- Recommended fix: Deploy Alertmanager with at least one out-of-band receiver (e.g. an external uptime service or a hosted dead-man's-switch such as Healthchecks/Deadman) and route the Watchdog rule to it; add an external HTTP monitor hitting a public synthetic endpoint that does not share the droplet.
- Suggested validation: Stop Prometheus/Alertmanager and confirm the external receiver fires within N minutes; also stop Sentry ingestion and confirm the external check still reports.
- Owner suggestion: Platform engineer
- Effort estimate: M
- Dependencies: Choice of out-of-band receiver; may require a small non-droplet endpoint
- Status: open
- Endpoint / data path: Prometheus `prometheus.yml` scrape of `api:4000/metrics` → rules → (missing) Alertmanager
- Attack path: none identified

### Finding ID: IR-P1-001 - Rollback documentation contradicts itself on SHA-targeted rollback

- Severity: P1
- Confidence: High
- Area: IR / Rollback & deployment docs
- Evidence:
  - `docs/ROLLBACK_PROCEDURES.md` §1 says set `rollback_sha` to the previous working 40-char SHA and the workflow builds images tagged with it.
  - `docs/FINAL_DEPLOYMENT_OPERATIONS_HANDBOOK.md` §Rollback says "The workflow deploys the HEAD of the selected branch... To deploy a specific SHA, use the manual method below."
  - `.github/workflows/deploy-do.yml` lines 11-15 and 33 define `rollback_sha` and `IMAGE_TAG: ${{ github.event.inputs.rollback_sha || github.sha }}`, and lines 181/203/225 skip builds when `rollback_sha` is set — i.e. code matches ROLLBACK_PROCEDURES and contradicts the Handbook.
- What is happening: Two authoritative-looking operator documents give opposite instructions for the primary rollback path.
- Why it matters: Under incident pressure, an operator may follow the Handbook, believe only SSH manual rollback works, and lose time; or attempt a SHA rollback believing builds occur when they are skipped.
- User / business impact: Slower recovery; greater risk of a botched rollback during an outage.
- Security / privacy / reliability impact: Extends RTO beyond the documented 15 minutes for app recovery.
- Recommended fix: Update the Handbook rollback section to match `ROLLBACK_PROCEDURES.md` and the workflow (SHA-targeted `workflow_dispatch`; builds skipped; images must already exist), and state the exact operator steps and preconditions.
- Suggested validation: Literal walk of both docs by a second operator; confirm the workflow input behaves as documented on a non-prod target.
- Owner suggestion: Platform engineer / docs maintainer
- Effort estimate: S
- Dependencies: none
- Status: open
- Endpoint / data path: GitHub Actions `workflow_dispatch` (`deploy_target`, `rollback_sha`) → SSH → `IMAGE_TAG` → `docker compose up -d`
- Attack path: none identified

### Finding ID: IR-P1-002 - Bad-migration recovery is manual-only with no automated reverse or staging proof

- Severity: P1
- Confidence: High
- Area: IR / Rollback & migrations
- Evidence:
  - `.github/workflows/supabase-migrations.yml` runs `supabase db diff --linked --schema public || true` (dry-run result swallowed) then `supabase db push --include-all`. There is no reverse-migration step and no automated rollback.
  - `docs/ROLLBACK_PROCEDURES.md` §3 offers three manual options: write a reverse migration by hand, Supabase PITR (Pro dashboard action), or manual SQL.
  - `docs/RTO_RPO.md` states Postgres RTO 1h / RPO 5m, but no exercised evidence exists.
- What is happening: A destructive or incorrect migration in dev/prod must be undone by a human writing reverse SQL or by a PITR dashboard action; the dry-run diff that could catch a problem is discarded with `|| true`.
- Why it matters: A bad migration is one of the highest-impact, highest-likelihood incidents; recovery is slow and error-prone.
- User / business impact: Data loss or prolonged data inconsistency; RTO/RPO targets may be missed.
- Security / privacy / reliability impact: Partial restores or reverse DDL can corrupt referential integrity or tenant data.
- Recommended fix: (1) Remove `|| true` from the diff step and fail on unexpected diffs; (2) add a documented, rehearsed reverse-migration mechanism and/or a PITR runbook with exact steps and a recommended default restore point; (3) require an isolated dry-run of migrations before prod apply.
- Suggested validation: Apply a deliberately destructive migration on a Supabase branch; measure time to full restore and confirm the data matches pre-migration.
- Owner suggestion: Backend/platform engineer
- Effort estimate: M
- Dependencies: Supabase plan (PITR availability); branch/isolated DB for dry-runs
- Status: open
- Endpoint / data path: `supabase db push` → Postgres schema/data
- Attack path: none identified

### Finding ID: IR-P1-003 - Worker health failure during deploy is non-fatal

- Severity: P1
- Confidence: High
- Area: IR / Deployment & observability
- Evidence:
  - `.github/workflows/deploy-do.yml` lines 515-522: after the API check, the Worker check over SSH returns 200 or 000; on non-200 the workflow prints "Warning: Worker health check returned HTTP $wcode (non-fatal — worker is restart-loop tolerant)" and continues.
  - `docs/MONITORING_AND_ALERTING.md` §2 documents the Worker `/health` endpoint but §7 has no Worker-specific alert.
- What is happening: A deploy can be marked successful while the Worker is unable to process jobs, because the Worker health result is ignored and the worker is assumed restart-tolerant.
- Why it matters: Background work (webhook retries, Stripe reconciliation, notifications, syncs) can silently stop while the deploy reports green and the API stays healthy.
- User / business impact: Missed emails/notifications, failed webhook deliveries, billing reconciliation drift — discovered late by users.
- Security / privacy / reliability impact: Silent background-job outage; no automated detection.
- Recommended fix: Make the Worker health check fatal (or gate pruning/rollback on it), and add a Prometheus/Sentry alert on `worker_task_queue_depth` and worker `/health`.
- Suggested validation: Deploy with the Worker intentionally broken; assert the pipeline fails or alerts.
- Owner suggestion: Platform engineer
- Effort estimate: S
- Dependencies: IR-P0-003 (alert delivery) for the alert half
- Status: partially-fixed (health check added since prior run; still non-fatal)
- Endpoint / data path: SSH `docker exec mct-portal-worker-1 wget .../health` → deploy gate
- Attack path: none identified

### Finding ID: IR-P1-004 - Backups are not verified deeply enough to prove the documented RPO/RTO

- Severity: P1
- Confidence: High
- Area: IR / Backups
- Evidence:
  - `.github/workflows/db-restore-test.yml` restores into a temp `postgres:16-alpine` and only prints `count(*)` from `information_schema.tables` and a `_migrations` table probe. It does not compare row counts to the source, verify recent data, or exercise PITR.
  - `docs/RTO_RPO.md` asserts Postgres RPO 5 minutes; the daily `pg_dump` cadence in `db-backup.yml` (cron `0 4 * * *`) can only support ~24h RPO for the dump path; only Supabase PITR could meet 5 minutes, and no PITR drill exists in the repo.
  - `scripts/backup-database.sh` uses `docker run ... postgres:15` fallback while the restore test uses `postgres:16-alpine` (potential version skew not asserted).
- What is happening: The "weekly restore test" proves a dump can be gunzipped into Postgres, not that the restore is usable, complete, or within RPO.
- Why it matters: A backup that restores structurally but is missing recent data or is truncated would still show green.
- User / business impact: Data loss discovered only when a real restore is needed.
- Security / privacy / reliability impact: False confidence in disaster recovery.
- Recommended fix: Extend the drill to assert per-table row counts vs a read-only source snapshot, check the newest row timestamp, verify PITR to a target time in an isolated project/branch, and record results.
- Suggested validation: The improved drill must fail when a table is deliberately truncated in the backup.
- Owner suggestion: Platform engineer / DBA
- Effort estimate: M
- Dependencies: Read-only source creds; isolated restore target; Supabase plan for PITR
- Status: open
- Endpoint / data path: S3 backup object → temp Postgres → verification queries
- Attack path: none identified

### Finding ID: IR-P1-005 - Backup bucket configuration is inconsistent between the script, the backup workflow, and the restore test

- Severity: P1
- Confidence: Medium
- Area: IR / Backups & CI/CD
- Evidence:
  - `scripts/backup-database.sh` line 8 defaults `S3_BUCKET=mainecybertech-backups`, and uploads to `s3://${S3_BUCKET}/${S3_PREFIX}/`.
  - `.github/workflows/db-backup.yml` passes `SUPABASE_DB_URL`, AWS keys, and region, but does **not** set `S3_BUCKET` (so the script default is used).
  - `.github/workflows/db-restore-test.yml` reads `${{ secrets.S3_BACKUP_BUCKET }}/` with `aws s3 ls ... --recursive` and downloads `"${{ secrets.S3_BACKUP_BUCKET }}/${{ ...backup_file }}"` — note no `s3://` scheme prefix is shown, and the bucket secret name differs from the script's `S3_BUCKET`.
- What is happening: Backup and restore use different bucket identifiers/names and the restore path's URL form is inconsistent, so the two halves may not agree at runtime.
- Why it matters: If the restore test points at the wrong location it will fail (or, worse, verify a stale object), leaving the backup path effectively unverified.
- User / business impact: Unverified or unusable backups surface only during a real incident.
- Security / privacy / reliability impact: Recovery confidence is reduced; a reviewer cannot confirm wiring from the repo alone.
- Recommended fix: Standardize on one secret name (e.g. `S3_BACKUP_BUCKET` with explicit `s3://`), set it in `db-backup.yml`, and use it in `scripts/backup-database.sh`; assert both workflows reference the same value.
- Suggested validation: Run both workflows against a staging bucket and confirm the restore test downloads the object the backup just wrote.
- Owner suggestion: Platform engineer
- Effort estimate: S
- Dependencies: None
- Status: open
- Endpoint / data path: `pg_dump` → S3 object; restore test → `aws s3 cp` → temp Postgres
- Attack path: none identified

### Finding ID: IR-P1-006 - No runtime detection or alerting for tenant-isolation (RLS) regressions

- Severity: P1
- Confidence: High
- Area: IR / Tenant isolation
- Evidence:
  - `docs/RLS-rollout.md` states RLS is enforced via an allow-list in repo-level secrets (~44 read / ~17 write modules) with a service-role default, and that admin cross-tenant access stays on the service-role path.
  - `docs/RLS-coverage-matrix.md` lists 4 service-role-only and 6 open-policy tables; policy labels are keyword-derived and may be mislabelled.
  - `scripts/verify-rls.mjs` gates *new migrations* in `test.yml`/`validate.yml`, but there is no runtime alert on cross-tenant reads, RLS errors, or unexpected empty results (the doc's only symptom is "watch API logs for DB_ERROR / empty-result regressions").
- What is happening: A regression that exposes or blocks tenant data is caught only by slower static gates or by a human noticing logs; there is no automated alert.
- Why it matters: Tenant data exposure is a P0-class incident; detection latency matters.
- User / business impact: Potential cross-tenant data exposure; trust and compliance impact for an MSP platform.
- Security / privacy / reliability impact: Loss of confidentiality; delayed containment.
- Recommended fix: Add runtime RLS-regression detection: alert on abnormal DB_ERROR rates on RLS-enabled modules, on empty-result spikes, and add a CI/E2E multi-tenant isolation assertion per enabled module.
- Suggested validation: Introduce a deliberately broken policy on a non-prod module; confirm an alert fires and a seeded org-B probe cannot read org-A rows.
- Owner suggestion: Security/platform engineer
- Effort estimate: M
- Dependencies: Multi-tenant seed data; alert delivery (IR-P0-003)
- Status: open
- Endpoint / data path: `getScopedClient(req, module, kind)` → Postgres RLS → tables
- Attack path: RLS regression + service-role default → cross-tenant read (not demonstrated in repo)

### Finding ID: IR-P2-001 - Several Prometheus metrics are declared but not wired, limiting incident diagnosis

- Severity: P2
- Confidence: High
- Area: IR / Observability
- Evidence:
  - `docs/MONITORING_AND_ALERTING.md` §4 lists `portal_db_query_duration_seconds`, `portal_search_queries_total`, `portal_active_organizations`, `portal_active_users`, `portal_idempotency_key_hits_total`, and org/entity creation counters as "defined, not wired".
  - Only `portal_http_requests_total`, `portal_http_request_duration_seconds`, `portal_webhook_deliveries_total`, `portal_auth_attempts_total`, and `portal_circuit_breaker_status` are "live" per the same table.
- What is happening: Metrics exist in code but are not emitted, so dashboards/alerts that would use them cannot function.
- Why it matters: Diagnosing DB latency or auth anomalies during an incident is harder and depends on guesswork.
- User / business impact: Slower diagnosis; longer outages.
- Security / privacy / reliability impact: Reduced observability of auth and DB failure modes.
- Recommended fix: Wire the declared metrics and add alert rules where relevant (DB latency, auth failure rate).
- Suggested validation: `/metrics` shows non-zero series for each wired metric after traffic.
- Owner suggestion: Backend engineer
- Effort estimate: M
- Dependencies: None
- Status: open
- Endpoint / data path: `GET /metrics` → Prometheus scrape
- Attack path: none identified

### Finding ID: IR-P2-002 - No alerting on audit-trail gaps or privileged (impersonation/admin) abuse

- Severity: P2
- Confidence: High
- Area: IR / Audit logs & admin abuse
- Evidence:
  - `apps/api/src/services/audit.ts` lines 60-65: after 3 failed attempts it only logs "audit log insert failed after all retries — audit trail gap"; there is no alert.
  - `apps/api/src/routes/audit.ts` is admin-gated (`requireAuth`, `requireAdmin`) and exports up to 10000 rows, but nothing alerts on unusual admin/impersonation activity.
  - `docs/RLS-coverage-matrix.md`: `impersonation_log` has a service-role-only policy and is described as intentionally service-only; `audit_logs` has S,I policies and no DELETE policy.
- What is happening: The system records a gap when the audit trail fails, and records impersonation, but neither triggers notification.
- Why it matters: Abuse or tampering can proceed without timely detection.
- User / business impact: Weakened assurance for customers relying on admin accountability.
- Security / privacy / reliability impact: Delayed detection of insider/credential abuse.
- Recommended fix: Emit a metric/alert on audit insert failures and on impersonation-log volume/authorization anomalies; add a tamper-evidence check (e.g. row count continuity / append-only assertion).
- Suggested validation: Force audit insert failures and confirm an alert; simulate repeated impersonation and confirm an alert.
- Owner suggestion: Security/platform engineer
- Effort estimate: M
- Dependencies: IR-P0-003 (alert delivery)
- Status: open
- Endpoint / data path: mutation → `logAuditEvent` → `audit_logs`; admin → `/audit`
- Attack path: none identified

### Finding ID: IR-P2-003 - No alerting when webhook dead-letters accumulate or payment reconciliation drifts

- Severity: P2
- Confidence: Medium
- Area: IR / Webhook, payment, notification failures
- Evidence:
  - `apps/worker/src/tasks/webhook-dispatcher.ts` sets `dead_letter: true` for blocked URLs and schedules `next_retry_at` for failures; `webhook-retry.ts` consumes retries.
  - `apps/worker/src/tasks/stripe-reconcile.ts` returns counts (`reconciled, suspended, errors, total`) but no alert is defined for drift.
  - `docs/MONITORING_AND_ALERTING.md` §4 lists `portal_webhook_deliveries_total` as live but no alert rule uses it; `prometheus.rules.yml` only covers service-down and 5xx rate.
- What is happening: Failed external deliveries and billing drift are recorded but not surfaced.
- Why it matters: Customer-facing notifications and billing can fail silently.
- User / business impact: Missed leads/alerts; billing discrepancies.
- Security / privacy / reliability impact: Silent integration failure; reconciliation errors.
- Recommended fix: Add alerts on webhook dead-letter growth and on reconciliation error/suspension thresholds; add a Sentry capture for reconcile errors.
- Suggested validation: Force repeated webhook failures; confirm dead-letter alert fires.
- Owner suggestion: Backend engineer
- Effort estimate: S
- Dependencies: IR-P0-003 (alert delivery)
- Status: open
- Endpoint / data path: Worker task → `webhook_deliveries` / Stripe API
- Attack path: none identified

### Finding ID: IR-P2-004 - Secrets rotation is documented but has no exercised evidence

- Severity: P2
- Confidence: High
- Area: IR / Security docs
- Evidence:
  - `docs/SECRETS_ROTATION.md` §Rotation Log contains only the "(Initial deployment)" row.
  - The scheduled reminder workflow shown in §Automation is presented as a code block referencing `.github/workflows/secret-rotation-reminder.yml`; that workflow file does **not** exist in `.github/workflows/` (16 files listed, none named secret-rotation-reminder).
  - `.github/workflows/test.yml` and `.husky/pre-commit` provide secret scanning, but no rotation evidence exists.
- What is happening: Rotation policy exists on paper; the reminder automation is not actually committed and no rotation has been recorded.
- Why it matters: An unexercised rotation procedure is likely to fail under pressure; stale credentials persist.
- User / business impact: Increased exposure window on a credential leak.
- Security / privacy / reliability impact: Unrotated secrets; untested emergency procedure.
- Recommended fix: Commit the `secret-rotation-reminder.yml` workflow (or remove the misleading code block), and perform + record at least one rotation drill for a low-risk secret in `dev`.
- Suggested validation: A dev JWT/Stripe test rotation completed and logged with the Actions run URL.
- Owner suggestion: Platform/security engineer
- Effort estimate: S
- Dependencies: Secrets owner for a non-prod secret
- Status: open
- Attack path: none identified

### Finding ID: IR-P2-005 - No platform status/communication surface for MCT's own outages

- Severity: P2
- Confidence: Medium
- Area: IR / Operator docs & communication
- Evidence:
  - `docs/features/public-status-page.md` implements a status page **per tenant** (`status_components`/`status_incidents` keyed by `organization_id`) — it is product tooling, not an MCT platform status page.
  - No MCT-owned status page or customer-communication runbook exists in `docs/` (directory listing).
- What is happening: The platform can host status pages for customers but has none for itself; there is no documented channel for communicating an MCT platform incident.
- Why it matters: During an outage, customers have no canonical status source and operators have no comms template.
- User / business impact: Support load and trust erosion during outages.
- Security / privacy / reliability impact: Inconsistent incident communications.
- Recommended fix: Stand up an MCT platform status page (or use the existing product as an internal-only instance) and add communication templates to the platform IR doc.
- Suggested validation: Simulate an outage and publish/update a status entry on schedule.
- Owner suggestion: Platform lead
- Effort estimate: S
- Dependencies: IR-P0-001 (comms templates)
- Status: open
- Attack path: none identified

### Finding ID: IR-P2-006 - Migration dry-run result is discarded in CI

- Severity: P2
- Confidence: High
- Area: IR / CI/CD failures & migrations
- Evidence:
  - `.github/workflows/supabase-migrations.yml` line 58: `supabase db diff --linked --schema public || true` — any diff (including an unintended schema drift) is swallowed.
- What is happening: The one automated pre-apply signal is intentionally ignored.
- Why it matters: Schema drift or unexpected diffs are not caught before `db push`.
- User / business impact: Higher chance of a bad migration reaching an environment.
- Security / privacy / reliability impact: Reduced safety margin on the most dangerous change type.
- Recommended fix: Remove `|| true`, capture the diff as an artifact, and fail/warn on non-empty unexpected diffs per policy.
- Suggested validation: Introduce a stray schema change; confirm CI surfaces it.
- Owner suggestion: Backend engineer
- Effort estimate: S
- Dependencies: IR-P1-002
- Status: open
- Endpoint / data path: `supabase db diff` → CI output/artifact
- Attack path: none identified

### Finding ID: IR-P3-001 - Terraform state restore guidance lacks a tested procedure

- Severity: P3
- Confidence: Medium
- Area: IR / Rollback
- Evidence:
  - `docs/ROLLBACK_PROCEDURES.md` §4 "Restore previous Terraform state (emergency)" gives only a comment block pointing at DO Spaces (`mct-portal-tfstate-<env>`, key `terraform/do/terraform.tfstate`) with "Restore from a prior version via DO Spaces UI or CLI" — no exact commands, no dry-run, no record of a drill.
- What is happening: State-restore is described but not operationalized.
- Why it matters: State corruption is rare but catastrophic; an untested procedure lengthens recovery.
- User / business impact: Longer infrastructure recovery time.
- Security / privacy / reliability impact: Risk of applying against corrupted/foreign state.
- Recommended fix: Add exact `aws s3api`/`doctl` restore commands, a state-backup verification step, and a recommended non-prod drill.
- Suggested validation: Restore state into a scratch backend and run `terraform plan` with no unexpected changes.
- Owner suggestion: Platform engineer
- Effort estimate: S
- Dependencies: DO Spaces access for a scratch run
- Status: open
- Attack path: none identified

### Finding ID: IR-P3-002 - Monitoring doc and health endpoint disagree on check semantics; Redis severity undocumented in alerts

- Severity: P3
- Confidence: Medium
- Area: IR / Monitoring docs
- Evidence:
  - `docs/MONITORING_AND_ALERTING.md` §2 shows a `/health` response with only `checks.database` and says 503 if "any check fails", while §7 lists Redis as a warning.
  - `apps/api/src/routes/health.ts` lines 98-103: Redis status is **reported but never degrades** overall health ("a Redis outage must not take down the deploy gate").
- What is happening: The documented health contract is narrower/stricter than the implemented one; Redis semantics are only in code comments.
- Why it matters: On-call interpretation of `/health` during a Redis incident may be wrong.
- User / business impact: Slower/incorrect triage.
- Security / privacy / reliability impact: Minor observability inconsistency.
- Recommended fix: Update §2 to document Stripe/JSM/Redis checks and their non-degrading semantics.
- Suggested validation: Compare doc examples to `GET /health` output in each failure mode.
- Owner suggestion: Docs maintainer
- Effort estimate: S
- Dependencies: None
- Status: open
- Attack path: none identified

## Risks

| Risk | Severity | Likelihood | Impact | Evidence | Mitigation |
|---|---|---|---|---|---|
| Undetected outage because monitoring path fails silently | P0 | Medium | High | `prometheus.rules.yml` no Alertmanager; no pager | IR-P0-003 external dead-man's-switch |
| Tenant data breach handled without a process | P0 | Low-Med | Critical | No breach doc; `SECURITY.md` report-in only | IR-P0-002 breach runbook |
| Ad-hoc incident response across operators | P0 | High | Medium-High | No platform IR doc | IR-P0-001 IR doc + templates |
| Bad migration causes data loss; slow manual recovery | P1 | Medium | High | `supabase-migrations.yml` no reverse; ROLLBACK §3 manual | IR-P1-002, IR-P2-006 |
| Backup is unverified / wrong bucket | P1 | Medium | High | restore-test shallow; bucket mismatch | IR-P1-004, IR-P1-005 |
| Worker silently down while deploy is green | P1 | Medium | Medium-High | non-fatal worker check | IR-P1-003 |
| RLS regression exposes tenant data undetected | P1 | Low-Med | Critical | allow-list broad; no runtime alert | IR-P1-006 |
| Operator follows contradictory rollback docs | P1 | Medium | Medium | Handbook vs ROLLBACK_PROCEDURES | IR-P1-001 |
| Credential leak not rotated / undetected | P2 | Medium | High | rotation log single row; no fallback alert | IR-P2-004 |
| Webhook/payment failures unnoticed | P2 | Medium | Medium | dead-letter exists, no alert | IR-P2-003 |
| Audit-trail gap unnoticed | P2 | Low-Med | Medium-High | `audit.ts` logs gap only | IR-P2-002 |

## Recommendations

### Immediate / Release Blocking

1. **IR-P0-001** — Author `docs/INCIDENT_RESPONSE.md` with severity model (SEV1–SEV5), roles, containment/comms/postmortem, and templates; link from `docs/INDEX.md` and `SECURITY.md`.
2. **IR-P0-002** — Author `docs/DATA_BREACH_RESPONSE.md` with detection, containment, assessment, notification, and a breach register.
3. **IR-P0-003** — Deploy Alertmanager with an out-of-band receiver and route the `Watchdog` rule; add an external uptime check independent of the droplet.

### This Week

4. **IR-P1-001** — Reconcile the Handbook rollback section with `ROLLBACK_PROCEDURES.md` and `deploy-do.yml`.
5. **IR-P1-003** — Make the Worker health check fatal or gate pruning/rollback on it.
6. **IR-P1-005** — Standardize the backup bucket secret/config across `db-backup.yml`, `scripts/backup-database.sh`, and `db-restore-test.yml`.
7. **IR-P1-006** — Add RLS-regression alerting and a multi-tenant isolation CI assertion.

### This Month

8. **IR-P1-002** — Add a rehearsed reverse-migration/PITR runbook with exact steps; fail on unexpected `db diff`.
9. **IR-P1-004** — Deepen the restore drill (row counts vs source, newest-timestamp check, isolated PITR to a target time).
10. **IR-P2-001** — Wire the "defined, not wired" metrics.
11. **IR-P2-002** — Alert on audit-write gaps and privileged/impersonation anomalies.
12. **IR-P2-003** — Alert on webhook dead-letters and reconciliation drift.
13. **IR-P2-004** — Commit or remove the rotation-reminder workflow; record a rotation drill.

### Later / Platform Evolution

14. **IR-P2-005** — Stand up an MCT platform status page + comms templates.
15. **IR-P3-001** — Operationalize Terraform state restore with exact commands and a non-prod drill.
16. **IR-P3-002** — Align monitoring docs with implemented health semantics.
17. Institutionalize quarterly tabletops using the companion `incident_tabletop_scenarios.md`, with after-action reports stored in-repo.

## Quick Wins

| Quick win | Why it helps | Files likely involved | Validation |
|---|---|---|---|
| Remove `|| true` on the migration diff | Restores the one pre-apply safety signal | `.github/workflows/supabase-migrations.yml` | Stray schema change surfaces in CI |
| Make Worker health fatal | Prevents green deploys with a dead worker | `.github/workflows/deploy-do.yml` | Broken worker fails the pipeline |
| Fix Handbook rollback section | Removes contradictory operator guidance | `docs/FINAL_DEPLOYMENT_OPERATIONS_HANDBOOK.md` | Second-operator literal walk |
| Standardize `S3_BACKUP_BUCKET` | Makes backup/restore agree | `db-backup.yml`, `scripts/backup-database.sh`, `db-restore-test.yml` | Restore test downloads the object just written |
| Commit rotation-reminder workflow | Makes the documented automation real | `.github/workflows/secret-rotation-reminder.yml` | Workflow appears and creates an issue |
| Update `MONITORING_AND_ALERTING.md` §2 | Correct health semantics for on-call | `docs/MONITORING_AND_ALERTING.md` | Doc examples match `/health` output |

## Hardening Backlog

| Backlog item | Priority | Owner suggestion | Effort | Dependency |
|---|---|---|---|---|
| Platform IR plan + templates (IR-P0-001) | P0 | Platform lead | M | — |
| Data breach runbook + register (IR-P0-002) | P0 | Security reviewer | M | IR-P0-001 |
| Alertmanager + external dead-man's-switch (IR-P0-003) | P0 | Platform engineer | M | Receiver choice |
| Reconcile rollback docs (IR-P1-001) | P1 | Platform engineer | S | — |
| Fatal Worker health gate (IR-P1-003) | P1 | Platform engineer | S | — |
| Backup bucket standardization (IR-P1-005) | P1 | Platform engineer | S | — |
| RLS regression alerting (IR-P1-006) | P1 | Security/platform | M | IR-P0-003 |
| Reverse-migration/PITR runbook (IR-P1-002) | P1 | Backend engineer | M | Supabase plan |
| Deep restore drill (IR-P1-004) | P1 | Platform/DBA | M | Read-only source creds |
| Wire metrics (IR-P2-001) | P2 | Backend engineer | M | — |
| Audit/impersonation alerting (IR-P2-002) | P2 | Security/platform | M | IR-P0-003 |
| Webhook/payment failure alerts (IR-P2-003) | P2 | Backend engineer | S | IR-P0-003 |
| Rotation drill + reminder workflow (IR-P2-004) | P2 | Platform/security | S | Non-prod secret |
| Platform status page + comms (IR-P2-005) | P2 | Platform lead | S | IR-P0-001 |
| Migration dry-run gate (IR-P2-006) | P2 | Backend engineer | S | IR-P1-002 |
| Terraform state restore drill (IR-P3-001) | P3 | Platform engineer | S | DO Spaces scratch |
| Monitoring doc alignment (IR-P3-002) | P3 | Docs maintainer | S | — |

## Suggested Tests

- **Unit**: `apps/api/src/services/audit.ts` — assert retry/backoff and that the final failure emits an alert-eligible event; `apps/api/src/lib/circuit-breaker.ts` — assert state metric updates.
- **Integration**: Multi-tenant RLS isolation per enabled module (org-B cannot read org-A ids) against a seeded DB; Worker `/health` and queue-depth metric assertions.
- **E2E**: An incident smoke test that kills the worker container and asserts the deploy/pipeline or alert surfaces it.
- **CI**: Planted fake credentials fail both `scripts/scan-secrets.sh` and the `test.yml` `secrets-scan` job; a deliberately drifted migration fails the `db diff` gate.
- **Security**: A step-role/rotated-key detection test in `dev`; impersonation-volume alert test.
- **Regression**: Restore-drill test that fails when a table in the backup is truncated; rollback doc literal walk as a manual CI checklist item.
- **Manual validation (tabletop)**: Run each of the 12 scenarios in `incident_tabletop_scenarios.md` with only repo docs available; record detection time, TTP (time to triage), and time to recovery vs `docs/RTO_RPO.md`.

## Suggested Documentation Updates

- Create `docs/INCIDENT_RESPONSE.md` (platform IR: roles, severity, containment, comms, postmortem).
- Create `docs/DATA_BREACH_RESPONSE.md` (detection → notification → disclosure + register).
- Create `docs/templates/POSTMORTEM.md` and `docs/templates/INCIDENT_COMMS.md`.
- Update `docs/FINAL_DEPLOYMENT_OPERATIONS_HANDBOOK.md` §Rollback to match `ROLLBACK_PROCEDURES.md`/`deploy-do.yml`.
- Update `docs/MONITORING_AND_ALERTING.md` §2 (health semantics incl. Stripe/JSM/Redis) and §4/§7 (alert delivery path once Alertmanager exists).
- Update `docs/RTO_RPO.md` with the exercised backup/restore procedure, evidence locations, and any revised RPO.
- Update `docs/RLS-rollout.md` with a runtime regression-detection section.
- Update `docs/INDEX.md` to list the new platform IR, breach, and template docs.
- Commit `.github/workflows/secret-rotation-reminder.yml` or remove the code block in `docs/SECRETS_ROTATION.md` and add the rotation-drill entry.

## Open Questions

| Question | Why it matters | Evidence needed |
|---|---|---|
| Is Sentry alerting actually configured (rules exist in the org, DSN set in prod)? | The primary error-alert channel is asserted in docs but not repo-verifiable | Sentry org alert-rule config + prod env confirmation |
| Does the prod environment actually run Alertmanager anywhere (outside this compose file)? | Determines whether IR-P0-003 is real or doc-only | Droplet/compose inventory |
| What is the real backup bucket name, and do backup and restore agree at runtime? | Determines whether backups are verified | GitHub secrets values (names only) + a passing restore run |
| Has a Supabase PITR restore ever been performed? | Proves the 5-minute RPO claim | Supabase dashboard history / run log |
| Are the RLS allow-list secrets currently identical across dev and prod? | The docs note env overrides repo; drift changes isolation | GitHub repo/env secret inventory (names/values count) |
| Was a real secret rotation ever completed? | The log shows only the initial row | `gh secret` history + source-system audit logs |
| Who is the on-call/incident commander? | No pager/on-call exists | Organizational decision |
| Are `worker_task_queue_depth` / dead-letter counts exported and scraped? | Needed for IR-P1-003/IR-P2-003 alerts | `/metrics` scrape output + Prometheus targets |

## Appendix

### A. Prior-run continuity (run 20260728-0142-develop-21a10d6, area code INC)

| Prior finding | Prior severity | Status at 62861370 | Evidence |
|---|---|---|---|
| INC-017 No pre-commit secret scanning | CRITICAL | **Verified-fixed (supported)** | `.husky/pre-commit` → `scripts/scan-secrets.sh` |
| (TEST) no CI secret scan | P2 | **Verified-fixed (supported)** | `test.yml` `secrets-scan` job |
| INC-009 Deploy does not health-check Worker | HIGH | **Partially-fixed** | `deploy-do.yml` checks worker but non-fatal → IR-P1-003 |
| INC-001 Supabase rollback manual-only | HIGH | **Still-open** | `supabase-migrations.yml`, ROLLBACK §3 → IR-P1-002 |
| INC-002 No DB integrity monitoring | HIGH | **Still-open** | restore-test shallow → IR-P1-004 |
| INC-018 No alert on direct Supabase access | CRITICAL | **Still-open** | no alert path → IR-P0-003/IR-P1-006 |
| INC-006 No bulk exfiltration detection | HIGH | **Still-open** | no postgres access-log alert in repo |
| INC-020 Service-role key bypasses RLS | HIGH | **Still-open (by design)** | `RLS-rollout.md` service-role default |
| INC-005 JWT fallback not alerted | HIGH | **Still-open** | no alert on fallback in repo |
| (new) Monitoring self-loss | — | **Open** | `prometheus.rules.yml` no receiver → IR-P0-003 |
| (new) Backup bucket inconsistency | — | **Open** | script vs workflow vs restore-test → IR-P1-005 |

### B. Severity distribution at this run

- P0: 3 (IR-P0-001, IR-P0-002, IR-P0-003)
- P1: 6 (IR-P1-001 … IR-P1-006)
- P2: 6 (IR-P2-001 … IR-P2-006)
- P3: 2 (IR-P3-001, IR-P3-002)
- Total: 17

### C. Scenario scores (documented-procedure basis)

Scores reflect whether the repo's docs + code + CI would enable detection → triage → recovery within the documented targets. See `incident_tabletop_scenarios.md` for the full catalog.

| # | Scenario | Detection | Triage | Recovery | Overall | Weakest link |
|---|---|---:|---:|---:|---:|---|
| 1 | Database loss / restore | 3 | 3 | 3 | 3.0 | shallow restore proof |
| 2 | Secret/key compromise | 2 | 3 | 3 | 2.7 | no compromise detection |
| 3 | Bad migration | 2 | 3 | 2 | 2.3 | manual-only reverse |
| 4 | Deploy rollback | 4 | 4 | 4 | 4.0 | Worker non-fatal |
| 5 | Supabase outage | 3 | 3 | 3 | 3.0 | no external monitor |
| 6 | Dependency compromise | 4 | 3 | 3 | 3.3 | no runtime SBOM attn |
| 7 | CI compromise | 2 | 3 | 3 | 2.7 | no out-of-band CI alert |
| 8 | RLS regression / tenant exposure | 2 | 2 | 3 | 2.3 | no runtime detection |
| 9 | Webhook/payment/notification failure | 2 | 3 | 4 | 3.0 | no dead-letter alert |
| 10 | Admin abuse | 2 | 3 | 3 | 2.7 | no abuse alert |
| 11 | Total monitoring-path loss | 1 | 2 | 3 | 2.0 | no receiver |
| 12 | Recurring incident / fix durability | 3 | 3 | 2 | 2.7 | no postmortem registry |

### D. Key commands used (read-only)

```text
"C:\Program Files\Git\cmd\git.exe" -C C:\temp\mainecybertech log -1 --format='%H|%ci|%s'
"C:\Program Files\Git\cmd\git.exe" -C C:\temp\mainecybertech branch --show-current
Get-ChildItem .github\workflows
Select-String -Pattern 'gitleaks|trufflehog|secret.scan' across repo
```

No live system was contacted; no state was mutated. Secret values were not read or printed; only secret *names* and code paths are referenced.

### E. Change log

- 2026-10-02 — Initial report authored at develop@62861370 for run 20261002-0344-develop-6286137.
