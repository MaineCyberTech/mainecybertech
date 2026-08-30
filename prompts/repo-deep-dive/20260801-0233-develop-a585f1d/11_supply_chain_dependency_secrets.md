# Supply Chain, Dependency, and Secrets Audit

## Audit Metadata

- Audit name: repo-deep-dive
- Run: 20260801-0233-develop-a585f1d
- Repository: MaineCyberTech/mainecybertech
- Branch: develop
- Commit SHA: a585f1d
- Generated at: 2026-08-01
- Auditor: principal-level repository auditor (fresh pass)
- Area code: SC
- Output path: prompts/repo-deep-dive/20260801-0233-develop-a585f1d/11_supply_chain_dependency_secrets.md
- Scope limitations:
  - `pnpm audit`/`npm audit` results were not executed against a live registry during this audit; conclusions are based on repository configuration and prior-pipeline configuration, not live scan output.
  - GitHub dependency-vulnerability alerts (Dependabot alerts) are Settings-side state and were not read.
  - Container image scans, SBOM generation, and license policies were assessed as absent based on repository evidence.

## Scope

Reviewed package manifests (root + api/worker/web/sdk/ui/config), `pnpm-lock.yaml`, `.env.example` files, `.gitignore`, secret-scanning hooks (`scripts/scan-secrets.sh/.ps1`, `.husky/pre-commit`), `.github/dependabot.yml`, `validate.yml` (audit), `dependency-review.yml`, Docker base images (summary here; details in report 36), and the GitHub Actions dependency surface (details in report 10). Hardcoded-secret sweep performed across non-test source.

## Evidence Reviewed

| Evidence | Type | Why relevant | Notes |
| -------- | ---- | ------------ | ----- |
| `pnpm-lock.yaml` | Lockfile | Version 9.0, 1989 package entries | `lockfileVersion: '9.0'`; no git/tarball deps found |
| `package.json` (root) | Manifest | Workspace scripts, devDeps, overrides, onlyBuiltDependencies | `prepare: husky`; `pnpm.onlyBuiltDependencies: ["@sentry/cli"]` |
| `apps/api/package.json` | Manifest | Dependency placement | `@types/zxcvbn` in dependencies; `@mct/config` unused at runtime |
| `apps/worker/package.json` | Manifest | Dependency placement | `@mct/config` unused at runtime |
| `apps/web/package.json` | Manifest | Runtime deps | `@mct/config` only used by eslint config |
| `packages/{sdk,ui,config}/package.json` | Manifests | Shared packages | All `private: true`, license ISC |
| `.github/dependabot.yml` | Config | Update automation | npm + github-actions weekly, groups, 10 PR cap |
| `.github/workflows/validate.yml` | Workflow | Audit gate | `pnpm audit --audit-level=high` + `continue-on-error: true` |
| `.github/workflows/dependency-review.yml` | Workflow | PR dep gate | `fail-on-severity: high` |
| `.github/workflows/build-push.yml` | Workflow | Image builds | Dockerfiles with `--prod --ignore-scripts` (see report 36) |
| `apps/{api,worker,web}/.env.example` | Config | Env examples | Placeholders only, no secrets |
| `scripts/scan-secrets.sh` / `.husky/pre-commit` | Scripts | Secret leak prevention | Pattern-based staged scan; wired into pre-commit |
| `SECURITY.md` | Doc | Reporting | Present, adequate |
| Source sweep | Evidence | Hardcoded secrets | 1 match in a test fixture (non-secret) |

## Executive Summary

Supply-chain posture is **partial but meaningfully hardened at the package layer and weak at the pipeline layer**.

Package layer strengths: pnpm 10 lockfile (`v9.0`) with `--frozen-lockfile` everywhere in CI; pnpm 10's default block on dependency postinstall scripts with an explicit allowlist (`pnpm.onlyBuiltDependencies: ["@sentry/cli"]` only) — a strong build-supply-chain control; a comprehensive `pnpm.overrides` block pinning vulnerable transitive deps (`multer`, `js-yaml`, `esbuild`, `sharp`, `uuid`, `body-parser`, `postcss`, `brace-expansion`, `form-data`, `fast-uri`, `@opentelemetry/core`); no git/tarball dependencies in the lockfile; a pre-commit secret scanner; and Dependabot configured with grouped updates.

