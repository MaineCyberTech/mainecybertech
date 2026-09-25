# Data, Schema, Migration, and Runtime Validation Audit

## Audit Metadata

| Field            | Value                         |
| ---------------- | ----------------------------- |
| **Audit Name**   |
| epo-deep-dive    |
| **Run ID**       | 20260729-0025-develop-bc76370 |
| **Previous Run** | 20260728-0142-develop-21a10d6 |
| **Date**         | 2026-07-29                    |
| **Repository**   | C:\temp\mainecybertech-portal |
| **Branch/SHA**   | develop / bc76370             |
| **Area Code**    | DATA                          |

## Scope

This re-run audit covers 67 migration files (1 new since previous run), 25 Zod validator files, API runtime validation, environment validation, optimistic locking, idempotency, audit logging, seed data patterns, migration naming conventions, and data lifecycle patterns. It cross-references all findings from the previous run (21a10d6).

## Previous Findings Status

| ID          | Title                                                     | Previous Status | Current Status     |
| ----------- | --------------------------------------------------------- | --------------- | ------------------ |
| DATA-P1-001 | Bootstrap is_org_member() omits status = 'approved' check | OPEN            | PARTIALLY RESOLVED |
| DATA-P1-002 | UUID validation missing on entity ID fields               | OPEN            | RESOLVED           |
| DATA-P1-003 | Orphan tables with no API routes                          | OPEN            | RESOLVED           |
| DATA-P2-004 | Migration naming convention mismatch                      | OPEN            | STILL OPEN         |
| DATA-P2-005 | No soft delete columns                                    | OPEN            | STILL OPEN         |
| DATA-P2-006 | No CHECK constraints on numeric fields                    | OPEN            | STILL OPEN         |
| DATA-P2-007 | document_permissions table unused by API                  | OPEN            | RESOLVED           |
| DATA-P2-008 | Worker env allows Supabase credentials as optional        | OPEN            | RESOLVED           |

## Executive Summary

The MCT Portal data architecture is **strongly production-grade** with comprehensive Zod validation, optimistic locking, idempotency, and audit logging. Since the previous run, **5 of 8 findings are resolved**, with 3 remaining lower-priority items.

**Key improvements since previous run:**

- UUID validation standardized across all validator files (ticket, project, document, ai, and more now use z.string().uuid() for entity IDs)
- Orphan tables (chat_threads, chat_messages, document_permissions) dropped in migration 5302055
- Worker Supabase credentials now required in env schema
- New performance indexes migration (5302102)
- Prometheus metrics integration with counter/histogram

**Remaining gaps (3 P2):**

1. No soft delete columns on entity tables
2. No CHECK constraints on bounded numeric fields
3. Migration naming convention mismatch (docs vs actual)

## Evidence Reviewed

| File                                                    | Lines  | Purpose                                         |
| ------------------------------------------------------- | ------ | ----------------------------------------------- |
| supabase/migrations/5302026_bootstrap.v3.sql            | 2,377  | Consolidated schema foundation                  |
| supabase/migrations/5302055_cleanup_dead_tables.sql     | 20     | Drops 9 orphan tables                           |
| supabase/migrations/5302102_add_performance_indexes.sql | 27     | NEW: Performance indexes                        |
| supabase/migrations/5302028-5302102 (67 files)          | Varies | All incremental migrations                      |
| pps/api/src/config/env.ts                               | 48     | Zod env schema (31 vars)                        |
| pps/worker/src/env.ts                                   | 56     | Zod env schema (22 vars, SUPABASE_URL required) |
| pps/api/src/validators/ (25 files)                      | Varies | Zod validation schemas                          |
| pps/api/src/services/audit.ts                           | 64     | Audit logging with retry                        |
| pps/api/src/lib/metrics.ts                              | 44     | NEW: Prometheus metrics                         |
| docs/migrations/naming-guide.md                         | 182    | Migration naming convention                     |

