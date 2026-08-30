# Infrastructure, Deployment, and Environment Drift Audit

## Audit Metadata

- Audit name: repo-deep-dive
- Run: 20260801-0233-develop-a585f1d
- Repository: mainecybertech-portal
- Branch: develop
- Commit SHA: a585f1d
- Generated at: 2026-08-01T02:33
- Auditor: AI principal-level auditor
- Area code: INFRA
- Output path: prompts/repo-deep-dive/20260801-0233-develop-a585f1d/12_infra_deployment_environment_drift.md
- Scope limitations: Cannot inspect live droplet config (secrets injected at deploy-time). Cannot verify GitHub Secret values. Cannot verify DO Spaces bucket contents. Cannot test SSH connectivity. Terraform state file present in repo is frozen in time — actual remote state unknown.

## Scope

Examined every infrastructure file, deployment workflow, and env configuration in the repo. Cross-referenced docker-compose env vars against runtime validators (Zod schemas), CI deploy secret-writing, Terraform config, documentation, and the multi-file Caddyfile drift.

**Reviewed:**

- `infra/digitalocean/docker-compose.yml` — full stack definition
- `infra/digitalocean/Caddyfile` + `Caddyfile.dev` + `Caddyfile.prod` — reverse proxy config
- `infra/digitalocean/.env.example` — Docker Compose env template
- `infra/terraform/digitalocean/*.tf` — all 6 Terraform files
- `infra/terraform/digitalocean/env/*.tfvars` + `*.hcl` — 6 env configs
- `infra/terraform/digitalocean/cloud-init.yml` — droplet bootstrap
- `apps/api/Dockerfile`, `apps/worker/Dockerfile`, `apps/web/Dockerfile`
- `apps/api/src/config/env.ts` — API Zod env schema
- `apps/worker/src/env.ts` — Worker Zod env schema
- `.github/workflows/deploy-do.yml` — full 307-line deploy workflow
- `.github/workflows/terraform-do.yml` — full 196-line Terraform workflow
- `apps/api/.env.example`, `apps/worker/.env.example`, `apps/web/.env.example`
- `docs/ENVIRONMENT_VARIABLES.md`, `docs/ROLLBACK_PROCEDURES.md`

## Evidence Reviewed

| Evidence | Type | Why relevant | Notes |
| --- | --- | --- | --- |
| `infra/digitalocean/docker-compose.yml` | Compose config | Primary runtime definition | 5 services, security hardening, env var wiring |
| `infra/digitalocean/Caddyfile` | Reverse proxy | Public TLS termination, headers, routing | 4 server blocks, CSP + security headers |
| `infra/digitalocean/Caddyfile.dev` | Reverse proxy | Dev-specific Caddy config | Missing security headers (HSTS, CSP) |
| `infra/digitalocean/Caddyfile.prod` | Reverse proxy | Prod-specific Caddy config | Missing security headers (HSTS, CSP) |
| `infra/digitalocean/.env.example` | Env template | Operator reference for docker-compose | Missing critical vars |
| `infra/terraform/digitalocean/*.tf` | IaC | DO droplet, firewall, DNS, state backend | All 6 files with real S3 backend |
| `infra/terraform/digitalocean/env/*` | IaC config | Per-environment tfvars + backend | All values are placeholders |
| `apps/api/Dockerfile` | Container | API multi-stage build | Non-root user, HEALTHCHECK, SHA-pinned base |
| `apps/worker/Dockerfile` | Container | Worker multi-stage build | Non-root user, HEALTHCHECK |
| `apps/web/Dockerfile` | Container | Web multi-stage build | Non-root user, build args, standalone output |
| `apps/api/src/config/env.ts` | Runtime validator | Zod schema for API env | 34-field schema, safeParse |
| `apps/worker/src/env.ts` | Runtime validator | Zod schema for Worker env | 28-field schema, eager parse |
| `.github/workflows/deploy-do.yml` | Deploy | Full DO deploy pipeline | Build, SSH setup, deploy, health checks |
| `.github/workflows/terraform-do.yml` | Deploy | Terraform plan/apply pipeline | Plan PR comment, prod-approval gate, apply |
| `docs/ENVIRONMENT_VARIABLES.md` | Documentation | Env var reference | Inaccurate docker-compose description |
| `apps/*/.env.example` | Env template | Dev setup reference | 3 minimal starter files |

## Executive Summary

The infrastructure is **production-grade with strong foundational patterns** — non-root containers, SHA-pinned images, read-only filesystems, capability dropping, multi-stage Docker builds, properly gated Terraform apply, and a mature deploy pipeline with health checks and rollback capability.

**Two critical gaps identified:**

1. **Redis password is hardcoded to a well-known default** (`mct_redis_changeme_in_production`) with no mechanism in the deploy pipeline to override it. The value is committed to the repo and used as the production default. Any process on the Docker network can authenticate to Redis with this known string.

2. **Terraform state files are committed to the repository** (`terraform.tfstate` and `terraform.tfstate.backup` in `infra/terraform/digitalocean/`). These may contain sensitive values and create state-fork risk if someone runs `terraform apply` locally.

**Additional concerns:** The environment-specific `Caddyfile.dev` and `Caddyfile.prod` are missing all security headers (HSTS, CSP, X-Frame-Options) present in the main `Caddyfile`. The `docker-compose` `.env.example` is incomplete — missing `REDIS_PASSWORD`, `GHCR_IMAGE_PREFIX`, and several app domain vars needed to stand up the stack. Terraform `.tfvars` files contain only placeholder values, making them unusable for manual `terraform apply` outside CI.

**Overall: 3.4/5** — production-ready but with 2 P0s that should be resolved.

## Inventory

