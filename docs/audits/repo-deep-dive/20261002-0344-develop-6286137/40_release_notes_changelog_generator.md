# Release Notes and Changelog Generator

## Audit Metadata

- Audit name: `repo-deep-dive`
- Run: `20261002-0344-develop-6286137`
- Repository: `mainecybertech/mainecybertech` (pnpm monorepo / Turbo; local export at `C:/temp/mainecybertech`)
- Branch: `develop`
- Commit SHA: `6286137017c4b7c77e83ee420ec11382d984f263` (short: `62861370`, `docs: record the widened a11y default gate`, 2026-10-01 23:25:45 -0400)
- Baseline commit for the delta in this report: `75d39269` (last audited commit, 2026-08-06 17:10:11 -0400)
- Generated at: 2026-10-02
- Auditor: subagent (prompt 40)
- Area code: REL
- Output path: `docs/audits/repo-deep-dive/20261002-0344-develop-6286137/40_release_notes_changelog_generator.md`
- Companion artifacts (same run folder):
  - `release_notes_draft.md`
  - `changelog_draft.md`
  - `branch_protection_recommendation.md`
  - `sbom_license_policy_recommendation.md`
  - `secret_rotation_runbook.md`
- Scope limitations:
  - Read-only audit. No application code, workflow, or doc in the repository was modified. Only the five files above were written under the run folder.
  - No secret values were printed or read; only environment-variable **names** and file paths are referenced.
  - GitHub-side state (branch protection applied state, environment reviewers, release tags) is not reachable from this role; statements about *applied* state are marked `Unknown` / `not reproducible`.
  - There are **no git tags** (`git tag` → empty), so no released versions exist to diff against; the "release" unit here is a commit SHA (GHCR image tag), per `docs/RELEASING.md:49-52`.
  - The repository is used as evidence. Commit messages are summarized, not rewritten; all cited SHAs are from the real history between `75d3926` and `62861370`.

## Scope

Reviewed at commit `62861370` (branch `develop`):

- **Git history / delta** — `git log`, `git shortlog`, `git diff --stat` for `75d3926..62861370` (371 commits, 1,225 files, +104,410 / −33,559) and `main..develop` (662 commits, 2,635 files, +593,891 / −19,556).
- **Changelog** — `CHANGELOG.md` (Keep a Changelog format, single `[Unreleased]` section + dated sections).
- **Release docs** — `docs/RELEASING.md` (branch model, gates, versioning/changelog policy, prod deploy, rollback).
- **PR templates** — `.github/PULL_REQUEST_TEMPLATE.md`, `.github/ISSUE_TEMPLATE/{bug_report.yml,feature_request.yml}`.
- **Version files** — root and workspace `package.json` `version` fields.
- **Package versions / migrations** — `supabase/migrations/` (34 migrations added in the delta), `docs/migrations/naming-guide.md`, `scripts/verify-rls.mjs`.
- **Breaking changes / operator actions** — `docs/ROLLBACK_PROCEDURES.md`, `docs/RELEASING.md` (Before promoting to prod), `docs/CI.md`.
- **Security/CI findings that shape release notes** — sibling reports `34_branch_protection_required_checks.md` (BP-*), `35_sbom_license_policy.md` (SBOM-*), `38_env_secret_rotation.md` (SECRET-*), `10_github_actions_cicd_governance.md` (CI-*).
- **Generated artifacts** — `.github/workflows/sbom.yml`, `.gitignore:59-61`, `scripts/generate-sbom.mjs` (artifact/commit binding check).

Not reviewed / out of scope:

- Whether any GitHub Release, changelog entry, or SBOM was *published* (no tags, no release workflow; not reproducible here).
- Legal sufficiency of the ISC license for customer contracts.
- Live GitHub environment/branch-protection settings.

## Evidence Reviewed

| Evidence | Type | Why relevant | Notes |
|---|---|---|---|
| `git log --oneline 75d3926..62861370` | Git history | The delta the changelog must describe | 371 commits; all authored by `openhands` |
| `git diff --shortstat 75d3926 62861370` | Diff | Magnitude of change | 1,225 files, +104,410 / −33,559 |
| `git shortlog -sn 75d3926..62861370` | Git history | Authorship for release attribution | Single committer (`openhands`) |
| `git diff --name-only --diff-filter=A ... -- supabase/migrations` | Git history | New migrations for upgrade notes | 34 new migration files |
| `CHANGELOG.md` | Doc | Existing changelog to extend | Keep a Changelog; `[Unreleased]` + dated `## 2026-09-21/20/18/08-26` |
| `docs/RELEASING.md:47-58` | Doc | Versioning & changelog policy | "A release is the Docker images on GHCR tagged with the deploying commit SHA" |
| `docs/RELEASING.md:6-14,92-107` | Doc | Pre-promotion checklist + prod caveats | Operator actions / known issues source |
| `.github/PULL_REQUEST_TEMPLATE.md` | Template | PR checklist | 8 manual items; no enforcement |
| `package.json` / workspace `package.json` | Manifests | Version files | No `version` on root/apps; `packages/sdk/package.json:3` = `1.0.0` only |
| `supabase/migrations/5302*` | Migrations | Breaking/upgrade surface | 34 added (RLS, store, MFA, modules) |
| `.github/workflows/sbom.yml:1-34` | Workflow | Generated-artifact binding | Artifact-only, 30-day, no serial/commit |
| `.github/branch-protection/{main,develop}.json` (via report 34) | Config | Release governance | Context mismatch; `enforce_admins:false` |
| `docs/ROLLBACK_PROCEDURES.md:165-167,116-120` | Doc | Rollback notes | Claims `prod-approval` reviewers exist (contradicted) |
| `docs/CI.md:25` | Doc | SBOM gate claim | Says "Blocking"; workflow gates nothing |
| Sibling reports 34, 35, 38, 10 | Audit outputs | Findings to fold into release messaging | BP-*, SBOM-*, SECRET-*, CI-* |

