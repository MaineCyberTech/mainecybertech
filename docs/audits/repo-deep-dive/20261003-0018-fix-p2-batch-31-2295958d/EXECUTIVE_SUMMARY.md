# Executive Summary

- Repository: `mainecybertech`
- Branch / commit: `fix/p2-batch-31` @ `2295958d`
- Run: `20261003-0018-fix-p2-batch-31-2295958d`
- Profile: base
- Date: 2026-10-03

## Verdict

NO-GO for production release at this commit. The branch is a strong engineering baseline with no reproduced remote-exploit P0, but it contains a P0-class data-loss defect and two P1 blockers that must be resolved before it becomes the first deployable release.

## Finding counts

| Severity | Count |
|---|---:|
| P0 | 1 |
| P1 | 3 |
| P2 | 26 |
| P3 | 14 |
| **Total** | **44** |

By area: INV 4, ARCH 4, FEAT 3, SEC 5, DATA 3, API 3, TEST 3, CI 4, SUPPLY 4, OBS 4, HYG 4, FINAL 3.

## What is strong

- JWT algorithm pinned to HS256 with a bounded Supabase fallback; atomic Redis-backed idempotency; double-submit CSRF; SSRF guard with DNS resolution; byte-sniffed uploads with markup rejection.
- Tenant access checks with audited platform-admin impersonation; `security definer` helpers pin `search_path`; RLS enabled for live tables and enforced by a static CI gate (`scripts/verify-rls.mjs`).
- Prior P0-class RLS issues (`public_interactions` RLS disabled, blanket `anon` DML grant) are remediated at this commit (`5302129`, `5302434`) — recorded `verified-fixed` on static evidence.
- CI: SHA-pinned Actions, deep `validate.yml` gate, health-gated deploy with rollback, Dependabot across four ecosystems, digest-pinned non-root containers.

## Top risks

1. **P0 — DATA-P0-001:** `orphanCleanup` lists each bucket at the root and passes folder names (e.g. `orgs`, `<userId>`) to `storage.remove([...])`, which Supabase treats as a recursive prefix delete → potential loss of all documents/avatars. The branch's new tests mock `list` incorrectly and do not catch it.
2. **P1 — SEC-P1-001:** PII field encryption silently falls back to reversible `plain:` storage when `FIELD_ENCRYPTION_KEY` is unset (it is optional and not enforced in prod).
3. **P1 — CI-P1-001:** the production deploy path cannot run (prod environment lacks secrets/protection rules); no successful `main` deploy exists.
4. **P2 — OBS-P2-001:** Prometheus rules load but no Alertmanager/`alerting:` target exists, so no alert is ever delivered.
5. **P2 — API-P2-001:** `/api/v1/search` is fail-open — an admin resolving to zero orgs queries the service-role client unscoped.
6. **P2 — FEAT-P2-002:** demo/test-data migrations (weak `password: 1`) run through the production migration path, gated only by a domain heuristic.
7. **P2 — FEAT-P2-001:** API keys are generated/listed but no code accepts them for authentication.
8. **P2 — ARCH-P2-001:** single droplet hosts api/web/worker/redis/caddy/prometheus — full-stack SPOF.
9. **P2 — CI-P2-001:** branch protection allows admin bypass, ignores `CODEOWNERS`, and omits CodeQL/Validate/SBOM from required checks.
10. **P2 — OBS-P2-003:** backup/restore scheduled jobs are documented as failing and fire from a stale branch; recovery is unverified.

## Immediate actions

1. Patch DATA-P0-001 and the corresponding TEST-P2-001 test model.
2. Require `FIELD_ENCRYPTION_KEY` and Turnstile in production (SEC-P1-001, SEC-P2-002).
3. Provision the `prod` environment + protection rules and complete one dry `main` deploy (CI-P1-001).
4. Complete a dated restore drill (OBS-P2-003).

## Reconciliation

This audit does not grant or revoke any published verdict. `review.md` records prior remediation; the RLS/anon fixes it cites are independently confirmed at this commit, while its claim that orphan-cleanup data loss is fixed is **only partially supported** (the error-path case is fixed; the folder-traversal case is not).

## Files

See `INDEX.md` for the full report list and `risk_register.md`, `roadmap.md`, `patch_plan.md`, `RELEASE_GATE.md`.