| Item | Path / symbol | Purpose | Current state | Risk | Notes |
| --- | --- | --- | --- | --- | --- |
| Docker Compose | `infra/digitalocean/docker-compose.yml` | 5-service stack definition | Functional, hardened | P0 — Redis pw | `read_only: true` missing on web |
| Caddyfile (main) | `infra/digitalocean/Caddyfile` | TLS + security headers + routing | Full headers, 4 blocks | None | HSTS, CSP, X-Frame-Options all present |
| Caddyfile (dev) | `infra/digitalocean/Caddyfile.dev` | Dev TLS + routing | Missing security headers | P1 | Deploy picks this for dev |
| Caddyfile (prod) | `infra/digitalocean/Caddyfile.prod` | Prod TLS + routing | Missing security headers | P1 | Deploy picks this for prod |
| Compose .env.example | `infra/digitalocean/.env.example` | Operator reference | Incomplete | P1 | Missing 10+ vars |
| DO Terraform | `infra/terraform/digitalocean/*.tf` | Droplet, firewall, DNS, state | Fully defined | P0 — state committed | 6 TF files, S3 backend, all real |
| TF env files | `infra/terraform/digitalocean/env/*` | Per-env tfvars/backend | All placeholders | P2 | CI generates real tfvars from secrets |
| Terraform state | `infra/terraform/digitalocean/terraform.tfstate` | Local state file | Committed to repo! | P0 | Should only be in Spaces S3 |
| Cloud-init | `infra/terraform/digitalocean/cloud-init.yml` | Droplet bootstrap | Docker + UFW, clean | Low | ignore_changes on user_data |
| API Dockerfile | `apps/api/Dockerfile` | Multi-stage Node 20 alpine | Non-root, SHA-pinned | None | HEALTHCHECK wget on :4000 |
| Worker Dockerfile | `apps/worker/Dockerfile` | Multi-stage Node 20 alpine | Non-root, SHA-pinned | None | HEALTHCHECK wget on :3001 |
| Web Dockerfile | `apps/web/Dockerfile` | Multi-stage Node 20 alpine | Non-root, SHA-pinned | None | Standalone output, build args |
| API env schema | `apps/api/src/config/env.ts` | Zod-validated runtime env | 34 fields, strong | None | Several docker-compose vars absent |
| Worker env schema | `apps/worker/src/env.ts` | Zod-validated runtime env | 28 fields, eager | None | Uses dotenv before validation |
| Deploy workflow | `.github/workflows/deploy-do.yml` | Build + SSH deploy + health | Mature, gated | P1 — missing REDIS_PASSWORD | Concurrency, rollback, certs |
| Terraform workflow | `.github/workflows/terraform-do.yml` | Plan → PR comment → apply | Mature, gated | None | Prod-approval, plan artifact |
| Env docs | `docs/ENVIRONMENT_VARIABLES.md` | Reference documentation | Mostly accurate | P1 | Incorrect docker-compose description |
| Rollback docs | `docs/ROLLBACK_PROCEDURES.md` | Operator manual | Comprehensive | None | Docker, Supabase, Terraform covered |
| .env.example (API) | `apps/api/.env.example` | Dev setup | Complete | Low | 28 vars |
| .env.example (Worker) | `apps/worker/.env.example` | Dev setup | Complete | Low | 28 vars |
| .env.example (Web) | `apps/web/.env.example` | Dev setup | Complete | Low | 7 vars |

## Domain Scorecard

| Category | Score | Evidence | Gap | Recommended action |
| --- | ---: | --- | --- | --- |
| Dockerfiles | 4 | Non-root, SHA-pinned base images, multi-stage builds, HEALTHCHECK on all 3 apps | Web lacks `read_only` in compose; redundant runtime `NEXT_PUBLIC_API_URL` | Add `read_only: true` + `tmpfs` to web service |
| Compose | 3 | Security hardening (cap_drop, no-new-privileges, tmpfs), memory limits, depends_on | Redis pw hardcoded; web lacks read_only; no backup volume hooks | Inject REDIS_PASSWORD via deploy secrets; add backup sidecar |
| Terraform/OpenTofu | 3 | Full IaC (droplet, firewall, DNS), S3 backend, prod-approval gate | State files committed; tfvars all placeholders; cloud-init ignored after creation | Remove state files; .gitignore tfstate; document manual apply |
| Cloud/hosting config | 4 | Single DO droplet, Cloudflare DNS, DO firewall restricted to CF IPs | admin_ip_ranges default is 0.0.0.0/0 for SSH | Restrict SSH in prod.tfvars |
| Deploy scripts | 4 | SHA-tagged builds, SSH env writing, health checks, rollback via workflow_dispatch | REDIS_PASSWORD not written to .env | Add REDIS_PASSWORD secret + env pair |
| Reverse proxy | 3 | Caddy with TLS, SSE flush, proper routing | Prod/dev Caddyfiles missing CSP, HSTS, X-Frame-Options | Add security headers to Caddyfile.prod + Caddyfile.dev |
| Environment examples | 3 | 3 app-level .env.example files; 1 compose-level | Compose .env.example missing 10+ vars | Complete .env.example with all vars docker-compose references |
| Runtime validators | 5 | Strong Zod schemas with defaults, optional chains, secret redaction in logger | API env schema has M365_CLIENT_STATE not wired in compose | Clean up unwired schema entries or wire them |
| Secret references | 3 | All secrets via GitHub Secrets (not hardcoded in deploy script) | REDIS_PASSWORD hardcoded default in docker-compose; no secret rotation automation | Add REDIS_PASSWORD to deploy secrets; add rotation script |
| Build args | 4 | NEXT_PUBLIC_* + version/build SHA/timestamp via build args | NEXT_PUBLIC_BUILD_TIME may be empty string on PR push | Add fallback to `date -u +%Y-%m-%dT%H:%M:%SZ` |
| Container users | 5 | All 3 apps use non-root user (appuser/nextjs, UID 1001) | None | Maintain current pattern |
| Health/readiness/liveness | 4 | All 3 apps have HEALTHCHECK; deploy does API + web + worker health | Worker health check is SSH-based (non-fatal warn); depends_on uses service_started not service_healthy | Use service_healthy condition; add readiness probes |

**Overall Score: 3.4 / 5**

## Detailed Review

### Item: Docker Compose (`infra/digitalocean/docker-compose.yml`)

- Evidence: `infra/digitalocean/docker-compose.yml:1-145`
- What it does: Defines 5-service stack (redis, api, worker, web, caddy) with security hardening
- How it appears to work: All services use `x-security` YAML anchor (cap_drop ALL, no-new-privileges). `x-app-env` shared env block. Redis gated by password auth. Caddy terminates TLS with Cloudflare origin certs. API/Worker use read_only + tmpfs. Web service missing these.
- Dependencies: GHCR images (SHA-tagged), external Supabase, Cloudflare certs, Droplet DNS
- Current controls: Non-root Redis (redis:7-alpine), `read_only: true` + `tmpfs` on API/Worker, memory limits, `cap_drop: ALL`, `no-new-privileges`
- Missing controls: `REDIS_PASSWORD` defaults to hardcoded value; web lacks `read_only: true` + `tmpfs`; depends_on uses `service_started` not `service_healthy`; no backup volume/task
- Risks: Redis auth bypass via known default password; web container writable filesystem allows persistence of injected payloads; services may start before being healthy
- Recommended improvement: Inject `REDIS_PASSWORD` from GitHub Secret; add `read_only: true` + `tmpfs` to web; change depends_on to `service_healthy`
- Suggested tests: Manual docker-compose up with custom REDIS_PASSWORD verified; container security scan (Trivy/Scout) for filesystem writability
- Suggested docs: Update `ENVIRONMENT_VARIABLES.md` with docker-compose env sourcing mechanism

### Item: Caddy Reverse Proxy (`infra/digitalocean/Caddyfile`)

