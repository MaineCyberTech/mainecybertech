# Patch Plan — repo-deep-dive run `20261002-0344-develop-6286137`

Implementation-ready patch sets derived from `risk_register.md` (269 findings). Companion to `roadmap.md` and the narrative synthesis in `22_final_risk_register_roadmap.md`.

- Repository: `C:/temp/mainecybertech`
- Branch: `develop` · Commit: `62861370`
- Generated: 2026-10-02
- Area code: `FINAL`

## Grouping rules applied

1. **Every finding lands in exactly one patch set.** The mapping table below covers all 269 IDs; `risk_register.md` cluster labels are annotations only and never move a finding.
2. **The P0-only immediate set carries no dependencies.** `PS-001` contains only the two backup P0s; `PS-002` contains only the three IR P0s. Neither depends on any other set.
3. **Any fix spanning 3+ files gets its own patch set** even when small (e.g. `PS-006` deploy workflow + env schema + docs; `PS-008` Prometheus rules + compose + receiver; `PS-015` tags + SBOM script + changelog + template + workflow).
4. **Inter-set dependencies are explicit.**
5. **Contradictory recommendations resolved into one plan** (e.g. backup-location naming → one canonical contract).

Effort: `S` ≤ 0.5 day · `M` 1–3 days · `L` > 3 days (one maintainer).

## P0-only immediate set (no dependencies)

### PS-001 — Backup workflows reachable and restore test that can fail

- **Findings:** `DR-P0-001`, `DR-P0-002`
- **Files:** `.github/workflows/db-backup.yml`, `.github/workflows/db-restore-test.yml`, `scripts/backup-database.sh`, `scripts/backup-database.ps1`, `scripts/restore-database.sh`, `docs/CI.md`, `docs/RELEASING.md`
- **Dependencies:** none.
- **Effort:** S–M
- **Verification command:** `git ls-tree main --name-only .github/workflows/ | grep -E 'db-backup|db-restore-test'` (both present); then upload a truncated dump to a scratch bucket and confirm the restore-test job **fails**; restore a good dump and confirm all assertions pass.

### PS-002 — Incident-response and breach-response processes

- **Findings:** `IR-P0-001`, `IR-P0-002`
- **Files:** new `docs/INCIDENT_RESPONSE.md`, new `docs/DATA_BREACH_RESPONSE.md`, new `docs/templates/POSTMORTEM.md`, `docs/INDEX.md`, `SECURITY.md`
- **Dependencies:** none.
- **Effort:** M
- **Verification command:** `test -f docs/INCIDENT_RESPONSE.md && test -f docs/DATA_BREACH_RESPONSE.md && test -f docs/templates/POSTMORTEM.md`; then a timed tabletop using only `INCIDENT_RESPONSE.md`.

## Security and authorization sets

### PS-003 — Onboarding/authorization guard wiring (merged cluster C-01)

- **Findings:** `ACM-P1-001`, `SEC-P2-001`, `API-P2-001`, `CHAIN-P2-003`
- **Files:** `apps/api/src/routes/client-onboarding-command-center.ts`, `apps/api/src/routes/governance.ts`, `apps/api/src/__tests__/client-onboarding-command-center.test.ts`
- **Dependencies:** none (catalog keys exist in migration `5302118`).
- **Effort:** S
- **Verification command:** `pnpm --filter @mct/api test -- client-onboarding middleware-permissions` (403 assertions).

### PS-004 — Password-reset redirect hardening (cluster C-14)

- **Findings:** `CHAIN-P1-002`, `SEC-P2-003`
- **Files:** `apps/api/src/routes/auth.ts`
- **Dependencies:** none blocking; confirm Supabase redirect URLs (open question).
- **Effort:** S
- **Verification command:** API test with `Origin: https://evil.example` ⇒ `redirectTo` starts with `APP_BASE_URL`.

### PS-005 — Worker resilience

