# Platform Evolution and Extensibility Audit (re-audit)

## Audit Metadata

- Audit name: mainecybertech
- Run: `mainecybertech-20261014-0033-full-main-7dd0402`
- Repository: MaineCyberTech/mainecybertech (origin/main)
- Commit SHA: `7dd040234e8dfa40dd2d2b6fe1ca7379f2fba097`
- Generated at: 2026-10-14T00:55:01Z
- Auditor: subagent (full-domain verification re-audit)
- Area code: EVOL
- Previous run: `mainecybertech-20261011-0426-full-main-8d299b8`
- Scope limitation: static tree review at 7dd0402; remote workflow/release state
  checked via the public GitHub API; no runtime execution.

## Executive Summary

The phase-5/6 remediation wave delivered most of the EVOL backlog. The module
registry now exists and is guarded, the webhook event catalog is real and
enforced, permission-catalog lint runs in CI, deprecation headers are
implemented, shared env schemas live in `@mct/config/env`, migration docs match
the tree, and roles/plans/statuses have parity tests. Two prior findings are
only partially fixed (the module registry does not yet cover the API mount
table / SDK wiring; feature flags remain unconsumed), and the shared-package
extraction is documented rather than done. One new issue was found: the two
outbound-webhook consumer docs duplicate each other, already disagree on retry
semantics, and only one is drift-guarded.

Counts: 7 verified-fixed, 3 partially-fixed, 1 new open.

## Findings

| ID | Sev | Title | Status | Evidence |
|---|---:|---|---|---|
| EVOL-P2-001 | P2 | No module registry: module metadata duplicated across disconnected catalogs | partially-fixed | module-registry.ts:45 + tests; app.ts:171-232 and sdk/index.ts:410+ still hand-wired |
| EVOL-P2-002 | P2 | Webhook UI advertised 11 events, only 2 dispatched | verified-fixed | webhook-events.ts:29-41; 11 emitters; webhook-event-catalog.test.ts:40-84 |
| EVOL-P3-001 | P3 | Feature flags hardcoded static map, no change log/targeting | partially-fixed | feature-flags.ts:45-68,135-166,247; zero production call sites remain |
| EVOL-P3-002 | P3 | No permission-catalog lint | verified-fixed | check-permission-catalog.mjs + wrapper; action.yml:103-109 |
| EVOL-P3-003 | P3 | No committed event catalog or webhook docs | verified-fixed | docs/EVENTS.md, docs/WEBHOOKS.md; guard test; M365 docs corrected |
| EVOL-P3-004 | P3 | API versioning documented but not enforced | verified-fixed | middleware/deprecation.ts:27-104; app.ts:142-144; docs/API_VERSIONING.md |
| EVOL-P3-005 | P3 | Config model duplicated; no shared env-schema package | verified-fixed | packages/config/src/env.ts; consumers; check-env-parity.mjs |
| EVOL-P3-006 | P3 | Shared-package extraction deferred; DB client setup duplicated | partially-fixed | package-extraction-plan.md; sdk/ui still source-only; no packages/db |
| EVOL-P3-007 | P3 | Migration docs contradict each other and the tree | verified-fixed | naming-guide.md:19,115; cheatsheet:9-10; 158 sequential migrations |
| EVOL-P3-008 | P3 | Roles/plans/statuses hardcoded with no parity guard | verified-fixed | catalog-parity.test.ts:83-160 |
| EVOL-P3-009 | P3 | Duplicate webhook consumer docs, one guarded, retry semantics diverge | open (new) | EVENTS.md:59 vs WEBHOOKS.md:59; guard reads WEBHOOKS.md only |

## Recommendations

### This week

- Refresh the two stale docs of the release pipeline (REL domain) only after
  the EVOL fixes land; nothing here blocks a release.

### This month

- EVOL-P2-001 residual: generate the API mount list and the SDK sub-API
  constructor from `MODULE_REGISTRY` (or add a guard comparing mounted
  prefixes and SDK sub-APIs to registry keys), and either link
  `apps/web/lib/module-config.ts` to the registry or fold its per-module CRUD
  config into it.
- EVOL-P3-009: collapse `docs/EVENTS.md` and `docs/WEBHOOKS.md` into one
  consumer contract (or make one a pointer), state the two-layer retry budget
  (3 inline attempts + up to 5 worker retries), and guard every remaining doc.

### Later / Platform evolution

- EVOL-P3-001 residual: either wire at least one real consumer of
  `isFeatureEnabled` (so the registry is not dead code) or record an explicit
  decision that flags are dormant; a managed store/admin surface remains the
  next step.
- EVOL-P3-006: land the `@mct/db` ADR before extracting, per the documented
  plan; add the SDK build step only when a second consumer exists.

## Quick Wins

| Quick win | Why it helps | Files |
|---|---|---|
| Fix the retry-count paragraph in `docs/EVENTS.md` or delete the file | Removes a contradictory consumer contract | docs/EVENTS.md:59 |
| Add `packages/db` ADR stub referencing the extraction plan | Unblocks phase 2 | docs/adr/, docs/arch/package-extraction-plan.md |

## Open Questions

| Question | Why it matters | Evidence needed |
|---|---|---|
| Are the four feature flags intentionally dormant? | Determines whether the registry is dead code | product decision record |
| Should `module-config.ts` keys be renamed to registry keys (gov-changes -> change-requests)? | A single vocabulary removes the last disconnected catalog | owner decision + nav/config mapping |