## Verification Performed

| Claim | Source | Outcome | Evidence |
|---|---|---|---|
| Delta is 371 commits / 1,225 files | git | `supported` | `git rev-list --count 75d3926..62861370` = 371; `--shortstat` |
| `develop` is 662 commits ahead of `main` | git | `supported` | `git rev-list --count main..develop` = 662; `main` is an ancestor of `develop` |
| 34 migrations added in the delta | git | `supported` | `--diff-filter=A` on `supabase/migrations` lists 34 files |
| No git tags exist (no released versions) | git | `supported` | `git tag` → empty; `git describe` → "No names found" |
| `CHANGELOG.md` is current at HEAD | git | `partially supported` | Last change to `CHANGELOG.md` = 2026-10-01 22:28; HEAD commit is `docs: record the widened a11y default gate` (2026-10-01 23:25) — the final commits are not reflected in `[Unreleased]` |
| Every workspace has a `version` | manifests | `unsupported` | Root/apps/dev packages have no `version`; only `packages/sdk` = `1.0.0`. Release identity is the commit SHA (`RELEASING.md:49-52`) |
| SBOM records the commit/version it was generated from | `scripts/generate-sbom.mjs`, `sbom.yml` | `unsupported` | Report 35: no `serialNumber`, no commit binding, `metadata.component.version` absent |
| Release artifact filenames are versioned (no overwrite-in-place) | `docs/RELEASING.md` + workflow | `supported` (images) / `unsupported` (SBOM) | GHCR images tagged by SHA (`RELEASING.md:51`); SBOM artifact is fixed-name `sbom-cyclonedx` (report 35, SBOM-P2-001) |
| Changelog follows a documented, reproducible cut process | `RELEASING.md:53-58` | `supported` | "insert a dated `## YYYY-MM-DD` heading below `[Unreleased]`… leave an empty `[Unreleased]`" |
| PR template is machine-enforced | `.github/PULL_REQUEST_TEMPLATE.md` | `unsupported` | Manual checklist only (report 34, BP-P3-002) |

## Executive Summary

The repository has a **real, working changelog discipline**: `CHANGELOG.md` uses Keep a Changelog, `docs/RELEASING.md:53-58` documents exactly how to cut a release section, and entries are evidence-rich (commit SHAs, migration numbers, file paths). Since the last audited commit (`75d39269`, 2026-08-06) the project shipped a large, coherent body of work: **371 commits across 1,225 files (+104,410 / −33,559)**, dominated by `fix` (121), `feat` (74), `docs` (45), `test` (37) and `ci` (24), plus **34 new migrations** (`5302129`–`5302428`). The change set is overwhelmingly **security, tenancy, store, MFA, accessibility and CI-hardening** work — not net-new product surface alone.

The principal weakness is **release identity and binding**. There are **no git tags** and **no release workflow**; a "release" is only a GHCR image tagged by commit SHA (`RELEASING.md:49-52`). No manifest carries a product version (only `packages/sdk` = `1.0.0`), and the generated CycloneDX SBOM records **no serial number, no commit, and no version** (report 35, SBOM-P2-001). Consequently, a "release notes" document cannot cite a version — only a commit. The extended check "generated artifacts record the commit and version they were generated from" therefore **fails** for the SBOM and the changelog artifact set.

Second, the changelog is **slightly stale at HEAD**: the last commit (`62861370`, plus its immediate parents promoting the a11y gate and test counts) post-dates the last `CHANGELOG.md` edit, so the final a11y/CI commits in this delta are not yet reflected in `[Unreleased]` (see finding REL-P2-001). Third, the release/operator documentation contains at least one **false safety claim** — `ROLLBACK_PROCEDURES.md:167` states prod deploys require `prod-approval` reviewers, which the matrix and report 34 contradict — and `docs/CI.md:25` calls the SBOM workflow "Blocking" when it gates nothing. These are exactly the doc-vs-behavior mismatches the shared rules require us to flag.

**Counts (this report):** 8 findings — **P0: 0, P1: 2, P2: 4, P3: 2**. Overall domain score **3/5** (functional and well-documented, but not version-bound, not fully automated, and carrying stale/false operator claims).

## Inventory

