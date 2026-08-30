# Container Runtime Security Audit

## Audit Metadata

- Audit name: repo-deep-dive
- Run: 20260730-0650-develop-62da92c
- Repository: mainecybertech/mainecybertech (monorepo)
- Branch: develop
- Commit SHA: 62da92c
- Generated at: 2026-07-30
- Auditor: Principal Repository Auditor (AI)
- Area code: CTR
- Output path: docs/audits/repo-deep-dive/20260730-0650-develop-62da92c/36_container_runtime_security.md
- Scope limitations: Images not pulled and scanned; analysis based on Dockerfile contents, docker-compose configuration, and CI workflow build patterns.

## Scope

Reviewed all 3 Dockerfiles (api/web/worker), docker-compose.yml, .dockerignore, and deploy CI workflow for container hardening. Assessed base image selection, multi-stage builds, non-root users, health checks, secrets injection, privileges, and runtime security configurations.

## Evidence Reviewed

| Evidence | Type | Why relevant | Notes |
|----------|------|-------------|-------|
| `apps/api/Dockerfile` | Dockerfile | API container | Multi-stage, non-root, HEALTHCHECK |
| `apps/web/Dockerfile` | Dockerfile | Web container | Multi-stage, non-root, HEALTHCHECK, build args |
| `apps/worker/Dockerfile` | Dockerfile | Worker container | Multi-stage, non-root, HEALTHCHECK |
| `infra/digitalocean/docker-compose.yml` | Compose | Runtime config | Memory limits, health checks, restart policy |
| `.dockerignore` | Config | Build context | Excludes docs/infra/supabase/ |
| `.github/workflows/build-push.yml` | Build | Docker build CI | GHA cache, no security scanning |
| `.github/workflows/deploy-do.yml` | Deploy | Container deployment | Pulls GHCR images, runs compose up |

## Executive Summary

Container security is solid across all 3 services. Every Dockerfile uses multi-stage builds, non-root users, HEALTHCHECK, production-only dependency installation (`--prod --ignore-scripts`), and explicit `chown` for app directories. The docker-compose.yml includes memory limits on all services. The `.dockerignore` is comprehensive and excludes unnecessary build context files (docs, infra, supabase). Software is built in builder stages and only the compiled output is copied to runtime images. No secrets are baked into images — all are injected as runtime environment variables.

### Strengths
- All containers run as non-root (appuser:appuser or nextjs:nodejs)
- All Dockerfiles use multi-stage builds
- HEALTHCHECK configured for all 3 application containers
- Production-only dependency install (`--prod --ignore-scripts`)
- `chown -R appuser:appuser /app` before USER switch
- `.dockerignore` comprehensive — excludes docs, infra, supabase, scripts
- Docker Compose has `mem_limit` on all services
- Graceful shutdown implemented in API and Worker (SIGTERM handlers)
- All services use `restart: unless-stopped`

### Major Risks
- Base images not pinned to SHA digest (`node:20-alpine` mutable tag)
- Docker Compose `cap_drop`, `security_opt`, `read_only`, and `tmpfs` not configured
- No `USER` directive in docker-compose (relies on Dockerfile USER)
- Caddy container runs as default (caddy user, but not explicit)
- Worker Dockerfile has no `EXPOSE` directive
- Container vulnerability scanning not configured
- `docker image prune -af` in deploy workflow may remove cached layers needed for rollback

## Domain Scorecard

| Category | Score | Evidence | Gap | Recommended action |
|----------|:-----:|----------|-----|-------------------|
| Dockerfiles | 4 | Multi-stage, non-root, HEALTHCHECK | No SHA pin on base images | Pin to digest |
| Compose | 3 | mem_limit, healthchecks, restart policy | No security_opt, cap_drop, read_only | Add runtime security |
| Build stages | 5 | Builder → runtime copy | None | — |
| Base images/tags | 2 | node:20-alpine | No SHA digest pin | Pin to digest |
| Package installs | 5 | --prod --ignore-scripts in runtime | None | — |
| Non-root users | 5 | appuser, nextjs user, USER directive | None | — |
| File permissions | 4 | chown -R before USER | None | — |
| Entrypoints | 4 | node dist/main.js or server.js | No tini/init process | Consider adding tini |
| Health checks | 4 | All 3 app containers | Worker health check is non-fatal in deploy | Make fatal |
| Ports | 4 | EXPOSE 4000/3000 defined | Worker has no EXPOSE | Add EXPOSE to worker |
| Build args | 4 | Web has 4 NEXT_PUBLIC_* args | None | — |
| Runtime env | 3 | docker-compose env block | Secrets passed as env vars | Consider env_file |

