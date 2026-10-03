# Architecture and Runtime Topology Audit

## Audit Metadata

- **Run ID:** `20260728-0142-develop-21a10d6`
- **Finding Area Code:** ARCH

## Executive Summary

MCT Portal is a **3-tier hybrid monolithic architecture** deployed on a single DigitalOcean droplet behind Caddy, with hosted Supabase. 4 application packages (API, Web, Worker, SDK) + 2 shared (ui, config) orchestrated by Turborepo. 1,530 tests pass, TypeScript/ESLint clean.

## Architecture Findings

### ARCH-P0-001: Single Droplet is a Single Point of Failure

**Location:** `infra/terraform/digitalocean/droplet.tf`, `infra/digitalocean/docker-compose.yml`
**Evidence:** All 5 services on a single `s-2vcpu-2gb` droplet. No load balancer, no replica set, no multi-AZ.
**Risk:** Hardware failure takes down the entire platform.
**Recommendation:** Implement secondary standby droplet with automated failover.

### ARCH-P0-002: No Database Replication or Failover

**Location:** `apps/api/src/services/supabase.ts`
**Evidence:** Single `SUPABASE_URL`, no read replica, no connection pooling config.
**Risk:** Supabase outage = complete platform outage.
**Recommendation:** Configure Supabase read replicas and connection fallback.

### ARCH-P0-003: Service Role Key Used for All DB Operations

**Location:** `apps/api/src/services/supabase.ts`, all route files
**Evidence:** All routes use `getSupabaseAdmin()` which bypasses RLS. Tenant isolation is entirely at application layer.
**Risk:** Bug in `requireOrgAccess()` could expose all data.
**Recommendation:** By-design, but document blast radius. Consider user-scoped client for tenant queries.

### ARCH-P1-001: No Health Check on Worker Consumer

**Location:** `infra/digitalocean/docker-compose.yml:88`
**Recommendation:** Add HEALTHCHECK to worker service.

### ARCH-P1-002: No Retry/Timeout on Worker External Calls

**Location:** Worker task files use raw `fetch()` without timeout/retry.
**Recommendation:** Reuse `HttpClient` or add `AbortController.timeout()`.

### ARCH-P2-001: No WebSocket for Real-time Notifications

**Evidence:** 30s polling. SSE endpoint exists but not wired in client.
**Recommendation:** Wire SSE endpoint into NotificationBell component.

### ARCH-P2-002: No Connection Pool Management in SDK

**Recommendation:** Configure `keepalive: true` on fetch options.

### ARCH-P2-003: In-Memory Cache Without Redis is Per-Instance

**Recommendation:** Document Redis required for horizontal scaling.

## Architecture Score: 8/10
