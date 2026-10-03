# GitHub Actions, CI/CD, and Governance Audit

## Audit Metadata

- Audit name: repo-deep-dive
- Run: 20261002-0344-develop-6286137
- Repository: C:\temp\mainecybertech (MCT client portal monorepo; origin `MaineCyberTech/mainecybertech` per `.github/branch-protection/README.md`)
- Branch: develop
- Commit SHA: 62861370 (short form as supplied; full SHA not resolvable in this environment — see Scope limitations)
- Generated at: 2026-10-02 03:44 UTC
- Auditor: principal-level repository auditor (fresh pass; prior reports used only for diffing, not as evidence)
- Area code: CI
- Output path: docs/audits/repo-deep-dive/20261002-0344-develop-6286137/10_github_actions_cicd_governance.md
- Scope limitations:
  - `git` and `node` are not on PATH in the audit environment (see Verification Performed), so the commit SHA could not be independently re-resolved and repo scripts (`sync-review-md.mjs --check`, `verify-prompts.js verify`) could not be executed. Their *source* was read instead and claims are marked `not reproducible`.
  - GitHub branch-protection *effective* state, environment protection rules (required reviewers), and secret existence/values live in GitHub settings and were **not** verifiable from the repository. Findings about those are labelled `Unknown` or cite the repo's own committed assertion and mark it `unverified`.
  - No GitHub-hosted runner logs or live workflow runs were inspected; all behavior is inferred from committed workflow/config content.
  - Secret **values** were never printed; only secret/variable **names** appear in this report.

## Scope

Reviewed all 16 workflow files under `.github/workflows/`:
`a11y-breadth`, `build-push`, `chromatic`, `codeql`, `db-backup`, `db-restore-test`, `dependency-review`, `deploy-do`, `e2e`, `lint`, `sbom`, `supabase-migrations`, `terraform-do`, `test`, `typecheck`, `validate`.

Also reviewed the governance/config surface: `.github/branch-protection/{README.md,main.json,develop.json}`, `.github/dependabot.yml`, `.github/CODEOWNERS`, `.github/PULL_REQUEST_TEMPLATE.md`, root `package.json` scripts, `scripts/scan-secrets.sh`, `scripts/sync-review-md.mjs`, `scripts/verify-prompts.js`, `scripts/backup-database.sh`, and the documentation that asserts CI/CD behavior (`AGENTS.md`, `review.md`, `README.dev.md`, `docs/RELEASING.md`, `docs/GITHUB_SECRETS_AND_VARIABLES_MATRIX.md`, `docs/ROLLBACK_PROCEDURES.md`).

Not reviewed: container runtime internals (companion prompt 36), supply-chain/licence policy depth (prompts 11/35), and infra drift (prompt 12). Application source is out of scope except where a workflow step invokes a named script.

## Evidence Reviewed

| Evidence | Type | Why relevant | Notes |
|---|---|---|---|
| `.github/workflows/deploy-do.yml` (535 lines) | Workflow | Main build + deploy pipeline and its gates | Read in full; gates, env resolution, health checks, rollback |
| `.github/workflows/validate.yml` (198 lines) | Workflow (reusable) | Deploy/infra gate: audit/test/lint/typecheck/secrets-scan/prompt-provenance | Read in full; `audit` now hard-fails |
| `.github/workflows/terraform-do.yml` (232 lines) | Workflow | Terraform plan/apply governance | Manual-only trigger; `prod-approval` env; gates |
| `.github/workflows/test.yml` (166 lines) | Workflow | PR/push tests + coverage + audit + trivy + secrets-scan | Read in full |
| `.github/workflows/e2e.yml` (170 lines) | Workflow | Playwright E2E; reusable prod gate | Pinned `supabase@2.107.0` |
| `.github/workflows/supabase-migrations.yml` (65 lines) | Workflow | `supabase db push` | Pinned CLI + concurrency group |
| `.github/workflows/build-push.yml` (111 lines) | Workflow | GHCR image publish | Push trigger removed; manual + reusable only |
| `.github/workflows/{lint,typecheck,sbom,codeql,chromatic,dependency-review,db-backup,db-restore-test,a11y-breadth}.yml` | Workflows | PR gates + scans + scheduled jobs | Read in full |
| `.github/branch-protection/{README.md,main.json,develop.json}` | Governance config | Branch-protection-as-code + declared required checks | New since prior audit; reviewed line by line |
| `.github/CODEOWNERS` | Governance config | Review ownership | Present; team-based |
| `.github/dependabot.yml` | Governance config | npm/GHA/docker/terraform updates | Weekly; grouped |
| `.github/PULL_REQUEST_TEMPLATE.md` | Governance config | PR checklist | Present |
| `AGENTS.md` + `review.md` (generated mirror) | Documentation | Asserts CI/CD behavior (Known Debt line 59) | Cross-checked against workflows |
| `docs/RELEASING.md`, `README.dev.md`, `docs/ROLLBACK_PROCEDURES.md`, `docs/GITHUB_SECRETS_AND_VARIABLES_MATRIX.md` | Documentation | Claimed gates/approvals/secrets | Cross-checked against workflows |
| `scripts/scan-secrets.sh`, `scripts/sync-review-md.mjs`, `scripts/verify-prompts.js`, `scripts/backup-database.sh` | Script | Steps invoked by workflows | Source read |

## Verification Performed

| Evidence | Type | Why relevant | Notes |
|---|---|---|---|
| Environment toolchain probe (`git`, `node` on PATH) | Command | Reproduce commit SHA and run repo checks | Both **absent**; SHA not independently re-resolved; script checks `not reproducible` |
| `Get-ChildItem .github/workflows` | Command | Enumerate workflows | 16 files confirmed (matches AGENTS.md line 103) |
| `Select-String '^  [a-zA-Z0-9_-]+:'` across workflows | Command | Extract job names for check-name drift | Produced the job/check-name table used below |
| `Select-String 'uses:\s'` + regex `@[0-9a-f]{40}` | Command | Verify action pinning | **All** external `uses:` are 40-hex SHA-pinned; only 7 local `./.github/workflows/*` reusable calls are unpinned (correct) |
| `Select-String 'pull_request_target|workflow_run'` | Command | Privileged-trigger danger check | **No matches** in any workflow |
| `Select-String 'permissions:'` | Command | Least-privilege coverage | **16/16** workflows declare `permissions:` |
| `Select-String 'continue-on-error'` | Command | Identify soft gates | Only `chromatic.yml` (job-level), `terraform-do.yml:105` (`false`, i.e. hard), and a `test.yml` comment |
| `Select-String 'environment:|prod-approval'` | Command | Approval-gate mapping | `deploy-do` deploy → `prod`; `supabase-migrations` → `prod`; `terraform-apply-prod` → `prod-approval` |
| Read `AGENTS.md:59` Known Debt | Doc | Source of truth for infra/ops debt | States `prod`/`prod-approval` have **no protection rules** |
| Read `docs/GITHUB_SECRETS_AND_VARIABLES_MATRIX.md:3-7,89-94` | Doc | Environment config assertion | States `prod`/`prod-approval` have no protection rules |
| Webhook/secret pattern diff (`test.yml:153` vs `validate.yml:112`) | Read | Secret-scanner coverage | Identical pattern lists; no DO/CF/Supabase token patterns |
| prior audit `20260806-1722-develop-75d3926/10_...md` | Prior report | Regression/closure diffing | Used to check which prior findings closed |

**Reproduction results for prior-audit headline claims at the current commit:**

