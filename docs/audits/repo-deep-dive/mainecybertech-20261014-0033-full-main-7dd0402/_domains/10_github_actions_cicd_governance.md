# GitHub Actions, CI/CD, and Governance Audit (re-audit)

- Run: `mainecybertech-20261014-0033-full-main-7dd0402`
- Target: `mainecybertech` @ `7dd0402` (branch `main`, promoted 2026-10-13)
- Area code: CI · Previous full run: `mainecybertech-20261011-0426-full-main-8d299b8`; fast re-check: `mainecybertech-20261013-0126-fast-develop-905ed63`
- Scope: `.github/workflows` (30), `.github/actions` (8 composites), `.github/branch-protection`, CODEOWNERS, dependabot, docs/CI.md, docs/RELEASING.md, release/deploy/migration workflows. Repo read-only; live GitHub state read-only via the public API (the repo is public).

## Executive Summary

The workflow estate is materially hardened and the two fast-run regressions are resolved: `main` now contains all of `develop` (scheduled jobs can fire; CI-P3-004), `backup-dispatch.yml` is gone from main (CI-P2-010), and the dispatch-input injection surface is closed (CI-P3-013). All 25 previous CI rows plus the fast-run addition were re-checked: **19 verified-fixed, 5 partially-fixed, 2 still-open (operator-gated prod environment), 0 regressed**, plus **3 new findings**.

Two new findings are live-verified failures on the current main:
- **CI-P1-004** — publishing the fast-mode audit run left it out of `docs/audits/README.md` and without `HISTORICAL.md`, so `scripts/check-docs-links.mjs` exits 1 on any tree containing it. That script runs in the required `Test / test (20.x)` job and the deploy gate; live evidence: the publishing PR #279 itself failed the Test check (run 38334811453) and the 7dd0402 deploy run was queued with a doomed validate gate.
- **CI-P2-011** — `release.yml` fails on every promotion at the notes step with exit 141 (SIGPIPE from `git log | head -100` under `pipefail`); origin has 0 tags and 0 releases, so the post-merge release artifact and SBOM attachment are still absent (CI-P3-008 remains partially-fixed).

The third new finding (CI-P3-014) is documentation staleness: the webpack 5.101.2 pin fixed the Storybook build (post-pin run passed "Build Storybook"), but docs/CI.md and the chromatic.yml comments still describe the break as current.

## Verification Performed

| Evidence | Type | Why relevant | Result |
|---|---|---|---|
| `scripts/check-required-checks.mjs` (executed) | Guard | Required contexts resolve; no path-filtered required workflow | **PASS** (8 main / 6 develop) |
| `scripts/check-docs-links.mjs` (executed) | Guard | Docs/CI table + audit-run index + markers | **FAIL** — fast-run dir unindexed and unmarked (CI-P1-004) |
| `scripts/check-env-parity.mjs`, `actions-inventory.mjs --check`, `check-codeowners.sh`, `check-branch-protection-audit.sh`, `check-required-checks.sh`, `check-migration-transactions.sh`, `check-circular-deps.mjs` (executed) | Guards | Adjacent CI gates | all **PASS** |
| `.github/workflows/*` inventory (30 workflows: triggers, permissions, jobs, timeouts, environments) | Config | Gate/permission/timeout claims | verified |
| Live GitHub API (public repo): runs/jobs for 7dd0402 + the publish PR, tags, releases | CI state | Exercise evidence | Release failed (141); Test failed on the publish PR; 0 tags / 0 releases |
| `docs/CI.md` File column vs `.github/workflows` (replicated) | Cross-check | Workflow documentation drift | exact match |
| `docs/GITHUB_SECRETS_AND_VARIABLES_MATRIX.md`, `docs/RELEASING.md` | Docs | Operator-gated prod gaps | still open |

## Findings

