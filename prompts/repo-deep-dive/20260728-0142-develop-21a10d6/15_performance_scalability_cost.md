# Performance, Scalability, and Cost Audit

## Audit Metadata

- **Run ID:** `20260728-0142-develop-21a10d6`
- **Finding Area Code:** PERF

## Executive Summary

Strong performance foundations: response caching on 5+ endpoints, Prometheus metrics, k6 scripts, Docker layer caching, sensible memory limits. Key gaps: middleware chain depth, dual Redis clients, missing DB indexes, unbounded exports, no load-test CI.

## Key Findings

### PERF-001: API Middleware Chain Depth (P1)

**Evidence:** 12+ middleware handlers per request. Idempotency and CSRF middleware run on ALL requests including GETs.
**Recommendation:** Scope idempotency and CSRF to mutation-only routes (POST/PUT/PATCH/DELETE).

### PERF-002: Dual Redis Client Instances (P2)

**Evidence:** `cache.ts` uses `redis` v4 `createClient`, `idempotency.ts` uses `ioredis` `new Redis()`. Two TCP connections.
**Recommendation:** Consolidate into a single shared Redis client.

### PERF-003: In-Memory Cache Has No Size Limit (P2)

**Evidence:** `CacheBackend` memory cleanup only removes expired entries, no max size or LRU eviction.
**Recommendation:** Add configurable max size (5,000 entries) with LRU eviction.

### PERF-004: Missing Database Indexes on High-Query Columns (P1)

**Evidence:** Only 2 indexes in latest perf migration. `audit_logs(organization_id, created_at)`, `tickets(assigned_to)` missing.
**Recommendation:** Add composite indexes for `audit_logs`, `tickets(assigned_to, created_by)`.

### PERF-005: Unbounded Export Queries (P2)

**Evidence:** 10+ endpoints use `.limit(10000)` without streaming. All rows loaded into memory.
**Recommendation:** Implement cursor-based pagination or streaming CSV response.

### PERF-008: Load Testing Scripts Exist But No CI (P2)

**Recommendation:** Create `.github/workflows/load-test.yml` workflow.

### PERF-011: Organizations List Without Pagination (P2)

**Recommendation:** Add pagination matching tickets/projects/document pattern.

## Quick Wins

1. Consolidate Redis clients — 1 hour
2. Add LRU eviction to in-memory cache — 1 hour
3. Add pagination to organizations list — 30 min
4. Add pagination to ticket comments — 30 min
