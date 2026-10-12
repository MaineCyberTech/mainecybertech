# Scripts

> Automation helpers for the MCT Portal monorepo. Last updated 2026-08-01.

## Which platform?

| Script | Windows (PowerShell) | Linux/macOS (bash) |
| ------ | -------------------- | ------------------ |
| Local stack start | `start-local-stack.ps1` | `start-local-stack.sh` |
| Local stack teardown | `teardown-local-stack.ps1` | `teardown-local-stack.sh` |
| Local stack test | `test-local-stack.ps1` | `test-local-seeds.sh` |
| Dev reset & verify | `local_dev_reset_and_verify.automated.v2.ps1` | `local_dev_reset_and_verify.automated.v2.sh` |
| Secret scan | `scan-secrets.ps1` | `scan-secrets.sh` |
| Database backup | `backup-database.ps1` | `backup-database.sh` |
| Database restore | — | `restore-database.sh` |
| Storage backup | — | `backup-storage.sh` |
| Storage restore | — | `restore-storage.sh` |

## Script index

| Script | Purpose |
| ------ | ------- |
| `start-local-stack.ps1` / `.sh` | Start Supabase, API, and web app locally with seeded test users. |
| `teardown-local-stack.ps1` / `.sh` | Stop all local stack services. |
| `test-local-stack.ps1` | Full local stack test with seed data (Windows). |
| `test-local-seeds.sh` | Full local stack test with seed data (Linux/macOS). |
| `local_dev_reset_and_verify.automated.v2.ps1` / `.sh` | Reset local dev environment and verify it works end-to-end. |
| `sync_supabase_env.auto.v2.ps1` | Sync local Supabase env values (URL, keys) into app `.env.local` files. |
| `start_project_with_supabase_env.ps1` | Start the project after ensuring Supabase env values are present. |
| `scan-secrets.ps1` / `.sh` | Scan the repo for accidentally committed secrets. |
| `backup-database.ps1` / `.sh` | Back up the Supabase/database data. |
| `restore-database.sh` | Restore a database backup (Linux/macOS). |
| `backup-storage.sh` | Mirror Supabase Storage buckets (`documents`/`avatars`/`logos`) to S3/Spaces. |
| `record-backup-heartbeat.sh` | Record the platform backup heartbeat (`platform_backup_heartbeats`) after a successful backup run (DR-P2-008). |
| `restore-storage.sh` | Restore uploaded files from a storage backup archive (Linux/macOS). |
| `dev-setup.sh` | One-shot developer environment setup (Linux/macOS). |
| `preflight-check.sh` | Pre-deploy sanity checks (env files, tool versions). |
| `rollback.sh` | Roll back the last deployment on the droplet (Linux/macOS). |
| `validate-terraform-env.sh` | Validate Terraform env files before plan/apply. |
| `install-terraform.ps1` | Install Terraform on Windows. |
| `fix-apostrophe.js` | One-off content fix: replace problematic apostrophes in product copy. |
| `fix-cat.js` | One-off content fix utility. |
| `fix-everything-dupes.js` | One-off cleanup of duplicate content entries. |
| `generate-fulfillment.js` | One-off generator: fulfillment content for products. |
| `generate-product-content.js` | One-off generator: product content pages. |
| `generate-sbom.mjs` | Generate a CycloneDX 1.5 SBOM (licenses + dependency graph + commit binding) — see `docs/SBOM_PROCESS.md`. |
| `validate-sbom.mjs` | Fail CI on a malformed / regressed SBOM (structure, refs, count floor). |
| `audit-gate.mjs` | Dependency vulnerability gate for all scopes — see `docs/DEPENDENCY_POLICY.md`. |
| `license-gate.mjs` | License allow/deny gate with documented exceptions — see `docs/LICENSE_POLICY.md`. |
| `check-required-checks.mjs` | Fail when a required branch-protection context is not emitted by any workflow, or is emitted by a path-filtered `pull_request` workflow (BP-P2-004/BP-P2-005/CI-P2-009). |
| `sync-product-catalog.mjs` | Keep `apps/api/src/data/products.json` byte-identical to the canonical `apps/web/lib/catalog/data/products.json` (HYGIENE-P2-002); `check` runs in the shared unit-tests action. |
| `ci/check-required-checks.sh` | Self-test for `check-required-checks.mjs`: runs the guard on the live tree plus a path-filtered negative fixture. |

## Subdirectories

| Directory | Purpose |
| --------- | ------- |
| `ci/` | CI helper scripts and guard self-tests (`generate_badges.py`, `history_logger.py`, `check-migration-transactions.sh`, `check-required-checks.sh`). |
| `load-testing/` | Load-test scripts (smoke, auth, SSE, tickets) — see its `README.md`. |