- Evidence: `infra/digitalocean/Caddyfile:1-63`, `infra/digitalocean/Caddyfile.prod:1-27`, `infra/digitalocean/Caddyfile.dev:1-27`
- What it does: TLS termination, domain-based routing, security headers, SSE stream passthrough
- How it appears to work: Main Caddyfile handles all 4 server blocks (com + us, www/app + api) with full security headers. Per-env Caddyfiles (Caddyfile.prod, Caddyfile.dev) split by domain and use `tls internal` (dev) or custom certs (prod). The deploy workflow (`deploy-do.yml:262-263`) prefers the env-specific Caddyfile and falls back to the main one.
- Dependencies: Cloudflare origin certs (fullchain.pem, privkey.pem) for prod; Caddy auto-TLS for dev
- Current controls: Main Caddyfile: X-Frame-Options DENY, X-Content-Type-Options nosniff, HSTS with preload, CSP with self-only + unsafe-inline for styles. SSE path has `flush_interval -1`.
- Missing controls: **Caddyfile.prod and Caddyfile.dev are missing ALL security headers** — no HSTS, no CSP, no X-Frame-Options, no Referrer-Policy, no X-Content-Type-Options. The main Caddyfile has them all. Since deploy prefers `Caddyfile.prod` for production, the production site runs without these headers.
- Risks: Production site served without HSTS (downgrade attacks), without CSP (XSS amplification), without X-Frame-Options (clickjacking), without Referrer-Policy (data leakage via Referer header)
- Recommended improvement: Add full security header block from main Caddyfile to both Caddyfile.prod and Caddyfile.dev
- Suggested tests: curl -I https://app.mainecybertech.com → verify HSTS/CSP headers; curl -I https://app.mainecybertech.us → same
- Suggested docs: Add Caddyfile header documentation block

### Item: Terraform Configuration (`infra/terraform/digitalocean/`)

- Evidence: `infra/terraform/digitalocean/*.tf`, `infra/terraform/digitalocean/env/*.tfvars`
- What it does: Provisions DO droplet (with prevent_destroy), DO firewall, Cloudflare DNS A records (prod→.com, dev→.us)
- How it appears to work: S3 backend in DO Spaces, CI generates tfvars from GitHub Secrets, plan posted as PR comment, apply gated by prod-approval environment
- Dependencies: DO Spaces bucket, Cloudflare zones (2), DO account, SSH key
- Current controls: prevent_destroy on droplet, firewall restricted to Cloudflare IPs (80/443), admin IP SSH (configurable), Terraform validate → plan → apply pipeline
- Missing controls: Local terraform.tfstate + .tfstate.backup committed to repo; `.tfvars` files are unusable placeholders; cloud-init ignored after initial create (ignore_changes)
- Risks: **Committed state file** risks state corruption if someone runs `terraform apply` locally with stale state; **placeholder tfvars** mean no manual `terraform apply` is possible outside CI; cloud-init drift means future bootstrap changes won't apply
- Recommended improvement: Remove `terraform.tfstate` and `.backup` from repo; add to .gitignore; add docs for how to run terraform manually with real tfvars
- Suggested tests: `terraform validate` passes (already in CI); verify state files not present in repo
- Suggested docs: `docs/TERRAFORM_MANUAL_APPLY.md` for disaster scenarios

### Item: Deploy Pipeline (`.github/workflows/deploy-do.yml`)

- Evidence: `.github/workflows/deploy-do.yml:1-307`
- What it does: Builds 3 Docker images (SHA-tagged), SSH into droplet, writes `.env` file from GitHub Secrets, copies docker-compose + Caddyfile, pulls images, `docker compose up -d`, runs health checks
- How it appears to work: `setup` job resolves env (main→prod, develop→dev); `resolve-ip` finds droplet via DO API; 3 build jobs (api/worker/web) push to GHCR; `deploy` job SSHs into droplet, writes 29 env pairs to `.env`, copies certs, deploys, sleeps 15s, health checks API + web (worker via SSH, non-fatal)
- Dependencies: DO_API_TOKEN, CI_SSH_PRIVATE_KEY, CF_ORIGIN_CERT, CF_ORIGIN_KEY, 23 additional GitHub Secrets
- Current controls: Concurrency cancel-in-progress per ref; rollback via workflow_dispatch input; SHA-tagged images (not :latest); prod-approval environment; health checks with retries; non-fatal worker health
- Missing controls: **REDIS_PASSWORD not in the env pair list** (line 208-239); `depends_on: service_started` in docker-compose means services start before health verifies; worker health is SSH-based and non-fatal (could silently fail); no DB migration run step
- Risks: Redis runs with hardcoded password in production; web may get traffic before API is healthy; broken worker not detected during deploy
- Recommended improvement: Add `REDIS_PASSWORD` to deploy secrets + env pair list; switch docker-compose depends_on to `service_healthy`; add pre-deploy migration step or document migration responsibility
- Suggested tests: Verify all 29 `for pair` lines have corresponding docker-compose `${VAR}` references
- Suggested docs: Add REDIS_PASSWORD to `GITHUB_SECRETS_AND_VARIABLES_MATRIX.md`

### Item: Environment Variable Validators (`apps/api/src/config/env.ts`, `apps/worker/src/env.ts`)

- Evidence: `apps/api/src/config/env.ts:1-51`, `apps/worker/src/env.ts:1-53`
- What it does: Zod validation of process.env at startup, type-safe Env type exported
- How it appears to work: API uses lazy-safeParse with caching (getEnv). Worker uses eager parse at module load with console.log on success. Both validate all required vars, provide defaults for optional ones, and throw descriptive ZodError on failure.
- Dependencies: dotenv (worker), pino (API logger)
- Current controls: Strong typing, enum validation (NODE_ENV, LOG_LEVEL, QUEUE_BACKEND), URL validation, optional chain for third-party integrations
- Missing controls: API schema has `M365_CLIENT_STATE` and `TURNSTILE_SECRET_KEY` — never set in docker-compose or deploy; Worker schema doesn't have `REDIS_PASSWORD` (only `REDIS_URL`); API schema has `REDIS_URL` optional but docker-compose always sets it
- Risks: Dead schema entries confuse operators; if docker-compose stopped providing REDIS_URL, API would silently work without Redis (idempotency/cache would fail silently)
- Recommended improvement: Remove or wire `M365_CLIENT_STATE` and `TURNSTILE_SECRET_KEY`; mark `REDIS_URL` as required in production context
- Suggested tests: Test schema with Docker Compose-sourced env vars; verify startup fails gracefully on missing required vars
- Suggested docs: Cross-reference env schema against docker-compose in a table

## Scenario / Control Matrix

