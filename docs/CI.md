# CI

All GitHub Actions workflows in `.github/workflows/`. Actions are pinned by
commit SHA (not tags), pnpm 10 is activated through corepack with a 3-attempt
retry, and Node 20 is used throughout. Cron workflows only run from the default
branch.

| Workflow              | File                      | Triggers                                                           | Path filter                                                                                                                                                              | What it does                                                                                                                                                      | Gate                |
| --------------------- | ------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| Test                  | `test.yml`                | PR `main`, `develop`; dispatch                                     | Every PR (required check); push-side runs via `deploy-do` → `validate.yml`                                                                                                | Coverage tests; OpenAPI validate + coverage audit; docs counts + links guards (incl. the `docs/CI.md` workflow inventory); DB-types check; RLS hygiene; all-scope dependency audit (`scripts/audit-gate.mjs`); license policy gate; Trivy fs (artifact-only — no SARIF upload, CI-P3-006); diff secret scan; promtool alert-rule check + unit tests; hadolint Dockerfile lint; terraform state-restore procedure test; required-check + CODEOWNERS guards | Blocking on PR      |
| Lint                  | `lint.yml`                | PR `main`, `develop`; dispatch                                     | Every PR (required check); push-side runs via `deploy-do` → `validate.yml`                                                                                                | `pnpm lint`                                                                                                                                                       | Blocking on PR      |
| TypeCheck             | `typecheck.yml`           | PR `main`, `develop`; dispatch                                     | Every PR (required check); push-side runs via `deploy-do` → `validate.yml`                                                                                                | `pnpm typecheck`                                                                                                                                                  | Blocking on PR      |
| E2E                   | `e2e.yml`                 | PR `main`, `develop`; `workflow_call`; dispatch (`a11y_full`, `a11y_update_baseline`)      | Every PR (required on `main`; no `paths:` — BP-P2-004/CI-P2-009/TEST-P2-009)                                                                                             | Local Supabase + built API/web; Playwright chromium + mobile (Pixel 7/iPhone 13) E2E + axe (25-route gate, 68 with `A11Y_FULL`); retry budget 2 with a flake summary in the job summary (CI-P3-009 policy below)                   | Blocking on PR (required on `main` only) |
| Validate              | `validate.yml`            | `workflow_call` only                                               | —                                                                                                                                                                        | Deploy gate: audit, coverage tests + all guards (incl. CODEOWNERS), secrets scan, lint, typecheck, prompt provenance (`verify-prompts.js`), `review.md` sync, promtool alert-rule check + unit tests, hadolint Dockerfile lint, terraform state-restore procedure test                         | Deploy gate         |
| deploy-do             | `deploy-do.yml`           | push `main`, `develop`; dispatch (`deploy_target`, `rollback_sha`) | `apps/api/**`, `apps/web/**`, `apps/worker/**`, `packages/**`, `infra/digitalocean/**`, `pnpm-lock.yaml`, `package.json`, `deploy-do.yml`                               | Build 3 GHCR images; per-image Trivy image scan (CRITICAL/HIGH) + build-provenance attestation; **deploy-time provenance + SBOM verification** (`verify-attestations` resolves the tag to a digest, verifies both predicates fail-closed, and passes the digests to `deploy`, which pulls/runs by digest — SBOM-P2-011; `deploy` `needs:` it); `validate`; prod-only E2E + migration gates; SSH deploy to the droplet with container health gate and auto-rollback to the previously running images      | Blocking            |
| terraform-do          | `terraform-do.yml`        | dispatch only                                                      | n/a                                                                                                                                                                      | `fmt -check`, validate, plan; apply requires the `apply` input (disabled until the `DO_API_TOKEN` is rotated); no PR-comment step or `pull-requests: write` (CI-P3-006)                                                     | Manual              |
| supabase-migrations   | `supabase-migrations.yml` | push `develop`, `main`; `workflow_call`; dispatch                  | `supabase/**`, `supabase-migrations.yml`                                                                                                                                 | `supabase db push --include-all` with pinned CLI 2.107.0; prod attaches the approval-gated **`prod-approval`** environment (same gate as the prod deploy and Terraform apply — BP-P3-003); serialized per branch                                                         | Migrate gate (prod) |
| build-push            | `build-push.yml`          | dispatch only                                                      | —                                                                                                                                                                        | Manual GHCR build of `mct-api`, `mct-worker`, `mct-web` (push triggers removed — `deploy-do` builds); per-image Trivy image scan (CRITICAL/HIGH), CycloneDX image SBOM bound to the pushed digest, and build-provenance attestation                                                              | Manual              |
| Chromatic             | `chromatic.yml`           | push + PR `develop`, `main`                                        | `packages/ui/**`, `apps/web/components/**`, `.storybook/**`                                                                                                              | Storybook build + Chromatic visual regression + axe per story (`a11y.test: "error"` — UX-P3-009; fails on a broken Storybook build and on visual changes once a baseline exists — CI-P2-006)                        | Failing (not required) |
| CodeQL                | `codeql.yml`              | push + PR `main`, `develop`; weekly (Mon 04:17); dispatch          | —                                                                                                                                                                        | CodeQL `javascript-typescript`, `security-and-quality`                                                                                                            | Blocking on PR      |
| A11y breadth          | `a11y-breadth.yml`        | weekly (Mon 05:23); dispatch (`update_baseline`)                   | —                                                                                                                                                                        | Calls `e2e.yml` with `a11y_full: true` — 68-route WCAG 2.2 scan that fails on violations not in `apps/web/e2e/a11y-baseline.json` (UX-P3-010)                    | Scheduled gate      |
| Dependency Review     | `dependency-review.yml`   | PR `main`, `develop`                                               | —                                                                                                                                                                        | Blocks PRs that introduce high-or-worse vulnerable dependencies                                                                                                   | Blocking on PR (required on `main` only) |
| Database Backup       | `db-backup.yml`           | daily 04:00 UTC (dev; dispatch `environment: prod` or set `PROD_BACKUP_ENABLED=true` for the prod target) | —                                                                                                                                                                        | `scripts/backup-database.sh` to Spaces (encrypted when `BACKUP_ENCRYPTION_KEY` set, optional offsite copy); records the DR-P2-008 platform heartbeat on success; ntfy/Slack alert on failure                                    | Scheduled           |
| Database Restore Test | `db-restore-test.yml`     | weekly (Mon 06:00) (dev; dispatch `environment: prod` or set `PROD_BACKUP_ENABLED=true` for the prod target) | —                                                                                                                                                                        | Restores the newest backup into a throwaway, digest-pinned `postgres:16-alpine@sha256:…` (CI-P3-007), decrypts if needed, and asserts table/migration/row/freshness/RLS floors from `.github/restore-test-baseline.env`; ntfy/Slack alert on failure | Scheduled           |
| Storage Backup        | `storage-backup.yml`      | daily 05:00 UTC; dispatch                                          | —                                                                                                                                                                        | `scripts/backup-storage.sh` mirrors the `documents`/`avatars`/`logos` buckets to Spaces; ntfy/Slack alert on failure                                             | Scheduled           |
| Storage Restore Test  | `storage-restore-test.yml` | weekly (Mon 07:00); dispatch                                      | —                                                                                                                                                                        | Verifies the newest storage archive against its manifest (object count + non-empty) via `scripts/restore-storage.sh --verify-only`; no live bucket is touched (DR-P2-002) | Scheduled           |
| Backup Staleness Check | `backup-staleness-check.yml` | daily 08:00; dispatch (`max_age_hours`, `max_age_hours_restore`) | —                                                                                                                                                                        | Asks the GitHub API for the newest SUCCESSFUL backup/restore-test run and fails when it is older than the thresholds — independent of the backup jobs, so a cron that never fired is detected (DR-P2-003) | Scheduled gate      |
| Secret history scan   | `secret-history-scan.yml` | weekly (Mon 06:00); dispatch                                       | —                                                                                                                                                                        | Full-history `gitleaks` scan (pinned + checksum-verified install — DET-P3-001) under `.gitleaks.toml`; verifies the allowlist still catches a synthetic key; uploads the JSON report; ntfy/Slack alert on failure (SECRET-P2-003) | Scheduled           |
| Secret Rotation Reminder | `secret-rotation-reminder.yml` | quarterly (1 Jan/Apr/Jul/Oct, 09:00 UTC); dispatch | —                                                                                                                                                                        | Creates a deduplicated `secret-rotation` issue linking the rotation policy and checklist (SECRET-P2-002)                                                          | Scheduled           |
| Dependabot Triage Reminder | `dependabot-triage-reminder.yml` | weekly (Mon 07:00 UTC); dispatch | —                                                                                                                                                                        | Creates a deduplicated `dependencies` issue listing the open Dependabot PRs and the triage SLA/merge rules (SBOM-P2-007 / SC-P2-005)                                 | Scheduled           |
| SBOM                  | `sbom.yml`                | push + PR `main`, `develop`; weekly (Mon 05:00); dispatch          | —                                                                                                                                                                        | CycloneDX **lockfile** SBOM (licenses + dependency graph + commit binding) via `scripts/generate-sbom.mjs`, validated before upload; 30-day artifact (container **image** SBOMs are emitted and validated on both `build-push.yml` and `deploy-do.yml`, and the deploy path attests them to the registry)                          | Artifact-only (not a gate) |
| Dependency Re-scan    | `dependency-rescan.yml`   | weekly (Mon 06:00); dispatch                                        | —                                                                                                                                                                        | Report-only re-run of `scripts/audit-gate.mjs --report` over the resolved tree, a Trivy filesystem scan and `pnpm dedupe --check` (SC-P3-014); uploads the `dependency-rescan` artifact (SBOM-P2-012)                                                                 | Scheduled (non-blocking) |
| Third-party image scan | `third-party-image-scan.yml` | weekly (Mon 07:00); dispatch                                  | —                                                                                                                                                                        | Resolves the digest-pinned redis/caddy/prometheus/alertmanager refs from `infra/digitalocean/docker-compose.yml`, fails if any literal image ref is not `@sha256:`-pinned (DET-P3-002), Trivy-scans each (CRITICAL/HIGH, fixable) and emits a digest-bound CycloneDX SBOM artifact (CTR-P3-007 / SBOM-P3-008); ntfy/Slack alert on failure | Scheduled (not a gate) |
| Alert path exercise   | `alert-path-exercise.yml` | monthly (1st 09:00 UTC); dispatch (`environment`)                  | —                                                                                                                                                                        | Posts a synthetic `critical` alert through Alertmanager and verifies the webhook delivery counters (no failures); direct ntfy relay check; evidence in the run summary; see `ALERT_PATH_EXERCISE.md`                            | Triage-only (not a gate) |
| Branch Protection Audit | `branch-protection-audit.yml` | weekly (Mon 07:45); dispatch (`lookback_days`)                | —                                                                                                                                                                        | **Drift**: committed `.github/branch-protection/*.json` vs live protection (normalized, artifacts, fails + ntfy; needs `BRANCH_PROTECTION_READ_TOKEN` — default `GITHUB_TOKEN` cannot read protection). **Bypass**: merged PRs into `main`/`develop` whose head check-runs missed/failed a required context → deduplicated `[break-glass]` record issues (BP-P2-002/003; see `RUNBOOK_EMERGENCY_MERGE.md`) | Scheduled (triage-only) |
| Load Test             | `load-test.yml`           | weekly (Mon 09:30 UTC); dispatch (`scenario`, `target`, `api_base_url`) | —                                                                                                                                                                        | k6 scenarios against the dev/prod public API with committed budgets (`scripts/load-testing/budgets.js`) — k6 exits 99 on a p95/p99 or error-rate breach; failure-injection control asserts a simulated 5xx burst breaches the error budget; ntfy/Slack alert on failure (TEST-P2-004) | Scheduled/dispatch (not a gate) |
| External uptime probe | `external-uptime-probe.yml` | hourly (:23); dispatch (`targets`)                                | —                                                                                                                                                                        | Curls the public API/web endpoints from the runner and asserts status + latency budgets (`scripts/uptime/probe-targets.json`, `UPTIME_PROBE_TARGETS` override); detects DNS/Cloudflare/edge failures the in-stack Prometheus cannot; ntfy/Slack alert on failure (OBS-P2-016) | Scheduled/dispatch (not a gate) |
| Release               | `release.yml`             | push `main`; dispatch (`dry_run`)                                  | —                                                                                                                                                                        | Cuts the `v<VERSION>-<YYYYMMDD>-<short-sha>` tag + GitHub Release on promotion with a generated notes body (commits since the previous tag, migrations added, `UPGRADE.md` window) and the lockfile SBOM attached; idempotent per commit (CI-P3-008) | Release artifact    |
| Smoke check           | `smoke-check.yml`         | every 30 min (`17,47 * * * *`); dispatch (`target`)                | —                                                                                                                                                                        | API `/health`, web `/login` and an authenticated read (sign-in + `GET /api/v1/auth/me`) from outside the droplet (TEST-P3-002); dev by default, prod when `SMOKE_PROD_ENABLED=true`; the auth read is skipped until `SMOKE_EMAIL`/`SMOKE_PASSWORD` are provisioned; ntfy/Slack alert on failure | Scheduled           |

