# GitHub Actions, CI/CD, and Governance Audit

## Audit Metadata

- Audit name: repo-deep-dive
- Run: 20260806-1722-develop-75d3926
- Repository: https://github.com/MaineCyberTech/mainecybertech (MCT client portal monorepo)
- Branch: develop
- Commit SHA: 75d39269310fcc09826fe532d5838d3a53d1739a
- Generated at: 2026-08-06 17:22 UTC
- Auditor: principal-level repository auditor (fresh pass — no reliance on prior reports)
- Area code: CI
- Output path: prompts/repo-deep-dive/20260806-1722-develop-75d3926/10_github_actions_cicd_governance.md (operator-specified path; shared rules default `docs/audits/...` deviates)
- Scope limitations:
  - Branch protection rules and required checks were **not** verifiable from the repo (GitHub settings); marked as open questions.
  - Secrets existence/values are referenced but never printed; only configuration shape was reviewed.
  - No GitHub-hosted runner logs or live runs were inspected; all workflow behavior is inferred from file content plus SHA resolution against the GitHub API.

## Scope

Reviewed all 13 workflow files under `.github/workflows/`, `.github/dependabot.yml`, `.github/CODEOWNERS`, `.husky/pre-commit`, `scripts/scan-secrets.sh`, root `package.json` (scripts, overrides, lint-staged), `turbo.json`, per-package jest coverage thresholds, and cross-referenced deploy/terraform/migration workflows against each other. Container/infra details are reported in the companion report `12_infra_deployment_environment_drift.md`.

## Evidence Reviewed

| Evidence | Type | Why relevant | Notes |
| -------- | ---- | ------------ | ----- |
| `.github/workflows/deploy-do.yml` (363 lines) | Workflow | Main deploy pipeline + gates | Reviewed in full; build/gate/deploy/health logic |
| `.github/workflows/test.yml` (130 lines) | Workflow | PR/push test + coverage + audit + trivy + secrets-scan | Coverage hard gate confirmed |
| `.github/workflows/e2e.yml` (137 lines) | Workflow | Playwright E2E w/ local Supabase | `.env.local` sourcing + UPPERCASE jq keys confirmed |
| `.github/workflows/terraform-do.yml` (196 lines) | Workflow | Infra plan/apply | Plan/apply split, approval env confirmed |
| `.github/workflows/supabase-migrations.yml` (50 lines) | Workflow | DB migrations | Unpinned CLI, no concurrency |
| `.github/workflows/validate.yml` (95 lines) | Workflow | Reusable deploy gate | audit job is continue-on-error |
| `.github/workflows/build-push.yml` (118 lines) | Workflow | GHCR image push on every push | Duplicate of deploy-do build jobs; missing test-accounts build arg |
| `.github/workflows/{lint,typecheck,chromatic,dependency-review,db-backup,db-restore-test}.yml` | Workflows | PR gates + scheduled jobs | Reviewed in full |
| `.github/dependabot.yml` | Config | npm + GHA dependency updates | Weekly, grouped |
| `.github/CODEOWNERS` | Config | Review ownership | Present, team-based |
| `.husky/pre-commit` + `scripts/scan-secrets.sh` | Hook | Pre-commit secret scan + format | Mirrors CI secrets-scan |
| `package.json` + `turbo.json` | Config | Scripts/overrides/thresholds | Overrides verified: js-yaml >=4.3.0, @opentelemetry/core >=2.8.0, scoped brace-expansion |
| GitHub API (14 SHA lookups) | External | Pin validity | All 14 pinned action SHAs resolve HTTP 200 |

## Executive Summary

The CI/CD system is mature and substantially hardened: every third-party action in every workflow is SHA-pinned (14/14 verified resolvable against the GitHub API — checkout@v4.2.2, setup-node@v4.2.0, build-push@v6.19.2, etc.), there is **no `pull_request_target` anywhere**, permissions blocks exist on 10 of 13 workflows, deploys use environment protection (`prod` + `prod-approval`), coverage is CI-enforced with per-package thresholds in all 4 packages, `pnpm audit --audit-level=high` is a hard gate in `test.yml`, trivy + a diff-based secret scanner run on every push/PR, and concurrency groups queue (never cancel) in-flight deploys.

The three highest-risk gaps found:

1. **SSH to both droplets is open to the internet** — `admin_ip_ranges` defaults to `0.0.0.0/0` and the `terraform-do` tfvars generator never sets it (finding INFRA-P1-001 in the companion report; produced by the terraform-do workflow, referenced here).
2. **`build-push.yml` races `deploy-do.yml` on identical GHCR tags with different web image content** — build-push omits `NEXT_PUBLIC_TEST_ACCOUNTS_ENABLED`, deploy-do sets it; both push `mct-web:${{ github.sha }}`. Last-writer-wins makes dev's test-accounts behavior nondeterministic and breaks dev rollbacks (CI-P1-001).
3. **The prod terraform apply gate claimed in AGENTS.md (validate + e2e + migrations) does not exist in code** — only the `prod-approval` environment is used (CI-P1-002).

