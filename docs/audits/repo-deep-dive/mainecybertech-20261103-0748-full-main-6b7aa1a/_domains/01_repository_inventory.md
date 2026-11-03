# Comprehensive Repository Inventory

## Audit Metadata

- Audit name: repo-deep-dive (mainecybertech)
- Run: `mainecybertech-20261103-0748-full-main-6b7aa1a`
- Repository: `github.com/MaineCyberTech/mainecybertech`
- Branch: `main`
- Commit SHA: `6b7aa1a5505d4f75b334b36e9e87737cd98e589c`
- Generated at: 2026-11-03
- Auditor: OpenCode subagent (read-only)
- Area code: INV
- Output path: `docs/audits/repo-deep-dive/mainecybertech-20261103-0748-full-main-6b7aa1a/01_repository_inventory.md`
- Scope limitations: repository-only verification; no production database or GitHub environment secrets were read. Prior-run claims were re-checked against this commit, not assumed.

## Scope

Inventoried the monorepo at 6b7aa1a, re-verified nine prior INV findings, and checked generated artifacts, migrations, prompt corpus, docs/audits corpus and service-worker/build outputs. The new duplicate migration version is the only release-blocking inventory issue.

## Evidence Reviewed

| Evidence | Type | Why relevant | Notes |
|---|---|---|---|
| `supabase/migrations/` | tree | migration inventory | Read at 6b7aa1a5 |
| `scripts/preflight-check.sh:50-51` | check | duplicate detection | Read at 6b7aa1a5 |
| `.github/workflows/supabase-migrations.yml:71-90` | workflow | db push | Read at 6b7aa1a5 |
| `prompts/PROVENANCE.md:10-14` | pin | prompt corpus | Read at 6b7aa1a5 |
| `apps/web/components/ServiceWorkerRegistrar.tsx:22-24` | registration | SW | Read at 6b7aa1a5 |
| `docs/openapi.yaml` | generated | OpenAPI snapshot | Read at 6b7aa1a5 |

## Verification Performed

| Evidence / claim | Method | Result |
|---|---|---|
| All 9 prior INV findings | Read the cited symbols/routes at `6b7aa1a5` | 8 verified-fixed, 1 partially-fixed, 0 open, 0 regressed |
| Nov 3 diff (`7dd0402..6b7aa1a5`) | `git diff --stat` plus targeted review of area files | 137 commits / 414 files changed overall; only area-relevant files were read line-by-line |
| New INV issues | Attack-path/static review of changed routes and migrations | 1 new findings |
| Build/CI claims | File inspection only (dependencies not installed in the read-only worktree) | Marked `not run` where execution was impossible |

## Executive Summary

The repository inventory is broadly healthy: generated build artifacts are untracked/gated, the prompt corpus is pinned and verified, Vercel/Studio scratch remnants are gone, and the service worker is registered. One new P1 was found: two migrations share version 5302463, the repository's own preflight check fails on it, and the Supabase push workflow keys migrations by that version. Eight prior findings remain fixed; the OpenAPI regenerate-and-diff gap remains partial.

Counts: **10** findings total - 8 verified-fixed, 1 partially-fixed, 1 open (all new), 0 regressed, **1 new**. Severity: P0 0, P1 1, P2 2, P3 7.

## Inventory

| Item | Path / symbol | Purpose | Current state | Risk | Notes |
|---|---|---|---|---|---|
| Migrations | supabase/migrations/ | 162 SQL migrations | two at version 5302463 | P1 | INV-P1-001 |
| Preflight | scripts/preflight-check.sh:50-51 | duplicate check | currently fails | P1 | INV-P1-001 |
| Prompt corpus | prompts/ | 624 pinned files | verified | Low | INV-P3-001 |
| OpenAPI snapshot | docs/openapi.yaml | 16,867 lines | no diff gate | P2 | INV-P2-001 |
| Service worker | apps/web/public/sw.js + registrar | PWA shell | registered | Low | INV-P3-007 |
| Bootstrap copy | docs/portal_platform_formal_handoff_bundle/... | historical SQL | clearly marked | Low | INV-P2-002 |

## Domain Scorecard

| Category | Score | Evidence | Gap | Recommended action |
|---|---:|---|---|---|
| Root/workspace layout | 4 | `package.json/pnpm-workspace.yaml` | monorepo coherent | No action |
| Applications/packages | 4 | `apps/{api,web,worker}, packages/*` | clear boundaries | No action |
| Database migrations | 2 | `supabase/migrations` | duplicate version 5302463 | Rename + CI check |
| Generated artifacts | 3 | `version.json/SBOM/OpenAPI` | OpenAPI not diff-gated | Add regenerate+diff |
| Docs/audit corpus | 4 | `prompts/PROVENANCE.md, docs/audits` | pinned/verified | Archive per budget |