| Prior claim | Current outcome | Evidence |
|---|---|---|
| CI-P1-001: `build-push.yml` races `deploy-do.yml` on GHCR tags | `supported` as fixed — build-push `on:` is `workflow_dispatch` only, push triggers removed | `build-push.yml:1-6` |
| CI-P2-003: unpinned Supabase CLI + concurrent `db push` | `supported` as fixed — `npm install -g supabase@2.107.0`; `concurrency: supabase-migrations-${{ github.ref }}` | `supabase-migrations.yml:17-19,50` |
| CI-P2-004: loose post-deploy health checks | `supported` as fixed — API requires exactly HTTP 200; web accepts only 200/301/302/307; container health gate added | `deploy-do.yml:504-505,529,457-477` |
| CI-P2-005: deploy audit non-blocking | `supported` as fixed — `validate.yml` audit step has no `continue-on-error`; comment says "Hard fail" | `validate.yml:32-38` |
| CI-P2-006: Trivy SARIF never uploaded to code scanning | `partially supported` — no `upload-sarif` exists, but a CodeQL workflow was added that does upload to code scanning | `test.yml:132-138`; `codeql.yml:37-40` |
| CI-P3-007: unpinned Supabase CLI in e2e | `supported` as fixed — pinned `supabase@2.107.0` | `e2e.yml:69-75` |
| CI-P3-008: 3 workflows missing `permissions:` | `supported` as fixed — 16/16 declare it | grep result |
| CI-P3-009: secret patterns miss DO/CF/Supabase | `still-open` — pattern list unchanged | `test.yml:153`, `validate.yml:112` |
| CI-P3-010: Node matrix 20.x only vs docs 18+20 | `partially supported` — only 20.x tested; the "Node 18, 20" AGENTS claim no longer exists (AGENTS now says `Node: >= 20`) | `test.yml:32`; `review.md:11` |
| CI-P1-002: terraform prod apply not gated by validate/e2e/migrations | `supported` as fixed — `terraform-apply-prod` now `needs: [terraform-plan, validate-gate, e2e-gate, migrate-gate]` + `environment: prod-approval` | `terraform-do.yml:154-158` |

## Executive Summary

The CI/CD estate is materially more hardened than the 2026-08-06 audit found, and several prior P1/P2 findings are genuinely closed at this commit:

- **All 16 workflows now declare a `permissions:` block** (was 10/13), every external action is **SHA-pinned** (verified by regex; only local reusable-workflow calls are unpinned, which is correct), and there is **still no `pull_request_target` / `workflow_run`** anywhere.
- **The `build-push` vs `deploy-do` tag race is fixed** — `build-push.yml` is now manual-dispatch only.
- **The deploy gate audit is now a hard failure** (`validate.yml` audit step), the **Supabase CLI is pinned** in both `e2e` and `supabase-migrations`, both gained **concurrency groups**, and **post-deploy health checks are now strict** (API must return exactly 200; web must return 200/301/302/307; a container-health gate blocks and auto-rolls-back on failure).
- **Terraform prod apply now has real gates** (`needs: validate-gate, e2e-gate, migrate-gate` + `prod-approval`).
- **Branch-protection-as-code** now exists (`.github/branch-protection/{main,develop}.json`) with `strict: true`, `allow_force_pushes: false`, `allow_deletions: false`, 1 approving review, and `required_conversation_resolution: true`.

The three highest-risk gaps remaining:

1. **Production app deployments have no manual-approval gate in code.** `deploy-do.yml` deploys prod behind `environment: prod` (line 278) — and the repository's own docs state `prod` has **no protection rules**. Only the Terraform apply uses `prod-approval`, which the same docs say is also unprotected. Documentation (`RELEASING.md`, `ROLLBACK_PROCEDURES.md`, `README.dev.md`) claims a 1-reviewer approval gate for production deployments; the code and the repo's own Known Debt contradict that (CI-P1-001).
2. **Branch protection as code is internally inconsistent and its enforcement cannot be verified.** The committed `main.json` requires a check named `Dependency Review`, but the workflow's job is named `review`, so the check is `Dependency Review / review` — a required-context string that may never match. `enforce_admins: false` allows admins to bypass all required checks, and `require_code_owner_reviews: false` means the committed `CODEOWNERS` is advisory only; neither bypass is audited (CI-P1-002).
3. **Infrastructure changes are now entirely ungated in CI.** `terraform-do.yml` was switched to `workflow_dispatch`-only (2026-09-29) with no push/PR trigger, so `terraform plan` never runs on a PR and the `Post plan to PR` step, `pull-requests: write` permission, and per-ref concurrency are effectively dead. A malformed `.tf` change is caught only if an operator remembers to dispatch a manual plan (CI-P2-003).

Medium/low items: the DB restore test's integrity check never asserts anything (`|| true`, prints only), the `chromatic` job is `continue-on-error: true` (permanently green), the secret-scanner still misses DigitalOcean/Cloudflare/Supabase token formats and scans diffs only, `db-restore-test` uses an unpinned `postgres:16-alpine`, the e2e gate is intentionally non-required on `develop` while the same flakiness rationale applies on `main`, and there is no release/tagging workflow (releases are SHA-tagged GHCR images).

Overall this domain is **production-ready with governance debt concentrated in approval enforcement**: the *automated* gates are strong, but the *human/governance* gates (approvals, required-check integrity, admin bypass) are either absent in code or unverifiable.

## Inventory

| Item | Path / symbol | Purpose | Current state | Risk | Notes |
|---|---|---|---|---|---|
| deploy-do | `.github/workflows/deploy-do.yml` | Build 3 GHCR images + SSH deploy w/ gates | Functional | **High** | Prod deploy uses `environment: prod` (no protection rules per docs) |
| validate | `.github/workflows/validate.yml` | Reusable deploy/infra gate | Functional | Low | Audit/test/lint/typecheck/secrets/provenance all hard-fail |
| test | `.github/workflows/test.yml` | PR/push unit + coverage + audit + trivy + secrets | Functional | Low | Trivy SARIF artifact-only (CodeQL covers code scanning) |
| e2e | `.github/workflows/e2e.yml` | Playwright vs local Supabase | Functional | Low | Pinned CLI; required on `main` only |
| terraform-do | `.github/workflows/terraform-do.yml` | Terraform plan/apply | Functional but trigger-less | **High** | Manual-only: no PR plan, no push apply |
| supabase-migrations | `.github/workflows/supabase-migrations.yml` | `db push` per env | Functional | Low | Pinned CLI + concurrency |
| build-push | `.github/workflows/build-push.yml` | GHCR images (manual/reusable) | Functional | Low | Push trigger removed → race fixed |
| lint / typecheck | `.github/workflows/{lint,typecheck}.yml` | PR gates | Functional | Low | Both required on `develop`/`main` |
| codeql | `.github/workflows/codeql.yml` | SAST (js-ts) | Functional | Low | push/PR/schedule; uploads SARIF |
| dependency-review | `.github/workflows/dependency-review.yml` | PR dep gate | Functional | Medium | Job name `review` ≠ required context `Dependency Review` |
| sbom | `.github/workflows/sbom.yml` | CycloneDX artifact | Functional | Low | push/PR/weekly |
| chromatic | `.github/workflows/chromatic.yml` | Storybook visual tests | Best-effort | Low | Job-level `continue-on-error: true` |
| db-backup / db-restore-test | `.github/workflows/*.yml` | Daily backup + weekly restore check | Functional | Medium | Restore check does not assert integrity |
| a11y-breadth | `.github/workflows/a11y-breadth.yml` | Weekly full a11y triage | Non-blocking by design | Low | Calls e2e with `a11y_full: true` |
| branch-protection | `.github/branch-protection/{main,develop}.json` | Branch rules as code | Present, unverified | **High** | `enforce_admins: false`; wrong dep-review context |
| CODEOWNERS | `.github/CODEOWNERS` | Review ownership | Present | Medium | `require_code_owner_reviews: false` → advisory only |
| dependabot | `.github/dependabot.yml` | Weekly npm/GHA/docker/terraform updates | Functional | Low | Grouped |
| scan-secrets.sh | `scripts/scan-secrets.sh` | Local + CI secret scanner | Functional | Low | Misses DO/CF/Supabase token formats |

## Domain Scorecard