- **Findings:** `NOTIF-P2-003`, `RES-P2-001`, `RES-P2-004`, `RES-P2-002`, `RES-P2-003`, `RES-P3-001`, `RES-P3-002`, `RES-P3-003`, `RES-P3-005`
- **Files:** `apps/worker/src/main.ts`, `consumer-bullmq.ts`, `env.ts`, `health-server.ts`, `tasks/webhook-dispatcher.ts`, `apps/api/src/routes/public.ts`, `routes/auth.ts`, `docker-compose.yml`, `AGENTS.md`
- **Dependencies:** none.
- **Effort:** M
- **Verification command:** `pnpm --filter @mct/worker test` (rejection, hung-fetch, force-exit tests).

### PS-006 — Secret delivery truth + inventory (spans deploy workflow + env schema + docs)

- **Findings:** `SECRET-P1-001`, `WH-P1-002`, `SECRET-P1-002`, `INFRA-P2-006`, `SECRET-P2-001`, `SECRET-P2-002`, `SECRET-P2-003`, `SECRET-P2-004`, `INFRA-P3-008`, `SECRET-P3-001`, `SECRET-P3-002`, `SECRET-P3-003`, `WH-P2-001`
- **Files:** `.github/workflows/deploy-do.yml`, `apps/api/src/config/env.ts`, `apps/worker/.env.example`, `docs/GITHUB_SECRETS_AND_VARIABLES_MATRIX.md`, `docs/SECRETS_ROTATION.md`, `infra/terraform/env/prod.tfvars`, `.gitignore`
- **Dependencies:** none.
- **Effort:** M
- **Verification command:** `pnpm --filter @mct/api test -- env`; staging deploy asserts every schema-referenced var present; M365 test webhook 2xx.

### PS-007 — Fatal worker deploy gate

- **Findings:** `IR-P1-003`, `CTR-P2-004`, `RES-P3-004`
- **Files:** `.github/workflows/deploy-do.yml`, `apps/worker/src/health-server.ts`
- **Dependencies:** none.
- **Effort:** S
- **Verification command:** Deploy with worker broken → pipeline fails.

## Observability and monitoring sets

### PS-008 — Alert delivery / dead-man's switch (spans rules + compose + new receiver)

- **Findings:** `IR-P0-003`, `INFRA-P2-003`, `RES-P2-005`, `CHAIN-P2-010`, `IR-P1-006`, `IR-P2-001`, `IR-P2-002`, `IR-P2-003`, `IR-P2-004`, `DR-P2-001`, `DR-P2-005`, `WH-P2-003`, `BILL-P2-003`
- **Files:** `infra/digitalocean/prometheus.rules.yml`, `infra/digitalocean/docker-compose.yml`, `docker-compose.yml`, `apps/worker/src/health-server.ts`, `docs/MONITORING_AND_ALERTING.md`
- **Dependencies:** PS-005 (worker health) and PS-010 (backup heartbeat) for depth alerts.
- **Effort:** M
- **Verification command:** Stop Prometheus/Alertmanager → external receiver fires within N minutes.

## Backup, DR, and migration sets

### PS-010 — Backup security, drill evidence, and migration rollback

- **Findings:** `DR-P1-001`, `DR-P1-002`, `DR-P1-003`, `DR-P1-004`, `DR-P1-005`, `DR-P1-006`, `IR-P1-001`, `IR-P1-002`, `IR-P1-004`, `IR-P1-005`, `DR-P2-002`, `DR-P2-003`, `DR-P2-004`, `IR-P2-006`, `IR-P3-001`, `IR-P3-002`, `DR-P3-001`, `DR-P3-002`, `DR-P3-003`, `DATA-P1-002`, `DATA-P1-003`, `DATA-P2-002`, `DATA-P2-003`, `DATA-P2-004`, `DATA-P2-005`, `DATA-P2-006`, `DATA-P3-001`, `DATA-P3-002`, `CHAIN-P2-006`, `RES-P2-006`, `FILE-P2-004`, `INFRA-P3-009`, `INFRA-P3-010`
- **Files:** `.github/workflows/db-backup.yml`, `.github/workflows/db-restore-test.yml`, `.github/workflows/supabase-migrations.yml`, `scripts/backup-database.sh`, `scripts/backup-database.ps1`, `scripts/restore-database.sh`, `apps/worker/src/tasks/retention.ts`, `apps/worker/src/tasks/orphan-cleanup.ts`, `supabase/migrations/5302108_fix_audit_logs_cascade.sql`, `docs/RTO_RPO.md`, `docs/ROLLBACK_PROCEDURES.md`, `docs/runbooks/backup-disaster-recovery.md`, `docs/FINAL_DEPLOYMENT_OPERATIONS_HANDBOOK.md`, `backup_restore_drill_plan.md`
- **Dependencies:** PS-001 (restore test must exist); PS-008 for the failure-alert delivery half.
- **Effort:** L
- **Verification command:** `bash scripts/backup-database.sh` to a scratch bucket (assert SSE/KMS + second-region copy); drills D1–D5 recorded; truncated-dump negative test fails.

