# Platform Evolution and Extensibility Audit (re-audit)

## Audit Metadata

- Audit name: mainecybertech
- Run: `mainecybertech-20261103-0748-full-main-6b7aa1a`
- Repository: MaineCyberTech/mainecybertech (origin/main)
- Commit SHA: `6b7aa1a5505d4f75b334b36e9e87737cd98e589c`
- Generated at: 2026-11-03T09:43:35Z
- Auditor: subagent (full-domain verification re-audit)
- Area code: EVOL
- Previous run: `mainecybertech-20261014-0033-full-main-7dd0402`
- Scope limitation: static tree review at 6b7aa1a; no runtime execution and no
  direct connection to the linked Supabase project.

## Executive Summary

The EVOL backlog is mostly closed: the webhook catalog is enforced end to end,
the duplicate consumer docs are consolidated, permission-catalog lint and
deprecation headers run in CI, the shared env schema is guarded, migration docs
match the tree, and roles/plans/statuses have parity tests. Three findings remain
partially fixed (registry still does not drive API mounts/SDK wiring; feature
flags remain unconsumed; package extraction is documented, not done).

Two new issues surfaced in the migration path:

- **EVOL-P1-001 (new, P1):** two live migrations share version `5302463`
  (`client_portal_ai_and_visibility` and `fix_notification_key_dedup_index`).
  Supabase tracks by numeric version, so the client-portal AI/visibility
  migration can be treated as already applied. The repo's own preflight and
  naming guide forbid this, but neither check runs in CI.
- **EVOL-P3-010 (new, P3):** CI pins Supabase CLI 2.107.0 while the lockfile
  resolves 2.122.1, so the migration path is not the version developers run.

Counts: 8 verified-fixed, 3 partially-fixed, 2 new open (1 P1, 1 P3).

## Findings

| ID | Sev | Title | Status | Evidence |
|---|---:|---|---|---|
| EVOL-P2-001 | P2 | Module registry does not cover API mounts/SDK/module-config | partially-fixed | module-registry.ts:45 (90 keys) + tests; app.ts:166-227 (62 mounts); sdk/index.ts:411-465 (55 sub-APIs); module-config.ts:25-748 |
| EVOL-P2-002 | P2 | Webhook UI advertised 11 events, only 2 dispatched | verified-fixed | webhook-events.ts:27-40; 11 emitters; webhook-event-catalog.test.ts:38-88 |
| EVOL-P3-001 | P3 | Feature flags registry unused in production | partially-fixed | feature-flags.ts:45-68,135-166,204-211; zero non-test call sites |
| EVOL-P3-002 | P3 | No permission-catalog lint | verified-fixed | check-permission-catalog.mjs; action.yml:122-125; run PASS 206+46 refs |
| EVOL-P3-003 | P3 | No committed event catalog/docs | verified-fixed | WEBHOOKS.md (93 lines); EVENTS.md:1-14 pointer; guard :66-88 |
| EVOL-P3-004 | P3 | API versioning not enforced | verified-fixed | deprecation.ts:38-74,112; app.ts:140; tests |
| EVOL-P3-005 | P3 | Config duplicated; no shared env package | verified-fixed | packages/config/src/env.ts; consumers; check-env-parity.mjs; action.yml:96-100 |
| EVOL-P3-006 | P3 | Shared-package extraction deferred | partially-fixed | sdk/ui package.json; no packages/db; plan doc |
| EVOL-P3-007 | P3 | Migration docs contradicted the tree | verified-fixed | naming-guide.md:19,115; cheatsheet:9-10; verify-rls check 4 :480-493 |
| EVOL-P3-008 | P3 | Roles/plans/statuses had no parity guard | verified-fixed | catalog-parity.test.ts:78-170 |
| EVOL-P3-009 | P3 | Duplicate webhook consumer docs diverged | verified-fixed | EVENTS.md:1-14 pointer; WEBHOOKS.md:55-70; test :66-88 |
| EVOL-P1-001 | P1 | Duplicate migration version 5302463 can skip the client-portal AI migration | open (new) | 5302463_* (two files); preflight-check.sh:50-51 not in CI |
| EVOL-P3-010 | P3 | Supabase CLI CI pin (2.107.0) vs lockfile (2.122.1) | open (new) | supabase-migrations.yml:62-64; pnpm-lock.yaml:6709; package.json:51 |

