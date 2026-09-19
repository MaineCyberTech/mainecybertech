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

## Subdirectories

| Directory | Purpose |
| --------- | ------- |
| `ci/` | CI helper scripts (`generate_badges.py`, `history_logger.py`). |
| `load-testing/` | Load-test scripts (smoke, auth, SSE, tickets) — see its `README.md`. |