## CI/CD, infra, and supply-chain sets

### PS-011 — Webhook idempotency, notifications, billing enforcement, supply chain

- **Findings:** `WH-P1-001`, `API-P2-002`, `API-P2-004`, `API-P2-005`, `API-P3-001`, `API-P3-002`, `API-P3-003`, `NOTIF-P1-001`, `NOTIF-P1-002`, `NOTIF-P1-003`, `NOTIF-P2-001`, `NOTIF-P2-002`, `NOTIF-P2-004`, `NOTIF-P2-005`, `NOTIF-P2-006`, `NOTIF-P3-001`, `NOTIF-P3-002`, `NOTIF-P3-003`, `BILL-P1-001`, `BILL-P1-002`, `BILL-P1-003`, `BILL-P2-001`, `BILL-P2-002`, `BILL-P3-001`, `BILL-P3-002`, `SBOM-P1-001`, `SBOM-P1-002`, `SBOM-P2-001`, `SBOM-P2-002`, `SBOM-P2-003`, `SC-P1-001`, `SC-P2-001`, `SC-P2-002`, `SC-P2-003`, `SC-P2-004`, `SC-P2-005`, `SC-P3-001`, `SC-P3-002`, `SC-P3-003`, `CTR-P1-001`, `CTR-P1-002`, `CTR-P1-003`, `CTR-P2-001`, `CTR-P2-005`, `WH-P2-002`, `WH-P2-004`, `WH-P2-006`, `WH-P3-001`, `WH-P3-002`
- **Files:** `apps/worker/src/tasks/webhook-dispatcher.ts`, `jsm-sync.ts`, `stripe-reconcile.ts`, `apps/api/src/routes/webhooks.ts`, `lib/http-client.ts`, `routes/billing.ts`, `services/notifications*.ts`, `.github/workflows/sbom.yml`, `.github/workflows/test.yml`, `package.json`, `Dockerfile*`
- **Dependencies:** none hard.
- **Effort:** L
- **Verification command:** `pnpm test`; CI image-SBOM/scan/license-gate run.

### PS-012 — Branch protection, production gate, and CI governance

- **Findings:** `BP-P1-001`, `BP-P1-002`, `BP-P1-003`, `CI-P1-001`, `CI-P1-002`, `CHAIN-P1-008`, `REL-P1-002`, `BP-P2-001`, `BP-P2-002`, `BP-P2-003`, `BP-P2-004`, `BP-P3-001`, `BP-P3-002`, `CI-P2-003`, `CI-P2-004`, `CI-P3-005`, `CI-P3-006`, `CI-P3-007`, `CI-P3-008`, `CI-P3-009`, `CI-P3-010`
- **Files:** `.github/branch-protection/main.json`, `.github/branch-protection/develop.json`, `.github/workflows/deploy-do.yml`, `terraform-do.yml`, `test.yml`, `.github/CODEOWNERS`, `.github/dependabot.yml`, `docs/RELEASING.md`, `docs/ROLLBACK_PROCEDURES.md`
- **Dependencies:** GitHub repo admin; environment-name decision.
- **Effort:** M
- **Verification command:** dispatch prod deploy → pauses; admin failing-check PR blocked; `gh api .../branches/main/protection` shows `enforce_admins=true`.

### PS-013 — Infrastructure exposure and drift

