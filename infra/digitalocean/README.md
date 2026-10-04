# infra/digitalocean

Production stack for the Maine CyberTech Portal on a single DigitalOcean droplet.

## What runs here

`docker-compose.yml` defines the services deployed to the droplet:

| Service      | Image                                                           | Notes                                     |
| ------------ | --------------------------------------------------------------- | ----------------------------------------- |
| `api`        | `ghcr.io/mainecybertech/mainecybertech/mct-api:${IMAGE_TAG}`    | Express API, port 4000                    |
| `web`        | `ghcr.io/mainecybertech/mainecybertech/mct-web:${IMAGE_TAG}`    | Next.js standalone, port 3000             |
| `worker`     | `ghcr.io/mainecybertech/mainecybertech/mct-worker:${IMAGE_TAG}` | BullMQ consumer, health on 3001           |
| `redis`      | `redis:7-alpine` (digest-pinned)                                | BullMQ backend; `REDIS_PASSWORD` required |
| `caddy`      | `caddy:2-alpine` (digest-pinned)                                | TLS reverse proxy on ports 80/443         |
| `prometheus` | `prom/prometheus:v3.5.1` (digest-pinned)                        | Internal-only metrics scraping (no ports) |

`GHCR_IMAGE_PREFIX` overrides the image prefix (default
`ghcr.io/mainecybertech/mainecybertech`).

### Container image pinning

Every third-party image is pinned by digest (`image@sha256:...`) so a mutable
upstream tag cannot change what runs in production. The three app images built
by this repository are the exception: they are referenced by the immutable
`git`-SHA tag set by `deploy-do.yml`
(`${GHCR_IMAGE_PREFIX}/mct-api:${IMAGE_TAG}`, etc.). The deploy workflow
resolves each tag to its manifest digest and verifies the GitHub
build-provenance attestation for that digest before `docker compose up`, so the
running artifact is bound to the reviewed commit.

Refresh a third-party pin when intentionally bumping the dependency:

```sh
# print the multi-arch manifest digest for the tag you want
docker buildx imagetools inspect <registry>/<image>:<tag> \
  --format '{{.Manifest.Digest}}'
# then change the image: line to <registry>/<image>:<tag>@sha256:<digest>
```

Refresh an app image by reviewing and merging to `main`: CI rebuilds and
re-tags with the new commit SHA. A rollback reuses the same tag-to-digest +
attestation verification for the older SHA.

Supporting files:

- `Caddyfile` — default prod-equivalent config (TLS + security headers).
  `Caddyfile.dev` / `Caddyfile.prod` are the environment variants the deploy
  workflow copies to `/opt/mct-portal/Caddyfile` (falling back to `Caddyfile`).
- `prometheus.yml` + `prometheus.rules.yml` — scrape config and alert rules.
- `.env.example` — template for the droplet `/opt/mct-portal/.env`.

## Required environment

Compose refuses to start without these (the `${VAR:?}` entries have no fallback):

- `IMAGE_TAG` — GHCR tag to deploy (set by `deploy-do.yml`)
- `REDIS_PASSWORD` — Redis password
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`
- `APP_DOMAIN` / `API_DOMAIN` — build `APP_BASE_URL` / `API_BASE_URL`
  (defaults `app.mainecybertech.com` / `api.mainecybertech.com`)

`deploy-do.yml` copies `docker-compose.yml` to `/opt/mct-portal/`, writes
`/opt/mct-portal/.env` from GitHub environment secrets, then runs
`docker compose -p mct-portal up -d` from `/opt/mct-portal`. Supabase itself is
hosted (cloud.supabase.com), not part of this stack.

## Local development

Local development does **not** use this directory. Use the repo-root
`docker-compose.yml`, which builds api/web/worker from source using each app's
`.env.local` (see `README.dev.md` at the repo root).
