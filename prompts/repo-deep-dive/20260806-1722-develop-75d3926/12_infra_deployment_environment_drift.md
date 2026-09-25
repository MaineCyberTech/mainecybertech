# Infrastructure, Deployment, and Environment Drift Audit

## Audit Metadata

- Audit name: repo-deep-dive
- Run: 20260806-1722-develop-75d3926
- Repository: https://github.com/MaineCyberTech/mainecybertech (MCT client portal monorepo)
- Branch: develop
- Commit SHA: 75d39269310fcc09826fe532d5838d3a53d1739a
- Generated at: 2026-08-06 17:22 UTC
- Auditor: principal-level repository auditor (fresh pass)
- Area code: INFRA
- Output path: prompts/repo-deep-dive/20260806-1722-develop-75d3926/12_infra_deployment_environment_drift.md (operator-specified path)
- Scope limitations:
  - No live access to the DO droplet, hosted Supabase, or GHCR; all statements derive from repository files at HEAD (75d3926).
  - Terraform state files present on disk (`terraform.tfstate`, `terraform.tfstate.backup`) were not opened (sensitive); gitignore status verified via `git check-ignore` and `git ls-files` only.
  - Secrets referenced in workflows were never printed.

## Scope

Reviewed: all three Dockerfiles (`apps/{api,web,worker}/Dockerfile`), `infra/digitalocean/` (docker-compose.yml, Caddyfile, Caddyfile.dev, Caddyfile.prod, prometheus.yml, prometheus.rules.yml, .env.example), all Terraform (`infra/terraform/digitalocean/*.tf`, `env/*.hcl`, `env/*.tfvars`, cloud-init.yml, .terraform.lock.hcl), deploy scripts (`scripts/backup-database.sh`, `scripts/backup-database.ps1`), runtime env validators (`apps/api/src/config/env.ts`, `apps/worker/src/env.ts`), and the deploy/terraform workflows (details in companion report `10_github_actions_cicd_governance.md`).

## Evidence Reviewed

| Evidence | Type | Why relevant | Notes |
| -------- | ---- | ------------ | ----- |
| `apps/api/Dockerfile`, `apps/web/Dockerfile`, `apps/worker/Dockerfile` | Dockerfiles | Multi-stage, non-root, digests, healthchecks | All 3 pinned to same `node:20-alpine` digest; non-root users |
| `infra/digitalocean/docker-compose.yml` (168 lines) | Compose | Runtime security profile | cap_drop ALL, no-new-privileges, read_only, tmpfs, mem limits, Redis password required |
| `infra/digitalocean/Caddyfile{,.dev,.prod}` | Reverse proxy | TLS + headers | CSP overrides app middleware; dev/prod variants |
| `infra/digitalocean/prometheus.yml` + `prometheus.rules.yml` | Observability | Scrapes api/worker | tmpfs TSDB + no Alertmanager |
| `infra/terraform/digitalocean/{providers,variables,droplet,firewall,dns}.tf` | Terraform | IaC | nyc3 Spaces backend, CF-only ingress, `prevent_destroy` |
| `infra/terraform/digitalocean/env/{backend.dev.hcl,backend.prod.hcl}` | Backend config | State buckets | `portal-terraform-state-development` / `-production`, nyc3 endpoint |
| `infra/terraform/digitalocean/env/{dev.tfvars,prod.tfvars}` | Vars | Env config | prod.tfvars = placeholders (tracked despite gitignore); dev.tfvars = real values (untracked) |
| `infra/terraform/digitalocean/cloud-init.yml` | Bootstrap | Docker + UFW | UFW allows 2376 (unused) |
| `.gitignore` | Config | Secret hygiene | `.tfstate`/`.terraform`/`env/*.tfvars` ignored; prod.tfvars still tracked |
| `apps/api/src/config/env.ts`, `apps/worker/src/env.ts` | Validators | Runtime env schema | Zod; all optional vars default safely |
| `.github/workflows/deploy-do.yml` + `terraform-do.yml` | Workflows | Deploy/env wiring | .env heredoc, droplet provisioning, tfvars generation |
| `scripts/backup-database.sh` | Script | Backup/restore | pg_dump → S3, 30-day retention |

## Executive Summary

The container and deployment layer is the strongest part of this stack. All three Dockerfiles are multi-stage, run as non-root users (uid 1001), pin their base image by digest, and ship HEALTHCHECKs. The compose file applies a coherent security profile (cap_drop ALL, no-new-privileges, read_only rootfs with tmpfs for writes, mem limits, Redis password **required** with no fallback, Prometheus + Caddy included with digest-pinned images). Terraform uses DO Spaces state (nyc3) in env-specific buckets (`portal-terraform-state-development` / `portal-terraform-state-production`), `prevent_destroy` on the droplet, and restricts 80/443 to Cloudflare IP ranges.

Four areas need attention, in priority order:

