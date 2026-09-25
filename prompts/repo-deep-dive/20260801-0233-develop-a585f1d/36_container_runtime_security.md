# Container Runtime Security Audit

## Audit Metadata

- Audit name: repo-deep-dive
- Run: 20260801-0233-develop-a585f1d
- Repository: MaineCyberTech/mainecybertech
- Branch: develop
- Commit SHA: a585f1d
- Generated at: 2026-08-01
- Auditor: principal-level repository auditor (fresh pass)
- Area code: CTR
- Output path: prompts/repo-deep-dive/20260801-0233-develop-a585f1d/36_container_runtime_security.md
- Scope limitations:
  - No live image build, `docker inspect`, or runtime scan was performed; analysis is against Dockerfile/compose/.dockerignore content.
  - Base-image digest freshness against the registry was not validated (offline).
  - Droplet runtime state (actual `docker compose ps`) was not inspected.

## Scope

Reviewed `apps/{api,worker,web}/Dockerfile`, `.dockerignore`, `infra/digitalocean/docker-compose.yml`, `infra/digitalocean/Caddyfile`, root `docker-compose.yml` (local), and the image build/push path in CI (`.github/workflows/{build-push,deploy-do}.yml`). Cross-cutting scan/SBOM findings are in report 11; CI pinning/gates in report 10.

## Evidence Reviewed

| Evidence | Type | Why relevant | Notes |
| -------- | ---- | ------------ | ----- |
| `apps/api/Dockerfile` | Dockerfile | API image | 40 lines; base + runtime stages; USER appuser; HEALTHCHECK |
| `apps/worker/Dockerfile` | Dockerfile | Worker image | 39 lines; same pattern; no EXPOSE |
| `apps/web/Dockerfile` | Dockerfile | Web image | 51 lines; deps/builder/runner stages; USER nextjs |
| `.dockerignore` | Config | Build context hygiene | Excludes .env, node_modules, docs, infra |
| `infra/digitalocean/docker-compose.yml` | Compose | Prod stack | 145 lines; cap_drop ALL; read_only; mem_limits; Redis default password |
| `infra/digitalocean/Caddyfile` | Config | TLS proxy + headers | Origin cert TLS; strong security headers |
| Root `docker-compose.yml` | Compose | Local stack | dev-only; env_file based |
| `.github/workflows/{build-push,deploy-do}.yml` | Workflows | Image build/deploy | buildx + gha cache; SHA tags |

## Executive Summary

Container posture is **good and materially hardened**, with a few sharp edges.

Strengths: all three images use **SHA-pinned** `node:20-alpine` base images (multi-arch digest `fb4cd12c…`), including for the runtime stage; API and worker are **multi-stage** builds that copy only `dist/` + `package.json` into a fresh runtime stage (no source, no build toolchain); all three run as **non-root** (`appuser` uid 1001, `nextjs` uid 1001) with `chown`/`--chown`; production dependency installs use `--prod --ignore-scripts` (no dev deps, no arbitrary postinstall); Dockerfiles carry `HEALTHCHECK` directives; compose applies `cap_drop: ALL` + `no-new-privileges: true` to api/worker/web/redis/caddy, `read_only: true` root filesystems with `tmpfs /tmp` for api/worker/redis, per-service `mem_limit`, and `redis:7-alpine`/`caddy:2-alpine` are also SHA-pinned. `deploy-do.yml` writes the droplet `.env` with `chmod 600` and uses SHA-tagged immutable GHCR images.

Weaknesses:
1. **Redis runs with a hardcoded default password** (`mct_redis_changeme_in_production`) because the deploy pipeline never provisions `REDIS_PASSWORD` (compose line 24 default + deploy-do.yml env loop omits it). This is the top container finding (P1).
2. **Nonce-based CSP is not actually enforced**: `apps/web/middleware.ts` generates a nonce and attaches it to scripts, but the CSP directive is `script-src 'self' 'unsafe-inline'` — no `'nonce-...'`. And the Caddy edge layer overwrites the app CSP with its own `script-src 'self'` header, which breaks the nonce approach entirely (and likely blocks GA/Tawk external scripts). Two conflicting CSP layers with neither functioning as designed (P1/P2).
3. **No container scanning / SBOM / image signing** anywhere in CI (P2; cross-ref SC-P1-001).
4. Compose `caddy` container is **not** `read_only`, has no `tmpfs`, and mounts the compose directory; worker has **no `EXPOSE`** and **no `healthcheck` in compose** (image healthcheck exists); `api` compose `depends_on` redis only `service_started` (no health condition).
5. The API/worker runtime stages re-run `pnpm install --prod` — network/registry dependency at image build time (fine but worth noting), and the install runs as root before `USER appuser`.
6. `NEXT_PUBLIC_*` build args baked into the web image are public-by-design (not secrets), but `NEXT_PUBLIC_API_URL` compile-time inlining plus a runtime env override (compose sets `NEXT_PUBLIC_API_URL=http://api:4000`) creates a client/server URL mismatch risk.
7. The root `docker-compose.yml` (local) builds from the monorepo root and uses `.env.local` — dev only; acceptable.
8. API/worker Dockerfiles copy only `apps/<app>` + root manifests but **not `packages/`**, relying on pnpm filtered install to resolve the workspace. If `@mct/config` were imported at runtime this would fail; today it is not imported at runtime (see report 11 SC-P3-001). Worth an explicit verification.