| Item | Path / symbol | Purpose | Current state | Risk | Notes |
|---|---|---|---|---|---|
| Changelog | `CHANGELOG.md` | User-facing change record | Current except final commits | Medium | Keep a Changelog; `[Unreleased]` + dated sections |
| Release doc | `docs/RELEASING.md` | Branch model, gates, changelog policy | Current | Low | Defines a "release" as a SHA-tagged image |
| PR template | `.github/PULL_REQUEST_TEMPLATE.md` | Contribution checklist | Present, manual | Low | 8 items; no enforcement/diff link |
| Issue templates | `.github/ISSUE_TEMPLATE/*.yml` | Bug/feature forms | Present | Low | Not release-related |
| Version files | `package.json`, apps/*, packages/* | Product versions | Absent except SDK | Medium | Only `packages/sdk` = `1.0.0` |
| Migrations | `supabase/migrations/5302129..5302428` | Schema evolution | 34 added in delta | Medium | No down/rollback scripts (see report 07) |
| Migration naming | `docs/migrations/naming-guide.md` | Naming convention | Present | Low | `5302NNN_` prefix |
| Rollback notes | `docs/ROLLBACK_PROCEDURES.md` | Rollback procedure | Present, partially stale | High | Claims prod approval that isn't configured |
| CI gate table | `docs/CI.md` | Workflow inventory | Present, one wrong row | Medium | SBOM described as "Blocking" |
| SBOM artifact | `.github/workflows/sbom.yml`, `.gitignore:59-61` | Supply-chain artifact | Artifact-only, 30-day, unbound | High | No release/commit binding (report 35) |
| Branch protection | `.github/branch-protection/*.json` | Merge governance | Committed, weakened | High | Context mismatch; admin bypass (report 34) |
| Secrets rotation | `docs/SECRETS_ROTATION.md` | Rotation policy | Partial | Medium | 7 keys uncovered; no reminder (report 38) |

## Domain Scorecard

| Category | Score | Evidence | Gap | Recommended action |
|---|---:|---|---|---|
| Git history | 4 | 371-commit delta cleanly attributable; conventional-commit prefixes | Single author `openhands`; 9 `e`/6 `a`/3 `trigger` noise commits; no tags | Tag releases; enforce commit conventions |
| PR templates | 2 | `.github/PULL_REQUEST_TEMPLATE.md` 8-item checklist | Manual only; no link to required checks; no changelog checkbox | Add changelog/versioned-artifact checkbox (REL-P3-002) |
| Changelog/release-notes templates | 3 | `CHANGELOG.md` + `RELEASING.md:53-58` cut process | Stale at HEAD; no release-notes template; no GitHub Release body | Refresh `[Unreleased]`; add template (REL-P2-001/003) |
| Version files | 1 | Only `packages/sdk` has `version: 1.0.0` | No product/version identity anywhere | Add `version` + tag strategy (REL-P1-001) |
| Package versions | 2 | All workspaces `private: true`; SHA-tagged images | No semver, no dependency version policy for actions | Document SHA-as-version; add tags |
| Migrations | 3 | 34 new, naming guide, `verify-rls.mjs` guard | No down/rollback scripts; no per-release migration manifest | Add migration manifest to release notes (REL-P2-002) |
| API/UI/security/bug/dependency/infra/docs changes | 4 | 30 `fix(web)`, 17 `fix(api)`, 11 `security`, 24 `ci`, 45 `docs` | Not summarized per release; no per-commit classification | Keep changelog sections; add security section (done) |
| Breaking changes | 2 | RLS/entitlement migrations change policy behavior | No explicit "Breaking" section populated | Populate Breaking Changes section (REL-P2-002) |
| Known issues | 3 | `RELEASING.md:92-107`, `AGENTS.md` Known Debt | Not mirrored into changelog/release notes | Mirror known issues into release notes |
| Operator actions | 3 | `RELEASING.md` prod steps; deploy gates | Prod deploy path is documented-as-broken | Fix prod env, then document real steps |
| Migration steps | 3 | `supabase-migrations.yml` + `RELEASING.md:72-74` | No rollback migration steps | Add upgrade + rollback notes to release |
| Rollback notes | 2 | `ROLLBACK_PROCEDURES.md`; `deploy-do --rollback_sha` | Contains a false approval claim; Terraform section stale | Correct doc (REL-P2-004) |

## Detailed Review

### Item: Git history and the audited delta

- Evidence: `git log 75d3926..62861370`; `git diff --shortstat`; `git shortlog -sn`.
- What it does: Records 371 commits between the last audited commit (`75d39269`, "test-data: cover admin workflow-button states") and HEAD (`62861370`).
- How it appears to work: Conventional-commit prefixes are used mostly consistently; the dominant scopes are `web`, `api`, `worker`, `store`, `db`, `ci`/`deploy-do`, `docs(agents)`, `test(e2e)`.
- Dependencies: Git; `openhands` is the sole committed author.
- Current controls: Frequent, small commits; dated changelog sections.
- Missing controls: No tags; no signed commits evidence; 15 non-conventional commits (`e`, `a`, `trigger`, `web`, `rls`, `observability`, `deploy`, `cleanup`).
- Risks: Release boundaries cannot be expressed as versions; noisy commits complicate automated notes.
- Recommended improvement: Adopt annotated tags per prod promotion and a `release-notes` workflow.
- Suggested tests: CI test asserting `git tag` is not empty at promotion time.
- Suggested docs: `docs/RELEASING.md` tag section.

### Item: Changelog (`CHANGELOG.md`)

- Evidence: `CHANGELOG.md:1-247`; last commit touching it 2026-10-01 22:28.
- What it does: Keep a Changelog document with `[Unreleased]` (Added/Security/Fixed/Changed) and dated sections (`2026-09-21`, `09-20`, `09-18`, `08-26`).
- How it appears to work: Contributors append to `[Unreleased]`; a release inserts a dated heading (`RELEASING.md:53-58`).
- Dependencies: `RELEASING.md` policy; PR reviewers.
- Current controls: Rich evidence in entries (SHAs, migration numbers, file paths); section vocabulary aligned to security.
- Missing controls: No `Breaking Changes` entries; HEAD commits not yet listed; no automated reminder.
- Risks: Divergence between `CHANGELOG.md` and actual shipped state; operator surprises on breaking RLS changes.
- Recommended improvement: Refresh `[Unreleased]`; add a Breaking Changes subsection; add "no version bump" note referencing SHA-as-version.
- Suggested tests: `scripts/check-changelog.mjs` asserting HEAD-relevant commits are present (heuristic).
- Suggested docs: A `templates/RELEASE_NOTES_TEMPLATE.md`.

### Item: Version files / package versions

- Evidence: `package.json`, `apps/*/package.json`, `packages/*/package.json`; `packages/sdk/package.json:3`.
- What it does: Declares workspaces; all `private: true`.
- How it appears to work: No semver is used; a release is a commit SHA-tagged GHCR image (`RELEASING.md:49-52`).
- Dependencies: GHCR; `IMAGE_TAG`/`rollback_sha`.
- Current controls: SHA tagging; rollback by SHA.
- Missing controls: No `version` field, no tags, no changelog-to-version mapping.
- Risks: Release notes cannot reference a version; downstreams cannot pin a semver.
- Recommended improvement: Add a `version` to the root manifest and cut annotated tags; or explicitly document "SHA is the version" and add it to the template.
- Suggested tests: Assert the release notes name the exact commit SHA.
- Suggested docs: Versioning section (already partially in `RELEASING.md`).

### Item: Migrations and upgrade steps

- Evidence: 34 new files `supabase/migrations/5302129..5302428`; `docs/migrations/naming-guide.md`; `scripts/verify-rls.mjs`; `RELEASING.md:72-74`.
- What it does: Applies schema/RLS changes via `supabase-migrations.yml` (`supabase db push --include-all`), serialized per branch.
- How it appears to work: Migrations run only from CI; the prod deploy's `migrate-gate` calls the same workflow.
- Dependencies: Supabase CLI; `SUPABASE_*` secrets; prod environment.
- Current controls: Blocking migration gate; idempotent RLS guard script.
- Missing controls: No down-migrations; no per-release migration list in changelog/release notes.
- Risks: Upgrades are effectively forward-only; operators lack a compact upgrade manifest.
- Recommended improvement: Emit an "Upgrade notes" list of migration filenames per release in `release_notes_draft.md`.
- Suggested tests: Migration idempotency re-run must be a no-op (already partly covered by `verify-rls.mjs`).
- Suggested docs: Link the migration list from the release notes.

### Item: Rollback notes and operator actions

- Evidence: `docs/ROLLBACK_PROCEDURES.md` (incl. `:116-120`, `:165-167`); `RELEASING.md:76-82,92-107`; `deploy-do.yml` `rollback_sha`.
- What it does: Describes automated rollback (`dispatch deploy-do` with `rollback_sha`), the health-gate auto-rollback, and prod caveats.
- How it appears to work: Deploy re-tags existing GHCR images; no rebuild.
- Dependencies: Prior image tags; SSH secrets.
- Current controls: Automated rollback path; documented verification (`curl /health`).
- Missing controls: `:167` claims `prod-approval` reviewers exist (contradicted); `:116-120` describes a push-triggered Terraform flow that no longer runs (`terraform-do` is dispatch-only).
- Risks: Operators follow stale steps during an incident; false belief in an approval gate.
- Recommended improvement: Reconcile docs to the real state (reports 34/12); add a rollback section to the release notes draft.
- Suggested tests: Walk the rollback procedure on `dev` and record the outcome.
- Suggested docs: `docs/ROLLBACK_PROCEDURES.md` correction.

### Item: Generated-artifact binding (extended verification)

- Evidence: `.github/workflows/sbom.yml:1-34`; `.gitignore:59-61`; report 35 (`SBOM-P2-001`).
- What it does: `sbom.yml` generates `sbom.cdx.json` and uploads `sbom-cyclonedx` (30-day retention) on push/PR/weekly/dispatch.
- How it appears to work: Fixed artifact name; not committed; not attached to a release or image.
- Dependencies: `actions/upload-artifact`; Node 20.
- Current controls: SHA-pinned actions; weekly schedule.
- Missing controls: No `serialNumber`, no commit binding, no version; not release-bound; fixed filename.
- Risks: The artifact set a "release" ships with cannot be reconstructed after 30 days and cannot be tied to a commit.
- Recommended improvement: Embed the commit SHA; publish to the GitHub Release; use versioned filenames.
- Suggested tests: `gh attestation verify` / assert the SBOM contains a 40-hex SHA.
- Suggested docs: `docs/SBOM_PROCESS.md`.

## Scenario / Control Matrix

| ID | Scenario or control | Evidence | Current control | Gap | Severity | Recommendation |
|---|---|---|---|---|---|---|
| REL-001 | Git history | `git log` 371 commits | Conventional commits; dated changelog | No tags; single author; noise commits | P2 | Tag per promotion; enforce conventions |
| REL-002 | PR templates | `.github/PULL_REQUEST_TEMPLATE.md` | Manual 8-item checklist | No changelog/versioned-artifact item | P3 | Add items (REL-P3-002) |
| REL-003 | Changelog/release-notes templates | `CHANGELOG.md`; `RELEASING.md:53-58` | Keep a Changelog + cut process | Stale at HEAD; no release-notes template | P2 | Refresh + template (REL-P2-001/003) |
| REL-004 | Version files | manifests | SHA-as-version | No `version` anywhere but SDK | P1 | Add version + tags (REL-P1-001) |
| REL-005 | Package versions | `private:true`, SHA images | SHA-tagged images | No semver; no dependency version policy | P2 | Document; add tags |
| REL-006 | Migrations | 34 new migrations | CI-applied, serialized | No down-migrations; no manifest | P2 | Upgrade notes per release (REL-P2-002) |
| REL-007 | API/UI/security/bug/dependency/infra/docs changes | commit scopes | Changelog sections | No per-release classification | P2 | Keep sections; add security section |
| REL-008 | Breaking changes | RLS/entitlement migrations | None populated | No Breaking Changes entries | P2 | Populate + policy (REL-P2-002) |
| REL-009 | Known issues | `RELEASING.md:92-107` | Documented prod caveats | Not mirrored into release notes | P3 | Mirror into drafts |
| REL-010 | Operator actions | `RELEASING.md` prod steps | Documented steps | Prod path documented-as-broken | P1 | Fix env; document real steps (REL-P1-002) |
| REL-011 | Migration steps | `supabase-migrations.yml` | Blocking gate | No rollback steps | P2 | Add upgrade/rollback notes |
| REL-012 | Rollback notes | `ROLLBACK_PROCEDURES.md` | Automated rollback path | False approval claim; stale Terraform section | P2 | Correct doc (REL-P2-004) |

## Findings

### Finding ID: REL-P1-001 - No version identity: no tags, no product version, no commit binding in generated artifacts

- Severity: P1 (High)
- Confidence: High
- Area: Release identity / generated artifacts
- Evidence:
  - `git tag` → empty; `git describe` → "No names found".
  - `docs/RELEASING.md:49-52` — "A release is the Docker images on GHCR … tagged with the deploying commit SHA".
  - `package.json`, `apps/*/package.json`, `apps/worker/package.json` have no `"version"`; only `packages/sdk/package.json:3` = `"1.0.0"`.
  - `.github/workflows/sbom.yml:29-34` — fixed artifact name `sbom-cyclonedx`, 30-day retention, no release upload.
  - Report 35 (`SBOM-P2-001`) — parsed SBOM has no `serialNumber`, no `metadata.component.version`, no 40-hex SHA.
- What is happening: The project has no versioned release identity. Releases exist only as GHCR image tags equal to a commit SHA. The one generated artifact that accompanies a build (the SBOM) does not record the commit or version it was generated from and cannot be retrieved after its 30-day artifact window.
- Why it matters: Release notes cannot cite a version; the shared rule "generated artifacts must record the commit/version they were generated from and match their shipped artifact set" is not satisfied. Post-incident, the exact artifact set for a shipped image is not reconstructible.
- User / business impact: Customers/operators cannot reference a stable version; changelog entries are anchored to SHAs only.
- Security / privacy / reliability impact: Weak supply-chain provenance; no verifiable source↔artifact link.
- Recommended fix: (1) Embed the commit SHA (and a `serialNumber`) into `scripts/generate-sbom.mjs`. (2) Publish the SBOM as a GitHub Release asset / OCI attestation. (3) Cut annotated git tags per prod promotion and add the tag to the release notes. (4) Optionally add a root `version` and derive it from the tag.
- Suggested validation: `git tag` non-empty after promotion; SBOM contains a 40-hex SHA; `gh release view <tag>` lists `sbom.cdx.json`.
- Owner suggestion: Platform Engineering
- Effort estimate: M
- Dependencies: A release/tag decision; GHCR/GitHub Release permissions.
- Status: open
- Endpoint / data path: push `main` → `deploy-do` builds SHA-tagged images → `sbom.yml` artifact (30d).
- Attack path: none identified (integrity/provenance gap).

### Finding ID: REL-P1-002 - Documented production deploy path is stated as non-functional and the approval gate claim is false

- Severity: P1 (High)
- Confidence: High (docs + config) / Medium (live state not reproducible)
- Area: Operator actions / release governance
- Evidence:
  - `docs/RELEASING.md:92-107` — "The `prod` environment has no `SUPABASE_*`/`JWT_SECRET` secrets or vars, so the prod deploy path cannot succeed as configured; `prod`/`prod-approval` also have no protection rules."
  - `docs/ROLLBACK_PROCEDURES.md:167` — "All production deployments (Docker and Terraform) require approval through the `prod-approval` GitHub environment with 1+ required reviewers" — contradicted by `RELEASING.md` and the matrix.
  - Report 34 (`BP-P1-003`) and report 10 (`CI-P1-001`) — `deploy-do` uses the `prod` environment, not `prod-approval`; no required reviewers configured.
- What is happening: The release notes would tell operators to "promote `develop` → `main`", but the documented prod path is simultaneously stated to be broken (missing secrets) and mis-documented as gated by reviewers that do not exist.
- Why it matters: An operator following the release/rollback docs cannot distinguish a doc bug from a real outage and may believe an approval gate protects prod when it does not.
- User / business impact: Elevated risk of an unapproved or failed production deployment; slower incident response.
- Security / privacy / reliability impact: False sense of change-control on the most sensitive path.
- Recommended fix: (1) Configure the required `prod` environment secrets and ≥1 required reviewer, or repoint the prod deploy job to `prod-approval`. (2) Correct `ROLLBACK_PROCEDURES.md:167` and `RELEASING.md` to match reality. (3) Record the true operator steps in the release-notes draft.
- Suggested validation: Dispatch `deploy-do` with `deploy_target: prod`; the run must pause for approval and then succeed with all secrets present.
- Owner suggestion: platform/operations (repo admin)
- Effort estimate: S (settings + docs)
- Dependencies: Repo admin; decision on standard environment name.
- Status: open
- Endpoint / data path: `main` push → `deploy-do.deploy` → SSH droplet → `docker compose up` (writes `/opt/mct-portal/.env`).
- Attack path: composes with report 34's BP-P1-002 (admin bypass) into "unattended/unapproved production change".

### Finding ID: REL-P2-001 - `CHANGELOG.md` is stale relative to HEAD for the final commits in the delta

- Severity: P2 (Medium)
- Confidence: High
- Area: Changelog accuracy (self-consistency)
- Evidence:
  - Last commit touching `CHANGELOG.md` = 2026-10-01 22:28:52.
  - HEAD = `62861370` "docs: record the widened a11y default gate" (2026-10-01 23:25:45), preceded by `43573d12` (a11y default scan + wcag22aa gate) and `13e95482` (test counts).
  - `CHANGELOG.md` `[Unreleased]` contains no entry for the widened a11y default gate / wcag22aa promotion.
- What is happening: The most recent accessibility/CI changes that shipped in this delta are not reflected in the changelog's `[Unreleased]` section.
- Why it matters: Per the shared rules, summary artifacts must be verified against their source of truth; a changelog that lags HEAD misstates what a release contains.
- User / business impact: Release notes would omit a user-visible accessibility improvement.
- Security / privacy / reliability impact: Low (documentation integrity).
- Recommended fix: Add a `[Unreleased]` entry for the a11y default gate (commits `43573d12`, `62861370`) and the test-count update (`13e95482`); adopt a PR-template checkbox requiring a changelog line for user-visible changes.
- Suggested validation: `git log --since=<changelog mtime>` yields only commits already represented in the changelog, or a documented exclusion.
- Owner suggestion: Documentation owner
- Effort estimate: S
- Dependencies: None.
- Status: open
- Endpoint / data path: n/a (documentation).

### Finding ID: REL-P2-002 - No explicit Breaking Changes or upgrade manifest despite 34 migrations and RLS/entitlement behavior changes

- Severity: P2 (Medium)
- Confidence: High
- Area: Breaking changes / migration steps
- Evidence:
  - 34 new migrations (`5302129`–`5302428`), including `5302412_rls_approved_status_gap.sql`, `5302418_rls_approved_status_gap_2.sql`, `5302420_rls_entitlements_and_impersonation_fix.sql`, `5302428_client_portal_entitlements_platform_admin.sql`, `5302132_store_rls_fix.sql`, `5302135_profiles_encrypted_pii.sql`.
  - `CHANGELOG.md` has no "Breaking Changes" section; dated sections use Added/Security/Fixed/Changed only.
  - `docs/migrations/naming-guide.md` exists; no per-release migration manifest.
- What is happening: RLS/entitlement policy changes can alter authorization behavior after deploy (some intentionally revoke prior access), but there is no "Breaking Changes" record and no compact upgrade manifest listing the migrations a release applies.
- Why it matters: Operators and future agents cannot see, per release, which schema/authorization changes are behavior-affecting, nor whether a rollback is schema-compatible.
- User / business impact: Surprises after deploy (e.g. previously-permitted writes now denied).
- Security / privacy / reliability impact: Under-reported authorization changes; rollback ambiguity.
- Recommended fix: Populate a `### Breaking Changes` subsection for any migration that changes RLS/entitlement/enum/column-nullability behavior; list the release's migration filenames in `release_notes_draft.md`; add migration step + rollback note per release.
- Suggested validation: Every migration in a release appears in the release-notes migration list; each behavior-affecting migration appears under Breaking Changes.
- Owner suggestion: Backend/Data owner
- Effort estimate: S–M
- Dependencies: Report 07 (schema/migrations) findings.
- Status: open
- Endpoint / data path: `supabase-migrations.yml` → Supabase prod DB.