1. **SSH is open to the world on both droplets** — `admin_ip_ranges` defaults to `0.0.0.0/0` (variables.tf:79) and the terraform-do workflow's tfvars generator does not set it (INFRA-P1-001). The only protection is the SSH key itself.
2. **Terraform state has no locking and no concurrency guard** — DO Spaces S3 backend cannot lock (no DynamoDB); terraform-do.yml has no concurrency group. Two concurrent applies can corrupt state (INFRA-P2-002).
3. **Prometheus is effectively a temp buffer** — TSDB on tmpfs inside a 256MB mem_limit container (metrics lost on restart, memory pressure), and there is no Alertmanager, so the alert rules (incl. the Watchdog) have no delivery path (INFRA-P2-003).
4. **CSP is downgraded at the edge** — both Caddy and the Next.js middleware use `script-src 'unsafe-inline'`, which defeats the nonce mechanism the middleware generates (INFRA-P2-004).

Plus: dev droplet capacity concern (512MB vs ~1.1GB of compose mem limits), ineffective `docker image prune -af` ordering in deploy (old images never pruned — the "targeted cleanup" described in AGENTS.md is absent at HEAD), dead compose defaults (`:latest` tags are never published), redis password visible in process args/healthcheck, and a gitignore/tracked-file drift for `env/prod.tfvars`.

Overall domain score: **3.8 / 5** — production-grade container hygiene, with real hardening debt in SSH exposure, state locking, and observability delivery.

## Inventory

| Item | Path / symbol | Purpose | Current state | Risk | Notes |
| ---- | ------------- | ------- | ------------- | ---- | ----- |
| API Dockerfile | `apps/api/Dockerfile` | Build + runtime | Good | Low | node:20-alpine digest-pinned, appuser, HEALTHCHECK |
| Web Dockerfile | `apps/web/Dockerfile` | Next.js standalone | Good | Low | nextjs user, public/ + version.json, HEALTHCHECK |
| Worker Dockerfile | `apps/worker/Dockerfile` | Build + runtime | Good | Low | appuser, HEALTHCHECK on 3001 |
| docker-compose | `infra/digitalocean/docker-compose.yml` | Prod stack | Good | Med | Security profile strong; prometheus tmpfs; dead `:latest` defaults |
| Caddyfile set | `infra/digitalocean/Caddyfile*` | TLS + routing | Good | Med | CSP unsafe-inline overrides middleware nonce CSP |
| Prometheus | `prometheus.yml`, `prometheus.rules.yml` | Metrics + alerts | Functional | Med | tmpfs TSDB; no Alertmanager |
| providers.tf | `infra/terraform/digitalocean/providers.tf` | Backend + providers | Good | Med | Spaces s3 backend; no locking |
| backend.{dev,prod}.hcl | `infra/terraform/digitalocean/env/` | State buckets | Good | Low | Correct bucket names + nyc3 |
| variables.tf | `infra/terraform/digitalocean/variables.tf` | Tunables | Gap | High | admin_ip_ranges default 0.0.0.0/0 |
| firewall.tf | `infra/terraform/digitalocean/firewall.tf` | Ingress rules | Good | Low | 22 admin-only (in theory), 80/443 CF-only |
| droplet.tf / cloud-init.yml | `infra/terraform/digitalocean/` | Droplet bootstrap | Good | Low | prevent_destroy; UFW 2376 stale |
| dns.tf | `infra/terraform/digitalocean/dns.tf` | DNS records | Good | Low | CF proxied, env-conditional |
| env validators | `apps/api/src/config/env.ts`, `apps/worker/src/env.ts` | Runtime config | Good | Low | Zod; safe optional defaults |
| deploy-do | `.github/workflows/deploy-do.yml` | Deploy pipeline | Good | Med | Image cleanup ineffective; health checks loose (CI report) |
| backup scripts | `scripts/backup-database.{sh,ps1}` | DB backup | Good | Low | S3 + 30d retention |

## Domain Scorecard

| Category                  | Score | Evidence | Gap | Recommended action |
| ------------------------- | ----: | -------- | --- | ------------------ |
| Dockerfiles               |    5 | 3/3 multi-stage, non-root, digest-pinned base, HEALTHCHECK, prod-only deps | None | Keep |
| Compose                   |    4 | Security profile + Redis password required + read_only + mem limits | Prometheus tmpfs TSDB; dead `:latest` defaults; no worker healthcheck in compose (image default used) | Move TSDB to volume; fix defaults |
| Terraform/OpenTofu        |    3 | Spaces backend nyc3, env buckets, CF-only ingress, prevent_destroy | SSH 0.0.0.0/0; no state lock; no concurrency; fmt check non-blocking | INFRA-P1-001, INFRA-P2-002 |
| Cloud/hosting config      |    3 | droplet/cloud-init/DNS coherent | UFW 2376 stale; docs claim 2376 firewall rule (absent — actually more restrictive) | Clean up cloud-init; fix docs |
| Deploy scripts            |    3 | heredoc .env, rollback, health checks | image prune ordering ineffective; optional secrets not deployed | Fix prune order; document optional vars |
| Reverse proxy             |    3 | TLS (origin certs/internal), SSE flush, headers, dev/prod variants | CSP unsafe-inline overrides nonce CSP | Align CSP with middleware |
| Environment examples      |    4 | 3 app + infra `.env.example` | deploy generator misses TURNSTILE/M365_CLIENT_STATE/webhook secrets | Sync generator with examples |
| Runtime validators        |    4 | Zod in API + worker | Web relies on Dockerfile defaults | None needed |
| Secret references         |    4 | GitHub Secrets → .env on droplet, chmod 600 | redis password in command line; no rotation automation | Move to env file/redis.conf |
| Build args                |    4 | NEXT_PUBLIC_* with defaults; build-push race (CI report) | test-accounts arg not passed by build-push | CI-P1-001 |
| Container users           |    5 | api/worker appuser(1001), web nextjs(1001), compose drops ALL caps | None | Keep |
| Health/readiness/liveness |    3 | Dockerfile HEALTHCHECKs + compose checks + deploy checks | Deploy checks accept failure states (CI-P2-004); no liveness for caddy | Strict deploy checks |