- **Findings:** `INFRA-P1-001`, `INFRA-P1-002`, `INFRA-P2-004`, `INFRA-P2-005`, `INFRA-P2-007`, `CHAIN-P2-007`, `CHAIN-P2-009`, `CTR-P2-002`, `CTR-P2-003`, `CTR-P3-001`, `CTR-P3-002`, `INFRA-P3-011`, `INFRA-P3-012`
- **Files:** `infra/terraform/digitalocean/variables.tf`, `firewall.tf`, `providers.tf`, `.github/workflows/terraform-do.yml`, `scripts/install-terraform.ps1`, `infra/digitalocean/docker-compose.yml`, `docker-compose.yml`, `infra/terraform/README.md`
- **Dependencies:** `admin_ip_ranges` secret; DO token rotation.
- **Effort:** M
- **Verification command:** SSH from non-allowed IP times out; `terraform validate` passes; `docker inspect` shows no Redis password on argv.

### PS-015 — Release identity, changelog, and release notes (spans tags + SBOM script + docs + workflow)

- **Findings:** `REL-P1-001`, `REL-P2-001`, `REL-P2-002`, `REL-P2-003`, `REL-P2-004`, `REL-P3-001`, `REL-P3-002`
- **Files:** `scripts/generate-sbom.mjs`, `.github/workflows/sbom.yml`, new `.github/workflows/release.yml`, `CHANGELOG.md`, `docs/RELEASING.md`, `docs/ROLLBACK_PROCEDURES.md`, new `templates/RELEASE_NOTES_TEMPLATE.md`, `.github/PULL_REQUEST_TEMPLATE.md`, `package.json`
- **Dependencies:** release/tag decision; GHCR/GitHub Release permissions. `REL-P2-004` also touches `docs/ROLLBACK_PROCEDURES.md` which PS-012 edits — sequence PS-012 before PS-015 to avoid a doc conflict.
- **Effort:** M
- **Verification command:** `git tag` non-empty after promotion; SBOM contains a 40-hex SHA + `serialNumber`; `gh release view <tag>` lists the SBOM; a dry-run release body fills every section.

## Documentation and cleanup set

### PS-014 — Docs truth, admin/console guardrails, file security, low-severity cleanup

- **Findings:** `AI-P1-001`, `AI-P1-002`, `AI-P2-001`, `AI-P2-002`, `AI-P2-003`, `AI-P3-001`, `AI-P3-002`, `AI-P3-003`, `TEST-P2-001`, `TEST-P2-002`, `TEST-P2-003`, `TEST-P2-004`, `TEST-P3-001`, `TEST-P3-002`, `TEST-P3-003`, `FILE-P1-001`, `FILE-P1-002`, `FILE-P1-003`, `FILE-P2-001`, `FILE-P2-003`, `FILE-P2-005`, `FILE-P3-001`, `FILE-P3-002`, `FILE-P3-003`, `DATA-P2-003`, `IR-P2-005`, `SEARCH-P3-001`, `SEARCH-P3-002`, `ACM-P3-003`, `ACM-P3-005`
- **Files:** `AGENTS.md`, `README.md`, `docs/INDEX.md`, `docs/CI.md`, new `docs/documents-upload.md`, `apps/api/src/routes/files*.ts`, `documents.ts`, `apps/api/src/routes/admin*.ts`, `apps/web/...`
- **Dependencies:** none (benefits from PS-009).
- **Effort:** M
- **Verification command:** `pnpm test` + doc-consistency script; a11y gate width matches docs.

## Patch-set dependency graph

```
PS-001  (P0 backups)  ──► PS-010  (backup security/drills)
PS-002  (P0 IR docs)  ──► (references PS-006 rotation runbook; no block)
PS-005  (worker resilience) ──► PS-008 (worker alerts)
PS-009  (authz/RLS)   ──► PS-014 (UI-only rows)
PS-012  (branch/prod) ──► PS-015 (ROLLBACK_PROCEDURES.md doc edit)
PS-003, PS-004, PS-006, PS-007, PS-011, PS-013  (independent)
```

## Patch-set mapping table