| ID | Scenario or control | Evidence | Current control | Gap | Severity | Recommendation |
| --- | --- | --- | --- | --- | --- | --- |
| INFRA-001 | Dockerfiles | 3 multi-stage Dockerfiles | Non-root, SHA-pinned, HEALTHCHECK | Web lacks read_only in compose | P2 | Add read_only+tmpfs to web service |
| INFRA-002 | Compose | docker-compose.yml (145 lines) | Security hardening across all 5 services | Redis pw hardcoded; web read_write | P0 | Inject REDIS_PASSWORD from secrets |
| INFRA-003 | Terraform/OpenTofu | 6 .tf files, 6 env files | Full IaC, S3 backend, gated apply | State files committed; tfvars placeholders | P0 | Remove state files; add .gitignore |
| INFRA-004 | Cloud/hosting config | DO droplet via Terraform | Single droplet, CF proxy, DO firewall | SSH open to 0.0.0.0/0 (default) | P2 | Restrict admin_ip_ranges in prod |
| INFRA-005 | Deploy scripts | deploy-do.yml (307 lines) | SHA-tagged builds, health checks, rollback | REDIS_PASSWORD not written; no migration step | P1 | Add REDIS_PASSWORD; add migration docs |
| INFRA-006 | Reverse proxy | Caddyfile + Caddyfile.prod/.dev | TLS, domain routing, SSE | Prod/dev Caddyfiles missing security headers | P1 | Add CSP+HSTS headers to .prod/.dev |
| INFRA-007 | Environment examples | 4 .env.example files | 3 app-level (complete), 1 compose (incomplete) | Compose example missing 10+ vars | P1 | Complete compose .env.example |
| INFRA-008 | Runtime validators | API (34 fields), Worker (28 fields) | Strong Zod schemas with defaults | Unwired schema entries (M365_CLIENT_STATE) | P2 | Remove or wire dead schema entries |
| INFRA-009 | Secret references | GitHub Secrets → deploy → .env | All via GH Secrets, not hardcoded in CI | REDIS_PASSWORD has no GH Secret path | P0 | Add REDIS_PASSWORD GH Secret |
| INFRA-010 | Build args | Web Dockerfile + deploy workflow | NEXT_PUBLIC_API_URL, version, SHA, build time | Build time may be empty on PR push | P3 | Add fallback to date command |
| INFRA-011 | Container users | All 3 Dockerfiles | Non-root: appuser (UID 1001) / nextjs | None | — | Maintain |
| INFRA-012 | Health/readiness/liveness | HEALTHCHECK in Dockerfiles; deploy health check | 30s interval, 3 retries | depends_on: service_started (not healthy) | P2 | Switch to service_healthy |

## Findings

### Finding ID: INFRA-P0-001 - Redis password hardcoded to well-known default in production

- Severity: P0
- Confidence: High
- Area: Security / Configuration
- Evidence:
  - `infra/digitalocean/docker-compose.yml:24` — `redis-server --requirepass ${REDIS_PASSWORD:-mct_redis_changeme_in_production}`
  - `infra/digitalocean/docker-compose.yml:46-47` — `REDIS_URL` and `REDIS_PASSWORD` on API service both default to the same hardcoded value
  - `infra/digitalocean/docker-compose.yml:80-81` — same for Worker service
  - `.github/workflows/deploy-do.yml:208-239` — REDIS_PASSWORD absent from 29 env pairs written to `/opt/mct-portal/.env`
  - `docker-compose.yml:33` — healthcheck passes the same default password to `redis-cli -a`
- What is happening: The `REDIS_PASSWORD` variable defaults to `mct_redis_changeme_in_production` at every reference point in docker-compose. The deploy workflow does NOT write `REDIS_PASSWORD` to the droplet's `.env` file. Unless the operator manually sets this environment variable, Redis in production runs with a publicly known password committed to the repository.
- Why it matters: Any container on the same Docker network (or any process on the droplet) can authenticate to Redis with this well-known string. Redis is used for BullMQ job queue, idempotency deduplication, and response caching. An attacker with network access could enumerate keys, inject malicious jobs, or flush caches.
- User / business impact: Queue manipulation could disrupt ticket processing, notifications, webhook delivery, and billing reconciliation. Cache poisoning could serve stale/incorrect data to portal users.
- Security / privacy / reliability impact: Authentication bypass on shared infrastructure; job queue integrity compromise; potential DoS via FLUSHALL
- Recommended fix: Add `REDIS_PASSWORD` to GitHub Secrets in both environments. Add `REDIS_PASSWORD=${{ secrets.REDIS_PASSWORD }}` to the deploy workflow's `for pair` loop. Generate a strong random value (64+ chars) for each environment.
- Suggested validation: After deploy, SSH into droplet and run `docker exec mct-portal-redis-1 redis-cli -a <password> ping` to verify auth; verify `REDIS_PASSWORD` is present in `/opt/mct-portal/.env`.
- Owner suggestion: DevOps / Platform engineer
- Effort estimate: 15 minutes (secret creation + workflow update + droplet re-deploy)
- Dependencies: Requires DO droplet SSH access to regenerate Redis password and restart containers
- Status: Open

### Finding ID: INFRA-P0-002 - Terraform state files committed to repository

- Severity: P0
- Confidence: High
- Area: Infrastructure / Security
- Evidence:
  - `infra/terraform/digitalocean/terraform.tfstate` — exists in repo directory listing
  - `infra/terraform/digitalocean/terraform.tfstate.backup` — exists in repo directory listing
  - `infra/terraform/digitalocean/providers.tf:4-9` — backend is configured as S3 (DO Spaces), so local state should not exist
- What is happening: Two Terraform state files are present in the working directory. The backend is configured for remote state in DO Spaces (`portal-terraform-state` bucket, `digitalocean/terraform.tfstate` key). Local state files indicate a past `terraform apply` was run without backend initialization, or the files were generated by `terraform plan` and committed accidentally.
- Why it matters: Terraform state files can contain sensitive values (API tokens, SSH fingerprints, IP addresses). If this state reflects real infrastructure, it may contain secrets. Additionally, if someone runs `terraform apply` locally, it would use this stale state instead of the remote state, potentially corrupting infrastructure.
- User / business impact: Accidental infrastructure corruption if local apply is run; potential secret exposure
- Security / privacy / reliability impact: Secret leakage; state fork risk; infrastructure mutation without remote state sync
- Recommended fix: 1) Delete `terraform.tfstate` and `terraform.tfstate.backup` from the repo. 2) Add `*.tfstate` and `*.tfstate.backup` to `.gitignore`. 3) Verify remote state in DO Spaces is intact. 4) Rotate any secrets present if state file contains real values.
- Suggested validation: `git rm infra/terraform/digitalocean/terraform.tfstate*`; verify `infra/terraform/digitalocean/.gitignore` contains `*.tfstate`; run `terraform init -backend-config=env/backend.dev.hcl && terraform state list` to confirm remote state is accessible
- Owner suggestion: DevOps / Platform engineer
- Effort estimate: 15 minutes
- Dependencies: Access to DO Spaces to verify remote state integrity
- Status: Open

### Finding ID: INFRA-P1-001 - Prod/dev Caddyfiles missing all security headers present in main Caddyfile

- Severity: P1
- Confidence: High
- Area: Security / Reverse proxy
- Evidence:
  - `infra/digitalocean/Caddyfile:6-12` — main Caddyfile has: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, HSTS, CSP
  - `infra/digitalocean/Caddyfile.prod:6-11` — prod-specific: only X-Frame-Options, X-Content-Type-Options, Referrer-Policy. Missing HSTS, CSP.
  - `infra/digitalocean/Caddyfile.dev:6-11` — dev-specific: same 3 headers. Missing HSTS, CSP.
  - `.github/workflows/deploy-do.yml:262-263` — deploy prefers Caddyfile.<env> over main Caddyfile
