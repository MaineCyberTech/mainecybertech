# Reconciliation note — 2026-10-12

This note resolves the internal-contradiction findings raised by this run
(`ORCH-P1-001`, `FINAL-P2-003`, `FINAL-P2-004`) without rewriting the
immutable audit-time artifacts (`findings.json`, domain reports,
`audit_manifest.json`). It is additive and dated; the audit-time artifacts
remain exactly as published.

## Decision axes (`FINAL-P2-004`)

Two verdicts coexist by design and are not a contradiction once the axis is
named:

- **Continued `main`-branch development: GO WITH CONDITIONS.** No unresolved
  P0; the remaining P1s are operator-gated (production secrets/reviewers,
  external watchdog provisioning, exercised rotation) rather than code
  blockers.
- **First production go-live: NO-GO** until the operator conditions in
  `RELEASE_GATE.md` are met and the remaining P1 rows are green or
  owner-accepted.

`RELEASE_GATE.md` records the go-live axis (NO-GO at audit time). The
in-repo `docs/RELEASE_GATE.md` was rebound to the current run and register on
2026-10-12 (mainecybertech#236) and no longer binds a stale commit.

## Register state at reconciliation

- 690 findings: **361 verified-fixed / 109 partially-fixed / 61 still-open /
  159 open** (reconciled 2026-10-12, phases 1–4: PRs #170–#236).
- The run's `findings.json`, `follow_up_register.md` and `risk_register.md`
  are 1:1 consistent for this run (verified by the reconciliation scripts in
  `/tmp/opencode/reconcile-phase*.py`; `tools/check_run.sh` shape retained).

## Report/register ID divergence (`ORCH-P1-001`)

The orchestrator finding refers to the **previously published copy** of the
`20261004-full-main-9c0b88c` run, where the published copy's register and
lens diverged from its 43 domain reports (the canonical pack copy is
consistent: 43 reports, 336 findings, 0 missing register rows, 0 orphans).
This run's published copy is internally consistent: every finding in
`findings.json` maps to exactly one register row in both
`follow_up_register.md` and `risk_register.md`, and the manifest metadata
matches the 43-report inventory (see `coverage.md`).

Residual: re-syncing the older published run's copy from the canonical pack
copy remains outstanding; it is tracked as `ORCH-P1-001` (partially-fixed).

## Roadmap sequencing (`FINAL-P2-003`)

`roadmap.md` now carries a 7/30/60/90-day sequencing section derived from the
reconciled register; `patch_plan.md` already contains one section per finding
(690/690, verified 2026-10-12).
