# Documentation, Developer Experience, and Operator Readiness Audit (Re-verification)

## Audit Metadata

- Audit name: mainecybertech
- Run: `mainecybertech-20261014-0033-full-main-7dd0402`
- Repository: `github.com/MaineCyberTech/mainecybertech`
- Branch: `main`
- Commit SHA: `7dd040234e8dfa40dd2d2b6fe1ca7379f2fba097`
- Generated at: 2026-10-14
- Auditor: subagent (independent re-audit; read-only)
- Area code: DOC
- Output path: `docs/audits/mainecybertech/mainecybertech-20261014-0033-full-main-7dd0402/16_documentation_devex_operator_readiness.md`
- Scope limitations: repository-only; guards were executed locally where dependency-free (`check-docs-links`, `check-docs-counts`, `check-required-checks`, `check-env-parity`, `openapi-audit`, `check-historical-gates`, migration-transaction guard), but CI itself was not re-run.

## Scope

Re-verification of the 17 `DOC` findings from `mainecybertech-20261011-0426-full-main-8d299b8` against `origin/main` @ `7dd0402`, plus a literal walk of the doc guards and the audit-corpus index.

## Executive Summary

14 of 17 findings are **verified-fixed**: the deployment handbook/rollback/CI/SBOM/secret-matrix/GAP_ANALYSIS/migration-guide/MONITORING/TROUBLESHOOTING/audits-index/migration-naming docs were all reconciled against the code, the count guard now covers README/ONBOARDING/endpoint-inventory prose and passes, and every dated audit run carries a `HISTORICAL.md` marker (except the newest one — see below).

Three findings remain **partially-fixed** (`DOC-P2-004` breach gap list, `DOC-P3-002` AGENTS.md worker section, `DOC-P3-007` three unlisted scripts).

