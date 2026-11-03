# Audit Orchestrator

## Audit Metadata

- Audit name: repo-deep-dive (mainecybertech)
- Run: `mainecybertech-20261103-0748-full-main-6b7aa1a`
- Repository: `github.com/MaineCyberTech/mainecybertech`
- Branch: `main`
- Commit SHA: `6b7aa1a5505d4f75b334b36e9e87737cd98e589c`
- Generated at: 2026-11-03
- Auditor: OpenCode subagent (read-only)
- Area code: ORCH
- Output path: `docs/audits/repo-deep-dive/mainecybertech-20261103-0748-full-main-6b7aa1a/00_audit_orchestrator.md`
- Scope limitations: repository-only verification; no production database or GitHub environment secrets were read. Prior-run claims were re-checked against this commit, not assumed.

## Scope

Re-verified the three prior ORCH findings against the Nov 3 promoted state, then checked the run contract, manifests, reconciliation notes and finding-identity artifacts that this run depends on. No application code was modified.

## Evidence Reviewed

| Evidence | Type | Why relevant | Notes |
|---|---|---|---|
| `docs/audits/README.md` | contract | run contract and index | Read at 6b7aa1a5 |
| `9c0b88c/audit_manifest.json` | manifest | 43-domain claim | Read at 6b7aa1a5 |
| `9c0b88c/ directory` | inventory | one lens report, no _domains | Read at 6b7aa1a5 |
| `DUPLICATE_AND_ID_MAP.md` | identity | canonical ID policy | Read at 6b7aa1a5 |

## Verification Performed

| Evidence / claim | Method | Result |
|---|---|---|
| All 3 prior ORCH findings | Read the cited symbols/routes at `6b7aa1a5` | 1 verified-fixed, 2 partially-fixed, 0 open, 0 regressed |
| Nov 3 diff (`7dd0402..6b7aa1a5`) | `git diff --stat` plus targeted review of area files | 137 commits / 414 files changed overall; only area-relevant files were read line-by-line |
| New ORCH issues | Attack-path/static review of changed routes and migrations | 0 new findings |
| Build/CI claims | File inspection only (dependencies not installed in the read-only worktree) | Marked `not run` where execution was impossible |

## Executive Summary

The audit pack's run contract is materially improved: the Runs table now lists every published repo-deep-dive run and the contract/status vocabulary is documented. Two residuals remain: the 2026-10-04 published run still advertises 43 domains while shipping one lens report, and finding identity is still carried by a per-run document rather than a pack-level mechanism. No new orchestrator issues were found at this commit.

Counts: **3** findings total - 1 verified-fixed, 2 partially-fixed, 0 open (all new), 0 regressed, **0 new**. Severity: P0 0, P1 1, P2 1, P3 1.

## Inventory

| Item | Path / symbol | Purpose | Current state | Risk | Notes |
|---|---|---|---|---|---|
| Run contract | docs/audits/README.md:30-73 | required finals + status vocabulary | current | Low |  |
| Runs table | docs/audits/README.md:110-116 | index of published runs | current | Low |  |
| 9c0b88c manifest | .../audit_manifest.json | domain metadata | stale relative to files | P1 | ORCH-P1-001 |
| 9c0b88c inventory | .../9c0b88c/ | published reports | one lens report only | P1 | ORCH-P1-001 |
| Identity policy | DUPLICATE_AND_ID_MAP.md:77 | cross-run IDs | per-run document | P3 | ORCH-P3-001 |

## Domain Scorecard

| Category | Score | Evidence | Gap | Recommended action |
|---|---:|---|---|---|
| Run contract | 4 | `docs/audits/README.md:30-73` | Contract complete; one legacy run not rebuilt | Keep historical marker; no action |
| Published artifact consistency | 2 | `9c0b88c manifest vs directory` | 43 domains advertised, one lens report | Republish or scope the manifest |
| Finding identity | 2 | `DUPLICATE_AND_ID_MAP.md:77` | Per-run only | Add pack-level carry-forward |
| Operator handoff | 3 | `README.md + AGENTS.md` | Usable, with historical caveats | No action |

## Detailed Review

### Item: Run contract

- Evidence: `docs/audits/README.md:30-73`
- What it does: Run contract control/implementation.
- Current controls: score 4/5 at this commit.
- Missing controls / gap: Contract complete; one legacy run not rebuilt.
- Recommended improvement: Keep historical marker; no action.

### Item: Published artifact consistency

