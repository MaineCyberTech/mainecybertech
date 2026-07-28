# Access Control Matrix Audit

**Run ID:** `20260728-0142-develop-21a10d6`
**Finding Area Code:** ACM

## Executive Summary

Complete access-control matrix across 52 API route files, 4 middleware modules, 5 roles, and 26 permissions. The system uses layered defense: API middleware (requireAuth -> requireOrgAccess/requireAdmin -> per-route overrides) and database RLS.

## Key Findings

### ACM-F001: Inconsistent Org-Scoping on Users/Profiles Routes

**Severity:** Medium
**Evidence:** `users.ts` and `profiles.ts` use only `requireAuth` without `requireOrgAccess`.
**Recommendation:** Add self-scoping to profile reads.

### ACM-F002: Organizations List Route Bypasses Org Access

**Severity:** Low
**Evidence:** `GET /api/v1/organizations` lists ALL orgs with only `requireAuth`.
**Recommendation:** Apply `requireAdmin` or scope to user's memberships.

### ACM-F004: Webhook Endpoints GET Routes Lack Admin Gate

**Severity:** Medium
**Evidence:** `GET /webhook-endpoints` requires only `requireAuth` + `requireOrgAccess`.
**Recommendation:** Make webhook endpoint listing admin-only.

### ACM-F006: No Role-Based Authorization in Module CRUD Routes

**Severity:** Low (by-design)
**Evidence:** Generic module CRUD routes use `requireAuth` + `requireOrgAccess` but don't check `role_permissions`. Permission system is not enforced at API layer.
**Recommendation:** By-design but document explicitly.

### ACM-F007: `requireOrgAccess` Admin Bypass

**Severity:** Informational
**Evidence:** Admin in Org A can access Org B data through any `requireOrgAccess` endpoint.
**Recommendation:** Document this behavior explicitly.

## Route Access Summary

| Category                            | Count           |
| ----------------------------------- | --------------- |
| Public/unauthenticated              | 16              |
| Authenticated-only (requireAuth)    | 12 route groups |
| Authenticated+Org-scoped            | 39 route groups |
| Admin-only                          | 10 route groups |
| Per-route admin override            | 23 routes       |
| Optimistic locking (requireIfMatch) | 11 entity types |