Medium-severity items: unpinned Supabase CLI versions in two workflows plus a concurrent-`db push` race (CI-P2-003), loose post-deploy health checks (CI-P2-004), a soft `pnpm audit` inside the deploy gate (CI-P2-005), no code-scanning upload for trivy SARIF (CI-P2-006), and several P3 polish items (permissions blocks on 3 scheduled workflows, Node matrix 20.x only, no SBOM/provenance/release process, `version: latest` on setup-cli).

Overall this domain is **production-ready with hardening debt**; nothing found here is release-blocking on its own, but findings CI-P1-001/002 and INFRA-P1-001 should be addressed this week.

## Inventory

| Item | Path / symbol | Purpose | Current state | Risk | Notes |
| ---- | ------------- | ------- | ------------- | ---- | ----- |
| deploy-do | `.github/workflows/deploy-do.yml` | Build 3 images + deploy to DO droplet w/ gates | Functional | Med | Race w/ build-push; loose health checks |
| test | `.github/workflows/test.yml` | Unit/coverage + audit + trivy + secrets-scan | Functional | Low | Node 20 only; SARIF not uploaded to code scanning |
| e2e | `.github/workflows/e2e.yml` | Playwright vs local Supabase | Functional (253/253 per log) | Low | CLI `version: latest` |
| terraform-do | `.github/workflows/terraform-do.yml` | Plan on PR, apply on push w/ approval | Functional | Med | Missing validate/e2e/migrate gates; no concurrency; no state lock |
| supabase-migrations | `.github/workflows/supabase-migrations.yml` | db push per env | Functional | Med | `npm install -g supabase` unpinned; concurrent-push race |
| validate | `.github/workflows/validate.yml` | Deploy gate (test/lint/typecheck/audit) | Functional | Low | audit continue-on-error |
| build-push | `.github/workflows/build-push.yml` | GHCR images per SHA | Functional | Med | Duplicate of deploy-do builds; tag race |
| lint / typecheck | `.github/workflows/*.yml` | PR gates | Functional | Low | — |
| chromatic | `.github/workflows/chromatic.yml` | Storybook visual tests | Non-blocking by design | Low | Both steps continue-on-error |
| dependency-review | `.github/workflows/dependency-review.yml` | PR dep gate | Functional | Low | — |
| db-backup / db-restore-test | `.github/workflows/*.yml` | Scheduled backups + restore verification | Functional | Low | No permissions block; unpinned postgres image; weak integrity check |
| dependabot | `.github/dependabot.yml` | Weekly npm/GHA updates | Functional | Low | — |
| CODEOWNERS | `.github/CODEOWNERS` | Review ownership | Present | Low | Team names not verifiable |
| scan-secrets.sh / pre-commit | `.husky/pre-commit` | Local secret gate | Functional | Low | Patterns miss DO/CF/Supabase token formats |

## Domain Scorecard

| Category                  | Score | Evidence | Gap | Recommended action |
| ------------------------- | ----: | -------- | --- | ------------------ |
| .github/workflows        |    4 | 13 workflows, all SHA-pinned actions (14/14 verified), no pull_request_target | 3 workflows lack permissions blocks; no concurrency on migrations/terraform | Add explicit `permissions: contents: read`; add concurrency groups |
| PR validation            |    4 | lint/test/typecheck/e2e/dependency-review/chromatic/terraform-plan all run on PRs | No branch-protection verification possible; required checks unknown | Verify branch protection requires test/lint/typecheck/e2e/dependency-review |
| Lint/typecheck/test/build |    4 | `pnpm test:coverage` hard gate w/ per-package thresholds; OpenAPI validation; trivy; secrets-scan | Node matrix 20.x only (docs claim 18+20); ~6 parallel pnpm installs per push | Trim matrix; reuse build caches across workflows |
| Deploy workflows          |    3 | Gated prod deploys, queued concurrency, rollback support | Soft audit gate; duplicate build race; loose health checks | See CI-P1-001, CI-P2-004, CI-P2-005 |
| Migration workflows       |    3 | Env-gated, called from prod deploy | Unpinned CLI; concurrent db push possible | Pin supabase CLI; add concurrency group |
| Docker build/push         |    3 | SHA-immutable tags, gha cache, buildx | build-push duplicates deploy-do with divergent build args | Delete build-push or add test-accounts arg |
| Releases                  |    1 | No release/version workflow, no changelog automation | None | Optional backlog |
| Badge/report generation   |    2 | Playwright + trivy artifacts only; no badges | No code-scanning upload | Upload SARIF to code scanning |
| Secrets                   |    4 | GitHub Secrets env; .env written via SSH heredoc; e2e redaction step; scan-secrets | Full-history scan not enforced; tfvars generator drops admin_ip_ranges | Add history scan; set admin_ip_ranges via secret |
| permissions blocks        |    4 | Explicit on 10/13 workflows; least-privilege on the rest | db-backup/db-restore-test/supabase-migrations have none | Add `permissions: contents: read` |
| OIDC                      |    1 | `id-token: write` present but unused (DO/CF use static tokens) | No OIDC usage; static secrets only | N/A for current providers; document decision |
| Environment protection    |    4 | prod/prod-approval/dev environments; dynamic env on migrations | Cannot verify reviewers configured | Verify prod-approval has required reviewers |