- Evidence: `9c0b88c manifest vs directory`
- What it does: Published artifact consistency control/implementation.
- Current controls: score 2/5 at this commit.
- Missing controls / gap: 43 domains advertised, one lens report.
- Recommended improvement: Republish or scope the manifest.

### Item: Finding identity

- Evidence: `DUPLICATE_AND_ID_MAP.md:77`
- What it does: Finding identity control/implementation.
- Current controls: score 2/5 at this commit.
- Missing controls / gap: Per-run only.
- Recommended improvement: Add pack-level carry-forward.

### Item: Operator handoff

- Evidence: `README.md + AGENTS.md`
- What it does: Operator handoff control/implementation.
- Current controls: score 3/5 at this commit.
- Missing controls / gap: Usable, with historical caveats.
- Recommended improvement: No action.

## Scenario / Control Matrix

| ID | Scenario or control | Evidence | Current control | Gap | Severity | Recommendation |
|---|---|---|---|---|---|---|
| ORCH-001 | Run contract | `docs/audits/README.md:30-73` | score 4/5 | Contract complete; one legacy run not rebuilt | P3 | Keep historical marker; no action |
| ORCH-002 | Published artifact consistency | `9c0b88c manifest vs directory` | score 2/5 | 43 domains advertised, one lens report | P2 | Republish or scope the manifest |
| ORCH-003 | Finding identity | `DUPLICATE_AND_ID_MAP.md:77` | score 2/5 | Per-run only | P2 | Add pack-level carry-forward |
| ORCH-004 | Operator handoff | `README.md + AGENTS.md` | score 3/5 | Usable, with historical caveats | P3 | No action |

## Findings

### Finding ID: ORCH-P1-001 - Published main audit run is internally inconsistent (report/register ID divergence; full-domain metadata over a one-report inventory)

- Severity: P1
- Confidence: High
- Area: ORCH
- Evidence:
  - `RECONCILIATION_2026-10-12.md`
  - `HISTORICAL.md`
  - `findings.json`
  - `docs/audits/repo-deep-dive/mainecybertech-20261004-full-main-9c0b88c/audit_manifest.json`
  - `lens_focused_security_supply_chain_ci.md`
  - Symbols / routes: Published main audit run is internally inconsistent (report/register ID divergence; full-domain metadata over a one-report inventory)
- What is happening: re-verified at 6b7aa1a5: both amended published runs still carry RECONCILIATION_2026-10-12.md plus HISTORICAL.md, and the 9c0b88c register remains 1:1 with findings.json (336 findings). Residual unchanged: docs/audits/repo-deep-dive/mainecybertech-20261004-full-main-9c0b88c/audit_manifest.json advertises 43 domains, but that directory contains only one lens report (lens_focused_security_supply_chain_ci.md), no _domains/ directory and no NN_*.md reports, so the 'full-domain metadata over a one-report inventory' half is still not republished.
- Why it matters: Part of the prior fix is present, but the residual described in the verification note is still reproducible.
- User / business impact: A serious authorization, confidentiality or release-integrity issue that should be fixed before broad rollout.
- Security / privacy / reliability impact: A serious authorization, confidentiality or release-integrity issue that should be fixed before broad rollout.
- Recommended fix: Close the residual described in the verification note and add a regression test that fails on the prior behavior.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `ORCH-P1-001` at `6b7aa1a5`.
- Owner suggestion: platform engineering / audit owner
- Effort estimate: M
- Dependencies: none identified beyond the cited module.
- Status: partially-fixed
- Endpoint / data path: see evidence
- Attack path: none identified beyond the documented control gap.

### Finding ID: ORCH-P2-001 - docs/audits/README.md documents a run contract that contradicts the pack and the actual runs, and its Runs table omits all three repo-deep-dive runs

- Severity: P2
- Confidence: High
- Area: ORCH
- Evidence:
  - `docs/audits/README.md`
  - `README.md`
  - Symbols / routes: docs/audits/README.md documents a run contract that contradicts the pack and the actual runs, and its Runs table omits all three repo-deep-dive runs
- What is happening: re-verified at 6b7aa1a5: docs/audits/README.md:30-73 documents the canonical run contract (required finals, status vocabulary, reconciliation binding) and the Runs table at README.md:110-116 now lists the 905ed63 fast run, the 7dd0402 full run marked (latest), and the 2026-10-21 portal-modules run. The prior omission is closed at this commit.
- Why it matters: The prior finding is closed at this commit: the cited control is present and no residual was reproduced.
- User / business impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Security / privacy / reliability impact: None at this commit (historical finding; retained so later runs do not re-raise it).
- Recommended fix: No action; keep the regression coverage cited in the note.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `ORCH-P2-001` at `6b7aa1a5`.
- Owner suggestion: platform engineering / docs owner
- Effort estimate: M
- Dependencies: none identified beyond the cited module.
- Status: verified-fixed
- Endpoint / data path: see evidence
- Attack path: none identified (control verified).

