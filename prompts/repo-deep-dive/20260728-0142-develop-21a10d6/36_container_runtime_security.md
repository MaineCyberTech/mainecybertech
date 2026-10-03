# Container Runtime Security Audit

## Audit Metadata

- **Run ID:** `20260728-0142-develop-21a10d6`
- **Finding Area Code:** CTNR

## Executive Summary

Strong baseline: all 3 Dockerfiles use non-root users, HEALTHCHECK, multi-stage builds, `--frozen-lockfile`, `--prod` (API/Worker). Key gaps: no `cap_drop`, `security_opt`, or `read_only` on any container; compose healthchecks missing for Worker, Web, Caddy; no SHA-pinned base images.

**Overall Score: 8.3/10**

## High Findings

### CTNR-006: No Security Hardening on Containers

**Severity:** HIGH
**Evidence:** No service uses `cap_drop: ALL`, `security_opt: [no-new-privileges:true]`, or `read_only: true` in docker-compose.yml.
**Recommendation:** Add to all 5 services with tmpfs for writable paths.

### CTNR-007: Missing Compose Healthchecks for Worker, Web, Caddy

**Severity:** HIGH
**Evidence:** Compose defines healthchecks only for Redis and API. Worker, Web, Caddy have none.
**Recommendation:** Add healthcheck blocks for all services.

## Medium Findings

### CTNR-001: No SHA-Pinned Base Images

**Evidence:** All 3 Dockerfiles use `node:20-alpine` (major.minor tag) instead of SHA digest.
**Recommendation:** Pin to `node:20-alpine@sha256:...` and set up Dependabot for digest updates.

### CTNR-008: Redis Password in Command Line

**Evidence:** `docker-compose.yml:16` — `--requirepass ${REDIS_PASSWORD:-mct-redis-dev}` visible in `docker ps` output.
**Recommendation:** Use config file or env-only auth.

### CTNR-012: Missing HSTS Header in Caddyfile

**Evidence:** Caddyfile uses custom TLS certs but no explicit `Strict-Transport-Security` header.
**Recommendation:** Add `Strict-Transport-Security "max-age=63072000; includeSubDomains; preload"`.

## Quick Wins

1. Pin `node:20-alpine` to SHA digest — 30 min
2. Add HSTS header to Caddyfile — 5 min
3. Add `EXPOSE 3001` to worker Dockerfile — 2 min
4. Add compose healthchecks for worker/web/caddy — 30 min
5. Add `cap_drop: ALL` and `security_opt` — 30 min