| Category | Score | Evidence | Gap | Recommended action |
|---|---:|---|---|---|
| .github/workflows | 4 | 16 workflows; 16/16 have `permissions:`; all external actions SHA-pinned; no `pull_request_target` | terraform has no PR/push trigger; chromatic non-blocking | Add actionlint + SHA-pin assertion to CI |
| PR validation | 3 | test/lint/typecheck/e2e/dependency-review/codeql run on PRs | Required-check names drift; enforcement unverifiable; admins can bypass | Fix contexts, `enforce_admins: true`, verify applied state |
| Lint/typecheck/test/build | 4 | Hard coverage gate; OpenAPI/docs/DB-types/RLS checks; trivy + secrets-scan | Duplicated installs; Node 20 only | Consider shared install/cache; document Node policy |
| Deploy workflows | 3 | Gated prod path (validate+e2e+migrate), queued concurrency, strict health + auto-rollback | **No approval gate on prod deploy**; prod env has no secrets/protection | Add required reviewers to `prod`, or switch deploy to `prod-approval` |
| Migration workflows | 4 | Pinned CLI, env-gated, concurrency group, dry-run diff first | Dry-run diff is `|| true` (non-blocking by design) | Accept or make diff informative-only explicitly |
| Docker build/push | 4 | SHA-immutable tags, gha cache, single publishing path | No provenance/attestation/signing | Add cosign/provenance later |
| Releases | 2 | `docs/RELEASING.md` defines branch model; SHA-tagged GHCR images | No tag/changelog automation; no release workflow | Optional release workflow |
| Badge/report generation | 3 | Trivy artifact, Playwright report, CodeQL SARIF, SBOM | No status badges/dashboard in-repo | Optional dashboard |
| Secrets | 4 | All secrets via `env:`; SSH heredoc uses `printf '%s'`; never interpolated into `run` text | Scanner gaps; prod env secrets absent | Extend scanner; fix prod env secrets |
| permissions blocks | 5 | 16/16 workflows declare least-privilege blocks | A few unused grants (`actions: write`, `id-token: write`) | Trim unused grants |
| OIDC | 1 | `id-token: write` on deploy/terraform but no OIDC federation used (static DO/CF tokens) | No OIDC use | Document decision; adopt if DO/CF support |
| Environment protection | 2 | `prod`/`dev`/`prod-approval` referenced | Repo docs state prod & prod-approval have **no protection rules** | Configure required reviewers; verify |

Overall domain score: **3.4 / 5** — automated gates are strong and several prior findings are closed; governance/approval enforcement is the weak axis.

## Detailed Review

### Item: deploy-do (`.github/workflows/deploy-do.yml`)

- Evidence: `deploy-do.yml` (535 lines).
- What it does: On push to main/develop touching app paths, or `workflow_dispatch` (`deploy_target`, `rollback_sha`): `setup` resolves env/domain/GHCR prefix → `resolve-ip` (DO API → Terraform state → `vars.DROPLET_IP` fallback) → `build-{api,worker,web}` push SHA-tagged GHCR images → gates (`validate` always; `e2e-gate`+`migrate-gate` prod-only) → `deploy` SSH step writes `/opt/mct-portal/.env` from secrets, pulls images with retry, `compose down/up`, container-health gate with auto-rollback, then strict HTTPS health checks.
- How it appears to work: `deploy` is `needs: [setup, resolve-ip, validate, e2e-gate, migrate-gate, build-api, build-worker, build-web]` with `if: always() && !failure() && !cancelled()` so skipped dev gates don't block. Prod is selected by `github.ref_name == 'main'` or `deploy_target == 'prod'`.
- Dependencies: GHCR, DO API, droplet SSH, Cloudflare origin cert secrets, validate/e2e/migrations reusable workflows.
- Current controls: least-privilege `permissions`; queued concurrency (`cancel-in-progress: false`); SHA-tagged images; rollback path; `chmod 600` on `.env` and key files; secrets passed via `env:` and `envs:` list (never interpolated into the remote script); strict health gate; targeted image prune **after** health passes.
- Missing controls / risks:
  - **Prod boundary is the `prod` environment, which the repo says has no protection rules** → no required-reviewer approval for production deploys (CI-P1-001).
  - Unused grants: `id-token: write` (no OIDC), `actions: write` (no cancel/rerun calls) — P3 least-privilege cleanup (CI-P3-006).
  - Worker health remains non-fatal (line 521) — deliberate ("restart-loop tolerant"), but a crashed worker still yields a green deploy (documented decision; noted, not a separate finding).
- Recommended improvement: Attach required reviewers to `prod` (or repoint the prod deploy to a protected `prod-approval` environment). Trim unused permissions.
- Suggested tests: A dispatched dev deploy must fail when the web container is intentionally given an invalid image tag; delete a secret in a non-prod env and confirm the job fails rather than shipping an empty `.env` value.
- Suggested docs: Update `docs/RELEASING.md` / `ROLLBACK_PROCEDURES.md` to describe the *actual* gate.

### Item: validate (`.github/workflows/validate.yml`)

- Evidence: `validate.yml` (198 lines).
- What it does: `workflow_call`-only reusable gate with `audit` (hard `pnpm audit --audit-level=high --prod`), `test` (coverage + OpenAPI validate/audit + docs counts/links + DB-types check + RLS hygiene), `secrets-scan` (diff patterns), `lint`, `typecheck`, `prompt-provenance` (`verify-prompts.js verify` + `sync-review-md.mjs --check`).
- Current controls: `permissions: contents: read`; no `continue-on-error` anywhere; it is called by both `deploy-do` and `terraform-do`.
- Missing controls: no `timeout-minutes` on `audit`/`lint`/`typecheck`/`prompt-provenance` jobs (others have them).
- Recommended improvement: Add per-job timeouts; keep the hard gates.
- Suggested docs: `docs/RELEASING.md` deploy-gate list already matches the jobs (verified).

### Item: test (`.github/workflows/test.yml`)

- Evidence: `test.yml` (166 lines).
- What it does: On push/PR to main/develop for app paths: `test` (coverage + OpenAPI/docs/DB-types/RLS/review-mirror), `security-scan` (hard `pnpm audit` + Trivy fs SARIF `exit-code: 1`), `secrets-scan` (diff patterns, `fetch-depth: 0`).
- Current controls: `permissions: contents: read, security-events: write`.
- Missing controls: `security-events: write` is granted but Trivy's SARIF is only uploaded as an artifact — the grant is unused by this workflow (CodeQL uses its own grant). See CI-P3-006.
- Recommended improvement: Either add `github/codeql-action/upload-sarif` for Trivy or drop `security-events: write` here.
- Suggested tests: `actionlint` on all workflows; a grep-based assertion that every `uses:` is SHA-pinned.

### Item: terraform-do (`.github/workflows/terraform-do.yml`)

- Evidence: `terraform-do.yml` (232 lines).
- What it does: `workflow_dispatch` only (`apply` boolean). `terraform-plan` (fmt/validate/plan, uploads plan artifact, posts PR comment if `pull_request`), then `validate-gate` always; `e2e-gate`/`migrate-gate` on `main`; `terraform-apply-prod` (`environment: prod-approval`) and `terraform-apply-dev` (`environment: dev`).
- Current controls: `permissions` least-privilege; `concurrency: terraform-do-${{ github.ref }}`; prod apply gated on all three gates + `prod-approval`; tfvars written with `printf '%s'` (injection-safe).
- Missing controls / risks:
  - **No `push`/`pull_request` trigger** → the `Post plan to PR` step (line 107-121, `if: github.event_name == 'pull_request'`) and `pull-requests: write` (line 19) are dead code; infra changes are not planned on PRs (CI-P2-003).
  - `prod-approval` environment has no required reviewers per repo docs → the approval gate does not actually gate (CI-P1-001).
  - `terraform fmt -check` is a hard step now (good).
- Recommended improvement: Restore a `pull_request` trigger for plan-only (no apply) so changes are reviewed; keep `workflow_dispatch` for apply; configure reviewers on `prod-approval`.
- Suggested tests: Open a PR editing `infra/terraform/digitalocean/*.tf`; confirm a plan comment is posted and no apply job is created. Introduce a syntax error; confirm plan fails.

### Item: supabase-migrations (`.github/workflows/supabase-migrations.yml`)

