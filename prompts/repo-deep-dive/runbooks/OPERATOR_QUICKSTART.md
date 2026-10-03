# Operator Quickstart

## Purpose

This runbook explains how to use the Repo Deep-Dive Full Hardening Audit Pack.

## Steps

1. Copy the `docs/audits/repo-deep-dive/` folder into the target repository.
2. Open `docs/audits/repo-deep-dive/prompts/MASTER_RUNNER_FULL_HARDENING.md`.
3. Paste the master runner into your AI coding agent while the repository is open.
4. Confirm the agent creates a new run folder under `docs/audits/repo-deep-dive/{run}/`.
5. Review the final files in this order:
   - `EXECUTIVE_SUMMARY.md`
   - `RELEASE_GATE.md`
   - `risk_register.md`
   - `patch_plan.md`
   - Detailed domain reports

## Audit-only guardrail

During an audit run, the agent should not modify application code. It should only write markdown audit artifacts.

## Recommended remediation flow

1. Fix P0 findings first.
2. Fix P1 release blockers next.
3. Add regression tests for every fixed finding.
4. Update docs and runbooks.
5. Re-run the relevant domain prompt.
6. Re-run prompts 22, 23, and 40 to refresh the final risk register, release gate, and changelog.
