# Releasing

How changes move from `develop` to production on the DigitalOcean droplet, and
what to check first.

## Quick checklist

- [ ] PR is green: `test`, `security-scan`, `secrets-scan`, `lint`, `typecheck`, `codeql`, `e2e`.
- [ ] Every required check has **completed** green on the promotion PR before
      merging — never merge while checks are queued/running. A merge before the
      checks report leaves the promoted commit with no green Test artifact
      (TEST-P2-010, PR #281); a stuck gate goes through
      [RUNBOOK_EMERGENCY_MERGE.md](RUNBOOK_EMERGENCY_MERGE.md), never an
      undocumented admin override.
- [ ] `CHANGELOG.md` `[Unreleased]` section reflects the change.
- [ ] Schema changes are in `supabase/migrations/`.
- [ ] The deploy run's `validate` gate is green.
- [ ] Known prod blockers resolved (secrets, protection rules, `DO_API_TOKEN`)
      — see [Before promoting to prod](#before-promoting-to-prod).
- [ ] Previous image tag / commit SHA noted for rollback.

## Branch model

- Work lands on `develop`; `main` is production.
- `deploy-do.yml` deploys on pushes to `main` or `develop` that touch
  `apps/api/**`, `apps/web/**`, `apps/worker/**`, `packages/**`,
  `infra/digitalocean/**` or the workflow itself. Deploys are queued per ref
  (`cancel-in-progress: false`) — an in-flight prod deploy is never cancelled.
- `main` → prod (`app.mainecybertech.com`), `develop` → dev
  (`app.mainecybertech.us`). Promoting means merging `develop` into `main`.
- Branch protection is committed as code (`.github/branch-protection/*.json`).
  A weekly audit compares it with the live settings and records bypasses; when
  a required check is stuck, follow
  [RUNBOOK_EMERGENCY_MERGE.md](RUNBOOK_EMERGENCY_MERGE.md) instead of bypassing
  ad hoc.
- **Production hotfix:** branch from `main`, keep the diff minimal, take the
  normal required checks + CODEOWNERS review, deploy, then backport to
  `develop` — full procedure in
  [RUNBOOK_HOTFIX.md](RUNBOOK_HOTFIX.md). The break-glass runbook above is only
  for a stuck gate, not for urgency alone.

## Quality gates

**PR checks.** `test.yml` (coverage tests, OpenAPI validate + coverage audit,
docs counts, DB-types check, RLS hygiene, dependency audit/Trivy, secrets scan),
`lint.yml`, `typecheck.yml`, `codeql.yml` (SAST), and `e2e.yml` (Playwright —
push trigger intentionally removed; the same workflow is the prod gate).

**Deploy gate.** Every `deploy-do` run calls `validate.yml`, and all of it must
pass before the deploy step:

- dependency audit — `node scripts/audit-gate.mjs` (blocks CRITICAL any scope,
  HIGH+ prod; reports dev-tree advisories)
- license policy gate — `node scripts/license-gate.mjs` (allowlist + exceptions)
- tests with coverage — `pnpm test:coverage`
- OpenAPI validate — `pnpm --filter=api exec tsx src/scripts/validate-openapi.ts`
- OpenAPI coverage audit — `node scripts/openapi-audit.js`
- docs counts — `node scripts/check-docs-counts.mjs`
- DB types current — `node scripts/generate-db-types.js --check`
- RLS/migration hygiene — `node scripts/verify-rls.mjs`
- prompt provenance — `node scripts/verify-prompts.js verify`
- review.md mirror in sync — `node scripts/sync-review-md.mjs --check`
- `secrets-scan`, `lint` and `typecheck` jobs

## Versioning & changelog

- The repo is **private and nothing is published to npm** — every
  `package.json` under `apps/` and `packages/` sets `"private": true`. A release
  is the Docker images on GHCR (`mct-api`, `mct-worker`, `mct-web`) tagged with
  the deploying commit SHA (or a `rollback_sha`).
- **Product version source of truth** is [`VERSION`](../VERSION) at the repo
  root. Generated artifacts bind to the commit: the lockfile SBOM records
  `<VERSION>+<commit SHA>` (`metadata.component.version`, plus `mct:commit`),
  a per-image CycloneDX image SBOM is bound to the pushed image digest, and each
  pushed image gets a build-provenance attestation bound to the same digest
  (`gh attestation verify oci://ghcr.io/<owner>/mct-<image>:<sha>`). The commit
  SHA remains authoritative for images and rollbacks.
- **Release tagging (CI-P3-008):** every promotion push to `main` makes
  [`release.yml`](../.github/workflows/release.yml) cut an annotated tag and a
  GitHub Release named `v<VERSION>-<YYYYMMDD>-<short-sha>` (e.g.
  `v0.1.0-20261013-3a4e62a`). The release body is generated from the commits
  since the previous tag, the migrations added in the range and the current
  [`UPGRADE.md`](UPGRADE.md) window, with the human-authored Breaking
  Changes/Operator Actions sections to be filled from
  [`templates/RELEASE_NOTES_TEMPLATE.md`](../templates/RELEASE_NOTES_TEMPLATE.md);
  the lockfile SBOM is attached to the release. Re-runs of the same commit are
  idempotent, and a dispatch from a non-`main` ref only uploads the notes/SBOM
  as artifacts. Bump [`VERSION`](../VERSION) when the release changes the
  product version — the tag carries whatever the file says.
- Each image is scanned with Trivy at build time (CRITICAL/HIGH, ignoring
  unfixed) before the deploy proceeds; a failing scan blocks the deploy jobs.
- `CHANGELOG.md` follows [Keep a Changelog](https://keepachangelog.com/) and
  currently keeps a single `[Unreleased]` section, with shipped entries grouped
  under dated headings (`## 2026-09-21`). To cut a release section, insert a
  dated `## YYYY-MM-DD` heading below `[Unreleased]`, move the shipped entries
  under it, and leave an empty `[Unreleased]` at the top.
- Cut release notes from
  [`templates/RELEASE_NOTES_TEMPLATE.md`](../templates/RELEASE_NOTES_TEMPLATE.md)
  — fill every section, including Breaking Changes, Migrations (with the
  release's migration filenames) and Operator Actions, and use the result as
  the GitHub Release body.
- The running manifest of behavior-affecting changes (RLS/entitlement/retention
  and other breaking migrations) is [`UPGRADE.md`](UPGRADE.md); the template's
  Migrations list remains the per-release source of filenames.

## Production deploy

1. Merge `develop` → `main`. A manual `deploy-do` dispatch with
   `deploy_target: prod` is only accepted from the `main` ref (BP-P2-006), so
   promote first.
2. Prod-only gates run when the resolved environment is `prod`: `e2e-gate`
   (Playwright) and `migrate-gate` (`supabase-migrations.yml`); dev skips both
   to keep deploys fast.
3. Images are built and pushed to GHCR under `IMAGE_TAG` (the commit SHA).
4. The `deploy` job attaches the **`prod-approval`** GitHub environment for a
   prod deploy (`dev` for dev), so it uses the same approval gate as the
   Terraform prod apply. **The gate is only effective once required reviewers
   are configured in GitHub** — that setting cannot live in the repo (see
   [Approval gate](#approval-gate)).
5. SSH deploy: the droplet `.env` is rewritten from secrets, compose comes up,
   the api + web + worker container-health gate runs (a failed gate rolls back
   to the previous tag), then HTTPS checks hit `/health` and `/login`.

### Approval gate

Every production-mutating job uses the **same** `prod-approval` environment
(BP-P3-003): `deploy-do.yml` (prod `deploy` job), `terraform-do.yml`
(`terraform-apply-prod`) and `supabase-migrations.yml` (prod migrations).
Attaching an environment is all that can be expressed in the workflow files;
the actual human approval depends on a **GitHub repository setting**:

> Settings → Environments → `prod-approval` → **Required reviewers** (add 1+).

Until that reviewer list is configured, the workflow still runs the prod job
without pausing and **there is no working manual-approval gate**. The prod
deploy and migration secrets/variables (`SUPABASE_*`, `JWT_SECRET`,
`DROPLET_IP`, `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`, …) must also be
available to the `prod-approval` environment (scoped to it or repo-wide) or the
job will run with empty values.

Migrations never run from a laptop: `supabase-migrations.yml` applies
`supabase db push --include-all` on pushes to `main`/`develop` touching
`supabase/**`, is serialized per branch, is also the prod `migrate-gate`, and
attaches `prod-approval` on `main` — so a production migration pauses for the
same reviewer gate as the deploy. The read-only `resolve-ip` (deploy) and
`terraform-plan` jobs still attach the unprotected `prod` environment; nothing
under `prod` mutates.

## Rollback

See [docs/ROLLBACK_PROCEDURES.md](ROLLBACK_PROCEDURES.md). Automated path:
dispatch `deploy-do` with `rollback_sha` (7–40 lowercase hex); the build jobs
are skipped and the droplet redeploys the existing GHCR images tagged with that
SHA. If the health gate fails during a normal deploy, the deploy step already
re-deploys the previously running tag before exiting non-zero.

## Post-release

- SBOM: `sbom.yml` generates a CycloneDX **lockfile** artifact
  (`sbom-cyclonedx`, 30-day retention) with licenses, a dependency graph, and
  `<VERSION>+<commit SHA>` binding. The deploy path (`deploy-do.yml`) generates
  a CycloneDX **image** SBOM per image bound to the pushed image digest and
  **attests** it (`actions/attest-sbom`, pushed to the registry), so a shipped
  image stays tied to its SBOM after the artifact expires (SUPPLY-P3-001);
  `build-push.yml` emits the same image SBOM as an artifact. See
  [docs/SBOM_PROCESS.md](SBOM_PROCESS.md) for retrieval and verification.
- Backups: `db-backup.yml` runs daily at 04:00 UTC to Spaces and notifies ntfy
  on failure (Slack is the fallback channel).
- Monitoring: [docs/MONITORING_AND_ALERTING.md](MONITORING_AND_ALERTING.md).

## Before promoting to prod

The consolidated release-readiness gate (exit criteria, fail-closed decisions
and the go-live operator checklist) is [`RELEASE_GATE.md`](RELEASE_GATE.md).
Known environment caveats (from `AGENTS.md` Known Debt) that must be resolved
first:

- The `prod-approval` environment has no `SUPABASE_*`/`JWT_SECRET`/migration
  secrets or vars, so the prod deploy and prod migration paths cannot succeed
  as configured; the prod `deploy`, `terraform-apply-prod` and
  `supabase-migrations` (main) jobs all attach `prod-approval` (see
  [Approval gate](#approval-gate)), but **required reviewers on `prod-approval`
  are still not configured** — the approval gate does not work until they are
  set in GitHub. The read-only `prod` environment needs no secrets beyond what
  `resolve-ip`/`terraform-plan` read.
- `DO_API_TOKEN` returns HTTP 401; dev falls back to the `DROPLET_IP`
  environment variable, but prod has no fallback set. Rotate the token and/or
  set `DROPLET_IP` for prod.
- Branch state: the last promotion is PR #281 (`main` @ `7dd04023`,
  2026-10-14); PR #278 (`9ba108b5`, 2026-10-13) preceded it. `main` currently
  carries every `origin/develop` commit, but the branches can point in either
  direction between releases — compare them with
  `git log --oneline --left-right origin/main...origin/develop` instead of
  assuming. Scheduled `db-backup`/`db-restore-test`/`sbom` runs only fire from
  the default branch, so unpromoted `develop` work is not covered by them, and
  recent backup runs have failed — verify the database secrets before relying
  on them.
- E2E has known run-to-run flakiness on data-dependent tests under CI/Supabase
  contention. CI retries a failed test up to 2 times; a test that only passes
  on retry is reported in the job's flake summary and does **not** fail the
  run. A failure after all retries is a regression. The full policy (retry
  budget, flake triage, quarantine) is in
  [`CI.md` §E2E flake policy](CI.md#e2e-flake-policy-ci-p3-009).