Overall domain score: **3.5 / 5** — functional and hardened, with 3 medium-risk CI gaps and several P3 polish items.

## Detailed Review

### Item: deploy-do (`.github/workflows/deploy-do.yml`)

- Evidence: `deploy-do.yml` (363 lines)
- What it does: On push to main/develop (app paths) or workflow_dispatch (deploy_target + rollback_sha): determines env, resolves droplet IP via DO API, builds/pushes 3 GHCR images, runs validate gate (always) + e2e/migrate gates (prod only), then SSH-deploys: writes `.env` from secrets via heredoc loop (`printf '%s\n' "$pair"`), clones repo, copies Caddyfile/compose/prometheus, `compose down` + `up`, health checks.
- How it appears to work: Gates are wired as `needs: [validate, e2e-gate, migrate-gate]` with deploy guarded by `always() && !failure() && !cancelled()`, so skipped dev gates do not block. Rollback (`rollback_sha`) skips builds and pulls existing tags. Prod requires `REDIS_PASSWORD` secret (dev auto-generates via `openssl rand -hex 16`).
- Dependencies: GHCR, DO API, droplet SSH, Cloudflare origin cert secrets, validate/e2e/migrations workflows.
- Current controls: SHA-pinned actions; environment `prod` for prod deploy; concurrency queue `cancel-in-progress: false`; rollback path; secrets never in logs (GHA masking + `chmod 600`).
- Missing controls / risks:
  - Health checks are lenient (CI-P2-004): API accepts HTTP 526; web accepts ANY non-000 code; worker is non-fatal.
  - `docker image prune -af` runs BEFORE `compose down` → running images are not pruned → no cleanup actually happens; droplet disk grows with every deploy (the "targeted image cleanup" described in AGENTS.md is absent at HEAD).
  - `permissions` grants `id-token: write` + `actions: write` which are unused (no OIDC, no cancel actions).
  - M365/Turnstile/webhook-secret env vars present in `apps/api/.env.example` are not written to the droplet `.env` (all optional in env.ts; M365 webhook auth therefore fails closed — see companion report INFRA-P3-006).
- Recommended improvement: strict health checks; move prune after `down` or add targeted `docker rmi` of old mct-* tags; trim permissions; add missing optional secrets or document their absence.
- Suggested tests: CI dry-run of the setup/env step matrix; a smoke script asserting the health-check loop fails on 500s.
- Suggested docs: update AGENTS.md deploy section (cleanup claim is stale).

### Item: build-push (`.github/workflows/build-push.yml`)

- Evidence: `build-push.yml` (118 lines)
- What it does: On every push to main/develop touching app paths, builds + pushes `ghcr.io/.../mct-{api,worker,web}:${{ github.sha }}` — the exact tags deploy-do builds and pushes concurrently.
- Risks: (a) duplicate compute; (b) **tag race with divergent web content** — deploy-do passes `NEXT_PUBLIC_TEST_ACCOUNTS_ENABLED=true|false`, build-push does not (web Dockerfile defaults to false) → the `mct-web:<sha>` tag content is nondeterministic on dev; (c) dev rollbacks pull build-push's image (test accounts disabled) even though the deployed image had them enabled.
- Recommended improvement: delete build-push and let deploy-do own image publishing, OR add the missing build args so both paths produce identical images, OR rename tags per workflow.
- Suggested tests: compare `docker buildx imagetools inspect` digests for both workflows on the same SHA.

### Item: terraform-do (`.github/workflows/terraform-do.yml`)

- Evidence: `terraform-do.yml` (196 lines)
- What it does: PR → plan (posts comment); push main → `prod-approval` env + apply; push develop → apply to dev.
- Risks:
  - AGENTS.md claims prod apply is gated by "validate + e2e + migrations + prod-approval" — only the environment gate exists at HEAD (CI-P1-002).
  - Generated tfvars omits `admin_ip_ranges` → SSH `0.0.0.0/0` on both droplets (INFRA-P1-001).
  - No concurrency group + DO Spaces backend has no state locking → concurrent applies risk state corruption (INFRA-P2-002).
  - `terraform fmt -check` is `continue-on-error: true`.
  - On PRs the plan always targets the `dev` environment (ref_name != main) even when the PR targets main, so prod plans are never reviewed on PRs.
- Recommended improvement: add validate/e2e gates via `workflow_call`; write `admin_ip_ranges` from a secret; add concurrency group; gate on PR branch rather than env.

### Item: supabase-migrations (`.github/workflows/supabase-migrations.yml`)