- Evidence: `supabase-migrations.yml` (65 lines).
- What it does: push to develop/main on `supabase/**`, `workflow_dispatch`, `workflow_call`: link project, `db diff --linked` (informational, `|| true`), `supabase db push --include-all`.
- Current controls: pinned `supabase@2.107.0`; `concurrency: supabase-migrations-${{ github.ref }}`, `cancel-in-progress: false`; env-gated (`prod` on main, `dev` otherwise); `permissions: contents: read`.
- Missing controls: no `timeout-minutes`; the dry-run diff is non-blocking by design (acceptable, but undocumented as "informational only"). The `prod` environment gate here also lacks protection rules (CI-P1-001).
- Recommended improvement: Add `timeout-minutes`; document that `db diff` is informational.

### Item: branch-protection as code (`.github/branch-protection/*`)

- Evidence: `.github/branch-protection/README.md`, `main.json`, `develop.json`.
- What it declares: `main` requires `test (20.x)`, `lint (20.x)`, `typecheck`, `e2e (20.x)`, `Dependency Review`; `develop` requires `test (20.x)`, `lint (20.x)`, `typecheck`; both `strict: true`, 1 approval, `dismiss_stale_reviews: true`, `required_conversation_resolution: true`, `allow_force_pushes: false`, `allow_deletions: false`, `enforce_admins: false`, `require_code_owner_reviews: false`.
- How it appears to work: applied via `gh api -X PUT .../branches/{branch}/protection --input <file>`.
- Missing controls / risks:
  - The `Dependency Review` context likely does not match the actual check-run name (`Dependency Review / review`), so that required check may silently not be enforced (CI-P1-002).
  - `enforce_admins: false` → admins can merge with no checks; no audit artifact records such bypasses.
  - `require_code_owner_reviews: false` → the committed `CODEOWNERS` is advisory only.
  - There is no CI job that verifies the committed JSON matches the live GitHub settings (drift is possible and undetected).
- Recommended improvement: Correct the dependency-review context (or rename the job); set `enforce_admins: true`; enable `require_code_owner_reviews`; add a scheduled workflow that diffs live protection against the committed JSON.
- Suggested tests: A workflow that runs `gh api .../protection` and asserts it equals the committed JSON; open a PR that fails a required check and confirm merge is blocked for a non-admin and (after the change) an admin.

### Item: db-restore-test (`.github/workflows/db-restore-test.yml`)

- Evidence: `db-restore-test.yml` (64 lines).
- What it does: weekly (Mon 06:00 UTC): finds the latest backup in `S3_BACKUP_BUCKET`, downloads it, starts `postgres:16-alpine`, `gunzip | psql`, prints table counts, cleans up.
- Missing controls / risks:
  - The "Verify database integrity" step **never fails**: it only `SELECT count(*)` and prints, and the `_migrations` check is `|| true` (line 56). A restore of an empty or corrupt dump still reports "completed successfully" (CI-P2-002).
  - `postgres:16-alpine` is unpinned (floating tag) → reproducibility risk (CI-P3-004).
- Recommended improvement: Assert expected minimum table count and that `_migrations` exists (fail otherwise); pin the Postgres image digest/tag.
- Suggested tests: Upload a deliberately truncated dump in a test bucket; confirm the workflow fails.

### Item: secret scanning (`test.yml`, `validate.yml`, `scripts/scan-secrets.sh`)

- Evidence: `test.yml:150-166`, `validate.yml:109-125`, `scripts/scan-secrets.sh`.
- What it does: greps the diff vs base for AWS/GitHub/Stripe/Slack/private-key/JWT patterns, excluding `secrets.` references and `PATTERNS=` lines.
- Missing controls: patterns still omit `dop_v1_` (DigitalOcean), Cloudflare API tokens, and `sbp_` (Supabase) — the token formats this platform actually uses; scanning is diff-only (CI-P3-005).
- Recommended improvement: Extend patterns; run a one-time gitleaks/trufflehog full-history scan.

## Scenario / Control Matrix

| ID | Scenario or control | Evidence | Current control | Gap | Severity | Recommendation |
|---|---|---|---|---|---|---|
| CI-001 | Prod app deploy approval | `deploy-do.yml:278` `environment: prod`; docs say `prod` unprotected | Env gate (unprotected) | No required reviewers | P1 | Configure `prod` reviewers or use `prod-approval` |
| CI-002 | Branch-protection integrity | `.github/branch-protection/main.json` vs `dependency-review.yml` job `review` | Committed JSON | Wrong context; `enforce_admins:false`; no CO reviews | P1 | Fix context; enforce admins; enable CO reviews |
| CI-003 | Terraform PR gating | `terraform-do.yml:9` `workflow_dispatch` only | Manual dispatch | No PR plan; dead PR-comment step | P2 | Add plan-only PR trigger |
| CI-004 | Restore-test assertion | `db-restore-test.yml:51-57` | Prints counts only | Never fails on bad data | P2 | Assert counts + `_migrations` |
| CI-005 | Chromatic gate | `chromatic.yml:24` `continue-on-error: true` | Report-only | Visual regressions never block | P2 | Fix Storybook build, then remove |
| CI-006 | Unused permissions | `deploy-do.yml:29-30`; `test.yml:24` | Least-privilege blocks | `id-token`/`actions`/`security-events` unused | P3 | Trim grants |
| CI-007 | Secret patterns | `test.yml:153`, `scan-secrets.sh` | Diff grep | Misses DO/CF/Supabase | P3 | Extend patterns + history scan |
| CI-008 | Pinned scanner image | `db-restore-test.yml:41` `postgres:16-alpine` | Floating tag | Drift | P3 | Pin digest |
| CI-009 | e2e required on develop | `develop.json` (three checks) vs `e2e.yml` flakiness | Not required on develop | Same flakiness affects `main` gate | P3 | Document; quarantine flaky specs |
| CI-010 | No release workflow | No `.github/workflows/*release*` | SHA tags only | No changelog/tag automation | P3 | Add optional release job |
| CI-011 | Unused OIDC | `id-token: write` on deploy/terraform; static tokens | Static DO/CF tokens | No federation | P3 | Document decision |
| CI-012 | Timeouts | `validate.yml` audit/lint/typecheck/prompt-provenance; `supabase-migrations` | Some jobs lack timeouts | Stuck job can hang | P3 | Add `timeout-minutes` |

## Findings

### Finding ID: CI-P1-001 - Production application deploys have no working manual-approval gate

- Severity: P1 (High)
- Confidence: High (repo evidence) / Medium (GitHub-side effective state not verifiable)
- Area: CI/CD — Environment protection / deploy governance
- Evidence:
  - `.github/workflows/deploy-do.yml:278` — `environment: ${{ needs.setup.outputs.name }}` (resolves to `prod` for the prod deploy).
  - `AGENTS.md:59` — "`prod`/`prod-approval` environments have no protection rules".
  - `docs/GITHUB_SECRETS_AND_VARIABLES_MATRIX.md:5-7,92-94` — `prod` "no protection rules"; `prod-approval` "add Required reviewers (1+) … none are configured yet".
  - Contradicting docs: `docs/RELEASING.md:99`, `docs/ROLLBACK_PROCEDURES.md:167`, `README.dev.md:432` claim a 1+ reviewer approval gate for production deploys.