## Inventory

| Item | Path / symbol | Purpose | Current state | Risk | Notes |
| ---- | ------------- | ------- | ------------- | ---- | ----- |
| API image | `apps/api/Dockerfile` | Express API | Multi-stage, non-root, HEALTHCHECK | Low | no EXPOSE concern (4000 set) |
| Worker image | `apps/worker/Dockerfile` | BullMQ worker | Multi-stage, non-root, HEALTHCHECK | Low | no EXPOSE 3001 |
| Web image | `apps/web/Dockerfile` | Next.js standalone | 3-stage, non-root nextjs | Low-Med | CSP/nonce mismatch; NEXT_PUBLIC inlining |
| Build context | `.dockerignore` | Hygiene | Excludes env/docs/node_modules | Low | good |
| Prod compose | `infra/digitalocean/docker-compose.yml` | DO stack | Hardened (caps/read_only/limits) | Med | Redis default password; caddy not read_only |
| Caddyfile | `infra/digitalocean/Caddyfile` | TLS + headers | Strong headers | Med | Overrides app CSP; breaks nonce scheme |
| CI build | build-push.yml / deploy-do.yml | Image build/deploy | SHA tags, buildx cache | Low | No scan/SBOM |

## Domain Scorecard

| Category         | Score | Evidence | Gap | Recommended action |
| ---------------- | ----: | -------- | --- | ------------------ |
| Dockerfiles      |    4 | 3 Dockerfiles, consistent | Worker no EXPOSE; API/worker install as root | Polish |
| Compose          |    3 | Hardened defaults | Redis default password; caddy not read_only | Fix Redis auth |
| Build stages     |    4 | Multi-stage for all 3 | deps re-install in runtime stage | Consider `pnpm deploy` for immutable prod tree |
| Base images/tags |    4 | SHA-pinned node/redis/caddy | No digest freshness check | Scheduled refresh |
| Package installs |    4 | `--prod --ignore-scripts` | Workspace copy gap (packages/ not copied) | Verify filtered install |
| Non-root users   |    4 | appuser/nextjs uid 1001 | install steps run as root pre-USER | Fine (multi-stage) |
| File permissions |    4 | chown/--chown, chmod 600 .env | Runtime fs not read-only in compose for web | Add read_only for web |
| Entrypoints      |    3 | `CMD node dist/main.js` / `server.js` | No signal forwarding wrapper | Verify graceful shutdown works in container |
| Health checks    |    3 | Image HEALTHCHECKs + compose | Worker missing compose healthcheck; api `depends_on` not health-gated | Add |
| Ports            |    4 | 4000/3001/3000/80/443 scoped | Worker no EXPOSE | Add EXPOSE 3001 |
| Build args       |    4 | Only NEXT_PUBLIC_* (non-secret) | URL inlining vs runtime env mismatch | Align client/server URL |
| Runtime env      |    3 | Secrets via env in compose from .env | REDIS_PASSWORD default; secrets readable via `docker inspect` | Switch to secrets/files |

## Detailed Review

### Item: API Dockerfile

- Evidence: `apps/api/Dockerfile` (40 lines).
- What it does: base stage (pnpm install + `pnpm build` → `dist`), runtime stage copies `dist` + `package.json`, `pnpm install --prod --ignore-scripts`, `USER appuser`, `HEALTHCHECK` against `/health`, `CMD node dist/main.js`.
- How it appears to work: Clean multi-stage separation; production-only deps; non-root runtime.
- Dependencies: Base image digest `fb4cd12c…`; pnpm; registry at image-build time.
- Current controls: SHA-pinned base; `--prod --ignore-scripts`; non-root; healthcheck; `EXPOSE 4000`.
- Missing controls: No image scan/SBOM (report 11); the prod install runs as root in the runtime stage (harmless post-`USER`, but pnpm store remains root-owned in `/app` — `chown -R` follows, so OK); `apps/api` copied without `packages/` (workspace resolution relies on filtered install).
- Risks: If `@mct/config` were ever imported at runtime, the build would break; otherwise low.
- Recommended improvement: Add a CI Trivy scan; optionally `pnpm deploy --prod` to materialize a production tree before COPY (removes runtime-stage install).
- Suggested tests: `docker build` + `docker run` as uid 1001 confirms `dist/main.js` executes and `/health` responds.
- Suggested docs: none.