- Evidence: `supabase-migrations.yml` (50 lines)
- What it does: `supabase link` + `db diff` (non-blocking) + `db push --include-all`, env-selected by branch.
- Risks: CLI installed via `npm install -g supabase` (unpinned); no concurrency → on a push touching both `supabase/**` and `apps/**`, the standalone push trigger and deploy-do's `migrate-gate` both run `db push` against prod concurrently (CI-P2-003); no timeout.
- Recommended improvement: pin CLI (or use `supabase/setup-cli` pinned SHA + version), add `concurrency: group: supabase-migrations-${{ github.ref }}` (and ideally a global group for prod), add timeout-minutes.

### Item: test / validate audit gates

- Evidence: `test.yml` lines 57-102, `validate.yml` line 25
- What it does: `test.yml` security-scan is a hard `pnpm audit --audit-level=high` gate; `validate.yml` audit job is `continue-on-error: true`.
- Risks: the deploy gate's audit is advisory only; the hard gate (test.yml) runs concurrently with deploy-do, not as a prerequisite, so a prod deploy can complete before a high-severity audit finding surfaces (CI-P2-005).
- Recommended improvement: remove `continue-on-error` in validate.yml (it runs on every deploy anyway) or make deploy-do `needs` the test.yml workflow on prod.

### Item: secrets-scan

- Evidence: `test.yml` lines 105-130, `scripts/scan-secrets.sh`
- What it does: greps the diff vs base for ~11 secret patterns (AWS, GitHub PATs, Stripe, Slack, private keys, JWTs), excluding `secrets.` references; pre-commit mirrors it on staged files.
- Risks: patterns miss DigitalOcean (`dop_v1_`), Cloudflare (`_cloudflare_api_token` style), and Supabase (`sbp_`) tokens; scan covers only the diff, not full history (history scan exists only as a commented-out manual command).
- Recommended improvement: extend patterns; consider gitleaks/trufflehog for history scanning.

## Scenario / Control Matrix

| ID     | Scenario or control | Evidence | Current control | Gap | Severity | Recommendation |
| ------ | ------------------- | -------- | --------------- | --- | -------- | -------------- |
| CI-001 | Deploy tag uniqueness | build-push.yml + deploy-do.yml build-web | SHA tags | Two workflows publish same tag w/ different args | P1 | Delete build-push or align build args |
| CI-002 | Terraform prod gates | terraform-do.yml | prod-approval env only | No validate/e2e/migrate gates | P1 | Add workflow_call gates |
| CI-003 | Migration concurrency | supabase-migrations.yml | None | Concurrent db push race | P2 | Concurrency group + pin CLI |
| CI-004 | Deploy health strictness | deploy-do.yml health check | API 200/526, web any code, worker non-fatal | 500s pass | P2 | Require 200; fail on worker |
| CI-005 | Audit gate severity | validate.yml:25 | continue-on-error | Deploy not blocked by audit | P2 | Make blocking |
| CI-006 | Trivy SARIF destination | test.yml security-scan | Artifact only | No code-scanning upload | P3 | Add upload-sarif |
| CI-007 | Scheduled workflow permissions | db-backup.yml, db-restore-test.yml | None (default token) | Depends on repo default | P3 | Explicit `permissions: contents: read` |
| CI-008 | Pinned CLI versions | e2e.yml:60, supabase-migrations.yml:35 | `version: latest` / `npm i -g` | Version drift breaks CI | P3 | Pin exact CLI versions |
| CI-009 | Secret scan coverage | test.yml secrets-scan | 11 patterns, diff-only | DO/CF/Supabase tokens missed | P3 | Extend patterns + history scan |
| CI-010 | Node matrix | test.yml:32 | 20.x only | Docs claim 18+20 | P3 | Update docs or matrix |

## Findings

### Finding ID: CI-P1-001 - build-push.yml races deploy-do.yml on identical GHCR tags with divergent web image content

- Severity: P1 (High)
- Confidence: High
- Area: CI/CD — Docker build/push
- Evidence:
  - `.github/workflows/build-push.yml` (jobs build-api/build-worker/build-web)
  - `.github/workflows/deploy-do.yml` (jobs build-api/build-worker/build-web)
  - Symbol / route / workflow / migration / component: `mct-web:${{ github.sha }}` tag published by both; `NEXT_PUBLIC_TEST_ACCOUNTS_ENABLED` build arg present in deploy-do.yml:191, absent in build-push.yml
