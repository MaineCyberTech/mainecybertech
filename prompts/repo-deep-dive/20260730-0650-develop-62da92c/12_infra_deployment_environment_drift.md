# Infrastructure, Deployment, and Environment Drift Audit

## Audit Metadata

- Audit name: repo-deep-dive
- Run: 20260730-0650-develop-62da92c
- Repository: mainecybertech/mainecybertech (monorepo)
- Branch: develop
- Commit SHA: 62da92c
- Generated at: 2026-07-30
- Auditor: Principal Repository Auditor (AI)
- Area code: INFRA
- Output path: docs/audits/repo-deep-dive/20260730-0650-develop-62da92c/12_infra_deployment_environment_drift.md
- Scope limitations: No live environment access; analysis based exclusively on repository files. Actual drift between committed configs and deployed infrastructure cannot be fully assessed without pulling Terraform state from the remote backend.

## Scope

Reviewed Dockerfiles (3), docker-compose, Terraform configs (DO), Caddyfiles, cloud-init, deploy scripts, `.env.example` files, runtime env validators (Zod schemas), and secret references in CI/CD. Assessed drift risks between environments, hosting assumptions, and configuration consistency.

## Evidence Reviewed

| Evidence | Type | Why relevant | Notes |
|----------|------|-------------|-------|
| `apps/api/Dockerfile` | Dockerfile | API container build | Multi-stage, non-root, HEALTHCHECK |
| `apps/web/Dockerfile` | Dockerfile | Web container build | Multi-stage, non-root, build args |
| `apps/worker/Dockerfile` | Dockerfile | Worker container build | Multi-stage, non-root, HEALTHCHECK |
| `infra/digitalocean/docker-compose.yml` | Compose | Production stack definition | Redis, API, Worker, Web, Caddy |
| `infra/digitalocean/Caddyfile` | Proxy | TLS + routing | Prod domains, security headers |
| `infra/digitalocean/Caddyfile.dev` | Proxy | Dev TLS + routing | tls internal |
| `infra/digitalocean/Caddyfile.prod` | Proxy | Prod TLS + routing | No CSP in prod version |
| `infra/digitalocean/deploy.sh` | Script | Droplet deploy helper | Legacy, CI uses SSH directly |
| `infra/digitalocean/.env.example` | Config | DO env template | 34 vars documented |
| `infra/terraform/digitalocean/*.tf` | Terraform | DO infra as code | Droplet, firewall, DNS, providers |
| `infra/terraform/digitalocean/cloud-init.yml` | Init | First-boot setup | Docker, UFW |
| `apps/api/src/config/env.ts` | Zod schema | API runtime validation | 33 env vars validated |
| `apps/worker/src/env.ts` | Zod schema | Worker runtime validation | 30 env vars validated |
| `.dockerignore` | Config | Build context exclusion | Comprehensive |

## Executive Summary

The infrastructure configuration is production-ready with clear separation between dev and prod environments via Terraform, Caddyfile variants, and deployment workflow env selection. The stack uses a single DigitalOcean droplet behind Cloudflare CDN with a Caddy reverse proxy managing TLS. All 3 apps use multi-stage Docker builds, non-root users, and HEALTHCHECK directives. Docker Compose configuration is comprehensive with memory limits, health checks, and restart policies. Terraform manages the droplet, firewall (Cloudflare-only HTTP/S), and Cloudflare DNS with environment-based routing. Key drifts found: backend state bucket name mismatch between `providers.tf` and `backend.*.hcl` files, Caddyfile CSP headers missing in `Caddyfile.prod`, placeholder values in both `dev.tfvars` and `prod.tfvars`, Terraform state files committed to repository, and a dead `deploy.sh` script that doesn't match CI workflow behavior.

### Strengths
- All 3 Dockerfiles use multi-stage builds with `--prod --ignore-scripts` for runtime
- All containers run as non-root users (appuser:appuser or nextjs:nodejs)
- HEALTHCHECK on all 3 application containers
- Docker Compose has memory limits on every service
- Cloudflare-only ingress via DO firewall (ports 80/443 restricted to CF IPs)
- `prevent_destroy` on droplet resource
- Terraform state stored in DigitalOcean Spaces (S3-compatible), not locally
- Environment-based DNS record creation (prod→.com, dev→.us)
- Comprehensive `.dockerignore` excludes docs/infra/supabase from build context