### Finding ID: REL-P2-003 - No release-notes or GitHub Release body template; release body must be authored ad hoc

- Severity: P2 (Medium)
- Confidence: High
- Area: Release-notes templates
- Evidence:
  - `.github/workflows/` has no `release*` workflow; no `softprops/action-gh-release`/`gh release create` step exists.
  - No `templates/RELEASE_NOTES_TEMPLATE.md` or `docs/RELEASE_NOTES_TEMPLATE.md` found; `templates/` exists but holds other content.
  - `docs/RELEASING.md:53-58` documents a changelog cut but not a GitHub Release body.
- What is happening: The changelog has a defined cut process but there is no template, and no workflow produces a GitHub Release body; required outputs (GitHub release body, upgrade/rollback notes) are not backed by a repeatable artifact.
- Why it matters: Release notes quality depends on the individual; sections (security/operator/breaking) can be missed.
- User / business impact: Inconsistent release communication.
- Security / privacy / reliability impact: Low (process hygiene).
- Recommended fix: Add `templates/RELEASE_NOTES_TEMPLATE.md` with fixed sections (Summary, Added, Changed, Fixed, Security, Breaking Changes, Migrations, Operator Actions, Known Issues, Rollback, Verification) and reference it from `RELEASING.md`; optionally auto-populate from the changelog via a workflow.
- Suggested validation: A dry-run release body is generated filling every section.
- Owner suggestion: Documentation/Platform
- Effort estimate: S
- Dependencies: Decision on tags (REL-P1-001).
- Status: open