| Patch set | Findings | Files (representative) | Dependencies | Effort | Verification command |
|---|---|---|---|---|---|
| PS-001 | DR-P0-001, DR-P0-002, CI-P2-002 | `.github/workflows/db-backup.yml`, `db-restore-test.yml`, `scripts/backup-database.*`, `restore-database.sh`, `docs/CI.md` | none | S–M | `git ls-tree main .github/workflows \| grep db-backup`; truncated-dump negative test |
| PS-002 | IR-P0-001, IR-P0-002 | `docs/INCIDENT_RESPONSE.md`, `docs/DATA_BREACH_RESPONSE.md`, `docs/templates/POSTMORTEM.md`, `docs/INDEX.md`, `SECURITY.md` | none | M | `test -f docs/INCIDENT_RESPONSE.md` + timed tabletop |
| PS-003 | ACM-P1-001, SEC-P2-001, API-P2-001, CHAIN-P2-003 | `routes/client-onboarding-command-center.ts`, `routes/governance.ts`, onboarding test | none | S | `pnpm --filter @mct/api test -- client-onboarding` |
| PS-004 | CHAIN-P1-002, SEC-P2-003 | `apps/api/src/routes/auth.ts` | none | S | `Origin`-spoof API test |
| PS-005 | NOTIF-P2-003, RES-P2-001, RES-P2-002, RES-P2-003, RES-P2-004, RES-P3-001, RES-P3-002, RES-P3-003, RES-P3-005 | `apps/worker/src/main.ts`, `consumer-bullmq.ts`, `env.ts`, `health-server.ts`, `tasks/webhook-dispatcher.ts`, `apps/api/src/routes/public.ts`, `routes/auth.ts`, `docker-compose.yml` | none | M | `pnpm --filter @mct/worker test` |
| PS-006 | SECRET-P1-001, SECRET-P1-002, SECRET-P2-001, SECRET-P2-002, SECRET-P2-003, SECRET-P2-004, SECRET-P3-001, SECRET-P3-002, SECRET-P3-003, INFRA-P2-006, INFRA-P3-008, WH-P1-002, WH-P2-001 | `.github/workflows/deploy-do.yml`, `apps/api/src/config/env.ts`, `apps/worker/.env.example`, `docs/GITHUB_SECRETS_AND_VARIABLES_MATRIX.md`, `infra/terraform/env/prod.tfvars`, `.gitignore` | none | M | staging deploy asserts all schema vars; M365 2xx |
| PS-007 | IR-P1-003, CTR-P2-004, RES-P3-004 | `.github/workflows/deploy-do.yml`, `apps/worker/src/health-server.ts` | none | S | broken-worker deploy fails |
| PS-008 | IR-P0-003, INFRA-P2-003, RES-P2-005, CHAIN-P2-010, IR-P1-006, IR-P2-001, IR-P2-002, IR-P2-003, IR-P2-004, DR-P2-001, DR-P2-005, WH-P2-003, BILL-P2-003 | `infra/digitalocean/prometheus.rules.yml`, `infra/digitalocean/docker-compose.yml`, `docker-compose.yml`, `apps/worker/src/health-server.ts` | PS-005; PS-010 | M | stop monitoring → external receiver fires |
| PS-009 | ACM-P2-002, ACM-P2-003, ACM-P2-004, ACM-P2-005, ACM-P2-006, ACM-P2-007, ACM-P2-008, ACM-P3-001, ACM-P3-002, ACM-P3-004, ADMIN-P1-001, ADMIN-P1-002, ADMIN-P2-001, ADMIN-P2-002, ADMIN-P2-003, ADMIN-P2-004, ADMIN-P2-005, ADMIN-P2-006, ADMIN-P3-001, ADMIN-P3-002, ADMIN-P3-003, ADMIN-P3-004, API-P2-003, CHAIN-P1-001, CHAIN-P2-004, CHAIN-P2-005, DATA-P1-001, DATA-P2-001, MT-P1-001, MT-P1-002, MT-P1-003, MT-P2-001, MT-P2-002, MT-P2-003, MT-P2-004, MT-P2-005, MT-P2-006, MT-P3-001, RLS-P2-001, RLS-P2-002, RLS-P2-003, RLS-P3-001, RLS-P3-002, RLS-P3-003, RLS-P3-004, SEC-P2-002, SEC-P2-004, SEC-P2-005, SEC-P3-001, SEC-P3-002, SEC-P3-003, SEC-P3-004, SEARCH-P1-001, SEARCH-P1-002, SEARCH-P2-001, SEARCH-P2-002, SEARCH-P2-003, SEARCH-P2-004, SEARCH-P2-005, SEARCH-P2-006, SEARCH-P2-007, WH-P2-005, FILE-P2-002, FILE-P2-006 | `lib/roles.ts`, `lib/permissions.ts`, `middleware/org-access.ts`, `services/supabase.ts`, `routes/audit.ts`, `routes/admin*.ts`, `routes/search*.ts`, `routes/profiles.ts`, `supabase/migrations/*` | MSP operating-model decision | L | `pnpm --filter @mct/api test` + `node scripts/verify-rls.mjs` |
| PS-010 | DR-P1-001, DR-P1-002, DR-P1-003, DR-P1-004, DR-P1-005, DR-P1-006, DR-P2-002, DR-P2-003, DR-P2-004, DR-P3-001, DR-P3-002, DR-P3-003, IR-P1-001, IR-P1-002, IR-P1-004, IR-P1-005, IR-P2-006, IR-P3-001, IR-P3-002, DATA-P1-002, DATA-P1-003, DATA-P2-002, DATA-P2-003, DATA-P2-004, DATA-P2-005, DATA-P2-006, DATA-P3-001, DATA-P3-002, CHAIN-P2-006, RES-P2-006, FILE-P2-004, INFRA-P3-009, INFRA-P3-010 | `.github/workflows/db-*.yml`, `supabase-migrations.yml`, `scripts/*.sh`, `apps/worker/src/tasks/retention.ts`, `orphan-cleanup.ts`, `docs/RTO_RPO.md`, `docs/ROLLBACK_PROCEDURES.md`, `backup_restore_drill_plan.md` | PS-001; PS-008 | L | drills D1–D5 with evidence; truncated-dump negative test |
| PS-011 | WH-P1-001, WH-P2-002, WH-P2-004, WH-P2-006, WH-P3-001, WH-P3-002, API-P2-002, API-P2-004, API-P2-005, API-P3-001, API-P3-002, API-P3-003, NOTIF-P1-001, NOTIF-P1-002, NOTIF-P1-003, NOTIF-P2-001, NOTIF-P2-002, NOTIF-P2-004, NOTIF-P2-005, NOTIF-P2-006, NOTIF-P3-001, NOTIF-P3-002, NOTIF-P3-003, BILL-P1-001, BILL-P1-002, BILL-P1-003, BILL-P2-001, BILL-P2-002, BILL-P2-004, BILL-P2-005, BILL-P3-001, BILL-P3-002, SBOM-P1-001, SBOM-P1-002, SBOM-P2-001, SBOM-P2-002, SBOM-P2-003, SBOM-P3-001, SBOM-P3-002, SC-P1-001, SC-P2-001, SC-P2-002, SC-P2-003, SC-P2-004, SC-P2-005, SC-P3-001, SC-P3-002, SC-P3-003, CTR-P1-001, CTR-P1-002, CTR-P1-003, CTR-P2-001, CTR-P2-005 | `tasks/webhook-dispatcher.ts`, `jsm-sync.ts`, `stripe-reconcile.ts`, `routes/webhooks.ts`, `lib/http-client.ts`, `routes/billing.ts`, `services/notifications*.ts`, `.github/workflows/sbom.yml`, `package.json` | none hard | L | `pnpm test` + CI image-SBOM/scan/license-gate |
| PS-012 | BP-P1-001, BP-P1-002, BP-P1-003, BP-P2-001, BP-P2-002, BP-P2-003, BP-P2-004, BP-P3-001, BP-P3-002, CI-P1-001, CI-P1-002, CI-P2-003, CI-P2-004, CI-P3-005, CI-P3-006, CI-P3-007, CI-P3-008, CI-P3-009, CI-P3-010, CHAIN-P1-008, REL-P1-002 | `.github/branch-protection/*.json`, `.github/workflows/deploy-do.yml`, `terraform-do.yml`, `test.yml`, `.github/CODEOWNERS`, `.github/dependabot.yml`, `docs/RELEASING.md`, `docs/ROLLBACK_PROCEDURES.md` | GitHub repo admin | M | prod dispatch pauses; admin bypass blocked; protection API shows `enforce_admins=true` |
| PS-013 | INFRA-P1-001, INFRA-P1-002, INFRA-P2-004, INFRA-P2-005, INFRA-P2-007, INFRA-P3-011, INFRA-P3-012, CHAIN-P2-007, CHAIN-P2-009, CTR-P2-002, CTR-P2-003, CTR-P3-001, CTR-P3-002 | `infra/terraform/digitalocean/variables.tf`, `firewall.tf`, `providers.tf`, `.github/workflows/terraform-do.yml`, `scripts/install-terraform.ps1`, `docker-compose.yml` | `admin_ip_ranges` secret; DO token rotation | M | SSH non-allowed IP times out; `terraform validate` passes |
| PS-014 | AI-P1-001, AI-P1-002, AI-P2-001, AI-P2-002, AI-P2-003, AI-P3-001, AI-P3-002, AI-P3-003, TEST-P2-001, TEST-P2-002, TEST-P2-003, TEST-P2-004, TEST-P3-001, TEST-P3-002, TEST-P3-003, FILE-P1-001, FILE-P1-002, FILE-P1-003, FILE-P2-001, FILE-P2-003, FILE-P2-005, FILE-P3-001, FILE-P3-002, FILE-P3-003, IR-P2-005, SEARCH-P3-001, SEARCH-P3-002, ACM-P3-003, ACM-P3-005 | `AGENTS.md`, `README.md`, `docs/INDEX.md`, `docs/CI.md`, `apps/api/src/routes/files*.ts`, `documents.ts`, `apps/web/...` | none (benefits from PS-009) | M | `pnpm test` + doc-consistency script |
| PS-015 | REL-P1-001, REL-P2-001, REL-P2-002, REL-P2-003, REL-P2-004, REL-P3-001, REL-P3-002 | `scripts/generate-sbom.mjs`, `.github/workflows/sbom.yml`, new `.github/workflows/release.yml`, `CHANGELOG.md`, `docs/RELEASING.md`, `docs/ROLLBACK_PROCEDURES.md`, `templates/RELEASE_NOTES_TEMPLATE.md`, `.github/PULL_REQUEST_TEMPLATE.md` | release/tag decision; PS-012 (doc sequence) | M | `git tag` non-empty; SBOM has 40-hex SHA; `gh release view` lists SBOM |