## Detailed Review

### Item: Docker Compose Runtime Security

- Evidence: `infra/digitalocean/docker-compose.yml` lines 1-122
- What it does: Defines 5 services (redis, api, worker, web, caddy) with environment variables, health checks, memory limits, and dependencies
- Current controls:
  - `mem_limit` on all services (api: 256m, worker: 256m, web: 256m, redis: 48m, caddy: 64m)
  - Health checks on redis, api, and (indirectly) via deploy workflow
  - `restart: unless-stopped`
  - `depends_on` for service ordering
- Missing controls:
  - No `security_opt` (no `no-new-privileges:true`)
  - No `cap_drop` (containers retain default Linux capabilities)
  - No `read_only` root filesystem
  - No `tmpfs` for writable directories (if read_only were set)
  - No explicit `user` directive in compose (relies on Dockerfile USER)
  - Caddy volume mounts `./certs` directory (`:ro` is good)
- Risks: Containers have unnecessary Linux capabilities, writable filesystems, and no privilege escalation protection.

### Item: Dockerfile Hardenability

- Evidence: All 3 Dockerfiles, line-by-line
- What they do:
  - **API** (`apps/api/Dockerfile`): npm install → build → runtime copy of `dist/` → `chown -R` → USER appuser → HEALTHCHECK
  - **Web** (`apps/web/Dockerfile`): deps stage → builder stage with Webpack → standalone output → runtime with nextjs user → HEALTHCHECK
  - **Worker** (`apps/worker/Dockerfile`): Same pattern as API
- Observations:
  - No `.dockerignore` issues: it excludes docs, infra, supabase effectively
  - No secrets copied into images (all env vars at runtime)
  - Web Dockerfile uses `--chown=nextjs:nodejs` for COPY (good practice)
  - `rm -rf /app/apps/web/.next/cache` in builder reduces image size
  - No `tini` or `dumb-init` for proper signal handling (Node handles this reasonably)
- Risks: Low — Dockerfiles follow security best practices overall.

## Findings

### Finding ID: CTR-P1-001 - No container runtime security hardening in docker-compose

- Severity: P1 - High
- Confidence: High
- Area: Container Runtime
- Evidence:
  - `infra/digitalocean/docker-compose.yml` lines 1-122: No `cap_drop`, `security_opt`, or `read_only` on any service
- What is happening: All containers run with default Docker security settings — full capability set, writable root filesystem, and privilege escalation allowed.
- Why it matters: If an attacker gains code execution in a container, they have unnecessary capabilities that could facilitate container escape or host compromise.
- User / business impact: Expanded blast radius from container compromise.
- Security / privacy / reliability impact: High — container escape risk.
- Recommended fix: Add to each service in docker-compose.yml:
  ```yaml
  security_opt:
    - no-new-privileges:true
  cap_drop:
    - ALL
  cap_add:
    - NET_BIND_SERVICE  # For listening on privileged ports
    # - CHOWN, DAC_OVERRIDE, FOWNER, SETUID, SETGID as needed
  ```
  For the application services (api, worker, web), add:
  ```yaml
  read_only: true
  tmpfs:
    - /tmp
  ```
- Suggested validation: Run `docker inspect` on running containers to verify capabilities.
- Owner suggestion: Infrastructure team
- Effort estimate: 2 hours (testing with read_only may need adjustments for Next.js)
- Dependencies: Testing with web container — Next.js may need writable /tmp or .next directory.
- Status: Open

### Finding ID: CTR-P1-002 - Docker base images not pinned to SHA digest

- Severity: P1 - High
- Confidence: High
- Area: Container Build Security
- Evidence:
  - `apps/api/Dockerfile:1`: `FROM node:20-alpine AS base`
  - `apps/web/Dockerfile:1`: `FROM node:20-alpine AS base`
  - `apps/worker/Dockerfile:1`: `FROM node:20-alpine AS base`
  - `infra/digitalocean/docker-compose.yml:15`: `image: redis:7-alpine`
  - `infra/digitalocean/docker-compose.yml:104`: `image: caddy:2-alpine`