## Deploy pipeline

`deploy-do.yml` for a push to `develop` or `main`:

```
setup → resolve-ip
      → build-api ∥ build-worker ∥ build-web ∥ validate
      → e2e-gate + migrate-gate        (prod only; skipped on dev)
      → verify-attestations
      → deploy (fail-closed: validate + builds + verify-attestations success;
                 e2e-gate/migrate-gate may be skipped on dev only)
```

`deploy` writes the droplet `.env` via `printf` (secrets never interpolate into
the remote shell), pulls the verified image digests, restarts the compose stack,
and only prunes old images after every healthchecked service (redis, api,
worker, web, alertmanager, prometheus, caddy) reports healthy. A failed health
gate rolls back to the previously running images.

### Provenance verification at deploy (CTR-P1-003)

Before any pull happens, the `verify-attestations` job proves each of
`mct-api`, `mct-worker` and `mct-web` carries **both** attestations this
pipeline produces, signed by **this repository's** `deploy-do.yml` and bound to
the exact digest being deployed:

- the SLSA build-provenance predicate (`https://slsa.dev/provenance/v1`), and
- the CycloneDX SBOM predicate (`https://cyclonedx.org/bom`, SBOM-P2-011).

The deploy job `needs:` this job, so a failure blocks the deploy and appears as
its own node in the workflow graph.

