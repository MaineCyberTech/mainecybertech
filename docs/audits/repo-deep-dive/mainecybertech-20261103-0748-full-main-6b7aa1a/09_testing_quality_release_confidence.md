# 09_testing_quality_release_confidence — Prompt 09 - Testing, Quality, and Release Confidence Audit

- Run: `mainecybertech-20261103-0748-full-main-6b7aa1a`
- Target: `mainecybertech` @ `6b7aa1a` (branch `main`)
- Domain: `09_testing_quality_release_confidence.md` (area TEST, prompt)

## Verification Performed

11 verified-fixed, 3 partially-fixed, 0 regressed, 2 open (TEST-P2-010 carried, TEST-P2-011 new); one new E2E setup failure, no prior finding regressed.

## Findings

| ID | Severity | Title |
|---|---|---|
| TEST-P2-001 | P2 | Accessibility gate width contradicts the code (docs say 19 pages, code scans 25) |
| TEST-P2-002 | P2 | Worker data-mutating scan tasks still lack a dedicated test suite; branch threshold is a no-op |
| TEST-P2-003 | P2 | E2E flakiness is documented but unresolved, and the prod-only gate masks it |
| TEST-P2-004 | P2 | Load tests exist but are manual-only with no enforced thresholds or failure injection |
| TEST-P2-005 | P2 | Orphan-cleanup tests model `storage.list` incorrectly, masking the data-loss bug |
| TEST-P2-006 | P2 | Route suites stub authorization middleware, so new routes can regress silently |
| TEST-P2-007 | P2 | docs/testing.md coverage-threshold table contradicts the ratcheted jest configs |
| TEST-P2-008 | P2 | Test/suite totals in AGENTS.md and README are stale and never verified against the tree |
| TEST-P2-009 | P2 | E2E is a required check on `main` but its PR path filter can leave it unreported |
| TEST-P3-001 | P3 | Visual regression is still non-blocking with a known-broken Storybook build |
| TEST-P3-002 | P3 | No scheduled production smoke check (health + login + critical read) |
| TEST-P3-003 | P3 | Coverage thresholds remain modest and cannot be confirmed met at this SHA |
| TEST-P3-004 | P3 | Coverage thresholds are low and E2E stability is unproven on `main` |
| TEST-P3-005 | P3 | Shared packages/ui has no test runner and no lint/typecheck script |
| TEST-P2-010 | P2 | Promotion PRs merge before required checks, so the promoted commit has no green Test artifact (PR #333 recurred) |
| TEST-P2-011 | P2 | E2E Supabase image cache is not a reliable cold-start path: a cache hit loads, then `supabase start` still fails before Playwright |