### Finding ID: REL-P2-004 - Rollback documentation is stale (Terraform push flow) and repeats the false approval claim

- Severity: P2 (Medium)
- Confidence: High
- Area: Rollback notes
- Evidence:
  - `docs/ROLLBACK_PROCEDURES.md:116-120` — Terraform rollback says "Push to trigger terraform-do workflow" and "will run a plan on the PR/push and apply automatically (dev) or require prod-approval (main)", but `.github/workflows/terraform-do.yml:3-14` is `workflow_dispatch` only.
  - `docs/ROLLBACK_PROCEDURES.md:167` — approval claim (see REL-P1-002).
  - Reports 34 (`BP-P3-001`) and 10 — same drift independently found.
- What is happening: The rollback runbook describes a Terraform trigger and an approval gate that no longer match the workflows.
- Why it matters: During an incident, operators may wait for a plan that never runs or assume an approval step protects an apply.
- User / business impact: Slower, error-prone incident response.
- Security / privacy / reliability impact: Reliability/response gap; doc-vs-behavior mismatch.
- Recommended fix: Update the Terraform rollback section to the dispatch command (`gh workflow run terraform-do.yml -f apply=true --ref <branch>`) and the true `prod-approval` state; correct `:167`.
- Suggested validation: Walk the rollback section as written against `terraform-do.yml` and `deploy-do.yml`; every step must be executable.
- Owner suggestion: platform/operations
- Effort estimate: S
- Dependencies: REL-P1-002 decision.
- Status: open

