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
4. **Deploy** — SSH into droplet, write `.env` from GitHub secrets, pull images from GHCR, copy compose file and per-environment Caddyfile, set up Cloudflare Origin CA certs, `docker compose up -d` with `IMAGE_TAG=<sha>`
5. **Health check** — Poll `https://api.<domain>/health` (200/526) and `https://app.<domain>/login` (non-000)

### Speed optimization

Images are **not** piped over SSH anymore. The deploy step pulls directly from GHCR on the droplet. Builder cache pruning is deferred to post-deploy to avoid SSH timeouts. Old MCT images are cleaned up via `docker image prune -af`.

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

# Full container restart (zero-downtime not guaranteed on single droplet)
docker compose -p mct-portal down --remove-orphans
docker compose -p mct-portal up -d --remove-orphans
```

### Health check endpoints

- `https://api.mainecybertech.com/health` — API health (includes Supabase connectivity)
- `https://api.mainecybertech.us/health` — Dev API health
- Worker health: `curl http://localhost:3001/health` (internal, on droplet)
- Redis health: `redis-cli -a <password> ping` (internal, on droplet)

## Secrets Management

### Required GitHub Environments

- `dev` — dev/develop deploys (no approval)
- `prod` — prod deploys (requires 1+ reviewers via `prod-approval` gate)

### GitHub Environment Secrets (written to `/opt/mct-portal/.env`)

The deploy workflow writes 25+ secrets to `.env` on the droplet via SSH heredoc. Key secrets:

| Secret                              | Purpose                               |
| ----------------------------------- | ------------------------------------- |
| SUPABASE_URL                        | Hosted Supabase project URL           |
| SUPABASE_ANON_KEY                   | Supabase anon key                     |
| SUPABASE_SERVICE_ROLE_KEY           | Supabase service role key             |
| JWT_SECRET                          | Local JWT signing/verification        |
| STRIPE_SECRET_KEY                   | Stripe API key                        |
| STRIPE_WEBHOOK_SECRET               | Stripe webhook signing secret         |
| SENTRY_DSN                          | Sentry error tracking                 |
| SMTP_HOST/PASS                      | Email (password reset, notifications) |
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
| `variables.tf`   | 12 variables (DO token, region, size, SSH key, Cloudflare zones, env) |
| `droplet.tf`     | Droplet resource with cloud-init, `prevent_destroy` lifecycle         |
| `firewall.tf`    | DO Cloud Firewall: ports 22/80/443/2376, full egress                  |
| `dns.tf`         | A records per domain (dev→.us, prod→.com), proxied via Cloudflare     |
| `outputs.tf`     | Droplet IP, ID, URN                                                   |
| `cloud-init.yml` | Docker install, docker compose, data directories                      |

### Terraform workflow

Triggered on push to main/develop when `infra/terraform/digitalocean/**` changes. Apply is gated: dev applies directly, prod requires validate + e2e + supabase-migrations + prod-approval.

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
2. Set `deploy_target` (dev or prod)
3. The workflow deploys the HEAD of the selected branch

To deploy a specific SHA, use the manual method below.

### Manual rollback via SSH

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

- Each deploy workflow runs a 2-minute health check against API and Web
- All 5 containers have Docker HEALTHCHECK directives (redis ping, API wget /health, web wget /login, Caddy checks its own process)
- Worker exposes `/health` on port 3001 (internal only)

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

- **Web OOM**: If web exits with code 137, increase `mem_limit` in docker-compose.yml (current: 256MB)
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