- What is happening: The prod app deploy attaches the `prod` environment, which the repository's own documentation states has no required reviewers. The only environment with an approval concept (`prod-approval`) is used solely by the Terraform prod apply, and it too is documented as having no reviewers configured yet.
- Why it matters: The documented production approval gate does not exist in code or (per the repo's own attestation) in settings. A push to `main` can deploy straight to production with no human approval step, and the documentation gives a false sense of control.
- User / business impact: An unreviewed or mistaken change reaching `main` deploys to prod automatically; the documented "1+ reviewer" safety net is not real. Blast radius is the whole prod portal.
- Security / privacy / reliability impact: Removal of a change-control control; weaker separation between CI and production. Combined with admin bypass (CI-P1-002) this is a chain to unattended production change.
- Recommended fix: Configure Required reviewers (≥1) on the `prod` environment (the environment `deploy-do` actually uses), **or** repoint the prod deploy to a protected `prod-approval` environment. Correct `RELEASING.md`/`ROLLBACK_PROCEDURES.md`/`README.dev.md` to match reality until configured.
- Suggested validation: Configure a reviewer on `prod`, then dispatch `deploy-do` with `deploy_target: prod`; the run must pause at "Waiting for approval" before the `deploy` job starts.
- Owner suggestion: platform/operations (repo admin for environment settings)
- Effort estimate: S (settings change) + S (docs)
- Dependencies: Repository admin access; decision on which environment name to standardize.
- Status: open
- Endpoint / data path: push `main` → `deploy-do.deploy` job → SSH `root@droplet` → `docker compose up` (writes `/opt/mct-portal/.env` from secrets).
- Attack path: none identified (governance/reliability, not remote exploitation) — but composes with CI-P1-002 (admin bypass) into "unattended production change".

### Finding ID: CI-P1-002 - Branch-protection-as-code has a likely-mismatched required check and permits admin bypass

- Severity: P1 (High)
- Confidence: High (repo evidence) / Medium (live settings not verifiable)
- Area: CI/CD — Branch protection / required checks
- Evidence:
  - `.github/branch-protection/main.json:4` — `"contexts": ["test (20.x)", "lint (20.x)", "typecheck", "e2e (20.x)", "Dependency Review"]`.
  - `.github/workflows/dependency-review.yml:11` — job id is `review` (workflow name `Dependency Review`), so the emitted check context is `Dependency Review / review`, not `Dependency Review`.
  - `.github/branch-protection/main.json:6` — `"enforce_admins": false`.
  - `.github/branch-protection/main.json:9` — `"require_code_owner_reviews": false` despite `.github/CODEOWNERS` assigning `/apps/api`, `/apps/web`, `/infra`, `/.github/` etc.
  - `.github/branch-protection/README.md:25-28` repeats the same context list and asserts the names are "the job/check-run names produced by the workflows".
- What is happening: The committed required-status-check list names `Dependency Review`, which does not equal the job/check-run name `review` emitted by the workflow. Branch protection matches on the exact check context, so a mismatched context either never blocks or blocks nothing. Separately, `enforce_admins: false` and `require_code_owner_reviews: false` mean administrators can merge without checks and CODEOWNERS review is not enforced; the repo has no artifact that audits such bypasses.
- Why it matters: The dependency-review gate the team believes is required on `main` may not actually be enforced, and the review-ownership model (CODEOWNERS) is decorative. Combined with no admin-bypass audit trail, a required check can be skipped without any record.
- User / business impact: PRs can merge to `main` without dependency review or code-owner approval; the documented review gate ("required checks" table in `README.md`) is only partially real.
- Security / privacy / reliability impact: Weakened merge governance on the production branch; potential unreviewed dependency/infra change reaching `main`.
- Recommended fix: (a) Change `dependency-review.yml`'s job id to `dependency_review` won't help; instead set the required context to whatever GitHub actually emits (verify via `gh api repos/{owner}/{repo}/commits/{sha}/check-runs`) — commonly `Dependency Review / review`; or add a `name:` to the job and use that. (b) Set `enforce_admins: true`. (c) Set `require_code_owner_reviews: true`. (d) Add a scheduled workflow that diffs live protection against the committed JSON.
- Suggested validation: After applying, open a PR failing `Dependency Review` and confirm the "Merge" button is disabled for both an admin and a non-admin; confirm a PR touching `/apps/api/` requires a `@mainecybertech/backend` review.
- Owner suggestion: platform/operations
- Effort estimate: S
- Dependencies: Repository admin; `gh` token with `administration: write` (per `README.md`).
- Status: open
- Attack path: composes with CI-P1-001 — admin merge bypasses checks, then an unreviewed prod deploy with no approval.

### Finding ID: CI-P2-002 - DB restore test reports success without asserting restore integrity

- Severity: P2 (Medium)
- Confidence: High
- Area: CI/CD — Backup/restore verification
- Evidence:
  - `.github/workflows/db-restore-test.yml:51-57` — "Verify database integrity" runs two `SELECT count(*)` queries and then unconditionally echoes "Restore test completed successfully".
  - `.github/workflows/db-restore-test.yml:56` — the `_migrations` existence query ends with `|| true`, so it can never fail the step.
  - `.github/workflows/db-restore-test.yml:41` — restore target is an unpinned `postgres:16-alpine` image.
- What is happening: `gunzip | psql` with `set -euo pipefail` will fail only if the pipe itself errors; the integrity step performs no assertion, so an empty/short/corrupt dump that psql accepts restores "successfully". The weekly "restore verified" signal therefore does not verify recoverability.
- Why it matters: The workflow is the only recovery-exercise evidence in the repo. If it green-lights a bad backup, the team believes restores work until a real incident.
- User / business impact: False confidence in disaster recovery; potential extended outage and data-loss exposure during an actual restore.
- Security / privacy / reliability impact: Reliability/DR control is non-functional as written.
- Recommended fix: Capture the table count and assert it exceeds a known threshold (e.g. `>=` the 127 migrations / committed table count), assert `_migrations` exists (remove `|| true`), and compare row counts on one or two critical tables against the live DB or a stored baseline. Pin the Postgres image.
- Suggested validation: Replace the newest backup object with a truncated dump in a scratch bucket; the workflow must fail. Then restore a real dump and confirm all assertions pass.
- Owner suggestion: platform/backend
- Effort estimate: S
- Dependencies: A known expected table/row baseline.
- Status: open
- Endpoint / data path: S3/Spaces `S3_BACKUP_BUCKET` latest object → `gunzip | psql` into `postgres:16-alpine` → printed counts.

### Finding ID: CI-P2-003 - Infrastructure changes are no longer gated in CI (terraform-do is manual-dispatch only)

- Severity: P2 (Medium)
- Confidence: High
- Area: CI/CD — Terraform governance
- Evidence:
  - `.github/workflows/terraform-do.yml:3-14` — only `workflow_dispatch`; comment: "Manual-only by design (2026-09-29) … Re-enable push/PR triggers once the token is rotated…".
  - `.github/workflows/terraform-do.yml:107-121` — "Post plan to PR" step guarded by `if: github.event_name == 'pull_request'`, unreachable with the current trigger.
  - `.github/workflows/terraform-do.yml:19` — `pull-requests: write` permission is now unused.
  - `AGENTS.md:59` — documents the same manual-only state and the reason (`DO_API_TOKEN` 401).
- What is happening: Because both push and pull_request triggers were removed, no CI run plans or validates a `.tf` change until an operator manually dispatches `terraform-do`. The gates that were added (`validate-gate`, `e2e-gate`, `migrate-gate`) only run inside that manual dispatch.
- Why it matters: Infra drift and mistakes (firewall, DNS, droplet sizing) are caught only if a human remembers to run the plan. PR review of infrastructure has no machine-checked diff.
- User / business impact: Higher chance of an unreviewed infra change causing an outage; slower, more error-prone change process.
- Security / privacy / reliability impact: Loss of the CI safety net for the most privileged changes (network exposure, DNS).
- Recommended fix: Restore a `pull_request` trigger limited to `plan` (never apply) for `infra/terraform/digitalocean/**` so plans are posted and reviewed; keep `workflow_dispatch` for apply; delete the unused `pull-requests: write` if the PR path is not restored.
- Suggested validation: Open a PR editing `infra/terraform/digitalocean/*.tf`; confirm a plan job runs (no apply) and posts a comment; introduce a deliberate syntax error and confirm the plan fails.
- Owner suggestion: platform/infrastructure
- Effort estimate: S (after `DO_API_TOKEN` is rotated — the blocker stated in the code comment)
- Dependencies: A valid `DO_API_TOKEN`; environment protection rules (CI-P1-001).
- Status: open (owner-accepted as temporary; documented in AGENTS.md)
- Attack path: none identified.

### Finding ID: CI-P2-004 - Chromatic visual-regression job is permanently non-blocking

- Severity: P2 (Medium)
- Confidence: High
- Area: CI/CD — Visual regression gate
- Evidence:
  - `.github/workflows/chromatic.yml:24` — job-level `continue-on-error: true`.
  - `.github/workflows/chromatic.yml:19-23` — comment explains the Storybook webpack build fails (`SB_BUILDER-WEBPACK5_0002`), so the job is kept green while visible in status.
  - `.github/workflows/chromatic.yml:58` — `exitZeroOnChanges: true` (Chromatic never fails on visual changes anyway).
- What is happening: The visual-regression job is best-effort by a double mechanism (job `continue-on-error` + `exitZeroOnChanges`). No visual change can block a PR.
- Why it matters: UI regressions rely entirely on manual review; the visual-diff tooling provides no gate.
- User / business impact: Visual regressions can reach dev/prod unnoticed.
- Security / privacy / reliability impact: Low; quality/regression control gap.
- Recommended fix: Fix the Storybook webpack build, then remove `continue-on-error` and (if desired) set `exitZeroOnChanges: false` for `main`. Until fixed, keep the job explicitly labelled as non-gating in docs.
- Suggested validation: Introduce an intentional visual change on a computed style; confirm CI flags it (after the fix).
- Owner suggestion: frontend/platform
- Effort estimate: M (build fix)
- Dependencies: Storybook/webpack fix.
- Status: open (owner-accepted as best-effort)
- Attack path: none identified.

### Finding ID: CI-P3-005 - Secret scanner misses the platform's own token formats and scans diffs only

- Severity: P3 (Low)
- Confidence: High
- Area: CI/CD — Secret scanning
- Evidence:
  - `.github/workflows/test.yml:153` and `.github/workflows/validate.yml:112` — identical pattern list: AWS `AKIA/ASIA`, GitHub PATs, Stripe `sk_`, Slack `xox*`, private keys, JWTs.
  - `AGENTS.md`/`docs/GITHUB_SECRETS_AND_VARIABLES_MATRIX.md` — the platform uses DigitalOcean (`DO_API_TOKEN`), Cloudflare (`CLOUDFLARE_API_TOKEN`), and Supabase (`SUPABASE_ACCESS_TOKEN`, `sbp_`) tokens.
  - `scripts/scan-secrets.sh` — mirrors the same list for the pre-commit hook.
- What is happening: The token families the project actually issues are not matched; the scan compares only the pushed diff (base..HEAD), not history.
- Why it matters: A committed DigitalOcean, Cloudflare, or Supabase token would pass CI.
- User / business impact: Credential leak could lead to infra takeover / data exposure; the leak would not be caught at commit time.
- Security / privacy / reliability impact: Direct secret-exposure risk.
- Recommended fix: Add `dop_v1_[a-f0-9]{64}`, Cloudflare token shapes, and `sbp_[a-z0-9]{40}` patterns; run a one-time full-history scan with gitleaks/trufflehog.
- Suggested validation: Commit a dummy `dop_v1_...` string on a scratch branch; CI must fail.
- Owner suggestion: platform/security
- Effort estimate: S
- Dependencies: None.
- Status: still-open (carried from prior audit CI-P3-009)

### Finding ID: CI-P3-006 - Unused permission grants across deploy/test workflows

- Severity: P3 (Low)
- Confidence: High
- Area: CI/CD — Least privilege
- Evidence:
  - `.github/workflows/deploy-do.yml:29-30` — `id-token: write` (no OIDC step; static DO/CF tokens) and `actions: write` (no cancel/rerun/artifact-cancel usage).
  - `.github/workflows/test.yml:24` — `security-events: write` while Trivy SARIF is only `actions/upload-artifact` (`test.yml:132-138`); the grant is used by `codeql.yml`, not here.
  - `.github/workflows/terraform-do.yml:18-20` — `id-token: write` and `pull-requests: write` (the latter now unreachable per CI-P2-003).
- What is happening: Several workflows grant token scopes their steps never use.
- Why it matters: Each unused write scope widens the blast radius of a compromised action/step.
- User / business impact: Minimal directly; hygiene and defense-in-depth.
- Security / privacy / reliability impact: Reduced least-privilege posture.
- Recommended fix: Remove `id-token: write`/`actions: write` from `deploy-do`, `security-events: write` from `test.yml` (unless Trivy SARIF upload is added), and `id-token: write`/`pull-requests: write` from `terraform-do` when triggers are restored.
- Suggested validation: `actionlint` plus a manual scope-to-step audit; workflows still pass.
- Owner suggestion: platform
- Effort estimate: S
- Dependencies: Decide whether to add OIDC or Trivy SARIF upload first.
- Status: open

### Finding ID: CI-P3-007 - DB restore test uses an unpinned `postgres:16-alpine` image

- Severity: P3 (Low)
- Confidence: High
- Area: CI/CD — Reproducibility
- Evidence: `.github/workflows/db-restore-test.yml:35-42` — `docker run … postgres:16-alpine`.
- What is happening: The restore target is a floating tag; the Postgres minor version changes over time, so restore behavior can drift without a repo change.
- Why it matters: A restore test that passes/fails based on an external image update is not reproducible.
- Recommended fix: Pin the image to a digest (or a precise version like `postgres:16.4-alpine`) consistently.
- Suggested validation: Re-run the workflow twice and confirm identical behavior; record the digest in the workflow.
- Owner suggestion: platform
- Effort estimate: Trivial
- Dependencies: None.
- Status: open

### Finding ID: CI-P3-008 - No release/tagging workflow and no post-merge release artifact

- Severity: P3 (Low)
- Confidence: High
- Area: CI/CD — Releases
- Evidence:
  - No `.github/workflows/*release*|*tag*|*changelog*` file exists (directory enumeration).
  - `docs/RELEASING.md:47-58` — "release is the Docker images on GHCR … tagged with the deploying commit SHA"; no git tag workflow.
  - `CHANGELOG.md` keeps a single `[Unreleased]` section.
- What is happening: There is a documented manual release model but no automation (no tag creation, no changelog-on-release job, no version bump).
- Why it matters: No immutable release pointer beyond image tags; auditors must map SHAs manually.
- Recommended fix: Optional `release.yml` on `main` push/dispatch that creates a Git tag + GitHub Release summarising `CHANGELOG.md`, and attaches the SBOM artifact.
- Suggested validation: Dispatch the workflow; confirm a tag and release appear.
- Owner suggestion: platform
- Effort estimate: M
- Dependencies: Release naming policy.
- Status: open

### Finding ID: CI-P3-009 - e2e is required on `main` but the documented flakiness makes it an unstable hard gate

- Severity: P3 (Low)
- Confidence: Medium
- Area: CI/CD — Required-check reliability
- Evidence:
  - `.github/branch-protection/main.json:4` — `e2e (20.x)` is a required context on `main`.
  - `AGENTS.md:52` — "E2E has known run-to-run flakiness … data-dependent tests … fail intermittently … not a product regression".
  - `.github/branch-protection/README.md:34-37` — e2e is "intentionally not required on develop" because of this flakiness.
- What is happening: A known-flaky suite is a hard required check on the production branch, while the same rationale excludes it from `develop`.
- Why it matters: Flaky requirements cause false blocks and pressure to bypass (`enforce_admins:false` makes bypass easy) or re-run until green.
- Recommended fix: Quarantine/fix the flaky specs (or shard/retry with a documented budget), then keep e2e required on both branches; if it must stay unreliable, document the re-run policy explicitly and make e2e advisory on `main` until stabilised.
- Suggested validation: Run the e2e suite N times on the same commit; record pass/fail variance.
- Owner suggestion: QA/platform
- Effort estimate: M
- Dependencies: Root-cause the data-dependent tests.
- Status: open

### Finding ID: CI-P3-010 - Missing per-job timeouts and minor workflow hygiene gaps

- Severity: P3 (Low)
- Confidence: High
- Area: CI/CD — Workflow hygiene
- Evidence:
  - `.github/workflows/validate.yml` — `audit` (line 10), `lint` (127), `typecheck` (156), `prompt-provenance` (185) jobs have no `timeout-minutes` (contrast `test` line 41 and `secrets-scan` line 101).
  - `.github/workflows/supabase-migrations.yml:22-24` — `migrate` job has no `timeout-minutes`.
- What is happening: A hung install/network step in these jobs can occupy a runner indefinitely (default 360 min).
- Recommended fix: Add `timeout-minutes` (e.g. 15–30) to every job.
- Suggested validation: `actionlint`; simulate a hang and confirm the job is cancelled at the timeout.
- Owner suggestion: platform
- Effort estimate: Trivial
- Dependencies: None.
- Status: open

## Risks

| Risk | Severity | Likelihood | Impact | Evidence | Mitigation |
|---|---|---|---|---|---|
| Prod app deploy has no approval gate | P1 | High (every merge to main) | Unreviewed prod change | `deploy-do.yml:278`; docs say `prod`/`prod-approval` unprotected | CI-P1-001 |
| Admin bypass + wrong required-check context | P1 | Medium | Required checks/review skipped unnoticed | `main.json:4,6,9`; `dependency-review.yml:11` | CI-P1-002 |
| Infra changes unplanned in CI | P2 | High (every infra edit) | Outage from unvalidated `.tf` | `terraform-do.yml:3-14` | CI-P2-003 |
| "Restore verified" is meaningless | P2 | High (weekly) | DR false confidence | `db-restore-test.yml:51-57` | CI-P2-002 |
| Visual regressions never blocked | P2 | Certain | UI regressions ship | `chromatic.yml:24,58` | CI-P2-004 |
| Platform tokens not scanned | P3 | Medium | Credential leak passes CI | `test.yml:153` | CI-P3-005 |
| Flaky required e2e gate on main | P3 | High | False blocks / bypass pressure | `main.json:4`; `AGENTS.md:52` | CI-P3-009 |
| Restore target drifts | P3 | Medium | Non-reproducible DR test | `db-restore-test.yml:41` | CI-P3-007 |

## Recommendations

### Immediate / Release Blocking

1. **CI-P1-001** — Configure Required reviewers on the `prod` environment (or repoint the prod deploy to a protected `prod-approval` environment), and correct the three docs that claim this gate already exists.
2. **CI-P1-002** — Fix the `Dependency Review` required-check context to the actual emitted name, set `enforce_admins: true`, and enable `require_code_owner_reviews: true`; add a drift check that diffs live protection against the committed JSON.

### This Week

3. **CI-P2-002** — Make the restore test assert integrity (table count + `_migrations` existence, no `|| true`).
4. **CI-P2-003** — Restore a `pull_request` plan-only trigger for terraform (after rotating `DO_API_TOKEN`).
5. **CI-P2-004** — Fix the Storybook build, then drop `continue-on-error` from `chromatic.yml`.

### This Month

6. **CI-P3-005** — Extend secret-scanner patterns for DO/CF/Supabase and run a one-time full-history scan.
7. **CI-P3-006 / CI-P3-007 / CI-P3-010** — Trim unused permissions, pin the Postgres image, add per-job timeouts.
8. **CI-P3-009** — Quarantine/fix the flaky e2e specs so the required check is trustworthy.

### Later / Platform Evolution

9. **CI-P3-008** — Add an optional release workflow (git tag + GitHub Release + SBOM attach).
10. Evaluate OIDC federation for DigitalOcean/Cloudflare (currently static tokens; `id-token: write` is unused) and add image provenance/attestation (cosign) for GHCR images.

## Quick Wins

| Quick win | Why it helps | Files likely involved | Validation |
|---|---|---|---|
| Configure required reviewers on `prod` | Turns the documented gate into a real one | GitHub settings (env `prod`) | Dispatch prod deploy → pauses for approval |
| Fix `Dependency Review` required context | Makes the dep gate actually enforce | `.github/branch-protection/main.json` | PR failing dep review is blocked |
| `enforce_admins: true` + `require_code_owner_reviews: true` | Closes bypass path; activates CODEOWNERS | `main.json`, `develop.json` | Admin PR with failing check cannot merge |
| Add assertions to restore-test | Real DR signal | `db-restore-test.yml:51-57` | Truncated dump → job fails |
| Remove unused permission grants | Least privilege | `deploy-do.yml`, `test.yml`, `terraform-do.yml` | actionlint + green runs |
| Extend secret-scanner patterns | Catch platform token leaks | `test.yml`, `validate.yml`, `scripts/scan-secrets.sh` | Dummy `dop_v1_` token fails CI |

## Hardening Backlog

| Backlog item | Priority | Owner suggestion | Effort | Dependency |
|---|---|---|---|---|
| Env approval + docs correction | P1 | platform/ops | S | Repo admin |
| Branch-protection integrity + drift check | P1 | platform | S | Repo admin; `gh` admin token |
| Restore-test assertions | P2 | platform/backend | S | Baseline counts |
| Terraform PR plan-only trigger | P2 | platform/infra | S | `DO_API_TOKEN` rotation |
| Chromatic build fix | P2 | frontend | M | Storybook/webpack fix |
| Secret-scanner coverage + history scan | P3 | security/platform | S | None |
| Trim permissions | P3 | platform | S | Decide OIDC/SARIF first |
| Pin Postgres image | P3 | platform | Trivial | None |
| Per-job timeouts | P3 | platform | Trivial | None |
| Release workflow | P3 | platform | M | Naming policy |
| actionlint + SHA-pin assertion in CI | P3 | platform | S | None |

## Suggested Tests

- **CI (new):** `actionlint` over all 16 workflows, wired as a blocking step in `test.yml` or `validate.yml`.
- **CI (new):** grep-based assertion that every `uses:` is a 40-hex SHA (excluding `./.github/workflows/*` reusable calls).
- **CI (new):** a scheduled job that fetches live branch protection (`gh api .../protection`) and fails if it drifts from `.github/branch-protection/{main,develop}.json`.
- **CI (security):** commit scratch `dop_v1_…`, Cloudflare-token-shaped, and `sbp_…` strings on a throwaway branch; the secrets-scan job must fail.
- **CI (DR):** restore a truncated/garbage dump; `db-restore-test` must fail, not print "completed successfully".
- **Manual/CI (approval):** dispatch a prod deploy and terraform apply; both must pause for approval before mutating production.
- **E2E:** run the Playwright suite N times on an identical commit and record pass/fail variance to size the flakiness problem (CI-P3-009).
- **Regression:** confirm `build-push` push trigger stays removed (guard against reintroducing the tag race).

## Suggested Documentation Updates

- `docs/RELEASING.md` — replace the implied production approval gate with the actual state until CI-P1-001 is fixed; add the branch-protection file as the source of truth for required checks.
- `docs/ROLLBACK_PROCEDURES.md:167` & `README.dev.md:432` — correct the "1+ required reviewers" claim for the prod deploy.
- `docs/GITHUB_SECRETS_AND_VARIABLES_MATRIX.md` — update environment protection status once configured.
- `.github/branch-protection/README.md` — document the exact check-run contexts (verify against a real check-runs API response) and the drift-check workflow.
- `AGENTS.md` — reflect the terraform manual-only state as intentional (already partly present) and note the chromatic job is non-gating.
- New `docs/CI_CD_GATE_MAP.md` — one table mapping each workflow → trigger → blocking vs report-only → environment.

## Open Questions

| Question | Why it matters | Evidence needed |
|---|---|---|
| Does GitHub actually enforce a check named `Dependency Review` on `main`, or does the context mismatch silently disable it? | Determines whether the dep gate is real | `gh api repos/MaineCyberTech/mainecybertech/commits/<sha>/check-runs` output |
| Are required reviewers configured on `prod` or `prod-approval` today? | CI-P1-001 severity | GitHub environment settings (repo admin) |
| Are the committed branch-protection JSONs actually applied, or aspirational? | CI-P1-002 | `gh api .../branches/main/protection` vs the JSON |
| What is the full 40-hex SHA for commit `6286137...`? | Binding/generality of this report | `git rev-parse HEAD` (git unavailable in audit env) |
| Are `prod` environment secrets (`SUPABASE_*`, `JWT_SECRET`, etc.) populated now? | Whether a prod deploy can succeed at all | GitHub environment secret list |
| Is the `DO_API_TOKEN` rotated (blocking terraform trigger restoration)? | CI-P2-003 unblock | DO API token status |
| Is `S3_BACKUP_BUCKET` the same bucket used by `scripts/backup-database.sh`? | Restore test correctness | Secret value comparison (redacted) |

## Appendix

### Workflow inventory and trigger matrix (16 workflows)

| Workflow | Trigger(s) | Blocking? | Environment | Key gate/jobs |
|---|---|---|---|---|
| `deploy-do.yml` | push main/develop (app paths), dispatch | Yes (prod path) | `prod` / `dev` | build-{api,worker,web}; validate; e2e-gate/migrate-gate (prod); deploy |
| `validate.yml` | `workflow_call` | Yes (called) | — | audit; test; secrets-scan; lint; typecheck; prompt-provenance |
| `test.yml` | push/PR main/develop (app paths), dispatch | Yes | — | test; security-scan; secrets-scan |
| `e2e.yml` | PR (web paths), `workflow_call`, dispatch | Yes (main) | — | e2e (Playwright, chromium) |
| `terraform-do.yml` | dispatch only | Manual | `prod`/`dev`/`prod-approval` | plan; validate/e2e/migrate gates; apply-prod/dev |
| `supabase-migrations.yml` | push main/develop (`supabase/**`), dispatch, `workflow_call` | Yes | `prod`/`dev` | migrate |
| `build-push.yml` | dispatch only | Manual | — | build-{api,worker,web} |
| `lint.yml` | push/PR main/develop (app paths) | Yes | — | lint |
| `typecheck.yml` | push/PR main/develop (app paths) | Yes | — | typecheck |
| `codeql.yml` | push/PR main/develop, weekly, dispatch | Report | — | analyze (javascript-typescript) |
| `dependency-review.yml` | PR main/develop | Yes (if context matches) | — | review |
| `sbom.yml` | push/PR main/develop, weekly, dispatch | Report | — | sbom (CycloneDX artifact) |
| `chromatic.yml` | push/PR (packages/ui) | **No** (`continue-on-error`) | — | chromatic |
| `db-backup.yml` | daily 04:00 UTC, dispatch | Scheduled | — | backup; Slack notify on failure |
| `db-restore-test.yml` | weekly Mon 06:00 UTC, dispatch | Scheduled | — | restore-test |
| `a11y-breadth.yml` | weekly Mon 05:23 UTC, dispatch | **No** (triage) | — | breadth (calls e2e, `a11y_full: true`) |

### CI gate map (what actually blocks what)

```mermaid
flowchart TD
  PR[Pull request → main/develop] --> T[test.yml]
  PR --> L[lint.yml]
  PR --> TC[typecheck.yml]
  PR --> DR[dependency-review.yml]
  PR --> CQ[codeql.yml]
  PR --> E[e2e.yml]
  T --> BR{required: test (20.x), lint (20.x), typecheck}
  L --> BR
  TC --> BR
  DR --> BRC{Dependency Review context?}
  E --> BRM[required on main: e2e (20.x)]
  BR --> MERGE[Merge]
  BRC --> MERGE
  BRM --> MERGE
  MERGE --> PUSH[push to main/develop]
  PUSH --> DD[deploy-do.yml]
  DD --> V[validate.yml hard gate]
  DD --> EG[e2e-gate prod only]
  DD --> MG[migrate-gate prod only]
  V --> DEP[deploy @ environment prod/dev]
  DEP --> SSH[SSH droplet: env + compose + health]
  PUSH --> MIG[supabase-migrations.yml]
  PUSH --> SBM[sbom.yml]
  SCHED[schedule] --> BK[db-backup.yml]
  SCHED --> RT[db-restore-test.yml]
```

### Environment / approval mapping (as coded)

| Workflow / job | Environment | Approval in code? | Repo-documented protection |
|---|---|---|---|
| `deploy-do.deploy` (prod) | `prod` | None | docs say **no protection rules** (CI-P1-001) |
| `deploy-do.deploy` (dev) | `dev` | None | none |
| `deploy-do.resolve-ip` | `prod`/`dev` | None | none |
| `terraform-do.terraform-apply-prod` | `prod-approval` | Env only | docs say **no reviewers configured** |
| `terraform-do.terraform-apply-dev` | `dev` | None | none |
| `supabase-migrations.migrate` | `prod`/`dev` | None | none |

### Action pinning verification (repo-level)

Method: regex scan of every `uses:` line for a 40-character hex SHA. Result: **all external actions pinned**; the only non-hex `uses:` entries are the 7 local reusable-workflow references (`./.github/workflows/e2e.yml`, `validate.yml`, `supabase-migrations.yml`), which is correct and expected.

Pinned actions observed (prefixes): `actions/checkout@11bd7190…`, `actions/setup-node@1d0ff469…`, `docker/login-action@c94ce9fb…`, `docker/setup-buildx-action@8d2750c6…`, `docker/build-push-action@10e90e36…`, `appleboy/ssh-action@0ff4204d…`, `aquasecurity/trivy-action@c07df6fe…`, `actions/upload-artifact@ea165f8d…`, `actions/download-artifact@d3f86a10…`, `actions/github-script@f28e40c7…`, `actions/dependency-review-action@2031cfc0…`, `chromaui/action@1cfa065c…`, `hashicorp/setup-terraform@b9cd54a3…`, `github/codeql-action/{init,analyze}@1190a975…`.

### Privileged-trigger check

`grep -ri "pull_request_target|workflow_run" .github/workflows/` → **no matches**. No privileged-trigger danger present.

### Permissions coverage

16/16 workflows declare a `permissions:` block (verified by grep). Grants flagged as unused: `deploy-do.yml` `id-token: write`, `actions: write`; `test.yml` `security-events: write`; `terraform-do.yml` `id-token: write`, `pull-requests: write`.

### Diff vs prior audit (`20260806-1722-develop-75d3926`)

| Prior finding | Status now | Note |
|---|---|---|
| CI-P1-001 build-push/deploy-do race | verified-fixed | build-push push trigger removed |
| CI-P1-002 terraform prod apply ungated | verified-fixed | `needs: validate-gate, e2e-gate, migrate-gate` + `prod-approval` |
| CI-P2-003 unpinned CLI / migration race | verified-fixed | pinned `2.107.0` + concurrency |
| CI-P2-004 loose health checks | verified-fixed | strict 200 / 301-302-307 + container health gate |
| CI-P2-005 soft deploy audit | verified-fixed | `validate.yml` audit hard-fails |
| CI-P2-006 Trivy SARIF not in code scanning | partially-fixed | CodeQL now uploads SARIF; Trivy still artifact-only |
| CI-P3-007 e2e CLI `version: latest` | verified-fixed | pinned `supabase@2.107.0` |
| CI-P3-008 missing permissions (3 workflows) | verified-fixed | 16/16 declare permissions |
| CI-P3-009 secret patterns / history | still-open | CI-P3-005 |
| CI-P3-010 Node 18+20 doc drift | partially-fixed | docs now say `>= 20`; only 20.x tested |

### Commands run (reproducibility)

```powershell
Get-ChildItem .github\workflows                              # 16 files
Select-String -Path .github\workflows\*.yml -Pattern '^  [a-zA-Z0-9_-]+:'   # job names
Select-String -Path .github\workflows\*.yml -Pattern 'uses:\s'              # pinning (regex-filtered)
Select-String -Path .github\workflows\*.yml -Pattern 'pull_request_target|workflow_run'  # no matches
Select-String -Path .github\workflows\*.yml -Pattern 'permissions:'         # 16 matches
Select-String -Path .github\workflows\*.yml -Pattern 'continue-on-error'
Select-String -Path .github\workflows\*.yml -Pattern 'environment:|prod-approval'
Get-ChildItem .github\branch-protection -Recurse -Force
```

Not reproducible in this environment: `git rev-parse HEAD`, `node scripts/sync-review-md.mjs --check`, `node scripts/verify-prompts.js verify` — `git` and `node` are not installed on the audit host PATH.