### Item: Worker Dockerfile

- Evidence: `apps/worker/Dockerfile` (39 lines).
- What it does: Same pattern as API; `ENV HEALTH_PORT=3001`; `HEALTHCHECK` on `:3001/health`; `CMD node dist/main.js`.
- How it appears to work: Correct, non-root, prod-only deps.
- Dependencies: Same as API.
- Current controls: SHA-pinned base; non-root; healthcheck.
- Missing controls: No `EXPOSE 3001` (health port is internal-only; the compose worker is not port-published, so this is cosmetic); worker `HEALTHCHECK` in image is good.
- Risks: None material.
- Recommended improvement: Add `EXPOSE 3001` for documentation parity.
- Suggested tests: none.
- Suggested docs: none.

### Item: Web Dockerfile

- Evidence: `apps/web/Dockerfile` (51 lines) — deps → builder → runner; `ARG NEXT_PUBLIC_*`; `USER nextjs`; `HEALTHCHECK` with `--start-period=40s`; `CMD node apps/web/server.js` (standalone).
- What it does: Builds Next.js standalone output and runs as `nextjs`.
- How it appears to work: Standard hardened Next Dockerfile; `output: "standalone"` + `outputFileTracingRoot` in `next.config.mjs:14-17`.
- Dependencies: Base digest; `packages/` copied (correct); build args are non-secret public values.
- Current controls: Non-root; HEALTHCHECK; deps stage caching; builder cleans `.next/cache`.
- Missing controls: Web service in compose is not `read_only` (unlike api/worker/redis); client/server `NEXT_PUBLIC_API_URL` mismatch risk (compose sets runtime `NEXT_PUBLIC_API_URL=http://api:4000` at line 113 while the image inlines the public URL at build time).
- Risks: Runtime-env override of a build-time-inlined value does not re-inline for client components — the runtime `http://api:4000` only affects server components; client components keep the baked-in public URL. That is intentional (see AGENTS.md), but the compose line makes it look redundant and can confuse operators into thinking client calls go to `http://api:4000`.
- Recommended improvement: Add `read_only: true` + `tmpfs` for the web service; document the build-arg vs runtime env split; optionally drop the redundant runtime `NEXT_PUBLIC_API_URL` from compose.
- Suggested tests: `docker inspect` confirms `nextjs` user and read-only root once applied.
- Suggested docs: `docs/ENVIRONMENT_VARIABLES.md` — clarify NEXT_PUBLIC_API_URL build vs runtime semantics.

### Item: docker-compose.yml (prod)

- Evidence: `infra/digitalocean/docker-compose.yml` (145 lines).
- What it does: Runs redis, api, worker, web, caddy behind a Caddy TLS proxy on a DO droplet.
- How it appears to work: `x-security` anchor applies `cap_drop: ALL` + `no-new-privileges: true` to all services; api/worker/redis are `read_only` with `tmpfs /tmp`; per-service `mem_limit`; SHA-pinned redis/caddy images; healthchecks on redis/api; caddy `cap_add: NET_BIND_SERVICE`.
- Dependencies: Image tags `$IMAGE_TAG` (SHA via deploy), `$GHCR_IMAGE_PREFIX`, env from `/opt/mct-portal/.env`.
- Current controls: caps, no-new-privileges, read_only, mem limits, pinned digests, healthchecks.
- Missing controls: **Redis password default** (see CTR-P1-001); worker has no compose healthcheck and api `depends_on redis: service_started` (should be `service_healthy`); caddy not `read_only` (needs `/data`, `/config` writes, but a `tmpfs`/config split is possible); web not `read_only`; secrets delivered as env (visible via `docker inspect`) rather than `secret` files; `depends_on` for web uses `service_started` (line 116-118) instead of `service_healthy`.
- Risks: Default Redis credential; weaker ordering guarantees; env-inspect secret exposure.
- Recommended improvement: Require `REDIS_PASSWORD` (no default); `depends_on: condition: service_healthy`; add worker healthcheck; consider Docker `configs`/secret files for high-value keys (SMTP_PASS, M365_CLIENT_SECRET).
- Suggested tests: Compose `config` validity; post-deploy `docker inspect` for caps/read_only.
- Suggested docs: `docs/ROLLBACK_PROCEDURES.md` — note env rotation.