Overall domain score: **3.8 / 5**

## Detailed Review

### Item: Dockerfiles (api / web / worker)

- Evidence: `apps/api/Dockerfile`, `apps/web/Dockerfile`, `apps/worker/Dockerfile`
- What it does: Each builds with pnpm (corepack pnpm@10), then runs `pnpm install --prod --ignore-scripts` in a fresh runtime stage as uid 1001 with `NODE_ENV=production` and a HEALTHCHECK. Web uses Next standalone output with `outputFileTracingRoot`-style copy of `packages/`.
- Current controls: base image `node:20-alpine@sha256:fb4cd12c...` digest-pinned; `USER appuser`/`USER nextjs`; `HEALTHCHECK` on `/health` (api), `/health` (worker, port 3001), root (web); web builder stage removes `.next/cache`.
- Missing controls: `--ignore-scripts` only in runtime stage (builder still runs lifecycle scripts of dev deps — acceptable); no seccomp/apparmor profile; images not scanned post-build (trivy is fs-mode only); no SBOM/provenance (cosign).
- Recommended improvement: add `docker scan`/trivy image scan + SBOM attestation (backlog); keep everything else.

### Item: docker-compose.yml

- Evidence: `infra/digitalocean/docker-compose.yml` (168 lines)
- What it does: Runs redis (password REQUIRED via `${REDIS_PASSWORD:?...}` with no fallback), api, worker, web, prometheus, caddy; all apps cap_drop ALL + no-new-privileges + read_only + tmpfs + mem limits; prometheus internal only (no published ports); caddy publishes 80/443.
- Current controls: Redis auth mandatory; healthchecks on redis/api; `depends_on` conditions; digest-pinned redis/caddy/prometheus images; web tmpfs for `.next/cache`.
- Missing controls / risks:
  - Prometheus TSDB (`--storage.tsdb.path=/prometheus`) on tmpfs inside 256MB mem_limit → data lost on restart, memory exhaustion risk (INFRA-P2-003).
  - Default image refs `${GHCR_IMAGE_PREFIX:-ghcr.io/mainecybertech/mainecybertech}/mct-api:${IMAGE_TAG:-latest}` are dead — only SHA tags are ever published; local `docker compose up` without `.env` fails at pull.
  - Caddy `mem_limit: 64m` is tight; caddy has no healthcheck.
  - `depends_on` uses `service_started` (not `service_healthy`) for redis → brief startup race absorbed by ioredis retry (acceptable).
  - Redis password appears in `command:` and healthcheck args → visible via `docker inspect`/process list.
- Recommended improvement: prometheus volume or accept ephemeral metrics intentionally; update defaults; increase caddy limit; move redis password into a config file or accept the tradeoff.

### Item: Terraform

- Evidence: `infra/terraform/digitalocean/{providers,variables,droplet,firewall,dns}.tf`, `env/backend.{dev,prod}.hcl`
- What it does: Single droplet per env (nyc3, prevent_destroy), DO firewall (SSH from admin_ip_ranges; 80/443 from Cloudflare IPv4+IPv6), Cloudflare DNS A records proxied, backend state in DO Spaces buckets `portal-terraform-state-development`/`portal-terraform-state-production` at `https://nyc3.digitaloceanspaces.com` (matches the fixed bucket-name requirement).
- Current controls: `prevent_destroy`; provider versions pinned in `.terraform.lock.hcl` (digitalocean 2.90.0, cloudflare 5.20.0); `encrypt = true` on backend.
- Missing controls / risks:
  - `admin_ip_ranges` default `["0.0.0.0/0", "::/0"]` (variables.tf:79) and terraform-do's tfvars generator never sets it → SSH open to the internet on BOTH droplets (INFRA-P1-001).
  - S3-compatible Spaces backend does not support state locking; terraform-do.yml has no concurrency group → concurrent applies can corrupt state (INFRA-P2-002).
  - `ignore_changes = [user_data]` on the droplet — cloud-init changes won't apply without manual re-provisioning (acceptable, but undocumented).
- Recommended improvement: pass `admin_ip_ranges` from a GitHub secret; add a lock note + concurrency group; document `ignore_changes`.

### Item: Reverse proxy (Caddy)

