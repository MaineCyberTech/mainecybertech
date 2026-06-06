# Marketing Site Integration — Domain Route

> All 4 phases complete. The `aws-www` standalone static site has been decommissioned. Marketing is now served from `apps/web/app/(public)/` in the monorepo.

## Domain Strategy

| Domain | Serves | Route Group |
|--------|--------|-------------|
| `www.mainecybertech.com` | Marketing homepage + service pages | `apps/web/app/(public)/` |
| `app.mainecybertech.com` | Portal + admin | `apps/web/app/(portal)/` + `apps/web/app/(admin)/` |

Both domains point to the same Vercel project. Vercel domain routing handles which route group serves which domain via `next.config.mjs` or Vercel's domain settings.

## Source Material

The original marketing site was a standalone static SPA in `aws-www/` (now removed), featuring:
- **5 service pages** (SPA views): Business Networks, Security Systems & Cameras, Technical IT Support, Cloud Configuration, Security Configuration
- **Contact form**: company name, contact name, email, phone, services dropdown, employees dropdown, urgency dropdown, message
- **Particle animation** canvas background (Canvas API, green `#059669` particles)
- **Google Analytics** `G-1JYZ96P0D9` (already in `<head>`)
- **Tawk.to chat** `66898d27e1e4f70f24ee3260/1i24kuosn` (configurable via `NEXT_PUBLIC_TAWKTO_ID` env var)
- **API calls**: `GET /api/init` (tracking session) → `POST /api/submit` (submit lead)
- **Contact info**: Limington, ME · (207) 222-7525 · contact@mainecybertech.com
- **Design**: Dark cyber green palette (`--accent-green: #059669`, `--bg-base: #0A1118`), glassmorphism nav, Orbitron headings, Inter body, 3D hover cards, mobile hamburger menu

## Phase 1 — Public API Endpoints ✅ (in Main API)

Two unauthenticated endpoints in `apps/api` that replaced the standalone Express server.js:

### 1a. Supabase Migration — `public_interactions` table

**File:** `supabase/migrations/5302033_public_interactions.sql`

```sql
CREATE TABLE public.public_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address VARCHAR(45),
  location VARCHAR(150),
  user_agent TEXT,
  platform VARCHAR(100),
  referrer TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  status VARCHAR(20) DEFAULT 'started',
  company_name VARCHAR(150),
  client_name VARCHAR(100),
  client_email VARCHAR(100),
  client_phone VARCHAR(50),
  services_requested TEXT,
  employees VARCHAR(50),
  urgency VARCHAR(50),
  client_message TEXT,
  submitted_at TIMESTAMPTZ
);

-- No RLS — public insert/select only via API middleware checks
ALTER TABLE public.public_interactions ENABLE ROW LEVEL SECURITY;

-- Allow inserts from any IP (the API controls access)
CREATE POLICY "allow_insert" ON public.public_interactions
  FOR INSERT TO anon WITH CHECK (true);

-- Allow select on own tracking ID only (handled by API)
CREATE POLICY "allow_select_own" ON public.public_interactions
  FOR SELECT TO anon USING (true);
```

### 1b. Route File — `apps/api/src/routes/public.ts`

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/v1/public/init` | Creates tracking session, returns `{ trackingId }`, optional geo-lookup + traffic webhook |
| `POST` | `/api/v1/public/submit` | Updates session with form data, sends Teams/Slack webhook, creates JSM ticket |

**Key behaviors to replicate from `server.js`:**
- `GET /init`: Insert row with `id` (UUIDv4), `ip_address`, `user_agent`, `platform`, `referrer`; optional geo-lookup via `ip-api.com`; optional traffic webhook to Teams adaptive card
- `POST /submit`: Update row by `trackingId`, set form fields + `status='submitted'` + `submitted_at`; send lead webhook (Teams adaptive card) with full session metadata; create JSM ticket via REST API (basic auth + service desk API)

### 1c. Register Route in App

Add to `apps/api/src/app.ts`:

```ts
import publicRoutes from './routes/public';
app.use('/api/v1/public', publicRoutes);
```

### 1d. New Env Vars

Add to `apps/api` env schema:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PUBLIC_TRAFFIC_WEBHOOK_URL` | No | — | Teams webhook URL for visitor notifications |
| `PUBLIC_LEAD_WEBHOOK_URL` | No | — | Teams webhook URL for new lead notifications |
| `JSM_DOMAIN` | No | — | JSM domain for auto-ticket creation from web leads |
| `JSM_EMAIL` | No | — | JSM user email for API auth |
| `JSM_API_TOKEN` | No | — | JSM API token |
| `JSM_SERVICEDESK_ID` | No | — | JSM service desk ID |
| `JSM_REQUEST_TYPE_ID` | No | — | JSM request type ID |