| ID | Sev | Title | Status | Evidence (at 7dd0402) |
|---|---|---|---|---|
| CI-P1-001 | P1 | Production deploys have no working manual-approval gate | still-open | code attaches `prod-approval` (deploy-do.yml:648, supabase-migrations.yml:38, terraform-do.yml:204, load-test.yml:61); docs: no reviewers configured (matrix:12-14, RELEASING.md:128-133) |
| CI-P1-002 | P1 | Branch-protection mismatch / admin bypass | verified-fixed | guard PASS; `enforce_admins:true` + owner reviews committed |
| CI-P1-003 | P1 | Prod deploy path cannot run (secrets) | still-open | matrix:187-220; RELEASING.md:170-182 |
| **CI-P1-004** | **P1** | **NEW: fast-run publish fails the docs-links gate (required check + deploy gate)** | **open** | `check-docs-links.mjs` exit 1 (unindexed dir + no HISTORICAL.md); publish PR #279 Test run 38334811453 failed in unit-tests; deploy run 38490822901 queued |
| CI-P2-001 | P2 | World-open DO firewall workflow | verified-fixed | none exists; terraform-do rejects world-open allowlists |
| CI-P2-002 | P2 | Secret scan no-op on main pushes | verified-fixed | before-SHA logic (secret-scan action:15-28) |
| CI-P2-003 | P2 | Prod approval env docs | verified-fixed | docs truthful; tracked by CI-P1-001/003 |
| CI-P2-004 | P2 | DB restore test asserts nothing | verified-fixed | db-restore-test.yml:196-330 floors |
| CI-P2-005 | P2 | Infra changes not gated in CI | partially-fixed | manual-dispatch only; drift plan dormant until `TF_DRIFT_PLAN_ENABLED` (:40) |
| CI-P2-006 | P2 | Chromatic permanently non-blocking | verified-fixed | no continue-on-error; post-pin build step passes (run 38481042052); not required |
| CI-P2-007 | P2 | Admin bypass / CODEOWNERS ignored | verified-fixed | both payloads enforce admins + owner reviews (but see BP-P1-004 live drift) |
| CI-P2-008 | P2 | Terraform apply manual; drift not automated | partially-fixed | weekly plan-only drift check dormant (:14-15, :160-172) |
| CI-P2-009 | P2 | E2E required but path-filtered | verified-fixed | e2e.yml:19-23 no paths; guard enforces |
| CI-P2-010 | P2 | Backup dispatcher duplicates | verified-fixed | dispatcher removed from main; token retired |
| **CI-P2-011** | **P2** | **NEW: release.yml fails on every promotion (exit 141) — no tag/release/SBOM** | **open** | live run 38490822732 failed step 6; `git log … \| head -100` under pipefail; 0 tags / 0 releases |
| CI-P3-001 | P3 | actionlint/shellcheck lint | partially-fixed | shellcheck gate wired; actionlint config-only |
| CI-P3-002 | P3 | Over-broad permissions | verified-fixed | no `actions: write`; least privilege |
| CI-P3-003 | P3 | `StrictHostKeyChecking=no` | verified-fixed | deploy-do.yml:1128-1141 pinned known_hosts |
| CI-P3-004 | P3 | `main` behind `develop` | verified-fixed | main contains develop; crons can fire |
| CI-P3-005 | P3 | Scanner misses platform token formats | partially-fixed | dop_v1_/sbp_/glpat_/sk-proj-/npm_ still absent |
| CI-P3-006 | P3 | Unused permission grants | verified-fixed | minimal and consumed |
| CI-P3-007 | P3 | Unpinned postgres in restore test | verified-fixed | db-restore-test.yml:177 |
| CI-P3-008 | P3 | No release/tagging workflow/artifact | partially-fixed | workflow exists but fails every run (CI-P2-011); 0 tags/releases |
| CI-P3-009 | P3 | E2E flakiness vs hard gate | verified-fixed | CI.md:196-211 policy + flake summary |
| CI-P3-010 | P3 | Missing job timeouts | verified-fixed | all jobs have timeouts |
| CI-P3-011 | P3 | Workflow docs drift | verified-fixed | docs/CI.md table exact match |
| CI-P3-012 | P3 | Badge stub | verified-fixed | stubs removed; real reports documented |
| CI-P3-013 | P3 | Dispatch inputs in `run:` | verified-fixed | env indirection (07e9ce09, in main) |
| **CI-P3-014** | **P3** | **NEW: Storybook pin landed but docs/comments still say build broken** | **open** | post-pin build step passes (run 38481042052); docs/CI.md:149-157 + chromatic.yml:28-43 stale |

