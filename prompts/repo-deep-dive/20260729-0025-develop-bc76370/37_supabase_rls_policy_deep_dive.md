# Supabase RLS Policy Deep-Dive Audit (Re-Run)

**Run ID:** 20260729-0025-develop-bc76370
**Previous Run:** 20260728-0142-develop-21a10d6
**Finding Area Code:** RLS
**Status:** RE-RUN VERIFICATION

## Executive Summary

**Overall Score: 8.5/10** (unchanged). RLS architecture remains strong with 5 helper functions, ~80+ migration-rewritten policies, and ~60 storage object policies. No changes to RLS policies since the previous run. The service_role bypass remains by-design.

## Previous Findings Status

### RLS-HELPER-01: Bootstrap is_org_member() Missing Status Check (Mitigated)

**Status:** RESOLVED (already mitigated in previous run)
**Evidence:** Bootstrap function (5302026) doesn't check status = 'approved'. Migration 5302100 overwrites it with corrected version.
**Assessment:** No changes to this migration since previous run. Mitigation is still in place.

### RLS-GAP-01: Organizations Missing DELETE Policy

**Status:** STILL OPEN (By-design)
**Evidence:** Bootstrap has SELECT/INSERT/UPDATE policies but no DELETE policy for organizations.
**Assessment:** By-design — super_admin via service_role. No changes needed.

### RLS-SLA-01: SLA Logs Use Pre-Rewrite Pattern

**Status:** STILL OPEN
**Previous Evidence:** sla_logs SELECT policy uses organization_id IN (SELECT ...) without status = 'approved' check.
**Current Evidence:** No new migration addresses this. Migration 5302102 (the only new migration) only adds performance indexes.
**Recommendation:** Fix to use is_org_member().

### RLS-NOTIF-01: Original Notifications INSERT Was Wide Open (Fixed)

**Status:** RESOLVED (already closed in previous run)
**Assessment:** No changes. Migration 5302057 already fixed this.

### RLS-STORAGE-02: Logos INSERT Policy Tightened (Fixed)

**Status:** RESOLVED (already closed in previous run)
**Assessment:** No changes. Migration 5302057 already fixed this.

### RLS-SERVICE-01: Service Role Bypasses RLS

**Status:** STILL OPEN (By-design)
**Evidence:** All queries use service_role key, bypassing RLS. Tenant isolation at application layer only.
**Assessment:** By-design with API mitigation via
equireOrgAccess. No changes needed.

## New Findings

### RLS-NEW-001: No New RLS Migrations Since Previous Run

**Severity:** INFO
**Evidence:** Only one new migration since previous run: 5302102_add_performance_indexes.sql — adds GIN trigram indexes and composite indexes. No RLS policy changes.
**Impact:** The sla_logs policy gap and other minor policy issues remain unaddressed.

### RLS-NEW-002: Application-Layer Org Verification Strengthened

**Severity:** RESOLVED (Mitigation)
**Evidence:** pps/api/src/routes/documents.ts:99-114 — GET /:id now requires and filters by organization_id. Similar org-verification added to 7 module GET /:id routes (commit 00ce78d).
**Impact:** Defense-in-depth against cross-org access is strengthened at the application layer, which is the primary access control mechanism (since RLS is bypassed by service_role).

## Summary

| Finding                                                       | Severity | Previous  | Current    |
| ------------------------------------------------------------- | -------- | --------- | ---------- |
| RLS-HELPER-01: Bootstrap is_org_member() missing status check | MEDIUM   | Mitigated | Mitigated  |
| RLS-GAP-01: Organizations missing DELETE policy               | LOW      | By-design | By-design  |
| RLS-SLA-01: SLA logs use pre-rewrite pattern                  | MEDIUM   | OPEN      | STILL OPEN |
| RLS-NOTIF-01: Notifications INSERT wide open                  | HIGH     | Closed    | Closed     |
| RLS-STORAGE-02: Logos INSERT policy                           | HIGH     | Closed    | Closed     |
| RLS-SERVICE-01: Service role bypasses RLS                     | MEDIUM   | By-design | By-design  |
| RLS-NEW-001: No new RLS migrations                            | INFO     | —         | NEW        |
| RLS-NEW-002: App-layer org verification strengthened          | —        | —         | RESOLVED   |