Pipeline-layer weaknesses: all GitHub Actions are pinned to mutable tags (details in report 10, CI-P1-002); the mainline `pnpm audit` runs with `continue-on-error: true` so advisories never block; **no SBOM generation, no container image scanning (Trivy/Grype), no image signing/provenance, and no license policy exist anywhere in the repo or CI**. Dependency review runs only on PRs and only flags new diffs, not the installed base.

Secrets layer: no committed `.env`, private keys, service-account files, or real credentials were found. The only "secret-like" match in non-test source is a test fixture value in `apps/api/src/__tests__/webhook-management.test.ts:43` (`secret: "my-super-secret-key-12345"`) — a fake value, not a credential. The pre-commit scanner covers AWS access keys, `ghp_` tokens, Supabase/JWT/Stripe var names, and PEM private keys. Gaps: the scanner only checks *staged* diffs; it does not cover `gho_`/`ghs_` PAT variants or generic high-entropy strings; and `prod.tfvars` (placeholder values) is tracked while `dev.tfvars` (real values) is gitignored — a hygiene inconsistency.

Dependency hygiene finding: `@mct/config` is declared in `dependencies` of api/worker/web but is only ever consumed by dev-time ESLint config; `@types/zxcvbn`, `@types/redis`, `@types/ws` (API), and `ws` (worker) are in `dependencies` rather than `devDependencies`. Because the runtime Dockerfiles install with `--prod`, these unnecessary runtime deps get pulled into production images (bloat + theoretical supply-chain surface). `@types/*` packages shipping to the runtime image is the clearest waste.

No license policy exists: every package is `ISC`, and third-party transitive licenses are entirely ungated. Recommend an allowlist policy (MIT/Apache-2.0/BSD/ISC permissive) with a CI license gate.

## Inventory

| Item | Path / symbol | Purpose | Current state | Risk | Notes |
| ---- | ------------- | ------- | ------------- | ---- | ----- |
| Lockfile | `pnpm-lock.yaml` | Reproducible installs | v9.0, 1989 entries | Low | No git/tarball deps |
| Postinstall control | `package.json` `pnpm.onlyBuiltDependencies` | Block arbitrary build scripts | Only `@sentry/cli` allowed | Low | pnpm 10 default + allowlist |
| Overrides | `package.json` `pnpm.overrides` | Force patched transitive versions | 13 override groups | Low | Active vuln remediation |
| Dependabot | `.github/dependabot.yml` | Automated updates | Weekly npm + GHA, groups | Low | 10 PR cap |
| Audit gate | `validate.yml:23-25` | Fail on vulns | `continue-on-error: true` | Medium | Never blocks |
| Dep review | `dependency-review.yml` | PR-diff vuln gate | `fail-on-severity: high` | Low | Only new diffs |
| SBOM | none | Inventories | Absent | High | No syft/cyclonedx |
| Container scan | none | Image vuln scan | Absent | High | No trivy/grype |
| Provenance/signing | none | Image attestation | Absent | High | No cosign/attest |
| License policy | none | Legal/security gate | Absent | Medium | All ISC today, ungated |
| Secret scanner | `scripts/scan-secrets.sh` + pre-commit | Prevent secret commits | Staged-diff pattern scan | Medium | Limited patterns |
| Env examples | 4 × `.env.example` | Documentation | Placeholders only | Low | Good |
| Hardcoded secrets | sweep | — | 1 fake fixture value | Low | See SC-P3 |

## Domain Scorecard