### Finding ID: ORCH-P3-001 - Finding identity is not stable across runs (deterministic IDs reused; legacy area codes persist), so verification status does not carry

- Severity: P3
- Confidence: High
- Area: ORCH
- Evidence:
  - `docs/audits/repo-deep-dive/mainecybertech-20261011-0426-full-main-8d299b8/DUPLICATE_AND_ID_MAP.md`
  - Symbols / routes: Finding identity is not stable across runs (deterministic IDs reused; legacy area codes persist), so verification status does not carry
- What is happening: re-verified at 6b7aa1a5: docs/audits/repo-deep-dive/mainecybertech-20261011-0426-full-main-8d299b8/DUPLICATE_AND_ID_MAP.md:77 documents the canonical-ID+title identity policy and the alias merge map, but the policy still exists only inside that one run; there is no pack-level or repository-level carry-forward mechanism, so identity remains a per-run document.
- Why it matters: Part of the prior fix is present, but the residual described in the verification note is still reproducible.
- User / business impact: A low-risk cleanup, consistency or documentation gap.
- Security / privacy / reliability impact: A low-risk cleanup, consistency or documentation gap.
- Recommended fix: Close the residual described in the verification note and add a regression test that fails on the prior behavior.
- Suggested validation: see the Suggested Tests section; the test must exercise the endpoint/control named in `ORCH-P3-001` at `6b7aa1a5`.
- Owner suggestion: audit tooling owner (repo-deep-dive pack)
- Effort estimate: S
- Dependencies: none identified beyond the cited module.
- Status: partially-fixed
- Endpoint / data path: see evidence
- Attack path: none identified beyond the documented control gap.

## Risks

| Risk | Severity | Likelihood | Impact | Evidence | Mitigation |
|---|---|---|---|---|---|
| Downstream consumers cite a 43-domain run that has one report | P1 | Medium | High | 9c0b88c manifest | Republish or annotate |
| Re-audit status does not carry automatically | P3 | High | Medium | per-run map | Pack-level carry-forward |

## Recommendations

### Immediate / Release Blocking

- None beyond the P1 findings listed above.

### This Week

- Republish/annotate 9c0b88c with an explicit domain inventory.

### This Month

- Add pack-level finding identity carry-forward.

### Later / Platform Evolution

- Keep historical markers.

## Quick Wins

| Quick win | Why it helps | Files likely involved | Validation |
|---|---|---|---|
| Annotate 9c0b88c INDEX with the actual report count | Stops over-claiming | 9c0b88c/INDEX.md | Open INDEX and compare |

## Hardening Backlog

| Backlog item | Priority | Owner suggestion | Effort | Dependency |
|---|---|---|---|---|
| ORCH-P1-001: Published main audit run is internally inconsistent (report/register ID divergence; full-domain metadata over a one-report inventory) | P1 | platform engineering / audit owner | M | none |
| ORCH-P3-001: Finding identity is not stable across runs (deterministic IDs reused; legacy area codes persist), so verification status does not carry | P3 | audit tooling owner (repo-deep-dive pack) | S | none |

## Suggested Tests

- CI check that audit_manifest.domain count <= number of domain reports (or manifest lists a scope note).
- Link/ID check across runs for canonical finding IDs.

## Suggested Documentation Updates

- docs/audits/README.md: add an explicit 'manifest may describe planned domains; inventory is authoritative' note.

## Open Questions

| Question | Why it matters | Evidence needed |
|---|---|---|
| Should 9c0b88c be republished or marked scoped? | It drives the P1 | Owner decision / PR |
| Where should the pack-level identity map live? | Carry-forward | Pack design |

## Appendix

- Prior run: `mainecybertech-20261014-0033-full-main-7dd0402` (findings re-verified by area).
- Worktree: `/tmp/opencode/mct-nov-g1` at `origin/main` (6b7aa1a5505d4f75b334b36e9e87737cd98e589c).
- Commands: `git diff --stat 7dd0402..6b7aa1a5`, `git diff --name-only`, targeted `rg`/`sed` over the cited paths.
- Counts: 3 findings; 1 verified-fixed, 2 partially-fixed, 0 open, 0 regressed, 0 new.
- Execution limitation: application dependencies were not installed in the read-only worktree; runtime tests and database migrations were **not run** (marked not reproducible in this environment).