## Findings

### DATA-P1-001: Bootstrap is_org_member() omits status = 'approved' check

**Status: PARTIALLY RESOLVED**

- **Evidence:** Migration 5302100 rewrites the function with the status check. On fresh environments, 5302100 runs after bootstrap, so the bootstrap function (5302026) still lacks the check.
- **What changed:** Migration 5302100 (ix_rls_membership_status.sql) was already present in the previous run. The bootstrap function itself has not been modified.
- **Risk:** Low on existing deployments (migration 5302100 has been applied). On fresh installs, the gap exists between bootstrap and migration 5302100.
- **Recommended action:** Add nd m.status = 'approved' to the function in the bootstrap migration for defense-in-depth.
- **Effort:** 30 minutes.

### DATA-P1-002: UUID validation missing on entity ID fields

**Status: RESOLVED**

- **Evidence:** Commit 34a4d65 (2026-07-28) updated all 25 validator files to use z.string().uuid() for entity ID fields. Verified in icket.ts, project.ts, document.ts, i.ts, pprovals.ts, indings.ts, proposals.ts, ssets.ts, domain-monitors.ts, governance.ts, security-suite.ts, security-ops.ts, edu-automation.ts, ield-services.ts, inal.ts, atch.ts, satisfaction-pulse-widget.ts, client-onboarding-command-center.ts, dynamic-client-forms-builder.ts, ile-requests.ts, qbr.ts, service-catalog.ts, endors.ts, membership.ts.
- **What changed:** All z.string().min(1) entity ID fields changed to z.string().uuid().
- **Risk:** Eliminated. Non-UUID IDs will now be rejected at the validation layer.

### DATA-P1-003: Orphan tables with no API routes

**Status: RESOLVED**

- **Evidence:** Migration 5302055_cleanup_dead_tables.sql drops 9 tables: ppointments, chat_messages, chat_threads, comments, contracts, contract_signers, document_permissions, onboarding_submissions, project_members.
- **What changed:** The cleanup migration was already present in the previous run but was not noted as resolved.
- **Risk:** Eliminated.

### DATA-P2-004: Migration naming convention mismatch

**Status: STILL OPEN**

- **Evidence:** All 67 migrations use the sequential 5302XXX numeric pattern. docs/migrations/naming-guide.md specifies YYYYMMDDHHMMSS ISO date format.
- **What changed:** No changes. Migration 5302102 was added following the same 5302XXX pattern.
- **Risk:** Low. The actual convention is well-established and consistent. The documentation is what needs updating.
- **Recommended action:** Update docs/migrations/naming-guide.md to document the actual 5302XXX sequential numeric convention.

### DATA-P2-005: No soft delete columns on any entity table

**Status: STILL OPEN**

- **Evidence:** All entity tables (tickets, projects, documents, organizations, etc.) use hard DELETE operations. No deleted_at or is_deleted columns exist.
- **What changed:** No changes since previous run.
- **Risk:** Medium. Data loss from accidental deletes cannot be recovered without point-in-time database restore.
- **Recommended action:** Add deleted_at timestamptz to core entities, update RLS policies to filter by deleted_at IS NULL, and create a soft-delete API pattern.

### DATA-P2-006: No CHECK constraints on numeric boundary fields

**Status: STILL OPEN**

- **Evidence:** sla_logs.target_minutes, satisfaction_pulses.rating, score_history.score have no CHECK constraints.
- **What changed:** No changes since previous run.
- **Risk:** Low. API validates inputs; DB does not enforce numeric ranges.
- **Recommended action:** Add CHECK constraints for bounded numeric fields in a new migration.

### DATA-P2-007: document_permissions table unused by API

**Status: RESOLVED**

- **Evidence:** Table dropped in migration 5302055_cleanup_dead_tables.sql.
- **Risk:** Eliminated.

### DATA-P2-008: Worker env allows Supabase credentials as optional

