# Supply Chain, Dependency, and Secrets Audit

## Audit Metadata

- Audit name: repo-deep-dive
- Run: 20261003-0018-fix-p2-batch-31-2295958d
- Repository: C:\temp\mainecybertech
- Branch: fix/p2-batch-31
- Commit SHA: 2295958d
- Generated at: 2026-10-03
- Auditor: repo-deep-dive subagent (base profile)
- Area code: SUPPLY
- Output path: docs/audits/repo-deep-dive/20261003-0018-fix-p2-batch-31-2295958d/11_supply_chain_dependency_secrets.md
- Scope limitations: No network; `pnpm audit` not run. Secret scan is static; no values printed.

## Scope

Dependency management/overrides, lockfile hygiene, Dependabot, dependency review, Trivy/CodeQL/SBOM, license posture, secret handling/rotation, workflow pinning, container base images.

## Evidence Reviewed

- `package.json` (`pnpm.overrides`, `onlyBuiltDependencies`), `pnpm-lock.yaml`, `.npmrc`.
- `.github/dependabot.yml`, `.github/workflows/{dependency-review,test,sbom}.yml`.
- `licenses.json`, `sbom.cdx.json`, `scripts/{generate-sbom.mjs,scan-secrets.sh,scan-secrets.ps1}`.
- `apps/*/Dockerfile`; `.gitignore`; `docs/SECRETS_ROTATION.md`, `docs/GITHUB_SECRETS_AND_VARIABLES_MATRIX.md`.
- `git ls-files` for `.env`/secret-adjacent paths.

## Verification Performed

| Evidence | Type | Why relevant | Notes |
|---|---|---|---|
| read `package.json:54-92` | config | transitive overrides | many pinned floors |
| read `dependabot.yml` | config | update coverage | npm/actions/docker/terraform, weekly |
| read `test.yml`/`validate.yml` | CI | audit gates | `pnpm audit --audit-level=high --prod`; Trivy exit 1 |
| `git ls-files` `.env`/`supabase/.temp` | command | secret tracking | only `*.env.example`; `.temp` secrets untracked |
| read Dockerfiles | source | image provenance | `node:20-alpine@sha256:…` digest pinned |

## Executive Summary

Supply-chain hygiene is above average: dependency floors are pinned via `pnpm.overrides` (postcss, js-yaml, esbuild, next, multer, nodemailer, qs, …), actions are SHA-pinned, Dependabot covers npm/actions/docker/terraform, PRs are gated by `dependency-review` and `pnpm audit --prod`, and container bases are digest-pinned and run as non-root. Residual gaps: `licenses.json` is a committed generated aggregate with no policy/verification workflow; the Swagger UI loads an unpinned external script (`unpkg.com`) without SRI; and the dev-only `elliptic` advisory is accepted (no patch). Secret handling is good — only `*.env.example` are tracked and the untracked `supabase/.temp/.../docker.env` was found on disk (must never be committed).

## Inventory

| Item | Path | State | Risk |
|---|---|---|---|
| Lockfile | `pnpm-lock.yaml` | present | Low |
| Overrides | `package.json` `pnpm.overrides` | extensive | Low |
| Dependabot | `.github/dependabot.yml` | 4 ecosystems | Low |
| Dependency review | `.github/workflows/dependency-review.yml` | PR gate | Low |
| Audit | `test.yml`/`validate.yml` | high/critical fail | Low |
| Trivy | `test.yml` | fs scan exit 1 | Low |
| SBOM | `sbom.yml` | artifact only | Low |
| Licenses | `licenses.json` | committed | Medium |
| Container base | `apps/*/Dockerfile` | digest-pinned, non-root | Low |
| External script | `routes/docs.ts` | unpkg, no SRI | Low |
| Secret examples | `apps/*/.env.example` | placeholders | Low |

## Domain Scorecard

| Category | Score | Evidence | Gap | Recommended action |
|---|---:|---|---|---|
| Dependency pinning | 5 | overrides + lockfile | — | keep |
| Vulnerability gates | 4 | audit, Trivy, CodeQL | dev-dep ellipic accepted | keep/accept |
| Update automation | 4 | Dependabot | — | keep |
| SBOM | 4 | CycloneDX artifact | not release-bound | SUPPLY-P3-001 |
| License governance | 2 | `licenses.json` | no policy/check | SUPPLY-P2-001 |
| Secret management | 4 | docs + scan + gitignore | untracked temp secret on disk | SUPPLY-P3-002 |
| Artifact integrity | 3 | SHA pins | unpkg no SRI | SUPPLY-P2-002 |

## Detailed Review

- Overrides worth noting: `next >=15.5.24 <16`, `esbuild >=0.28.1`, `multer >=2.3.0`, `sharp >=0.35.4`, `nodemailer >=10.0.6`, `qs >=6.16.0`. `pnpm-lock.yaml` is authoritative.
- `pnpm audit --audit-level=high --prod` deliberately scopes to production deps; dev-only advisories are not gated (documented).
- `licenses.json` (tracked) appears to be a grouping of packages by SPDX expression, not a policy-enforcing artifact.

## Findings

### Finding ID: SUPPLY-P2-001 - `licenses.json` is committed but unenforced and unverified

- Severity: P2
- Confidence: High
- Area: SUPPLY
- Evidence:
  - `licenses.json` — tracked (12,354 lines changed in this branch)
  - `.github/workflows/validate.yml`, `test.yml` — no license check/regeneration step
  - No `LICENSE_POLICY.md`/allowlist found under `docs/`
