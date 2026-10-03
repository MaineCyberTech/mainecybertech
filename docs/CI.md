# CI

All GitHub Actions workflows in `.github/workflows/`. Actions are pinned by
commit SHA (not tags), pnpm 10 is activated through corepack with a 3-attempt
retry, and Node 20 is used throughout. Cron workflows only run from the default
branch.

| Workflow              | File                      | Triggers                                                           | Path filter                                                                                                                                                              | What it does                                                                                                                                                      | Gate                |
| --------------------- | ------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| Test                  | `test.yml`                | push + PR `main`, `develop`; dispatch                              | Every PR (required check); push filtered: `apps/**`, `packages/**`, `pnpm-lock.yaml`, `package.json`, `test.yml`                                                         | Coverage tests; OpenAPI validate + coverage audit; docs counts + links guards; DB-types check; RLS hygiene; all-scope dependency audit (`scripts/audit-gate.mjs`); license policy gate; Trivy fs (SARIF); diff secret scan | Blocking            |
| Lint                  | `lint.yml`                | push + PR `main`, `develop`; dispatch                              | Every PR (required check); push filtered: `apps/**`, `packages/**`, `pnpm-lock.yaml`, `package.json`, `lint.yml`                                                         | `pnpm lint`                                                                                                                                                       | Blocking            |
| TypeCheck             | `typecheck.yml`           | push + PR `main`, `develop`; dispatch                              | Every PR (required check); push filtered: `apps/**`, `packages/**`, `pnpm-lock.yaml`, `package.json`, `typecheck.yml`                                                    | `pnpm typecheck`                                                                                                                                                  | Blocking            |
| E2E                   | `e2e.yml`                 | PR `main`, `develop`; `workflow_call`; dispatch (`a11y_full`)      | `apps/web/e2e/**`, `apps/web/playwright.config.ts`, `apps/web/app/**`, `apps/web/components/**`, `packages/**`, `supabase/seeds/**`, `supabase/migrations/**`, `e2e.yml` | Local Supabase + built API/web; Playwright chromium E2E + axe (25-route gate, 68 with `A11Y_FULL`)                                                                | Blocking on PR      |
| Validate              | `validate.yml`            | `workflow_call` only                                               | —                                                                                                                                                                        | Deploy gate: audit, coverage tests + all guards, secrets scan, lint, typecheck, prompt provenance (`verify-prompts.js`), `review.md` sync                         | Deploy gate         |
| deploy-do             | `deploy-do.yml`           | push `main`, `develop`; dispatch (`deploy_target`, `rollback_sha`) | `apps/api/**`, `apps/web/**`, `apps/worker/**`, `packages/**`, `infra/digitalocean/**`, `deploy-do.yml`                                                                  | Build 3 GHCR images; per-image Trivy image scan (CRITICAL/HIGH) + build-provenance attestation; **deploy-time provenance verification** (`verify-attestations` resolves the tag to a digest and runs `gh attestation verify`, fail-closed; `deploy` `needs:` it); `validate`; prod-only E2E + migration gates; SSH deploy to the droplet with container health gate and auto-rollback to the previous tag      | Blocking            |
| terraform-do          | `terraform-do.yml`        | dispatch only                                                      | n/a                                                                                                                                                                      | `fmt -check`, validate, plan; apply requires the `apply` input (disabled until the `DO_API_TOKEN` is rotated)                                                     | Manual              |
| supabase-migrations   | `supabase-migrations.yml` | push `develop`, `main`; `workflow_call`; dispatch                  | `supabase/**`, `supabase-migrations.yml`                                                                                                                                 | `supabase db push --include-all` with pinned CLI 2.107.0; `prod`/`dev` environment; serialized per branch                                                         | Migrate gate (prod) |
| build-push            | `build-push.yml`          | dispatch only                                                      | —                                                                                                                                                                        | Manual GHCR build of `mct-api`, `mct-worker`, `mct-web` (push triggers removed — `deploy-do` builds); per-image Trivy image scan (CRITICAL/HIGH), CycloneDX image SBOM bound to the pushed digest, and build-provenance attestation                                                              | Manual              |
| Chromatic             | `chromatic.yml`           | push + PR `develop`, `main`                                        | `packages/ui/**`                                                                                                                                                         | Storybook build + Chromatic visual regression                                                                                                                     | Best-effort         |
| CodeQL                | `codeql.yml`              | push + PR `main`, `develop`; weekly (Mon 04:17); dispatch          | —                                                                                                                                                                        | CodeQL `javascript-typescript`, `security-and-quality`                                                                                                            | Blocking            |
| A11y breadth          | `a11y-breadth.yml`        | weekly (Mon 05:23); dispatch                                       | —                                                                                                                                                                        | Calls `e2e.yml` with `a11y_full: true` — 68-route WCAG 2.2 triage scan                                                                                            | Triage-only         |
| Dependency Review     | `dependency-review.yml`   | PR `main`, `develop`                                               | —                                                                                                                                                                        | Blocks PRs that introduce high-or-worse vulnerable dependencies                                                                                                   | Blocking on PR      |
| Database Backup       | `db-backup.yml`           | daily 04:00 UTC; dispatch                                          | —                                                                                                                                                                        | `scripts/backup-database.sh` to Spaces (encrypted when `BACKUP_ENCRYPTION_KEY` set, optional offsite copy); Slack alert on failure                                    | Scheduled           |
| Database Restore Test | `db-restore-test.yml`     | weekly (Mon 06:00); dispatch                                       | —                                                                                                                                                                        | Restores the newest backup into a throwaway local `postgres:16`, decrypts if needed, and asserts table/migration/row/freshness/RLS floors from `.github/restore-test-baseline.env`; Slack alert on failure | Scheduled           |
| Storage Backup        | `storage-backup.yml`      | daily 05:00 UTC; dispatch                                          | —                                                                                                                                                                        | `scripts/backup-storage.sh` mirrors the `documents`/`avatars`/`logos` buckets to Spaces; Slack alert on failure                                                    | Scheduled           |
| Backup Dispatcher     | `backup-dispatch.yml`     | daily 04:00 + weekly Mon 06:00; dispatch                           | —                                                                                                                                                                        | Runs **on `main`** to `workflow_dispatch` the develop backup/restore workflows (schedules only fire from the default branch — audit DR-P0-001); fails loudly without `SCHEDULE_DISPATCH_TOKEN` | Scheduled           |
| SBOM                  | `sbom.yml`                | push + PR `main`, `develop`; weekly (Mon 05:00); dispatch          | —                                                                                                                                                                        | CycloneDX **lockfile** SBOM (licenses + dependency graph + commit binding) via `scripts/generate-sbom.mjs`, validated before upload; 30-day artifact (container **image** SBOMs are emitted by `build-push.yml`)                          | Artifact-only (not a gate) |

