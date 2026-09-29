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

- dependency audit — `pnpm audit --audit-level=high --prod`
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
4. SSH deploy: the droplet `.env` is rewritten from secrets, compose comes up,
   the api + web health gate runs (worker health is non-fatal), then HTTPS
   checks hit `/health` and `/login`.

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

- SBOM: `sbom.yml` uploads a CycloneDX artifact (`sbom-cyclonedx`, 30-day
  retention) on push/PR and weekly.
- Backups: `db-backup.yml` runs daily at 04:00 UTC to Spaces and notifies Slack
  on failure.
- Monitoring: [docs/MONITORING_AND_ALERTING.md](MONITORING_AND_ALERTING.md).

## Before promoting to prod

Known environment caveats (from `AGENTS.md` Known Debt) that must be resolved
first:

- The `prod` environment has no `SUPABASE_*`/`JWT_SECRET` secrets or vars, so
  the prod deploy path cannot succeed as configured; `prod`/`prod-approval`
  also have no protection rules.
- `DO_API_TOKEN` returns HTTP 401; dev falls back to the `DROPLET_IP`
  environment variable, but prod has no fallback set. Rotate the token and/or
  set `DROPLET_IP` for prod.
- `main` is far behind `develop`; scheduled `db-backup`/`db-restore-test`/
  `sbom` runs only fire from the default branch and recent backup runs have
  failed — verify the database secrets before relying on them.
- E2E has known run-to-run flakiness on data-dependent tests under CI/Supabase
  contention; re-run before treating a failure as a product regression.
