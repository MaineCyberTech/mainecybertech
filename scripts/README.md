# Scripts

> Automation helpers for the MCT Portal monorepo. Last updated 2026-10-21.

## Which platform?

| Script | Windows (PowerShell) | Linux/macOS (bash) |
| ------ | -------------------- | ------------------ |
| Local stack start | `start-local-stack.ps1` | `start-local-stack.sh` |
| Local stack teardown | `teardown-local-stack.ps1` | `teardown-local-stack.sh` |
| Local stack test | `test-local-stack.ps1` | `test-local-seeds.sh` |
| Dev reset & verify | `local_dev_reset_and_verify.automated.v2.ps1` | `local_dev_reset_and_verify.automated.v2.sh` |
| Secret scan | `scan-secrets.ps1` | `scan-secrets.sh` |
| Database backup | — (retired, use bash) | `backup-database.sh` |
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
| `backup-database.sh` | Back up the Supabase/database data (the PowerShell duplicate was retired in DR-P3-002). |
| `restore-database.sh` | Restore a database backup (Linux/macOS). |
| `backup-storage.sh` | Mirror Supabase Storage buckets (`documents`/`avatars`/`logos`) to S3/Spaces. |
| `record-backup-heartbeat.sh` | Record the platform backup heartbeat (`platform_backup_heartbeats`) after a successful backup run (DR-P2-008). |
| `restore-storage.sh` | Restore uploaded files from a storage backup archive (Linux/macOS). |
| `dev-setup.sh` | One-shot developer environment setup (Linux/macOS). |
| `preflight-check.sh` | Pre-deploy sanity checks (env files, tool versions). |
| `rollback.sh` | Roll back the last deployment on the droplet (Linux/macOS). |
| `terraform-state-restore.sh` | Emergency Terraform state restore from the versioned DO Spaces backend (`--list`/`--scratch`/`--restore`; DR-P3-005 / IR-P3-001). |
| `validate-terraform-env.sh` | Validate Terraform env files before plan/apply (scans `env/` and the module root, INFRA-P3-007). |
| `install-terraform.ps1` | Install Terraform on Windows. |
| `backfill-profile-pii.mjs` | One-off idempotent backfill of `profiles.encrypted_pii` from the plaintext PII columns (SEC-P2-002); run once per environment. Root alias: `pnpm backfill:profile-pii`. |
| `seed-store.ts` | Idempotent upsert of `apps/api/src/data/products.json` + `categories.json` into `store_products` / `store_categories` (needs service-role credentials; see migration 5302134). |
| `generate-sbom.mjs` | Generate a CycloneDX 1.5 SBOM (licenses + dependency graph + commit binding) — see `docs/SBOM_PROCESS.md`. |
| `validate-sbom.mjs` | Fail CI on a malformed / regressed SBOM (structure, refs, count floor); `--image [--digest sha256:…]` validates Trivy image SBOMs (floor + digest binding) before upload/attestation (SBOM-P3-005). |
| `audit-gate.mjs` | Dependency vulnerability gate for all scopes — see `docs/DEPENDENCY_POLICY.md`. |
| `license-gate.mjs` | License allow/deny gate with documented exceptions — see `docs/LICENSE_POLICY.md`. |
| `collect-licenses.mjs` | Build the license inventory from the installed tree (`node_modules/.pnpm`). Replaces `pnpm licenses list --json`, which exits 1 on pnpm 10.34.x and writes an error document to stdout. Root alias: `pnpm sbom:licenses`. |
| `sync-product-catalog.mjs` | Keep `apps/api/src/data/products.json` byte-identical to the canonical `apps/web/lib/catalog/data/products.json` (HYGIENE-P2-002); `check` runs in the shared unit-tests action. |

## CI guards

All of these run in CI — most in the shared unit-tests action (PR gate
`test.yml`, deploy gate `validate.yml`) or the dependency-audit action, with
`sbom.yml` / `secret-history-scan.yml` / `alert-path-exercise.yml` /
`external-uptime-probe.yml` noted per row. Several ship fixture-driven
self-tests in `ci/` so a broken detector cannot pass silently.