### Finding ID: REL-P3-001 - Commit history contains non-conventional noise commits and a single author, reducing automated-notes quality

- Severity: P3 (Low)
- Confidence: High
- Area: Git history hygiene
- Evidence:
  - `git log --pretty=%s 75d3926..62861370` prefix counts: `fix` 121, `feat` 74, `docs` 45, `test` 37, `ci` 24, `chore` 19, `security` 11, `refactor` 9, plus non-conventional `e` 7, `auth`/`a` 6, `merge` 6, `trigger` 3, `web` 2, `rls` 2, `observability` 1, `deploy` 1, `cleanup` 1.
  - `git shortlog -sn` → 371 commits by `openhands` only.
- What is happening: ~15 commits have ambiguous prefixes and all commits share one author identity, so automated classification/attribution is unreliable.
- Why it matters: Automated release-note generation and blame attribution degrade.
- User / business impact: Minor; slower triage.
- Security / privacy / reliability impact: None material.
- Recommended fix: Add a commitlint check to CI; use per-author identities.
- Suggested validation: commitlint rejects a non-conventional subject.
- Owner suggestion: Platform
- Effort estimate: S
- Dependencies: None.
- Status: open

### Finding ID: REL-P3-002 - PR template lacks changelog and versioned-artifact checkboxes

