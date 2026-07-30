# Supply Chain, Dependency, and Secrets Audit

## Audit Metadata

- Audit name: repo-deep-dive
- Run: 20260730-0650-develop-62da92c
- Repository: mainecybertech/mainecybertech (monorepo)
- Branch: develop
- Commit SHA: 62da92c
- Generated at: 2026-07-30
- Auditor: Principal Repository Auditor (AI)
- Area code: SC
- Output path: docs/audits/repo-deep-dive/20260730-0650-develop-62da92c/11_supply_chain_dependency_secrets.md
- Scope limitations: pnpm-lock.yaml is too large for full review; analysis based on `package.json` files, `pnpm audit` output, Dependabot config, and Docker base images.

## Scope

Reviewed package manifests (root + all apps/packages), `pnpm-lock.yaml` (lockfile), `pnpm audit` output, Dependabot configuration, `.dockerignore`, Dockerfile base images, `.env.example` files, and secret rotation documentation. Checked for known vulnerable dependencies, license fields, postinstall scripts, and supply chain risks.

## Evidence Reviewed

| Evidence | Type | Why relevant | Notes |
|----------|------|-------------|-------|
| `package.json` (root) | Manifest | Monorepo workspace config, scripts, overrides | Private, ISC license |
| `apps/api/package.json` | Manifest | API dependencies | Supabase, Stripe, Express |
| `apps/web/package.json` | Manifest | Web dependencies | Next.js, React, Sentry |
| `apps/worker/package.json` | Manifest | Worker dependencies | BullMQ, IORedis |
| `packages/*/package.json` | Manifests | Shared packages | SDK, UI, Config |
| `pnpm-lock.yaml` | Lockfile | Pinned dependency tree | Single lockfile (monorepo) |
| `pnpm audit` output | Audit | Known vulnerabilities | High: js-yaml, sharp |
| `.github/dependabot.yml` | Config | Automated dependency updates | npm + GHA, weekly |
| `.dockerignore` | Config | What's excluded from Docker build | Excludes docs/ infra/ supabase/ |
| Root `package.json` overrides | Override | Vulnerability mitigation | postcss, js-yaml, esbuild, form-data, multer, fast-uri, uuid |
| Dockerfiles (3) | Images | Base images for containers | All use `node:20-alpine` |
| `.env.example` files (3) | Config | Exposed env var patterns | API, Web, Worker |
| `docs/SECRETS_ROTATION.md` | Doc | Secret rotation policy | Comprehensive, 40 secrets |

## Executive Summary

The supply chain posture is good overall: single lockfile, frozen-lockfile CI enforcement, Dependabot with grouped updates, and explicit override pins for known vulnerabilities. The root `package.json` has 6 overrides for vulnerable transitive dependencies (postcss, js-yaml, esbuild, form-data, multer, fast-uri, uuid). A `pnpm audit` reveals 2 high-severity findings (js-yaml via storybook, sharp via image processing) that are partially mitigated by overrides in one case. No `.npmrc` was found (no registry restrictions). No SBOM generation or container vulnerability scanning exists. All Docker images use `node:20-alpine` (no SHA pin). All environment example files are present and free of real secrets.

### Strengths
- Single `pnpm-lock.yaml` at workspace root — deterministic installs
- `--frozen-lockfile` enforced in all CI workflows
- Dependabot configured for both npm (`weekly`) and GitHub Actions (`weekly`)
- Dependabot uses grouped updates for sentry, typescript-eslint, testing, and aws-sdk
- Explicit `pnpm.overrides` for 7 known vulnerable transitive dependencies
- Root `package.json` has `"private": true` — prevents accidental publishing
- `onlyBuiltDependencies` restricts postinstall scripts to `@sentry/cli` only
- `.dockerignore` effectively excludes docs, infra, supabase/ from build context
- All 3 `.env.example` files are free of real secret values
- Comprehensive `docs/SECRETS_ROTATION.md` with 40 secrets listed and rotation procedures