| Script | Purpose |
| ------ | ------- |
| `check-docs-counts.mjs` | Fail when docs state counts that drift from the repo (components, migrations, workflows, scripts, seeds, prompts, web pages, routes, suites; test totals are fail-closed in CI via `MCT_VERIFY_TEST_COUNTS=1`). |
| `check-docs-links.mjs` | Fail on broken relative links in tracked markdown; also checks the `docs/CI.md` workflow table against `.github/workflows/` (CI-P3-011). |
| `check-rls-predicate.mjs` | Fail when a post-baseline migration reintroduces the raw unfiltered membership predicate (DATA-P1-001). |
| `verify-rls.mjs` | RLS/migration hygiene: helper functions, policy catalog, dead-policy scan. |
| `generate-db-types.js` | Regenerate `packages/sdk` database types; `--check` (CI + root `db:types:check`) fails on drift. |
| `openapi-audit.js` | Fail when a statically-resolvable Express route is missing from the generated OpenAPI spec, or when a spec entry has no static code route and is absent from `scripts/openapi-audit-allowlist.json` (API-P3-002). |
| `ci/test-secret-patterns.mjs` | Fixture test for the canonical diff-scanner patterns in `scripts/ci/secret-patterns.txt` (including `dop_v1_`, `sbp_`, `glpat-`, `sk-proj-`, `npm_`) — CI-P3-005 / SC-P3-009. Runs in the shared `secret-scan` action. |
| `check-permission-catalog.mjs` | Fail when a `requirePermission` literal, a live RLS `user_has_permission` predicate, or a `registerCrud` module key references a pair absent from the permission catalog (ACM-P3-002 / EVOL-P3-002). |
| `public-route-inventory.mjs` | Generate `docs/PUBLIC_ROUTES.md` from the `auth: false` OpenAPI RouteDefs; `--check` (CI) fails when the inventory is stale (ACM-P3-003). |
| `check-env-parity.mjs` | Fail when a runtime env schema key is missing from its `.env.example`, an example key is neither in the schema nor the documented `EXTERNAL_KEYS` allowlist, or a key is absent from `docs/ENVIRONMENT_VARIABLES.md`; resolves the shared `@mct/config/env` shapes (SECRET-P3-005). `--self-test` proves the negative fixtures fail. |
| `check-historical-gates.mjs` | Fail when a committed `prompts/` JSON carries a machine-readable release `decision` without `"historical": true`, so a stale APPROVED artifact cannot be cited as release evidence (EXEC-P3-001). `--self-test` proves the detector. |
| `sync-review-md.mjs` | Regenerate `review.md` (the mirror of `AGENTS.md`); `--check` runs in CI. |
| `verify-prompts.js` | Prompt provenance: `generate` / `verify` (CI) / `tree` over the SHA-256 manifest; also enforces the documented size budget. |
| `check-circular-deps.mjs` | Fail on a circular import across `apps/*` and `packages/*` (HYGIENE-P3-009); `--self-test` proves the detector fails on a synthetic cycle. |
| `check-required-checks.mjs` | Fail when a required branch-protection context is not emitted by any workflow, or is emitted by a path-filtered `pull_request` workflow (BP-P2-004/BP-P2-005/CI-P2-009). Models GitHub's matrix check-run names, including explicit job names with a matrix (`Build (20.x)`; BP-P3-004). |
| `check-codeowners.mjs` | Parse `.github/CODEOWNERS` (syntax + catch-all rule) and resolve every `@org/team` handle via the GitHub API when `CODEOWNERS_READ_TOKEN` is set; without a token it runs the documented syntax-only fallback (BP-P3-005). |
| `actions-inventory.mjs` | Emit the GitHub Actions dependency inventory (name, pinned SHA, version) consumed by `sbom.yml`; `--check` fails on an unpinned external `uses:` ref (SBOM-P3-008). |
| `branch-protection-audit.mjs` | Drift detection (committed `.github/branch-protection/*.json` vs live settings, normalized) and bypass audit (merged PRs into `main`/`develop` whose head check-runs missed or failed a required context) — BP-P2-002/BP-P2-003. |
| `e2e-flake-summary.mjs` | Summarise Playwright pass/flake/fail counts into the job summary (TEST-P2-003); informational, never fails the job. |
| `exercise-alert-path.sh` | Exercise the Alertmanager → ntfy critical-alert path end-to-end (OBS-P2-014 / NOTIF-P2-011); runs on the droplet, piped over SSH by `alert-path-exercise.yml`. |
| `ci/check-migration-transactions.sh` | Self-test + lint for destructive migrations missing `begin;`/`commit;` (DATA-P2-002). |
| `ci/check-permission-catalog.sh` | Self-test for `check-permission-catalog.mjs` (live tree + uncatalogued-key negative fixture). |
| `ci/check-required-checks.sh` | Self-test for `check-required-checks.mjs` (live tree, a name+matrix positive fixture, an unexpanded-name negative fixture, and the path-filtered negative fixture). |
| `ci/check-codeowners.sh` | Self-test for `check-codeowners.mjs` (live syntax + team handles when a token is set, invalid-handle negative fixture, unknown-team fixture with `--teams-file`). |
| `ci/check-branch-protection-audit.sh` | Self-test for `branch-protection-audit.mjs` (matching/drifted/unprotected protection fixtures plus clean/bypass merged-PR fixtures). |
| `ci/check-supply-chain-gates.mjs` | Fixture-driven self-test for `audit-gate.mjs` / `license-gate.mjs` (exception scoping, UNKNOWN fail-closed, `expires` enforcement) — SBOM-P2-009/010. |
| `ci/verify-gitleaks-config.sh` | Verify `.gitleaks.toml`: tracked tree clean under the allowlists AND a synthetic key is still detected (`secret-history-scan.yml`). |
| `uptime/probe.mjs` | External uptime probe run by `external-uptime-probe.yml` against `uptime/probe-targets.json`. |
| `uptime/smoke.mjs` | Functional smoke check run by `smoke-check.yml`: API `/health`, web `/login`, and an authenticated read (sign-in + `GET /api/v1/auth/me`) per enabled target (TEST-P3-002). |
| `check-audits-budget.mjs` | Advisory size-budget report for the `docs/audits` corpus (HYGIENE-P3-014): warns when over the documented budget and never fails CI by default (`--strict` exits 1 for local/operator use). |
| `ci/test-terraform-state-restore.sh` | Self-test for `terraform-state-restore.sh` against a stubbed aws CLI (list/scratch/restore guard, fail-closed credentials) — DR-P3-005 / IR-P3-001. |

