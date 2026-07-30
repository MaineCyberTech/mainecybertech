# Admin Console Abuse Case Audit

**Run ID:** `20260728-0142-develop-21a10d6`
**Finding Area Code:** ADM

## Executive Summary

**16 findings** (2 P0, 6 P1, 5 P2, 3 P3). Strong admin security baseline with type-to-confirm deletion, comprehensive audit logging, optimistic locking, and force-dynamic rendering. Critical gaps: missing requireAdmin on destructive routes, global admin bypass in requireOrgAccess.

## P0 Findings

### ADM-001: Multiple Destructive Routes Lack `requireAdmin`

**Severity:** P0 Critical
**Evidence:** tickets.ts, projects.ts, documents.ts, approvals.ts, api-keys.ts, batch.ts all use `requireAuth` + `requireOrgAccess` only, not `requireAdmin`, for DELETE and bulk operations.
**Risk:** Any approved org member can execute destructive operations.
**Recommendation:** Add `requireAdmin` to all DELETE routes and bulk operations.

### ADM-002: Single-Org Admin Inherits Global Privileges

**Severity:** P0 Critical
**Evidence:** `requireAdmin` checks ALL memberships across ALL orgs. Admin in Org A gets full access to all orgs.
**Risk:** No per-org admin scoping.
**Recommendation:** Consider per-org admin scoping with `requireOrgAccess` + `requireAdmin` combined.

## P1 Findings

- **ADM-003:** Bulk invite creates auth accounts without verification
- **ADM-004:** No confirmation dialog for org status changes
- **ADM-005:** Server actions for orgs/users lack `requireAdminAccess()` check
- **ADM-006:** Webhook deletion uses browser `confirm()` instead of type-to-confirm
- **ADM-007:** API key and notification deletion lacks confirmation

## P2 Findings

- **ADM-008:** No graduated rate limiting for admin operations
- **ADM-009:** No audit logging for admin search/dashboard reads
- **ADM-012:** No soft-delete for organizations, documents, or projects

## Key Strengths

- Type-to-confirm deletion pattern for tickets/documents
- Comprehensive audit logging on mutation endpoints
- Admin audit viewer with filters, pagination, export
- Optimistic locking on 4 entity types
- Force-dynamic rendering prevents prerender caching