## Finding-to-patch-set totals (reconciliation)

| Patch set | Findings | Severity mix |
|---|---:|---|
| PS-001 | 3 | P0 ×2, P2 ×1 |
| PS-002 | 2 | P0 ×2 |
| PS-003 | 4 | P1 ×1, P2 ×3 |
| PS-004 | 2 | P1 ×1, P2 ×1 |
| PS-005 | 9 | P2 ×5, P3 ×4 |
| PS-006 | 13 | P1 ×3, P2 ×6, P3 ×4 |
| PS-007 | 3 | P1 ×1, P2 ×1, P3 ×1 |
| PS-008 | 13 | P0 ×1, P1 ×1, P2 ×11 |
| PS-009 | 64 | P1 ×9, P2 ×39, P3 ×16 |
| PS-010 | 33 | P1 ×12, P2 ×12, P3 ×9 |
| PS-011 | 53 | P1 ×13, P2 ×25, P3 ×15 |
| PS-012 | 21 | P1 ×7, P2 ×6, P3 ×8 |
| PS-013 | 13 | P1 ×2, P2 ×7, P3 ×4 |
| PS-014 | 29 | P1 ×5, P2 ×11, P3 ×13 |
| PS-015 | 7 | P1 ×1, P2 ×4, P3 ×2 |
| **Total** | **269** | **P0 ×5, P1 ×56, P2 ×132, P3 ×76** |

## Definition of done (patch-plan level)

- [ ] Every patch set has a green verification command recorded in the run folder.
- [ ] PS-001 and PS-002 (P0-only, no dependencies) merged first.
- [ ] No finding appears in more than one patch set; the totals table reconciles to 269.
- [ ] Each patch set PR is small enough for a single reviewer; sets touching 3+ files are reviewed by the named owner.
- [ ] Inter-set dependencies observed (PS-001→PS-010, PS-005→PS-008, PS-009→PS-014, PS-012→PS-015).