### Major Risks
- **Backend state bucket drift**: `providers.tf` uses `portal-terraform-state-development`, env configs use `portal-terraform-state`
- **Caddyfile.prod missing CSP headers** — lines 1-27 have no `Content-Security-Policy`, only HSTS/X-Frame-Options/X-Content-Type-Options
- **dev.tfvars and prod.tfvars have placeholder values** — Terraform CI apply would fail without GitHub Secrets overrides
- **Terraform state files committed to repo** (`terraform.tfstate`, `terraform.tfstate.backup`)
- **deploy.sh is dead code** — CI workflow does not use it (SSH commands are inline in deploy-do.yml)
- **Caddyfile main file has CSP with 'unsafe-inline'** — permissive for style-src

## Inventory

| Item | Path / symbol | Purpose | Current state | Risk | Notes |
|------|--------------|---------|--------------|------|-------|
| API Dockerfile | `apps/api/Dockerfile` | Container build | Implemented | Low | Multi-stage, non-root |
| Web Dockerfile | `apps/web/Dockerfile` | Container build | Implemented | Low | Multi-stage, non-root |
| Worker Dockerfile | `apps/worker/Dockerfile` | Container build | Implemented | Low | Multi-stage, non-root |
| docker-compose.yml | `infra/digitalocean/docker-compose.yml` | Stack orchestration | Implemented | Medium | Redis default password |
| Caddyfile | `infra/digitalocean/Caddyfile` | Production proxy | Implemented | Medium | CSP has 'unsafe-inline' |
| Caddyfile.prod | `infra/digitalocean/Caddyfile.prod` | Prod-only proxy | Implemented | Medium | Missing CSP entirely |
| Terraform providers | `infra/terraform/digitalocean/providers.tf` | IaC providers | Implemented | Medium | Backend bucket name drift |
| Terraform droplet | `infra/terraform/digitalocean/droplet.tf` | Compute resource | Implemented | Low | prevent_destroy |
| Terraform firewall | `infra/terraform/digitalocean/firewall.tf` | Network security | Implemented | Low | CF IPs only |
| Terraform DNS | `infra/terraform/digitalocean/dns.tf` | DNS records | Implemented | Low | Environment-aware |
| cloud-init.yml | `infra/terraform/digitalocean/cloud-init.yml` | First boot | Implemented | Low | Docker + UFW |
| .env.example (DO) | `infra/digitalocean/.env.example` | Runtime config | Implemented | Low | Good documentation |
| API env.ts | `apps/api/src/config/env.ts` | Runtime validation | Implemented | Low | Zod, lazy singleton |
| Worker env.ts | `apps/worker/src/env.ts` | Runtime validation | Implemented | Low | Zod, eager parse |

## Domain Scorecard

| Category | Score | Evidence | Gap | Recommended action |
|----------|:-----:|----------|-----|-------------------|
| Dockerfiles | 4 | All multi-stage, non-root, HEALTHCHECK | No SHA pin on base images | Pin to digest |
| Compose | 4 | Full stack with mem limits, health checks | Redis password default | Remove default password |
| Terraform/OpenTofu | 3 | 6 .tf files, environment-aware | State file committed, bucket drift | Fix drift, gitignore state |
| Cloud/hosting config | 4 | Single DO droplet, Cloudflare CDN | None significant | — |
| Deploy scripts | 2 | deploy.sh exists but unused by CI | Dead code, diverged from CI | Remove or update deploy.sh |
| Reverse proxy | 3 | Caddy with TLS, CF certs, SSE support | CSP missing from Caddyfile.prod | Add CSP to prod Caddyfile |
| Environment examples | 4 | All apps + DO have .env.example | None | — |
| Runtime validators | 4 | Zod schemas for API and Worker | Web has no runtime validation | Add basic env check to web |
| Secret references | 3 | GH Secrets → SSH → .env file | Secrets written to disk | Consider secrets manager |
| Build args | 4 | Web build args for NEXT_PUBLIC_* | None | — |
| Container users | 5 | All non-root | None | — |
| Health/readiness/liveness | 4 | HEALTHCHECK + deploy health check loop | Worker health check in non-fatal | Make worker health check fatal |