## New Findings Detail

### CI-P1-004 — Published fast-mode run breaks the docs-links gate (P1, open)

- **Evidence**: `docs/audits/repo-deep-dive/mainecybertech-20261013-0126-fast-develop-905ed63/audit_manifest.json` exists but is absent from `docs/audits/README.md` (newest row :95 = 20261011 run) and has no `HISTORICAL.md`; `scripts/check-docs-links.mjs:128-153` / `:155-177` exit 1 (reproduced locally). Live: PR #279 (`docs/publish-reaudit` @ `62a09bac`, base `main`) failed the required Test check (run `38334811453`, step "Run ./.github/actions/unit-tests", 02:00:21→02:03:02Z) and was merged at 02:00:23Z; the 7dd0402 `deploy-do` run `38490822901` was still queued with a validate gate that will fail.
- **Fix**: add the run row to `docs/audits/README.md` and copy a `HISTORICAL.md` marker into the run directory.
- **Validation**: `node scripts/check-docs-links.mjs` → exit 0.

### CI-P2-011 — release.yml fails with SIGPIPE on every promotion (P2, open)

- **Evidence**: live run `38490822732` (Release on `main` @ 7dd0402) failed step 6 "Generate the release notes body"; check-run annotation `Process completed with exit code 141`. With no tags, `release.yml:100-104` takes `git log … HEAD | head -100` under `set -euo pipefail`; `head` closes the pipe and `git log` dies with SIGPIPE (141). Origin has 0 tags and 0 releases.
- **Fix**: use `git log -n 100 …` (no pipe), or exempt that pipeline from `pipefail`, or `|| true`; then re-run Release for 7dd0402.
- **Validation**: Release run green; `git ls-remote --tags` shows `v0.1.0-<date>-7dd0402`.

### CI-P3-014 — Stale Storybook/Chromatic state (P3, open)

- **Evidence**: pre-pin main run `38334758801` failed at step 6 "Build Storybook"; post-pin run `38481042052` (head contains the pin) passed step 6 and failed only at the Chromatic step. docs/CI.md:149-157 and chromatic.yml:28-43 still describe the build break as current.
- **Fix**: update both to the measured state; keep `continue-on-error` off; decide whether Chromatic can now be promoted to a required check (repo admin).

## Recommendations

- **Immediate (this week)**: fix CI-P1-004 (docs index row + HISTORICAL.md) and CI-P2-011 (release notes pipeline) — both are one-line/two-file fixes with live-red runs. Operator: configure `prod-approval` reviewers and prod secrets (CI-P1-001/003); run the branch-protection drift audit (BP-P1-004).
- **This month**: enable `TF_DRIFT_PLAN_ENABLED` after rotating `DO_API_TOKEN` (CI-P2-005/008); add platform token formats to the diff scanner (CI-P3-005); re-run Release for 7dd0402 to deliver the first tag/release/SBOM.
- **This quarter**: wire an actionlint CI job (CI-P3-001); reconcile Chromatic docs and consider promoting the check (CI-P3-014).

## Open Questions

| Question | Why it matters | Evidence needed |
|---|---|---|
| Are the committed branch-protection payloads applied to live GitHub? | PR #279 merged with checks pending + 0 reviews (BP-P1-004) | drift audit with an admin token |
| Why did the Chromatic step fail after a successful build? | Distinguishes real visual diffs from config/token errors | Chromatic run logs (needs auth) |
| Will the queued deploy run for 7dd0402 fail at validate? | Confirms CI-P1-004 blast radius on prod | deploy run 38490822901 conclusion |