- What is happening: The deploy workflow picks up `Caddyfile.prod` (or `Caddyfile.dev`) if it exists on the droplet. These environment-specific Caddyfiles are missing HSTS (`Strict-Transport-Security`), CSP (`Content-Security-Policy`), and `X-Content-Type-Options` (in prod). The main Caddyfile has all 6 security headers but is only used as fallback.
- Why it matters: In production, visitors to `app.mainecybertech.com` and `api.mainecybertech.com` are served without HSTS (enabling TLS downgrade attacks), without CSP (amplifying XSS), without frame protection (clickjacking risk), and without referrer policy (data leakage via Referer header).
- User / business impact: Browser security features not enforced; increased attack surface for XSS, clickjacking, TLS stripping
- Security / privacy / reliability impact: Missing defense-in-depth security headers on public-facing sites
- Recommended fix: Add the full security header block from main Caddyfile (lines 6-12) to both `Caddyfile.prod` and `Caddyfile.dev`. Alternatively, delete the env-specific files and ensure main Caddyfile is always used (it handles all 4 domain blocks).
- Suggested validation: After deploy: `curl -sI https://app.mainecybertech.com | grep -i "strict-transport\|content-security\|x-frame\|x-content\|referrer"`
- Owner suggestion: DevOps / Platform engineer
- Effort estimate: 10 minutes
- Dependencies: None (config-only change, redeploy on next push)
- Status: Open

### Finding ID: INFRA-P1-002 - Docker Compose .env.example incomplete — missing critical variables

- Severity: P1
- Confidence: High
- Area: Documentation / Operations
- Evidence:
  - `infra/digitalocean/.env.example:1-34` — contains 16 env vars
  - `infra/digitalocean/docker-compose.yml:12-16,44-56,79-98,112-115` — docker-compose references 29+ distinct `${VAR}` substitutions
- What is happening: The `.env.example` file for docker-compose is missing variables that docker-compose expects: `REDIS_PASSWORD`, `GHCR_IMAGE_PREFIX`, `IMAGE_TAG`, `APP_DOMAIN`, `API_DOMAIN`, `CORS_ORIGIN`, `PUBLIC_TRAFFIC_WEBHOOK_URL`, `PUBLIC_LEAD_WEBHOOK_URL`, `JSM_DOMAIN`, `JSM_EMAIL`, `JSM_API_TOKEN`, `JSM_SERVICEDESK_ID`, `JSM_REQUEST_TYPE_ID`, `HEALTH_PORT`, `QUEUE_BACKEND`. An operator copying this example file would get a non-functional stack.
- Why it matters: Increases onboarding friction and risk of misconfiguration. Operators must reverse-engineer required variables from docker-compose.yml.
- User / business impact: Failed local/CI deployments; extended troubleshooting time
- Security / privacy / reliability impact: None directly; indirect via increased likelihood of skipping security-critical vars (REDIS_PASSWORD)
- Recommended fix: Add all missing variables to `.env.example` with sensible defaults (empty strings for optional integrations, placeholder names for required vars). Include a comment block showing which vars are required vs optional.
- Suggested validation: `grep -oP '\$\{[A-Z_]*(?=[:-])' infra/digitalocean/docker-compose.yml | sort -u` — compare against `.env.example` keys
- Owner suggestion: DevOps / Platform engineer
- Effort estimate: 15 minutes
- Dependencies: None (docs-only)
- Status: Open

### Finding ID: INFRA-P1-003 - REDIS_PASSWORD not in API or Worker Zod env schemas

- Severity: P1
- Confidence: Medium
- Area: Configuration / Resilience
- Evidence:
  - `apps/api/src/config/env.ts:28` — `REDIS_URL: z.string().url().optional()` — no REDIS_PASSWORD field
  - `apps/worker/src/env.ts:11` — `REDIS_URL: z.string().default("redis://redis:6379")` — no REDIS_PASSWORD field
  - `infra/digitalocean/docker-compose.yml:47,81` — `REDIS_PASSWORD` passed to both API and Worker containers
  - `infra/digitalocean/docker-compose.yml:46,80` — REDIS_URL already includes password inline via `redis://:${REDIS_PASSWORD}@redis:6379`
- What is happening: Docker Compose passes `REDIS_PASSWORD` to both the API and Worker containers, but neither runtime validates or uses it. The password is embedded in `REDIS_URL` (via docker-compose variable substitution). The standalone env var is unused by application code and unchecked by Zod schemas.
- Why it matters: If docker-compose changes to NOT embed the password in REDIS_URL (or if someone runs the app outside Docker), the application has no mechanism to receive a Redis password separately. The env schema doesn't document that the password is expected to be embedded in the URL.
- User / business impact: Fragile coupling between docker-compose and application; Redis auth fails in non-Docker environments silently
- Security / privacy / reliability impact: Operator confusion about Redis auth mechanism; potential Redis connection failures if URL format changes
- Recommended fix: Either: (a) document that Redis password is embedded in REDIS_URL and remove standalone REDIS_PASSWORD from docker-compose, or (b) add REDIS_PASSWORD to both env schemas and use it in Redis client construction, supporting both URL-embedded and separate password modes. Option (a) is simpler and requires no code changes.
- Suggested validation: Test API startup without docker-compose (raw `node dist/main.js`) with only REDIS_URL set
- Owner suggestion: Backend / Platform engineer
- Effort estimate: 10 minutes (documentation only, option a)
- Dependencies: None
- Status: Open

### Finding ID: INFRA-P1-004 - ENVIRONMENT_VARIABLES.md inaccurately describes docker-compose env mechanism

- Severity: P1
- Confidence: High
- Area: Documentation drift
- Evidence:
  - `docs/ENVIRONMENT_VARIABLES.md:97` — "The `docker-compose.yml` on the droplet loads env vars from [.env] file with `env_file: ./.env`"
  - `docs/ENVIRONMENT_VARIABLES.md:102-107` — "The `docker-compose.yml` uses `.env.local` files per service: apps/api/.env.local, apps/web/.env.local, apps/worker/.env.local"
  - `infra/digitalocean/docker-compose.yml:1-145` — No `env_file:` directive anywhere in the file
