# Onboarding Guide — Maine CyberTech Portal

> **Purpose:** Help new developers understand the architecture, development workflow, and key patterns in this monorepo.
> **Prerequisites:** Node 18+, pnpm 10, Docker, Supabase CLI, VS Code

---

## 1. Quick Start (5 min setup)

```bash
# Clone and install
git clone https://github.com/MaineCyberTech/mainecybertech.git
cd mainecybertech-portal
pnpm install

# Start Supabase locally (requires Docker)
supabase start

# Sync env vars
pnpm supabase:env:sync

# Terminals (run each):
pnpm --filter=api dev    # API on :4000
pnpm --filter=web dev    # Web on :3000
pnpm --filter=worker dev # Worker on :3001

# Run tests
pnpm test
```

---

## 2. Monorepo Architecture

```
mainecybertech-portal/
├── apps/
│   ├── api/         Express API (port 4000)
│   ├── web/         Next.js 15 App Router (port 3000)
│   └── worker/      BullMQ job processor (port 3001 health)
├── packages/
│   ├── sdk/         Typed API client (MCTClient.create())
│   ├── ui/          cn() utility (clsx + tailwind-merge)
│   └── config/      Shared ESLint + TypeScript configs
├── infra/
│   ├── digitalocean/  Docker Compose + Caddyfile (production stack)
│   └── terraform/
│       └── digitalocean/  IaC (droplet, firewall, DNS)
├── supabase/
│   ├── migrations/    12 SQL migration files
│   ├── seeds/         5 seed files
│   └── policies/      RLS policy snippets
├── docs/              30+ documentation files
├── scripts/           PowerShell + bash utilities
└── .github/           CI/CD workflows (8 total)
```

### Key Design Principles

- **Modular monolith** — each app is independently deployable, shares patterns not code
- **API-first** — all business logic lives in Express API; web is a thin rendering layer
- **Supabase for everything** — auth, database, storage; API uses Admin SDK (service_role)
- **Zod for safety** — all env vars, request bodies, and responses are validated at runtime
- **Tenant isolation** — every entity route checks org membership via `requireOrgAccess()`

---

## 3. Key Concepts

### Request Flow

```
Browser → Caddy (TLS) → web:3000 (Next.js)
  ├── Server Components → API via http://api:4000 (Docker internal)
  └── Client Components → API via https://api.* (public, inlined at build)

API (Express:4000)
  └── Middleware pipeline:
      Helmet → CORS → JSON → cookie-parser → securityHeaders
      → inputSanitizer → rateLimiter → rateLimitByUser
      → requestId → requestLogger → [routes]

Worker (BullMQ:3001 health)
  ├── Task registry: 5 integration tasks + ping
  └── Backends: BullMQ (default, Redis) / SQS (dormant)
```

### Auth Flow

1. User visits `app.*/login` → signs in via `POST /api/v1/auth/sign-in`
2. API validates with Supabase Admin SDK → returns JWT
3. Web stores JWT in `mct_session` cookie (HttpOnly, Secure, SameSite=Lax)
4. Subsequent requests: middleware validates JWT locally (fast path) → falls back to Supabase `getUser()`
5. Admin check: single JOIN query (memberships + roles), no N+1

### Route Pattern (API)

Every route module follows the same structure:

```typescript
import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { requireOrgAccess } from "../middleware/org-access";
import { logAuditEvent } from "../services/audit";
import { someSchema } from "../validators/some-module";

const router = Router();

// Apply auth/org middleware at router level
router.use(requireAuth);
router.use(requireOrgAccess);

// GET list (paginated)
router.get("/", async (req, res, next) => {
  try {
    // ... query with pagination
    res.json(success(result));
  } catch (error) {
    next(error);
  }
});

// GET single (with relations)
router.get("/:id", async (req, res, next) => {
  // ... single query
});

// POST create (with Zod validation + audit)
router.post("/", async (req, res, next) => {
  const parsed = someSchema.parse(req.body);
  // ... insert
  await logAuditEvent({
    /* ... */
  });
  res.status(201).json(success(data));
});

// PATCH update (with audit)
router.patch("/:id", async (req, res, next) => {
  const parsed = someSchema.partial().parse(req.body);
  // ... update
  res.json(success(data));
});

export default router;
```

### SDK Pattern

```typescript
import { MCTClient } from "@mct/sdk";

// Client component (cookie-backed auth)
const client = MCTClient.create();

// Server component (API token auth)
const client = MCTClient.create({ apiKey: process.env.API_KEY });

// Use
const { data: tickets, error } = await client.tickets.list({
  organizationId: "...",
});
```

---

## 4. Testing Patterns

### Running Tests

```bash
pnpm test                    # All packages
pnpm --filter=api test       # Single package
pnpm --filter=web test:watch # Watch mode
pnpm e2e                     # Playwright E2E (chromium only)
```

### Mock Builder (API tests)

```typescript
import { createMockBuilder, createTestApp } from "./helpers";

const mock = createMockBuilder({ data: [{ id: "1" }], error: null });
// Chain mock supabase methods
// .then() returns the result for `await`
```

### Async Server Component Tests

```typescript
// Call async function, await JSX, then render()
const Component = await MyComponent({ params: Promise.resolve({ id: "1" }) });
const { container } = render(Component);
```

### Redirect Mocks

