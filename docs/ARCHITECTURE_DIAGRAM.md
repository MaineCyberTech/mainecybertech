# System Architecture Diagram

> As-built at the current develop commit. Regenerated alongside the ARCH-P3-002
> fix; keep it in sync with `infra/digitalocean/docker-compose.yml`,
> `infra/digitalocean/prometheus.yml` and `.github/workflows/deploy-do.yml`.

```mermaid
graph TB
    subgraph "Users"
        B[Browser Client]
        A[Admin User]
        P[Portal User]
        V[Public Visitor]
    end

    subgraph "Cloudflare DNS"
        CF[DNS / proxy records]
    end

    subgraph "Caddy (TLS)"
        C[Reverse Proxy]
    end

    subgraph "Next.js Web (port 3000)"
        W[App Router]
        SC[Server Components]
        CC[Client Components]
        MW[Middleware]
    end

    subgraph "Express API (port 4000)"
        API[Express App]
        MID[Middleware Pipeline]
        ROUTES[Route Modules]
        AUTH[Auth Middleware]
        ADMIN[Admin Middleware]
        ORG[Org Access Middleware]
        CACHE[Response Cache<br/>Redis + memory fallback]
        AUDIT[Audit Service]
        VALID[Zod Validation]
    end

    subgraph "Worker (port 3001)"
        WK[Task Consumer<br/>QUEUE_BACKEND: bullmq/sqs/inline]
        TASKS[Task Handlers]
        HEALTH[Health Server<br/>/health + token-gated /metrics]
    end

    subgraph "Supabase (Hosted)"
        DB[PostgreSQL]
        AUTH_SRV[GoTrue Auth]
        STORAGE[S3 Storage]
        RLS[RLS Policies<br/>opt-in per module via getScopedClient]
    end

    subgraph "Infrastructure"
        REDIS[Redis<br/>queue + cache + locks]
        DOCKER[Docker Compose]
        GHCR[GitHub Container Registry]
        PROM[Prometheus]
        AM[Alertmanager]
        NE[Node Exporter<br/>host cpu/mem/disk]
    end

    subgraph "External"
        STRIPE[Stripe]
        JIRA[Jira]
        JSM[JSM]
        M365[Microsoft 365]
        TEAMS[Teams Webhook]
        SENTRY[Sentry]
    end

    %% User flows
    B -->|HTTPS| CF
    CF -->|80/443| C
    C -->|Proxy| W
    W -->|Server Components: API_INTERNAL_URL (http://api:4000)| API
    W -->|Client Components: NEXT_PUBLIC_API_URL (inlined at build)| API

    %% API flow
    API --> MID
    MID --> AUTH
    AUTH -->|JWT verify| DB
    AUTH -->|Fallback| AUTH_SRV
    MID --> ADMIN
    ADMIN -->|Single JOIN| DB
    MID --> ORG
    ORG -->|Membership check| DB
    MID --> ROUTES
    ROUTES -->|CRUD| DB
    ROUTES -->|Cache| CACHE
    CACHE -->|Redis when configured| REDIS
    ROUTES -->|Audit| AUDIT
    ROUTES -->|Validate| VALID

    %% External integrations
    ROUTES -->|Stripe| STRIPE
    ROUTES -->|Webhooks| TEAMS
    ROUTES -->|JSM| JSM

    %% Worker
    WK -->|Redis| REDIS
    WK -->|Tasks| TASKS
    TASKS -->|Stripe| STRIPE
    TASKS -->|Jira| JIRA
    TASKS -->|JSM| JSM
    TASKS -->|M365| M365
    TASKS -->|Notifications| DB

    %% Error tracking
    API --> SENTRY
    W --> SENTRY
    WK --> SENTRY

    %% Observability (internal compose network, no published ports)
    PROM -->|scrape /metrics with METRICS_TOKEN| API
    PROM -->|scrape /metrics with METRICS_TOKEN| WK
    PROM -->|scrape node_* host metrics (no token)| NE
    PROM -->|alerts| AM

    %% Deploy
    GHCR -->|Images by digest| DOCKER
    DOCKER -->|Compose| C
    DOCKER -->|Compose| API
    DOCKER -->|Compose| W
    DOCKER -->|Compose| WK
    DOCKER -->|Compose| REDIS
    DOCKER -->|Compose| PROM
    DOCKER -->|Compose| AM
```

## Data Flow (Request)

```
1. Browser → Cloudflare DNS → droplet Caddy (TLS) → web:3000 (Next.js)
2. Server Component → API_INTERNAL_URL, set to http://api:4000 by compose
   (runtime read; NEXT_PUBLIC_API_URL cannot be overridden at runtime)
3. Client Component → https://api.* (NEXT_PUBLIC_API_URL, inlined at build time)
4. API → Middleware → Auth → Admin Check → Org Access → Route → DB
5. Response → JSON envelope { success: true, data: T }
```

## Data Flow (Auth)

```
1. POST /api/v1/auth/sign-in → Supabase signInWithPassword
2. Returns JWT → stored in mct_session cookie (HttpOnly, Secure, SameSite=Lax)
3. Subsequent requests: middleware decodes JWT (base64url, no deps)
4. Validates exp → if valid, proceeds (no Supabase call)
5. If expired → Supabase auth.getUser() fallback
```

## Data Flow (Deploy)

```
1. Push to develop → GitHub Actions
2. Build 3 images (api, web, worker) → push to GHCR (tag + digest)
3. Attach provenance and CycloneDX SBOM attestations
4. SSH into droplet → resolve tags to digests, verify attestations
5. Pre-pull images, per-service `docker compose up -d --no-deps` (rolling recreate)
6. Container health gate (every healthchecked service must report healthy);
   auto-revert to the previous images on failure
7. Clean old images
```

## Key Design Decisions

| Decision                  | Rationale                                                          |
| ------------------------- | ------------------------------------------------------------------ |
| Single droplet            | ~$12-24/mo vs $150/mo AWS; simple to manage                        |
| BullMQ over SQS           | Simpler for single-droplet; SQS dormant as fallback                |
| Hosted Supabase           | Avoid managing Postgres + GoTrue + Storage                         |
| Redis-backed response cache | Distributed cache when Redis is up; metered in-memory fallback   |
| Custom SDK                | Typed, bundleable, cookie or token auth                            |
| PKCE + JWT                | Stateless, no external auth provider                               |
| Opt-in RLS per module     | `getScopedClient` flips one module at a time (see ADR 008)         |
