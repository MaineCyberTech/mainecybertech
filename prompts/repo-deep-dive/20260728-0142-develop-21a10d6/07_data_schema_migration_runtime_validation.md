# Data, Schema, Migration, and Runtime Validation Audit

## Audit Metadata

| Field          | Value                           |
| -------------- | ------------------------------- |
| **Audit Name** | `repo-deep-dive`                |
| **Run ID**     | `20260728-0142-develop-21a10d6` |
| **Date**       | 2026-07-28                      |
| **Repository** | `C:\temp\mainecybertech-portal` |
| **Branch/SHA** | develop / 21a10d6               |
| **Area Code**  | DATA                            |

## Scope

This audit covers 66 migration files, 25 Zod validator files, API runtime validation, environment validation, optimistic locking, idempotency, audit logging, seed data patterns, migration naming conventions, and data lifecycle patterns.

## Evidence Reviewed

| File                                             | Lines  | Purpose                        |
| ------------------------------------------------ | ------ | ------------------------------ |
| `supabase/migrations/5302026_bootstrap.v3.sql`   | 2,377  | Consolidated schema foundation |
| `supabase/migrations/5302028-5302101` (65 files) | Varies | All incremental migrations     |
| `apps/api/src/config/env.ts`                     | 48     | Zod env schema (31 vars)       |
| `apps/worker/src/env.ts`                         | 56     | Zod env schema (22 vars)       |
| `apps/api/src/validators/` (25 files)            | Varies | Zod validation schemas         |
| `apps/api/src/services/audit.ts`                 | 64     | Audit logging with retry       |
| `apps/api/src/middleware/optimistic-locking.ts`  | 44     | If-Match header parsing        |
| `docs/migrations/naming-guide.md`                | 182    | Migration naming convention    |

## Executive Summary

The MCT Portal codebase demonstrates **advanced production-grade data architecture** with comprehensive Zod runtime validation, optimistic locking, idempotency controls, audit logging with PII redaction, and extensive RLS policy coverage.

**Strengths:** 66 structured migrations, 25 dedicated Zod validators, optimistic locking on 9 tables, webhook idempotency via Redis, audit logging with 3-retry backoff + PII redaction, 180+ RLS policies, `updated_at` trigger pattern, 12 enum types.

**Key Gaps (3 P1, 5 P2, 4 P3):**

1. Missing `status = 'approved'` check in bootstrap `is_org_member()` function (mitigated by 5302100)
2. No UUID validation on most entity IDs in validators
3. Migration naming convention mismatch (sequential numeric vs documented ISO-date)
4. Orphan tables: chat_threads, chat_messages with no API routes
5. No soft delete columns
6. No CHECK constraints on numeric ranges

## Findings

### DATA-P1-001: Bootstrap `is_org_member()` omits `status = 'approved'` check

**Location:** `5302026_bootstrap.v3.sql` lines 653-666
**Evidence:** Function checks membership but not `status = 'approved'`. Users with `pending`/`rejected`/`suspended` memberships could access org data until migration 5302100 fixes this.
**Mitigation:** Migration 5302100 rewrites the function with the status check. On fresh environments, this runs after bootstrap.
**Recommendation:** Add `and m.status = 'approved'` to the function in the bootstrap migration for defense-in-depth.

### DATA-P1-002: UUID validation missing on entity ID fields in 22/25 validator files

**Location:** All validator files — e.g., `ticket.ts:4`, `project.ts:4`, `document.ts:4`
**Evidence:** Most use `z.string().min(1)` instead of `z.string().uuid()`.
**Recommendation:** Change all `z.string().min(1)` entity ID fields to `z.string().uuid()`.

### DATA-P1-003: Orphan tables with no API routes

**Location:** `chat_threads`, `chat_messages` tables (created in bootstrap)
**Evidence:** No API routes, SDK methods, or frontend components reference these tables.
**Recommendation:** Drop the tables in a new cleanup migration.

### DATA-P2-004: Migration naming convention mismatch

**Location:** All 66 migrations (pattern: `5302XXX`) vs `docs/migrations/naming-guide.md` (specifies `YYYYMMDDHHMMSS`)
**Recommendation:** Update naming guide to reflect actual convention.

### DATA-P2-005: No soft delete columns on any entity table

**Evidence:** All entity tables use hard `DELETE` operations. No `deleted_at` or `is_deleted` columns exist.
**Recommendation:** Add `deleted_at timestamptz` to core entities and filter in RLS policies.

### DATA-P2-006: No CHECK constraints on numeric boundary fields

**Evidence:** `sla_logs.target_minutes`, `satisfaction_pulses.rating`, `score_history.score` have no CHECK constraints.
**Recommendation:** Add CHECK constraints for bounded numeric fields.

### DATA-P2-007: `document_permissions` table unused by API

**Location:** Bootstrap lines 437-447; `can_read_document()` function references it but no API endpoints manage it.
**Recommendation:** Either add API CRUD endpoints or drop the table.

### DATA-P2-008: Worker env schema allows Supabase credentials as optional

**Location:** `apps/worker/src/env.ts:18-20`
**Recommendation:** Make SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY required.

## Risks

| Risk                               | Likelihood | Impact | Mitigation                           |
| ---------------------------------- | ---------- | ------ | ------------------------------------ |
| RLS bypass via pending memberships | Low        | High   | Fixed by 5302100                     |
| Non-UUID IDs reaching DB           | Medium     | Low    | DB rejects with clear error          |
| Orphan schema tables               | Low        | Low    | Clean up in next migration           |
| Data loss from hard deletes        | Medium     | High   | Implement soft delete                |
| Invalid numeric data in DB         | Low        | Low    | API validates; add CHECK constraints |

## Recommendations

### P1

1. Standardize UUID validation across all validators
2. Clean up orphan tables (chat_threads, chat_messages)

### P2

3. Implement soft delete pattern on core entities
4. Add CHECK constraints for bounded numeric fields
5. Resolve or remove document_permissions
6. Make Worker Supabase credentials required

### P3

7. Document migration naming convention
8. Add rollback SQL comments to migration files
9. Add `updated_at` to all batch module tables

## Quick Wins

| #   | Task                                              | Effort | Impact |
| --- | ------------------------------------------------- | ------ | ------ |
| 1   | Change `z.string().min(1)` to `z.string().uuid()` | 30 min | High   |
| 2   | Drop orphan tables                                | 10 min | Medium |
| 3   | Make Worker Supabase keys required                | 10 min | Medium |
