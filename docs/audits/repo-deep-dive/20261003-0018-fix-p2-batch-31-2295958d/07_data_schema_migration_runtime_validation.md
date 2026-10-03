# Data, Schema, Migration, and Runtime Validation Audit

## Audit Metadata

- Audit name: repo-deep-dive
- Run: 20261003-0018-fix-p2-batch-31-2295958d
- Repository: C:\temp\mainecybertech
- Branch: fix/p2-batch-31
- Commit SHA: 2295958d
- Generated at: 2026-10-03
- Auditor: repo-deep-dive subagent (base profile)
- Area code: DATA
- Output path: docs/audits/repo-deep-dive/20261003-0018-fix-p2-batch-31-2295958d/07_data_schema_migration_runtime_validation.md
- Scope limitations: Static only; no DB connection, so migration order/effects reasoned from SQL. Live row counts unknown.

## Scope

Schema sources, migration ordering/idempotency, RLS enablement, functions/triggers, seeds vs migrations, generated DB types, data-retention jobs, and runtime data-loss paths.

## Evidence Reviewed

- `supabase/migrations/` (131 files), `supabase/seeds/` (9), `supabase/policies/`, `supabase/functions/`.
- `apps/worker/src/tasks/orphan-cleanup.ts` and its tests; `apps/api/src/routes/documents.ts` (upload/paths); `apps/api/src/routes/profiles.ts` (avatars).
- `scripts/verify-rls.mjs`; `packages/sdk/src/database.types.ts`.

## Verification Performed

| Evidence | Type | Why relevant | Notes |
|---|---|---|---|
| read `orphan-cleanup.ts` | source | data-loss path | `list("", …)` lists bucket root only |
| read `orphan-cleanup.test.ts` | test | claimed fix validation | mock ignores the list path, so folder traversal is untested |
| grep upload paths | source | object key shape | docs `orgs/<orgId>/<file>`; avatars `<uid>/avatar.<ext>` |
| read `5302119` head | SQL | seeds in migration path | demo data guard |
| `node scripts/verify-rls.mjs` logic read | source | RLS gate | baseline empty; every live table enables RLS |

## Executive Summary

The migration corpus is disciplined: RLS is enabled for live tables and enforced by a CI gate, policies for post-`5302427` migrations must pair `drop policy` with `create policy`, and helper functions pin `search_path`. However, this branch’s own headline data-loss remediation (`orphan-cleanup`) is **incomplete**: the cleanup lists each bucket at the *root* and compares returned entries (folder names such as `orgs` / `<userId>`) against full object keys / basenames. Every folder entry is consequently classified as an orphan and passed to `storage.remove([...])`, which Supabase treats as a prefix — a recursive delete of the bucket’s contents. The new tests do not catch this because the mock ignores the requested path. This is the top data risk in the run.

## Inventory

| Item | Path | State | Risk |
|---|---|---|---|
| Migrations | `supabase/migrations` | 131, ordered | Medium |
| RLS gate | `scripts/verify-rls.mjs` | CI-enforced | Low |
| Orphan cleanup | `apps/worker/src/tasks/orphan-cleanup.ts` | runs | **P0 path** |
| Documents bucket | storage `documents` | `orgs/<orgId>/<file>` | Medium |
| Avatars bucket | storage `avatars` | `<uid>/avatar.<ext>` | Medium |
| Demo migrations | `5302119…5302126` | in prod path | Medium |
| Generated types | `packages/sdk/src/database.types.ts` | generated, CI-checked | Low |
| Retention task | `apps/worker/src/tasks/public-interaction-retention.ts` | runs | Low |

## Domain Scorecard

| Category | Score | Evidence | Gap | Recommended action |
|---|---:|---|---|---|
| Schema correctness | 4 | migrations, generated types | — | keep |
| Migration safety | 3 | verify-rls; demo data | folder-prefix delete | DATA-P0-001 |
| RLS enablement | 4 | `5302129`, `5302434`, gate | — | keep |
| Seed/demo data | 2 | `5302119…5302126` | prod path | FEAT-P2-002 |
| Runtime validation | 3 | Zod; type gen | orphan list semantics | DATA-P0-001 |
| Data lifecycle | 3 | retention/orphan tasks | partial | fix orphan |
| Backups/restore | 2 | `db-backup.yml`, `db-restore-test.yml` | not exercised in review | OBS/ops |