- What is happening: All base images use mutable version tags, not SHA digests. The `node:20-alpine` tag can change over time, introducing unexpected changes or vulnerabilities.
- Why it matters: Same as SC-P2-002 — mutable base images are a supply chain risk. A compromised Docker Hub or registry could inject malicious code into a popular tag.
- User / business impact: Non-reproducible builds; potential supply chain compromise.
- Recommended fix: Pin all `FROM` instructions and `image:` references to SHA digests:
  ```
  FROM node:20-alpine@sha256:<digest>
  ```
- Suggested validation: Image builds succeed with SHA pinned base images.
- Owner suggestion: Infrastructure team
- Effort estimate: 1 hour
- Status: Open

### Finding ID: CTR-P2-001 - Worker Dockerfile missing EXPOSE directive

- Severity: P2 - Medium
- Confidence: High
- Area: Container Configuration
- Evidence:
  - `apps/worker/Dockerfile` lines 1-39: No `EXPOSE` directive
  - Worker health server listens on port 3001 (HEALTH_PORT)
- What is happening: The worker Dockerfile does not declare any port via `EXPOSE`. While this doesn't prevent the health server from working (ports are openable without EXPOSE), it hides the fact that port 3001 should be available for health checks.
- Why it matters: `EXPOSE` serves as documentation for operators and is used by image inspection tools to determine which ports the container uses.
- User / business impact: Low — health check still works via docker-compose.
- Recommended fix: Add `EXPOSE 3001` to worker Dockerfile.
- Suggested validation: `docker inspect` shows port 3001.
- Owner suggestion: Infrastructure team
- Effort estimate: 5 minutes
- Status: Open

### Finding ID: CTR-P2-002 - No init process (tini) for signal handling

- Severity: P2 - Medium
- Confidence: Medium
- Area: Container Runtime
- Evidence:
  - All 3 Dockerfiles use `CMD ["node", "dist/main.js"]` or `CMD ["node", "apps/web/server.js"]`
  - No `tini` or `dumb-init` installed or used
- What is happening: Node.js runs as PID 1 in the container. Node doesn't handle SIGTERM properly as PID 1 (in some cases), and zombie processes are not reaped.
- Why it matters: While Node 20 handles SIGTERM better than older versions, PID 1 issues can cause delayed or failed container shutdowns, especially when Node spawns child processes.
- User / business impact: Potential slow shutdowns during rolling updates or scaling events.
- Recommended fix: Use `tini` as init process:
  ```
  RUN apk add --no-cache tini
  ENTRYPOINT ["/sbin/tini", "--"]
  CMD ["node", "dist/main.js"]
  ```
- Suggested validation: `docker compose stop` completes within timeout.
- Owner suggestion: Infrastructure team
- Effort estimate: 1 hour
- Status: Open

### Finding ID: CTR-P3-001 - docker image prune -af in deploy workflow may remove rollback images

- Severity: P3 - Low
- Confidence: Medium
- Area: Container Operations
- Evidence:
  - `deploy-do.yml:251`: `docker image prune -af 2>/dev/null || true`
  - The prune runs before pulling new images
- What is happening: The deploy workflow aggressively prunes all unused images (`-af` flag) before pulling new images. This removes the currently running image's cached layers, which are needed for a quick rollback.
- Why it matters: If the new image has issues, rolling back means pulling the old image from GHCR again (slow) instead of using a cached layer.
- User / business impact: Rollback takes longer if prune removes cached previous images.
- Recommended fix: Use targeted cleanup instead:
  ```bash
  # Remove old images except current and new
  docker images --filter "reference=ghcr.io/*/mct-*" --format "{{.Repository}}:{{.Tag}}" | grep -v "$IMAGE_TAG" | xargs -r docker rmi 2>/dev/null || true
  ```
- Suggested validation: Previous image remains after deploy completes.
- Owner suggestion: Infrastructure team
- Effort estimate: 30 minutes
- Status: Open

## Risks

| Risk | Severity | Likelihood | Impact | Evidence | Mitigation |
|------|----------|------------|--------|----------|------------|
| Container escape via capabilities | P1 | Low | Very High | No cap_drop in compose | Add security hardening |
| Mutable base images | P1 | Low | High | node:20-alpine tags | Pin to SHA |
| Zombie processes | P2 | Low | Low-Medium | No tini in containers | Add tini |
| Slower rollback after prune | P3 | Low | Low | docker image prune -af | Use targeted cleanup |

## Findings Summary