- Severity: P3 (Low)
- Confidence: High
- Area: PR template completeness
- Evidence:
  - `.github/PULL_REQUEST_TEMPLATE.md:9-18` — checklist covers tests, lint, OpenAPI, prompts, review.md, migrations, secrets, docs; no changelog item and no reference to required checks.
  - `docs/RELEASING.md:9` requires `CHANGELOG.md [Unreleased]` to reflect the change, but nothing enforces it.
- What is happening: The release doc requires a changelog update on every shipping change, but the PR template does not prompt for it.
- Why it matters: The one manual step most likely to drift (REL-P2-001) is not asked for at PR time.
- User / business impact: Minor; occasional stale changelog.
- Security / privacy / reliability impact: None.
- Recommended fix: Add "- [ ] `CHANGELOG.md` `[Unreleased]` updated (or N/A for docs-only)" and "- [ ] Required checks green (see `.github/branch-protection/README.md`)" to the template.
- Suggested validation: Template renders the new items on a new PR.
- Owner suggestion: platform
- Effort estimate: S
- Dependencies: None.
- Status: open

## Risks

| Risk | Severity | Likelihood | Impact | Evidence | Mitigation |
|---|---|---|---|---|---|
| No version identity / no tags | P1 | High | High | `git tag` empty; `RELEASING.md:49-52` | Add tags + version; bind SBOM (REL-P1-001) |
| Prod deploy path documented as broken + false approval claim | P1 | Medium | High | `RELEASING.md:92-107`; `ROLLBACK_PROCEDURES.md:167` | Fix env; correct docs (REL-P1-002) |
| Changelog stale at HEAD | P2 | High | Medium | `CHANGELOG.md` mtime < HEAD | Refresh `[Unreleased]` (REL-P2-001) |
| Breaking/RLS changes unlisted | P2 | Medium | Medium | 34 migrations; no Breaking section | Add Breaking + manifest (REL-P2-002) |
| No release-notes/GitHub Release body template | P2 | High | Medium | No release workflow/template | Add template (REL-P2-003) |
| Stale rollback docs | P2 | High | Medium | `ROLLBACK_PROCEDURES.md:116-120` | Correct doc (REL-P2-004) |
| SBOM not release/commit-bound | P2 | Medium | High | `sbom.yml:29-34`; report 35 | Publish + bind (REL-P1-001) |
| Dependency noise in history | P3 | Medium | Low | 15 non-conventional commits | commitlint (REL-P3-001) |

## Recommendations

### Immediate / Release Blocking

1. **REL-P1-002** — Fix the production environment (secrets + ≥1 required reviewer) and correct the false `prod-approval` approval claim before the next prod promotion; do not publish release notes that describe a non-existent gate.
2. **REL-P1-001** — Bind the SBOM to the commit (embed SHA/`serialNumber`) and publish it as a release asset; introduce annotated tags so release notes can cite a version.

### This Week

3. **REL-P2-001** — Refresh `CHANGELOG.md` `[Unreleased]` for the final a11y/CI commits in the delta.
4. **REL-P2-002** — Add a Breaking Changes subsection and a per-release migration manifest.
5. **REL-P2-004** — Correct `docs/ROLLBACK_PROCEDURES.md` (Terraform dispatch flow; approval claim).
6. **REL-P2-003** — Add `templates/RELEASE_NOTES_TEMPLATE.md` and reference it in `RELEASING.md`.

### This Month

7. **REL-P3-002** — Add changelog/required-checks checkboxes to `.github/PULL_REQUEST_TEMPLATE.md`.
8. **REL-P3-001** — Add commitlint to CI.
9. Add a `release-notes` workflow that drafts the GitHub Release body from the changelog + tags.

### Later / Platform Evolution

10. Adopt semantic release or an equivalent tag/version automation; migrate to GitHub Rulesets/merge queue for governance (follows reports 34/10).

## Quick Wins

| Quick win | Why it helps | Files likely involved | Validation |
|---|---|---|---|
| Refresh `[Unreleased]` | Changelog matches HEAD | `CHANGELOG.md` | No unreported HEAD commits |
| Correct `:167` approval claim | Removes false safety claim | `docs/ROLLBACK_PROCEDURES.md` | Doc matches matrix/RELEASING |
| Add release-notes template | Repeatable, complete notes | `templates/RELEASE_NOTES_TEMPLATE.md` | Template renders all sections |
| Add changelog checkbox | Reduces staleness | `.github/PULL_REQUEST_TEMPLATE.md` | New PR shows item |
| Add Breaking Changes section | Surfaces RLS/entitlement changes | `CHANGELOG.md` | Migrations mapped |

