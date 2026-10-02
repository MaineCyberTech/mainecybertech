# CI

All 16 GitHub Actions workflows in `.github/workflows/`. Actions are pinned by
commit SHA (not tags), pnpm 10 is activated through corepack with a 3-attempt
retry, and Node 20 is used throughout. Cron workflows only run from the default
branch.

| Workflow              | File                      | Triggers                                                           | Path filter                                                                                                                                                              | What it does                                                                                                                                                      | Gate                |
| --------------------- | ------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| Test                  | `test.yml`                | push + PR `main`, `develop`; dispatch                              | `apps/**`, `packages/**`, `pnpm-lock.yaml`, `package.json`, `test.yml`                                                                                                   | Coverage tests; OpenAPI validate + coverage audit; docs counts + links guards; DB-types check; RLS hygiene; `pnpm audit --prod` + Trivy (SARIF); diff secret scan | Blocking            |
| Lint                  | `lint.yml`                | push + PR `main`, `develop`; dispatch                              | `apps/**`, `packages/**`, `pnpm-lock.yaml`, `package.json`, `lint.yml`                                                                                                   | `pnpm lint`                                                                                                                                                       | Blocking            |
| TypeCheck             | `typecheck.yml`           | push + PR `main`, `develop`; dispatch                              | `apps/**`, `packages/**`, `pnpm-lock.yaml`, `package.json`, `typecheck.yml`                                                                                              | `pnpm typecheck`                                                                                                                                                  | Blocking            |
| E2E                   | `e2e.yml`                 | PR `main`, `develop`; `workflow_call`; dispatch (`a11y_full`)      | `apps/web/e2e/**`, `apps/web/playwright.config.ts`, `apps/web/app/**`, `apps/web/components/**`, `packages/**`, `supabase/seeds/**`, `supabase/migrations/**`, `e2e.yml` | Local Supabase + built API/web; Playwright chromium E2E + axe (19-route gate, 68 with `A11Y_FULL`)                                                                | Blocking on PR      |
| Validate              | `validate.yml`            | `workflow_call` only                                               | —                                                                                                                                                                        | Deploy gate: audit, coverage tests + all guards, secrets scan, lint, typecheck, prompt provenance (`verify-prompts.js`), `review.md` sync                         | Deploy gate         |
| deploy-do             | `deploy-do.yml`           | push `main`, `develop`; dispatch (`deploy_target`, `rollback_sha`) | `apps/api/**`, `apps/web/**`, `apps/worker/**`, `packages/**`, `infra/digitalocean/**`, `deploy-do.yml`                                                                  | Build 3 GHCR images; `validate`; prod-only E2E + migration gates; SSH deploy to the droplet with container health gate and auto-rollback to the previous tag      | Blocking            |
| terraform-do          | `terraform-do.yml`        | dispatch only                                                      | n/a                                                                                                                                                                      | `fmt -check`, validate, plan; apply requires the `apply` input (disabled until the `DO_API_TOKEN` is rotated)                                                     | Manual              |
| supabase-migrations   | `supabase-migrations.yml` | push `develop`, `main`; `workflow_call`; dispatch                  | `supabase/**`, `supabase-migrations.yml`                                                                                                                                 | `supabase db push --include-all` with pinned CLI 2.107.0; `prod`/`dev` environment; serialized per branch                                                         | Migrate gate (prod) |
| build-push            | `build-push.yml`          | dispatch only                                                      | —                                                                                                                                                                        | Manual GHCR build of `mct-api`, `mct-worker`, `mct-web` (push triggers removed — `deploy-do` builds)                                                              | Manual              |
| Chromatic             | `chromatic.yml`           | push + PR `develop`, `main`                                        | `packages/ui/**`                                                                                                                                                         | Storybook build + Chromatic visual regression                                                                                                                     | Best-effort         |
| CodeQL                | `codeql.yml`              | push + PR `main`, `develop`; weekly (Mon 04:17); dispatch          | —                                                                                                                                                                        | CodeQL `javascript-typescript`, `security-and-quality`                                                                                                            | Blocking            |
| A11y breadth          | `a11y-breadth.yml`        | weekly (Mon 05:23); dispatch                                       | —                                                                                                                                                                        | Calls `e2e.yml` with `a11y_full: true` — 68-route WCAG 2.2 triage scan                                                                                            | Triage-only         |
| Dependency Review     | `dependency-review.yml`   | PR `main`, `develop`                                               | —                                                                                                                                                                        | Blocks PRs that introduce high-or-worse vulnerable dependencies                                                                                                   | Blocking on PR      |
| Database Backup       | `db-backup.yml`           | daily 04:00 UTC; dispatch                                          | —                                                                                                                                                                        | `scripts/backup-database.sh` to Spaces; Slack alert on failure                                                                                                    | Scheduled           |
| Database Restore Test | `db-restore-test.yml`     | weekly (Mon 06:00); dispatch                                       | —                                                                                                                                                                        | Restores the newest backup into a throwaway local `postgres:16` and verifies table counts                                                                         | Scheduled           |
| SBOM                  | `sbom.yml`                | push + PR `main`, `develop`; weekly (Mon 05:00); dispatch          | —                                                                                                                                                                        | CycloneDX SBOM artifact (30-day retention) via `scripts/generate-sbom.mjs`                                                                                        | Blocking            |

## Deploy pipeline

`deploy-do.yml` for a push to `develop` or `main`:

```
setup → resolve-ip
      → build-api ∥ build-worker ∥ build-web ∥ validate
      → e2e-gate + migrate-gate        (prod only; skipped on dev)
      → deploy (always() && !failure() && !cancelled())
```

`deploy` writes the droplet `.env` via `printf` (secrets never interpolate into
the remote shell), pulls the images, restarts the compose stack, and only
prunes old images after the API and web containers report healthy. A failed
health gate rolls back to the previously running tag.

`terraform-do.yml` is **manual-dispatch only** (2026-09-29): automatic push/PR
runs failed on the invalid `DO_API_TOKEN` and a develop push could reach dev
apply without review. A manual run plans by default and needs `validate-gate`;
setting the `apply` input additionally enables the apply job (`main` → prod
environment + E2E/migration gates; `develop` → dev). Re-enable push/PR triggers
once the token is rotated and `prod-approval` has required reviewers configured
in GitHub.

## Best-effort and triage-only jobs

- **Chromatic** — job-level `continue-on-error: true` because the Storybook
  webpack build currently fails with `SB_BUILDER-WEBPACK5_0002`. Failures stay
  visible in the job status without blocking the pipeline.
- **A11y breadth** — `continue-on-error: true`; a weekly/manual 68-route
  WCAG 2.2 scan. Fix findings and promote routes into the default 19-route
  gate rather than widening the prod gate with known failures.
- **build-push** — manual dispatch only; regular builds happen in `deploy-do`.

## Repo-wide CI conventions

- Every workflow installs pnpm with `corepack enable` +
  `corepack prepare pnpm@10 --activate` inside a retry loop (do not use
  `pnpm/action-setup` or `cache: pnpm` on `actions/setup-node`).
- `validate.yml` is the shared deploy gate; keep its steps in parity with
  `test.yml`.
- The docs-counts, docs-links, DB-types and RLS-hygiene guards run in both
  `test.yml` and `validate.yml`, so a deploy cannot ship drifted docs or schema
  state.