## Detailed verification

### Module registry (EVOL-P2-001)

- `packages/sdk/src/module-registry.ts:45` holds 90 modules; the permission,
  entitlement, nav and label guards still pass.
- Still hand-wired: `apps/api/src/app.ts:166-227` (62 routers),
  `packages/sdk/src/index.ts:411-465` (55 sub-APIs),
  `apps/web/lib/module-config.ts:25-748` (separate CRUD catalog).
- `module-registry.ts:24-28` explicitly records this as next-step scope.

### Migration version collision (EVOL-P1-001)

```
$ ls supabase/migrations/*.sql | sed 's#.*/##' | cut -d_ -f1 | sort | uniq -d
5302463
```

- `5302463_fix_notification_key_dedup_index.sql` landed 2026-10-15.
- `5302463_client_portal_ai_and_visibility.sql` landed 2026-10-22 and its own
  header line 2 says `5302437`.
- Supabase matches local files to `supabase_migrations.schema_migrations` by
  numeric version; a second file with the same version cannot be tracked
  independently.
- `scripts/preflight-check.sh:50-51` would flag this, but it is not wired into
  any workflow; `docs/migrations/naming-guide.md:81` asks the author to check
  manually.

### Migration CLI version (EVOL-P3-010)

- Workflow: `npm install -g supabase@2.107.0` (supabase-migrations.yml:64,
  e2e.yml:80).
- Lockfile: `supabase@2.122.1` (pnpm-lock.yaml:6709,14614).
- Root manifest: `"supabase": "^2.120.0"` (package.json:51).
- The workflow comment (line 62) claims it matches the lockfile, which is false.

## Recommendations

### This week

- **EVOL-P1-001:** renumber the client-portal AI/visibility migration to the next
  unused prefix before the next push; if it is already recorded as applied,
  repair/replay it deliberately. Add a duplicate-prefix check to
  `scripts/verify-rls.mjs` or the shared unit-tests action instead of relying on
  the manual preflight.
- **EVOL-P3-010:** align the Supabase CLI pin with the lockfile (or pin the
  dependency down) and update the workflow comment and docs/CI.md.

### This month

- **EVOL-P2-001:** generate the API mount list and SDK sub-API constructors from
  `MODULE_REGISTRY`, or add a guard comparing mounted prefixes and SDK sub-APIs
  to registry keys; fold `apps/web/lib/module-config.ts` into the registry
  vocabulary.
- **EVOL-P3-001:** wire one real consumer of `isFeatureEnabled` or record an
  explicit decision that the flags are dormant.

### Later

- **EVOL-P3-006:** land the `@mct/db` ADR before extraction; add the SDK build
  step only when a second consumer exists.

## Quick Wins

| Quick win | Why it helps | Files |
|---|---|---|
| Renumber the client-portal migration | Restores a trackable, replayable upgrade path | `supabase/migrations/5302463_client_portal_ai_and_visibility.sql` |
| Add duplicate-prefix check to verify-rls | Stops the next collision at PR time | `scripts/verify-rls.mjs`, `scripts/preflight-check.sh` |
| Fix the Supabase CLI comment/pin | Removes a false "matches lockfile" claim | `.github/workflows/supabase-migrations.yml:62-64` |

## Open Questions

| Question | Why it matters | Evidence needed |
|---|---|---|
| Has 5302463 already been recorded on dev/prod? | Decides renumber-only vs repair+replay | `supabase migration list` output for the linked project |
| Is VERSION intended to stay 0.1.0 across tags? | Affects release identity (REL-P1-001) | owner decision in docs/RELEASING.md |