### Item: Caddyfile

- Evidence: `infra/digitalocean/Caddyfile` (63 lines) — 4 blocks (www/app/api × .com/.us).
- What it does: TLS via origin certs (`fullchain.pem`/`privkey.pem`), reverse proxy to web:3000 / api:4000, SSE flush for the notifications stream, and sets security headers (X-Frame-Options DENY, nosniff, HSTS preload, CSP).
- How it appears to work: Prod uses Cloudflare origin certs; `deploy-do.yml:264-269` falls back to `tls internal` if certs are empty.
- Dependencies: Cert files written from `CF_ORIGIN_CERT`/`CF_ORIGIN_KEY` secrets; Caddyfile copied from the droplet repo checkout.
- Current controls: Strong header set; HSTS with preload; SSE path handling.
- Missing controls: The Caddy CSP (`script-src 'self'`; `connect-src 'self'`) **replaces** the Next.js middleware CSP, so the app's nonce-based CSP and the GA/Tawk external scripts are all neutralized by the edge header. No `frame-ancestors` (X-Frame-Options covers it). No `Cache-Control`/security headers tuned for static assets.
- Risks: CSP mismatch between layers; marketing analytics blocked or CSP bypassed depending on domain; confusing security posture.
- Recommended improvement: Choose a single CSP owner (prefer the app layer with nonces; let Caddy append rather than override, or align Caddy's CSP with the app's); add `frame-ancestors 'none'`.
- Suggested tests: `curl -sI https://<domain>` comparing CSP vs app's expected nonce policy.
- Suggested docs: `docs/MONITORING_AND_ALERTING.md` — CSP/analytics behavior.

### Item: .dockerignore

- Evidence: `.dockerignore` (47 lines).
- What it does: Excludes git, node_modules, `.next`, dist, `.env*`, docs, scripts, infra, supabase, misc.
- How it appears to work: Build context stays small and secret-free.
- Dependencies: None.
- Current controls: Comprehensive exclusions.
- Missing controls: `packages/` is intentionally included (needed by web). `*.pem`/`*.key` are not explicitly excluded but `.env*` + `infra/` cover the likely locations; a stray cert in an app dir would be included. Minor.
- Risks: Low.
- Recommended improvement: Add `**/*.pem`, `**/*.key`, `**/id_rsa*` for defense-in-depth.
- Suggested tests: `docker build` size check.
- Suggested docs: none.

## Scenario / Control Matrix

| ID      | Scenario or control | Evidence | Current control | Gap | Severity | Recommendation |
| ------- | ------------------- | -------- | --------------- | --- | -------- | -------------- |
| CTR-001 | Dockerfiles         | 3 files | multi-stage, non-root, HEALTHCHECK | worker no EXPOSE | P3 | Add EXPOSE 3001 |
| CTR-002 | Compose             | infra/digitalocean/docker-compose.yml | caps/read_only/limits | Redis default pw; caddy/web not read_only | P1 | Provision REDIS_PASSWORD; harden |
| CTR-003 | Build stages        | Dockerfiles | 2-3 stages | runtime-stage re-install | P3 | `pnpm deploy` alternative |
| CTR-004 | Base images/tags    | SHA digests | node/redis/caddy pinned | no freshness check | P3 | Scheduled refresh |
| CTR-005 | Package installs    | `--prod --ignore-scripts` | no dev deps | packages/ not copied (api/worker) | P2 | Verify filtered install |
| CTR-006 | Non-root users      | `USER appuser`/`nextjs` | uid 1001 | install steps run root | P3 | Acceptable |
| CTR-007 | File permissions    | chown/--chown, chmod 600 | correct | web not read_only in compose | P2 | Add read_only |
| CTR-008 | Entrypoints         | `CMD node …` | direct node | no tini/signal wrapper | P3 | Verify drain works in-container |
| CTR-009 | Health checks       | Dockerfile + compose | image HC all 3; compose redis+api | worker compose HC missing; depends_on not healthy | P2 | Add HC + healthy depends |
| CTR-010 | Ports               | 4000/3001/3000; 80/443 | scoped | worker no EXPOSE | P3 | Add |
| CTR-011 | Build args          | NEXT_PUBLIC_* | non-secret | build-vs-runtime URL mismatch | P2 | Document/align |
| CTR-012 | Runtime env         | compose env | secrets via env | REDIS_PASSWORD default; inspect-visible | P1 | Secrets files + REDIS_PASSWORD |

## Findings