## Detailed Review

### Item: Root/workspace layout

- Evidence: `package.json/pnpm-workspace.yaml`
- What it does: Root/workspace layout control/implementation.
- Current controls: score 4/5 at this commit.
- Missing controls / gap: monorepo coherent.
- Recommended improvement: No action.

### Item: Applications/packages

- Evidence: `apps/{api,web,worker}, packages/*`
- What it does: Applications/packages control/implementation.
- Current controls: score 4/5 at this commit.
- Missing controls / gap: clear boundaries.
- Recommended improvement: No action.

### Item: Database migrations

- Evidence: `supabase/migrations`
- What it does: Database migrations control/implementation.
- Current controls: score 2/5 at this commit.
- Missing controls / gap: duplicate version 5302463.
- Recommended improvement: Rename + CI check.

### Item: Generated artifacts

- Evidence: `version.json/SBOM/OpenAPI`
- What it does: Generated artifacts control/implementation.
- Current controls: score 3/5 at this commit.
- Missing controls / gap: OpenAPI not diff-gated.
- Recommended improvement: Add regenerate+diff.

### Item: Docs/audit corpus

- Evidence: `prompts/PROVENANCE.md, docs/audits`
- What it does: Docs/audit corpus control/implementation.
- Current controls: score 4/5 at this commit.
- Missing controls / gap: pinned/verified.
- Recommended improvement: Archive per budget.

## Scenario / Control Matrix

| ID | Scenario or control | Evidence | Current control | Gap | Severity | Recommendation |
|---|---|---|---|---|---|---|
| INV-001 | Root/workspace layout | `package.json/pnpm-workspace.yaml` | score 4/5 | monorepo coherent | P3 | No action |
| INV-002 | Applications/packages | `apps/{api,web,worker}, packages/*` | score 4/5 | clear boundaries | P3 | No action |
| INV-003 | Database migrations | `supabase/migrations` | score 2/5 | duplicate version 5302463 | P2 | Rename + CI check |
| INV-004 | Generated artifacts | `version.json/SBOM/OpenAPI` | score 3/5 | OpenAPI not diff-gated | P3 | Add regenerate+diff |
| INV-005 | Docs/audit corpus | `prompts/PROVENANCE.md, docs/audits` | score 4/5 | pinned/verified | P3 | Archive per budget |

## Findings

### Finding ID: INV-P2-001 - Committed generated artifacts drift without a gate

- Severity: P2
- Confidence: High
- Area: INV
- Evidence:
  - `version.json`
  - `github/actions/unit-tests/action.yml`
  - `scripts/public-route-inventory.mjs`
  - `docs/openapi.yaml`
  - `apps/api/package.json`
  - `apps/api/src/openapi/spec.ts`
  - Symbols / routes: Committed generated artifacts drift without a gate
- What is happening: re-verified at 6b7aa1a5: version.json is untracked and gitignored (.gitignore:76), SBOM/license artifacts stay untracked, and CI runs scripts/openapi-audit.js (.github/actions/unit-tests/action.yml:59) plus `node scripts/public-route-inventory.mjs --check` (:133). Residual unchanged: docs/openapi.yaml (16,867 lines) is still not regenerated-and-diffed in CI; `generate:openapi` exists at apps/api/package.json:14, but no workflow runs it followed by `git diff --exit-code`, so the committed YAML can drift from apps/api/src/openapi/spec.ts.
- Why it matters: Part of the prior fix is present, but the residual described in the verification note is still reproducible.
- User / business impact: A material hardening or correctness gap that should be scheduled this month.
- Security / privacy / reliability impact: A material hardening or correctness gap that should be scheduled this month.
- Recommended fix: Close the residual described in the verification note and add a regression test that fails on the prior behavior.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `INV-P2-001` at `6b7aa1a5`.
- Owner suggestion: repo maintainer / platform CI owner
- Effort estimate: M
- Dependencies: none identified beyond the cited module.
- Status: partially-fixed
- Endpoint / data path: see evidence
- Attack path: none identified beyond the documented control gap.

### Finding ID: INV-P2-002 - Duplicate schema bootstrap SQL can be mistaken for the source of truth

- Severity: P2
- Confidence: High
- Area: INV
- Evidence:
  - `docs/portal_platform_formal_handoff_bundle/supabase_consolidated_fresh_bootstrap_20260529.sql`
  - Symbols / routes: Duplicate schema bootstrap SQL can be mistaken for the source of truth