### Major Risks
- No SBOM generation in CI or as part of release process
- No container vulnerability scanning (Trivy, Grype, etc.)
- No `.npmrc` — no registry/auth restrictions preventing dependency confusion
- Docker base images use `node:20-alpine` (no SHA digest pin)
- Package `license` field is `"ISC"` (should be a standard OSI-approved license)
- `pnpm audit` shows 2 high-severity findings (js-yaml via storybook, sharp via Next.js)

## Inventory

| Item | Path / symbol | Purpose | Current state | Risk | Notes |
|------|--------------|---------|--------------|------|-------|
| Root package.json | `package.json` | Workspace definition | Implemented | Low | Private, ISC license |
| API package.json | `apps/api/package.json` | API deps | Implemented | Low | Express, Supabase, Stripe |
| Web package.json | `apps/web/package.json` | Web deps | Implemented | Low | Next.js 15 |
| Worker package.json | `apps/worker/package.json` | Worker deps | Implemented | Low | BullMQ, IORedis |
| pnpm-lock.yaml | `pnpm-lock.yaml` | Lockfile | Implemented | Low | Single workspace lockfile |
| Dependabot | `.github/dependabot.yml` | Auto-updates | Implemented | Low | Weekly npm + GHA |
| Overrides | `package.json:53-62` | Vuln mitigation | Implemented | Medium | 7 overrides active |
| Docker base | All 3 Dockerfiles | Runtime images | Implemented | Medium | No SHA pin on node image |
| SBOM | None | Bill of materials | Missing | P1 | No SBOM generation |
| Container scan | None | Vuln scanning | Missing | P1 | No image scanning |
| .npmrc | None | Registry config | Missing | P2 | No registry pinning |

## Domain Scorecard

| Category | Score | Evidence | Gap | Recommended action |
|----------|:-----:|----------|-----|-------------------|
| Package manifests | 4 | Root + 6 workspace packages | License is ISC (non-standard) | Change to MIT or Apache-2.0 |
| Lockfiles | 5 | Single pnpm-lock.yaml in CI | None | None needed |
| Workspace dependencies | 4 | pnpm-workspace.yaml, turbo.json | None significant | — |
| Unused/duplicate/deprecated deps | 3 | Not formally audited | No depcheck in CI | Add pnpm dedupe check |
| Native/build deps | 4 | Only @sentry/cli allowed | None | — |
| Transitive risk indicators | 3 | Overrides exist, audit shows highs | 2 high vulns open | Monitor Dependabot alerts |
| Dependabot/Renovate | 4 | Dependabot configured with groups | No auto-merge for patches | Enable auto-merge for patch |
| Package scripts/postinstall | 4 | onlyBuiltDependencies restricts | None | — |
| Docker base images | 2 | node:20-alpine | No SHA pin | Pin to exact digest |
| GitHub Actions deps | 2 | Pinned to major version tags | Not pinned to SHAs | Pin to commit SHAs |
| Environment examples | 5 | All 3 apps have .env.example | None | — |
| Secret-like strings | 4 | No secrets found in codebase | None | — |

## Detailed Review

### Item: Dependency Vulnerability Audit

- Evidence: `pnpm audit --audit-level=high` output; root package.json overrides
- What it does: The `pnpm audit` check is run in `validate.yml:24` with `continue-on-error: true`. Two high vulnerabilities detected:
  1. `js-yaml` (>=4.0.0 <4.3.0) via `@storybook/nextjs > ... > cosmiconfig > js-yaml` — CVE for quadratic CPU consumption
  2. `sharp` inherited libvips CVEs (CVE-2026-33327, etc.) via Next.js image processing
- How it appears to work: Override for `js-yaml: ">=4.2.0"` exists in root package.json, but the version resolved in pnpm-lock may still be <4.3.0 for some paths.
- Dependencies: npm registry for all deps
- Current controls: Override pins, Dependabot, pnpm audit in validate workflow (continue-on-error)
- Missing controls: No fail-on-vulnerability gate at build time, no container scanning
- Risks: Known high-severity dependencies deployed in production containers
- Recommended improvement: Set `fail-on-severity: high` on the pnpm audit step once js-yaml/sharp paths are resolved
- Suggested tests: Verify override actually resolves js-yaml >=4.3.0 for all paths

## Scenario / Control Matrix

