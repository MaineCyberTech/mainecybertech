# Supabase RLS Policy Deep-Dive Audit

**Run ID:** `20260728-0142-develop-21a10d6`
**Finding Area Code:** RLS

## Executive Summary

Strong RLS architecture: 5 helper functions, ~50+ bootstrap policies, ~80+ migration-rewritten policies (5302100), ~60 storage object policies. The API uses `service_role` which bypasses RLS — RLS is defense-in-depth. Major remediation migration (5302100) rewrote ~100 policies to use `is_org_member()` with `status = 'approved'` checks.

**Overall Score: 8.5/10**

## Key Findings

### RLS-HELPER-01: Bootstrap `is_org_member()` Missing Status Check (Mitigated)

**Severity:** Medium
**Evidence:** Bootstrap function (5302026) doesn't check `status = 'approved'`. Migration 5302100 overwrites it with corrected version.
**Status:** Mitigated — 5302100 runs after bootstrap.

### RLS-GAP-01: Organizations Missing DELETE Policy

**Severity:** Low
**Evidence:** Bootstrap has SELECT/INSERT/UPDATE policies but no DELETE policy for organizations.
**Status:** By-design — super_admin via service_role.

### RLS-SLA-01: SLA Logs Use Pre-Rewrite Pattern

**Severity:** Medium
**Evidence:** `sla_logs` SELECT policy uses `organization_id IN (SELECT ...)` without `status = 'approved'` check.
**Recommendation:** Fix to use `is_org_member()`.

### RLS-NOTIF-01: Original Notifications INSERT Was Wide Open (Fixed)

**Severity:** High
**Evidence:** Original policy allowed ANY authenticated user to insert notifications for ANY user. Migration 5302057 fixed this.
**Status:** Closed.

### RLS-STORAGE-02: Logos INSERT Policy Tightened (Fixed)

**Severity:** High
**Evidence:** Original allowed any authenticated user to upload. Migration 5302057 restricted to super_admin.
**Status:** Closed.

### RLS-SERVICE-01: Service Role Bypasses RLS

**Severity:** Medium
**Evidence:** All queries use `service_role` key, bypassing RLS. Tenant isolation at application layer only.
**Status:** By-design with API mitigation.

## Recommendations

1. Fix `sla_logs` SELECT policy to use `is_org_member()` (P1)
2. Add UPDATE/DELETE policies to `sla_logs` (P2)
3. Add organizations DELETE policy (P2)
4. Standardize policy naming across all future migrations (P2)