- What is happening: re-verified at 6b7aa1a5: docs/portal_platform_formal_handoff_bundle/supabase_consolidated_fresh_bootstrap_20260529.sql:16-21 still carries the 'HISTORICAL / GENERATED COPY - DO NOT EDIT (INV-P2-002)' header pointing at the live migration chain, so the copy cannot be mistaken for the bootstrap source.
- Why it matters: The prior finding is closed at this commit: the cited control is present and no residual was reproduced.
- User / business impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Security / privacy / reliability impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Recommended fix: No action; keep the regression coverage cited in the note.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `INV-P2-002` at `6b7aa1a5`.
- Owner suggestion: backend/DB lead
- Effort estimate: M
- Dependencies: none identified beyond the cited module.
- Status: verified-fixed
- Endpoint / data path: see evidence
- Attack path: none identified (control verified).

### Finding ID: INV-P3-001 - Large committed prompt/audit corpus inflates the application repository

- Severity: P3
- Confidence: High
- Area: INV
- Evidence:
  - `prompts/PROVENANCE.md`
  - `github/workflows/validate.yml`
  - Symbols / routes: Large committed prompt/audit corpus inflates the application repository
- What is happening: re-verified at 6b7aa1a5: prompts/PROVENANCE.md:10-14 pins the corpus (624 pinned files, 626 tracked including manifest/PROVENANCE) and .github/workflows/validate.yml:145-148 runs `node scripts/verify-prompts.js verify` as a deploy gate; the command reports 'Prompt provenance OK - all files match manifest (624 files, 8.9 MiB)' at this commit.
- Why it matters: The prior finding is closed at this commit: the cited control is present and no residual was reproduced.
- User / business impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Security / privacy / reliability impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Recommended fix: No action; keep the regression coverage cited in the note.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `INV-P3-001` at `6b7aa1a5`.
- Owner suggestion: repo maintainer (audit tooling)
- Effort estimate: S
- Dependencies: none identified beyond the cited module.
- Status: verified-fixed
- Endpoint / data path: see evidence
- Attack path: none identified (control verified).

### Finding ID: INV-P3-002 - Stale, machine-specific repo path in the agent reference

- Severity: P3
- Confidence: High
- Area: INV
- Evidence:
  - `AGENTS.md`
  - `review.md`
  - `github/workflows/validate.yml`
  - `scripts/sync-review-md.mjs`
  - Symbols / routes: Stale, machine-specific repo path in the agent reference
- What is happening: re-verified at 6b7aa1a5: AGENTS.md:3 names the canonical slug `github.com/MaineCyberTech/mainecybertech`, and the review.md mirror check remains wired in CI (.github/workflows/validate.yml:150+ / scripts/sync-review-md.mjs --check).
- Why it matters: The prior finding is closed at this commit: the cited control is present and no residual was reproduced.
- User / business impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Security / privacy / reliability impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Recommended fix: No action; keep the regression coverage cited in the note.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `INV-P3-002` at `6b7aa1a5`.
- Owner suggestion: repo maintainer (AI readiness)
- Effort estimate: S
- Dependencies: none identified beyond the cited module.
- Status: verified-fixed
- Endpoint / data path: see evidence
- Attack path: none identified (control verified).

### Finding ID: INV-P3-003 - Committed build artifact apps/web/public/version.json is stale and unguarded

- Severity: P3
- Confidence: High
- Area: INV
- Evidence:
  - `apps/web/public/version.json`
  - Symbols / routes: Committed build artifact apps/web/public/version.json is stale and unguarded
- What is happening: re-verified at 6b7aa1a5: apps/web/public/version.json is absent from the tree and is gitignored at .gitignore:76; the file is generated by apps/web/scripts/generate-version.js before dev/build.
- Why it matters: The prior finding is closed at this commit: the cited control is present and no residual was reproduced.
- User / business impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Security / privacy / reliability impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Recommended fix: No action; keep the regression coverage cited in the note.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `INV-P3-003` at `6b7aa1a5`.
- Owner suggestion: web platform
- Effort estimate: S
- Dependencies: none identified beyond the cited module.
- Status: verified-fixed
- Endpoint / data path: see evidence
- Attack path: none identified (control verified).

### Finding ID: INV-P3-004 - Vestigial Vercel deploy configs remain after the DigitalOcean migration