The attestations are bound to a **digest**, so the job resolves each tag first
and publishes the resolved digests as job outputs:

```bash
# 1. tag -> immutable digest
DIGEST=$(docker buildx imagetools inspect \
  ghcr.io/<owner>/mct-api:$IMAGE_TAG --format '{{.Manifest.Digest}}')
# 2. verify both attestations for that digest
gh attestation verify "oci://ghcr.io/<owner>/mct-api@$DIGEST" \
  --repo <owner>/<repo> \
  --signer-workflow <owner>/<repo>/.github/workflows/deploy-do.yml \
  --source-digest "$IMAGE_TAG" \
  --predicate-type https://slsa.dev/provenance/v1
gh attestation verify "oci://ghcr.io/<owner>/mct-api@$DIGEST" \
  --repo <owner>/<repo> \
  --signer-workflow <owner>/<repo>/.github/workflows/deploy-do.yml \
  --source-digest "$IMAGE_TAG" \
  --predicate-type https://cyclonedx.org/bom
```

The `--signer-workflow` and `--source-digest` flags tighten the check beyond the
required `--repo`: they pin the exact signing workflow and the commit that
produced the image. The job needs `packages: read` (registry auth to resolve the
tag and fetch the OCI referrers bundle) and `id-token: write`.

**The deploy pulls and runs the verified digests, not the tags** (SBOM-P2-011):
the `deploy` job receives the digests as outputs and exports
`MCT_<SERVICE>_IMAGE=<repo>@sha256:...` for compose
(`infra/digitalocean/docker-compose.yml`), so re-pointing the mutable tag after
verification cannot substitute the artifact. The tag-based compose default
remains only for manual operator runs (`IMAGE_TAG=<sha> docker compose up -d`).

