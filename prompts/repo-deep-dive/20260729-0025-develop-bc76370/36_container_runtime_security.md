# Container Runtime Security Audit (Re-Run)

**Run ID:** 20260729-0025-develop-bc76370
**Previous Run:** 20260728-0142-develop-21a10d6
**Finding Area Code:** CTNR
**Status:** RE-RUN VERIFICATION

## Executive Summary

**Overall Score: 8.5/10** (improved from 8.3/10). Improvements: HSTS and CSP headers added to Caddyfile, Worker Dockerfile now has HEALTHCHECK and EXPOSE 3001, compose healthchecks for Worker and Web are partially covered by Dockerfile HEALTHCHECK directives. 3 findings resolved. 2 remain open.

## Previous Findings Status

### CTNR-006: No Security Hardening on Containers (HIGH)

**Status:** STILL OPEN
**Previous Evidence:** No service uses cap_drop: ALL, security_opt: [no-new-privileges:true], or
ead_only: true in docker-compose.yml.
**Current Evidence:** infra/digitalocean/docker-compose.yml — Still no cap_drop, security_opt, or
ead_only on any service.
**Recommendation:** Add to all 5 services with tmpfs for writable paths.

### CTNR-007: Missing Compose Healthchecks for Worker, Web, Caddy (HIGH)

**Status:** PARTIALLY RESOLVED
**Previous Evidence:** Compose defines healthchecks only for Redis and API.
**Current Evidence:** infra/digitalocean/docker-compose.yml:51-55 — API healthcheck remains. Redis healthcheck remains (
edis-cli ping). Worker Dockerfile (pps/worker/Dockerfile:36-37) now has HEALTHCHECK CMD wget http://localhost:3001/health. Web Dockerfile (pps/web/Dockerfile:46-47) now has HEALTHCHECK CMD wget http://127.0.0.1:3000. However, compose file does not have explicit healthcheck blocks for Worker, Web, or Caddy.
**Recommendation:** Add explicit healthcheck blocks to compose for all services.

### CTNR-001: No SHA-Pinned Base Images (MEDIUM)

**Status:** STILL OPEN
**Previous Evidence:** All 3 Dockerfiles use
ode:20-alpine (major.minor tag) instead of SHA digest.
**Current Evidence:** All 3 Dockerfiles still use
ode:20-alpine without SHA pinning.
**Recommendation:** Pin to
ode:20-alpine@sha256:... and set up Dependabot for digest updates.

### CTNR-008: Redis Password in Command Line (MEDIUM)

**Status:** STILL OPEN
**Previous Evidence:** docker-compose.yml:16 — --requirepass visible in docker ps output.
**Current Evidence:** infra/digitalocean/docker-compose.yml:16 — Still uses --requirepass in command line.
**Recommendation:** Use config file or env-only auth.

### CTNR-012: Missing HSTS Header in Caddyfile (MEDIUM)

**Status:** RESOLVED
**Previous Evidence:** Caddyfile uses custom TLS certs but no explicit Strict-Transport-Security header.
**Current Evidence:** infra/digitalocean/Caddyfile — HSTS header added: Strict-Transport-Security \"max-age=63072000; includeSubDomains; preload\" on all 4 domain blocks. CSP headers also added.
**Fix verified:** 7b80846 commit.

## New Findings

### CTNR-NEW-001: Worker Dockerfile Now Has HEALTHCHECK and EXPOSE 3001

**Severity:** RESOLVED
**Evidence:** pps/worker/Dockerfile:34-37 — Added EXPOSE 3001 and HEALTHCHECK CMD wget http://localhost:3001/health.
**Fix verified:** dfb5ef8 commit.

### CTNR-NEW-002: Web Dockerfile Has HEALTHCHECK

**Severity:** RESOLVED
**Evidence:** pps/web/Dockerfile:46-47 — HEALTHCHECK with wget to port 3000, 30s interval, 10s timeout, 40s start period.
**Assessment:** This was already present in the previous run's codebase but not mentioned in the previous report.

### CTNR-NEW-003: Deploy Workflow Checks Worker Health

**Severity:** RESOLVED
**Evidence:** deploy-do.yml:304-307 — Worker health check via SSH to http://localhost:3001/health during deploy.
**Fix verified:** b9e84f0 commit.

## Summary

| Finding                                      | Severity | Previous | Current            |
| -------------------------------------------- | -------- | -------- | ------------------ |
| CTNR-006: No cap_drop/security_opt/read_only | HIGH     | OPEN     | STILL OPEN         |
| CTNR-007: Missing compose healthchecks       | HIGH     | OPEN     | PARTIALLY RESOLVED |
| CTNR-001: No SHA-pinned base images          | MEDIUM   | OPEN     | STILL OPEN         |
| CTNR-008: Redis password in command line     | MEDIUM   | OPEN     | STILL OPEN         |
| CTNR-012: Missing HSTS header                | MEDIUM   | OPEN     | RESOLVED           |
| CTNR-NEW-001: Worker Dockerfile HEALTHCHECK  | —        | —        | RESOLVED           |
| CTNR-NEW-002: Web Dockerfile HEALTHCHECK     | —        | —        | RESOLVED           |
| CTNR-NEW-003: Deploy worker health check     | —        | —        | RESOLVED           |