- Evidence: `Caddyfile`, `Caddyfile.dev`, `Caddyfile.prod`
- What it does: Routes www/app → web:3000, api → api:4000 with `flush_interval -1` for the SSE stream; TLS via origin certs (prod/default) or `tls internal` (dev; fallback via sed in deploy-do when certs empty); security headers + HSTS (preload on prod, no-preload on dev).
- Risks: CSP `script-src 'self' 'unsafe-inline'` in every variant. Caddy's `header` directive replaces the upstream (Next.js middleware) CSP, so the nonce-based CSP generated in `apps/web/middleware.ts` is overridden by a weaker, nonce-free CSP at the edge. The middleware itself also sets `'unsafe-inline'` in prod (middleware.ts:42) — the nonce adds little today (INFRA-P2-004).
- Recommended improvement: drop `'unsafe-inline'` from script-src and use the nonce (needs coordinated change with middleware + next.config headers since Caddy replaces them).

### Item: Env validators & secret references

- Evidence: `apps/api/src/config/env.ts` (36 keys, Zod), `apps/worker/src/env.ts` (30 keys, Zod)
- What it does: Every required value validated at boot (fail-fast). Deploy-do writes 30 vars via SSH heredoc into `/opt/mct-portal/.env` (`chmod 600`).
- Risks: `M365_CLIENT_STATE`, `TURNSTILE_SECRET_KEY`, `JIRA/JSM/M365_WEBHOOK_SECRET` exist in `.env.example`/schema but are NOT written by deploy-do — all optional, so boot succeeds; M365 webhook auth (the P0 clientState fix) will reject all traffic because the secret is absent (fail-closed, but feature-dead). Unknown whether these were set manually on the droplet (INFRA-P3-006).
- Recommended improvement: either add them to the deploy .env generator or document why they're absent.

## Scenario / Control Matrix

| ID        | Scenario or control | Evidence | Current control | Gap | Severity | Recommendation |
| --------- | ------------------- | -------- | --------------- | --- | -------- | -------------- |
| INFRA-001 | SSH exposure | variables.tf:79 + terraform-do.yml tfvars | admin_ip_ranges default 0.0.0.0/0; CI never sets it | SSH open on prod+dev | P1 | Secret-driven admin_ip_ranges |
| INFRA-002 | State locking | providers.tf + terraform-do.yml | Spaces backend, no lock, no concurrency | Concurrent apply corruption | P2 | Concurrency group + documented lock absence |
| INFRA-003 | Metrics persistence | prometheus.yml + compose prometheus | tmpfs TSDB, 256m | Data loss + OOM risk | P2 | Volume or intentional ephemerality |
| INFRA-004 | Alert delivery | prometheus.rules.yml | Rules defined | No Alertmanager | P2 | Deploy Alertmanager + notify channel |
| INFRA-005 | CSP enforcement | Caddyfile + middleware.ts | unsafe-inline at edge + app | Nonce defeated | P2 | Coordinated CSP hardening |
| INFRA-006 | Dev capacity | dev.tfvars (s-1vcpu-512mb) + compose mem limits (~1.1GB) | 512MB droplet | OOM/swap risk | P2 | Raise dev droplet or trim limits |
| INFRA-007 | Image cleanup | deploy-do.yml (prune before down) | prune -af before compose down | Old images never removed | P2 | Reorder/rmi after down |
| INFRA-008 | Optional secrets | deploy-do.yml env list vs env.ts/.env.example | 5 optional vars not deployed | M365 webhook dead; unknown state | P3 | Sync generator or document |
| INFRA-009 | Local compose defaults | compose `${IMAGE_TAG:-latest}` | SHA-only tags published | Local up fails w/o .env | P3 | Defaults to a real tag or fail loudly |
| INFRA-010 | Redis password exposure | compose redis command + healthcheck | Password in args | Process-list exposure | P3 | redis.conf via secret file |
| INFRA-011 | Gitignore drift | .gitignore:57 vs tracked prod.tfvars | prod.tfvars tracked (placeholders) | Ignore rule ineffective | P3 | git rm --cached |
| INFRA-012 | UFW stale rule | cloud-init.yml:24 | ufw allow 2376 | Unneeded surface | P3 | Remove |

## Findings

### Finding ID: INFRA-P1-001 - SSH access is open to the internet on both droplets (admin_ip_ranges default 0.0.0.0/0 and CI never overrides it)

- Severity: P1 (High)
- Confidence: High
- Area: Infrastructure — network exposure
- Evidence:
  - `infra/terraform/digitalocean/variables.tf` line 79: `default = ["0.0.0.0/0", "::/0"]` for `admin_ip_ranges`
  - `.github/workflows/terraform-do.yml` "Create tfvars file" step: writes do_token, ssh_fingerprint, cloudflare tokens, droplet_size, environment — **no `admin_ip_ranges`**
  - `infra/terraform/digitalocean/env/prod.tfvars` (tracked file): no `admin_ip_ranges` either
  - `infra/terraform/digitalocean/firewall.tf` lines 10-12: SSH inbound sourced from `var.admin_ip_ranges`