### Finding ID: CTR-P1-001 - No container runtime security hardening in docker-compose

- Severity: P1
- Confidence: High
- What: Docker-compose missing `cap_drop`, `security_opt`, and `read_only`
- Evidence: docker-compose.yml lines 1-122 — no security options
- Fix: Add `cap_drop: ALL`, `security_opt: no-new-privileges:true`, `read_only: true` + tmpfs

### Finding ID: CTR-P1-002 - Docker base images not pinned to SHA digest

- Severity: P1
- Confidence: High
- What: All FROM instructions use mutable tags
- Evidence: All 3 Dockerfiles + docker-compose.yml
- Fix: Pin all `FROM` and `image:` to SHA digests

### Finding ID: CTR-P2-001 - Worker Dockerfile missing EXPOSE directive

- Severity: P2
- Confidence: High
- What: No EXPOSE port for health check server
- Evidence: Worker Dockerfile
- Fix: Add `EXPOSE 3001`

### Finding ID: CTR-P2-002 - No init process for signal handling

- Severity: P2
- Confidence: Medium
- What: Node runs as PID 1 without tini
- Evidence: All 3 Dockerfiles CMD
- Fix: Install tini, add ENTRYPOINT

### Finding ID: CTR-P3-001 - Aggressive docker image prune may affect rollback

- Severity: P3
- Confidence: Medium
- What: `docker image prune -af` removes cached previous images
- Evidence: deploy-do.yml:251
- Fix: Use targeted image cleanup

## Recommendations

### Immediate / Release Blocking

1. Add runtime security hardening to docker-compose (CTR-P1-001)

### This Week

2. Pin Docker base images to SHA digests (CTR-P1-002)
3. Add EXPOSE to worker Dockerfile (CTR-P2-001)

### This Month

4. Add tini as init process to all containers (CTR-P2-002)
5. Fix docker image prune in deploy workflow (CTR-P3-001)

### Later / Platform Evolution

6. Add Containerfile linter (hadolint) to CI
7. Add container vulnerability scanning (Trivy)

## Quick Wins

| Quick win | Why it helps | Files likely involved | Validation |
|-----------|-------------|----------------------|------------|
| Add EXPOSE to worker | Documentation | worker/Dockerfile | docker inspect |
| Fix prune command | Faster rollback | deploy-do.yml | Verify old image remains |
| Pin base images | Build reproducibility | All 3 Dockerfiles | Build succeeds |

## Hardening Backlog

| Backlog item | Priority | Owner suggestion | Effort | Dependency |
|-------------|----------|-----------------|--------|------------|
| Compose runtime security | P1 | Infrastructure | 2 hours | Testing with web |
| Docker SHA pin | P1 | Infrastructure | 1 hour | Dependabot updates |
| Worker EXPOSE | P2 | Infrastructure | 5 min | None |
| Add tini | P2 | Infrastructure | 1 hour | Testing |
| Fix prune command | P3 | Infrastructure | 30 min | None |

## Suggested Tests

- Container capability audit: `docker run --rm -it <image> capsh --print`
- Test that read_only root works with web container (Next.js needs /tmp)
- Test SIGTERM delivery with and without tini

## Suggested Documentation Updates

- Add container security hardening to deploy documentation
- Document base image update process (SHA pin updates via Dependabot)

## Open Questions

| Question | Why it matters | Evidence needed |
|----------|---------------|----------------|
| Does Next.js standalone mode work with read_only root filesystem? | May need tmpfs for .next/cache | Test build |
| Are any child processes spawned that need zombie reaping? | Determines if tini is needed | Code review of process spawning |

## Appendix

### Dockerfile Hardening Checklist

| Hardening | API | Web | Worker |
|-----------|:---:|:---:|:------:|
| Non-root user | ✅ appuser | ✅ nextjs | ✅ appuser |
| Multi-stage build | ✅ | ✅ | ✅ |
| HEALTHCHECK | ✅ | ✅ | ✅ |
| EXPOSE port | ✅ 4000 | ✅ 3000 | ❌ |
| --prod install | ✅ | N/A | ✅ |
| chown before USER | ✅ | ✅ (via --chown) | ✅ |
| SHA-pinned base | ❌ | ❌ | ❌ |
| tini init | ❌ | ❌ | ❌ |

### Docker Compose Security Options (Recommended)

```yaml
services:
  api:
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE
    read_only: true
    tmpfs:
      - /tmp
```