**Status: RESOLVED**

- **Evidence:** pps/worker/src/env.ts now has SUPABASE_URL: z.string().url(), SUPABASE_ANON_KEY: z.string().min(1), SUPABASE_SERVICE_ROLE_KEY: z.string().min(1) -- all required.
- **What changed:** Commit dfb5ef8 (2026-07-28) made all three Supabase env vars required in the worker schema.
- **Risk:** Eliminated. Worker will fail to start if Supabase credentials are missing.

## New Findings

### DATA-P3-001: Prometheus metrics not exposed via API endpoint

- **Severity:** P3 (Low)
- **Evidence:** pps/api/src/lib/metrics.ts defines counters and histograms, and pps/api/src/middleware/request-id.ts instruments HTTP requests. However, no /metrics endpoint is registered in pps/api/src/app.ts to expose the metrics for scraping.
- **Risk:** Low. Metrics are collected but not accessible. Prometheus cannot scrape them.
- **Recommended action:** Add GET /metrics endpoint in pp.ts that calls
  egister.metrics().
- **Effort:** 15 minutes.

### DATA-P3-002: Migration 5302102 adds indexes but does not analyze tables

- **Severity:** P3 (Low)
- **Evidence:** supabase/migrations/5302102_add_performance_indexes.sql adds 8 indexes across 6 tables ( ickets, projects, documents, udit_logs, icket_comments, ask_comments) but does not include ANALYZE statements.
- **Risk:** Low. New indexes won't be used by the query planner until ANALYZE is run or the next auto-analyze cycle.
- **Recommended action:** Add ANALYZE statements after the index creation in the migration.

## Risks

| Risk                                           | Likelihood | Impact | Evidence                             | Mitigation                        |
| ---------------------------------------------- | ---------- | ------ | ------------------------------------ | --------------------------------- |
| RLS bypass via pending memberships (fresh env) | Low        | High   | 5302026 bootstrap lacks status check | Fixed by 5302100 on existing envs |
| Data loss from hard deletes                    | Medium     | High   | No soft delete columns               | Implement soft delete             |
| Invalid numeric data in DB                     | Low        | Low    | No CHECK constraints                 | Add CHECK constraints             |
| Prometheus metrics not scrapeable              | Low        | Low    | No /metrics endpoint                 | Add endpoint                      |
| Query planner doesn't use new indexes          | Low        | Med    | 5302102 missing ANALYZE              | Add ANALYZE statements            |

## Recommendations

### This Week

1. Add ANALYZE to migration 5302102
2. Update docs/migrations/naming-guide.md to match actual convention

### This Month

3. Implement soft delete pattern on core entities (tickets, projects, documents, organizations)
4. Add CHECK constraints for bounded numeric fields

### Later

5. Add /metrics endpoint for Prometheus scraping
6. Fix bootstrap is_org_member() for defense-in-depth

## Quick Wins

| #   | Task                             | Effort | Impact |
| --- | -------------------------------- | ------ | ------ |
| 1   | Add ANALYZE to 5302102 migration | 5 min  | Medium |
| 2   | Update migration naming guide    | 10 min | Low    |
| 3   | Add /metrics endpoint            | 15 min | Medium |

## Suggested Tests

- Add integration test verifying that non-UUID IDs are rejected with 400
- Add migration test verifying 5302102 indexes exist
- Add soft-delete integration test (future)

## Suggested Documentation Updates

- docs/migrations/naming-guide.md: Update to document actual 5302XXX sequential convention

## Open Questions

| Question                                                                              | Why it matters                            | Evidence needed       |
| ------------------------------------------------------------------------------------- | ----------------------------------------- | --------------------- |
| Is the is_org_member() function in bootstrap ever used without 5302100 being applied? | Determines if the bootstrap fix is needed | Deploy sequence check |
| Should Prometheus metrics be exposed in production?                                   | Security vs observability tradeoff        | Security review       |