- What is happening: Every terraform apply (dev and prod, including via CI) opens TCP 22 to `0.0.0.0/0`. The only authentication is the root SSH key (`ssh_keys = [var.ssh_fingerprint]`).
- Why it matters: The droplet hosts the entire production stack (API with DB service-role access, web, worker, Redis) plus `/opt/mct-portal/.env` containing ~20 secrets. Internet-wide SSH turns key theft/brute-force into a full-compromise path. UFW on the host also allows 22 from anywhere (cloud-init `ufw allow 22/tcp`).
- User / business impact: Full tenant data exposure if the key leaks; continuous brute-force noise.
- Security / privacy / reliability impact: P1 network exposure; single factor (key) on prod.
- Recommended fix: (a) add `admin_ip_ranges` to the terraform-do tfvars generator, sourced from a GitHub secret (e.g., office/VPN/CI-runner ranges); (b) set the default in variables.tf to a deny-safe value or make the variable required; (c) after apply, verify `doctl compute firewall` shows the restricted source.
- Suggested validation: `terraform plan` output must show the firewall source set change; then attempt SSH from a non-allowed IP (must time out) and from an allowed one (must succeed).
- Owner suggestion: platform/infrastructure
- Effort estimate: Small
- Dependencies: GitHub secret for allowed CIDRs
- Status: Open

### Finding ID: INFRA-P2-002 - Terraform state has no locking and workflows have no concurrency guard

- Severity: P2 (Medium)
- Confidence: High
- Area: Infrastructure — state integrity
- Evidence:
  - `infra/terraform/digitalocean/providers.tf` lines 4-14: `backend "s3"` against DO Spaces with no `dynamodb_table` lock config (DO Spaces has no lock support)
  - `.github/workflows/terraform-do.yml`: no `concurrency:` key anywhere
- What is happening: Two pushes to the same branch (or a plan/apply overlap) can run `terraform apply` concurrently against the same Spaces state object; without locking, state writes race and can corrupt or silently lose resource definitions.
- Why it matters: Corrupted state blocks all future applies (`prevent_destroy` droplet could be destroyed/recreated wrongly on a bad plan baseline) and recovery requires manual state surgery.
- User / business impact: Infra changes fail or damage state; longer incident recovery.
- Security / privacy / reliability impact: State contains resource config; corruption = availability risk.
- Recommended fix: Add `concurrency: group: terraform-do-${{ github.ref }}, cancel-in-progress: false` (plan and apply share the group); optionally use `-lock-timeout` (no-op for Spaces, but documents intent); document that DO Spaces cannot lock.
- Suggested validation: Trigger two back-to-back pushes to develop; confirm the second apply waits.
- Owner suggestion: platform/infrastructure
- Effort estimate: Small
- Dependencies: None
- Status: Open

### Finding ID: INFRA-P2-003 - Prometheus TSDB on tmpfs inside a 256MB container: metrics lost on restart, memory pressure

- Severity: P2 (Medium)
- Confidence: High
- Area: Infrastructure — observability
- Evidence:
  - `infra/digitalocean/docker-compose.yml` lines 127-143 (prometheus service): `command: --storage.tsdb.path=/prometheus --storage.tsdb.retention.time=30d` with `tmpfs: - /prometheus` and `mem_limit: 256m`
  - `infra/digitalocean/prometheus.rules.yml` (alert rules incl. Watchdog)
- What is happening: Metrics are stored in memory-backed tmpfs; every container restart (deploy, OOM, droplet reboot) wipes all history, and the 30d retention setting is meaningless. Prometheus growth also counts against the 256MB mem_limit, risking OOM kills.
- Why it matters: The alerting/monitoring story (a claimed strength of this platform) has no durable data and a fragile runtime; restart → blank dashboards.
- User / business impact: Cannot investigate incidents across restarts; monitoring silently degraded.
- Security / privacy / reliability impact: Observability gap during incident response.
- Recommended fix: Give prometheus a named volume (`prometheus-data`) for `/prometheus`, or deliberately drop `retention.time=30d` and document ephemerality; consider a dedicated alert path (see INFRA-P2-004).
- Suggested validation: `docker compose restart prometheus`; confirm `up` history persists.
- Owner suggestion: platform
- Effort estimate: Small
- Dependencies: None
- Status: Open

### Finding ID: INFRA-P2-004 - Alert rules have no delivery path (no Alertmanager) and edge CSP defeats the nonce

- Severity: P2 (Medium)
- Confidence: High
- Area: Infrastructure — monitoring + security headers
- Evidence:
  - `infra/digitalocean/prometheus.rules.yml` header comment: "for delivery (email/Slack/etc.) an Alertmanager deployment is required"
  - `infra/digitalocean/docker-compose.yml`: no alertmanager service
  - `infra/digitalocean/Caddyfile*`: `Content-Security-Policy ... script-src 'self' 'unsafe-inline' ...`
  - `apps/web/middleware.ts` lines 38-43: prod CSP also includes `'unsafe-inline'`