- What is happening: Both workflows trigger on the same push to main/develop and push `ghcr.io/MaineCyberTech/mainecybertech/mct-{api,worker,web}:<sha>` concurrently. The web image differs: deploy-do passes `NEXT_PUBLIC_TEST_ACCOUNTS_ENABLED` (true on dev, false on prod) while build-push relies on the Dockerfile default (false). Last writer wins the tag.
- Why it matters: The same immutable tag can point to different images over time; dev deploys intermittently lose the test-accounts feature; a dev rollback to any SHA pulls build-push's image (test accounts disabled) even though the deployed image had them enabled.
- User / business impact: Nondeterministic dev-site behavior and broken rollbacks on dev; confusing image provenance for auditors.
- Security / privacy / reliability impact: Supply-chain traceability of deployed images is compromised (image → source mismatch for dev).
- Recommended fix: Delete `build-push.yml` (deploy-do already publishes every SHA it deploys; rollback SHAs are published by deploy-do on push). If kept, add the missing `NEXT_PUBLIC_TEST_ACCOUNTS_ENABLED`/`NEXT_PUBLIC_*` build args and a unique tag namespace per workflow.
- Suggested validation: On a dev push, compare `docker buildx imagetools inspect ghcr.io/.../mct-web:<sha>` digest against the image running on the dev droplet; they must match.
- Owner suggestion: platform/infrastructure
- Effort estimate: Small (workflow deletion) — Medium (keep + align)
- Dependencies: Decision on whether build-push serves a purpose beyond rollback availability.
- Status: Open

### Finding ID: CI-P1-002 - Terraform prod apply is not gated by validate/e2e/migrations despite AGENTS.md claim

- Severity: P1 (High)
- Confidence: High
- Area: CI/CD — Terraform deploy governance
- Evidence:
  - `.github/workflows/terraform-do.yml` (jobs terraform-plan, terraform-apply-prod, terraform-apply-dev)
  - AGENTS.md: "Gate Terraform prod apply with validate + e2e + migrations + prod-approval" (Hardening audit table, item CICD-002)
  - Symbol: `terraform-apply-prod` has `needs: terraform-plan` and `environment: prod-approval` only
- What is happening: Prod infra changes (droplet resize, firewall, DNS) apply with only a manual approval environment; no test/lint/typecheck/e2e/migration gates run before `terraform apply -auto-approve`.
- Why it matters: Infra changes bypass the same validation the app deploy requires; a malformed `.tf` change can take down the droplet (firewall, DNS) with no CI safety net.
- User / business impact: Potential production outage from unvalidated infra changes.
- Security / privacy / reliability impact: Weakest CI gate in the deployment chain.
- Recommended fix: Add `validate` (workflow_call) and, for prod, `e2e` + `supabase-migrations` as `needs` of `terraform-apply-prod`; keep `prod-approval`.
- Suggested validation: Introduce a deliberate `.tf` syntax error on a PR targeting main; confirm plan fails and apply never triggers.
- Owner suggestion: platform/infrastructure
- Effort estimate: Small
- Dependencies: None
- Status: Open

### Finding ID: CI-P2-003 - supabase-migrations: unpinned CLI and no concurrency group (concurrent prod db push race)

- Severity: P2 (Medium)
- Confidence: High
- Area: CI/CD — Migration workflow
- Evidence:
  - `.github/workflows/supabase-migrations.yml` lines 34-49 (`npm install -g supabase`; no `concurrency` key)
  - `.github/workflows/deploy-do.yml` line 213 (`uses: ./.github/workflows/supabase-migrations.yml` in migrate-gate, prod only)
  - `.github/workflows/supabase-migrations.yml` line 6 (push trigger on `supabase/**`)
- What is happening: A push touching both `supabase/**` and `apps/**` on main triggers two independent `supabase db push --include-all` runs against prod (standalone trigger + deploy-do migrate-gate). The CLI version installed at runtime is whatever `npm i -g supabase` resolves to that day.
- Why it matters: Concurrent migration applies can conflict (double-apply, deadlock, partial state) and CLI drift can apply migrations differently than tested locally.
- User / business impact: Prod DB state divergence or failed deploys.
- Security / privacy / reliability impact: Migration integrity risk.
- Recommended fix: Add `concurrency: group: supabase-migrations-${{ github.ref }}, cancel-in-progress: false` (or a shared prod group); pin the CLI via `supabase/setup-cli` with a pinned `version`; add `timeout-minutes`.
- Suggested validation: Push a commit touching supabase + apps; confirm only one db push run executes per branch.
- Owner suggestion: backend/platform
- Effort estimate: Small
- Dependencies: None
- Status: Open

### Finding ID: CI-P2-004 - Post-deploy health checks accept failure conditions as ready

- Severity: P2 (Medium)
- Confidence: High
- Area: CI/CD — Deploy reliability
- Evidence:
  - `.github/workflows/deploy-do.yml` lines 338-363
  - Symbol: health check `case "$CODE" in 200|526)` ; web check `if [ "$CODE" != "000" ]` ; worker check `|| echo "Warning: ... (non-fatal)"`
- What is happening: The API is considered healthy on HTTP 526 (Cloudflare "invalid SSL certificate" — users actually see an error page); the web app is considered healthy on ANY HTTP response including 500/404/502; the worker is never required to be healthy.
- Why it matters: A deploy can be marked green while the site is broken for users (web 500s) or while the background task engine (email, Stripe sync, scans) is down.
- User / business impact: Silent outages after "successful" deploys; missing worker = missed scheduled notifications/scans.
- Security / privacy / reliability impact: False-green deploys erode trust in the pipeline and delay incident response.
- Recommended fix: Require exactly 200 from `/health` (treat 526 as failure unless deliberately documented); require a non-5xx range (or a known 200/302 set) from the web check; make worker health a hard failure with a container-log dump.
- Suggested validation: Simulate a worker crash (kill container) during a dev deploy; deploy must fail with logs.
- Owner suggestion: platform/infrastructure
- Effort estimate: Small
- Dependencies: None
- Status: Open