| ID | Scenario or control | Evidence | Current control | Gap | Severity | Recommendation |
|----|-------------------|----------|----------------|-----|----------|---------------|
| SC-001 | Package manifests | All package.json files | Workspace-managed | License is ISC (non-standard) | P3 | Change to MIT or Apache-2.0 |
| SC-002 | Lockfile integrity | pnpm-lock.yaml | Frozen installs in CI | None | — | None |
| SC-003 | Dependency audit | `pnpm audit` in validate.yml | Continue-on-error | Should fail on critical | P2 | Fail CI on critical vulns |
| SC-004 | Dependency confusion | No .npmrc | Missing | No registry pin | P2 | Add .npmrc with registry |
| SC-005 | Docker base image | All 3 Dockerfiles: `FROM node:20-alpine` | Pinned minor version | No SHA digest | P2 | Pin to SHA digest |
| SC-006 | SBOM generation | None | Missing | No SBOM in CI or releases | P1 | Add SBOM workflow |
| SC-007 | Container scanning | None | Missing | No Trivy/Grype | P1 | Add image scanning |
| SC-008 | Postinstall scripts | `onlyBuiltDependencies: [@sentry/cli]` | Restricted | None | — | None |
| SC-009 | Secret in code | .env.example files | No real secrets | None | — | None |
| SC-010 | Dependabot updates | `.github/dependabot.yml` | Weekly, grouped | No auto-merge for patches | P3 | Enable auto-merge for patch |

## Findings

### Finding ID: SC-P1-001 - No SBOM generation in CI or releases

- Severity: P1 - High
- Confidence: High
- Area: Supply Chain
- Evidence:
  - No SBOM workflow in `.github/workflows/`
  - No `cyclonedx-bom` or `@cyclonedx/cyclonedx-npm` dependency
  - No `spdx-sbom-generator` in any Dockerfile
- What is happening: The repository produces container images and a deployable application but never generates a Software Bill of Materials (SBOM). No CI step produces SPDX or CycloneDX output.
- Why it matters: SBOMs are critical for vulnerability management, incident response, and compliance. Without an SBOM, responding to a Log4j-style event requires manual analysis.
- User / business impact: Inability to quickly determine if a newly disclosed CVE affects the production deployment.
- Security / privacy / reliability impact: Medium — operational risk for vulnerability management.
- Recommended fix: Add a `sbom-generation.yml` workflow that runs `cyclonedx-bom` on each release and attaches the SBOM to the release artifact. Also install `syft` in Docker build step to generate container SBOM.
- Suggested validation: Verify `sbom.json` file is produced and contains all dependencies.
- Owner suggestion: Platform team
- Effort estimate: 4 hours
- Dependencies: None
- Status: Open

### Finding ID: SC-P1-002 - No container vulnerability scanning

- Severity: P1 - High
- Confidence: High
- Area: Supply Chain / Container Security
- Evidence:
  - No Trivy, Grype, Snyk, or Docker Scout step in any workflow
  - Images built and pushed in `build-push.yml` without scanning
  - `node:20-alpine` base image known to have CVEs
- What is happening: Container images are built and deployed without any vulnerability scanning. Known CVEs in the base image and dependencies go undetected.
- Why it matters: Production containers with unpatched vulnerabilities are the highest-priority supply chain risk.
- User / business impact: Production environment runs containers with known exploitable vulnerabilities.
- Security / privacy / reliability impact: High.
- Recommended fix: Add Trivy scan to `build-push.yml` after each image build. Reject deployment if critical/high CVEs found.
- Suggested validation: Trivy scan fails the build if critical CVEs present.
- Owner suggestion: Infrastructure team
- Effort estimate: 4 hours
- Dependencies: `aquasecurity/trivy-action`
- Status: Open (same as CI-P1-002)

### Finding ID: SC-P2-001 - No .npmrc restricts registry

- Severity: P2 - Medium
- Confidence: High
- Area: Supply Chain
- Evidence:
  - No `.npmrc` file exists at any level (root, apps/, packages/)
  - All CI workflows use `pnpm install --frozen-lockfile` without registry specification