### Finding ID: CTR-P1-001 - Production Redis uses a hardcoded default password

- Severity: P1
- Confidence: High
- Area: Container runtime / secrets
- Evidence:
  - `infra/digitalocean/docker-compose.yml:24` (`command: redis-server --requirepass ${REDIS_PASSWORD:-mct_redis_changeme_in_production}`)
  - `infra/digitalocean/docker-compose.yml:33,46,80` (password also in healthcheck + API/Worker REDIS_URL)
  - `.github/workflows/deploy-do.yml:208-239` — the `.env` provisioning loop never writes `REDIS_PASSWORD`
- What is happening: The compose file defaults Redis to `mct_redis_changeme_in_production`, and the deploy pipeline does not set `REDIS_PASSWORD`, so production Redis authenticates with a public, hardcoded default.
- Why it matters: Redis hosts the BullMQ job queue and webhook idempotency dedup state. A known default credential makes it trivial for anyone who can reach the Redis port (exposed services, container breakout) to read/poison the queue.
- User / business impact: Job queue tampering, dropped/duplicated async work (email, ticket sync).
- Security / privacy / reliability impact: Weak authentication on a production data service.
- Recommended fix: (1) Add `REDIS_PASSWORD` to the `deploy-do.yml` secrets + `.env` write loop; (2) remove the fallback default in compose (make it mandatory); (3) rotate the current droplet's Redis password on next deploy.
- Suggested validation: Post-deploy `docker exec mct-portal-redis-1 redis-cli -a <configured>` succeeds and default fails; compose `config` shows no `changeme` string.
- Owner suggestion: Infrastructure lead.
- Effort estimate: 30 min.
- Dependencies: Secrets matrix update (`docs/GITHUB_SECRETS_AND_VARIABLES_MATRIX.md`).
- Status: Open.

### Finding ID: CTR-P1-002 - Nonce-based CSP not enforced; Caddy edge CSP conflicts with app CSP

- Severity: P1
- Confidence: High
- Area: Container runtime / web security headers
- Evidence:
  - `apps/web/middleware.ts:27-44` — `setCspHeaders` emits `script-src 'self' 'unsafe-inline'` (no `'nonce-…'`) even though `generateNonce()` runs (lines 16-25, 48)
  - `apps/web/middleware.ts:108-109` — nonce set on response header only
  - `apps/web/app/(public)/layout.tsx:50-73` — GA/Tawk `<Script nonce={nonce}>`
  - `infra/digitalocean/Caddyfile:11,29,43,61` — Caddy sets `Content-Security-Policy: … script-src 'self' …` on every response, overriding the middleware header