### 1e. CORS Update

The marketing site at `www.mainecybertech.com` needs CORS access to the API at `api.mainecybertech.com`. The existing CORS middleware already supports `CORS_ORIGIN` env var — verify it allows both `app.mainecybertech.com` and `www.mainecybertech.com` (or use an array/pattern).

### 1f. API Tests

Create `apps/api/src/__tests__/public.test.ts` with tests for:
- `GET /api/v1/public/init` — returns `{ trackingId }`
- `POST /api/v1/public/submit` with valid tracking ID — returns success
- `POST /api/v1/public/submit` with missing tracking ID — returns 400
- `POST /api/v1/public/submit` with invalid tracking ID — returns 404

## Phase 2 — Marketing Frontend Conversion ✅

### 2a. Route Group Structure

```
apps/web/app/(public)/
├── layout.tsx            # Public layout (no auth guard, GA + Tawk.to scripts)
├── page.tsx              # Home page (hero + service cards)
├── loading.tsx           # Loading skeleton (optional — static page)
├── services/
│   ├── networks/page.tsx
│   ├── security-systems/page.tsx
│   ├── it-support/page.tsx
│   ├── cloud/page.tsx
│   └── cybersecurity/page.tsx
├── contact/page.tsx      # Contact form page
└── contact/
    └── actions.ts        # Server actions for form submission
```

### 2b. Components

Create under `apps/web/components/marketing/`:

| Component | Purpose |
|-----------|---------|
| `MarketingHeader.tsx` | Glassmorphism nav with scroll-based blur, hamburger menu on mobile, active link tracking |
| `HeroSection.tsx` | "Secure Your Future" hero with CTA button |
| `ServiceCard.tsx` | 3D hover card with icon, title, description, "View Details →" link |
| `ServiceDetailSection.tsx` | Detail view layout for individual service pages (2-col text + visual) |
| `ContactInfo.tsx` | Physical address, phone, email display |
| `ContactForm.tsx` | Intake form with validation, session tracking, submission |
| `ParticleBackground.tsx` | Canvas particle animation (client component, wrapped in `"use client"`) |
| `Footer.tsx` | Optional footer with copyright, links |

### 2c. Design Tokens

The existing marketing palette is already compatible with the portal's CSS variables:

```css
:root {
  --bg-base: #0A1118;
  --bg-card: rgba(18, 30, 45, 0.75);
  --bg-card-hover: rgba(25, 40, 60, 0.95);
  --accent-green: #059669;
  --text-light: #F8FAFC;
  --text-muted: #94A3B8;
}
```

Add these to `apps/web/app/globals.css` under `:root` for the public route group.

### 2d. Public Layout (`apps/web/app/(public)/layout.tsx`)

- No auth checks, no `<SessionProvider>`, no portal/admin nav
- Includes GA script (ID from `NEXT_PUBLIC_GA_ID` env var, empty = disabled)
- Includes Tawk.to chat embed (ID from `NEXT_PUBLIC_TAWKTO_ID` env var, empty = disabled)
- Must export `export const dynamic = "force-dynamic"` (not needed for static, but form uses cookies for CSRF)
- Loads `ParticleBackground` canvas (client component with `"use client"`)
- Loads `MarketingHeader` for navigation
- SEO metadata: `<title>Maine CyberTech | Networks, Security & IT Support</title>`, description, Open Graph tags

### 2e. Homepage (`apps/web/app/(public)/page.tsx`)

- Server component, statically rendered
- Sections: Hero, Service Cards Grid, Contact CTA
- Service cards link to `/services/networks`, `/services/security-systems`, etc.
- "Contact Us" nav link and CTA buttons link to `/contact`

### 2f. Service Pages