```typescript
// Must throw "NEXT_REDIRECT" to prevent execution continuation
jest.mock("next/navigation", () => ({
  redirect: jest.fn(() => {
    throw "NEXT_REDIRECT";
  }),
}));
```

---

## 5. Database & Migrations

### Migration Workflow

```bash
supabase migration new my_change_name
# Edit the generated SQL file
supabase db push           # apply to local
supabase db push --linked  # apply to remote
```

### RLS Pattern

Every table has RLS enabled with these policy types:

- `SELECT`: org member or super_admin
- `INSERT`: auth user + permission check
- `UPDATE/DELETE`: admin/super_admin or permission check

Key helper functions (defined in migration `5302026`):

- `public.is_super_admin()` — checks memberships table
- `public.is_org_member(org_id)` — approved membership check
- `public.is_org_approved_member(org_id)` — stricter check
- `public.user_has_role(org_id, roles[])` — role-based
- `public.user_has_permission(org_id, module, action)` — role + override

---

## 6. Infrastructure

### Production Stack

- **Hosting:** Single DigitalOcean droplet behind Caddy reverse proxy
- **Containers:** Docker Compose (api, web, worker, redis, caddy)
- **Registry:** GHCR (ghcr.io/mainecybertech/mct-\*), SHA-tagged images
- **Database:** Hosted Supabase (cloud.supabase.com)
- **Cache:** In-memory `Map` (single-instance only — see `cache.ts` design note)

### Deploy Pipeline

1. Push to `develop` → GitHub Actions builds 3 images → pushes to GHCR
2. SSH into droplet → `docker save | gzip | ssh | gunzip | docker load` (fast image transfer)
3. `docker compose up -d` with new images
4. Old images cleaned up post-deploy

### Key Files

| File                                        | Purpose                      |
| ------------------------------------------- | ---------------------------- |
| `infra/digitalocean/docker-compose.yml`     | Full production stack        |
| `infra/digitalocean/Caddyfile`              | TLS reverse proxy config     |
| `infra/terraform/digitalocean/`             | IaC (droplet, firewall, DNS) |
| `.github/workflows/deploy-do.yml`           | Deploy workflow              |
| `.github/workflows/supabase-migrations.yml` | DB migration workflow        |

---

## 7. Common Tasks

### Adding a New API Endpoint

1. Add Zod schema in `apps/api/src/validators/` if mutation
2. Add route in `apps/api/src/routes/` following existing patterns
3. Add audit logging if mutation
4. Add SDK method in `packages/sdk/src/`
5. Add web component or server action in `apps/web/`
6. Add tests for API + SDK + web component
7. Add to `docs/API_ENDPOINT_INVENTORY.md`

### Adding a New Database Table

1. Create migration: `supabase migration new table_name`
2. Add RLS policies (SELECT/INSERT/UPDATE/DELETE)
3. Add seed data in `supabase/seeds/`
4. Add API routes + Zod validation
5. Add SDK methods
6. Add web UI components
7. Add tests

### Debugging Tips

- API logs: `docker logs mct-api -f` or `pnpm --filter=api dev`
- Worker logs: `docker logs mct-worker -f`
- Redis: `docker exec -it mct-redis redis-cli`
- Database: `supabase db dump --linked` to inspect remote schema
- Sentry: Check `sentry.io` for error tracking

---

## 8. Key Documentation

| Document                                       | What it covers                                        |
| ---------------------------------------------- | ----------------------------------------------------- |
| `AGENTS.md`                                    | Full architecture, test patterns, critical context    |
| `docs/API_ENDPOINT_INVENTORY.md`               | All 86 API endpoints with auth/validation/cache/audit |
| `docs/ENVIRONMENT_VARIABLES.md`                | All env vars across all services                      |
| `docs/MEGA_AUDIT_2026-06-18.md`                | Comprehensive architecture & security audit           |
| `docs/FINAL_DEPLOYMENT_OPERATIONS_HANDBOOK.md` | Operator manual                                       |
| `docs/CODE_REVIEW_2026-06-16.md`               | 30 architecture recommendations                       |
| `README.dev.md`                                | Developer setup guide                                 |

---

## 9. Architecture Decision Records (ADRs)

_Key decisions that shaped this project:_

| Decision       | Choice                       | Rationale                                            |
| -------------- | ---------------------------- | ---------------------------------------------------- |
| **Hosting**    | DigitalOcean droplet + Caddy | ~$12-24/mo vs $150/mo AWS; single-droplet simplicity |
| **Queue**      | BullMQ (Redis) over SQS      | Simpler for single-droplet; SQS dormant as fallback  |
| **Auth**       | PKCE + JWT cookie            | Stateless, no external auth provider dependency      |
| **Cache**      | In-memory Map                | Acceptable for single-instance; Redis upgrade path   |
| **Database**   | Hosted Supabase              | Avoid managing Postgres + GoTrue + Storage           |
| **API Client** | Custom SDK (MCTClient)       | Typed, bundleable, cookie or token auth              |

---

## 10. Getting Help

1. Check `docs/INDEX.md` for full documentation index
2. Search `AGENTS.md` for patterns and constraints
3. Run `pnpm test` to verify changes don't break anything
4. Run `pnpm typecheck` to verify TypeScript safety
5. Ask in team chat with specific file references