## Subdirectories

| Directory | Purpose |
| --------- | ------- |
| `ci/` | CI helper scripts and guard self-tests (`check-migration-transactions.sh`, `check-required-checks.sh`, `check-codeowners.sh`, `check-branch-protection-audit.sh`, `check-supply-chain-gates.mjs`, `verify-gitleaks-config.sh`) plus the guard fixtures under `ci/fixtures/`. |
| `lib/` | Shared dependency-free helpers for the policy gates (`policy-gates.mjs`), consumed by `audit-gate.mjs`, `license-gate.mjs` and `ci/check-supply-chain-gates.mjs`. |
| `load-testing/` | Load-test scripts (smoke, auth, SSE, tickets) — see its `README.md`. |
| `uptime/` | External uptime probe (`probe.mjs` + `probe-targets.json`) and the functional smoke check (`smoke.mjs`, TEST-P3-002). |

## Removed one-off catalog tooling (HYGIENE-P3-004)

`apply-content-map.js`, `fix-apostrophe.js`, `fix-cat.js`,
`fix-everything-dupes.js`, `generate-details.js`, `generate-fulfillment.js`,
`generate-product-content.js` and the `content-map/` +
`content-map-fulfillment/` data directories were deleted on 2026-10-12: their
245 product ids were already baked into the catalog and nothing referenced
them. They remain recoverable from git history.

## Conventions

- New scripts are ESM (`.mjs`) and dependency-free where practical, so CI can
  run them without an install step.
- One-off content/data migrations do not belong in `scripts/` — keep them in
  git history or under `supabase/migrations/`.
- `prompts/` is pinned historical data (see `prompts/PROVENANCE.md`), not
  product code; do not import from it at runtime.