Each service page under `apps/web/app/(public)/services/[slug]/page.tsx`:
- Server component, statically rendered
- Back link to home, service detail content, CTA to contact form
- SEO metadata per service

### 2g. Contact Page (`apps/web/app/(public)/contact/page.tsx`)

- Server component wrapper
- Client component `ContactForm.tsx` for form logic
- Server actions in `actions.ts`:
  - `initTracking()` — calls `fetch(API_BASE_URL + '/api/v1/public/init')`, returns tracking ID
  - `submitLead(data)` — calls `POST /api/v1/public/submit` with form data + tracking ID

### 2h. Client-side ContactForm Behavior (from existing HTML)

```js
// On DOMContentLoaded:
//   GET /api/v1/public/init → set trackingId in hidden input → enable submit button

// On submit:
//   POST /api/v1/public/submit { trackingId, company, name, email, phone,
//     services, employees, urgency, message }
//   → show success/error message → reset form on success
```

## Phase 3 — Domain Configuration ✅

### 3a. Vercel Domain Setup

In the existing Vercel project (`vercel.tf` or Vercel dashboard):

| Domain | Role |
|--------|------|
| `www.mainecybertech.com` | Production — serves `(public)` route group |
| `app.mainecybertech.com` | Production — serves `(portal)` + `(admin)` route groups |

**Vercel approach:** Add both domains to the same project. Vercel routes by hostname — no special config needed in `next.config.mjs`.

### 3b. Cloudflare DNS

The existing `dns.cloudflare.tf` already has CNAME records for `app.mainecybertech.com` and `api.mainecybertech.com`. Add:

```
www.mainecybertech.com  CNAME  cname.vercel-dns.com  (proxied)
```

### 3c. next.config.mjs

No changes needed — both domains serve the same build. Vercel handles routing at the edge.

### 3d. Terraform Update (`vercel.tf`)

Add `www.mainecybertech.com` as a domain in the Vercel project resource, or add as a separate domain resource.

## Phase 4 — Cleanup & Deployment ✅

### 4a. Retire Standalone API ✅

The `aws-www/` directory (server.js, static HTML, Dockerfiles, docker-compose, traefik config, empty CI workflows) has been removed. All API functionality is handled by `apps/api/src/routes/public.ts`.

### 4b. Docker Compose ✅

No changes needed — marketing pages are served by the same Next.js build as the portal.

### 4c. E2E Marketing Tests ✅

Created `apps/web/e2e/marketing/` with:
- `homepage.spec.ts` — hero section visible, 5 service cards, CTA to /contact, all 5 slug routes, 404 for unknown slug
- `contact.spec.ts` — renders heading + contact info, validation errors on empty submit, phone/email hrefs correct

### 4d. CI/CD ✅

The existing `web-prod-vercel.yml` and `web-dev-vercel.yml` already deploy the web app to Vercel. No new workflows needed — both domains are from the same build.

## Implementation Order ✅

All 4 phases are complete.

## Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Same Vercel project or separate? | **Same project** | Simpler deployment, shared infra, cost savings; Vercel handles domain-based routing natively |
| Route group or separate app? | **Route group `(public)`** | Single Docker image, single CI/CD pipeline; route groups keep code isolated |
| Static or dynamic? | **Static (SSG)** for service pages, **dynamic** for contact page form | Service pages have no user-specific content; contact form needs client-side interactivity |
| GA + Tawk.to in layout or per-page? | **Root public layout** | These should fire on every marketing page visit |
| CSS modules or Tailwind? | **Tailwind** with custom CSS variables for the dark cyber theme | The rest of the portal uses Tailwind; marketing should match the toolchain |
| Particle component performance? | **Client component with cleanup** | Must remove event listeners and stop animation loop on unmount |

## Relevant Files

| File | Purpose |
|------|---------|
| `apps/api/src/routes/public.ts` | Public API endpoints (init + submit) |
| `apps/web/app/(public)/` | Marketing route group (home, services, contact) |
| `apps/web/components/marketing/` | Marketing components (header, particles, cards, form) |
| `apps/web/app/globals.css` | Marketing CSS variables |
| `apps/web/e2e/marketing/` | E2E marketing tests |
| `infra/terraform/vercel.tf` | Vercel project with www + app domains |
| `infra/terraform/dns.cloudflare.tf` | Cloudflare www + app + api CNAME records |