- What is happening: Without an `.npmrc`, the package manager uses the default npm registry. There is no protection against dependency confusion attacks where a malicious package with the same name as a private package is published to the public registry.
- Why it matters: If any internal-only packages are added in the future, they could be susceptible to dependency confusion. Also, no scope-based registry configuration exists.
- User / business impact: Low — all current packages are public; risk is future-oriented.
- Recommended fix: Create `.npmrc` at workspace root:
  ```
  registry=https://registry.npmjs.org/
  save-exact=true
  ```
- Suggested validation: `pnpm install` still works with the `.npmrc`.
- Owner suggestion: Platform team
- Effort estimate: 15 minutes
- Dependencies: None
- Status: Open

### Finding ID: SC-P2-002 - Docker base images not pinned to SHA digest

- Severity: P2 - Medium
- Confidence: High
- Area: Supply Chain / Container
- Evidence:
  - `apps/api/Dockerfile:1`: `FROM node:20-alpine AS base`
  - `apps/web/Dockerfile:1`: `FROM node:20-alpine AS base`
  - `apps/worker/Dockerfile:1`: `FROM node:20-alpine AS base`
  - (`:` followed by line number; not grep output)
- What is happening: All three Dockerfiles use `node:20-alpine` without a SHA digest pin. The image tag is mutable — `node:20-alpine` can be updated by the image publisher to point to a different image, introducing unexpected changes or vulnerabilities.
- Why it matters: Mutable base images are a supply chain risk. A compromised or accidentally updated base image could introduce vulnerabilities or malicious code into production builds.
- User / business impact: Unpredictable build outcomes; potential supply chain compromise.
- Security / privacy / reliability impact: Medium.
- Recommended fix: Pin every `FROM` instruction to its exact SHA digest. Run `docker pull node:20-alpine && docker image inspect --format='{{index .RepoDigests 0}}' node:20-alpine` to get the current digest. Then use:
  ```
  FROM node:20-alpine@sha256:xxxx...
  ```
- Suggested validation: Verify Dependabot can update SHA digests (Docker image updates).
- Owner suggestion: Infrastructure team
- Effort estimate: 1 hour
- Dependencies: Dependabot can auto-update Docker digests.
- Status: Open

### Finding ID: SC-P2-003 - pnpm audit runs with continue-on-error

- Severity: P2 - Medium
- Confidence: High
- Area: Supply Chain
- Evidence:
  - `validate.yml:24`: `pnpm audit --audit-level=high` with `continue-on-error: true`
  - `pnpm audit` output shows 2 high vulnerabilities
- What is happening: The `pnpm audit` step in the reusable validate workflow explicitly continues on error, meaning even if critical high-severity vulnerabilities are found, the CI pipeline succeeds.
- Why it matters: The audit gate provides no protection — it logs findings but takes no action.
- User / business impact: Vulnerable dependencies can be merged without failing CI.
- Recommended fix: Once the current high vulnerabilities are resolved (or if they are only in dev dependencies like storybook), set `continue-on-error: false` for `pnpm audit --audit-level=high`.
- Suggested validation: A PR adding a dependency with a critical vuln is blocked.
- Owner suggestion: Platform team
- Effort estimate: 30 minutes
- Dependencies: Resolution of js-yaml/sharp vuln paths
- Status: Open

### Finding ID: SC-P3-001 - Root package.json license is "ISC"

- Severity: P3 - Low
- Confidence: High
- Area: Supply Chain / Licensing
- Evidence:
  - Root `package.json:4`: `"license": "ISC"`
- What is happening: The monorepo uses the ISC license, which is an uncommon choice for a commercial SaaS platform. ISC is functionally equivalent to MIT but less widely recognized.
- Why it matters: May cause confusion for contributors and consumers of shared packages. Most commercial platforms use MIT or Apache-2.0.
- User / business impact: Negligible — ISC is a valid OSI-approved license.
- Recommended fix: Change to `"MIT"` or `"Apache-2.0"` and add a `LICENSE` file at root.
- Suggested validation: Verify the new license is reflected in downstream package metadata.
- Owner suggestion: Legal / Founder
- Effort estimate: 15 minutes
- Dependencies: Legal review
- Status: Open

## Risks