- What is happening: a license aggregate is versioned with no CI that regenerates or validates it, and no stated allow/deny policy.
- Why it matters: license compliance can silently break when a dependency adds a copyleft license; the committed file may be stale.
- User / business impact: legal/compliance risk.
- Security / privacy / reliability impact: low direct.
- Recommended fix: add a license policy (allowed SPDX set) + a `--check` regeneration step in CI, and stop tracking the aggregate or regenerate it deterministically.
- Suggested validation: CI step that regenerates and diffs; fail on a disallowed license.
- Owner suggestion: DevEx/legal
- Effort estimate: M
- Dependencies: license tooling
- Status: open

### Finding ID: SUPPLY-P2-002 - Swagger UI loads an unpinned third-party script without SRI

- Severity: P2
- Confidence: High
- Area: SUPPLY
- Evidence:
  - `apps/api/src/routes/docs.ts:19-24` — `https://unpkg.com/swagger-ui-dist@5/swagger-ui.{css,js}` with a floating major tag
  - `apps/api/src/middleware/security-headers.ts:25` — CSP `script-src … unpkg.com`
- What is happening: a third-party origin is allow-listed and fetched at request time with a floating version and no `integrity` attribute.
- Why it matters: a compromised/unpublished `unpkg` response executes in the API docs origin (supply-chain XSS).
- User / business impact: low (docs page), but it is a script-execution path.
- Security / privacy / reliability impact: medium supply-chain.
- Recommended fix: self-host Swagger UI assets in the API image (or add SRI + exact version), and drop `unpkg.com` from CSP.
- Suggested validation: network-isolated load of `/api/v1/docs` succeeds from bundled assets.
- Owner suggestion: API
- Effort estimate: S
- Dependencies: none
- Status: open

### Finding ID: SUPPLY-P3-001 - SBOM is produced as a transient artifact, not bound to a release

- Severity: P3
- Confidence: Medium
- Area: SUPPLY
- Evidence:
  - `.github/workflows/sbom.yml` — generates `sbom.cdx.json`, `upload-artifact` retention 30 days
  - `sbom.cdx.json` present on disk but gitignored/untracked
- What is happening: the SBOM is not attached to a release/tag or retained long-term.
- Why it matters: cannot tie a shipped image to its SBOM after 30 days.
- Recommended fix: attach the SBOM to the GitHub release (and/or an attestation) for the deployed SHA.
- Owner suggestion: release
- Effort estimate: S
- Dependencies: release process
- Status: open

### Finding ID: SUPPLY-P3-002 - A secrets file exists on disk outside git (should never be committed)

- Severity: P3
- Confidence: High
- Area: SUPPLY
- Evidence:
  - `supabase/.temp/start-secrets/supabase_edge_runtime_mainecybertech-dev/env/docker.env` — present on disk (~1.1 KB)
  - `git ls-files supabase/.temp` — empty (correctly untracked; `.gitignore` covers `supabase/.temp/`)
  - Redacted: type only — local Supabase runtime environment file; values not read/printed
- What is happening: local secret material exists in the working tree but is not tracked.
- Why it matters: risk if `.gitignore` changes or a tool force-adds `.temp`.
- Recommended fix: keep the ignore rule; add a pre-commit/CI guard that fails on any `supabase/.temp` or `*.env` outside `*.env.example`.
- Suggested validation: `git check-ignore supabase/.temp/...`; secret-scan on staged paths.
- Owner suggestion: DevEx
- Effort estimate: S
- Dependencies: none
- Status: open

## Risks

| Risk | Severity | Likelihood | Impact | Evidence | Mitigation |
|---|---|---|---|---|---|
| License non-compliance | P2 | Medium | Legal | SUPPLY-P2-001 | policy+check |
| Third-party script compromise | P2 | Low | Docs-origin XSS | SUPPLY-P2-002 | self-host/SRI |
| SBOM not release-bound | P3 | Medium | Provenance | SUPPLY-P3-001 | release attest |
| Temp secret committed | P3 | Low | Credential leak | SUPPLY-P3-002 | guard |

## Recommendations

### Immediate / Release Blocking
None.

### This Week
- Self-host/SRI the Swagger assets (SUPPLY-P2-002).

### This Month
- License policy + check (SUPPLY-P2-001); SBOM release binding (SUPPLY-P3-001).

## Quick Wins

| Quick win | Why it helps | Files likely involved | Validation |
|---|---|---|---|
| Pin swagger version + SRI | removes floating script | `routes/docs.ts` | load |
| Ignore-guard CI step | stops temp secrets | CI | test |

## Hardening Backlog

| Backlog item | Priority | Owner suggestion | Effort | Dependency |
|---|---|---|---|---|
| License policy | P2 | DevEx | M | tooling |
| SBOM attestation | P3 | release | S | release |
| Secret guard | P3 | DevEx | S | none |

## Suggested Tests

- License allowlist CI; SRI/integrity check; `git check-ignore` guard test.

## Suggested Documentation Updates

- `docs/LICENSE_POLICY.md`; update `docs/SECRETS_ROTATION.md` with the `.temp` guard.

## Open Questions

| Question | Why it matters | Evidence needed |
|---|---|---|
| Which license tool generates `licenses.json`? | reproducibility | script/history |
| Is `unpkg` needed beyond docs? | CSP tightening | grep |

## Appendix

- Dockerfiles pin `node:20-alpine@sha256:fb4cd12c…` and run as uid 1001 `appuser`.
- Secret-scan patterns include AWS/GitHub/Stripe/Slack keys, PEM headers, and JWTs.
