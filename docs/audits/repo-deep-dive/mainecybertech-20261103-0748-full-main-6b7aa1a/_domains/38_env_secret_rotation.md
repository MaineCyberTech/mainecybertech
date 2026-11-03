# Environment and Secret Rotation Audit (re-audit)

## Audit Metadata

- Audit name: `repo-deep-dive`
- Run: `mainecybertech-20261103-0748-full-main-6b7aa1a`
- Repository: `MaineCyberTech/mainecybertech`
- Branch / commit: `main` @ `6b7aa1a5505d4f75b334b36e9e87737cd98e589c`
- Generated at: `2026-11-03T08:57:21Z`
- Area code: `SECRET`
- Output path: `docs/audits/repo-deep-dive/mainecybertech-20261103-0748-full-main-6b7aa1a/38_env_secret_rotation.md`
- Scope limitations: repository-side + public GitHub API only; no admin token, no live droplet access, no mutation. Where a control needs an admin setting it is marked operator-gated.

## Scope

.env.example files, runtime validators, deploy printf/env forwarding, GitHub environment matrix, rotation/revocation runbooks, rotation log, secret scanning, backup/migration environments.

## Verification Performed

| Evidence | Type | Why relevant | Result |
|---|---|---|---|
| `grep` REDIS_PASSWORD / VAPID_PRIVATE_KEY / MALWARE_SCANNER_API_KEY in rotation docs | Docs | Rotation inventory coverage | absent (SECRET-P2-001) |
| `docs/SECRETS_ROTATION.md:500-505` | Docs | Real rotation evidence | initial row + 2026-10-12 dry-run only (SECRET-P2-002/006) |
| `apps/web/Dockerfile:28-30` + `apps/web/lib/env.ts:87-92` | Config | Fail-closed API URL | build fails / production throws (SECRET-P3-002 fixed) |
| `node scripts/check-env-parity.mjs` (executed) | Guard | Env schema/example/docs parity | **PASS** |
| Workflow `environment:` expressions vs `docs/SECRETS_ROTATION.md:33` | Cross-check | Backup target environments | docs say dev-only; workflows use prod-approval/prod-backup (SECRET-P2-010) |

## Executive Summary

Env delivery and rotation procedures remain largely fixed: M365_CLIENT_STATE is documented/delivered, the deploy writes every secret-class key, the rotation/emergency procedures target `prod-approval` for prod mutations, and the web build now fails closed when `NEXT_PUBLIC_API_URL` is missing (SECRET-P3-002 verified). Three prior partials remain: the rotation inventory still omits REDIS_PASSWORD, VAPID_PRIVATE_KEY and MALWARE_SCANNER_API_KEY; the log still has no real rotation; and the drill remains desk-only. A new inconsistency: the rotation consuming-environment table still says backups are dev-only, while the workflows now attach `prod-approval`/`prod-backup` (SECRET-P2-010).

**Totals:** 18 findings — P0 0, P1 3, P2 10, P3 5. Status: open 1, partially-fixed 3, verified-fixed 14.

**New this run:** SECRET-P2-010.

## Findings

