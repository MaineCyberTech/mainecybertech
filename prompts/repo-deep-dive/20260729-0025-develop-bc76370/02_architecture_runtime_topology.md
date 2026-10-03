# 02 - Architecture/Runtime Topology (Verification Re-Run)

## Audit Metadata

| Field                 | Value                           |
| --------------------- | ------------------------------- |
| **Run ID**            | `20260729-0025-develop-bc76370` |
| **Previous Run**      | `20260728-0142-develop-21a10d6` |
| **Finding Area Code** | ARCH                            |
| **Date**              | 2026-07-29                      |

## Scope

This is a verification re-run of the architecture and runtime topology audit. It cross-references the previous run`s findings against the 18 fix commits.

## Architecture Score: 8/10 (unchanged)

## Previous Findings Status

### ARCH-P0-001: Single Droplet is a Single Point of Failure

**Status:** STILL OPEN
**Evidence:** All 5 services remain on a single s-2vcpu-2gb droplet. infra/terraform/digitalocean/droplet.tf and infra/digitalocean/docker-compose.yml unchanged. No secondary standby droplet or failover mechanism implemented.
**Recommendation:** No change from previous. This is a known cost/risk tradeoff.

### ARCH-P0-002: No Database Replication or Failover

**Status:** STILL OPEN
**Evidence:** Single SUPABASE_URL, no read replica, no connection pooling config. This is a hosted Supabase concern.
**Recommendation:** No change from previous. Supabase Pro plan provides automated backups but not read replicas.

### ARCH-P0-003: Service Role Key Used for All DB Operations

**Status:** STILL OPEN (by-design)
**Evidence:** All routes continue to use getSupabaseAdmin() which bypasses RLS. This is a documented by-design decision. Tenant isolation is enforced at the application layer via requireOrgAccess().
**Recommendation:** Document the blast radius. No code change needed.

### ARCH-P1-001: No Health Check on Worker Consumer

**Status:** PARTIALLY RESOLVED
**Evidence:** The deploy workflow now checks worker health via SSH (deploy-do.yml lines 305-307). However, the docker-compose.yml worker service (lines 57-87) still lacks a Docker HEALTHCHECK directive. The API and Redis services have healthchecks, but the worker does not.
**Recommendation:** Add a Docker HEALTHCHECK to the worker service in docker-compose.yml.

### ARCH-P1-002: No Retry/Timeout on Worker External Calls

**Status:** RESOLVED
**Evidence:** The new webhook-dispatcher.ts (apps/worker/src/tasks/webhook-dispatcher.ts) and the API lib/webhook-dispatcher.ts both use AbortController.timeout() for outbound HTTP calls. The module-tasks.ts (apps/worker/src/tasks/module-tasks.ts) implementations use try/catch with error handling. The HttpClient in apps/api/src/lib/http-client.ts already has timeout and retry logic.
**Recommendation:** No action needed.

### ARCH-P2-001: No WebSocket for Real-time Notifications

**Status:** PARTIALLY RESOLVED
**Evidence:** The SSE endpoint at GET /api/v1/notifications/stream (apps/api/src/routes/notifications.ts lines 15-50) now has a keepalive interval (30s) to prevent proxy idle connection drops. The NotificationBell component (apps/web/components/NotificationBell.tsx) connects to this SSE stream (line 79-95). SSE is used instead of WebSocket, which is acceptable for this use case. However, the SSE connection uses EventSource from the browser, which is a one-directional approach.
**Recommendation:** The SSE keepalive fix resolves the connection stability concern. Consider this as addressed.

### ARCH-P2-002: No Connection Pool Management in SDK

**Status:** STILL OPEN
**Evidence:** No keepalive configuration detected in the SDK client.

### ARCH-P2-003: In-Memory Cache Without Redis is Per-Instance

**Status:** RESOLVED
**Evidence:** The cache middleware (apps/api/src/middleware/cache.ts) now has a documented design note (lines 8-15) explaining that Redis is required for horizontal scaling. The in-memory fallback is explicitly documented as single-instance only.
**Recommendation:** No action needed.

## NEW Architecture Findings

### ARCH-NEW-001: Prometheus Metrics Endpoint Exposed

**Severity:** P2 (improvement)
**Location:** apps/api/src/app.ts line 126, apps/api/src/lib/metrics.ts
**Evidence:** A new /metrics endpoint exposes Prometheus metrics at the application level. The metrics.ts file defines counters and histograms for HTTP requests, DB queries, webhook deliveries, auth attempts, and more. The request-id middleware (apps/api/src/middleware/request-id.ts) now records HTTP request metrics.
**Recommendation:** Ensure the /metrics endpoint is not publicly accessible in production. Consider adding authentication or network-level restrictions.

### ARCH-NEW-002: Outbound Webhook Dispatcher Architecture

**Severity:** P2 (improvement)
**Location:** apps/api/src/lib/webhook-dispatcher.ts, apps/worker/src/tasks/webhook-dispatcher.ts
**Evidence:** A new dual-layer webhook dispatching architecture has been implemented. The API layer (lib/webhook-dispatcher.ts) provides synchronous dispatch, while the worker layer (tasks/webhook-dispatcher.ts) provides async dispatch via BullMQ. Both support HMAC-SHA256 signature verification.
**Recommendation:** Noted as improvement. No action needed.

### ARCH-NEW-003: Performance Indexes Added

**Severity:** P2 (improvement)
**Location:** supabase/migrations/5302102_add_performance_indexes.sql
**Evidence:** New migration adds GIN trigram indexes for full-text search on profiles, organizations, tickets, and projects. Also adds composite indexes for audit_logs, tickets, projects, notifications, and document_versions.
**Recommendation:** Noted as improvement. No action needed.

## Architecture Score: 8/10 (unchanged)

### Summary of Changes

| Previous Finding                    | Severity | Status                 |
| ----------------------------------- | -------- | ---------------------- |
| ARCH-P0-001: Single droplet SPOF    | P0       | STILL OPEN             |
| ARCH-P0-002: No DB replication      | P0       | STILL OPEN             |
| ARCH-P0-003: Service role key usage | P0       | STILL OPEN (by-design) |
| ARCH-P1-001: Worker health check    | P1       | PARTIALLY RESOLVED     |
| ARCH-P1-002: Worker timeout/retry   | P1       | RESOLVED               |
| ARCH-P2-001: No WebSocket           | P2       | PARTIALLY RESOLVED     |
| ARCH-P2-002: SDK connection pool    | P2       | STILL OPEN             |
| ARCH-P2-003: In-memory cache        | P2       | RESOLVED               |

**Resolution rate: 3/8 resolved or partially resolved (37%)**
