# Search, Indexing, and Privacy Audit

## Audit Metadata

- **Run ID:** `20260728-0142-develop-21a10d6`
- **Finding Area Code:** SRC

## Executive Summary

Strong authentication and tenant isolation for portal search. Admin search returns PII (phone, email) without tenant isolation. No full-text search indexes — ILIKE patterns force full table scans. No search audit logging. SDK/API contract mismatch.

## Key Findings

### SEARCH-001: Admin Search Exposes PII Without Tenant Isolation

**Severity:** HIGH
**Evidence:** `search.ts` returns `email` and `phone` from profiles. No `requireOrgAccess` — only `requireAdmin`. Admins can probe users across all orgs.
**Recommendation:** Remove `phone` from search SELECT. Add audit logging for admin searches.

### SEARCH-004: No Search Audit Logging

**Severity:** MEDIUM
**Evidence:** Neither search endpoint calls `logAuditEvent`. No ability to detect anomalous search patterns.
**Recommendation:** Add `logAuditEvent("search.query")` to both endpoints.

### SEARCH-005: No Full-Text Search Indexes — ILIKE Forces Full Table Scans

**Severity:** MEDIUM
**Evidence:** All search queries use `%term%` ILIKE pattern. No GIN trigram indexes on any searchable column.
**Recommendation:** Create `pg_trgm` GIN indexes on `profiles(full_name, email)`, `organizations(name)`, `tickets(title, description)`, `projects(name, description)`.

### SEARCH-002: SDK Type Mismatch — Documents Promised But Not Returned

**Severity:** MEDIUM
**Evidence:** `PortalSearchResult` type declares `documents` array but API never queries documents.
**Recommendation:** Add documents to portal search or remove from type.

### SEARCH-006: Search Error Handling Silently Swallows Failures

**Severity:** LOW
**Evidence:** Both search components use `catch { /* ignore */ }`.
**Recommendation:** Add error logging and user feedback.

## Quick Wins

1. Remove `phone` from admin search SELECT — 5 min
2. Fix SDK `PortalSearchResult` type — 15 min
3. Fix `docs/modules/search-portal.md` file reference — 2 min
4. Add GIN trigram indexes — 1 hour
5. Add search audit logging — 30 min