| ID | Sev | Title | Status | Evidence (at 6b7aa1a) |
|---|---|---|---|---|
| SECRET-P1-001 | P1 | M365 webhook secret is dead config while the real M365 auth value is undocumented and undeployed | verified-fixed | re-verified at 6b7aa1a: no M365_WEBHOOK_SECRET remains (only explanatory comments env.ts:102-105); M365_CLIENT_STATE documented (apps/api/.env.example:40-42), delivered by deploy (printf + envs list) and read by compose (:111). |
| SECRET-P1-002 | P1 | Deploy pipeline does not write several secret-class env vars the API schema and compose reference | verified-fixed | re-verified at 6b7aa1a: deploy-do printf block (:759-816) writes every secret-class key incl. TURNSTILE/METRICS/VAPID/MALWARE/ALERTMANAGER/M365_CLIENT_STATE; the envs list forwards them; scripts/check-env-parity.mjs (wired unit-tests action.yml:99-100) runs clean. |
| SECRET-P1-003 | P1 | Rotation and emergency procedures target the wrong GitHub environment for the prod deploy and backup workflows | verified-fixed | re-verified at 6b7aa1a: SECRETS_ROTATION.md consuming-environment table (:28-37) + standard/emergency procedures target prod-approval for prod mutations, dev for backups, prod only for read-only plan/resolve jobs (:329-357, :374-383). (Previously partially-fixed.) |
| SECRET-P2-001 | P2 | Secret rotation inventory and GitHub matrix lag the schema/compose; seven keys uncovered | partially-fixed | at 6b7aa1a the GitHub matrix covers the compose keys, but the rotation inventory (docs/SECRETS_ROTATION.md, 60 rows) still omits secret-class REDIS_PASSWORD, VAPID_PRIVATE_KEY and MALWARE_SCANNER_API_KEY (grep: absent from SECRETS_ROTATION.md and SECRET_ROTATION_RUNBOOK.md). |
| SECRET-P2-002 | P2 | Rotation reminder workflow referenced in docs does not exist; rotation log shows no real rotation | partially-fixed | at 6b7aa1a secret-rotation-reminder.yml exists (quarterly deduplicated issue); the Rotation Log still holds only the initial-deployment row and the 2026-10-12 dry-run (docs/SECRETS_ROTATION.md:500-505) - no real rotation has been recorded. |
| SECRET-P2-003 | P2 | Secret scanning is diff-scoped only; no full-history scan artifact | verified-fixed | re-verified at 6b7aa1a: secret-history-scan.yml (full-history gitleaks 8.30.1 checksum-verified, artifact, loud failure notifier). |
| SECRET-P2-004 | P2 | Produced Terraform `prod.tfvars` is tracked despite `.gitignore` intending to exclude it | verified-fixed | re-verified at 6b7aa1a: only env/*.tfvars.example tracked; ignore rules cover env/ and module-root tfvars (.gitignore:58,63). |
| SECRET-P2-005 | P2 | Workflow-scope PAT SCHEDULE_DISPATCH_TOKEN omitted from secret inventory and rotation policy | verified-fixed | re-verified at 6b7aa1a: SCHEDULE_DISPATCH_TOKEN is documented as retired (docs/GITHUB_SECRETS_AND_VARIABLES_MATRIX.md:160-162; docs/SECRETS_ROTATION.md:98) and backup-staleness-check.yml:52 uses only secrets.GITHUB_TOKEN; the backup-dispatch workflow no longer exists. |
| SECRET-P2-006 | P2 | Secrets rotation is documented but has no exercised evidence | partially-fixed | at 6b7aa1a the dated desk dry-run and quarterly reminder exist, but no live rotation/revocation drill has been exercised; the document itself says a dry-run does not close this row (docs/SECRETS_ROTATION.md:422-432). |
| SECRET-P2-007 | P2 | Incident response points at a secret-rotation runbook that is not in docs/ | verified-fixed | re-verified at 6b7aa1a: docs/SECRET_ROTATION_RUNBOOK.md exists and is referenced from INCIDENT_RESPONSE.md:74,136 and SECRETS_ROTATION.md. |
| SECRET-P2-008 | P2 | Terraform plan artifacts carry sensitive variable values off the runner | verified-fixed | re-verified at 6b7aa1a: no binary plan artifact - only sanitized text (terraform-do.yml:137-158); apply jobs re-plan in-job with TF_VAR_* env (:225-249, :290-313). |
| SECRET-P2-009 | P2 | JWT rotation runbook rotates the API verification copy, not the Supabase signing secret, and references a nonexistent JWT_EXPIRY | verified-fixed | re-verified at 6b7aa1a: docs/JWT_ROTATION.md rotates the Supabase signing secret first with the API verification copy as a zero-downtime list (SECRETS_ROTATION.md:220-240, :374-380); no JWT_EXPIRY reference. |
| SECRET-P3-001 | P3 | Worker `.env.example` omits `APP_BASE_URL` | verified-fixed | re-verified at 6b7aa1a: apps/worker/.env.example:56 sets APP_BASE_URL. |
| SECRET-P3-002 | P3 | Web runtime validator can silently fall back to a localhost API URL | verified-fixed | re-verified at 6b7aa1a: apps/web/Dockerfile:28-30 fails the build when NEXT_PUBLIC_API_URL is absent, and apps/web/lib/env.ts:87-92 throws in production instead of falling back to localhost; the deploy path still passes it. |
| SECRET-P3-003 | P3 | No IT-level break-glass / emergency credential revocation runbook, and no revocation drill evidence | verified-fixed | re-verified at 6b7aa1a: docs/SECRET_ROTATION_RUNBOOK.md covers per-credential revocation points, break-glass paths, escrow and a drill record (desk dry-run 2026-10-12); the live drill remains listed as operator-gated in the record. |
| SECRET-P3-004 | P3 | Secret rotation policy has no evidence any secret was ever rotated | verified-fixed | re-verified at 6b7aa1a: the policy now records the honest evidence state (SECRETS_ROTATION.md:421-431) + a dated dry-run row + automated quarterly reminder; no production rotation has occurred (operator action, tracked by SECRET-P2-006). |
| SECRET-P3-005 | P3 | No automated `.env.example` <-> runtime schema <-> docs parity check | verified-fixed | re-verified at 6b7aa1a: scripts/check-env-parity.mjs --self-test + run wired in unit-tests action.yml:76-84; runs clean locally ('environment parity OK'). |
| SECRET-P2-010 | P2 | NEW: rotation environment table omits the prod backup targets (prod-approval/prod-backup) | open | NEW at 6b7aa1a: docs/SECRETS_ROTATION.md:33 still says the backup/restore/staleness workflows are '— (dev only)' and attach only dev; since DR-P2-009 they attach prod-approval for a prod dispatch and prod-backup for a scheduled prod run (db-backup.yml:48, db-restore-test.yml:45, storage-backup.yml:51, storage-restore-test.yml:54). Following the rotation table would set/rotate prod backup secrets on dev, a silent no-op; the matrix already documents prod-backup (docs/GITHUB_SECRETS_AND_VARIABLES_MATRIX.md:202-204). |

## New Findings Detail

### SECRET-P2-010 — NEW: rotation environment table omits the prod backup targets (prod-approval/prod-backup) (P2, open)

- **Evidence:** NEW at 6b7aa1a: docs/SECRETS_ROTATION.md:33 still says the backup/restore/staleness workflows are '— (dev only)' and attach only dev; since DR-P2-009 they attach prod-approval for a prod dispatch and prod-backup for a scheduled prod run (db-backup.yml:48, db-restore-test.yml:45, storage-backup.yml:51, storage-restore-test.yml:54). Following the rotation table would set/rotate prod backup secrets on dev, a silent no-op; the matrix already documents prod-backup (docs/GITHUB_SECRETS_AND_VARIABLES_MATRIX.md:202-204).
- **Owner:** platform/security · **Target:** this month

## Risks

| Risk | Severity | Evidence | Mitigation |
|---|---|---|---|
| Secret rotation inventory and GitHub matrix lag the schema/compose; seven keys uncovered | P2 | SECRET-P2-001 | Fix/verify per the finding |
| Rotation reminder workflow referenced in docs does not exist; rotation log shows no real rotation | P2 | SECRET-P2-002 | Fix/verify per the finding |
| Secrets rotation is documented but has no exercised evidence | P2 | SECRET-P2-006 | Fix/verify per the finding |
| NEW: rotation environment table omits the prod backup targets (prod-approval/prod-backup) | P2 | SECRET-P2-010 | Fix/verify per the finding |

## Recommendations

- **Immediate:** fix the rotation consuming-environment table for prod backup dispatch/schedule (SECRET-P2-010); add the three missing secret classes to the inventory (SECRET-P2-001).
- **This month:** run and record one real rotation/revocation in dev (SECRET-P2-002/006).
- **This quarter:** keep the quarterly dry-run/reminder and add the prod-backup rows to the matrix (already partly done in the matrix).

## Open Questions

| Question | Why it matters | Evidence needed |
|---|---|---|
| Are the prod-backup secrets provisioned? | A scheduled prod backup will fail without them | GitHub environment secret list (admin) |
| Which real secret will be rotated first? | The log has no live rotation evidence | Operator drill record |

## Appendix

Repository files were read at `6b7aa1a`; live state was read from `api.github.com` for `MaineCyberTech/mainecybertech` (public). Local executions: `check-required-checks.mjs`, `check-docs-links.mjs`, `check-env-parity.mjs`, `test-secret-patterns.mjs`, `check-branch-protection-audit.sh`, `check-supply-chain-gates.mjs` (Node 18 environment note: scripts using `import.meta.dirname` fail locally on Node 18; CI uses Node 20.x), `validate-sbom.mjs` custom-path fixture, `promtool check/test rules` in the digest-pinned Prometheus image, and a Trivy scan of the pinned node-exporter digest with and without `.trivyignore`.