- What is happening: (a) MCTServiceDown/MCTHighRequestErrorRate/Watchdog alerts fire into a void — the Watchdog's stated purpose ("validates the alert path") validates nothing; (b) both the edge (Caddy replaces response headers) and the app emit `script-src 'unsafe-inline'`, so the nonce generated by middleware.ts does not meaningfully restrict script execution.
- Why it matters: No proactive alerting means outages are discovered by users; nonce CSP is theater while unsafe-inline is present.
- User / business impact: Delayed incident detection; XSS resistance weaker than intended.
- Security / privacy / reliability impact: Defensive-layer degradation.
- Recommended fix: Deploy Alertmanager (digest-pinned) with email/Slack receiver; tighten CSP by removing `'unsafe-inline'` from script-src and carrying the nonce through Caddy (Caddy's `header` directive can append instead of replace, or the CSP can be generated app-side and allowed through). Split into two workstreams.
- Suggested validation: Trigger MCTServiceDown by stopping the worker; confirm alert reaches the channel.
- Owner suggestion: platform
- Effort estimate: Medium
- Dependencies: None
- Status: Open

### Finding ID: INFRA-P2-005 - Dev droplet capacity: compose mem limits (~1.1GB) exceed the 512MB droplet

- Severity: P2 (Medium)
- Confidence: Medium (actual footprint depends on workload)
- Area: Infrastructure — capacity
- Evidence:
  - `infra/terraform/digitalocean/env/dev.tfvars`: `droplet_size = "s-1vcpu-512mb-10gb"`
  - `infra/digitalocean/docker-compose.yml` mem limits: api 256m + worker 256m + web 256m + redis 48m + prometheus 256m + caddy 64m ≈ 1,136 MB
- What is happening: The dev droplet has 512MB RAM but the stack's configured caps sum to ~1.1GB; the web (Next standalone) and API alone typically consume 150-300MB combined with real traffic. The 1vCPU also limits concurrent work (builder caches, worker tasks).
- Why it matters: OOM-kills and swap thrash cause flaky dev-site behavior and slow deploys — previously observed symptom class in this project.
- User / business impact: Dev site instability; unreliable staging for customers.
- Security / privacy / reliability impact: Availability.
- Recommended fix: Raise dev droplet to at least `s-1vcpu-1gb` (or `s-2vcpu-2gb` to mirror prod), and/or trim prometheus mem_limit.
- Suggested validation: `free -m` + `docker stats` on the dev droplet under load; watch for OOM-killed containers.
- Owner suggestion: platform/infrastructure
- Effort estimate: Small (one tfvars change + apply)
- Dependencies: None
- Status: Open

### Finding ID: INFRA-P2-006 - Deploy-time docker image cleanup is ineffective (prune runs before old containers are removed)

- Severity: P2 (Medium)
- Confidence: High
- Area: Infrastructure — deployment lifecycle
- Evidence:
  - `.github/workflows/deploy-do.yml` "Deploy containers" step: `docker image prune -af` (line 303) executes before `docker compose -p mct-portal down --remove-orphans` (line 319)
  - AGENTS.md claims "Deploy: targeted image cleanup — `docker image ls | grep mct- | grep -v $TAG | xargs docker rmi`" — **no such step exists at HEAD**
- What is happening: `prune -af` skips images referenced by running containers; at that point the old containers are still up, so nothing is removed. Every deploy adds 3 images (~0.5-1GB total) that are never reclaimed.
- Why it matters: Disk-full outages on the small droplet; drift between documented and actual deploy behavior.
- User / business impact: Droplet disk exhaustion → failed deploys / container restarts.
- Security / privacy / reliability impact: Availability.
- Recommended fix: Move cleanup after `compose down` (e.g., `docker image prune -af` after down, or the targeted `grep mct- | grep -v $IMAGE_TAG | xargs docker rmi` documented in AGENTS.md).
- Suggested validation: Deploy twice to dev; `docker image ls | grep mct-` must show only current + previous tags.
- Owner suggestion: platform
- Effort estimate: Trivial
- Dependencies: None
- Status: Open

### Finding ID: INFRA-P3-007 - Compose default image refs are dead (`:latest` tags are never published)

- Severity: P3 (Low)
- Confidence: High
- Area: Infrastructure — local DX / config drift
- Evidence:
  - `infra/digitalocean/docker-compose.yml` lines 40/73/109: `${GHCR_IMAGE_PREFIX:-ghcr.io/mainecybertech/mainecybertech}/mct-*:${IMAGE_TAG:-latest}`
  - All CI pushes use SHA tags only (`build-push.yml`, `deploy-do.yml`)
- What is happening: `docker compose up` without a populated `.env` attempts to pull `:latest` images that do not exist; `.env.example` documents IMAGE_TAG/GHCR_IMAGE_PREFIX, but the default path fails.
- Why it matters: Local/recovery compose runs fail with confusing pull errors.
- Recommended fix: Either publish `latest` alongside SHA tags on main, or make the default point to a known-good tag, or add an explicit guard that fails with a clear message.
- Suggested validation: `docker compose config` on a fresh clone without .env should either resolve or error clearly.
- Owner suggestion: platform
- Effort estimate: Small
- Dependencies: None
- Status: Open

### Finding ID: INFRA-P3-008 - Optional secret env vars referenced by app schema/examples are not deployed by the pipeline

- Severity: P3 (Low)
- Confidence: Medium (droplet state unverifiable)
- Area: Infrastructure — env drift
- Evidence:
  - `apps/api/src/config/env.ts` lines 31-35: `JIRA_WEBHOOK_SECRET`, `JSM_WEBHOOK_SECRET`, `M365_WEBHOOK_SECRET`, `M365_CLIENT_STATE`, `TURNSTILE_SECRET_KEY` (all optional)
  - `apps/api/.env.example` lists them
  - `.github/workflows/deploy-do.yml` "Setup droplet" env loop: none of the 5 are written
- What is happening: If these were never set manually on the droplet, M365 webhook authentication (the P0 clientState hardening) fails closed (all M365 webhook events rejected), Turnstile captcha is disabled, and webhook signature checks for Jira/JSM/M365 are unset.
- Why it matters: Feature/security capability silently absent in prod despite passing CI.
- Recommended fix: Add the 5 vars to the deploy-do .env generator (with secrets or documented empty defaults) or document explicitly that they are intentionally not deployed and confirm the manual droplet state.
- Suggested validation: Check `/opt/mct-portal/.env` on both droplets for these keys.
- Owner suggestion: platform
- Effort estimate: Trivial
- Dependencies: GitHub secrets
- Status: Open

### Finding ID: INFRA-P3-009 - Redis password exposed in process arguments and healthcheck command

- Severity: P3 (Low)
- Confidence: High
- Area: Infrastructure — secret handling
- Evidence:
  - `infra/digitalocean/docker-compose.yml` line 24: `command: redis-server --requirepass ${REDIS_PASSWORD:?...}`
  - line 33: healthcheck `redis-cli -a ${REDIS_PASSWORD:?...} ping`
- What is happening: The password is visible to anyone with `docker inspect`/process-list access on the droplet and in `docker compose ps` output.
- Why it matters: Defense-in-depth; password reuse across services amplifies a host compromise.
- Recommended fix: Pass via `REDISCLI_AUTH`/config file, or accept the tradeoff (single-tenant droplet) and document it.
- Suggested validation: None required.
- Owner suggestion: platform
- Effort estimate: Small
- Dependencies: None
- Status: Open (by-design tradeoff possible)

### Finding ID: INFRA-P3-010 - Gitignore drift: `env/*.tfvars` ignored but `env/prod.tfvars` is tracked

- Severity: P3 (Low)
- Confidence: High
- Area: Infrastructure — repo hygiene
- Evidence:
  - `.gitignore` line 57: `**/env/*.tfvars`
  - `git ls-files` shows `infra/terraform/digitalocean/env/prod.tfvars` tracked (placeholder values)
- What is happening: The ignore rule is ineffective for prod.tfvars (tracked before the rule existed). Values are placeholders, so no secret leak today, but the file is stale relative to the CI-generated tfvars format (missing admin_ip_ranges, droplet_size differs: s-2vcpu-2gb vs CI's s-1vcpu-512mb).
- Why it matters: Future edits could accidentally commit real values; stale file misleads operators about prod config.
- Recommended fix: `git rm --cached infra/terraform/digitalocean/env/prod.tfvars` (keep file locally or rely on `.example`).
- Suggested validation: `git status` clean after change; fresh clone has no tfvars.
- Owner suggestion: platform
- Effort estimate: Trivial
- Dependencies: None
- Status: Open

## Risks

| Risk | Severity | Likelihood | Impact | Evidence | Mitigation |
| ---- | -------- | ---------- | ------ | -------- | ---------- |
| Internet-wide SSH on prod droplet | P1 | Certain (current config) | Full compromise on key leak | variables.tf:79, firewall.tf:12 | INFRA-P1-001 |
| Terraform state corruption | P2 | Medium (concurrent applies) | Infra unmanageable | providers.tf (no lock), terraform-do.yml (no concurrency) | INFRA-P2-002 |
| Metrics loss + alert dead-end | P2 | Certain (tmpfs; no Alertmanager) | No monitoring history/alerts | compose prometheus service, prometheus.rules.yml | INFRA-P2-003/004 |
| Nonce CSP defeated by unsafe-inline | P2 | Certain | Weaker XSS defense | Caddyfile*, middleware.ts:42 | INFRA-P2-004 |
| Dev droplet OOM | P2 | Medium | Dev-site outages | dev.tfvars vs compose mem limits | INFRA-P2-005 |
| Disk-full from uncleaned images | P2 | Certain over time | Failed deploys | deploy-do.yml prune ordering | INFRA-P2-006 |
| Silent feature death (M365 webhook auth) | P3 | Unknown | Webhook integration broken | deploy-do.yml env list vs env.ts | INFRA-P3-008 |

## Recommendations

### Immediate / Release Blocking

1. INFRA-P1-001 — Restrict `admin_ip_ranges` on both environments (secret-driven CIDRs; verify firewall after apply). This is the single highest-value change in this audit.

### This Week

2. INFRA-P2-002 — Add concurrency group to terraform-do.
3. INFRA-P2-006 — Fix image-cleanup ordering in deploy-do (prune after `compose down`).
4. INFRA-P2-005 — Raise dev droplet to 1GB+ (or trim prometheus limit).

### This Month

5. INFRA-P2-003/004 — Prometheus volume + Alertmanager delivery; CSP tightening (remove `script-src 'unsafe-inline'`, thread the nonce through Caddy).
6. INFRA-P3-008 — Reconcile deploy .env vs env schema/examples (add or document the 5 optional vars).

### Later / Platform Evolution

7. INFRA-P3-007 — Fix compose defaults (publish `latest` or fail loudly).
8. INFRA-P3-009 — Redis password via file/secret; consider image scanning + SBOM (cosign) for published images.
9. INFRA-P3-010 — Untrack prod.tfvars.

## Quick Wins

| Quick win | Why it helps | Files likely involved | Validation |
| --------- | ------------ | --------------------- | ---------- |
| Concurrency group on terraform-do | Prevents state races | terraform-do.yml | Two rapid pushes queue correctly |
| Reorder image prune after compose down | Stops disk growth | deploy-do.yml | `docker image ls` after 2 deploys |
| Untrack prod.tfvars | Enforces gitignore intent | git rm --cached | Fresh clone has no tfvars |
| Add admin_ip_ranges to CI tfvars | Closes internet-wide SSH | terraform-do.yml + secret | Firewall plan shows restricted source |

## Hardening Backlog

| Backlog item | Priority | Owner suggestion | Effort | Dependency |
| ------------ | -------- | ---------------- | ------ | ---------- |
| Alertmanager + receiver | P2 | platform | Medium | SMTP/webhook channel |
| Image scanning + SBOM/provenance | P3 | platform | Medium | cosign + GHCR attestations |
| CSP nonce threading through Caddy | P2 | frontend+platform | Medium | middleware/Caddy coordination |
| Redis password via secret file | P3 | platform | Small | None |
| Terraform lock documentation | P3 | platform | Trivial | None |

## Suggested Tests

- Terraform: after INFRA-P1-001, assert firewall SSH source set via `doctl compute firewall list` in CI.
- Compose: `docker compose config --quiet` validates interpolation on fresh checkout (catches dead defaults).
- Deploy: scripted double-deploy asserting image count stays bounded (INFRA-P2-006).
- Restore test: strengthen `db-restore-test.yml` — verify row counts of key tables (users/organizations/tickets) rather than table count only, and add a failure notification (companion CI report).
- Runtime: container user assertion (`docker run --rm image id -u` must be 1001) in CI.

## Suggested Documentation Updates

- AGENTS.md: correct the deploy cleanup description ("targeted image cleanup" absent at HEAD); update firewall port list claim (2376 not in DO firewall); document admin_ip_ranges requirement.
- docs/ROLLBACK_PROCEDURES.md: add state-corruption recovery steps for the un-lockable Spaces backend.
- docs/MONITORING_AND_ALERTING.md: mark Alertmanager as absent (rules currently fire into a void) and Prometheus storage as ephemeral until INFRA-P2-003/004 land.
- docs/ENVIRONMENT_VARIABLES.md: document the 5 optional env vars not deployed by the pipeline and their consequences.

## Open Questions

| Question | Why it matters | Evidence needed |
| -------- | -------------- | --------------- |
| Were M365_CLIENT_STATE/TURNSTILE/webhook secrets set manually on the droplets? | M365 webhook auth + captcha may be dead in prod | `/opt/mct-portal/.env` check |
| What is the actual dev droplet RAM/usage? | INFRA-P2-005 validity | `free -m`, `docker stats` |
| Is the DO Spaces state bucket versioned/backed up? | State loss = infra loss | Spaces bucket settings |
| What CIDRs should admin_ip_ranges contain? | INFRA-P1-001 fix input | Network map (office/VPN/CI) |
| Does the private `terraform.tfstate` on disk match the Spaces state? | Local vs remote state divergence | `terraform state pull` diff |

## Appendix

### State backend (verified)

| Env | Bucket | Key | Endpoint |
| --- | ------ | --- | -------- |
| dev | `portal-terraform-state-development` | `digitalocean/dev/terraform.tfstate` | `https://nyc3.digitaloceanspaces.com` (backend.dev.hcl) |
| prod | `portal-terraform-state-production` | `digitalocean/prod/terraform.tfstate` | `https://nyc3.digitaloceanspaces.com` (backend.prod.hcl) |

`providers.tf` hardcodes `key = "digitalocean/terraform.tfstate"` but the CI always passes `-backend-config`, which overrides it — local runs without backend-config would use a different key (minor foot-gun worth a comment).

### Image digest pins (compose + Dockerfiles)

| Image | Pin |
| ----- | --- |
| node:20-alpine | sha256:fb4cd12c85ee03686f6af5362a0b0d56d50c58a04632e6c0fb8363f609372293 |
| redis:7-alpine | sha256:e7723ff73d963f5cc6d9c4643ea3d989527a402a319239054e9472a7fb9219a2 |
| prom/prometheus:v3.5.1 | sha256:4b05278adfb2e2781063781edd7ca88cc649ea5270cea1696618886a37eeb298 |
| caddy:2-alpine | sha256:5f5c8640aae01df9654968d946d8f1a56c497f1dd5c5cda4cf95ab7c14d58648 |
| postgres:16-alpine (restore test) | **unpinned** |

### Container user model (verified)

- api/worker: `addgroup -g 1001 appuser && adduser -u 1001 appuser`, `USER appuser`
- web: `adduser -u 1001 nextjs`, `USER nextjs`, all copied artifacts `--chown=nextjs:nodejs`
- compose: `cap_drop: [ALL]`, `security_opt: [no-new-privileges:true]` on all services; caddy adds back `NET_BIND_SERVICE`