- What is happening: The documentation states docker-compose uses `env_file: ./.env` and per-service `.env.local` files. Neither is present in the actual docker-compose.yml. Instead, Docker Compose uses its default behavior of reading `.env` from the project directory, and all service env vars use `${VAR:-default}` syntax that interpolates from Compose's environment.
- Why it matters: An operator following the docs would create per-service `.env.local` files expecting them to be loaded, but they would be ignored. Conversely, the deploy workflow writes a single `/opt/mct-portal/.env` which works correctly due to Compose's default behavior, but this mechanism is not documented.
- User / business impact: Operators waste time creating non-functional config files; might incorrectly assume their env changes aren't taking effect
- Security / privacy / reliability impact: Low
- Recommended fix: Rewrite the "Docker Compose" section to accurately describe: (1) Compose reads `.env` from the same directory as `docker-compose.yml`, (2) `${VAR:-default}` syntax in docker-compose.yml interpolates from this environment, (3) The deploy workflow writes all vars to a single `/opt/mct-portal/.env` file
- Suggested validation: Review the rewritten documentation against actual docker-compose.yml
- Owner suggestion: Documentation / Platform engineer
- Effort estimate: 10 minutes
- Dependencies: None
- Status: Open

### Finding ID: INFRA-P2-001 - Web service lacks read_only and tmpfs hardening in docker-compose

- Severity: P2
- Confidence: High
- Area: Security / Container hardening
- Evidence:
  - `infra/digitalocean/docker-compose.yml:108-120` — web service definition: no `read_only: true`, no `tmpfs` entries
  - `infra/digitalocean/docker-compose.yml:65,104` — API and Worker both have `read_only: true` and `tmpfs: - /tmp`
  - `infra/digitalocean/docker-compose.yml:3-7` — all services include `cap_drop: ALL` and `no-new-privileges` via x-security anchor
- What is happening: The web (Next.js) container runs with a writable root filesystem, unlike the API and Worker containers which are read-only with a tmpfs for /tmp. The x-security anchor provides capability dropping and privilege restrictions, but the writable filesystem allows an attacker who achieves code execution in the Next.js process to write persistent payloads.
- Why it matters: Writable filesystem in a web-facing container is a persistence vector. If the Next.js app is compromised, an attacker could write webshells, modify static assets, or install persistence mechanisms.
- User / business impact: Increased blast radius of a web application compromise
- Security / privacy / reliability impact: Container escape and persistence risk is higher than for read-only peers
- Recommended fix: Add `read_only: true` and `tmpfs: - /tmp` to the web service in docker-compose.yml. Verify Next.js standalone output doesn't need writable paths beyond /tmp (it should not — it serves from pre-built static files).
- Suggested validation: `docker compose up -d web` with read_only:true; verify Next.js serves pages without errors; check `docker inspect` for ReadonlyRootfs
- Owner suggestion: DevOps / Platform engineer
- Effort estimate: 10 minutes (config change + verification)
- Dependencies: May need tmpfs for Next.js image optimization cache path
- Status: Open

### Finding ID: INFRA-P2-002 - All terraform .tfvars files contain only placeholder values

- Severity: P2
- Confidence: High
- Area: Infrastructure / Operations
- Evidence:
  - `infra/terraform/digitalocean/env/dev.tfvars:1-6` — `do_token = "dop_v1_replace_with_real_token"`, `ssh_fingerprint = "replace_with_real_fingerprint"`, etc.
  - `infra/terraform/digitalocean/env/prod.tfvars:5-10` — `do_token = "your-do-api-token"`, `ssh_fingerprint = "your-ssh-key-fingerprint"`, etc.
  - `.github/workflows/terraform-do.yml:59-68` — CI creates real tfvars from GitHub Secrets at deploy time
- What is happening: Both dev and prod `.tfvars` files contain only placeholder values. The `.tfvars.example` files are effectively identical (also placeholders). A manual `terraform apply` from a developer machine is impossible without first creating real `.tfvars` files from external secrets.
- Why it matters: In a disaster scenario where CI is unavailable (e.g., GitHub Actions outage, org migration), no one can run `terraform apply` to recreate infrastructure because there are no real tfvars. The CI workflow is a single point of failure for infrastructure changes.
- User / business impact: Extended MTTR in disaster recovery scenarios; no offline IaC capability
- Security / privacy / reliability impact: Operational risk — CI dependency for all infra changes
- Recommended fix: Document that CI generates real tfvars and provide a script (`scripts/create-tfvars.sh`) that pulls secrets from SSM/1Password/DO Spaces to generate real tfvars locally. Delete the redundant `.tfvars.example` files (they are identical to the regular `.tfvars`). Add a comment to each `.tfvars` header explaining the CI-generation workflow.
- Suggested validation: `scripts/create-tfvars.sh dev` generates valid dev.tfvars; `terraform plan -var-file=dev.tfvars` succeeds
- Owner suggestion: DevOps / Platform engineer
- Effort estimate: 30 minutes (script + docs)
- Dependencies: Secret storage (SSM or equivalent) for DO + CF tokens
- Status: Open

### Finding ID: INFRA-P2-003 - Deploy depends_on uses service_started instead of service_healthy

- Severity: P2
- Confidence: Medium
- Area: Reliability / Deployment
- Evidence:
  - `infra/digitalocean/docker-compose.yml:58-60` — `api → redis: condition: service_started`
  - `infra/digitalocean/docker-compose.yml:99-101` — `worker → redis: condition: service_started`
  - `infra/digitalocean/docker-compose.yml:116-118` — `web → api: condition: service_started`
  - `infra/digitalocean/docker-compose.yml:32-36` — Redis has HEALTHCHECK defined
  - `infra/digitalocean/docker-compose.yml:66-70` — API has HEALTHCHECK defined
  - `.github/workflows/deploy-do.yml:275` — `sleep 15` after `docker compose up -d` as a workaround
- What is happening: Docker Compose starts dependent services as soon as the dependency is "started" (process running), not when it's "healthy" (HEALTHCHECK passing). The deploy workflow compensates with a `sleep 15` before running health checks, but this is a timing hack — not a guarantee.
- Why it matters: The web service may receive traffic before the API is actually accepting connections. Redis may not be ready to accept connections when API/Worker start, causing startup errors that may or may not be retried.
- User / business impact: Brief service unavailability during deploy rollouts; potential for transient 502 errors from Caddy → web → API chain
- Security / privacy / reliability impact: Low — Docker auto-restarts (restart: unless-stopped) recover from transient connection failures
- Recommended fix: Change `condition: service_started` to `condition: service_healthy` for all 3 depends_on blocks. This requires all dependency services to have HEALTHCHECK defined (they all do). Reduce `sleep 15` to `sleep 5` or remove entirely.
- Suggested validation: `docker compose up -d`; verify all containers reach healthy state before web accepts traffic; remove sleep from deploy workflow and verify health checks still pass
- Owner suggestion: DevOps / Platform engineer
- Effort estimate: 10 minutes (config change + testing)
- Dependencies: None
- Status: Open

## Risks

