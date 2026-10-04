# Releasing

How changes move from `develop` to production on the DigitalOcean droplet, and
what to check first.

## Quick checklist

- [ ] PR is green: `test`, `lint`, `typecheck`, `codeql`, `e2e`.
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
  (`gh attestation verify oci://ghcr.io/<owner>/mct-<image>:<sha>`). There is no
  git tag requirement — the commit SHA is authoritative.
- Each image is scanned with Trivy at build time (CRITICAL/HIGH, ignoring
  unfixed) before the deploy proceeds; a failing scan blocks the deploy jobs.
- `CHANGELOG.md` follows [Keep a Changelog](https://keepachangelog.com/) and
  currently keeps a single `[Unreleased]` section, with shipped entries grouped
  under dated headings (`## 2026-09-21`) until the first tagged release. To cut
  a release section, insert a dated `## YYYY-MM-DD` heading below
  `[Unreleased]`, move the shipped entries under it, and leave an empty
  `[Unreleased]` at the top.

## Production deploy

1. Merge `develop` → `main` (or dispatch `deploy-do` with
   `deploy_target: prod`).
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

`deploy-do.yml` (prod `deploy` job) and `terraform-do.yml`
(`terraform-apply-prod`) both use the `prod-approval` environment. Attaching an
environment is all that can be expressed in the workflow files; the actual
human approval depends on a **GitHub repository setting**:

> Settings → Environments → `prod-approval` → **Required reviewers** (add 1+).

Until that reviewer list is configured, the workflow still runs the prod job
without pausing and **there is no working manual-approval gate**. The prod
deploy secrets/variables (`SUPABASE_*`, `JWT_SECRET`, `DROPLET_IP`, …) must also
be available to the `prod-approval` environment (scoped to it or repo-wide) or
the job will deploy with empty values.

Migrations never run from a laptop: `supabase-migrations.yml` applies
`supabase db push --include-all` on pushes to `main`/`develop` touching
`supabase/**`, is serialized per branch, and is also the prod `migrate-gate`.

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
- Backups: `db-backup.yml` runs daily at 04:00 UTC to Spaces and notifies Slack
  on failure.
- Monitoring: [docs/MONITORING_AND_ALERTING.md](MONITORING_AND_ALERTING.md).

## Before promoting to prod

The consolidated release-readiness gate (exit criteria, fail-closed decisions
and the go-live operator checklist) is [`RELEASE_GATE.md`](RELEASE_GATE.md).
Known environment caveats (from `AGENTS.md` Known Debt) that must be resolved
first:

- The `prod` environment has no `SUPABASE_*`/`JWT_SECRET` secrets or vars, so
  the prod deploy path cannot succeed as configured; the prod `deploy` job now
  attaches `prod-approval` (see [Approval gate](#approval-gate)), but
  **required reviewers on `prod-approval` are still not configured** — the
  approval gate does not work until they are set in GitHub.
- `DO_API_TOKEN` returns HTTP 401; dev falls back to the `DROPLET_IP`
  environment variable, but prod has no fallback set. Rotate the token and/or
  set `DROPLET_IP` for prod.
- `main` is far behind `develop`; scheduled `db-backup`/`db-restore-test`/
  `sbom` runs only fire from the default branch and recent backup runs have
  failed — verify the database secrets before relying on them.
- E2E has known run-to-run flakiness on data-dependent tests under CI/Supabase
  contention; re-run before treating a failure as a product regression.
