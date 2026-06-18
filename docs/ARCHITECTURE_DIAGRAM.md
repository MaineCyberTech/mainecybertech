# System Architecture Diagram

```mermaid
graph TB
    subgraph "Users"
        B[Browser Client]
        A[Admin User]
        P[Portal User]
        V[Public Visitor]
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
        CACHE[Response Cache]
        AUDIT[Audit Service]
        VALID[Zod Validation]
    end

    subgraph "Worker (port 3001)"
        WK[BullMQ Consumer]
        TASKS[Task Handlers]
        HEALTH[Health Server]
    end

    subgraph "Supabase (Hosted)"
        DB[PostgreSQL]
        AUTH_SRV[GoTrue Auth]
        STORAGE[S3 Storage]
        RLS[RLS Policies]
    end

    subgraph "Infrastructure"
        REDIS[Redis]
        DOCKER[Docker Compose]
        GHCR[GitHub Container Registry]
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
    B -->|HTTPS| C
    C -->|Proxy| W
    W -->|Server Components| API
    W -->|Client Components| API

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

    %% Deploy
    GHCR -->|Images| DOCKER
    DOCKER -->|Compose| C
    DOCKER -->|Compose| API
    DOCKER -->|Compose| W
    DOCKER -->|Compose| WK
    DOCKER -->|Compose| REDIS
```

## Data Flow (Request)

```
1. Browser → Caddy (TLS) → web:3000 (Next.js)
2. Server Component → http://api:4000 (Docker internal)
3. Client Component → https://api.* (public, inlined at build time)
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
2. Build 3 images (api, web, worker) → push to GHCR
3. SSH into droplet → docker save | gzip | ssh | gunzip | docker load
4. docker compose up -d
5. Clean old images
```

## Key Design Decisions

| Decision        | Rationale                                           |
| --------------- | --------------------------------------------------- |
| Single droplet  | ~$12-24/mo vs $150/mo AWS; simple to manage         |
| BullMQ over SQS | Simpler for single-droplet; SQS dormant as fallback |
| Hosted Supabase | Avoid managing Postgres + GoTrue + Storage          |
| In-memory cache | Acceptable for single-instance; Redis upgrade path  |
| Custom SDK      | Typed, bundleable, cookie or token auth             |
| PKCE + JWT      | Stateless, no external auth provider                |