Two new issues were found, one of them operationally significant:
- **`DOC-P2-009` (new, P2):** `docs/audits/README.md` omits the committed `mainecybertech-20261013-0126-fast-develop-905ed63` run. The `check-docs-links.mjs` guard exits 1 on this and runs inside the required **Test / test (20.x)** check — so every PR into `main`/`develop` is red at this commit until the index (and the run's missing `HISTORICAL.md`) is fixed.
- **`DOC-P3-010` (new, P3):** `docs/CI.md` and `chromatic.yml` still describe the webpack 5.101.2 pin as pending work, but the pin is already applied in `package.json`/`pnpm-lock.yaml`.

| Status | Count |
|---|---:|
| verified-fixed | 14 |
| partially-fixed | 3 (`DOC-P2-004`, `DOC-P3-002`, `DOC-P3-007`) |
| regressed | 0 |
| open (previous) | 0 |
| new | 2 (`DOC-P2-009`, `DOC-P3-010`) |

## Verification Results

| ID | Sev | Re-verified status | Evidence at 7dd0402 |
|---|---|---|---|
| DOC-P2-001 | P2 | verified-fixed | handbook now matches queue semantics, manual terraform, 13 vars, firewall (no 2376), printf env delivery |
| DOC-P2-002 | P2 | verified-fixed | rollback doc documents manual dispatch; approval-gate wording honest (`ROLLBACK_PROCEDURES.md:236-260,340-353`) |
| DOC-P2-003 | P2 | verified-fixed | SBOM row is "Artifact-only (not a gate)" (`CI.md:31`) |
| DOC-P2-004 | P2 | partially-fixed | alerting wording corrected (`INCIDENT_RESPONSE.md:148-158`); breach gap list still cites closed old-register IDs (`DATA_BREACH_RESPONSE.md:471-475`) |
| DOC-P2-005 | P2 | verified-fixed | `RELEASE_GATE.md` rebound to the 20261011 run and its register |
| DOC-P2-006 | P2 | verified-fixed | ALERTMANAGER_* + NTFY_ALERTS_* added to matrix and rotation inventory |
| DOC-P2-007 | P2 | verified-fixed | GAP_ANALYSIS historical banner + INDEX marker |
| DOC-P2-008 | P2 | verified-fixed | migration guide rewritten; dead commands gone |
| DOC-P3-001 | P3 | verified-fixed | HISTORICAL.md across run dirs; machine-path guard passes; living drill runbooks |
| DOC-P3-002 | P3 | partially-fixed | AGENTS.md:17 names the divergence, but `AGENTS.md:361-363` still says "142 lines"/SQS-based (actual 161 lines, dispatcher) |
| DOC-P3-003 | P3 | verified-fixed | counts 158/30/421 correct; `check-docs-counts.mjs` covers them and prints "docs counts OK" |
| DOC-P3-004 | P3 | verified-fixed | metrics live + fail-closed gate + correct memory table |
| DOC-P3-005 | P3 | verified-fixed | CI_SSH_PRIVATE_KEY, prune order, 512MB web, `mct-portal-*` names |
| DOC-P3-006 | P3 | verified-fixed | contract + 2026100x runs indexed (the newest run is the new `DOC-P2-009`) |
| DOC-P3-007 | P3 | partially-fixed | 52/55 scripts indexed; 3 remain (`bundle-budget.json`, `check-bundle-budget.mjs`, `exercise-storage-restore.sh`) |
| DOC-P3-008 | P3 | verified-fixed | alertmanager row in `AGENTS.md:222` |
| DOC-P3-009 | P3 | verified-fixed | naming guide/workflow both mandate 5302NNN (minor example staleness at `SUPABASE_MIGRATION_WORKFLOW.md:31`) |

## New Findings

### DOC-P2-009 — `docs/audits/README.md` omits the 905ed63 re-audit run; the required Test check's docs-links guard fails (P2)

- Reproduce: `node scripts/check-docs-links.mjs` → exit 1:
  `audit runs missing from docs/audits/README.md (1): docs/audits/repo-deep-dive/mainecybertech-20261013-0126-fast-develop-905ed63`
- Wiring: the guard runs at `.github/actions/unit-tests/action.yml:74`, invoked by `.github/workflows/test.yml:41` — the required `Test / test (20.x)` context in `.github/branch-protection/main.json`. All PRs into `main`/`develop` are red until fixed.
- Two latent follow-on violations for the same run: it has `audit_manifest.json` but no `HISTORICAL.md` (guard check at `scripts/check-docs-links.mjs:156-179`), and `docs/audits/README.md:95` still labels `8d299b8` "(latest)".
- Fix: add the run row to the Runs table, add `HISTORICAL.md`, move the "(latest)" pointer; re-run the guard.

### DOC-P3-010 — Storybook webpack pin is documented as pending but already applied (P3)

- Evidence: `docs/CI.md:146-155` and `.github/workflows/chromatic.yml:30-43` present the `webpack` 5.101.2 pin as a future remediation option that "needs a dedicated PR"; `package.json:84` already sets `"webpack": "5.101.2"` under `pnpm.overrides` and `pnpm-lock.yaml` resolves it for Storybook.
- Impact: maintainers reading the doc cannot tell whether the known build break still exists; the stated next action is already done.
- Fix: update both texts to record the pin as applied and state the build result once verified (the build was not re-run in this audit).

## Recommendations

- **Immediate (DOC-P2-009):** fix the audit index + HISTORICAL.md so the required Test check goes green; consider running `check-docs-links.mjs` in a pre-commit hook.
- **This week:** reconcile the breach-doc gap list with the current register (`DOC-P2-004`); update the AGENTS.md worker section (`DOC-P3-002`).
- **This month:** index the 3 missing scripts (`DOC-P3-007`); refresh the Storybook narrative after verifying the build (`DOC-P3-010`).

## Open Questions

| Question | Why it matters | Evidence needed |
|---|---|---|
| Does the Storybook/Chromatic build pass after the webpack pin? | Determines the correct CI.md/Chromatic narrative | A green Chromatic run at this commit |
| Which register is canonical for the breach doc's gap list? | DOC-P2-004 needs one source of truth | Release-owner decision (current run vs 9c0b88c IDs) |