| Category                         | Score | Evidence | Gap | Recommended action |
| -------------------------------- | ----: | -------- | --- | ------------------ |
| Package manifests                |    4 | 6 manifests, private, license set | `@types/*`/`@mct/config` in prod deps | Move dev-only deps to devDependencies |
| Lockfiles                        |    4 | pnpm v9.0, frozen-lockfile in CI | Single lockfile, good | n/a |
| Workspace dependencies           |    4 | pnpm-workspace.yaml apps/* + packages/* | `@mct/config` unused at runtime | Add dead-dep check |
| Unused/duplicate/deprecated deps |    3 | Manual review | `@mct/config`, `@types/zxcvbn` unused at runtime | `pnpm dep-check`/knip |
| Native/build deps                |    4 | `sharp` override, multer pinned | `sharp` (web build) | Keep overrides current |
| Transitive risk indicators       |    4 | override block covers known CVEs | Overrides can hide breaking upgrades | Document why each override |
| Dependabot/Renovate              |    4 | Weekly grouped Dependabot | No Renovate; no auto-merge of security PRs | Consider auto-merge for patch/sec |
| Package scripts/postinstall      |    4 | allowlist only `@sentry/cli` | `husky prepare` runs post-install | Audit any future additions |
| Docker base images               |    4 | node:20-alpine SHA-pinned | Digest pinning good (report 36) | Periodic digest refresh |
| GitHub Actions deps              |    1 | All tag-pinned | Mutable tags (CI-P1-002) | SHA-pin all |
| Environment examples             |    4 | Placeholders, gitignored `.env` | `prod.tfvars` tracked | Untrack placeholder tfvars |
| Secret-like strings              |    4 | No committed secrets found | Scanner pattern gaps | Expand patterns; run on history |

## Detailed Review

### Item: Lockfile integrity

- Evidence: `pnpm-lock.yaml` (`lockfileVersion: '9.0'`); all 7 CI workflows run `pnpm install --frozen-lockfile`.
- What it does: Reproducible, immutable installs.
- How it appears to work: Single root lockfile; workspace importers for all 6 packages; no `git+`/`tarball:`/`github:` specs found (registry-only).
- Dependencies: npm registry.
- Current controls: frozen-lockfile; Dependabot regenerates lockfile.
- Missing controls: `pnpm audit` not enforced in mainline (see SC-P1-001); no lockfile diff review beyond dependency-review.yml.
- Risks: Tainted registry package; drift if `--frozen-lockfile` were dropped.
- Recommended improvement: Add `pnpm audit` as a hard gate; enable GitHub's built-in dependency graph + Dependabot alerts.
- Suggested tests: CI check that `pnpm install --frozen-lockfile` produces no changes.
- Suggested docs: none.

### Item: Postinstall/build-script control

- Evidence: `package.json:49-52` (`pnpm.onlyBuiltDependencies: ["@sentry/cli"]`).
- What it does: pnpm only runs build scripts for the allowlisted package; everything else (including transitive deps) is prevented from executing install-time code.
- How it appears to work: This is the pnpm 10 default policy plus an explicit allowlist.
- Dependencies: pnpm 10 (`packageManager: pnpm@10.34.3`).
- Current controls: allowlist; Dockerfiles additionally use `--ignore-scripts` for the prod install.
- Missing controls: None significant.
- Risks: Low; future package needing a build script must be added to the list (review point).
- Recommended improvement: Keep the allowlist small; add a comment explaining why `@sentry/cli` is needed (Sentry source-map upload).
- Suggested tests: None.
- Suggested docs: none.

### Item: Transitive vulnerability overrides

- Evidence: `package.json:53-68` (`pnpm.overrides`) — multer 2.2.0, js-yaml >=4.3.0, esbuild >=0.28.1, sharp >=0.35.0, uuid >=11.1.1, body-parser >=1.20.6, postcss >=8.5.18, brace-expansion >=5.0.8, form-data >=4.0.6, fast-uri >=3.1.4, @opentelemetry/core 2.7.0→2.8.0.
- What it does: Forces patched versions of known-vulnerable transitive dependencies.
- How it appears to work: pnpm applies overrides during resolution.
- Dependencies: None.
- Current controls: Broad, version-locked overrides.
- Missing controls: No documentation of which CVE each override addresses; no cleanup mechanism when a direct dep catches up.
- Risks: Overrides can mask or delay breaking upgrades; future direct-dependency bumps may fight the override.
- Recommended improvement: Document each override (CVE + target version); schedule a quarterly reconciliation.
- Suggested tests: None.
- Suggested docs: A comment block or `docs/DEPENDENCY_OVERRIDES.md`.

### Item: Audit gating

- Evidence: `.github/workflows/validate.yml:23-25` (`pnpm audit --audit-level=high` then `continue-on-error: true`).
- What it does: Runs `pnpm audit` but never fails the workflow.
- How it appears to work: Advisories are logged only. `dependency-review.yml` blocks PRs only on newly-introduced high-severity deps.
- Dependencies: npm advisory DB.
- Current controls: dependency-review on PR; audit non-blocking.
- Missing controls: Blocking audit in the mainline/PR path; exception allowlist.
- Risks: Known-vulnerable versions can be installed and shipped.
- Recommended improvement: Remove `continue-on-error` (or fail on `>=high` with an allowlist file committed and reviewed).
- Suggested tests: PR that bumps a vulnerable dev dep to prove the gate fires.
- Suggested docs: Update `validate.yml` behavior note in AGENTS.md.
- Status: Open (shared with report 10 CI-P2-002).

### Item: SBOM / scanning / provenance

- Evidence: grep of all workflows for `trivy|sbom|syft|provenance|attest|cosign|grype` → no matches. No `sbom` config, no release workflow.
- What it does: Nothing — these capabilities are absent.
- How it appears to work: n/a.
- Dependencies: n/a.
- Current controls: None.
- Missing controls: SBOM generation (Syft/Trivy) per image + npm; container vulnerability scan gating deploys; cosign signature/attestation; GitHub SBOM (dependency graph) export.
- Risks: No inventory of what ships; vulnerable images can deploy; no way to prove image provenance in an incident.
- Recommended improvement: Add Trivy scan jobs (fail on `HIGH+`) to `build-push.yml`/`deploy-do.yml`; publish CycloneDX SBOM artifacts; sign images with cosign keyless (needs OIDC, which is currently unused).
- Suggested tests: Trivy gate failing on a seeded vulnerable base image.
- Suggested docs: `docs/SBOM_AND_SUPPLY_CHAIN.md`.

### Item: Secret scanner coverage

- Evidence: `scripts/scan-secrets.sh` (patterns: SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY, JWT_SECRET, STRIPE_SECRET_KEY, `AKIA[0-9A-Z]{16}`, `ghp_[0-9a-zA-Z]{36}`, PEM private key); `.husky/pre-commit` runs it; `.gitignore:17-20` excludes `.env*` except `.env.example`.
- What it does: Blocks staged commits containing known credential patterns.
- How it appears to work: Scans `git diff --cached` additions only.
- Dependencies: git.
- Current controls: Pre-commit hook; `.env` gitignored.
- Missing controls: Only staged files; no `gho_`/`ghs_`/`github_pat_` tokens; no high-entropy heuristic; no historical/`git log` scan; Windows `scan-secrets.ps1` not wired into a hook.
- Risks: A secret committed via `git commit -n` or with an uncovered pattern lands in history; only staged state is guarded.
- Recommended improvement: Extend patterns (`gho_`, `ghs_`, `github_pat_`, Stripe `sk_live_`, Supabase `sb_secret_`), add high-entropy detection, and run a one-time history scan.
- Suggested tests: Commit a test secret with `-n` bypass to confirm scanner behavior; add a test token file.
- Suggested docs: none.

### Item: Environment examples

- Evidence: `apps/api/.env.example` (28 vars), `apps/worker/.env.example` (28), `apps/web/.env.example` (7), `infra/digitalocean/.env.example` (34); all placeholders.
- What it does: Documents required env vars.
- How it appears to work: Matches the Zod schemas in `apps/api/src/config/env.ts` and `apps/worker/src/env.ts` (verified: every schema key has a corresponding example entry).
- Dependencies: None.
- Current controls: Placeholders only; no real values.
- Missing controls: API example includes `JIRA_WEBHOOK_SECRET`/`JSM_WEBHOOK_SECRET`/`M365_WEBHOOK_SECRET`/`TURNSTILE_SECRET_KEY` which are optional — fine.
- Risks: Low.
- Recommended improvement: None critical.
- Suggested tests: none.
- Suggested docs: none.

## Scenario / Control Matrix

| ID     | Scenario or control              | Evidence | Current control | Gap | Severity | Recommendation |
| ------ | -------------------------------- | -------- | --------------- | --- | -------- | -------------- |
| SC-001 | Package manifests                | 6 manifests | private, license set | Dev-only deps in `dependencies` | P3 | Move to devDependencies |
| SC-002 | Lockfiles                        | pnpm v9.0 | frozen-lockfile | n/a | n/a | — |
| SC-003 | Workspace dependencies           | pnpm-workspace.yaml | — | `@mct/config` runtime-unused | P3 | knip/depcheck |
| SC-004 | Unused/duplicate/deprecated deps | manual | overrides active | dead deps | P3 | Add knip |
| SC-005 | Native/build deps                | sharp/multer overrides | pinned | n/a | n/a | — |
| SC-006 | Transitive risk indicators       | overrides block | pinned | undocumented CVEs | P3 | Document |
| SC-007 | Dependabot/Renovate              | dependabot.yml | weekly grouped | no auto-merge | P3 | Optional |
| SC-008 | Package scripts/postinstall      | onlyBuiltDependencies | allowlist | n/a | n/a | — |
| SC-009 | Docker base images               | node:20-alpine@sha256 | SHA-pinned | digest refresh cadence | P3 | Scheduled refresh |
| SC-010 | GitHub Actions deps              | all workflows | tag-pinned | mutable tags | P1 | SHA-pin (report 10) |
| SC-011 | Environment examples             | 4 × .env.example | placeholders | `prod.tfvars` tracked | P3 | Untrack |
| SC-012 | Secret-like strings              | sweep + scanner | hook blocks staged | pattern gaps; history un-scanned | P2 | Extend patterns |

## Findings

### Finding ID: SC-P1-001 - `pnpm audit` and container scans never block CI; no SBOM or image scanning

- Severity: P1
- Confidence: High
- Area: Supply chain
- Evidence:
  - `.github/workflows/validate.yml:23-25` (`pnpm audit --audit-level=high`, `continue-on-error: true`)
  - grep across `.github/workflows/*.yml` for `trivy|sbom|syft|provenance|attest|cosign|grype` → zero matches
  - `.github/workflows/dependency-review.yml` (PR-diff-only)
- What is happening: Vulnerability scanning is advisory-only (mainline audit) or new-diff-only (dependency-review). No container image scanning, SBOM generation, signing, or provenance attestation exists anywhere in the repo or CI.
- Why it matters: The installed dependency base and the shipped container images are never scanned as a gate. A high-severity vuln already in the tree, or a vulnerable base image, will deploy silently.
- User / business impact: Known-vulnerable code/image reaches production.
- Security / privacy / reliability impact: Exploitable dependency/base-image surface with no gate and no inventory.
- Recommended fix: (1) Make `pnpm audit` fail on `>=high` with a committed allowlist; (2) add Trivy scan + SBOM (CycloneDX) generation to `build-push.yml`/`deploy-do.yml` failing on `HIGH+`; (3) optionally sign images with cosign once OIDC is adopted.
- Suggested validation: Seed a vulnerable dev dependency and a vulnerable base image in a branch and confirm both gates fire.
- Owner suggestion: Security lead.
- Effort estimate: 1 day.
- Dependencies: CI-P1-002 (SHA pinning) recommended before cosign.
- Status: Open.

### Finding ID: SC-P1-002 - All GitHub Actions pinned to mutable tags (supply-chain surface)

- Severity: P1
- Confidence: High
- Area: Supply chain / CI
- Evidence:
  - Every `uses:` in all 13 workflows is `@v\d+`; zero SHA pins (full inventory in report 10, Appendix)
  - High-risk: `appleboy/ssh-action@v1` (deploy-do.yml:183,244), `chromaui/action@v11` (chromatic.yml:38), `supabase/setup-cli@v1` with `version: latest` (e2e.yml:58-60)
- What is happening: Actions run from mutable tags; a tag re-point or malicious release is executed with access to production secrets.
- Why it matters: Actions are dependencies too and are the largest unattested third-party code path in the pipeline.
- User / business impact: Pipeline compromise → server/secret compromise.
- Security / privacy / reliability impact: Supply-chain poisoning.
- Recommended fix: Pin all actions to full commit SHAs with `# vX.Y.Z` comments; keep Dependabot updating.
- Suggested validation: CI grep-guard for `@v`.
- Owner suggestion: Infrastructure lead.
- Effort estimate: 1 hour.
- Dependencies: None.
- Status: Open (duplicate reference of CI-P1-002; kept here for the supply-chain report completeness).

### Finding ID: SC-P1-003 - Default Redis password fallback reaches production (secret provisioning gap)

- Severity: P1
- Confidence: High
- Area: Secrets
- Evidence:
  - `infra/digitalocean/docker-compose.yml:24` (`${REDIS_PASSWORD:-mct_redis_changeme_in_production}`)
  - `.github/workflows/deploy-do.yml:208-239` — `.env` write loop omits `REDIS_PASSWORD`
- What is happening: The deploy pipeline never writes `REDIS_PASSWORD`, so the compose default `mct_redis_changeme_in_production` is active in the production stack, and it is also embedded in `REDIS_URL` for API/worker (compose lines 46, 80).
- Why it matters: A public, hardcoded default credential protects Redis (BullMQ job queue, webhook idempotency state).
- User / business impact: If Redis is reachable, queue/data tampering.
- Security / privacy / reliability impact: Weak auth on a shared service.
- Recommended fix: Provision a strong `REDIS_PASSWORD` via the deploy secrets loop; remove the fallback default.
- Suggested validation: Post-deploy `docker exec` check that `redis-cli -a <correct>` succeeds and default fails.
- Owner suggestion: Infrastructure lead.
- Effort estimate: 30 min.
- Dependencies: None.
- Status: Open.

### Finding ID: SC-P2-001 - No SBOM, container scanning, image signing, or provenance anywhere

- Severity: P2
- Confidence: High
- Area: Supply chain / SBOM
- Evidence: Zero matches for `trivy|sbom|syft|provenance|attest|cosign|grype` across `.github/workflows/`; no release workflow.
- What is happening: Nothing generates an SBOM, scans images, or attests image provenance.
- Why it matters: No inventory of dependencies in shipped images; no vulnerability gate; no way to prove what image produced an incident.
- User / business impact: Slow incident response; non-compliance with SBOM expectations (e.g., EO 14028-style requirements for US federal contractors).
- Security / privacy / reliability impact: Blind spots in the deployable artifact chain.
- Recommended fix: Add a scan+SBOM job producing CycloneDX/SPDX artifacts; publish to GH Actions artifacts; gate deploys on HIGH+ findings.
- Suggested validation: Inspect generated SBOM contains expected top-level deps.
- Owner suggestion: Platform lead.
- Effort estimate: 1 day.
- Dependencies: None.
- Status: Open.

### Finding ID: SC-P2-002 - Secret scanner limited to staged diffs with narrow patterns

- Severity: P2
- Confidence: High
- Area: Secrets
- Evidence:
  - `scripts/scan-secrets.sh` — patterns limited to SUPABASE_ANON_KEY/SERVICE_ROLE_KEY, JWT_SECRET, STRIPE_SECRET_KEY, `AKIA[0-9A-Z]{16}`, `ghp_[0-9a-zA-Z]{36}`, PEM keys
  - `.husky/pre-commit` → `sh scripts/scan-secrets.sh`
  - No `gho_`, `ghs_`, `github_pat_`, `sk_live_`, `sb_secret_`, or high-entropy detection; `git log`/history never scanned; `scan-secrets.ps1` (Windows) not wired
- What is happening: Only staged additions in a narrow pattern set are blocked; `git commit -n` bypasses it entirely.
- Why it matters: A leaked credential in git history is effectively irreversible; today's coverage misses common token prefixes.
- User / business impact: Lower protection than claimed.
- Security / privacy / reliability impact: Credential exposure risk via history.
- Recommended fix: Expand patterns; add a `gitleaks`/`trufflehog` scan (or run `gitleaks detect`) in CI for every PR; run a one-time history scan.
- Suggested validation: Add a test token (`gho_...`) to a branch and confirm CI blocks it.
- Owner suggestion: Security lead.
- Effort estimate: 2 hours.
- Dependencies: None.
- Status: Open.

### Finding ID: SC-P3-001 - Dev-only dependencies shipped in production images

- Severity: P3
- Confidence: High
- Area: Dependency hygiene
- Evidence:
  - `apps/api/package.json:20` (`@types/zxcvbn` in dependencies), `apps/api/package.json:16-38` also includes `@mct/config`
  - `apps/worker/package.json:18` (`@mct/config` in dependencies)
  - `apps/web/package.json:21` (`@mct/config` in dependencies)
  - grep: `@mct/config` is imported only by `apps/{api,worker,web}/eslint.config.{js,mjs}` (dev-time), never by runtime source
  - Runtime Dockerfiles install with `pnpm install --prod` (report 36), so these packages land in the runtime image
- What is happening: Type-definition packages and a config-only workspace package are declared as production dependencies.
- Why it matters: Bloats the runtime image and widens the (already minimal) install-time surface; `@types/*` packages in prod deps is a classic hygiene smell.
- User / business impact: None directly.
- Security / privacy / reliability impact: Larger image attack surface; slower builds.
- Recommended fix: Move `@mct/config`, `@types/zxcvbn`, `@types/redis`, `@types/ws` (api), `ws` (worker dev-only) to `devDependencies`; add `knip`/`depcheck` to catch future drift.
- Suggested validation: `pnpm knip` clean; confirm `docker build` still succeeds.
- Owner suggestion: Backend lead.
- Effort estimate: 1 hour.
- Dependencies: None.
- Status: Open.

### Finding ID: SC-P3-002 - Dependency override block undocumented and untracked for lifecycle

- Severity: P3
- Confidence: Medium
- Area: Transitive risk
- Evidence: `package.json:53-68` (`pnpm.overrides`) — 13 groups with no CVE annotations.
- What is happening: Patches are applied via overrides but there is no record of which advisory each addresses or when it can be removed.
- Why it matters: Overrides can hide or delay upstream upgrades; future dependency bumps may silently conflict.
- User / business impact: None directly.
- Security / privacy / reliability impact: Override churn risk.
- Recommended fix: Annotate each override with CVE + upstream fixed version; quarterly reconciliation.
- Suggested validation: None.
- Owner suggestion: Platform lead.
- Effort estimate: 30 min.
- Dependencies: None.
- Status: Open.

### Finding ID: SC-P3-003 - `prod.tfvars` placeholder file tracked while `dev.tfvars` (real) is gitignored

- Severity: P3
- Confidence: High
- Area: Secrets hygiene
- Evidence:
  - `git ls-files` includes `infra/terraform/digitalocean/env/prod.tfvars`
  - `.gitignore:56` (`**/env/*.tfvars`)
  - `infra/terraform/digitalocean/env/prod.tfvars` contains `your-do-api-token` style placeholders (safe values)
- What is happening: A placeholder tfvars file is committed (pre-dating or overriding the gitignore rule); the real `dev.tfvars` is correctly ignored. CI regenerates tfvars from secrets at plan time, so this is cosmetic — but the tracked file invites a future accidental `git add` of a real value over the ignore rule.
- Why it matters: Mixed ignore behavior is a foot-gun.
- User / business impact: None.
- Security / privacy / reliability impact: Low; risk of future secret commit.
- Recommended fix: `git rm --cached` the placeholder and rely on the `.example` file.
- Suggested validation: `git ls-files | grep tfvars` empty (except examples).
- Owner suggestion: Infrastructure lead.
- Effort estimate: 5 min.
- Dependencies: None.
- Status: Open.

### Finding ID: SC-P3-004 - Unpinned tool/container versions in backup and restore paths

- Severity: P3
- Confidence: High
- Area: Supply chain
- Evidence:
  - `scripts/backup-database.sh` (`docker run postgres:15`, unpinned)
  - `.github/workflows/db-restore-test.yml:38` (`postgres:16-alpine`, unpinned)
  - `.github/workflows/supabase-migrations.yml:35` (`npm install -g supabase` — latest)
  - `.github/workflows/e2e.yml:58-60` (`supabase/setup-cli@v1` with `version: latest`)
- What is happening: Backup/restore containers and the Supabase CLI float on mutable tags/latest.
- Why it matters: Non-reproducible tooling in data-integrity paths; a CLI change can break migrations or restores.
- User / business impact: Backup/restore drift.
- Security / privacy / reliability impact: Non-reproducible restore behavior.
- Recommended fix: Pin postgres image digests and Supabase CLI version.
- Suggested validation: None.
- Owner suggestion: Infrastructure lead.
- Effort estimate: 15 min.
- Dependencies: None.
- Status: Open.

## Risks

| Risk | Severity | Likelihood | Impact | Evidence | Mitigation |
| ---- | -------- | ---------- | ------ | -------- | ---------- |
| Vulnerable deps ship silently | P1 | Medium | High | validate.yml continue-on-error | Hard audit gate |
| Action tag compromise | P1 | Low | Critical | all `@v` pins | SHA pin |
| Redis default password in prod | P1 | High | Medium | compose:24 + deploy env | Provision REDIS_PASSWORD |
| No SBOM/scan/provenance | P2 | High | Medium | no tooling in CI | Add Trivy/SBOM/cosign |
| Secret leaked to history | P2 | Low | Critical | narrow scanner, `commit -n` | gitleaks in CI |

## Recommendations

### Immediate / Release Blocking

1. Make `pnpm audit` fail on `>= high` (allowlist file).
2. Provision `REDIS_PASSWORD` in the deploy pipeline.
3. Add Trivy image scan + CycloneDX SBOM generation to `build-push.yml`/`deploy-do.yml` (fail on HIGH+).

### This Week

4. SHA-pin all GitHub Actions (see report 10 CI-P1-002).
5. Add `gitleaks`-style scanning to PR CI; extend `scan-secrets.sh` patterns.

### This Month

6. Add license policy + CI license gate (allow permissive: MIT/Apache-2.0/BSD-3/ISC).
7. Move dev-only deps to `devDependencies`; add `knip`.
8. Document `pnpm.overrides` rationale; quarterly reconcile.

### Later / Platform Evolution

9. Adopt OIDC and keyless cosign signing for images.
10. Enable GitHub dependency graph + SBOM export; publish SBOM artifacts per release.

## Quick Wins

| Quick win | Why it helps | Files likely involved | Validation |
| --------- | ------------ | --------------------- | ---------- |
| Drop `continue-on-error` on audit | Advisories start blocking | validate.yml:23-25 | CI run |
| Untrack `prod.tfvars` | Removes secret-commit foot-gun | `git rm --cached` | git ls-files |
| Expand scanner patterns (`gho_`, `github_pat_`, `sk_live_`) | Covers common tokens | scripts/scan-secrets.sh | Commit a test token |
| Pin postgres + supabase CLI versions | Reproducible data tooling | backup-database.sh, db-restore-test.yml, supabase-migrations.yml | Build check |

## Hardening Backlog

| Backlog item | Priority | Owner suggestion | Effort | Dependency |
| ------------ | -------- | ---------------- | ------ | ---------- |
| Hard audit gate | P1 | Security lead | 30 m | allowlist |
| REDIS_PASSWORD provisioning | P1 | Infrastructure lead | 30 m | none |
| Trivy + SBOM in CI | P1 | Platform lead | 1 d | none |
| SHA-pin actions | P1 | Infrastructure lead | 1 h | none |
| gitleaks CI | P2 | Security lead | 2 h | none |
| License policy + gate | P2 | Security lead | 1 d | none |
| knip dead-dep check | P3 | Backend lead | 1 h | none |
| Override documentation | P3 | Platform lead | 30 m | none |

## Suggested Tests

- CI: audit-gate test (branch with a vulnerable dev dep must fail).
- CI: Trivy gate test with a seeded vulnerable base image.
- CI: gitleaks test committing a `gho_`-style token.
- CI: grep-guard asserting no `uses: *@v` tags and no dev-only packages in prod deps.
- Regression: post-deploy redis auth check.

## Suggested Documentation Updates

- `docs/DEPENDENCY_OVERRIDES.md` — CVE rationale per override.
- `docs/SBOM_AND_SUPPLY_CHAIN.md` — SBOM/scan/provenance policy.
- `docs/SECRETS_ROTATION.md` — add REDIS_PASSWORD and note gitleaks coverage.
- `AGENTS.md` — correct audit-gate claims (currently describes a gate that doesn't block).

## Open Questions

| Question | Why it matters | Evidence needed |
| -------- | -------------- | --------------- |
| Are Dependabot alerts enabled and being triaged? | The 11 outstanding vulns noted in AGENTS.md depend on alert state | GitHub Security tab |
| Was a history scan ever run for secrets? | Pre-commit scanner only guards staged diffs | `gitleaks detect --history` run |
| Is a license review needed (MSP serving regulated clients)? | SBOM/licensing requirements vary by contract | Compliance/legal input |

## Appendix

### Dependency source inventory

- Registry-only: confirmed (no git/tarball/github specs in `pnpm-lock.yaml`).
- Lockfile: pnpm `9.0`, ~1989 entries across 6 workspace packages.
- Allowed postinstall: `@sentry/cli` only.
- Overrides (13 groups): multer, js-yaml, esbuild, sharp, uuid, body-parser, postcss, brace-expansion, form-data, fast-uri, @opentelemetry/core, multer, postcss.

### Secret scan sweep results (redacted)

- `.github/workflows/e2e.yml:79,100` — `JWT_SECRET=e2e-test-secret` (test-only, local Supabase) — not a production secret.
- `.github/workflows/e2e.yml:121-122` — `E2E_ADMIN_EMAIL`/`E2E_ADMIN_PASSWORD: 1` (local seed creds) — test-only.
- `apps/web/e2e/global.setup.ts:3` — local seed admin email default — test-only.
- `apps/api/src/__tests__/webhook-management.test.ts:43` — fake `secret: "my-super-secret-key-12345"` — test fixture.
- `infra/terraform/digitalocean/env/prod.tfvars` — placeholder tokens (`your-do-api-token` etc.) — tracked, safe values.
- No `.env`, `.pem`, `.key`, service-account, or credential files are tracked (`git ls-files` verified).