## Deploy pipeline

`deploy-do.yml` for a push to `develop` or `main`:

```
setup → resolve-ip
      → build-api ∥ build-worker ∥ build-web ∥ validate
      → e2e-gate + migrate-gate        (prod only; skipped on dev)
      → verify-attestations
      → deploy (always() && !failure() && !cancelled())
```

`deploy` writes the droplet `.env` via `printf` (secrets never interpolate into
the remote shell), pulls the images, restarts the compose stack, and only
prunes old images after the API, web and worker containers report healthy. A
failed health gate rolls back to the previously running tag.

### Provenance verification at deploy (CTR-P1-003)

Before any pull happens, the `verify-attestations` job proves each of
`mct-api`, `mct-worker` and `mct-web` carries a build-provenance attestation
signed by **this repository's** `deploy-do.yml`, bound to the exact digest
being deployed. The deploy job `needs:` this job, so a failure blocks the
deploy and appears as its own node in the workflow graph.

The images are pulled by **tag** (`IMAGE_TAG` = the commit SHA) but the
attestation is bound to a **digest**, so the job resolves the tag first:

```bash
# 1. tag -> immutable digest
DIGEST=$(docker buildx imagetools inspect \
  ghcr.io/<owner>/mct-api:$IMAGE_TAG --format '{{.Manifest.Digest}}')
# 2. verify the attestation for that digest
gh attestation verify "oci://ghcr.io/<owner>/mct-api@$DIGEST" \
  --repo <owner>/<repo> \
  --signer-workflow <owner>/<repo>/.github/workflows/deploy-do.yml \
  --source-digest "$IMAGE_TAG"
```

`gh attestation verify` defaults to the `https://slsa.dev/provenance/v1`
predicate type, which is what `actions/attest-build-provenance` emits, so no
`--predicate-type` flag is needed. The additional `--signer-workflow` and
`--source-digest` flags tighten the check beyond the required `--repo`: they
pin the exact signing workflow and the commit that produced the image. The job
needs `packages: read` (registry auth to resolve the tag and fetch the OCI
referrers bundle) and `id-token: write`.

**Policy:**

- **Normal deploy (no `rollback_sha`)** — **fail closed**. The images were just
  built and attested by this run; any missing, malformed, wrong-repo or
  mismatched-subject attestation hard-fails the job.
- **Rollback (`rollback_sha` set)** — **fail closed, with an explicit allow-list
  of legacy digests**. Verification is never bypassed. A rollback image must
  either pass `gh attestation verify` normally, or its digest must appear in the
  matching `LEGACY_MCT_*` list in `deploy-do.yml` (empty by default; adding one
  is a reviewed PR), in which case it is recorded as an allow-listed, unverified
  rollback in the job summary.

  > An earlier design tried to "verify when an attestation exists, tolerate its
  > absence". That is not implementable: `gh attestation verify` signals absent,
  > malformed, wrong-repo, wrong-signer-workflow and digest-mismatch all with the
  > same non-zero exit status, so the shell cannot tell "missing" from "invalid" -
  > and wrapping it in an `if` also disabled `set -e`, letting a forged or
  > wrong-workflow attestation through. Hence the allow-list.

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
  WCAG 2.2 scan. Fix findings and promote routes into the default 25-route
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
- The required checks (`test`, `lint`, `typecheck`) deliberately have **no
  `paths:` filter on `pull_request`** (BP-P2-004): a path-filtered required
  check never reports on docs-only PRs, leaving them blocked or unguarded.
  Their `paths` filters still apply to `push` runs to save CI minutes.