## Hardening Backlog

| Backlog item | Priority | Owner suggestion | Effort | Dependency |
|---|---|---|---|---|
| Tags + version identity | P1 | Platform | M | Release decision |
| Bind SBOM to commit + publish | P1 | Platform | M | Tags/release |
| Prod env secrets + reviewers | P1 | ops | S | Admin access |
| Changelog refresh + Breaking section | P2 | Docs owner | S | None |
| Per-release migration manifest | P2 | Backend | S | Report 07 |
| Release-notes template | P2 | Docs | S | None |
| Rollback doc correction | P2 | ops | S | None |
| PR template items | P3 | platform | S | None |
| commitlint | P3 | platform | S | None |
| Release-notes workflow | Later | Platform | M | Tags |

## Suggested Tests

- **CI/docs:** `scripts/check-changelog.mjs` — fail when a `feat`/`fix` commit since the last changelog edit is not represented (with an exclusion list).
- **CI/release:** assert `git tag` is non-empty and the tag matches HEAD before publishing; assert the release body's commit SHA equals HEAD.
- **Binding (extended):** assert the generated SBOM contains the 40-hex commit SHA and a `serialNumber`; `gh attestation verify sbom.cdx.json` succeeds for a released SHA.
- **Migrations:** assert every migration in a release is listed in `release_notes_draft.md`; assert idempotent re-run is a no-op (echoes `verify-rls.mjs`).
- **Security/CI:** a PR adding a deny-listed license fails `dependency-review` (report 35) and the change is noted in the release's Security section.
- **Manual:** walk the rollback procedure on `dev` and record each command's outcome; confirm dispatch-only Terraform steps are accurate.

## Suggested Documentation Updates

- **Update `CHANGELOG.md`** — refresh `[Unreleased]`; add a `### Breaking Changes` subsection; add a versioning note (SHA-as-version until tags exist).
- **Update `docs/ROLLBACK_PROCEDURES.md`** — correct the Terraform dispatch flow and the `prod-approval`/`prod` approval claim.
- **Update `docs/RELEASING.md`** — add tag/version step to the checklist; reference the new release-notes template; reconcile the prod caveats with the actual environment state.
- **Create `templates/RELEASE_NOTES_TEMPLATE.md`** — fixed section set (see REL-P2-003).
- **Update `.github/PULL_REQUEST_TEMPLATE.md`** — add changelog + required-checks items.
- **Create `docs/SBOM_PROCESS.md`** — scope, storage, release binding, and verification (shared with report 35).

## Open Questions

| Question | Why it matters | Evidence needed |
|---|---|---|
| Is a semver/tag scheme intended, or is SHA-as-version permanent? | Determines version-file and tag remediation | Founder/Platform decision |
| Are the `prod` environment secrets present in live GitHub? | Whether prod promotion can succeed | Redacted Environment settings |
| Has any prod promotion occurred since 2026-08-06? | Whether the delta is already "released" | GitHub Actions run history / tags |
| Should behavior-affecting RLS migrations be treated as breaking for customers? | Drives Breaking Changes policy | Product/Backend decision |
| Where should release SBOMs live (GitHub Releases vs OCI vs both)? | Implementation of REL-P1-001 | Release-process decision |

## Appendix

### A. Delta summary (75d39269 → 62861370)

```
Commits:            371
Files changed:    1,225
Insertions:     +104,410
Deletions:       -33,559
Migrations added:   34  (5302129 .. 5302428)
Authors:             openhands (371)

Prefix counts: fix 121 · feat 74 · docs 45 · test 37 · ci 24 · chore 19
               security 11 · refactor 9 · other/non-conventional ~15
Scopes (top):  fix(web) 30 · fix(api) 17 · feat(web) 14 · feat(worker) 13
               feat(api) 10 · docs(agents) 10 · ci(deploy-do) 9 · test(e2e) 8
```

### B. main vs develop

```
main HEAD:            881960f9 "update badges"
merge-base(main,dev): 881960f9  (main is an ancestor of develop)
develop ahead of main: 662 commits
diff main..develop:   2,635 files, +593,891 / -19,556
git tags:             none
```

### C. Mermaid — release flow (current vs proposed)

```mermaid
flowchart LR
  subgraph Current
    D[develop] -->|merge| M[main]
    M --> DD[deploy-do<br/>SHA-tagged GHCR images]
    DD --> ENV[/opt/mct-portal/.env<br/>no approval gate]
    PKG[pnpm-lock.yaml] --> SBOM[sbom.cdx.json<br/>artifact-only 30d<br/>no commit binding]
  end
  subgraph Proposed
    D2[develop] -->|merge + tag vX.Y.Z| M2[main]
    M2 --> DD2[deploy-do<br/>versioned images]
    DD2 --> REL[GitHub Release<br/>versioned notes + SBOM]
    REL --> AT[attest-build-provenance]
  end
```

### D. Companion artifacts (written in this run folder)

- `release_notes_draft.md` — draft release notes for the `75d39269 → 62861370` delta.
- `changelog_draft.md` — proposed `CHANGELOG.md` additions (Keep a Changelog format).
- `branch_protection_recommendation.md` — from report 34 (BP-*).
- `sbom_license_policy_recommendation.md` — from report 35 (SBOM-*).
- `secret_rotation_runbook.md` — from report 38 (SECRET-*); process-only, no secret values.
