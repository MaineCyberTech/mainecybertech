# Search, Indexing, and Privacy Audit (Re-Run)

**Run ID:** 20260729-0025-develop-bc76370
**Previous Run:** 20260728-0142-develop-21a10d6
**Finding Area Code:** SRC
**Status:** RE-RUN VERIFICATION

## Executive Summary

**Risk Score: 35/100 (Low-Medium).** Significant improvement: GIN trigram indexes added for all searchable columns. 1 of 5 findings resolved. 3 open findings remain. 1 new finding identified.

## Previous Findings Status

### SEARCH-001: Admin Search Exposes PII Without Tenant Isolation (HIGH)

**Status:** STILL OPEN
**Previous Evidence:** search.ts returns email and phone from profiles. No
equireOrgAccess.
**Current Evidence:** pps/api/src/routes/search.ts:30 — Still selects phone from profiles. No
equireOrgAccess or audit logging added. Search still uses
equireAdmin only.
**Recommendation:** Remove phone from search SELECT. Add audit logging for admin searches. Consider adding
equireOrgAccess for tenant-scoped searches.

### SEARCH-004: No Search Audit Logging (MEDIUM)

**Status:** STILL OPEN
**Previous Evidence:** Neither search endpoint calls logAuditEvent.
**Current Evidence:** No logAuditEvent calls added to search.ts.
**Recommendation:** Add logAuditEvent("search.query") to both endpoints.

### SEARCH-005: No Full-Text Search Indexes — ILIKE Forces Full Table Scans (MEDIUM)

**Status:** RESOLVED
**Previous Evidence:** All search queries use %term% ILIKE pattern. No GIN trigram indexes.
**Current Evidence:** supabase/migrations/5302102_add_performance_indexes.sql — Created GIN trigram indexes on profiles(full_name, email), organizations(name), ickets(title, description), projects(name, description). Also added composite indexes for audit_logs, tickets, projects, notifications, and document_versions.
**Fix verified:** 9bd87cc commit.

### SEARCH-002: SDK Type Mismatch — Documents Promised But Not Returned (MEDIUM)

**Status:** STILL OPEN
**Previous Evidence:** PortalSearchResult type declares documents array but API never queries documents.
**Current Evidence:** No changes to search types or API query.
**Recommendation:** Add documents to portal search or remove from type.

### SEARCH-006: Search Error Handling Silently Swallows Failures (LOW)

**Status:** STILL OPEN
**Previous Evidence:** Both search components use catch { /_ ignore _/ }.
**Current Evidence:** No changes to error handling.
**Recommendation:** Add error logging and user feedback.

## New Findings

### SEARCH-NEW-001: Search Still Uses ILIKE Despite Indexes

**Severity:** LOW
**Evidence:** Migration 5302102 adds GIN trigram indexes, but search queries in search.ts still use ilike pattern. GIN trigram indexes DO accelerate ILIKE queries, so this is a successful pairing. However, the search queries still use %term% (leading wildcard), which is slower than erm% (prefix match), even with indexes.
**Recommendation:** Consider using erm% prefix pattern where possible, or add pg_trgm similarity search (similarity() or word_similarity()) for fuzzy matching.

## Summary

| Finding                                        | Severity | Previous | Current    |
| ---------------------------------------------- | -------- | -------- | ---------- |
| SEARCH-001: Admin search exposes PII           | HIGH     | OPEN     | STILL OPEN |
| SEARCH-004: No search audit logging            | MEDIUM   | OPEN     | STILL OPEN |
| SEARCH-005: No full-text search indexes        | MEDIUM   | OPEN     | RESOLVED   |
| SEARCH-002: SDK type mismatch                  | MEDIUM   | OPEN     | STILL OPEN |
| SEARCH-006: Error handling swallows failures   | LOW      | OPEN     | STILL OPEN |
| SEARCH-NEW-001: ILIKE pattern still suboptimal | LOW      | —        | NEW        |
