# Maine CyberTech — DigitalOcean Deployment Operations Handbook

## Architecture Overview

The MCT platform runs on a single DigitalOcean droplet (s-2vcpu-2gb, Ubuntu 24.04) behind Cloudflare CDN. All services are Docker containers managed by docker compose:

| Container | Image (GHCR)           | Port   | Purpose                                                  |
| --------- | ---------------------- | ------ | -------------------------------------------------------- |
| caddy     | caddy:2-alpine         | 80/443 | TLS reverse proxy (Let's Encrypt / Cloudflare Origin CA) |
| web       | ghcr.io/.../mct-web    | 3000   | Next.js standalone (marketing + portal)                  |
| api       | ghcr.io/.../mct-api    | 4000   | Express API server                                       |
| worker    | ghcr.io/.../mct-worker | 3001   | BullMQ job consumer                                      |
| redis     | redis:7-alpine         | 6379   | BullMQ queue backend                                     |

Supabase is **hosted** (cloud.supabase.com) — not self-hosted on the droplet. All secrets are stored as GitHub Environment Secrets and written to `/opt/mct-portal/.env` at deploy time.

## Environment Mapping

| Branch    | Environment | Domains                                                                | Droplet         |
| --------- | ----------- | ---------------------------------------------------------------------- | --------------- |
| `develop` | dev         | app.mainecybertech.us, api.mainecybertech.us, www.mainecybertech.us    | mct-portal-dev  |
| `main`    | prod        | app.mainecybertech.com, api.mainecybertech.com, www.mainecybertech.com | mct-portal-prod |

Domain routing via middleware: `www.*` → marketing homepage, `app.*` → portal login. `api.*` → API. All records proxied through Cloudflare (orange cloud).

## Deploy Workflow

### Automatic deploys (`deploy-do.yml`)

Triggered on push to `main` or `develop` when apps/, packages/, infra/digitalocean/, or the workflow itself changes. Also available via `workflow_dispatch` with target selection.

Pipeline:

1. **Setup** — Determine environment from branch (develop→dev, main→prod) or manual input, resolve domains, compute CORS_ORIGIN
2. **Resolve IP** — Query DO API to get the droplet's public IPv4
3. **Build 3 images** (parallel) — Build and push API, worker, and web images to GHCR with SHA tag (`ghcr.io/mainecybertech/mainecybertech/mct-{api,worker,web}:<sha>`)
4. **Deploy** — SSH into droplet, write `.env` from GitHub secrets, pull images from GHCR, copy compose file and per-environment Caddyfile, set up Cloudflare Origin CA certs, then **rolling-recreate** the app services (`docker compose up -d --no-deps api|worker|web`, waiting for each to become healthy) and refresh Caddy last. The rest of the stack (redis, prometheus, alertmanager) is only recreated when its compose config changed.
5. **Health check** — Poll `https://api.<domain>/health` until HTTP 200, the worker `/health` over SSH, and `https://app.<domain>/login` until 200/301/302/307. Then a container health gate asserts every healthchecked service (redis, api, worker, web, alertmanager, prometheus, caddy); any failure fails the deploy and rolls back to the previously running images.

### Deploy Gates

Before any deployment proceeds, the following gates must pass:

| Gate           | Workflow                  | Purpose                                          | Required For      |
| -------------- | ------------------------- | ------------------------------------------------ | ----------------- |
| **Validate**   | `validate.yml`            | Runs test + lint + typecheck in parallel         | All builds        |
| **E2E**        | `e2e.yml`                 | Runs Playwright E2E tests against local Supabase | Production deploy |
| **Migrations** | `supabase-migrations.yml` | Applies pending DB migrations                    | Production deploy |

The build jobs (`build-api`, `build-worker`, `build-web`) depend on `validate`. The deploy job depends on all three builds + `e2e` + `migrations`; the `e2e` and `migrations` gates are required for production deploys only (they are skipped on dev). If any gate fails, the deployment is blocked.

### Concurrency

The deploy workflow uses `concurrency: deploy-do-${{ github.ref }}` with `cancel-in-progress: false`. Only one deploy runs per branch at a time; a second push while a deploy is in progress is **queued**, and an in-flight deploy is never cancelled (prod deploys must not be aborted mid-flight).

### Speed optimization

Images are **not** piped over SSH anymore. The deploy step pulls directly from GHCR on the droplet. Builder cache pruning is deferred to post-deploy to avoid SSH timeouts. Old MCT images are pruned only after the health gate passes: the running image IDs are kept and every other `mct-*` image is removed (`docker rmi -f`), followed by `docker image prune -f`.

## Manual Operations

All commands run via SSH as root on the droplet.

```bash
# SSH into dev droplet
ssh root@$(doctl compute droplet get mct-portal-dev --format PublicIPv4 --no-header)

# SSH into prod droplet
ssh root@$(doctl compute droplet get mct-portal-prod --format PublicIPv4 --no-header)

# View all container status
docker compose -p mct-portal ps

# Stream logs for a specific service
docker compose -p mct-portal logs -f api
docker compose -p mct-portal logs -f worker
docker compose -p mct-portal logs --tail=50 web

# Restart a single service
docker compose -p mct-portal restart api

# Rolling recreate of the app services (deploys do this automatically; one
# service is replaced at a time while Caddy keeps serving the others)
docker compose -p mct-portal up -d --no-deps api
docker compose -p mct-portal up -d --no-deps worker
docker compose -p mct-portal up -d --no-deps web

# Full container restart (brief outage on this single-droplet topology)
docker compose -p mct-portal down --remove-orphans
docker compose -p mct-portal up -d --remove-orphans
```

### Health check endpoints

- `https://api.mainecybertech.com/health` — API health (includes Supabase connectivity)
- `https://api.mainecybertech.us/health` — Dev API health
- Worker health: `curl http://localhost:3001/health` (internal, on droplet)
- Redis health: `REDISCLI_AUTH="$REDIS_PASSWORD" redis-cli ping` (internal, on droplet; the password stays out of the process arguments)

## Secrets Management

### Required GitHub Environments

- `dev` — dev/develop deploys (no approval)
- `prod` — read-only plan/resolve jobs only (`deploy-do` `resolve-ip`, `terraform-do` `terraform-plan`); nothing mutates under it, so no required reviewers.
- `prod-approval` — the single approval gate for every prod mutation (BP-P3-003): prod app deploy (`deploy-do.yml` `deploy` job), prod Terraform apply (`terraform-do.yml` `terraform-apply-prod`) and prod Supabase migrations (`supabase-migrations.yml` on `main`). Required reviewers (1+) must be configured in GitHub (Settings → Environments → `prod-approval`); that setting is **not** in repo code and is **not yet configured**, so the approval gate is not currently in force. The migration secrets (`SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`) must be available to `prod-approval`.

### GitHub Environment Secrets (written to `/opt/mct-portal/.env`)

The deploy workflow writes the environment's secrets to `.env` on the droplet with `printf '%s'` (values are written literally and are never re-expanded by the shell), plus a `metrics-token` file (0400) for the authenticated Prometheus scrape. Key secrets:

| Secret                              | Purpose                               |
| ----------------------------------- | ------------------------------------- |
| SUPABASE_URL                        | Hosted Supabase project URL           |
| SUPABASE_ANON_KEY                   | Supabase anon key                     |
| SUPABASE_SERVICE_ROLE_KEY           | Supabase service role key             |
| JWT_SECRET                          | API JWT verification copy (Supabase signs) |
| STRIPE_SECRET_KEY                   | Stripe API key                        |
| STRIPE_WEBHOOK_SECRET               | Stripe webhook signing secret         |
| SENTRY_DSN                          | Sentry error tracking                 |
| SMTP_HOST/PASS                      | Email (password reset, notifications) |
| VAPID_PUBLIC/PRIVATE_KEY + SUBJECT  | Web Push (browser notifications; unset = channel disabled). See `docs/ENVIRONMENT_VARIABLES.md` → Web Push runbook |
| JIRA*\* / JSM*\*                    | Jira/JSM integration                  |
| M365\_\*                            | Microsoft 365 integration             |
| PUBLIC\_{TRAFFIC,LEAD}\_WEBHOOK_URL | Teams webhooks for leads              |
| CF_ORIGIN_CERT/KEY                  | Cloudflare Origin CA certs            |

### Required GitHub Variables

| Variable           | Purpose                                     |
| ------------------ | ------------------------------------------- |
| DO_API_TOKEN       | DigitalOcean API token (resolve droplet IP) |
| CI_SSH_PRIVATE_KEY | SSH key for root access to droplet          |

## Terraform Infrastructure

Terraform lives at `infra/terraform/digitalocean/`. It manages:

| File             | Purpose                                                               |
| ---------------- | --------------------------------------------------------------------- |
| `providers.tf`   | DigitalOcean + Cloudflare providers                                   |
| `variables.tf`   | 13 variables (DO token, region, size, SSH key, Cloudflare zones, env) |
| `droplet.tf`     | Droplet resource with cloud-init, `prevent_destroy` lifecycle         |
| `firewall.tf`    | DO Cloud Firewall: SSH 22 (admin ranges only) and HTTP/HTTPS 80/443 (Cloudflare ranges only); full egress. No port 2376 |
| `dns.tf`         | A records per domain (dev→.us, prod→.com), proxied via Cloudflare     |
| `outputs.tf`     | Droplet IP, ID, URN                                                   |
| `cloud-init.yml` | Docker install, docker compose, data directories                      |

### Terraform workflow

`terraform-do.yml` is **manual-dispatch only** — there are no push/PR triggers
(by design; a weekly plan-only drift check stays dormant until the operator sets
`TF_DRIFT_PLAN_ENABLED=true`). A run plans by default; apply only happens when
the `apply` input is set. Prod applies run from `main` under `prod-approval` and
wait on the e2e/migration gates; dev applies run from `develop` under `dev`.

```bash
# Manual Terraform apply (dev)
cd infra/terraform/digitalocean
terraform init -backend-config=env/backend.dev.hcl
terraform apply -var-file=env/dev.tfvars

# Manual Terraform apply (prod)
terraform init -backend-config=env/backend.prod.hcl
terraform apply -var-file=env/prod.tfvars
```

## Rollback

### Automated rollback (via workflow_dispatch)

1. Go to GitHub Actions → `deploy-do.yml` → "Run workflow"
2. Set `deploy_target` (dev or prod; `prod` requires running from the `main`
   branch — BP-P2-006)
3. Optionally set `rollback_sha` to the 7–40 char lowercase-hex SHA of the
   previous working commit
4. Run the workflow

With `rollback_sha` **empty** the workflow builds all three images from the
selected branch HEAD and deploys them. With `rollback_sha` **set** the build
jobs are skipped and the workflow deploys the images already published under
that SHA tag — so the tag must already exist in GHCR (it normally does for any
commit that was previously deployed). The workflow validates the input
(lowercase hex only), SSHes in, and runs
`IMAGE_TAG=<sha> docker compose -p mct-portal up -d`, followed by automated
API, Worker and Web health checks; a failure fails the deploy and leaves the
previous containers running. See `docs/ROLLBACK_PROCEDURES.md` §1 for the full
preconditions.

### Manual rollback via SSH

Use this only when the images are not in GHCR or the workflow cannot run.
```bash
ssh root@<droplet-ip>
cd /opt/mct-portal
IMAGE_TAG=<previous-sha> docker compose -p mct-portal up -d
```

The compose file defaults to `latest` tag if `IMAGE_TAG` is unset, but the deploy workflow always pins to the commit SHA. Old images are pruned periodically, so you may need to pull the specific tag first:

```bash
docker pull ghcr.io/mainecybertech/mainecybertech/mct-api:<sha>
IMAGE_TAG=<sha> docker compose -p mct-portal up -d
```

### Terraform rollback

Use Terraform state carefully. Review the plan before applying rollback changes. `prevent_destroy` is set on the droplet to prevent accidental deletion.

## Monitoring

### Sentry

Error tracking is configured for both API and Web. Sentry DSN is optional — skipped if unset. Worker also has Sentry integration for background job errors.

### Health checks

- Each deploy runs health checks against API, Web **and Worker**; the deploy
  step fails (and rolls back to the previously running images) if any is
  unhealthy. A final container health gate asserts every healthchecked service
  (redis, api, worker, web, alertmanager, prometheus, caddy) before old images
  are pruned.
- All app images define Docker HEALTHCHECK directives (redis ping, API wget
  `/health`, web wget `/` on port 3000, Caddy validates its Caddyfile, worker
  wget `/health` on port 3001; prometheus probes `/-/ready` and alertmanager
  probes `/-/healthy`).
- Worker exposes `/health` on port 3001 (internal only); the deploy checks it
  over SSH.

### Logs

All container logs are accessible via `docker compose logs`. There is no external log shipping — operators SSH in to debug.

### DO monitoring

The DigitalOcean dashboard provides CPU, memory, disk, and network graphs for the droplet. Set up alerts in the DO control panel for CPU > 80% or disk > 85%.

## Troubleshooting

### Container won't start

```bash
docker compose -p mct-portal logs <service>
```

Common issues:

- **Web OOM**: If web exits with code 137, increase `mem_limit` in docker-compose.yml (current: 512MB)
- **API can't connect to Supabase**: Verify `SUPABASE_URL` and keys in `/opt/mct-portal/.env`
- **Worker can't connect to Redis**: Verify `REDIS_PASSWORD` matches between `.env` and docker-compose
- **Caddy TLS errors**: Check `fullchain.pem` and `privkey.pem` in `/opt/mct-portal/certs/`. If empty, the deploy falls back to `tls internal` (dev) or will fail (prod)

### Deploy pipeline fails

1. Check **Setup** step output for env name and domain values
2. Check **Resolve IP** — is the droplet name correct? Run `doctl compute droplet list`
3. Check **Build** steps — image tag mismatch or Docker build failure
4. Check **Deploy** step — SSH connectivity or `.env` write failure
5. Check **Health check** — API returned non-200 or web unreachable

### Full droplet reinstall

If the droplet needs to be rebuilt:

1. Run `terraform apply` (creates new droplet with cloud-init)
2. Run the deploy workflow (populates app code and containers)
3. Run `supabase-migrations.yml` (applies latest DB migrations)

### Common commands

```bash
# Check if API is responding internally
curl -s http://localhost:4000/health

# Check nginx-style logs for web
docker compose -p mct-portal exec web cat /var/log/nextjs/access.log 2>/dev/null || true

# Restart everything
docker compose -p mct-portal down && docker compose -p mct-portal up -d

# Wipe and reload from scratch
docker compose -p mct-portal down -v && docker compose -p mct-portal up -d

# View env file contents (contains secrets — be careful)
cat /opt/mct-portal/.env | grep -v PASSWORD | grep -v SECRET | grep -v TOKEN | grep -v KEY
```

## Promotion Rules

1. **Feature branches** — only validate (lint, test, typecheck)
2. **develop** — deploys to dev (.us domains)
3. **main** — deploys to prod (.com domains), gated by prod-approval
4. Only promote to `main` after dev validation succeeds