- What is happening: Two independent CSP layers disagree. The app generates a per-request nonce and tags its GA/Tawk scripts with it, but the CSP directive never includes `'nonce-…'`, so the nonce does nothing (`'unsafe-inline'` permits scripts regardless). At the edge, Caddy's own CSP header (`script-src 'self'`) replaces the middleware header, so in production the effective policy is Caddy's — which would also block the nonce-tagged external GA/Tawk scripts.
- Why it matters: The AGENTS.md claim of "nonce-based CSP added (Web)" is not supported by the code. The effective production CSP is a rigid `script-src 'self'` that likely breaks marketing analytics, or worse, the layers drift further in future edits.
- User / business impact: Analytics breakage; false sense of CSP hardening.
- Security / privacy / reliability impact: Inconsistent, non-functional security header design; XSS protection weaker than intended (app layer) and brittle (edge layer).
- Recommended fix: Pick one owner. Recommended: app-layer nonce CSP — emit `script-src 'self' 'nonce-${nonce}'` in the middleware and have Caddy remove its own CSP for app routes (or align Caddy's CSP to allow the same nonce flow). Alternatively, keep Caddy's strict CSP and drop the nonce machinery. Add `frame-ancestors 'none'`.
- Suggested validation: `curl -sI` on each domain comparing CSP; a browser check that GA/Tawk loads; a script-injection PoC that a nonce-less inline script is blocked.
- Owner suggestion: Frontend + infrastructure leads.
- Effort estimate: 4-8 hours (needs coordinated change + testing).
- Dependencies: None.
- Status: Open.

### Finding ID: CTR-P1-003 - No container image scanning or SBOM on the build/deploy path

- Severity: P1
- Confidence: High
- Area: Container runtime / supply chain
- Evidence: grep of `.github/workflows/*.yml` for `trivy|sbom|syft|provenance|attest|cosign|grype` → no matches; `build-push.yml`/`deploy-do.yml` push images with no scan step.
- What is happening: Images are built and deployed without any vulnerability scan, SBOM, or attestation.
- Why it matters: A vulnerable base image or dependency ships to the droplet without any automated check.
- User / business impact: Exploitable containers in production.
- Security / privacy / reliability impact: No inventory of what's inside the shipped images.
- Recommended fix: Add a Trivy scan job (fail on HIGH+) and CycloneDX SBOM artifact to `build-push.yml`/`deploy-do.yml`; gate deploy on scan result; optionally cosign sign (needs OIDC).
- Suggested validation: Seeded vulnerable base image → build fails.
- Owner suggestion: Platform/security lead.
- Effort estimate: 1 day.
- Dependencies: None.
- Status: Open (cross-ref SC-P1-001).

### Finding ID: CTR-P2-001 - Compose ordering/health gaps: worker no healthcheck, api/web `depends_on` not health-gated

- Severity: P2
- Confidence: High
- Area: Container runtime / resilience
- Evidence:
  - `infra/digitalocean/docker-compose.yml:99-102` (worker `depends_on: redis: service_started`)
  - `infra/digitalocean/docker-compose.yml:58-60` (api `depends_on: redis: service_started`)
  - `infra/digitalocean/docker-compose.yml:116-118` (web `depends_on: api: service_started`)
  - Worker service has no `healthcheck:` block (image has one; compose doesn't reference it)
- What is happening: Services start as soon as their dependencies are "started," not "healthy." The worker's health is never probed by the orchestrator.
- Why it matters: On cold start/restart, the API/web can come up before Redis is ready, causing connection errors; the worker can appear "up" while unhealthy with no signal to monitoring.
- User / business impact: Transient startup failures; reduced observability.
- Security / privacy / reliability impact: Non-deterministic startup order.
- Recommended fix: Use `condition: service_healthy` for redis→api, api→web, redis→worker; add an explicit worker `healthcheck:` to compose mirroring the image.
- Suggested validation: `docker compose config` + a restart drill observing startup order.
- Owner suggestion: Infrastructure lead.
- Effort estimate: 30 min.
- Dependencies: None.
- Status: Open.

### Finding ID: CTR-P2-002 - Web service not read-only; secrets delivered via env only

- Severity: P2
- Confidence: High
- Area: Container runtime hardening
- Evidence:
  - `infra/digitalocean/docker-compose.yml:108-120` — web service lacks `read_only: true`/`tmpfs` (api/worker/redis have them)
  - Compose passes all secrets as `environment:` (lines 42-57, 75-98, 111-115); no Docker `secrets`/`configs`
  - Caddy service (lines 123-140) also lacks `read_only`
- What is happening: The web (and caddy) containers have writable root filesystems, and secrets live in the env (visible via `docker inspect`).
- Why it matters: Reduces defense-in-depth; a web compromise could write to the filesystem; env-visible secrets are harder to rotate and leak into `docker inspect`/logs more easily.
- User / business impact: None direct.
- Security / privacy / reliability impact: Larger blast radius; secret hygiene.
- Recommended fix: Add `read_only: true` + `tmpfs: /tmp` to web and caddy; for high-value credentials (SMTP_PASS, M365_CLIENT_SECRET, JWT_SECRET), consider Docker secrets/configs or an entrypoint that reads a root-owned 0600 file.
- Suggested validation: `docker inspect` for `ReadonlyRootfs: true`; attempt to write to web filesystem and confirm EROFS.
- Owner suggestion: Infrastructure lead.
- Effort estimate: 1-2 hours.
- Dependencies: None.
- Status: Open.

### Finding ID: CTR-P2-003 - API/worker runtime stages re-install prod deps at image build; workspace `packages/` not copied

- Severity: P2
- Confidence: Medium
- Area: Container runtime / build
- Evidence:
  - `apps/api/Dockerfile:23-28`, `apps/worker/Dockerfile:23-28` — runtime stage `pnpm install --prod`
  - `apps/api/Dockerfile:5-8`, `apps/worker/Dockerfile:5-8` — only `apps/<app>` + root manifests copied; `packages/` is **not** copied
  - `apps/api/package.json:17` / `apps/worker/package.json:18` declare `@mct/config` (workspace) as a dependency, but no runtime source imports it (report 11 SC-P3-001)
- What is happening: The runtime stage performs a second network install (from the registry) instead of copying a pre-materialized prod tree; the build context for api/worker omits the `packages/` workspace directory, so resolution depends on pnpm's filtered-install behavior. This currently works because `@mct/config` is never imported at runtime, but it is fragile.
- Why it matters: (a) A runtime import of any workspace package would break the build; (b) two installs per image = larger build surface and registry dependency.
- User / business impact: None today.
- Security / privacy / reliability impact: Fragile workspace resolution; build-time registry dependency.
- Recommended fix: Verify whether pnpm filtered install tolerates the missing members (document the result); if robustness is wanted, copy `packages/` into the context or use `pnpm --filter … deploy --prod` to materialize a standalone prod directory and COPY that.
- Suggested validation: `docker build` with a transient registry outage simulation; `pnpm install --frozen-lockfile --filter=./apps/api` in a context without `packages/`.
- Owner suggestion: Backend/infrastructure lead.
- Effort estimate: 1-2 hours.
- Dependencies: None.
- Status: Open (verification required).

### Finding ID: CTR-P2-004 - `NEXT_PUBLIC_API_URL` build-time inlining vs runtime override ambiguity

- Severity: P2
- Confidence: Medium
- Area: Container runtime / web config
- Evidence:
  - `apps/web/Dockerfile:14-21,31-34` — `NEXT_PUBLIC_API_URL` baked at build time
  - `infra/digitalocean/docker-compose.yml:113` — runtime `NEXT_PUBLIC_API_URL: http://api:4000`
  - `.github/workflows/deploy-do.yml:165-166` — build arg `NEXT_PUBLIC_API_URL=https://<api_domain>`
- What is happening: Client components are compiled with the public URL; the runtime env var in compose affects only server-side reads. The compose line implies the client URL is `http://api:4000`, which is wrong for browsers.
- Why it matters: Operators may "fix" the runtime var and break client API calls, or become confused about the split; a future Next.js change could re-inline the runtime value.
- User / business impact: Potential client API breakage through misconfiguration.
- Security / privacy / reliability impact: Misconfiguration risk.
- Recommended fix: Remove the redundant `NEXT_PUBLIC_API_URL` runtime env from compose (server-to-server should use an internal non-public var), and document the build-arg/runtime split in `docs/ENVIRONMENT_VARIABLES.md`.
- Suggested validation: Deploy a change and confirm browser requests hit `https://api.<domain>` while server actions hit `http://api:4000`.
- Owner suggestion: Frontend/infrastructure lead.
- Effort estimate: 30 min.
- Dependencies: None.
- Status: Open.

### Finding ID: CTR-P3-001 - Worker image lacks EXPOSE; minor Dockerfile/compose polish

- Severity: P3
- Confidence: High
- Area: Container hygiene
- Evidence:
  - `apps/worker/Dockerfile:33-37` — `ENV HEALTH_PORT=3001` + HEALTHCHECK, but no `EXPOSE 3001`
  - `.dockerignore` lacks explicit `**/*.pem`, `**/*.key` entries
  - `scripts/backup-database.sh` uses unpinned `postgres:15`
- What is happening: Cosmetic gaps: worker port not declared; cert/key globs not explicitly excluded; a postgres container in the backup fallback is unpinned.
- Why it matters: Documentation clarity and defense-in-depth only.
- User / business impact: None.
- Security / privacy / reliability impact: None material.
- Recommended fix: Add `EXPOSE 3001`; add `**/*.pem`/`**/*.key` to `.dockerignore`; pin the postgres image digest in the backup fallback.
- Suggested validation: `docker build` unaffected.
- Owner suggestion: Infrastructure lead.
- Effort estimate: 15 min.
- Dependencies: None.
- Status: Open.

## Risks

| Risk | Severity | Likelihood | Impact | Evidence | Mitigation |
| ---- | -------- | ---------- | ------ | -------- | ---------- |
| Known default Redis password in prod | P1 | High | Medium | compose:24, deploy env | Provision REDIS_PASSWORD |
| Non-functional CSP; edge/app conflict | P1 | High | Medium | middleware.ts:42, Caddyfile:11 | Single CSP owner + nonce |
| Unscanned images to prod | P1 | High | Medium | no trivy/sbom in CI | Add scan gate |
| Fragile workspace resolution in api/worker images | P2 | Medium | Medium | Dockerfile copies omit packages/ | Verify; materialize prod tree |
| Startup order flakiness | P2 | Medium | Low | depends_on service_started | Health-gated depends |
| Web/caddy writable FS + env secrets | P2 | Medium | Low | compose web/caddy | read_only + secrets files |

## Recommendations

### Immediate / Release Blocking

1. Provision `REDIS_PASSWORD` via deploy secrets and remove the compose fallback default; rotate existing droplet Redis password.
2. Add Trivy scan (fail HIGH+) + SBOM to `build-push.yml`/`deploy-do.yml`.
3. Resolve the CSP conflict: one owner (recommend app-layer nonce CSP) and align the Caddyfile.

### This Week

4. Health-gate compose `depends_on`; add worker compose healthcheck.
5. Add `read_only` + `tmpfs` to web and caddy services; move top secrets to files/secrets.
6. Verify the api/worker filtered-install behavior; document it.

### This Month

7. Remove redundant runtime `NEXT_PUBLIC_API_URL`; document build-vs-runtime split.
8. Consider `pnpm deploy --prod` for api/worker runtime stages to drop the second install.
9. Add `EXPOSE 3001`, `.pem`/`.key` dockerignore globs, pinned postgres in backup script.

### Later / Platform Evolution

10. Adopt OIDC + keyless cosign signing; add `docker sbom`/Syft output to releases.

## Quick Wins

| Quick win | Why it helps | Files likely involved | Validation |
| --------- | ------------ | --------------------- | ---------- |
| Add `EXPOSE 3001` to worker | Port documentation | apps/worker/Dockerfile | docker build |
| Add `**/*.pem`/`**/*.key` to `.dockerignore` | Stops cert/keys entering context | `.dockerignore` | build size check |
| Health-gate compose depends | Deterministic startup | docker-compose.yml | compose config |
| Remove redundant runtime NEXT_PUBLIC_API_URL | Kills misconfig foot-gun | docker-compose.yml | browser request check |

## Hardening Backlog

| Backlog item | Priority | Owner suggestion | Effort | Dependency |
| ------------ | -------- | ---------------- | ------ | ---------- |
| REDIS_PASSWORD provisioning + rotation | P1 | Infrastructure lead | 30 m | none |
| Trivy + SBOM gate | P1 | Platform lead | 1 d | none |
| CSP single-owner fix | P1 | Frontend+Infra | 4-8 h | none |
| Compose health gating | P2 | Infrastructure lead | 30 m | none |
| read_only + secrets files | P2 | Infrastructure lead | 1-2 h | none |
| Verify workspace filtered install | P2 | Backend lead | 1-2 h | none |
| NEXT_PUBLIC_API_URL cleanup | P2 | Frontend lead | 30 m | none |

## Suggested Tests

- Unit/CI: `docker compose config` validation asserting no `changeme` default and health-gated depends.
- Container: `docker run` each image as uid 1001; confirm health endpoint; attempt file write on read_only roots.
- Security: Trivy gate with a seeded vulnerable base image; script-injection PoC against the CSP policy.
- E2E: post-deploy Redis auth check; GA/Tawk script load check on marketing domain.

## Suggested Documentation Updates

- `docs/GITHUB_SECRETS_AND_VARIABLES_MATRIX.md` — add `REDIS_PASSWORD`.
- `docs/ENVIRONMENT_VARIABLES.md` — clarify `NEXT_PUBLIC_API_URL` build-arg vs runtime semantics.
- `docs/MONITORING_AND_ALERTING.md` — CSP/analytics behavior and Caddy header ownership.
- `AGENTS.md` — correct the "nonce-based CSP" claim and add container scan gate description.

## Open Questions

| Question | Why it matters | Evidence needed |
| -------- | -------------- | --------------- |
| Does the droplet's current Redis instance run the default password? | Determines if exposure is live today | SSH `docker inspect mct-portal-redis-1` |
| Is the marketing site's GA/Tawk currently loading in production? | Validates the CSP-conflict hypothesis | Browser devtools on www domain |
| Do api/worker images actually build in a context without `packages/`? | Confirms the workspace-resolution fragility | Reproduce `pnpm install --filter=./apps/api` without packages/ |

## Appendix

### Base image digests in use

- `node:20-alpine@sha256:fb4cd12c85ee03686f6af5362a0b0d56d50c58a04632e6c0fb8363f609372293` — api/worker/web (all stages)
- `redis:7-alpine@sha256:e7723ff73d963f5cc6d9c4643ea3d989527a402a319239054e9472a7fb9219a2` — compose
- `caddy:2-alpine@sha256:5f5c8640aae01df9654968d946d8f1a56c497f1dd5c5cda4cf95ab7c14d58648` — compose

### Runtime security profile (compose)

- api: `cap_drop: ALL`, `no-new-privileges: true`, `read_only: true`, `tmpfs /tmp`, `mem_limit 256m`
- worker: same as api
- web: `cap_drop: ALL`, `no-new-privileges: true`, `mem_limit 256m` (no read_only)
- redis: `cap_drop: ALL`, `no-new-privileges: true`, `read_only: true`, `tmpfs /tmp`, `mem_limit 48m`
- caddy: `cap_drop: ALL` + `cap_add: NET_BIND_SERVICE`, `no-new-privileges: true`, `mem_limit 64m` (no read_only)
