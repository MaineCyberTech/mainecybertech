# Release and deploy gate

This document is the reference for how a change is allowed to reach the
DigitalOcean droplet, and what must be green before the `deploy-do` job runs.
For the day-to-day promotion procedure see [RELEASING.md](RELEASING.md); for the
workflow inventory see [CI.md](CI.md).

## Fail-closed deploy gate

`deploy-do.yml` only starts `deploy` when every job it depends on has actually
passed. The gate is expressed explicitly on the `deploy` job:

```yaml
if: >-
  ${{
    !cancelled() &&
    needs.setup.result == 'success' &&
    needs['resolve-ip'].result == 'success' &&
    needs.validate.result == 'success' &&
    needs['verify-attestations'].result == 'success' &&
    (needs['e2e-gate'].result == 'success' || needs['e2e-gate'].result == 'skipped') &&
    (needs['migrate-gate'].result == 'success' || needs['migrate-gate'].result == 'skipped') &&
    (needs['build-api'].result == 'success' || needs['build-api'].result == 'skipped') &&
    (needs['build-worker'].result == 'success' || needs['build-worker'].result == 'skipped') &&
    (needs['build-web'].result == 'success' || needs['build-web'].result == 'skipped')
  }}
```

Rules:

- **Never** gate the deploy with `always() && !failure()`. `failure()` is false
  when a needed job was merely *skipped*, so that pattern can let a deploy run
  when a gate never actually passed.
- `validate` and every build that runs must be `success`.
- `e2e-gate` and `migrate-gate` may be `skipped` **only on dev**, where their own
  `if` deliberately excludes them. On prod (a push to `main`, or a dispatch with
  `deploy_target: prod`) they run and must pass.
- `build-api` / `build-worker` / `build-web` may be `skipped` **only for a
  rollback dispatch** (`rollback_sha` set); a normal deploy always builds them.
- `verify-attestations` must always be `success`: it proves each image pulled by
  the deploy was built by this repository's workflows.

## Required green checks

The `validate` reusable workflow (`validate.yml`) is the test/typecheck gate and
must be green on every deploy:

- dependency audit — `pnpm audit --audit-level=high --prod`
- tests with coverage — `pnpm test:coverage`
- OpenAPI validate and coverage audit
- docs counts and docs links guards
- generated DB types current and RLS/migration hygiene
- prompt provenance and the `review.md` mirror check
- `secrets-scan`, `lint`, and `typecheck` jobs

A normal `deploy-do` run must therefore be green in: `validate` (test, lint,
typecheck, audit, secrets), the three image builds, `verify-attestations`, and —
on prod — `e2e-gate` and `migrate-gate`.

## Production environment requirements

The deploy job runs under `prod-approval` on prod and `dev` on dev. The approval
itself is a GitHub repository setting and **cannot** be enforced from the
workflow file. Before a prod release, an owner must confirm:

- `prod-approval` (and `prod`) have the required reviewers / wait timer set in
  **Settings → Environments**.
- The `prod` environment holds the `SUPABASE_*`, `JWT_SECRET` and other secrets
  and vars the deploy job forwards (`SUPABASE_URL`, `SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_*`, `SMTP_*`, `CI_SSH_PRIVATE_KEY`, …).
  Without them the prod deploy path cannot succeed.
- `DO_API_TOKEN` is valid or a `DROPLET_IP` environment variable is set for prod
  so `resolve-ip` can resolve the droplet.

These are tracked as `CI-P1-001`; they are operator/repository actions, not
workflow changes.

## Rollback

See [ROLLBACK_PROCEDURES.md](ROLLBACK_PROCEDURES.md). Dispatch `deploy-do` with
`rollback_sha` (7–40 lowercase hex); the build jobs are skipped, the existing
GHCR images are re-deployed, and `verify-attestations` still runs (legacy images
without an attestation must be listed in the explicit allow-list in
`deploy-do.yml`). A health-gate failure during a normal deploy rolls back to the
previously running tag before the job exits non-zero.
