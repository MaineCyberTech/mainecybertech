# GitHub Actions, CI/CD, and Governance Audit

## Audit Metadata

- Audit name: repo-deep-dive
- Run: 20260801-0233-develop-a585f1d
- Repository: MaineCyberTech/mainecybertech (https://github.com/MaineCyberTech/mainecybertech.git)
- Branch: develop
- Commit SHA: a585f1d
- Generated at: 2026-08-01
- Auditor: principal-level repository auditor (fresh pass; no reliance on prior reports)
- Area code: CI
- Output path: prompts/repo-deep-dive/20260801-0233-develop-a585f1d/10_github_actions_cicd_governance.md
- Scope limitations:
  - Branch protection, environment protection rules, required status checks, and secret values are GitHub-Settings-side configuration that cannot be read from the repository. These are marked `Unknown` and flagged for operator verification.
  - Live CI status (green/red runs) was not inspected; analysis is against current file content at a585f1d.

## Scope

Reviewed all 13 files in `.github/workflows/` (build-push, chromatic, db-backup, db-restore-test, dependency-review, deploy-do, e2e, lint, supabase-migrations, terraform-do, test, typecheck, validate), `.github/dependabot.yml`, `.github/CODEOWNERS`, `.husky/pre-commit`, and the environment-referencing deploy/terraform workflows. Not reviewed in this report: SBOM/licensing (report 35/11), Docker/container internals (report 36).

## Evidence Reviewed

| Evidence | Type | Why relevant | Notes |
| -------- | ---- | ------------ | ----- |
| `.github/workflows/deploy-do.yml` | Workflow | Production/deploy pipeline | 307 lines; deploy job needs only build jobs |
| `.github/workflows/build-push.yml` | Workflow | GHCR image build/push | Duplicates deploy-do build jobs |
| `.github/workflows/validate.yml` | Workflow | Reusable gate | `workflow_call` only; no callers found |
| `.github/workflows/e2e.yml` | Workflow | E2E gate | `workflow_call` present; no callers found |
| `.github/workflows/supabase-migrations.yml` | Workflow | DB migrations gate | `workflow_call` present; no callers found |
| `.github/workflows/terraform-do.yml` | Workflow | DO IaC | prod apply gated on `prod-approval` |
| `.github/workflows/{test,lint,typecheck}.yml` | Workflows | PR/push validation | Path-filtered, fine-grained perms |
| `.github/workflows/{db-backup,db-restore-test}.yml` | Workflows | Scheduled backup/restore | No `permissions:` block |
| `.github/workflows/{chromatic,dependency-review}.yml` | Workflows | Chromatic + dep review | Third-party actions, tag-pinned |
| `.github/dependabot.yml` | Config | Update automation | npm + github-actions, weekly, groups |
| `.github/CODEOWNERS` | Config | Review ownership | 6 teams; no CI-workflow owner nuance for non-default branches |
| `.husky/pre-commit` | Hook | Pre-commit gate | scan-secrets + lint-staged |

## Executive Summary

The CI/CD estate is functional and far better than a skeleton: tests/lint/typecheck run on PR and push with path filters, deployments target a single droplet behind Caddy, prod Terraform apply is gated behind a `prod-approval` environment, GHA cache is used for Docker builds, and a pre-commit secret scanner exists. However, this audit finds the **documented governance gates do not actually exist in code**:

1. **`validate.yml`, `e2e.yml`, and `supabase-migrations.yml` are all defined as `workflow_call` workflows but nothing calls them.** `deploy-do.yml` deploys to production directly on a push to `main` with `needs: [setup, resolve-ip, build-api, build-worker, build-web]` only. There is no test/lint/typecheck/e2e/migration dependency and no automated approval gate visible in the workflow (an approval could exist only as GitHub environment protection rules on the `prod` environment — `Unknown`, must be verified).
2. **Every GitHub Action is pinned to a mutable tag** (`@v4`, `@v6`, `@v1`, `@v11` …), including high-risk third-party actions that receive the production SSH key, Cloudflare origin key, and Chromatic token (`appleboy/ssh-action@v1`, `chromaui/action@v11`). This is the single largest supply-chain gap in the pipeline.
3. **`id-token: write` is granted in `deploy-do.yml` and `terraform-do.yml` but no OIDC step exists** — an unnecessary privilege that widens a compromised runner's blast radius.
4. **Deploy concurrency uses `cancel-in-progress: true`**, so a second push cancels an in-flight production deploy mid-`docker compose up` — a partial-deploy risk.
5. `db-backup.yml` and `db-restore-test.yml` have **no `permissions:` block**, so they inherit the repository default token scope.
6. `validate.yml`'s `pnpm audit` runs with `continue-on-error: true`, so high-severity advisories never fail CI. `e2e.yml` has `actions: write` with no obvious consumer.
7. The "rollback-on-failure step" claimed in AGENTS.md is **not present**; only a manual `rollback_sha` workflow input exists. The API health probe treats Cloudflare HTTP `526` as healthy, a false-positive risk.
8. Images are built **twice** per push (build-push.yml and deploy-do.yml) — duplicate compute and GHCR writes.

Top recommended actions: wire `validate` + migrations into `deploy-do.yml`, pin all actions to commit SHAs, add explicit `permissions:` to the two scheduled workflows, remove unused `id-token: write`, change deploy concurrency to not cancel in-flight prod deploys, and add an automated rollback/health-fail step.

## Inventory

| Item | Path / symbol | Purpose | Current state | Risk | Notes |
| ---- | ------------- | ------- | ------------- | ---- | ----- |
| test.yml | Workflow | Unit/integration tests | Implemented, path-filtered | Low | Node 20 matrix, `pnpm test`, OpenAPI validation |
| lint.yml | Workflow | ESLint | Implemented, path-filtered | Low | |
| typecheck.yml | Workflow | tsc | Implemented, path-filtered | Low | |
| validate.yml | Workflow | Reusable gate | Defined, **never invoked** | Medium | Dead workflow_call |
| e2e.yml | Workflow | Playwright E2E | Implemented + workflow_call, **never invoked by deploy** | Medium | Supabase local reset in CI |
| supabase-migrations.yml | Workflow | DB migrations | Implemented + workflow_call, **never invoked by deploy** | High | Unpinned `supabase` CLI |
| deploy-do.yml | Workflow | Build 3 images + SSH deploy to droplet | Implemented | **High** | No validation gates, mutable-tag actions, no rollback step |
| build-push.yml | Workflow | GHCR push on push | Implemented | Medium | Duplicates deploy-do builds |
| terraform-do.yml | Workflow | DO IaC plan/apply | Implemented | Medium | prod apply gated; unused `id-token: write`; `terraform fmt -check` is `continue-on-error: true` |
| db-backup.yml | Workflow | Daily backup cron | Implemented | Medium | No `permissions:` block |
| db-restore-test.yml | Workflow | Weekly restore drill | Implemented | Medium | No `permissions:` block; unpinned `postgres:16-alpine` |
| chromatic.yml | Workflow | Storybook visual tests | Implemented | Medium | Unpinned third-party action with token |
| dependency-review.yml | Workflow | PR dependency diff | Implemented | Low | `fail-on-severity: high` |
| dependabot.yml | Config | Update automation | Implemented | Low | Weekly, grouped, 10 PR cap |
| CODEOWNERS | Config | Review ownership | Implemented | Low | `.github/workflows/` → infrastructure team |
| .husky/pre-commit | Hook | Secret scan + lint-staged | Implemented | Low | `sh scripts/scan-secrets.sh` + `pnpm exec lint-staged` |

## Domain Scorecard

| Category                  | Score | Evidence | Gap | Recommended action |
| ------------------------- | ----: | -------- | --- | ------------------ |
| .github/workflows         |    3 | 13 files, path filters, matrix | Actions tag-pinned; 2 workflows lack permissions | Pin to SHA; add permissions |
| PR validation             |    3 | test/lint/typecheck/dependency-review/e2e on PR | No required-check enforcement verifiable; `continue-on-error` audit | Wire required checks; block audit failures |
| Lint/typecheck/test/build |    4 | 3 workflows + OpenAPI validation + E2E | No build step in CI (images built separately) | Add `pnpm build` to validation path |
| Deploy workflows          |    2 | deploy-do.yml + build-push.yml | No gates, cancel-in-progress, no rollback step, 526 treated as ready | Wire validate/migrations; fix concurrency; add rollback |
| Migration workflows       |    3 | supabase-migrations.yml | Never called by deploy; unpinned CLI; `--include-all` broad | Call from deploy; pin CLI |
| Docker build/push         |    4 | docker/build-push-action with gha cache, SHA tags | Duplicate builds (build-push + deploy-do) | Consolidate to single build workflow |
| Releases                  |    0 | No release workflow, no tags/draft releases | No release process at all | Add tag-based release + provenance |
| Badge/report generation   |    2 | PR comments for Terraform plan; E2E report artifact | No coverage/status badges; no security report artifact | Add badges; publish scan reports |
| Secrets                   |    3 | `${{ secrets.* }}` used correctly; pre-commit scanner | Redis password never provisioned to droplet (see report 36); prod.tfvars tracked | Add REDIS_PASSWORD; un-track tfvars |
| permissions blocks        |    2 | Present in most workflows | db-backup/db-restore-test none; `id-token: write` unused twice | Add/trim permissions |
| OIDC                      |    0 | `id-token: write` declared in 2 workflows | No OIDC/AWS/cloud federation used | Remove or implement OIDC |
| Environment protection    |    3 | `prod-approval` on terraform apply; `dev`/`prod` envs on deploy | Deploy env rules are Settings-side (Unknown); deploy job env is dynamic | Verify `prod` env protection; document |

## Detailed Review

### Item: deploy-do.yml (deployment pipeline)

- Evidence: `.github/workflows/deploy-do.yml`
- What it does: On push to main/develop (app paths) or manual dispatch, builds API/worker/web images to GHCR (SHA-tagged), resolves the droplet IP via DO API, SSHes in, writes `/opt/mct-portal/.env` from secrets, clones the repo onto the droplet, copies Caddyfile + compose, and `docker compose up`.
- How it appears to work: Line 175 `deploy: needs: [setup, resolve-ip, build-api, build-worker, build-web]` — the deploy job's only dependencies are the build jobs. No test/lint/typecheck/e2e/migration dependency exists.
- Dependencies: GHCR (`packages: write`), DO API token, CI SSH key, Cloudflare origin cert/key, all application secrets.
- Current controls: SHA-tagged images; `git reset --hard` ensures droplet repo parity; `.env` written with `chmod 600`; health checks after deploy; `environment: ${{ needs.setup.outputs.name }}` binds the deploy to a named environment.
- Missing controls: Validation gates (validate/e2e/migrations); automatic rollback on health failure; SHA-pinned actions; in-flight deploy protection (cancel-in-progress).
- Risks: Direct push to main can deploy to prod with zero automated validation; a second push can cancel a running deploy; a compromised `appleboy/ssh-action` tag would expose the prod SSH key + CF origin key.
- Recommended improvement: Add `validate` (workflow_call) and `supabase-migrations` (workflow_call) as required `needs`; pin all actions to SHAs; set `cancel-in-progress: false` for the deploy group; add a rollback step on health-check failure.
- Suggested tests: CI syntax validation (`actionlint`); a fixture asserting deploy job `needs` includes validation jobs.
- Suggested docs: Update `docs/ROLLBACK_PROCEDURES.md` and AGENTS.md gate description to match reality.

### Item: validate.yml / e2e.yml / supabase-migrations.yml (unused gates)

- Evidence: `.github/workflows/validate.yml` (line 4 `workflow_call:`), `.github/workflows/e2e.yml` (line 23), `.github/workflows/supabase-migrations.yml` (line 10); grep of all workflows for `uses: ./.github/workflows` returned no caller.
- What it does: Three reusable workflows exist but are never referenced.
- How it appears to work: They are dead code from the CI/CD perspective. AGENTS.md states "All prod deploys call `supabase-migrations.yml` via `workflow_call`" and describes a validate/e2e gate — this is contradicted by the files.
- Dependencies: none (orphaned).
- Current controls: n/a.
- Missing controls: Wiring into deploy-do.yml.
- Risks: Contradiction between documented governance and actual pipeline; migrations no longer block deploys, so schema drift can ship with app code.
- Recommended improvement: In deploy-do.yml, add `validate` as a required `needs` for the deploy job and a `call-migrations` job that invokes `supabase-migrations.yml` for the correct environment before deploy.
- Suggested tests: `actionlint`/fixture that fails if a deploy job lacks the validation dependency.
- Suggested docs: Fix AGENTS.md gate claims; document the actual pipeline.

### Item: Action pinning

- Evidence: Every `uses:` across all 13 workflows is a mutable tag: `actions/checkout@v4`, `actions/setup-node@v4`, `docker/login-action@v3`, `docker/setup-buildx-action@v3`, `docker/build-push-action@v6`, `appleboy/ssh-action@v1`, `chromaui/action@v11`, `supabase/setup-cli@v1` (`version: latest`), `actions/dependency-review-action@v4`, `hashicorp/setup-terraform@v3`, `actions/github-script@v7`, `actions/upload-artifact@v4`, `actions/download-artifact@v4`.
- What it does: Tags move; the pipeline's exact code is not reproducible.
- How it appears to work: `@v4`-style pinning "works" until a tag is force-pushed or a compromised release is published under the tag.
- Dependencies: GitHub Actions ecosystem.
- Current controls: None (no SHA pins, no dependabot configured to pin SHAs; dependabot config uses tag-based ecosystem).
- Missing controls: Full SHA pinning with `@<sha>` + short name comment.
- Risks: Compromise of `appleboy/ssh-action@v1` or `chromaui/action@v11` leaks the highest-value secrets in the repo (CI_SSH_PRIVATE_KEY, CF_ORIGIN_KEY, CHROMATIC_PROJECT_TOKEN).
- Recommended improvement: Pin all actions to commit SHAs; configure Dependabot to update SHAs.
- Suggested tests: A CI job that greps `uses:` for `@v` and fails.
- Suggested docs: Add a "pin your actions" line to `docs/GITHUB_SECRETS_AND_VARIABLES_MATRIX.md`.

### Item: Concurrency and cancel-in-progress

- Evidence: `.github/workflows/deploy-do.yml:34-36` (`group: deploy-do-${{ github.ref }}`, `cancel-in-progress: true`); same pattern in build-push.yml:16-18.
- What it does: A newer run cancels the older run for the same ref.
- How it appears to work: Fine for build/validation jobs; dangerous for the deploy job which performs `docker compose down` then `up` on the droplet.
- Dependencies: n/a.
- Current controls: Single concurrency group scopes the whole workflow.
- Missing controls: Different groups for build vs deploy; `cancel-in-progress: false` for deploy.
- Risks: Two rapid pushes → first deploy cancelled mid-swap → droplet left with partial/old stack; monitoring treats it as down.
- Recommended improvement: Use separate concurrency groups for build and deploy, and never cancel an in-flight production deploy.
- Suggested tests: None (config-level).
- Suggested docs: Note in ROLLBACK_PROCEDURES.md.

### Item: Permissions hygiene

- Evidence: `deploy-do.yml:26-30` declares `id-token: write` (no OIDC use); `terraform-do.yml:16-20` declares `id-token: write` (no OIDC use); `db-backup.yml` and `db-restore-test.yml` declare **no** `permissions:` at all; `e2e.yml:25-28` declares `actions: write` with no visible consumer (Playwright report upload uses upload-artifact).
- What it does: Unnecessary token privileges are granted or inherited.
- How it appears to work: Token scopes are broader than required.
- Dependencies: n/a.
- Current controls: `contents: read` on most workflows.
- Missing controls: Explicit minimal `permissions` on db-backup/db-restore-test; removal of unused `id-token`/`actions` scopes.
- Risks: If a runner is compromised, the leaked GITHUB_TOKEN has broader authority than the workflow needs; a token write scope on scheduled jobs could be abused to push code.
- Recommended improvement: Add `permissions: contents: read` to both backup workflows; remove `id-token: write` from both; drop `actions: write` from e2e.yml.
- Suggested tests: A lint job that checks every workflow has a permissions block and no unused scopes.
- Suggested docs: Matrix of per-workflow token scopes.

### Item: Migrations workflow

- Evidence: `.github/workflows/supabase-migrations.yml`
- What it does: Links a Supabase project (dev/prod by branch) and pushes migrations.
- How it appears to work: `npm install -g supabase` (unpinned CLI), `supabase db diff --linked` (results discarded with `|| true`), then `supabase db push --include-all`.
- Dependencies: SUPABASE_ACCESS_TOKEN, SUPABASE_PROJECT_REF vars.
- Current controls: `environment` selection per branch; dry-run diff.
- Missing controls: Pinned CLI version; diff failure actually gating push; invocation by the deploy pipeline.
- Risks: Unpinned CLI drift breaks prod migrations; `db push --include-all` applies every repo migration indiscriminately.
- Recommended improvement: Pin `supabase` CLI version; make diff a real check; call from deploy-do.
- Suggested tests: None (config-level).
- Suggested docs: Note the pipeline wiring.

### Item: Terraform workflow

- Evidence: `.github/workflows/terraform-do.yml`
- What it does: fmt/validate/plan on push+PR; apply gated for prod on `prod-approval` environment; plan posted to PRs; tfvars generated from secrets into the checked-out dir.
- How it appears to work: Solid gating for prod apply.
- Dependencies: DO/Cloudflare/Spaces secrets.
- Current controls: `prod-approval` environment; plan artifact download before apply; PR plan comment.
- Missing controls: `terraform fmt -check` has `continue-on-error: true` (line 49); plan artifact unsigned and retention `1 day` (if approval exceeds 1 day the apply job fails); `id-token: write` unused.
- Risks: Approval delay + artifact expiry → failed apply; fmt drift not enforced.
- Recommended improvement: Remove `continue-on-error` on fmt; remove `id-token: write`.
- Suggested tests: None (config-level).
- Suggested docs: Document prod approval flow.

### Item: Scheduled backup/restore

- Evidence: `.github/workflows/db-backup.yml`, `.github/workflows/db-restore-test.yml`
- What it does: Daily dump to S3-compatible Spaces; weekly restore drill into a temp postgres.
- How it appears to work: Uses AWS CLI + secrets; restore test runs `docker run postgres:16-alpine` with hardcoded `POSTGRES_PASSWORD=test`.
- Dependencies: SUPABASE_DB_URL, AWS keys, S3_BACKUP_BUCKET, SLACK_WEBHOOK_URL.
- Current controls: `if: failure()` Slack alert on backup; cleanup step.
- Missing controls: `permissions:` block; pinned container tag for postgres; alert parity for restore-test.
- Risks: Broad inherited GITHUB_TOKEN on scheduled runs.
- Recommended improvement: Add `permissions: contents: read`; pin `postgres:16-alpine` SHA.
- Suggested tests: None (config-level).
- Suggested docs: none.

## Scenario / Control Matrix

| ID     | Scenario or control | Evidence | Current control | Gap | Severity | Recommendation |
| ------ | ------------------- | -------- | --------------- | --- | -------- | -------------- |
| CI-001 | .github/workflows | 13 workflows | Path filters, matrix | Action tags mutable; 2 w/o permissions | P1 | SHA-pin; add permissions |
| CI-002 | PR validation | test/lint/typecheck/dep-review/e2e | PR triggers | `pnpm audit` non-blocking; required checks unverifiable | P2 | Block audit; enforce checks |
| CI-003 | Lint/typecheck/test/build | 3 workflows | All run | No build in validation path | P2 | Add `pnpm build` |
| CI-004 | Deploy workflows | deploy-do.yml | SHA images, env binding | No gates; cancel-in-progress; no rollback | P1 | Wire gates; fix concurrency |
| CI-005 | Migration workflows | supabase-migrations.yml | branch env select | Not called by deploy; unpinned CLI | P1 | Call from deploy; pin CLI |
| CI-006 | Docker build/push | build-push + deploy-do | gha cache, SHA tags | Duplicate builds | P2 | Consolidate |
| CI-007 | Releases | none | — | No release process | P2 | Add release workflow |
| CI-008 | Badge/report generation | terraform PR comment, e2e artifact | PR plan comment | No coverage badges/security report | P3 | Add badges |
| CI-009 | Secrets | `secrets.*` usage | masked, chmod 600 .env | Redis password not provisioned (report 36) | P1 | Add REDIS_PASSWORD |
| CI-010 | permissions blocks | mostly present | contents: read | db-backup/restore none; id-token unused | P2 | Fix |
| CI-011 | OIDC | none | — | `id-token: write` unused | P3 | Remove or use |
| CI-012 | Environment protection | prod-approval (terraform) | gated apply | deploy env rules Settings-side (Unknown) | P2 | Verify + document |

## Findings

### Finding ID: CI-P1-001 - No validation, test, or migration gates on production deployment

- Severity: P1
- Confidence: High
- Area: CI/CD governance
- Evidence:
  - `.github/workflows/deploy-do.yml`
  - Symbol: `jobs.deploy.needs` at line 175 (`needs: [setup, resolve-ip, build-api, build-worker, build-web]`)
  - `.github/workflows/validate.yml` (workflow_call only, no callers)
  - `.github/workflows/e2e.yml` (line 23 workflow_call, no callers)
  - `.github/workflows/supabase-migrations.yml` (line 10 workflow_call, no callers)
- What is happening: `deploy-do.yml` builds and deploys directly on push to `main` (prod) or `develop` (dev). The deploy job depends only on the three build jobs. The `validate`, `e2e`, and `supabase-migrations` reusable workflows are defined but never invoked by any workflow (grep for `uses: ./.github/workflows` returned zero callers).
- Why it matters: AGENTS.md documents that "prod deploys require `validate` gate" and "All prod deploys call `supabase-migrations.yml` via `workflow_call`". The code contradicts the documentation. A push to main with a broken test suite or pending schema migration can go straight to production.
- User / business impact: Production regressions and schema drift ship without any automated safety net; recovery cost lands on customers.
- Security / privacy / reliability impact: Untested code can reach prod; migration-skewed database schemas can break tenant data flows.
- Recommended fix: In `deploy-do.yml`, add a `validate` job (`uses: ./.github/workflows/validate.yml`) required by `deploy`, and a `call-migrations` job invoking `supabase-migrations.yml` with the target environment, required by `deploy`. Optionally require `e2e` for prod.
- Suggested validation: `actionlint`; a grep-based CI guard that fails if `deploy` job's `needs` omits `validate`.
- Owner suggestion: Infrastructure lead.
- Effort estimate: 1-2 hours.
- Dependencies: None.
- Status: Open.

### Finding ID: CI-P1-002 - All GitHub Actions pinned to mutable tags, including secret-handling third-party actions

- Severity: P1
- Confidence: High
- Area: CI/CD governance / supply chain
- Evidence:
  - `.github/workflows/deploy-do.yml:183,244` (`appleboy/ssh-action@v1`)
  - `.github/workflows/chromatic.yml:38` (`chromaui/action@v11`)
  - `.github/workflows/*.yml` — all `actions/checkout@v4`, `setup-node@v4`, `docker/build-push-action@v6`, `setup-buildx-action@v3`, `login-action@v3`, `supabase/setup-cli@v1` (`version: latest`), `actions/dependency-review-action@v4`, `hashicorp/setup-terraform@v3`, `actions/github-script@v7`, `upload-artifact@v4`, `download-artifact@v4`
- What is happening: No action anywhere in the repository is pinned to a commit SHA; every `uses:` references a mutable tag. The unpinned `appleboy/ssh-action` is passed `CI_SSH_PRIVATE_KEY` and the `envs: CF_ORIGIN_CERT,CF_ORIGIN_KEY` (deploy-do.yml:187,250,283-284).
- Why it matters: A tag can be re-pointed or a malicious release published under a major-version tag. Third-party actions that receive the production SSH key and Cloudflare origin private key are the highest-value attack surface in the pipeline.
- User / business impact: Full server compromise if the SSH key action is backdoored.
- Security / privacy / reliability impact: Credential exfiltration, supply-chain poisoning, non-reproducible builds.
- Recommended fix: Pin every action to its commit SHA (`uses: docker/login-action@<sha>`) with the human-readable version as a trailing comment; keep `dependabot.yml` updating them.
- Suggested validation: CI job that scans `.github/workflows/*.yml` and fails on any `uses: <owner>/<repo>@v` tag.
- Owner suggestion: Infrastructure lead.
- Effort estimate: 1 hour.
- Dependencies: Dependabot `github-actions` group already enabled.
- Status: Open.

### Finding ID: CI-P1-003 - Deploy concurrency cancels in-flight production deployments

- Severity: P1
- Confidence: High
- Area: CI/CD governance / deploy reliability
- Evidence:
  - `.github/workflows/deploy-do.yml:34-36` (`concurrency: group: deploy-do-${{ github.ref }}, cancel-in-progress: true`)
  - `.github/workflows/build-push.yml:16-18` (same pattern)
- What is happening: The workflow-level concurrency group with `cancel-in-progress: true` cancels an older deploy when a newer run for the same ref starts. Deploy performs `docker compose down --remove-orphans` then `up -d` on the droplet (lines 272-274).
- Why it matters: Cancelling a running deploy mid-swap leaves the stack partially migrated (old API + new web, or a half-torn-down compose project).
- User / business impact: Portal outages during normal push activity.
- Security / privacy / reliability impact: Confusing partial states, prolonged downtime, harder diagnosis.
- Recommended fix: Scope deploy into its own group with `cancel-in-progress: false`; only cancel build/validation.
- Suggested validation: Config review; a stress test of two rapid pushes on develop.
- Owner suggestion: Infrastructure lead.
- Effort estimate: 30 min.
- Dependencies: None.
- Status: Open.

### Finding ID: CI-P1-004 - Redis password not provisioned to production droplet; known-default credentials in compose

- Severity: P1
- Confidence: High
- Area: CI/CD governance / secrets (cross-ref CTR-P1-001 in report 36)
- Evidence:
  - `.github/workflows/deploy-do.yml:208-239` — the `.env` write loop does not include `REDIS_PASSWORD`
  - `infra/digitalocean/docker-compose.yml:24` (`--requirepass ${REDIS_PASSWORD:-mct_redis_changeme_in_production}`), lines 46,80,33
- What is happening: The deploy pipeline writes the application `.env` from secrets but never writes `REDIS_PASSWORD`. Redis therefore runs in production with the hardcoded default `mct_redis_changeme_in_production` (also passed into API/worker `REDIS_URL`).
- Why it matters: A known, public default Redis credential on a production-adjacent service. Redis holds BullMQ jobs and webhook idempotency state.
- User / business impact: If redis is reachable, job queue and webhook dedup state can be read/tampered.
- Security / privacy / reliability impact: Unauthenticated-ish access to queue state; queue poisoning.
- Recommended fix: Add `REDIS_PASSWORD` to the deploy `.env` write loop; remove the fallback default or generate per-environment.
- Suggested validation: Post-deploy SSH check that redis is configured with a non-default password.
- Owner suggestion: Infrastructure lead.
- Effort estimate: 30 min.
- Dependencies: Redis config in compose (report 36).
- Status: Open.

### Finding ID: CI-P2-001 - Unused `id-token: write` permission in two workflows; no OIDC used

- Severity: P2
- Confidence: High
- Area: CI/CD governance / least privilege
- Evidence:
  - `.github/workflows/deploy-do.yml:29` (`id-token: write`)
  - `.github/workflows/terraform-do.yml:18` (`id-token: write`)
  - No `auth`, `role-to-assume`, `aws configure` (OIDC) anywhere in these workflows
- What is happening: `id-token: write` is granted but never exercised.
- Why it matters: Per least-privilege, a compromised runner gains the ability to mint OIDC tokens that (depending on provider trust config) could be exchanged for cloud credentials.
- User / business impact: Low today; increased blast radius if the runner is compromised.
- Security / privacy / reliability impact: Unnecessary token scope.
- Recommended fix: Remove `id-token: write` from both workflows unless OIDC is introduced.
- Suggested validation: Grep-based CI guard.
- Owner suggestion: Infrastructure lead.
- Effort estimate: 5 min.
- Dependencies: None.
- Status: Open.

### Finding ID: CI-P2-002 - `pnpm audit` advisories do not fail CI; `actions: write` over-scoped in e2e

- Severity: P2
- Confidence: High
- Area: CI/CD / supply-chain gating
- Evidence:
  - `.github/workflows/validate.yml:23-25` (`pnpm audit --audit-level=high`, `continue-on-error: true`)
  - `.github/workflows/e2e.yml:25-28` (`permissions: ... actions: write`)
- What is happening: High/critical advisory findings are logged but never block. `actions: write` is granted in e2e.yml with no visible consumer.
- Why it matters: Vulnerability hygiene is advisory-only; there is no enforcement threshold in the mainline pipeline (dependency-review.yml does cover PR diffs, which is a partial control).
- User / business impact: Known vulnerable dependencies can merge and ship.
- Security / privacy / reliability impact: Elevated exploit surface.
- Recommended fix: Make `pnpm audit` fail (drop `continue-on-error` or fail on `>= high` with an explicit exception list); remove `actions: write`.
- Suggested validation: CI run with a deliberately vulnerable dev dependency.
- Owner suggestion: Security lead.
- Effort estimate: 30 min.
- Dependencies: None.
- Status: Open.

### Finding ID: CI-P2-003 - No automatic rollback on deploy health failure; 526 treated as healthy

- Severity: P2
- Confidence: High
- Area: CI/CD / deploy reliability
- Evidence:
  - `.github/workflows/deploy-do.yml:291-306` (health checks)
  - `.github/workflows/deploy-do.yml:293` (`if [ "$CODE" = "200" ] || [ "$CODE" = "526" ]`)
  - No rollback step; only the manual `rollback_sha` input (lines 11-15, 32)
- What is happening: AGENTS.md documents a "rollback-on-failure step", but the workflow only supports manual rollback via `workflow_dispatch`. The API probe treats Cloudflare error `526` (origin SSL handshake failure) as "ready".
- Why it matters: A bad deploy is not automatically reverted; and a 526 (TLS failure to origin) passing the gate can mask a broken origin.
- User / business impact: Extended prod outage after a bad deploy; false-green health check.
- Security / privacy / reliability impact: Delayed recovery.
- Recommended fix: Add a rollback job that redeploys the previous image tag when health checks fail; remove `526` from the "ready" set.
- Suggested validation: Drill that fails health and confirms rollback.
- Owner suggestion: Infrastructure lead.
- Effort estimate: 2-4 hours.
- Dependencies: Image tag scheme already supports rollback via `IMAGE_TAG`.
- Status: Open.

### Finding ID: CI-P2-004 - Duplicate image builds per push (build-push.yml + deploy-do.yml)

- Severity: P2
- Confidence: High
- Area: CI/CD efficiency
- Evidence:
  - `.github/workflows/build-push.yml` (push trigger, builds 3 images)
  - `.github/workflows/deploy-do.yml:103-172` (same 3 images, same triggers)
- What is happening: Every push to main/develop that touches app paths triggers two independent full builds of the same three images, both pushing the same `${{ github.sha }}` tag to GHCR.
- Why it matters: Doubles GHCR network/compute cost and can create a race on identical tags (benign but wasteful; on failure it can also produce confusing partial pushes).
- User / business impact: Wasted CI minutes and GHCR egress.
- Security / privacy / reliability impact: Higher attack surface (more build execution); inconsistent tag availability windows.
- Recommended fix: Consolidate into a single build workflow that deploy-do calls via `workflow_call`.
- Suggested validation: Observability on GHCR push counts.
- Owner suggestion: Infrastructure lead.
- Effort estimate: 2 hours.
- Dependencies: None.
- Status: Open.

### Finding ID: CI-P3-001 - `terraform fmt -check` non-blocking; `prod.tfvars` placeholder file tracked; misc hygiene

- Severity: P3
- Confidence: High
- Area: CI/CD hygiene
- Evidence:
  - `.github/workflows/terraform-do.yml:47-49` (`terraform fmt -check`, `continue-on-error: true`)
  - `infra/terraform/digitalocean/env/prod.tfvars` — committed with placeholder values while `dev.tfvars` is gitignored (`.gitignore:56` `**/env/*.tfvars`)
  - `scripts/backup-database.sh` uses unpinned `postgres:15`; `db-restore-test.yml:38` uses unpinned `postgres:16-alpine` and hardcoded `POSTGRES_PASSWORD=test`
- What is happening: Formatting drift is tolerated; the prod tfvars file is tracked with fake values while CI regenerates it; container tags in the backup path are unpinned.
- Why it matters: Fmt drift accumulates; tracked placeholder tfvars are a foot-gun for local `terraform apply`; unpinned postgres image in the restore drill is a (minor) supply-chain risk.
- User / business impact: Low.
- Security / privacy / reliability impact: Low.
- Recommended fix: Drop `continue-on-error` on fmt; untrack `prod.tfvars`; pin postgres image digests.
- Suggested validation: Grep guard.
- Owner suggestion: Infrastructure lead.
- Effort estimate: 30 min.
- Dependencies: None.
- Status: Open.

## Risks

| Risk | Severity | Likelihood | Impact | Evidence | Mitigation |
| ---- | -------- | ---------- | ------ | -------- | ---------- |
| Untested code reaches prod | P1 | High | High | deploy-do.yml:175 no validate deps | Wire validate + migrations into deploy |
| Action tag compromise leaks SSH/CF keys | P1 | Low | Critical | appleboy/ssh-action@v1 + secrets | SHA-pin all actions |
| Deploy cancelled mid-swap | P1 | Medium | High | concurrency cancel-in-progress: true | Separate groups, no cancel on prod |
| Known Redis default password in prod | P1 | High | Medium | compose:24, deploy .env lacks REDIS_PASSWORD | Provision random password |
| No auto-rollback; 526 false-green | P2 | Medium | High | deploy-do.yml:293 | Add rollback job; fix health logic |
| Unpinned Supabase CLI breaks migrations | P2 | Medium | Medium | supabase-migrations.yml:35 | Pin CLI version |
| Audit advisories never block | P2 | Medium | Medium | validate.yml:23-25 | Remove continue-on-error |

## Recommendations

### Immediate / Release Blocking

1. Wire `validate` (and for prod `e2e`) + `supabase-migrations` as required `needs` of `deploy` in `deploy-do.yml`.
2. SHA-pin every action in all 13 workflows (highest priority: `appleboy/ssh-action`, `chromaui/action`, all `docker/*-action`).
3. Add `REDIS_PASSWORD` to the deploy `.env` provisioning loop.

### This Week

4. Add explicit `permissions: contents: read` to `db-backup.yml` and `db-restore-test.yml`; remove unused `id-token: write` (both) and `actions: write` (e2e).
5. Fix deploy concurrency so in-flight prod deploys are never cancelled.
6. Add an automatic rollback job on health-check failure; stop treating HTTP 526 as healthy.

### This Month

7. Make `pnpm audit` fail on `>= high`; keep an explicit exception allowlist.
8. Consolidate `build-push.yml` and `deploy-do.yml` builds into one build workflow.
9. Remove `continue-on-error` from `terraform fmt -check`; untrack placeholder `prod.tfvars`.
10. Pin `supabase` CLI version and make `db diff` failures block `db push`.

### Later / Platform Evolution

11. Introduce a tag-based release workflow with signed provenance.
12. Add coverage/security-status badges and publish scan reports as artifacts.
13. Evaluate OIDC federation for DO/Spaces credential access (only then keep `id-token: write`).

## Quick Wins

| Quick win | Why it helps | Files likely involved | Validation |
| --------- | ------------ | --------------------- | ---------- |
| Add `permissions: contents: read` to backup workflows | Least privilege on scheduled runs | db-backup.yml, db-restore-test.yml | Review diff |
| Remove `id-token: write` (2 files) and `actions: write` (1 file) | Reduces compromised-runner blast radius | deploy-do.yml, terraform-do.yml, e2e.yml | Grep guard |
| Drop `continue-on-error` on fmt | Enforces IaC formatting | terraform-do.yml:47-49 | Run fmt check |
| Untrack `prod.tfvars` | Removes local `terraform apply` foot-gun | `git rm --cached` | `git ls-files` check |

## Hardening Backlog

| Backlog item | Priority | Owner suggestion | Effort | Dependency |
| ------------ | -------- | ---------------- | ------ | ---------- |
| Deploy validation gates | P1 | Infrastructure lead | 2 h | none |
| SHA-pin all actions | P1 | Infrastructure lead | 1 h | none |
| Redis password provisioning | P1 | Infrastructure lead | 30 m | compose change (report 36) |
| Deploy concurrency fix | P1 | Infrastructure lead | 30 m | none |
| Auto-rollback job | P2 | Infrastructure lead | 3 h | health-check logic |
| Audit fail-hard | P2 | Security lead | 30 m | exception list |
| Build workflow consolidation | P2 | Infrastructure lead | 2 h | none |
| Release workflow + provenance | P2 | Platform lead | 1 d | none |

## Suggested Tests

- Unit/CI: `actionlint` run as a CI job over all workflows; grep-guard CI job asserting (a) no `uses: *@v` tags, (b) every workflow has `permissions:`, (c) `deploy` job needs includes `validate`.
- E2E: two rapid pushes to develop while observing droplet state to prove concurrency safety.
- Regression: manual rollback drill (`workflow_dispatch` with `rollback_sha`) end-to-end.
- Security: deliberately introduce a `pnpm audit` high-severity dev dep in a branch to confirm fail-fast after the fix.

## Suggested Documentation Updates

- `AGENTS.md` — correct the CI/CD gate descriptions to match the actual pipeline after fixes.
- `docs/ROLLBACK_PROCEDURES.md` — document automatic rollback semantics and 526 handling.
- `docs/GITHUB_SECRETS_AND_VARIABLES_MATRIX.md` — document `REDIS_PASSWORD` secret and action-pinning policy.
- `docs/INDEX.md` — add this audit report.

## Open Questions

| Question | Why it matters | Evidence needed |
| -------- | -------------- | --------------- |
| Does the `prod` GitHub environment have required reviewers / approval rules? | Determines whether prod deploys already require human approval | GitHub repo settings (Settings → Environments) |
| Are required status checks enforced on `main`/`develop`? | Confirms PR validation is actually mandatory | GitHub branch protection settings |
| Is `validate.yml` expected to be wired but forgotten? | AGENTS.md implies it is active | CI history / owner intent |
| Was the Redis default password ever rotated on existing droplets? | The current droplet may already run the known default | `docker inspect mct-portal-redis-1` for the `command` |

## Appendix

### Workflow trigger and gate map

```
push/PR (main,develop)
 ├─ test.yml, lint.yml, typecheck.yml      → PR validation (path-filtered)
 ├─ e2e.yml                                 → PR E2E (path-filtered, +workflow_call, uncalled)
 ├─ dependency-review.yml                   → PR dependency diff gate
 ├─ terraform-do.yml                        → plan (PR comment) / apply (prod-approval)
 └─ deploy-do.yml (push only)               → build 3 images → SSH deploy
      └─ deploy job needs: setup, resolve-ip, build-api, build-worker, build-web   ⚠ NO validate
validate.yml (workflow_call)                → test+lint+typecheck+audit   ⚠ ORPHANED
supabase-migrations.yml (push + workflow_call) → db push                 ⚠ NOT CALLED BY DEPLOY
build-push.yml (push)                       → builds same 3 images       ⚠ DUPLICATE
db-backup.yml / db-restore-test.yml         → cron backup/restore        ⚠ no permissions block
```

### Action pinning inventory (all mutable tags, 0 SHAs)

`actions/checkout@v4` · `actions/setup-node@v4` · `docker/login-action@v3` · `docker/setup-buildx-action@v3` · `docker/build-push-action@v6` · `appleboy/ssh-action@v1` · `chromaui/action@v11` · `supabase/setup-cli@v1` · `actions/dependency-review-action@v4` · `hashicorp/setup-terraform@v3` · `actions/github-script@v7` · `actions/upload-artifact@v4` · `actions/download-artifact@v4`