## Detailed Review

### Item: Terraform Backend State Drift

- Evidence:
  - `providers.tf:5`: `bucket = "portal-terraform-state-development"`
  - `infra/terraform/digitalocean/env/backend.dev.hcl:4`: `bucket = "portal-terraform-state"`
  - `infra/terraform/digitalocean/env/backend.prod.hcl:4`: `bucket = "portal-terraform-state"`
- What it does: The hardcoded backend in providers.tf uses a different bucket (`portal-terraform-state-development`) than the env-specific config files (`portal-terraform-state`). The env configs also don't include `endpoints` or `skip_*` configs.
- How it appears to work: CI uses the hardcoded backend in providers.tf (no `-backend-config` flag). The env files would be used if passed via `-backend-config=env/backend.dev.hcl` but the CI doesn't do this.
- Missing controls: CI workflow doesn't pass a `-backend-config` flag — uses hardcoded backend only.
- Risks: If `-backend-config` were used, state would go to a different bucket. Currently, everything goes to `portal-terraform-state-development` regardless of env.
- Recommended improvement: Either remove the env-specific backend files (they're unused) or update CI to pass `-backend-config` with the env-specific file.
- Suggested tests: Run `terraform init` with each backend config to verify state location.

### Item: Caddyfile.prod Missing Content-Security-Policy

- Evidence:
  - `infra/digitalocean/Caddyfile.prod:1-27`: No `Content-Security-Policy` header anywhere
  - `infra/digitalocean/Caddyfile:6-12,38-44`: Has CSP header with `'unsafe-inline'`
- What it does: The production Caddyfile omits CSP entirely while the main Caddyfile includes it. The deploy workflow selects `Caddyfile.prod` for prod deploys.
- Current controls: HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy present
- Missing controls: Content-Security-Policy header
- Risks: No CSP protection against XSS in production
- Recommended improvement: Add CSP header matching the main Caddyfile's policy (or a stricter one) to Caddyfile.prod
- Effort: 10 minutes

## Scenario / Control Matrix

| ID | Scenario or control | Evidence | Current control | Gap | Severity | Recommendation |
|----|-------------------|----------|----------------|-----|----------|---------------|
| INFRA-001 | Dockerfile hardening | All 3 Dockerfiles | multi-stage, non-root | No SHA pin on base images | P2 | Pin to digest |
| INFRA-002 | Compose security | docker-compose.yml | mem_limit, healthchecks | Redis default password in code | P2 | Remove default password |
| INFRA-003 | Terraform state bucket | providers.tf vs env/*.hcl | Hardcoded in providers.tf | Bucket name mismatch, env files unused | P1 | Fix backend config |
| INFRA-004 | Caddyfile CSP | Caddyfile.prod | Missing entirely | No CSP in production | P1 | Add CSP to prod Caddyfile |
| INFRA-005 | Terraform state in repo | terraform.tfstate, .backup | Committed to git | Should not be in repo | P2 | Add to .gitignore |
| INFRA-006 | dev.tfvars values | dev.tfvars | Placeholder values | Blocks local tf apply | P2 | Add real values |
| INFRA-007 | prod.tfvars values | prod.tfvars | Placeholder values | Blocks local tf apply | P2 | Add real values |
| INFRA-008 | deploy.sh drift | deploy.sh | Unused by CI | Dead code, outdated | P3 | Remove or update |
| INFRA-009 | Web env validation | apps/web | No runtime validation | Startup not validated | P2 | Add basic env check |
| INFRA-010 | Worker health check | deploy-do.yml:291-293 | Non-fatal warning | Should be fatal | P3 | Make worker health check fatal |

## Findings

### Finding ID: INFRA-P1-001 - Terraform backend state bucket name drift

- Severity: P1 - High
- Confidence: High
- Area: Infrastructure / Terraform
- Evidence:
  - `infra/terraform/digitalocean/providers.tf:5`: `bucket = "portal-terraform-state-development"`
  - `infra/terraform/digitalocean/env/backend.dev.hcl:4`: `bucket = "portal-terraform-state"`
  - `infra/terraform/digitalocean/env/backend.prod.hcl:4`: `bucket = "portal-terraform-state"`
- What is happening: The hardcoded Terraform backend in `providers.tf` uses bucket `portal-terraform-state-development`, but the env-specific backend files (`backend.dev.hcl`, `backend.prod.hcl`) both reference `portal-terraform-state`. These files are unused because CI never passes `-backend-config`.
- Why it matters: If someone runs Terraform locally with the env backend files, state would go to a different bucket, creating state fragmentation. Additionally, `backend.dev.hcl` and `backend.prod.hcl` use the same shared bucket, meaning dev and prod state would collide.
- User / business impact: Potential state corruption, split-brain scenarios, or accidental prod infrastructure changes from dev.
- Security / privacy / reliability impact: High — state file contains infrastructure metadata.
- Recommended fix: Either (a) remove unused `env/backend.*.hcl` files and consolidate to hardcoded backend in `providers.tf`, or (b) update CI to pass `-backend-config` with env-specific files and use separate buckets per environment.
- Suggested validation: `terraform init` with each approach verifies correct state location.
- Owner suggestion: Infrastructure team
- Effort estimate: 1 hour
- Dependencies: None
- Status: Open

### Finding ID: INFRA-P1-002 - Caddyfile.prod missing Content-Security-Policy header

- Severity: P1 - High
- Confidence: High
- Area: Infrastructure / Reverse Proxy
- Evidence:
  - `infra/digitalocean/Caddyfile.prod` lines 1-27: No `Content-Security-Policy` header anywhere
  - `infra/digitalocean/Caddyfile` lines 6-12, 38-44: CSP header present
  - `deploy-do.yml:255-261`: Selects `Caddyfile.prod` for prod environment
- What is happening: The production Caddyfile (`Caddyfile.prod`) omits `Content-Security-Policy` header entirely, while the main Caddyfile includes it with a permissive policy.
- Why it matters: CSP is a critical defense-in-depth header against XSS. Without it, users have no browser-level protection against injected scripts.
- User / business impact: Production users lack CSP protection.
- Security / privacy / reliability impact: High — XSS mitigation disabled in production.
- Recommended fix: Add CSP header to `Caddyfile.prod` matching the main Caddyfile's policy or a tighter production-specific policy.
- Suggested validation: Run `curl -I https://api.mainecybertech.com/health | grep -i content-security-policy`.
- Owner suggestion: Infrastructure team
- Effort estimate: 15 minutes
- Dependencies: None
- Status: Open

### Finding ID: INFRA-P2-001 - dev.tfvars and prod.tfvars contain placeholder values

- Severity: P2 - Medium
- Confidence: High
- Area: Infrastructure / Terraform
- Evidence:
  - `infra/terraform/digitalocean/env/dev.tfvars`: `do_token = "dop_v1_replace_with_real_token"`
  - `infra/terraform/digitalocean/env/prod.tfvars`: `do_token = "your-do-api-token"`
  - Both files have placeholders for all sensitive values
- What is happening: Both environment-specific tfvars files use placeholder values rather than real credentials. The CI workflow generates a real tfvars file dynamically using GitHub Secrets (terraform-do.yml:53-68), so CI works correctly, but local Terraform operations cannot run.
- Why it matters: Any developer running `terraform plan` locally gets auth errors. This creates friction for local infrastructure development and testing.
- User / business impact: Blocks local Terraform workflows. Forces all infra changes to go through CI.
- Recommended fix: Document the expected workflow (CI-only for Terraform) or provide a helper script that generates real tfvars from local environment variables or 1Password CLI.
- Suggested validation: Running the helper script produces a valid tfvars file.
- Owner suggestion: Infrastructure team
- Effort estimate: 2 hours for helper script
- Dependencies: None
- Status: Open

### Finding ID: INFRA-P2-002 - Terraform state files committed to repository

- Severity: P2 - Medium
- Confidence: High
- Area: Infrastructure
- Evidence:
  - `infra/terraform/digitalocean/terraform.tfstate` exists
  - `infra/terraform/digitalocean/terraform.tfstate.backup` exists
- What is happening: Terraform state files are committed to the Git repository.
- Why it matters: State files can contain sensitive infrastructure metadata (resource IDs, IP addresses, and depending on provider, may contain plaintext secrets).
- User / business impact: Low — DO resources are not highly sensitive, but a security best-practice violation.
- Recommended fix: Add `*.tfstate*` to `infra/terraform/digitalocean/.gitignore`.
- Suggested validation: Run `git status` after adding gitignore to verify files are excluded.
- Owner suggestion: Infrastructure team
- Effort estimate: 15 minutes
- Dependencies: Ensure remote backend state is current before deleting local.
- Status: Open (same as CI-P3-001, noted here for INFRA context)

### Finding ID: INFRA-P2-003 - Redis default password in docker-compose.yml

- Severity: P2 - Medium
- Confidence: High
- Area: Infrastructure / Compose
- Evidence:
  - `infra/digitalocean/docker-compose.yml:16`: `redis-server --requirepass ${REDIS_PASSWORD:-mct-redis-dev}`
- What is happening: The docker-compose file contains a hardcoded default Redis password (`mct-redis-dev`) that is used if `REDIS_PASSWORD` environment variable is not set.
- Why it matters: A default password in code is a security anti-pattern. If an environment doesn't override this, the password is predictable and well-known.
- User / business impact: Exposed Redis instance if the default is used.
- Security / privacy / reliability impact: Medium — Redis is internal to the Docker network but shouldn't have a known default password.
- Recommended fix: Remove the default value so `REDIS_PASSWORD` is required:
  ```
  redis-server --requirepass ${REDIS_PASSWORD:?REDIS_PASSWORD is required}
  ```
- Suggested validation: `docker compose up` fails without `REDIS_PASSWORD` set.
- Owner suggestion: Infrastructure team
- Effort estimate: 15 minutes
- Dependencies: Update deploy workflow and docs to ensure REDIS_PASSWORD is set.
- Status: Open

### Finding ID: INFRA-P3-001 - deploy.sh is dead code

- Severity: P3 - Low
- Confidence: High
- Area: Infrastructure / Scripts
- Evidence:
  - `infra/digitalocean/deploy.sh` exists with inline compose commands
  - `deploy-do.yml` does not reference or call `deploy.sh`
  - CI SSH commands are inline with additional logic (cert writing, env setup)
- What is happening: The `deploy.sh` script was the original deployment method but is now unused. The CI workflow has diverged significantly — it writes certs, manages .env files, and handles fallback logic that deploy.sh doesn't have.
- Why it matters: Dead code creates confusion. A developer looking at `deploy.sh` would get incorrect information about the deployment process.
- User / business impact: Low — documentation/docs could mislead.
- Recommended fix: Either update `deploy.sh` to match current CI behavior and make the CI workflow call it, or remove/archive `deploy.sh`.
- Suggested validation: Verify CI deploy does not depend on deploy.sh.
- Owner suggestion: Infrastructure team
- Effort estimate: 30 minutes
- Dependencies: None
- Status: Open

## Risks

| Risk | Severity | Likelihood | Impact | Evidence | Mitigation |
|------|----------|------------|--------|----------|------------|
| Terraform state fragmentation | P1 | Medium | High (state corruption) | providers.tf vs env/*.hcl bucket mismatch | Fix backend config |
| No CSP in production | P1 | Low (XSS must exist) | High (no browser mitigation) | Caddyfile.prod missing CSP | Add CSP header |
| Redis default password | P2 | Low | Medium | docker-compose.yml:16 default | Remove default, make required |
| Terraform state committed | P2 | Low | Low-Medium | terraform.tfstate in repo | Add to .gitignore |
| Placeholder tfvars | P2 | Medium | Medium (blocks local ops) | dev.tfvars, prod.tfvars placeholders | Add helper script |

## Recommendations

### Immediate / Release Blocking

1. Add CSP header to `Caddyfile.prod` (INFRA-P1-002)
2. Fix Terraform backend state bucket configuration (INFRA-P1-001)

### This Week

3. Remove default Redis password, make required (INFRA-P2-003)
4. Add `*.tfstate*` to Terraform .gitignore (INFRA-P2-002)
5. Remove or update deploy.sh (INFRA-P3-001)

### This Month

6. Add Terraform helper script for local operations (INFRA-P2-001)
7. Add basic env var validation to web app startup (INFRA-P2-010)
8. Make worker health check fatal in deploy workflow

### Later / Platform Evolution

9. Migrate secrets from disk file to secrets manager (Vault, Doppler, or 1Password)
10. Implement separate DO droplets for dev/prod for full isolation

## Quick Wins

| Quick win | Why it helps | Files likely involved | Validation |
|-----------|-------------|----------------------|------------|
| Add CSP to Caddyfile.prod | Production XSS protection | `Caddyfile.prod` | curl -I check |
| Remove default Redis password | Security hardening | `docker-compose.yml` | Compose fails without REDIS_PASSWORD |
| Remove terraform state from repo | Clean git history | `.gitignore` infra/ directory | git status |

## Hardening Backlog

| Backlog item | Priority | Owner suggestion | Effort | Dependency |
|-------------|----------|-----------------|--------|------------|
| Fix Caddyfile.prod CSP | P1 | Infrastructure | 15 min | None |
| Fix Terraform backend | P1 | Infrastructure | 1 hour | Confirm current state location |
| Redis password hardening | P2 | Infrastructure | 15 min | Docs update |
| State files in .gitignore | P2 | Infrastructure | 15 min | Confirm backend state current |
| Terraform helper script | P2 | Infrastructure | 2 hours | None |
| Remove deploy.sh | P3 | Infrastructure | 30 min | Verify CI not dependent |

## Suggested Tests

- CI workflow that validates Caddyfile.prod has CSP header
- Script that verifies Terraform state bucket configuration matches env
- Test that docker-compose fails without REDIS_PASSWORD (run `docker compose config`)

## Suggested Documentation Updates

- Add note to `infra/digitalocean/README.md` about deploy.sh being legacy
- Document Terraform backend strategy (which bucket, env separation)
- Update deploy docs to cover CSP changes

## Open Questions

| Question | Why it matters | Evidence needed |
|----------|---------------|----------------|
| Which bucket actually stores current Terraform state? | Determines which config is correct | Terraform init output or Spaces listing |
| Are there local Terraform operators who need real tfvars? | Prioritizes helper script work | Developer interviews |
| Why was CSP removed from Caddyfile.prod? | May have been intentional | Git history / PR review |

## Appendix

### Dockerfile Comparison

| Feature | API | Web | Worker |
|---------|:---:|:---:|:------:|
| Base image | node:20-alpine | node:20-alpine | node:20-alpine |
| Multi-stage | Yes | Yes | Yes |
| Non-root user | appuser:appuser | nextjs:nodejs | appuser:appuser |
| HEALTHCHECK | /health:4000 | /:3000 (start 40s) | /health:3001 |
| Port | 4000 | 3000 | — |
| Build args | None | NEXT_PUBLIC_* | None |
| Prod install | --prod --ignore-scripts | N/A (standalone) | --prod --ignore-scripts |

### Terraform Environment Matrix

| Feature | dev | prod |
|---------|:---:|:----:|
| Droplet name | mct-portal-dev | mct-portal-prod |
| Droplet size | s-1vcpu-512mb-10gb | s-2vcpu-2gb (default) |
| DNS zone | .us | .com |
| SSH IP range | 0.0.0.0/0 | 0.0.0.0/0 |
| Firewall | CF IPs only | CF IPs only |
| State bucket | portal-terraform-state-development | portal-terraform-state-development |
| Backend config file | backend.dev.hcl (unused) | backend.prod.hcl (unused) |
