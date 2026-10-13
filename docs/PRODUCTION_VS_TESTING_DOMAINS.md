# Production vs Testing Domains

Both zones run the same as-built topology: Cloudflare DNS/proxy in front of a
DigitalOcean droplet running the `infra/digitalocean/docker-compose.yml` stack
(Caddy → Next.js web, Express API, worker, Redis, Prometheus/Alertmanager).
There is no Vercel or AWS ALB/ECS runtime in the current deployment path — the
earlier Vercel/ECS descriptions were stale (INFRA-P2-005 / ARCH-P3-002).

## Production Zone: `mainecybertech.com`

### Web application
- Hostname: `app.mainecybertech.com`
- DNS provider: Cloudflare
- Origin: droplet `mct-portal-prod`, Caddy on 80/443 → `web:3000`

### API
- Hostname: `api.mainecybertech.com`
- DNS provider: Cloudflare
- Origin: droplet `mct-portal-prod`, Caddy on 80/443 → `api:4000`

## Testing Zone: `mainecybertech.us`

### Web application
- Hostname: `app.mainecybertech.us`
- DNS provider: Cloudflare
- Origin: droplet `mct-portal-dev`, Caddy on 80/443 → `web:3000`

### API
- Hostname: `api.mainecybertech.us`
- DNS provider: Cloudflare
- Origin: droplet `mct-portal-dev`, Caddy on 80/443 → `api:4000`

## Operational Separation

Keep the production and testing hostnames mapped to separate droplets so you
can validate changes without touching production:

- `develop` deploys to the `dev` environment/droplet (`deploy-do.yml`);
- production deploys run from `main` through the approval-gated
  `prod-approval` environment to the `prod` droplet;
- secrets are set per GitHub environment (`dev` / `prod-approval`); environment
  secrets override the repo-level defaults (e.g. `RLS_READS_ENABLED`);
- Terraform state and droplet names (`mct-portal-dev` / `mct-portal-prod`) are
  independent, and the dev droplet can be rebuilt without affecting prod DNS.

### Verification

- `curl -sSf https://api.mainecybertech.us/health` and
  `curl -sSf https://api.mainecybertech.com/health` must return 200 with the
  expected `status`.
- The scheduled `external-uptime-probe.yml` exercises both zones.