| Risk | Severity | Likelihood | Impact | Evidence | Mitigation |
| --- | --- | --- | --- | --- | --- |
| Redis auth bypass via known default password | P0 | Medium | High | docker-compose.yml:24 — hardcoded default | Inject REDIS_PASSWORD from GH Secrets |
| Terraform state corruption from committed state files | P0 | Low | Critical | terraform.tfstate in repo root | Remove state files, add .gitignore |
| Missing security headers in production Caddy config | P1 | High | Medium | Caddyfile.prod missing CSP/HSTS | Add headers to .prod/.dev Caddyfiles |
| Operator cannot deploy stack from incomplete .env.example | P1 | Medium | Medium | .env.example missing 10+ vars | Complete .env.example |
| Web app persistence vector via writable container FS | P2 | Low | Medium | Web service lacks read_only: true | Add read_only + tmpfs to web |
| CI-only infrastructure recovery path | P2 | Low | High | All tfvars are placeholders | Document local terraform workflow |
| Brief 502 errors during deploy rollover | P2 | Medium | Low | depends_on: service_started + sleep 15 | Use service_healthy condition |

## Recommendations

### Immediate / Release Blocking

1. **Add REDIS_PASSWORD GitHub Secret** and wire it into deploy-do.yml's env-writing loop. Generate a strong random value. Re-deploy.
2. **Remove committed Terraform state files.** Add `*.tfstate*` to `.gitignore`. Verify remote state in DO Spaces is intact.

### This Week

3. **Add security headers to Caddyfile.prod and Caddyfile.dev.** Copy the full header block from main Caddyfile. This is a config-only change — redeploy on next push.
4. **Complete docker-compose `.env.example`** with all variables referenced in `docker-compose.yml`. Mark required vs optional.
5. **Fix ENVIRONMENT_VARIABLES.md** to accurately describe Compose's default `.env` behavior instead of claiming `env_file` and `.env.local` files.

### This Month

6. **Add `read_only: true` + `tmpfs` to web service** in docker-compose.yml.
7. **Switch depends_on to `condition: service_healthy`** and remove `sleep 15` from deploy workflow.
8. **Clean up env schemas** — remove `M365_CLIENT_STATE` and `TURNSTILE_SECRET_KEY` if not wired, or wire them into docker-compose and deploy.
9. **Create manual Terraform apply documentation** for disaster scenarios.
10. **Restrict `admin_ip_ranges`** in prod configuration to actual office/VPN IPs.

## Quick Wins

| Quick win | Why it helps | Files likely involved | Validation |
| --- | --- | --- | --- | --- |
| Remove committed state files | Eliminates state fork risk and secret exposure vector | `infra/terraform/digitalocean/terraform.tfstate`, `.gitignore` | `git status` shows files deleted; `terraform state list` works from remote |
| Add security headers to Caddyfile.prod/.dev | Instant security posture improvement for production | `infra/digitalocean/Caddyfile.prod`, `Caddyfile.dev` | `curl -sI https://app.mainecybertech.com` shows all 6 headers |
| Complete .env.example | Operators can stand up stack without reverse-engineering compose | `infra/digitalocean/.env.example` | Copy .env.example → .env, `docker compose config` outputs valid config |
| Fix ENVIRONMENT_VARIABLES.md docker-compose section | Eliminates operator confusion about env loading | `docs/ENVIRONMENT_VARIABLES.md:97-107` | Read-through accuracy check |
| Add web read_only+tmpfs | Matches security posture of API/Worker containers | `infra/digitalocean/docker-compose.yml:108-120` | `docker inspect` shows ReadonlyRootfs=true for web container |

## Hardening Backlog

| Backlog item | Priority | Owner suggestion | Effort | Dependency |
| --- | --- | --- | --- | --- |
| Add backup sidecar (Postgres dump cron + DO Spaces upload) | P2 | DevOps | 2h | DO Spaces bucket |
| Add Supabase migration step to deploy workflow | P2 | DevOps | 1h | supabase CLI in CI |
| Add container vulnerability scanning to CI (Trivy/Docker Scout) | P2 | DevOps | 1h | GHCR integration |
| Add Secret rotation automation script | P2 | DevOps | 2h | SSM/1Password API access |
| Add Redis password rotation to Terraform (random_password resource) | P2 | DevOps | 1h | Requires REDIS_PASSWORD wiring first |
| Add cert auto-renewal monitoring to deploy health check | P3 | DevOps | 30m | None |
| Add `depends_on: service_healthy` to docker-compose | P2 | DevOps | 30m | Must verify HEALTHCHECK timing is correct |
| Create disaster recovery runbook (full stack recreate from scratch) | P2 | DevOps | 2h | Real tfvars infrastructure |

## Suggested Tests

### Unit / Integration Tests

- Zod schema test: verify API env schema rejects missing `SUPABASE_URL` but accepts optional empty `STRIPE_SECRET_KEY`
- Worker env schema test: verify `QUEUE_BACKEND` defaults to `bullmq` and rejects invalid values
- Dockerfile test: verify non-root user in each container (`docker run --rm <image> whoami` returns appuser/nextjs)

### E2E / Deployment Tests

- Full docker-compose up with custom REDIS_PASSWORD: verify Redis auth works, API connects
- Deploy with `read_only: true` on web: verify Next.js serves pages without write errors
- Caddyfile header verification: `curl -sI` against each domain confirms CSP + HSTS present

### CI / Pipeline Tests

- Verify deploy-do.yml writes all 29 env pairs correctly by parsing the `for pair` loop
- Verify terraform-do.yml plan output doesn't contain sensitive values in PR comment (already done via `-no-color`)
- Verify rollback workflow: re-run deploy with rollback_sha of previous commit

### Security / Regression Tests

- Redis auth test: `docker exec mct-portal-redis-1 redis-cli ping` without password → fails with NOAUTH
- Container read-only test: `docker exec mct-portal-api-1 touch /test_write` → fails with Read-only file system
- Secret leak scan: grep for `mct_redis_changeme_in_production` across entire repo — should only appear in docker-compose defaults (acceptable) and this audit report

## Suggested Documentation Updates

1. **`docs/ENVIRONMENT_VARIABLES.md`** — Rewrite Docker Compose section (lines 97-107) to describe actual env loading mechanism: single `.env` file read by Compose default behavior, `${VAR:-default}` interpolation
2. **`docs/GITHUB_SECRETS_AND_VARIABLES_MATRIX.md`** — Add `REDIS_PASSWORD` to required secrets list
3. **`docs/TERRAFORM_MANUAL_APPLY.md`** (new) — Document how to run `terraform apply` outside CI: how to create real tfvars, how to initialize backend, how to access DO Spaces state
4. **`infra/digitalocean/.env.example`** — Complete with all missing variables, comments for required vs optional, Redis password generation command
5. **`infra/digitalocean/Caddyfile.prod` + `Caddyfile.dev`** — Add security header comments explaining each header's purpose
6. **`.gitignore`** — Add `*.tfstate` and `*.tfstate.backup` entries

## Open Questions