- Severity: P3
- Confidence: High
- Area: INV
- Evidence:
  - Prior-run report and current code inspection (see verification note).
  - Symbols / routes: Vestigial Vercel deploy configs remain after the DigitalOcean migration
- What is happening: re-verified at 6b7aa1a5: `git ls-files | grep -E 'vercel|version\.json|snippets'` returns no tracked paths; the Vercel configs were removed after the DigitalOcean migration.
- Why it matters: The prior finding is closed at this commit: the cited control is present and no residual was reproduced.
- User / business impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Security / privacy / reliability impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Recommended fix: No action; keep the regression coverage cited in the note.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `INV-P3-004` at `6b7aa1a5`.
- Owner suggestion: platform/infrastructure
- Effort estimate: S
- Dependencies: none identified beyond the cited module.
- Status: verified-fixed
- Endpoint / data path: see evidence
- Attack path: none identified (control verified).

### Finding ID: INV-P3-005 - Previous-run audit artifacts are amended in place without rebinding to the commit they now reflect

- Severity: P3
- Confidence: High
- Area: INV
- Evidence:
  - `docs/audits/README.md`
  - `RECONCILIATION_2026-10-12.md`
  - Symbols / routes: Previous-run audit artifacts are amended in place without rebinding to the commit they now reflect
- What is happening: re-verified at 6b7aa1a5: docs/audits/README.md:65-71 retains the 'Bind every reconciliation' rule (dated RECONCILIATION file recording amendment date, develop commit/PR range, and manifest binding), and both amended published runs still carry RECONCILIATION_2026-10-12.md.
- Why it matters: The prior finding is closed at this commit: the cited control is present and no residual was reproduced.
- User / business impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Security / privacy / reliability impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Recommended fix: No action; keep the regression coverage cited in the note.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `INV-P3-005` at `6b7aa1a5`.
- Owner suggestion: repo maintainer (audit tooling)
- Effort estimate: S
- Dependencies: none identified beyond the cited module.
- Status: verified-fixed
- Endpoint / data path: see evidence
- Attack path: none identified (control verified).

### Finding ID: INV-P3-006 - Committed Supabase Studio scratch snippet duplicates a dev seed

- Severity: P3
- Confidence: High
- Area: INV
- Evidence:
  - Prior-run report and current code inspection (see verification note).
  - Symbols / routes: Committed Supabase Studio scratch snippet duplicates a dev seed
- What is happening: re-verified at 6b7aa1a5: supabase/snippets/ does not exist in the tree; the committed Studio scratch snippet was removed.
- Why it matters: The prior finding is closed at this commit: the cited control is present and no residual was reproduced.
- User / business impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Security / privacy / reliability impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Recommended fix: No action; keep the regression coverage cited in the note.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `INV-P3-006` at `6b7aa1a5`.
- Owner suggestion: backend/DB lead
- Effort estimate: S
- Dependencies: none identified beyond the cited module.
- Status: verified-fixed
- Endpoint / data path: see evidence
- Attack path: none identified (control verified).

### Finding ID: INV-P3-007 - Service worker asset apps/web/public/sw.js is not registered anywhere

- Severity: P3
- Confidence: High
- Area: INV
- Evidence:
  - `apps/web/components/ServiceWorkerRegistrar.ts`
  - `next.config.mjs`
  - Symbols / routes: Service worker asset apps/web/public/sw.js is not registered anywhere
- What is happening: re-verified at 6b7aa1a5: apps/web/components/ServiceWorkerRegistrar.tsx:22-24 registers /sw.js with scope '/' (production only), and next.config.mjs serves its headers.
- Why it matters: The prior finding is closed at this commit: the cited control is present and no residual was reproduced.
- User / business impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Security / privacy / reliability impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Recommended fix: No action; keep the regression coverage cited in the note.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `INV-P3-007` at `6b7aa1a5`.
- Owner suggestion: web platform
- Effort estimate: S
- Dependencies: none identified beyond the cited module.
- Status: verified-fixed
- Endpoint / data path: see evidence
- Attack path: none identified (control verified).

### Finding ID: INV-P1-001 - Two migrations share numeric version 5302463, failing the repository preflight check and risking a skipped migration

- Severity: P1
- Confidence: Medium
- Area: INV
- Evidence:
  - `supabase/migrations/5302463_client_portal_ai_and_visibility.sql`
  - `supabase/migrations/5302463_fix_notification_key_dedup_index.sql`
  - `scripts/preflight-check.sh`
  - `.github/workflows/supabase-migrations.yml`
  - Symbols / routes: Two migrations share numeric version 5302463, failing the repository preflight check and risking a skipped migration