### Finding ID: CI-P2-005 - Deploy gate runs pnpm audit non-blocking while the blocking audit runs outside the gate

- Severity: P2 (Medium)
- Confidence: High
- Area: CI/CD — Deploy gates
- Evidence:
  - `.github/workflows/validate.yml` line 25 (`pnpm audit --audit-level=high` with `continue-on-error: true`)
  - `.github/workflows/test.yml` lines 78-79 (hard `pnpm audit --audit-level=high`)
  - `.github/workflows/deploy-do.yml` line 198-200 (`validate` gate)
- What is happening: deploy-do's validate gate treats a high/critical audit finding as advisory; the blocking audit in test.yml runs on the same push but is not a prerequisite of the deploy. A dependency with a known high/CVSS advisory can be deployed before the hard gate reports.
- Why it matters: The "audit blocks deploys" property is not actually enforced for the deploy path.
- User / business impact: Vulnerable code can reach prod.
- Security / privacy / reliability impact: Supply-chain risk with a false sense of protection.
- Recommended fix: Remove `continue-on-error` from validate.yml's audit job (it is already separate from test.yml's job and runs on every deploy), or add `needs` from deploy to the test workflow on prod.
- Suggested validation: Temporarily add a dummy vulnerable dep in a dev branch; confirm deploy-do fails at validate.
- Owner suggestion: platform
- Effort estimate: Trivial
- Dependencies: None
- Status: Open

### Finding ID: CI-P2-006 - Trivy SARIF is never uploaded to GitHub code scanning

- Severity: P2 (Medium)
- Confidence: High
- Area: CI/CD — Security scanning
- Evidence:
  - `.github/workflows/test.yml` lines 96-102 (upload-artifact only) and line 24 (`security-events: write`)
  - Symbol: no `actions/upload-sarif` step anywhere in the repo
- What is happening: Trivy produces `trivy-results.sarif` with `exit-code: 1` (CRITICAL/HIGH fail the job), but the report is only stored as a 7-day artifact; `security-events: write` is granted but unused; no CodeQL.
- Why it matters: Findings are ephemeral and not surfaced in the Security tab; regression trends are invisible.
- User / business impact: Findings are only visible during the 7-day window.
- Security / privacy / reliability impact: Lost scanning signal.
- Recommended fix: Add `github/codeql-action/upload-sarif@<sha>` after the trivy step (keep `if: always()` semantics); optionally add a CodeQL JS/TS analysis job.
- Suggested validation: Merge and confirm SARIF appears under Security → Code scanning.
- Owner suggestion: platform
- Effort estimate: Small
- Dependencies: None
- Status: Open

### Finding ID: CI-P3-007 - Unpinned Supabase CLI in e2e workflow

- Severity: P3 (Low)
- Confidence: High
- Area: CI/CD — Reproducibility
- Evidence:
  - `.github/workflows/e2e.yml` line 60 (`supabase/setup-cli@ab058987...` with `version: latest`)
- What is happening: The action SHA is pinned but the CLI version it installs is `latest`.
- Why it matters: E2E behavior can drift on CLI upgrades (e.g., changed `supabase start`/`db reset` semantics), breaking CI without a code change.
- Recommended fix: Pin `version: 2.x.x` (or the exact version used locally).
- Suggested validation: None needed beyond CI green after pinning.
- Owner suggestion: backend
- Effort estimate: Trivial
- Dependencies: None
- Status: Open

### Finding ID: CI-P3-008 - Missing explicit permissions blocks on 3 scheduled/migration workflows

- Severity: P3 (Low)
- Confidence: High
- Area: CI/CD — Least privilege
- Evidence:
  - `.github/workflows/db-backup.yml`, `.github/workflows/db-restore-test.yml`, `.github/workflows/supabase-migrations.yml` — no `permissions:` key
  - Contrast: the other 10 workflows all declare `permissions:`
- What is happening: These three workflows run with the repository default GITHUB_TOKEN scope (write-capable if the repo default is read/write).
- Why it matters: Least-privilege principle; a compromised scheduled job could write to the repo.
- Recommended fix: Add `permissions: contents: read` to all three (db-restore-test needs nothing more).
- Suggested validation: `actionlint` or a repo-rule check that every workflow declares permissions.
- Owner suggestion: platform
- Effort estimate: Trivial
- Dependencies: None
- Status: Open

### Finding ID: CI-P3-009 - Secret-scanner patterns miss DO/Cloudflare/Supabase tokens and only scan diffs