**Policy:**

- **Normal deploy (no `rollback_sha`)** — **fail closed**. The images were just
  built and attested by this run; any missing, malformed, wrong-repo,
  mismatched-subject or missing-predicate attestation hard-fails the job.
- **Rollback (`rollback_sha` set)** — **fail closed, with an explicit allow-list
  of legacy digests**. Verification is never bypassed. A rollback image must
  either pass both `gh attestation verify` checks normally, or its digest must
  appear in the matching `LEGACY_MCT_*` list in `deploy-do.yml` (empty by
  default; adding one is a reviewed PR), in which case it is recorded as an
  allow-listed, unverified rollback in the job summary. A rollback still runs by
  its resolved digest.

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

A weekly **plan-only drift check** (`schedule`, Mondays 07:00 UTC) is wired in
but stays dormant (`terraform-plan` is skipped) until the operator sets the
repository variable `TF_DRIFT_PLAN_ENABLED=true` — do this after rotating
`DO_API_TOKEN`. When enabled, the run fails if the plan is non-empty so drift is
visible; it never applies (`CI-P2-002`).

## Non-required and manual jobs

- **Chromatic** — no job-level `continue-on-error` (CI-P2-006). A broken
  Storybook build fails the job, and once a baseline exists a visual change
  fails it too (`exitZeroOnChanges: false`). Since UX-P3-009 the a11y addon is
  also asserted per story (`parameters.a11y.test: "error"` in
  `.storybook/preview.tsx`), so Chromatic runs axe as part of the same build.
  It is **not** a required check yet: promoting it in branch protection is a
  repo-admin action.
  - **Storybook webpack pin (TEST-P3-001, DOC-P3-010):** the
    `SB_BUILDER-WEBPACK5_0002` break (webpack ≥ 5.101.3 / Storybook 8.6.x
    mismatch; upstream `storybookjs/storybook#32301`, fixed for Storybook ≥ 9
    in `storybookjs/storybook#32306`) is **fixed by the webpack 5.101.2 pin**
    (#280, root `package.json` `pnpm.overrides`). The post-pin Chromatic run
    builds Storybook and fails only at the visual-diff step — the build break is
    no longer the signal. Do not re-add `continue-on-error`.
- **A11y breadth** — no `continue-on-error` (the old doc claim was wrong); a
  weekly/manual 68-route WCAG 2.2 scan that fails on critical/serious
  violations not recorded in `apps/web/e2e/a11y-baseline.json` (UX-P3-010).
  The baseline is empty, so the effective contract is zero-tolerance; record
  accepted debt explicitly instead of skipping routes. Fix findings and
  promote routes into the default 25-route gate rather than widening the prod
  gate with known failures. Promoting the workflow itself to a required check
  is a repo-admin branch-protection action.
- **build-push** — manual dispatch only; regular builds happen in `deploy-do`.

## Release tagging (CI-P3-008)

`release.yml` runs on every promotion push to `main` and cuts an annotated tag
plus GitHub Release bound to `VERSION` + date + commit:
`v<VERSION>-<YYYYMMDD>-<short-sha>`. The release body is generated (commits
since the previous tag, the migration files added in the range, the current
`UPGRADE.md` window) with a pointer to
[`templates/RELEASE_NOTES_TEMPLATE.md`](../templates/RELEASE_NOTES_TEMPLATE.md)
for the human-authored Breaking Changes / Operator Actions sections; the
lockfile CycloneDX SBOM is generated in-job and attached. Re-runs of the same
commit are idempotent (the tag check exits 0). A `workflow_dispatch` on a
non-main ref only uploads the notes/SBOM as artifacts — it never creates a
release off `main`. The commit SHA remains authoritative for images; the tag is
the release record (see [`RELEASING.md`](RELEASING.md)).

## Smoke check (TEST-P3-002)

`smoke-check.yml` runs every 30 minutes and exercises the user path from
outside the droplet with `scripts/uptime/smoke.mjs`: API `/health`, the web
`/login` page, and an authenticated read (`POST /api/v1/auth/sign-in` then
`GET /api/v1/auth/me`). It targets **dev by default**; prod is included once
the operator sets the `SMOKE_PROD_ENABLED` repository variable to `true` (the
prod environment must exist first). Until the `SMOKE_EMAIL` / `SMOKE_PASSWORD`
secrets are provisioned, the authenticated read is reported as skipped — health
and login still gate. Failures alert through the shared ntfy/Slack path. See
[`MONITORING_AND_ALERTING.md`](MONITORING_AND_ALERTING.md) and
[`GITHUB_SECRETS_AND_VARIABLES_MATRIX.md`](GITHUB_SECRETS_AND_VARIABLES_MATRIX.md).

## E2E flake policy (CI-P3-009)

E2E stays a **required check on `main`**; the policy is a documented retry
budget plus measured triage, not a hard fail-on-flake gate:

- `apps/web/playwright.config.ts` retries a failed test up to **2** times in
  CI. A test that only passes on retry is reported by
  `scripts/e2e-flake-summary.mjs` in the job summary and as a warning
  annotation — it does **not** fail the job.
- A test that fails after all retries fails the job (and the required check).
  A failure is treated as a product regression unless it appears in the flake
  summary of the same run.
- Triage: a spec that flakes twice in a rolling week (visible in the job
  summaries) gets quarantined with `test.fixme()` referencing a tracking issue,
  or fixed by replacing the wait; the E2E required check is never relaxed.
  `docs/testing.md` owns the flake-triage checklist.

## Reports and badges (CI-P3-012)

There is intentionally **no badge generator**. The former
`scripts/ci/generate_badges.py` / `scripts/ci/history_logger.py` stubs wrote
fake SVGs from a `dashboards/data/sample_data.json` that does not exist in this
repo and were never wired into CI (removed). The real, CI-produced reports are:

- the `coverage-reports` artifact (per-package coverage output +
  `.jest-results.json`) uploaded by the shared `unit-tests` composite on every
  PR and deploy-gate run (TEST-P3-003), and
- the job summaries (E2E flake, smoke check, backup/restore, branch-protection
  audits) plus the workflow-specific artifacts listed above.

Add a badge only if a real public consumer exists; do not reintroduce a stub.

## CODEOWNERS enforcement (BP-P3-005)

`require_code_owner_reviews: true` is only effective when every
`@org/team` handle in [`.github/CODEOWNERS`](../.github/CODEOWNERS) resolves to
a real team. `scripts/check-codeowners.mjs` (run by the shared `unit-tests`
composite, with a fixture-driven self-test in `scripts/ci/check-codeowners.sh`)
fails on syntax errors, a missing catch-all rule, and — when
`CODEOWNERS_READ_TOKEN` is set (fine-grained PAT with **Organization →
Members: read**) — any handle the API reports as missing. Without the token the
guard runs the documented syntax-only fallback, so the check degrades instead
of breaking. The token is optional and additive; once set, a nonexistent team
fails the gate until the team is created or the map fixed.

## Third-party image pins (DET-P3-002)

Every literal (non-`$`) image reference in
`infra/digitalocean/docker-compose.yml` must be pinned by digest
(`image@sha256:…`); `third-party-image-scan.yml` fails its `resolve` job if one
is not. The three refs a tag-based scan flags — `mct-api` / `mct-worker` /
`mct-web` — are the repo's own images: they are built, scanned and attested by
CI, and `deploy-do.yml` resolves each tag to its manifest digest and passes
`MCT_<SERVICE>_IMAGE` so the deploy pulls and runs by digest (SBOM-P2-011).
Their compose default keeps the mutable tag only for manual operator runs — a
static digest cannot be committed because the images are built per commit.

## Code scanning (CodeQL)

`codeql.yml` runs `security-and-quality` for `javascript-typescript` on every PR
to `main`/`develop` (plus pushes and a weekly schedule). **The PR check is
blocking**: a PR that introduces new alerts fails until they are fixed or
resolved on the alert itself.

Dismissals are per-alert and must stand on their own:

- Only dismiss a **confirmed false positive** (`dismissed_reason: "false
  positive"`) with a concrete `dismissed_comment` that names the mitigating
  code — e.g. a heuristic-sensitive variable name whose value is an opaque UUID,
  or a guard that precedes (and cannot skip) a cryptographic verification.
- Prefer a code fix; use "won't fix"/"used in tests" only with the same level
  of justification. Never silence a class of alerts with a broad path filter
  without documenting why in `.github/codeql/` and in the PR.
- Record each dismissal (alert number + justification) in the PR body so the
  audit trail stays reviewable.

## Repo-wide CI conventions

- Every workflow installs pnpm with `corepack enable` +
  `corepack prepare pnpm@10 --activate` inside a retry loop (do not use
  `pnpm/action-setup` or `cache: pnpm` on `actions/setup-node`).
- `validate.yml` is the shared deploy gate; keep its steps in parity with
  `test.yml`.
- The docs-counts, docs-links, DB-types and RLS-hygiene guards run in both
  `test.yml` and `validate.yml`, so a deploy cannot ship drifted docs or schema
  state. The docs-counts guard also verifies the `docs/testing.md`
  coverage-threshold table against the jest configs, the per-package suite
  counts against the tree, and — with `MCT_VERIFY_TEST_COUNTS=1` (set in the
  `unit-tests` composite) — the per-package test totals against the
  `.jest-results.json` written by `test:coverage` (TEST-P2-007/008). The
  docs-links guard also cross-references this file's workflow table against
  `.github/workflows/` (CI-P3-011): a removed workflow left in the table or a
  new one missing from it fails the build.
- Every job declares `timeout-minutes` (CI-P3-010) — a hung install or network
  step must not hold a runner for the 360-minute default. Use the existing
  values as the guide: 5–15 for lint/typecheck/audit/summary jobs, 25–30 for
  migrations/backups/terraform, 45–60 for E2E, deploy and apply jobs. A job
  that calls a reusable workflow (`uses:`) cannot declare one — GitHub only
  allows `name`/`uses`/`with`/`secrets`/`needs`/`if`/`permissions` there — so
  the callee's own jobs must carry the timeout (`validate.yml`, `e2e.yml`,
  `supabase-migrations.yml` do).