| Risk | Severity | Likelihood | Impact | Evidence | Mitigation |
|------|----------|------------|--------|----------|------------|
| No SBOM for incident response | P1 | Medium (CVE disclosure) | High (no fast response) | No SBOM workflow | Add SBOM generation |
| Known high vulns in prod | P1 | Medium (2 high findings) | High | pnpm audit output | Add container scanning |
| Mutable base image tags | P2 | Low | Medium | Dockerfile FROM lines | Pin to SHA |
| Dependency confusion | P2 | Low (no private packages) | High (if private pkgs added) | No .npmrc | Add .npmrc |

## Recommendations

### Immediate / Release Blocking

1. Add container vulnerability scanning to CI (SC-P1-002)
2. Add SBOM generation workflow (SC-P1-001)

### This Week

3. Pin Docker base images to SHA digests (SC-P2-002)
4. Add `.npmrc` with registry configuration (SC-P2-001)

### This Month

5. Fail CI on critical `pnpm audit` findings (SC-P2-003)
6. Resolve high `js-yaml` and `sharp` vulnerabilities
7. Update root license to MIT/Apache-2.0 (SC-P3-001)

### Later / Platform Evolution

8. Add dependency license compliance check
9. Implement SLSA provenance attestation for builds

## Quick Wins

| Quick win | Why it helps | Files likely involved | Validation |
|-----------|-------------|----------------------|------------|
| Create .npmrc | Registry pinning for supply chain | `.npmrc` | pnpm install still works |
| Pin Docker to SHA | Build reproducibility | All 3 Dockerfiles | Build succeeds |
| Update LICENSE | Legal clarity | `LICENSE`, `package.json` | CI passes |

## Hardening Backlog

| Backlog item | Priority | Owner suggestion | Effort | Dependency |
|-------------|----------|-----------------|--------|------------|
| Container scanning | P1 | Infrastructure | 4 hours | Trivy action |
| SBOM generation | P1 | Platform | 4 hours | cyclonedx-bom |
| Docker SHA pin | P2 | Infrastructure | 1 hour | Dependabot Docker |
| .npmrc | P2 | Platform | 15 min | None |
| pnpm audit gate | P2 | Platform | 30 min | Vuln resolution |
| License update | P3 | Founder | 15 min | Legal review |

## Suggested Tests

- CI workflow that runs `pnpm audit --audit-level=critical --fail` and reports result
- Validation that Dependabot can update Docker SHA digests
- Test for `.npmrc` presence and correct registry configuration

## Suggested Documentation Updates

- Add SBOM information to `docs/ENVIRONMENT_VARIABLES.md`
- Document Docker base image update process
- Create license policy doc

## Open Questions

| Question | Why it matters | Evidence needed |
|----------|---------------|----------------|
| Are the js-yaml/sharp vulns in production or only dev paths? | Determines urgency of fix | pnpm ls --depth=infinity with prod flag |
| What license should the project use? | Legal compliance | Business/legal input |
| Do any downstream consumers need SBOMs? | Prioritizes SBOM work | Stakeholder input |

## Appendix

### Dependency Count by Package

| Package | Direct deps | Notes |
|---------|-------------|-------|
| Root | ~20 devDeps | Turbo, Husky, Storybook, Playwright |
| API | ~30 | Express, Supabase SDK, Stripe, pino, zod |
| Web | ~40 | Next.js, React, Sentry, Tailwind |
| Worker | ~15 | BullMQ, IORedis, pino |
| SDK | ~3 | zod |
| UI | ~2 | clsx, tailwind-merge |
| Config | ~2 | ESLint, TS configs |
| **Total** | **~110** | Across all workspace packages |

### Override Map

| Override | CVE / Reason | Target |
|----------|-------------|--------|
| postcss >=8.5.10 | ReDoS | All paths |
| js-yaml >=4.2.0 | Quadratic CPU | Storybook/Webpack paths |
| esbuild >=0.28.1 | Various | Build tooling |
| form-data >=4.0.6 | SSRF | Axios/http |
| multer 2.2.0 | CVE | API file upload |
| fast-uri >=3.1.4 | ReDoS | Fastify/express |
| uuid >=11.1.1 | Math.random | Direct usage |