- Severity: P3 (Low)
- Confidence: High
- Area: CI/CD — Secret scanning
- Evidence:
  - `.github/workflows/test.yml` line 117 (pattern list)
  - `scripts/scan-secrets.sh` line 13 (same list)
- What is happening: Patterns cover AWS/GitHub/Stripe/Slack/private keys/JWTs but not `dop_v1_` (DigitalOcean), Cloudflare API tokens, or `sbp_` (Supabase); scanning is diff-only (full-history scan exists as a commented-out manual command).
- Why it matters: The exact token types this platform uses are the ones not covered.
- Recommended fix: Add the missing patterns; run gitleaks/trufflehog on full history once, then keep diff-based CI.
- Suggested validation: Commit a dummy `dop_v1_...` token in a test branch; CI must fail.
- Owner suggestion: platform
- Effort estimate: Small
- Dependencies: None
- Status: Open

### Finding ID: CI-P3-010 - Node matrix (20.x only) drifts from documented Node 18+20; duplicate full `pnpm install` per workflow

- Severity: P3 (Low)
- Confidence: High
- Area: CI/CD — Efficiency / doc drift
- Evidence:
  - `.github/workflows/test.yml` line 32 (`matrix: node-version: [20.x]`)
  - AGENTS.md: "Run all unit/integration tests (Node 18, 20)"
- What is happening: Only Node 20 is tested; AGENTS.md still documents 18+20. Each push runs ~6 independent installs (test, lint, typecheck, e2e, build-push, deploy-do).
- Why it matters: Node 18 support is unverified; wasted CI minutes.
- Recommended fix: Update AGENTS.md to Node 20 (or add 18 back); consider a single install with action caching shared via turbo remote cache.
- Suggested validation: None.
- Owner suggestion: platform
- Effort estimate: Trivial
- Dependencies: None
- Status: Open

## Risks

| Risk | Severity | Likelihood | Impact | Evidence | Mitigation |
| ---- | -------- | ---------- | ------ | -------- | ---------- |
| SSH exposed to internet (0.0.0.0/0) on both droplets | P1 | Certain (default) | Unauthenticated SSH attempts; key-only protection | variables.tf:79, terraform-do.yml tfvars generator | INFRA-P1-001 (companion report) |
| Divergent GHCR tags race (dev test-accounts) | P1 | High (every push) | Nondeterministic dev image | build-push.yml vs deploy-do.yml | CI-P1-001 |
| Unreviewed prod terraform applies | P1 | High (every main infra change) | Outage from unvalidated infra | terraform-do.yml | CI-P1-002 |
| Concurrent prod db push | P2 | Medium (mixed path pushes) | Migration conflicts | supabase-migrations.yml triggers | CI-P2-003 |
| False-green deploys | P2 | Medium | Silent outages | deploy-do.yml health checks | CI-P2-004 |
| Vulnerable dep reaches prod pre-audit | P2 | Low-Medium | Supply-chain exposure | validate.yml continue-on-error | CI-P2-005 |
| Ephemeral scan results | P2 | Certain | Lost security signal | test.yml (no upload-sarif) | CI-P2-006 |
| CLI version drift breaks CI | P3 | Medium | CI instability | e2e.yml `version: latest`; npm i -g supabase | CI-P3-007 |

## Recommendations

### Immediate / Release Blocking

1. CI-P1-001 — Delete `build-push.yml` or fully align its build args with deploy-do. (day 1)
2. CI-P1-002 — Add validate/e2e/migrations gates to `terraform-apply-prod`. (day 1-2)

### This Week

3. INFRA-P1-001 (companion) — Restrict `admin_ip_ranges` via a GitHub secret in the terraform-do tfvars generator. (day 2)
4. CI-P2-003 — Concurrency group + pinned Supabase CLI for migrations.
5. CI-P2-004 — Strict health checks in deploy-do (200-only, fail on worker).
6. CI-P2-005 — Make validate.yml audit blocking.

### This Month

7. CI-P2-006 — Upload trivy SARIF to code scanning; add CodeQL.
8. Fix droplet image-cleanup ordering in deploy-do (prune after `compose down`).

### Later / Platform Evolution

9. CI-P3-007..010 — CLI pins, permissions blocks, secret-pattern coverage, matrix/docs cleanup.
10. Optional: release process (semver + changelog + SBOM/provenance via cosign).

## Quick Wins

| Quick win | Why it helps | Files likely involved | Validation |
| --------- | ------------ | --------------------- | ---------- |
| Remove `continue-on-error` on validate audit | Deploys blocked by high/critical advisories | validate.yml | Dev deploy with a temp vulnerable dep fails |
| Add `permissions: contents: read` to 3 workflows | Least privilege | db-backup.yml, db-restore-test.yml, supabase-migrations.yml | actionlint passes |
| Pin `supabase` CLI versions | Reproducible E2E/migrations | e2e.yml, supabase-migrations.yml | CI green twice in a row |
| Require HTTP 200 on API health check | Real readiness signal | deploy-do.yml | Deploy with broken origin cert must fail |

## Hardening Backlog