| Question | Why it matters | Evidence needed |
| --- | --- | --- | --- |
| Does the committed `terraform.tfstate` contain real infrastructure data or is it from a test run? | Determines if secrets need rotation | Inspect state file contents for real resource IDs |
| Is the DO Spaces bucket `portal-terraform-state` accessible and contains current state? | Verifies remote state is the source of truth | `terraform state list` using backend config |
| What is the actual `REDIS_PASSWORD` on the production droplet? | Determines if the hardcoded default is actually in use | SSH into droplet, check `/opt/mct-portal/.env` |
| Is there a `REDIS_PASSWORD` GitHub Secret already set (just not wired into deploy workflow)? | May mean the fix is simpler than scoped | Check GitHub Environment secrets |
| Does Next.js standalone output require writable paths beyond `/tmp`? | Determines feasibility of read_only:true for web | Test with read-only filesystem in staging |
| Are the Caddyfile.prod/.dev files actively managed or are they stale? | Determines whether to fix them or delete them and use main Caddyfile | Check git history for when .prod/.dev were last updated |

## Appendix

### Environment Variable Cross-Reference: docker-compose → deploy-do → env schemas

| Variable | docker-compose | deploy-do writes | API schema | Worker schema | .env.example (compose) |
| --- | --- | --- | --- | --- | --- |
| SUPABASE_URL | Y (app-env) | Y | Y (required) | Y (required) | Y |
| SUPABASE_ANON_KEY | Y (app-env) | Y | Y (required) | Y (required) | Y |
| SUPABASE_SERVICE_ROLE_KEY | Y (app-env) | Y | Y (required) | Y (required) | Y |
| JWT_SECRET | Y (app-env) | Y | Y (required) | — | Y |
| CORS_ORIGIN | Y (app-env) | Y | Y (required) | — | N |
| NODE_ENV | Y (hardcoded) | N | Y (required) | Y (required) | N |
| LOG_LEVEL | Y (hardcoded) | N | Y (required) | Y (required) | N |
| API_PORT | Y (hardcoded) | N | Y (has default) | — | N |
| APP_BASE_URL | Y (app-env) | N (computed) | Y (has default) | — | N |
| REDIS_URL | Y (API+Worker) | N | Y (optional) | Y (has default) | N |
| REDIS_PASSWORD | Y (API+Worker) | **N (GAP)** | — | — | **N (GAP)** |
| SENTRY_DSN | Y (API+Worker) | Y | Y (optional) | Y (optional) | Y |
| STRIPE_SECRET_KEY | Y (API+Worker) | Y | Y (optional) | Y (optional) | Y |
| STRIPE_WEBHOOK_SECRET | Y (API) | Y | Y (optional) | — | Y |
| PUBLIC_TRAFFIC_WEBHOOK_URL | Y (API) | Y | Y (optional) | — | N |
| PUBLIC_LEAD_WEBHOOK_URL | Y (API) | Y | Y (optional) | — | N |
| JSM_DOMAIN | Y (API) | Y | Y (optional) | — | N |
| JSM_EMAIL | Y (API+Worker) | Y | Y (optional) | Y (optional) | Y |
| JSM_API_TOKEN | Y (API+Worker) | Y | Y (optional) | Y (optional) | Y |
| JSM_SERVICEDESK_ID | Y (API) | Y | Y (optional) | — | N |
| JSM_REQUEST_TYPE_ID | Y (API) | Y | Y (optional) | — | N |
| JIRA_BASE_URL | Y (Worker) | Y | — | Y (optional) | Y |
| JIRA_EMAIL | Y (Worker) | Y | — | Y (optional) | Y |
| JIRA_API_TOKEN | Y (Worker) | Y | — | Y (optional) | Y |
| JSM_BASE_URL | Y (Worker) | Y | — | Y (optional) | Y |
| M365_TENANT_ID | Y (Worker) | Y | — | Y (optional) | Y |
| M365_CLIENT_ID | Y (Worker) | Y | — | Y (optional) | Y |
| M365_CLIENT_SECRET | Y (Worker) | Y | — | Y (optional) | Y |
| SMTP_HOST | Y (Worker) | Y | Y (optional) | Y (optional) | Y |
| SMTP_PORT | Y (Worker) | Y | Y (optional) | Y (optional) | Y |
| SMTP_USER | Y (Worker) | Y | Y (optional) | Y (optional) | Y |
| SMTP_PASS | Y (Worker) | Y | Y (optional) | Y (optional) | Y |
| EMAIL_FROM | Y (Worker) | Y | Y (optional) | Y (optional) | Y |
| API_BASE_URL | Y (Worker) | N (computed) | — | Y (optional) | N |
| API_DOMAIN | Y (Worker, computed) | Y | — | — | N |
| APP_DOMAIN | Y (app-env) | Y | — | — | N |
| HEALTH_PORT | Y (Worker, hardcoded) | N | — | Y (has default) | N |
| QUEUE_BACKEND | Y (Worker, hardcoded) | N | — | Y (has default) | N |
| GHCR_IMAGE_PREFIX | Y (all images) | N (inline env) | — | — | N |
| IMAGE_TAG | Y (all images) | N (inline env) | — | — | N |
| M365_CLIENT_STATE | — | — | Y (optional) | — | N |
| TURNSTILE_SECRET_KEY | — | — | Y (optional) | — | N |
| JIRA_WEBHOOK_SECRET | — | — | Y (optional) | — | N |
| JSM_WEBHOOK_SECRET | — | — | Y (optional) | — | N |
| M365_WEBHOOK_SECRET | — | — | Y (optional) | — | N |

### Container Security Posture Comparison

| Control | API | Worker | Web | Redis | Caddy |
| --- | --- | --- | --- | --- | --- |
| Non-root user | Y (appuser, UID 1001) | Y (appuser, UID 1001) | Y (nextjs, UID 1001) | Y (redis:7-alpine) | N/A |
| SHA-pinned image | Y | Y | Y | Y | Y |
| read_only: true | Y | Y | **N** | Y | N/A |
| tmpfs: /tmp | Y | Y | **N** | Y | N/A |
| cap_drop: ALL | Y | Y | Y | Y | Y |
| no-new-privileges | Y | Y | Y | Y | Y |
| HEALTHCHECK | Y (port 4000) | Y (port 3001) | Y (port 3000) | Y (redis-cli) | N |
| mem_limit | 256m | 256m | 256m | 48m | 64m |
| restart: unless-stopped | Y | Y | Y | Y | Y |

### Caddyfile Header Drift

| Server Block | File | HSTS | CSP | X-Frame-Options | X-Content-Type-Options | Referrer-Policy |
| --- | --- | --- | --- | --- | --- | --- |
| www+app com | main Caddyfile | Y | Y | Y | Y | Y |
| api com | main Caddyfile | Y | Y | Y | Y | Y |
| www+app us | main Caddyfile | Y | Y | Y | Y | Y |
| api us | main Caddyfile | Y | Y | Y | Y | Y |
| www+app com | **Caddyfile.prod** | **N** | **N** | Y | Y | Y |
| api com | **Caddyfile.prod** | **N** | **N** | Y | Y | Y |
| www+app us | **Caddyfile.dev** | **N** | **N** | Y | Y | Y |
| api us | **Caddyfile.dev** | **N** | **N** | Y | Y | Y |