- What is happening: NEW at 6b7aa1a5: supabase/migrations/5302463_client_portal_ai_and_visibility.sql and supabase/migrations/5302463_fix_notification_key_dedup_index.sql share the version prefix 5302463. scripts/preflight-check.sh:50-51 derives versions with `cut -d_ -f1 | sort | uniq -d` and asserts 'No duplicate migration timestamps'; running that expression at this commit prints 5302463 and fails. .github/workflows/supabase-migrations.yml:71-90 applies migrations with `supabase db push --include-all`, which keys migrations by that version, so at least one of the pair can be skipped (or the push can fail) on a fresh environment.
- Why it matters: This is a new issue at this commit; the verification note gives the exact code path and reachability.
- User / business impact: A serious authorization, confidentiality or release-integrity issue that should be fixed before broad rollout.
- Security / privacy / reliability impact: A serious authorization, confidentiality or release-integrity issue that should be fixed before broad rollout.
- Recommended fix: Rename one migration to an unused version (e.g. 5302464_fix_notification_key_dedup_index.sql), keep its contents, add a CI duplicate-version check (the preflight expression), and verify `supabase db push --dry-run` lists both migrations.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `INV-P1-001` at `6b7aa1a5`.
- Owner suggestion: data platform / DB lead
- Effort estimate: M
- Dependencies: none identified beyond the cited module.
- Status: open
- Endpoint / data path: supabase db push (migration 5302463 pair)
- Attack path: Deploy pipeline -> `supabase db push --include-all` sees two migrations with version 5302463 -> one is skipped (or the push fails), so the visibility/notification migration is missing from the environment.

## Risks

| Risk | Severity | Likelihood | Impact | Evidence | Mitigation |
|---|---|---|---|---|---|
| One of the 5302463 migrations is skipped or the push fails | P1 | Medium | High | duplicate version | Rename and gate |
| OpenAPI YAML drifts from spec.ts | P2 | Medium | Medium | no regenerate gate | Add CI diff |

## Recommendations

### Immediate / Release Blocking

- Rename one of the two 5302463 migrations and run scripts/preflight-check.sh to green.

### This Week

- Add a CI duplicate-version check (preflight is manual today).
- Add OpenAPI regenerate + git diff --exit-code.

### This Month

- Keep prompts pinned; archive audit runs per budget.

### Later / Platform Evolution

- No action on verified inventory rows.

## Quick Wins

| Quick win | Why it helps | Files likely involved | Validation |
|---|---|---|---|
| Rename 5302463_fix_notification_key_dedup_index.sql to 5302464_... | Removes collision and preflight failure | supabase/migrations/ | scripts/preflight-check.sh |
| Run `bash scripts/preflight-check.sh` in CI | Catches duplicate versions early | .github/workflows/ | preflight output |

## Hardening Backlog

| Backlog item | Priority | Owner suggestion | Effort | Dependency |
|---|---|---|---|---|
| INV-P2-001: Committed generated artifacts drift without a gate | P2 | repo maintainer / platform CI owner | M | none |
| INV-P1-001: Two migrations share numeric version 5302463, failing the repository preflight check and risking a skipped migration | P1 | data platform / DB lead | M | none |

## Suggested Tests

- Read supabase/migrations filenames and assert unique version prefixes.
- Run `bash scripts/preflight-check.sh` in CI.
- Regenerate OpenAPI and fail on diff.

## Suggested Documentation Updates

- Add a migrations-naming note to docs/CONTRIBUTING or the migration runbook; document the OpenAPI regeneration gate.

## Open Questions

| Question | Why it matters | Evidence needed |
|---|---|---|
| Which 5302463 migration has already been applied to deployed environments? | Determines the safe rename | Read supabase_migrations.schema_migrations |
| Is `supabase db push` the only deploy path? | Impact of duplicate version | Workflow evidence |

## Appendix

- Prior run: `mainecybertech-20261014-0033-full-main-7dd0402` (findings re-verified by area).
- Worktree: `/tmp/opencode/mct-nov-g1` at `origin/main` (6b7aa1a5505d4f75b334b36e9e87737cd98e589c).
- Commands: `git diff --stat 7dd0402..6b7aa1a5`, `git diff --name-only`, targeted `rg`/`sed` over the cited paths.
- Counts: 10 findings; 8 verified-fixed, 1 partially-fixed, 1 open, 0 regressed, 1 new.
- Execution limitation: application dependencies were not installed in the read-only worktree; runtime tests and database migrations were **not run** (marked not reproducible in this environment).