| Backlog item | Priority | Owner suggestion | Effort | Dependency |
| ------------ | -------- | ---------------- | ------ | ---------- |
| SARIF → code scanning + CodeQL | P2 | platform | Medium | None |
| Gitleaks history scan | P3 | platform | Medium | None |
| Remote (turbo) cache for CI | P3 | platform | Medium | Vercel/Turbo account |
| Release process + SBOM/provenance | P3 | platform | Medium | cosign key mgmt |
| actionlint in CI | P3 | platform | Small | None |

## Suggested Tests

- CI: actionlint on all 13 workflows (catch permissions/expression issues) — add to test.yml.
- CI: a workflow that asserts every `uses:` is SHA-pinned (grep-based).
- CI: digest comparison between build-push and deploy-do images for the same SHA (until CI-P1-001 is resolved).
- E2E: existing suite (253 tests) stays green after any CI change.
- Manual: dev deploy with a killed worker container must FAIL the deploy (after CI-P2-004).

## Suggested Documentation Updates

- AGENTS.md: correct the "Terraform prod apply gated by validate+e2e+migrations" claim (currently false) and the "Node 18, 20" claim; correct the "targeted image cleanup" deploy description (absent at HEAD); note the deploy gate's audit status.
- docs/ROLLBACK_PROCEDURES.md: document the build-push vs deploy-do tag provenance decision after CI-P1-001 is resolved.
- docs/ENVIRONMENT_VARIABLES.md: note which optional vars are intentionally not deployed (M365_CLIENT_STATE, TURNSTILE_SECRET_KEY, webhook secrets).

## Open Questions

| Question | Why it matters | Evidence needed |
| -------- | -------------- | --------------- |
| Are branch protection required checks configured for test/lint/typecheck/e2e/dependency-review? | Release-blocking if absent | GitHub settings (repo admin) |
| Does `prod-approval` have required reviewers configured? | Terraform/dep approval gate | GitHub settings (repo admin) |
| Is `S3_BACKUP_BUCKET` secret equal to the script default `mainecybertech-backups`? | Backup/restore mismatch risk | Secret value comparison |
| Why is `actions: write` on deploy-do and `security-events: write` on test.yml? | Least-privilege cleanup | Intended use cases |
| Are `REDIS_PASSWORD`/`CF_ORIGIN_CERT`/`CF_ORIGIN_KEY` secrets set in the right environments? | Prod deploy would fail otherwise | Secret matrix audit |

## Appendix

### Pinned action SHA verification (GitHub API, 2026-08-06)

All 14 returned HTTP 200:

| Action | Pinned SHA (prefix) | Resolves to tag |
| ------ | ------------------- | --------------- |
| actions/checkout | 11bd71901bbe... | v4.2.2 |
| actions/setup-node | 1d0ff469b7ec... | v4.2.0 |
| docker/login-action | c94ce9fb4685... | — |
| docker/setup-buildx-action | 8d2750c68a42... | — |
| docker/build-push-action | 10e90e3645ea... | v6.19.2 |
| appleboy/ssh-action | 0ff4204d59e8... | v1.2.5 |
| aquasecurity/trivy-action | c07df6fec6fa... | (no tag match) |
| actions/upload-artifact | ea165f8d65b6... | — |
| supabase/setup-cli | ab058987d8d6... | — |
| hashicorp/setup-terraform | b9cd54a3c349... | — |
| actions/download-artifact | d3f86a106a0b... | — |
| actions/github-script | f28e40c7f34b... | — |
| actions/dependency-review-action | 2031cfc08025... | — |
| chromaui/action | 1cfa065cbdab... | — |

### `pnpm audit` (2026-08-06)

1 vulnerability, severity: low — `elliptic` (<=6.6.1, no fix) via `@storybook/nextjs > node-polyfill-webpack-plugin > crypto-browserify > browserify-sign` (dev-only). `pnpm audit --audit-level=high` passes.

### Package overrides (root package.json)

- `js-yaml: >=4.3.0`, `@opentelemetry/core: >=2.8.0`, `postcss: >=8.5.10`, `esbuild: >=0.28.1`, `form-data: >=4.0.6`, `multer: 2.2.0`, `fast-uri: >=4.1.2`, `uuid: >=11.1.1`, `body-parser@<1.20.6: >=1.20.6`, `sharp@<0.35.0: >=0.35.0`, `postcss@<=8.5.17: >=8.5.18`.
- brace-expansion fix is correctly **scoped**: `"minimatch@>=10.0.0>brace-expansion": ">=5.0.9"` — the earlier global-override break (minimatch@3.1.5 `expand` API) is avoided.

### Coverage thresholds (CI-enforced via `pnpm test:coverage`)

| Package | statements | branches | functions | lines |
| ------- | ---------- | -------- | --------- | ----- |
| API | 58 | 30 | 50 | 55 |
| Web | 35 | 25 | 30 | 35 |
| Worker | 12 | 5 | 15 | 12 |
| SDK | 40 | 33 | 38 | 40 |