## Detailed Review

### Item: Orphan cleanup semantics

- Evidence:
  - `apps/worker/src/tasks/orphan-cleanup.ts:21-52` — `listAllFiles` calls `storageBucket.list("", {limit, offset})` (bucket **root**), returning top-level entries.
  - `apps/worker/src/tasks/orphan-cleanup.ts:90-140` — for `documents`, referenced set is full `storage_path` values; for `avatars`, a set of basenames.
  - Upload shapes: `apps/api/src/routes/documents.ts:346` (`orgs/${organizationId}/${Date.now()}-${safeName}`); `apps/api/src/routes/profiles.ts:217` (`${userId}/avatar.${extension}`).
  - `apps/worker/src/__tests__/orphan-cleanup.test.ts:68-83` — `list` mock ignores `_path` and returns the configured files, so nested keys are never simulated.
- Why it matters: at the bucket root the API returns *folders* (`orgs`, or `<userId>`), which are never equal to real object keys/basenames; `storage.remove(["orgs"])` deletes by prefix.

## Findings

### Finding ID: DATA-P0-001 - Orphan cleanup can recursively delete a bucket’s contents

- Severity: P0
- Confidence: Medium
- Area: DATA
- Evidence:
  - `apps/worker/src/tasks/orphan-cleanup.ts` — `listAllFiles` → `storage.from(bucket).list("", {limit, offset})` (root only; Supabase `list` is not recursive)
  - `apps/worker/src/tasks/orphan-cleanup.ts` — `orphaned = paths.filter((p) => !referenced.has(key))`; for `documents` `key = p` (full key), for `avatars` `key = p.split("/").pop()`
  - `apps/api/src/routes/documents.ts:346` — objects live at `orgs/<orgId>/<name>`; `apps/api/src/routes/profiles.ts:217` — avatars at `<uid>/avatar.<ext>`
  - `apps/worker/src/__tests__/orphan-cleanup.test.ts:68-83` — mock `list` ignores the path argument, so nested/folder behaviour is untested
- What is happening: listing `""` yields folder placeholders (e.g. `{ name: "orgs", id: null }` or `{ name: "<userId>" }`). The reference sets contain real object keys (`orgs/<orgId>/<file>`) or basenames (`avatar.png`), so the folder names never match. They are treated as orphans and passed to `storage.remove([...])`. Supabase Storage delete treats a folder/prefixed name as a recursive delete of everything under it.
- Why it matters: a scheduled/on-demand maintenance task can destroy the entire document and/or avatar corpus — exactly the failure class this branch claimed to fix (it fixed only the “reference query errored → delete everything” case).
- User / business impact: unrecoverable loss of client documents/avatars; severe legal/operational impact.
- Security / privacy / reliability impact: catastrophic data loss / availability.
- Recommended fix: do not list at the bucket root. Enumerate known folder prefixes (`orgs/<orgId>/` per org, `<uid>/` per profile) and list inside them, or use the storage `search` / recursive listing with an explicit prefix; additionally, ignore any returned entry whose `id` is `null` (folder) and never pass a bare folder name to `remove`. Continue to require a successful reference read before deleting.
- Suggested validation: integration test against a real (or containerised) Supabase Storage with a fixture like `orgs/<org>/a.pdf` plus one true orphan, asserting the referenced file survives, only the true orphan is removed, and no folder path is ever passed to `remove`. Add a guard/assertion in code that rejects `remove` inputs that are folder prefixes.
- Owner suggestion: worker/data
- Effort estimate: M
- Dependencies: none
- Status: open
- Data path: `orphanCleanup` → `storage.list("")` → `documents.storage_path`/`profiles.avatar_url` → `storage.remove`
- Attack path: none (availability/data-loss, not an attacker chain)

### Finding ID: DATA-P2-001 - Generated DB types / schema can drift from migration intent