- The E2E job writes a Playwright JSON report and prints a flake summary
  (retried tests) to the job summary on every run, including the `a11y-breadth`
  call (TEST-P2-003). Note the gate asymmetry: E2E runs on every PR, but the
  **deploy-time** E2E gate is prod-only (`deploy-do.yml` `if: name == 'prod'`),
  so dev deploys rely on the PR run and the prod gate stays unexercised until
  the `prod-approval` environment has its secrets and reviewers (operator
  action).
- Every required check (`test`/`security-scan`/`secrets-scan`, `lint`,
  `typecheck`, `e2e`, `Dependency Review`, `CodeQL`) deliberately has **no
  `paths:` filter on `pull_request`** (BP-P2-004 / CI-P2-009): a path-filtered
  required check never reports on PRs that miss its paths, leaving them blocked
  or unguarded. `scripts/check-required-checks.mjs` (run by the `unit-tests`
  composite in both gates) fails when a required context stops resolving or its
  workflow becomes path-filtered (BP-P2-005), and models GitHub's matrix
  check-run names — including an explicit job name plus a matrix, which emits
  `<name> (<value>)` (BP-P3-004; fixture-tested in
  `scripts/ci/check-required-checks.sh`).
- `test.yml`, `lint.yml` and `typecheck.yml` are **PR-only**. On pushes to
  `develop`/`main` the same suites run once through `deploy-do` → `validate.yml`
  (which also carries the push-side Trivy filesystem scan); running both paths
  duplicated the full test/audit/lint/typecheck set on every push. `deploy-do`
  triggers on `pnpm-lock.yaml`/`package.json` so dependency-only pushes are
  still gated.
- Scheduled DR workflows (`db-backup`, `storage-backup`, `db-restore-test`)
  run directly from the default branch (`main`); the interim
  `backup-dispatch.yml` dispatcher was retired once the files landed on `main`
  (CI-P2-010).
- Every job that installs dependencies caches the pnpm store with
  `actions/cache` (keyed on `pnpm-lock.yaml`, partial reuse via `restore-keys`).
  Do not use `setup-node`'s `cache: pnpm` — it resolves pnpm before corepack
  installs it. PR runs cancel their superseded predecessors via per-workflow
  `concurrency` groups.
- Shared step sequences live in `.github/actions/*` composite actions —
  `setup-pnpm` (Node + corepack + store cache + install), `unit-tests`,
  `dependency-audit`, `secret-scan` and `prometheus-rules`. `test.yml` and
  `validate.yml` both call them, so the PR gate and the push/deploy gate cannot
  drift apart; edit the composite, not the workflows.