- Severity: P2
- Confidence: Medium
- Area: DATA
- Evidence:
  - `packages/sdk/src/database.types.ts` — generated by `scripts/generate-db-types.js`; CI runs `--check`
  - `review.md` — generator “handles … inline + named FK references … REQUIRED by supabase-js ≥2.100”
  - `supabase/migrations/5302135_profiles_encrypted_pii.sql` adds `encrypted_pii` while `lib/field-encryption.ts` documents wiring as unfinished
- What is happening: the generated types reflect SQL, but features can lag the schema (e.g. `encrypted_pii` present in DB, not populated by the API).
- Why it matters: columns that exist but are never written create false confidence and dead schema.
- User / business impact: low.
- Security / privacy / reliability impact: medium if it implies unencrypted PII is “protected”.
- Recommended fix: either wire `encrypted_pii` read/write or document it as reserved; ensure `generate-db-types --check` covers new columns.
- Suggested validation: `node scripts/generate-db-types.js --check`; integration test asserting PII round-trips through encryption.
- Owner suggestion: API/data
- Effort estimate: M
- Dependencies: SEC-P1-001
- Status: open

### Finding ID: DATA-P2-002 - Orphan cleanup reference query is unbounded in the object list

- Severity: P2
- Confidence: Medium
- Area: DATA
- Evidence:
  - `apps/worker/src/tasks/orphan-cleanup.ts` — `listAllFiles` up to `MAX_LISTED = 10_000`, then `.in("storage_path", paths)`
  - `apps/api/src/services/supabase.ts` / PostgREST — `.in()` with thousands of values produces very large requests
- What is happening: the reference lookup builds a single `IN (...)` with up to 10k keys.
- Why it matters: request-size limits / slow queries could fail; a failed read now aborts the bucket (safe), but the task then never cleans anything.
- Recommended fix: chunk the `.in()` (e.g. 200 keys/request) or join on a temp table; keep the existing fail-closed behaviour.
- Suggested validation: test with >1,000 objects and a chunked implementation.
- Owner suggestion: worker/data
- Effort estimate: S
- Dependencies: DATA-P0-001
- Status: open

## Risks

| Risk | Severity | Likelihood | Impact | Evidence | Mitigation |
|---|---|---|---|---|---|
| Bucket-wide deletion | P0 | Medium | Catastrophic | DATA-P0-001 | folder-aware listing |
| Dead schema column | P2 | Medium | False assurance | DATA-P2-001 | wire or document |
| Cleanup never runs | P2 | Low | Storage growth | DATA-P2-002 | chunk IN |

## Recommendations

### Immediate / Release Blocking
- Disable/guard `orphanCleanup` until DATA-P0-001 is fixed (the task can be scheduled).

### This Week
- Implement folder-aware listing + folder-entry rejection + a hard assertion before `remove`.

### This Month
- Chunk reference queries; finish or document `encrypted_pii`.

## Quick Wins

| Quick win | Why it helps | Files likely involved | Validation |
|---|---|---|---|
| Ignore `id === null` entries | prevents folder deletes | `orphan-cleanup.ts` | unit/integration |
| Feature-flag orphan cleanup off | stops scheduled data loss | worker schedule | config |

## Hardening Backlog

| Backlog item | Priority | Owner suggestion | Effort | Dependency |
|---|---|---|---|---|
| Folder-aware cleanup | P0 | worker | M | none |
| Chunked IN | P2 | worker | S | cleanup fix |
| Encryption wiring | P2 | API | M | SEC-P1-001 |

## Suggested Tests

- Storage integration fixture (nested keys + folder + true orphan).
- Assertion that `remove` inputs are never bare folder names.
- Chunking test > 1,000 objects.

## Suggested Documentation Updates

- Document the storage key layout and the cleanup contract; add a data-recovery runbook.

## Open Questions

| Question | Why it matters | Evidence needed |
|---|---|---|
| Does Supabase `remove(["orgs"])` delete recursively in this project’s version? | confirm P0 impact | live/container storage test |
| Is `orphanCleanup` scheduled today? | likelihood | `schedule-config.ts` / hosted config |

## Appendix

- The branch fixed the “reference query error → empty set → delete all” path (`orphan-cleanup.ts` error handling; tests at `orphan-cleanup.test.ts:132-162`). The root-listing/folder-traversal bug pre-dates the change and remains.
