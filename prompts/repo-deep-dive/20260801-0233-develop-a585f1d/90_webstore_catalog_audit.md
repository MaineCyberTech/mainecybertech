# Webstore Product Catalog Audit

## Audit Metadata

| Field | Value |
|---|---|
| **Audit name** | `repo-deep-dive` |
| **Run** | `20260801-0233-develop-a585f1d` |
| **Branch** | `develop` |
| **SHA** | `a585f1d` |
| **Date** | 2026-08-01 |
| **Auditor** | Principal-level repository auditor (automated) |
| **Scope** | Webstore product catalog: public store, admin center, promotions engine, conversion features, E2E wiring, release readiness |
| **Audit prompts** | `10_AUDIT_PUBLIC_STORE.md`, `11_AUDIT_ADMIN_CENTER.md`, `13_AUDIT_E2E_WIRING_COMPLETENESS.md`, `15_AUDIT_FINAL_RELEASE_GATE.md` |

## Scope

All files matched by these globs, plus referenced migrations:

- `apps/web/app/(public)/store/**/*.tsx`
- `apps/web/app/(admin)/admin/store/**/*.tsx`
- `apps/web/components/store/*.tsx`
- `apps/web/lib/catalog/**/*` (all .ts and .json)
- `apps/api/src/routes/store.ts`
- `apps/api/src/lib/store-catalog.ts`
- `apps/api/src/routes/analytics.ts`
- `supabase/migrations/5302104_store_promotions.sql`
- `supabase/migrations/5302105_store_quotes.sql`
- `supabase/migrations/5302106_store_analytics.sql`
- `packages/sdk/src/**` (searched for store references)
- `apps/web/__tests__/**/store/**` and catalog test files

Also searched for (absent):
- `supabase/migrations/5302060_store_conversion_modules.sql`
- `supabase/migrations/5302070_store_v5_sales_ops.sql`

## Evidence Reviewed

### Catalog Data (38 JSON files + 3 TS libs + 1 TS loader + 1 TS validation)

| File | Purpose | Status |
|---|---|---|
| `lib/catalog/types.ts` | 549 lines, 60+ type definitions | **Complete** |
| `lib/catalog/loader.ts` | 172 lines, 52 exported loader functions | **Complete** |
| `lib/catalog/v5-loaders.ts` | 440 lines, 30+ V5 data loaders | **Complete** |
| `lib/catalog/validation.ts` | 176 lines, catalog health validation | **Complete** |
| `lib/catalog/bundles.ts` | 69 lines, bundle/recommendation logic | **Complete** |
| `lib/catalog/index.ts` | 142 lines, barrel exports | **Complete** |
| `lib/catalog/promotions.ts` | 50 lines, promo validation + types | **Complete** |
| `lib/catalog/analytics.ts` | 47 lines, client-side tracking | **Complete** |
| `lib/catalog/quote-storage.ts` | 34 lines, localStorage quote mgmt | **Complete** |
| `lib/catalog/intake-actions.ts` | Exists (intake server actions) | **Complete** |
| `lib/catalog/proposal-actions.ts` | Exists (proposal server actions) | **Complete** |
| `lib/catalog/data/products.json` | 59,845 lines, 245 products | **Complete** |
| `lib/catalog/data/categories.json` | 355 lines, 12 categories | **Complete** |
| `lib/catalog/data/bundle-rules.json` | 83 lines, recommendation rules | **Complete** |
| 33 additional .json data files | All present under `data/` | **Complete** |

### Public Store Pages (9 page files)

| File | Lines | Status |
|---|---|---|
| `app/(public)/store/page.tsx` | 275 | Store index with hero, quick-wins, monthly plans, emergency, package ladders |
| `app/(public)/store/layout.tsx` | 80 | Sidebar + drawer layout (client component) |
| `app/(public)/store/[slug]/page.tsx` | 278 | Product detail with all sections, intake form |
| `app/(public)/store/category/[slug]/page.tsx` | 105 | Category listing with sub-nav |
| `app/(public)/store/quiz/page.tsx` | 37 | Service finder quiz wrapper |
| `app/(public)/store/quote/page.tsx` | 15 | Quote builder wrapper |
| `app/(public)/store/promotions/page.tsx` | 154 | Active promotions listing |
| `app/(public)/store/compare/page.tsx` | 81 | Comparison index page |
| `app/(public)/store/compare/[slug]/page.tsx` | 186 | Side-by-side comparison detail |

### Store Components (16 components)

| Component | Lines | Purpose |
|---|---|---|
| `StoreProductCard.tsx` | Present | Product card with name, summary, price, category |
| `StoreCategoryCard.tsx` | Present | Category card with name, description, count |
| `StoreSidebar.tsx` | Present | Category nav sidebar |
| `ServiceFinderQuiz.tsx` | 240 | Multi-step quiz with recommendations |
| `QuoteBuilderClient.tsx` | 392 | Full quote builder with localStorage + form |
| `IntakeFormRenderer.tsx` | 286 | Form with validation, tracking ID, submit |
| `CampaignBanner.tsx` | 89 | Seasonal campaign banners |
| `PromoBadge.tsx` | Present | Promo type badge |
| `TrustBadgeList.tsx` | 55 | Trust badge renderer |
| `PackageLadder.tsx` | Present | Single package ladder |
| `PackageLadderGrid.tsx` | Present | Grid of package ladders |
| `BundleValuePanel.tsx` | Present | Bundle savings display |
| `IncludedItemsList.tsx` | Present | Included items list |
| `FAQSection.tsx` | Present | FAQ accordion section |
| `CategoryVisualHeader.tsx` | Present | Category visual header |
| `CampaignsManagerClient.tsx` | Present | Campaign manager client component |

### Admin Store Pages (36 files across 30+ sub-routes)

All 32 admin store page files call `requireAdminAccess()` (verified by grep: 64 matches across all pages).

Key admin routes:
- `admin/store/` — Dashboard with 8 stat cards + catalog health issues
- `admin/store/products/` — Product table with search/filter/pagination
- `admin/store/products/[id]/` — Product detail/editor
- `admin/store/categories/` — Category management
- `admin/store/promotions/` — Promo CRUD table + mobile cards + create/edit/delete
- `admin/store/analytics/` — Analytics event registry (read-only reference)
- `admin/store/quotes/` — Quote submissions list with status management
- `admin/store/bundles/` — Bundle management
- `admin/store/import-export/` — JSON/CSV import validation + export
- `admin/store/audit/` — Audit trail
- `admin/store/profitability/` — Profitability scoring
- `admin/store/fulfillment/` — Internal fulfillment checklists
- `admin/store/dependencies/` — Product dependency engine
- `admin/store/lifecycle/` — Product lifecycle states
- `admin/store/leads/` — Lead scoring
- `admin/store/nurture/` — Email nurture sequences
- `admin/store/campaigns/` — Seasonal campaigns
- `admin/store/quiz/` — Quiz/question management
- `admin/store/bundle-calculator/` — Bundle savings calculator
- `admin/store/comparisons/` — Comparison pages
- `admin/store/recommendations/` — Recommendation engine V2
- `admin/store/ladders/` — Package ladders
- `admin/store/proposals/` — Proposal generator
- `admin/store/operations/` — Operational workflow (intake-to-project)
- `admin/store/trust-badges/` — Trust badge management
- `admin/store/visuals/` — Visual service map
- `admin/store/seo-pages/` — SEO landing pages
- `admin/store/faqs/` — FAQ system
- `admin/store/testimonials/` — Testimonial system
- `admin/store/case-studies/` — Case study generator
- `admin/store/portal-services/` — Portal service hub
- `admin/store/lead-magnets/` — Lead magnet downloads
- `admin/store/content-audit/` — Content quality auditor

### API Routes

| File | Lines | Endpoints |
|---|---|---|
| `apps/api/src/routes/store.ts` | 292 | Promotions CRUD (5), Quotes submit+list (2), Products list+detail (2), Categories list+detail (2) |
| `apps/api/src/routes/analytics.ts` | 90 | Track event (1), List events (1) |
| `apps/api/src/lib/store-catalog.ts` | 193 | Separate hardcoded catalog of 19 products |

API route mounting: `apps/api/src/app.ts:190` — `app.use("/api/v1/store", storeRouter)`

### Database Migrations

3 migrations exist:

| Migration | Table | RLS |
|---|---|---|
| `5302104_store_promotions.sql` | `store_promotions` (14 columns) | Active-only SELECT + service_role full |
| `5302105_store_quotes.sql` | `store_quotes` (10 columns) | Public INSERT + service_role full |
| `5302106_store_analytics.sql` | `store_analytics_events` (16 columns) | Service role all + anon INSERT |

### Tests

| Package | Test File | Tests | Status |
|---|---|---|---|
| Web | `__tests__/lib/catalog/validation.test.ts` | 9 | All catalog validation assertions |
| Web | `__tests__/lib/catalog/v5-loaders.test.ts` | Present | V5 loader tests |
| Web | `__tests__/lib/catalog/v5-comprehensive.test.ts` | Present | Comprehensive V5 tests |
| Web | `__tests__/lib/catalog/bundles.test.ts` | Present | Bundle logic tests |
| Web | `__tests__/lib/catalog/promotions.test.ts` | Present | Promotion validation tests |
| Web | `__tests__/lib/catalog/analytics.test.ts` | Present | Analytics tracking tests |
| Web | `__tests__/lib/catalog/conversion-modules.test.ts` | Present | Conversion module tests |
| Web | `__tests__/components/store/StoreProductCard.test.tsx` | Present | Product card rendering |
| Web | `__tests__/components/store/StoreCategoryCard.test.tsx` | Present | Category card rendering |
| Web | `__tests__/components/store/ServiceFinderQuiz.test.tsx` | Present | Quiz flow |
| Web | `__tests__/components/store/TrustBadgeList.test.tsx` | Present | Trust badges |
| Web | `__tests__/components/store/PromoBadge.test.tsx` | Present | Promo badges |
| Web | `__tests__/components/store/PackageLadder.test.tsx` | Present | Package ladders |
| Web | `__tests__/components/store/FAQSection.test.tsx` | Present | FAQ section |
| Web | `__tests__/components/store/CampaignBanner.test.tsx` | Present | Campaign banners |
| Web | `__tests__/components/store/BundleValuePanel.test.tsx` | Present | Bundle value panels |
| Web | `__tests__/app/(public)/store/compare/page.test.tsx` | Present | Compare index page |
| API | `__tests__/store-catalog.test.ts` | Present | API store endpoints |

**Missing tests** (zero coverage):
- `app/(public)/store/page.tsx` — Store index page
- `app/(public)/store/[slug]/page.tsx` — Product detail page (278 lines)
- `app/(public)/store/category/[slug]/page.tsx` — Category page
- `app/(public)/store/quiz/page.tsx` — Quiz page
- `app/(public)/store/quote/page.tsx` — Quote page
- `app/(public)/store/promotions/page.tsx` — Promotions page
- `app/(public)/store/compare/[slug]/page.tsx` — Compare detail page
- `components/store/QuoteBuilderClient.tsx` — Quote builder (392 lines)
- `components/store/IntakeFormRenderer.tsx` — Intake form (286 lines)
- Any admin store page tests — Zero admin store page tests found

### E2E Tests

**Zero** E2E/Playwright store tests found. No files matching `apps/web/e2e/**/store*` and no grep matches for `store|quiz|quote|promotion` in E2E spec files.

### SDK Integration

`packages/sdk/src`: **Zero references** to `store`, `promotions`, `quotes`, or `analytics`. The SDK does not expose any store-related typed API clients.

## Executive Summary

The webstore product catalog is **broadly implemented with 245 products, 12 categories, 9 public page routes, 30+ admin routes, and 3 database tables**. The catalog data layer is comprehensive with 38 JSON data files, 52 loader functions, and a validation pipeline.

**However, there are 2 critical P0 blockers: missing database migrations for conversion modules (5302060, 5302070) and a split product catalog between the API (19 products) and Web (245 products).** These alone should block release.

The feature matrix is strong: promotions engine (CRUD API + admin UI + public display), quote builder (localStorage + API submit), intake form renderer (validation + tracking), trust badges, seasonal campaigns, service finder quiz, comparison pages, package ladders, and SEO metadata on all public pages. Admin authorization is consistent across all 32 admin store pages.

Gaps exist in testing (zero public page tests, zero admin page tests, zero E2E tests), SDK integration (no store endpoints), and import/export (client-side only, no server API).

**Release readiness verdict: NOT READY — 2 P0 blockers and 3 P1 gaps must be resolved before go-live.**

## Inventory

### Catalog Metrics

| Metric | Value |
|---|---|
| Total products | **245** |
| Visible products | Not validated (all have `display: true`) |
| Hidden/draft products | Not validated |
| Categories | **12** |
| Category order in bundle-rules | 12 categories match categories.json |
| Bundle recommendation rules | 7 rules |
| Comparison pages | Defined in `comparison-pages.json` |
| Package ladders | Defined in `package-ladders.json` |
| SEO landing pages | Defined in `seo-landing-pages.json` |
| FAQs | Defined in `faq-system.json` |
| Testimonials | Defined in `testimonial-system.json` |
| Lead magnets | Defined in `lead-magnets.json` |
| Seasonal campaigns | Defined in `seasonal-campaigns.json` |
| Email nurture sequences | Defined in `email-nurture-sequences.json` |

### API Product Catalog Split

| Location | Products | Categories | Data Source |
|---|---|---|---|
| Web `lib/catalog/data/products.json` | **245** | 12 | Static JSON bundle |
| API `lib/store-catalog.ts` | **19** | Different categories (managed-security, infrastructure, etc.) | Hardcoded array |

**These two catalogs have zero overlapping product slugs.** The API's 19 products (e.g., `m365-hardening`, `endpoint-protection`, `network-security`) are entirely different from the Web store's 245 products (e.g., `password-security-checkup`, `cyber_risk_snapshot`). This means:

- `GET /api/v1/store/products` returns a subset of 19 different products
- `GET /api/v1/store/products/:slug` will 404 for all 245 web store products
- No integration between the two catalogs

### Route Completeness

| Feature | Public Page | Admin Page | API Endpoint | DB Table | SDK Method |
|---|---|---|---|---|---|
| Store index | ✅ | ✅ (dashboard) | ✅ | — | ❌ |
| Product detail | ✅ | ✅ (editor) | ⚠️ (wrong catalog) | — | ❌ |
| Category pages | ✅ | ✅ | ⚠️ (wrong catalog) | — | ❌ |
| Promotions | ✅ | ✅ (CRUD) | ✅ | ✅ | ❌ |
| Quote builder | ✅ | ✅ (list) | ✅ | ✅ | ❌ |
| Quiz / finder | ✅ | ✅ | — | — | ❌ |
| Comparison pages | ✅ | ✅ | — | — | ❌ |
| Trust badges | ✅ (renderer) | ✅ | — | — | ❌ |
| Seasonal campaigns | ✅ (banner) | ✅ | — | — | ❌ |
| Analytics tracking | ⬜ | ✅ (registry) | ✅ | ✅ | ❌ |
| Import / export | — | ✅ (client-only) | ❌ | — | ❌ |
| Bundles | ✅ (components) | ✅ | — | — | ❌ |
| Package ladders | ✅ | ✅ | — | — | ❌ |
| FAQs | ✅ (section) | ✅ | — | — | ❌ |
| Testimonials | — | ✅ | — | — | ❌ |
| Lead magnets | — | ✅ | — | — | ❌ |
| Fulfillment | — | ✅ (admin-only) | — | — | — |
| Audit | — | ✅ (admin-only) | ✅ | — | ❌ |
| Case studies | — | ✅ | — | — | ❌ |
| Email nurture | — | ✅ | — | — | ❌ |

**Legend:** ✅ = fully wired, ⚠️ = partially wired with gaps, ❌ = absent, — = not applicable

## Findings

### Finding 1: WEBSTORE-DATA-P0-001 — Missing database migrations for conversion modules and V5 sales ops

- **Severity:** P0
- **Confidence:** Certain
- **Area:** Data / Database
- **Evidence:**
  - `supabase/migrations/` — 3 store migrations exist (5302104, 5302105, 5302106)
  - `prompts/mct-full-webstore-product-catalog-pack/prompts/audits/10_AUDIT_PUBLIC_STORE.md` (line 5) — lists `5302060_store_conversion_modules.sql` and `5302070_store_v5_sales_ops.sql` as required
  - Glob search for `supabase/migrations/*store*` — only 3 files returned
- **What is happening:** The two migration files that should contain the conversion modules schema (quiz questions, campaigns, trust badges, etc.) and V5 sales ops schema (leads, nurture sequences, fulfillment checklists, dependency engine, etc.) do not exist. The admin pages reference data loaders that read from static JSON files rather than database tables.
- **Why it matters:** All conversion features and sales ops features are read-only from bundled JSON. There is no database-backed storage, no ability for the admin to persist changes to campaigns, quizzes, testimonials, or nurture sequences. Promotions and quotes are the only database-backed features.
- **User / business impact:** Admins cannot create, edit, or manage campaigns, quizzes, trust badges, testimonials, FAQs, comparison pages, lead magnets, nurture sequences, or fulfillment checklists through the admin UI. All these features appear functional in the admin UI but have no persistence layer.
- **Security / privacy / reliability impact:** Low immediate security risk, but high reliability risk — admin changes to these modules would silently disappear on restart/rebuild. Misleading UI suggests CRUD capability where none exists.
- **Recommended fix:** Either (a) create the missing migrations and wire the admin pages to API endpoints backed by DB tables, or (b) clearly mark admin pages as "Reference Only" with a banner explaining that data is sourced from static catalog JSON files that require a code deploy to update.
- **Suggested validation:** Verify each admin page either has a working CRUD API or a visible "Read-only Reference" banner.
- **Owner suggestion:** Backend engineer
- **Effort estimate:** Large (1-2 weeks to create migrations + API endpoints for 20+ modules, or Small (1 day) to add read-only banners)
- **Dependencies:** None
- **Status:** Open

### Finding 2: WEBSTORE-DATA-P0-002 — API and Web product catalogs are completely divergent

- **Severity:** P0
- **Confidence:** Certain
- **Area:** Data / API Integration
- **Evidence:**
  - `apps/api/src/lib/store-catalog.ts` — 19 hardcoded products (slugs: `m365-hardening`, `endpoint-protection`, `network-security`, `backup-dr`, etc.)
  - `apps/web/lib/catalog/data/products.json` — 245 products (slugs: `password-security-checkup`, `cyber_risk_snapshot`, etc.)
  - `apps/api/src/routes/store.ts:246-261` — `GET /api/v1/store/products` reads from `getProducts()` in the hardcoded 19-product list
  - **Zero overlapping slugs** between the two catalogs
- **What is happening:** The API exposes a `/api/v1/store/products` and `/api/v1/store/products/:slug` endpoint that returns a completely different product catalog from what the public web store displays. The web store pages import JSON directly through `@/lib/catalog/loader` (file-system imports) and never call the API.
- **Why it matters:** Any consumer of the API (including potential SDK clients, third-party integrations, or mobile apps) would see a completely different product catalog. The API store products endpoint is functionally useless for the actual 245-product store.
- **User / business impact:** Critical — API consumers see wrong products. If a partner integration consumed the API, they would present entirely wrong SKUs. Any future mobile app, API-driven checkout, or external catalog sync would be broken.
- **Security / privacy / reliability impact:** Reliability — the API endpoint returns incorrect data relative to the public storefront.
- **Recommended fix:** The API's `store-catalog.ts` should import from the same `products.json` and `categories.json` data source, or be removed and replaced with a shared catalog package. Option B: remove the API product endpoints entirely and have all product display happen server-side in the web app (current architecture already does this for the public store pages).
- **Suggested validation:** Verify `GET /api/v1/store/products` returns products matching public store slugs.
- **Owner suggestion:** Backend engineer
- **Effort estimate:** Small (1-3 hours) — either replace API catalog with JSON imports or remove API product endpoints if unused
- **Dependencies:** None
- **Status:** Open

### Finding 3: WEBSTORE-SDK-P1-001 — No SDK integration for store, promotions, or quotes APIs

- **Severity:** P1
- **Confidence:** Certain
- **Area:** SDK / Developer Experience
- **Evidence:**
  - `packages/sdk/src/` — grep for `store` returns zero results
  - `packages/sdk/src/` — grep for `promotions` returns zero results
  - `packages/sdk/src/` — grep for `quotes` returns zero results
  - `apps/api/src/routes/store.ts` — 11 API endpoints exist but none are exposed in the SDK
- **What is happening:** The API has 11 store-related endpoints (promotions CRUD, quotes submit+list, products list+detail, categories list+detail) but the SDK has no typed client wrappers for any of them. The admin promotions and quotes pages use raw `fetch()` calls with manual type casting (`as Promotion`, `as any`).
- **Why it matters:** Admin pages use brittle raw fetch with manual response mapping (e.g., `promotions.ts:56` — `(p as any).badge_text as string`). Any API field rename will silently break. Breaks the established pattern of typed SDK usage across the rest of the codebase (15+ files migrated from raw fetch to SDK in earlier audit sessions).
- **User / business impact:** Developer velocity — new store features require manual API plumbing. Risk of API-breaking changes going undetected by type checker.
- **Recommended fix:** Add `StoreApi` module to SDK with typed methods: `promotions.list()`, `promotions.create()`, `promotions.update()`, `promotions.delete()`, `quotes.submit()`, `quotes.list()`, `products.list()`, `categories.list()`. Migrate admin promotions and quotes pages to use SDK.
- **Suggested validation:** Verify `mctClient.store.promotions.list()` returns typed response. Run typecheck on migrated pages.
- **Owner suggestion:** Frontend engineer
- **Effort estimate:** Small (2-4 hours)
- **Dependencies:** P0-002 (API catalog divergence must be resolved first for products/categories)

### Finding 4: WEBSTORE-TEST-P1-002 — Zero test coverage for public store pages and admin store pages

- **Severity:** P1
- **Confidence:** Certain
- **Area:** Testing
- **Evidence:**
  - `apps/web/__tests__/app/(public)/store/` — only 1 test file exists (`compare/page.test.tsx`)
  - `apps/web/__tests__/app/(admin)/admin/store/` — zero test files found
  - No test files for: `store/page.tsx` (275 lines), `store/[slug]/page.tsx` (278 lines), `store/category/[slug]/page.tsx` (105 lines), `store/quiz/page.tsx`, `store/quote/page.tsx`, `store/promotions/page.tsx`
  - No test files for `QuoteBuilderClient.tsx` (392 lines), `IntakeFormRenderer.tsx` (286 lines), or any admin store page
- **What is happening:** The 9 public store pages and 32 admin store pages have effectively zero test coverage. The only store page test is the compare index, which tests link hrefs. No rendering tests, no data loading tests, no error state tests, no empty state tests.
- **Why it matters:** 800+ lines of public-facing store page code and 30+ admin routes are untested. Regression risk is high. Compare to the rest of the codebase where admin pages have established test patterns (webhooks, health, billing, roles all have tests per AGENTS.md).
- **User / business impact:** High regression risk during catalog updates or Next.js upgrades.
- **Recommended fix:** Add tests in priority order: (1) product detail page, (2) store index page, (3) quote builder component, (4) intake form renderer, (5) admin products page, (6) admin promotions page. Follow existing test patterns from `webhooks/page.test.tsx` and `roles/page.test.tsx`.
- **Suggested validation:** Run `pnpm --filter=web test:coverage` and verify store pages exceed 50% threshold.
- **Owner suggestion:** Frontend engineer
- **Effort estimate:** Medium (1-3 days for comprehensive coverage of top 6 pages)
- **Dependencies:** None

### Finding 5: WEBSTORE-E2E-P1-003 — Zero E2E/Playwright tests for store pages

- **Severity:** P1
- **Confidence:** Certain
- **Area:** Testing / CI
- **Evidence:**
  - `apps/web/e2e/` — glob for `**/store*` returns zero files
  - `apps/web/e2e/` — grep for `store|quiz|quote|promotion` in `.spec.*` files returns zero results
  - AGENTS.md lists 26 E2E spec files across admin/, auth/, portal/ — none in store/
- **What is happening:** No end-to-end tests exercise the store user flows: browsing categories, viewing product details, taking the service finder quiz, building a quote, submitting an intake form, or viewing promotions.
- **Why it matters:** E2E tests are the only validation that the full stack works end-to-end (Next.js SSR + catalog loading + components + API + DB). Unit tests cannot catch integration failures. The store is the public-facing front door — breaking the store page is a customer-facing outage.
- **User / business impact:** Critical user flows have zero automated regression protection. A broken store page would only be caught by manual QA or customer reports.
- **Recommended fix:** Create E2E specs in `apps/web/e2e/store/`: `homepage.spec.ts` (loads, categories visible, featured products, CTAs), `product-detail.spec.ts` (navigates to product, renders sections, CTA link), `quiz.spec.ts` (completes quiz flow, sees recommendations), `quote.spec.ts` (adds items, submits form). Follow existing E2E patterns from `admin/flows.spec.ts`.
- **Suggested validation:** Run `pnpm e2e` and verify store specs pass.
- **Owner suggestion:** QA engineer or frontend engineer
- **Effort estimate:** Medium (1-2 days for 4 core E2E specs)
- **Dependencies:** None

### Finding 6: WEBSTORE-DATA-P2-001 — Quote status enum mismatch between migration and admin UI

- **Severity:** P2
- **Confidence:** Certain
- **Area:** Data Integrity
- **Evidence:**
  - `supabase/migrations/5302105_store_quotes.sql:8` — CHECK constraint: `status IN ('new', 'reviewed', 'contacted', 'converted', 'closed')`
  - `apps/web/app/(admin)/admin/store/quotes/page.tsx:27-28` — status pill/label maps: `'submitted'`, `'reviewing'`, `'converted_to_project'`, `'closed'`, `'draft'`
  - The migration allows `new` but admin UI references `submitted` — **mismatch**
  - The migration allows `reviewed` but admin UI references `reviewing` — **mismatch**
  - The migration allows `contacted` but admin UI has no label — **unreferenced**
  - The migration allows `converted` but admin UI references `converted_to_project` — **mismatch**
  - The admin UI references `draft` but migration has no `draft` status — **would fail DB constraint**
- **What is happening:** The quote status values used in the admin UI's display logic are different from the CHECK constraint in the database schema. A `draft` status would be rejected by PostgreSQL.
- **Why it matters:** If a quote is submitted with any status not in the DB's CHECK constraint, the insert will fail with a database error. The admin UI shows status pills that may not match what's stored.
- **User / business impact:** Admin would see wrong status labels or experience insert failures for quotes with unmapped statuses.
- **Recommended fix:** Align status values. Update the migration to add `draft` and `submitted` statuses and remove unused ones, OR update the admin UI labels to match the DB schema. Update migration: `CHECK (status IN ('new', 'submitted', 'reviewed', 'contacted', 'converted', 'closed', 'draft'))`.
- **Suggested validation:** Insert a quote with each status and verify they all render correctly in admin UI.
- **Owner suggestion:** Backend engineer
- **Effort estimate:** Trivial (15 minutes to align + new migration)
- **Dependencies:** None

### Finding 7: WEBSTORE-API-P2-002 — No rate limiting on public store promotion and quote endpoints

- **Severity:** P2
- **Confidence:** Certain
- **Area:** Security / Resilience
- **Evidence:**
  - `apps/api/src/routes/store.ts:42` — `GET /api/v1/store/promotions` — no rate limit middleware
  - `apps/api/src/routes/store.ts:192` — `POST /api/v1/store/quotes` — no rate limit middleware
  - `apps/api/src/routes/analytics.ts:26` — `POST /api/v1/analytics/track` — no rate limit middleware
  - Compare: auth endpoints have rate limiting (ref: AGENTS.md hardening audit SEC-012 resolved)
- **What is happening:** Public-facing endpoints for promotions, quotes, and analytics tracking have no rate limiting. These endpoints accept unauthenticated requests and could be abused for spam, DoS, or database flooding.
- **Why it matters:** The `POST /api/v1/store/quotes` endpoint inserts rows into `store_quotes` with no authentication. A simple script could flood the table with spam entries. The analytics endpoint could be flooded with garbage events, wasting database storage.
- **User / business impact:** Potential database bloat, spam quotes, and DoS vulnerability on public endpoints.
- **Recommended fix:** Apply the existing rate limiter middleware to `POST /quotes` and `POST /track`. Set reasonable limits (e.g., 5 quotes per IP per hour, 100 analytics events per IP per minute).
- **Suggested validation:** Send rapid requests and verify 429 responses.
- **Owner suggestion:** Backend engineer
- **Effort estimate:** Trivial (5 minutes — add middleware to route registration)
- **Dependencies:** None

### Finding 8: WEBSTORE-IMPORT-P2-003 — Import/export is client-side validation only with no server API

- **Severity:** P2
- **Confidence:** Certain
- **Area:** Admin / Feature Completeness
- **Evidence:**
  - `apps/web/app/(admin)/admin/store/import-export/ImportExportClient.tsx:20-55` — JSON import uses `FileReader` for client-side validation only. No `fetch()` call to a server endpoint for actual import.
  - `apps/web/app/(admin)/admin/store/import-export/ImportExportClient.tsx:57+` — CSV import validates client-side only.
  - Export section: Creates downloadable file from `getAllProducts()` in-memory — no server export endpoint.
  - No `POST /api/v1/store/import` or `GET /api/v1/store/export` endpoint exists.
- **What is happening:** The import/export admin page validates JSON/CSV format in the browser but never sends the data to a server. The "export" button generates a download from the client-side in-memory data. There is no way to actually persist imported products or export via API.
- **Why it matters:** Import/export functionality is advertised in the admin UI but does not function end-to-end. A user could validate a file but could never import it into any persistence layer. Since the catalog is statically bundled JSON, import would require writing to the filesystem or a database — neither path exists.
- **User / business impact:** Low — catalog is static bundled JSON so import/export is inherently limited. But admin UI should not advertise features that don't work end-to-end.
- **Recommended fix:** Either (a) add server-side import/export API endpoints backed by a database or filesystem write, or (b) re-label the page as "Catalog Validation" and clearly state that it validates import format for reference (does not modify the catalog).
- **Suggested validation:** Verify the import/export page UI matches actual capabilities.
- **Owner suggestion:** Backend + frontend engineer
- **Effort estimate:** Small (1-2 hours to add notice or 1-2 days for full server-side implementation)
- **Dependencies:** P0-001 (migrations needed for DB-backed catalog)

### Finding 9: WEBSTORE-LAYOUT-P2-004 — Store layout is client component, loses SSR SEO benefit

- **Severity:** P2
- **Confidence:** Certain
- **Area:** SEO / Performance
- **Evidence:**
  - `apps/web/app/(public)/store/layout.tsx:1` — `"use client"` directive on the entire store layout
  - Layout wraps all store pages (`{children}`) but forces client-side rendering of the sidebar + drawer
  - Store pages correctly use `ReactNode` for `children` (line 4: `children: ReactNode`) — this is actually the correct pattern as of Next.js 15
  - But the container `<div className="flex flex-col lg:flex-row">` is rendered only on the client
- **What is happening:** The store layout uses `"use client"` because of the sidebar toggle state (`useState`). This is necessary for the mobile drawer behavior but causes the layout shell to be client-rendered. The store pages themselves use `force-dynamic` (SSR) but are nested inside a client boundary.
- **Why it matters:** Minimal SEO impact since pages are still SSR'd (Next.js can server-render children inside client boundaries). However, layout shell pops in after hydration. Could slightly impact Core Web Vitals (LCP, CLS).
- **User / business impact:** Minor — storefront pages function correctly and search engines can index content. Slight UX jank on initial load.
- **Recommended fix:** Refactor to a server component layout with a separate client component for the sidebar toggle. Example: extract `StoreMobileDrawer` as `"use client"` component, keep layout as server component.
- **Suggested validation:** Lighthouse audit — verify LCP and CLS scores.
- **Owner suggestion:** Frontend engineer
- **Effort estimate:** Small (30 minutes)

### Finding 10: WEBSTORE-API-P2-005 — Analytics endpoint hardcodes table name, no request correlation ID

- **Severity:** P2
- **Confidence:** Certain
- **Area:** Observability / API Design
- **Evidence:**
  - `apps/api/src/routes/analytics.ts:31` — hardcodes `supabase.from("store_analytics_events")` table name
  - `apps/api/src/routes/analytics.ts:65` — list endpoint also hardcodes table name
  - No `X-Request-ID` correlation in analytics tracking (though API middleware adds this for all requests per AGENTS.md)
- **What is happening:** The analytics tracking endpoint directly references the table by string literal. This is consistent with the rest of the API codebase pattern but worth noting as analytics is a high-volume endpoint that could benefit from batching.
- **Why it matters:** Every analytics event is an individual DB insert. At scale, this could cause performance issues. The rest of the API uses the same pattern for other inserts, so it's consistent, but analytics is unique as a fire-and-forget high-volume endpoint.
- **User / business impact:** Potential performance bottleneck at scale.
- **Recommended fix:** Consider batching analytics inserts (e.g., queue in-memory and flush every 5s or 50 events) for production readiness. Add response headers that allow clients to batch events.
- **Suggested validation:** Load test with 1000 events/sec and verify DB write performance.
- **Owner suggestion:** Backend engineer
- **Effort estimate:** Medium (1 day for batching implementation)

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| API returns wrong products to consumers | High | High | Fix P0-002 |
| Admin changes to campaigns/quiz/settings silently lost | High | Medium | Fix P0-001 |
| Store page regression goes undetected | Medium | High | Fix P1-002 and P1-003 |
| Quote DB constraint fails on `draft` status | Medium | Medium | Fix P2-001 |
| Public endpoint abuse (spam/DoS) | Low | Medium | Fix P2-002 |
| SDK consumers type-assert raw responses | Medium | Low | Fix P1-001 |

## Recommendations

### Blockers (Must Fix Before Release)

1. **P0-001**: Create or document the status of missing migrations (5302060, 5302070). If migrations are intentionally absent, add read-only banners to the 20+ affected admin pages.
2. **P0-002**: Unify API and Web product catalogs. Remove API product endpoints or point them at the same `products.json` data source.

### High Priority (Should Fix Before Broad Rollout)

3. **P1-001**: Add SDK module for store, promotions, and quotes APIs.
4. **P1-002**: Add tests for top 6 most trafficked store pages.
5. **P1-003**: Add E2E specs for core store user flows.
6. **P2-002**: Add rate limiting on public `POST /quotes` and `POST /analytics/track`.

### Quick Wins

7. **P2-001**: Align quote status enums (15-minute fix).
8. **P2-003**: Add "Read-only reference" banner to import/export page.
9. **P2-004**: Refactor store layout to server component pattern.
10. Audit all 245 products for `display: false` hidden products and confirm intent.

## Scores

| Domain | Score | Rationale |
|---|---|---|
| **Catalog Data Completeness** | 4/5 | 245 products, 12 categories, 38 data files, comprehensive types. Missing: DB migrations for conversion modules. |
| **Public Store Pages** | 4/5 | All pages render, SEO metadata, breadcrumbs, trust badges, intake forms, empty/loading/error states, mobile layout. Missing: page-level test coverage. |
| **Admin Store Center** | 3/5 | 32 admin routes, all auth-protected, catalog health dashboard, promotions CRUD. Missing: persistence for 20+ modules, no admin page tests, import/export is read-only. |
| **Promotions Engine** | 4/5 | Full CRUD API + Zod validation + audit logging + admin UI + public display + server actions. RLS on DB table. |
| **Conversion Features** | 3/5 | Quiz/finder, quote builder, trust badges, seasonal campaigns all render in UI. Missing: DB persistence, E2E tests, rate limiting on quote endpoint. |
| **E2E Wiring** | 2/5 | Catalog JSON → loaders → pages is wired. API → SDK is **not** wired. Admin → API is partially wired (promos, quotes) but 20+ modules are read-only from JSON. Zero E2E tests. |
| **Release Readiness** | 2/5 | Two P0 blockers (missing migrations, split catalogs) and three P1 gaps (no SDK, no page tests, no E2E tests) make this **not ready for release**. |
| **Overall** | **3/5** | Functional but not fully hardened. Rich feature set with critical gaps in data persistence, API integration, and test coverage. |

## Quick Wins

| # | Action | Effort |
|---|---|---|
| 1 | Align quote status enum (migration + admin UI) | 15 min |
| 2 | Add rate limit middleware to `POST /quotes` and `POST /analytics/track` | 5 min |
| 3 | Add "Read-only Reference" banner to import/export page | 30 min |
| 4 | Add "Read-only Reference" banners to 20+ admin store pages without DB backing | 2 hours |
| 5 | Remove/rename API product endpoints or point to products.json | 1 hour |
| 6 | Refactor store layout to server component | 30 min |

## Hardening Backlog

| # | Item | Effort | Priority |
|---|---|---|---|
| 1 | Create DB migrations for all 20+ admin store modules | Large | P0 |
| 2 | Wire admin CRUD APIs to DB tables for campaigns, quizzes, testimonials, etc. | Large | P1 |
| 3 | Add SDK module for all store endpoints | Small | P1 |
| 4 | Add unit tests for 6+ public store pages | Medium | P1 |
| 5 | Add E2E specs for core store flows | Medium | P1 |
| 6 | Add batching to analytics tracking endpoint | Medium | P2 |
| 7 | Add worker task for lead scoring from store quotes | Medium | P2 |
| 8 | Add reCAPTCHA or Turnstile to public quote/intake forms | Small | P2 |
| 9 | Add structured logging (pino) to store API routes | Small | P2 |

## Suggested Tests

### Unit Tests (Jest)

```
apps/web/__tests__/app/(public)/store/page.test.tsx
  - Renders hero section with CTA
  - Renders category cards (12 categories)
  - Renders featured "Quick Wins" section
  - Renders monthly plans section
  - Renders emergency support section
  - Renders package ladders section
  - Links to quiz, compare, quote pages

apps/web/__tests__/app/(public)/store/[slug]/page.test.tsx
  - Renders product detail with all sections
  - Renders breadcrumbs (Store > Category > Product)
  - Shows notFound() for invalid slug
  - Shows recommendations section
  - Intake form rendering
  - CTA link with service query param

apps/web/__tests__/app/(public)/store/quiz/page.test.tsx
  - Renders quiz header and questions
  - Renders ServiceFinderQuiz component

apps/web/__tests__/components/store/QuoteBuilderClient.test.tsx
  - Renders quick-win, bundle, monthly plan sections
  - Adds items to quote
  - Removes items from quote
  - Shows form validation errors
  - Submits quote successfully
  - Shows empty state when no items

apps/web/__tests__/app/(admin)/admin/store/page.test.tsx
  - Renders catalog health stats
  - Shows issue count when validation fails
  - Shows green banner when no issues

apps/web/__tests__/app/(admin)/admin/store/promotions/page.test.tsx
  - Renders promo table
  - Shows empty state
  - Shows create/edit/delete buttons
  - Validates form errors
```

### E2E Tests (Playwright)

```
apps/web/e2e/store/homepage.spec.ts
  - Loads /store and sees hero text
  - 12 category cards visible
  - Quick wins section visible
  - CTA links functional

apps/web/e2e/store/product-detail.spec.ts
  - Navigates to a product page
  - Renders all info sections
  - "Request This Service" link goes to /contact?service=slug
  - Recommendations visible

apps/web/e2e/store/quiz.spec.ts
  - Loads /store/quiz
  - Answers all questions
  - Sees recommendation results
  - Recommendation cards link to correct products

apps/web/e2e/store/quote.spec.ts
  - Loads /store/quote
  - Adds products to quote
  - Fills form and submits
  - Sees success message
```

## Suggested Documentation Updates

1. Update `AGENTS.md` to note that the store catalog has two data sources: static JSON (web) and hardcoded array (API) — and document that this is intentional or needs to be unified.
2. Add a README in `apps/web/lib/catalog/` explaining the data architecture: JSON files, loaders, validation, and how to add/modify products.
3. Document the missing migrations (5302060, 5302070) status — are they intentionally absent or deferred?
4. Add store page test coverage notes to AGENTS.md test status section.

## Open Questions

1. **Are 5302060 and 5302070 migration files intentionally absent?** The admin pages suggest CRUD capability for campaigns, quizzes, testimonials, etc. but no DB tables exist. Is the design intent that these are read-only references to static JSON, or were the migrations simply never created?
2. **Is the API's separate product catalog intentional?** The API's 19 products under different categories (managed-security, infrastructure, M365, cloud-productivity) look like they belong to a different system. Are they a legacy portal service catalog?
3. **Should the catalog JSON be committed at 59,845 lines?** At what point should products be moved to a database with an admin import workflow instead of source-controlled JSON?
4. **What is the expected admin workflow for adding products?** Current workflow is: edit products.json → commit → deploy. Is this acceptable for the product count and update frequency?
5. **Are there rate limits or spam protections planned for the public quote/intake forms?** The forms accept unauthenticated submissions to a public API endpoint with no captcha.

## Appendix

### Top 10 Findings Summary

| # | ID | Severity | Finding |
|---|---|---|---|
| 1 | WEBSTORE-DATA-P0-001 | P0 | Missing DB migrations for conversion modules (5302060, 5302070) |
| 2 | WEBSTORE-DATA-P0-002 | P0 | API (19 products) and Web (245 products) catalogs completely divergent |
| 3 | WEBSTORE-SDK-P1-001 | P1 | No SDK integration for store endpoints |
| 4 | WEBSTORE-TEST-P1-002 | P1 | Zero test coverage for public store pages |
| 5 | WEBSTORE-E2E-P1-003 | P1 | Zero E2E/Playwright tests for store pages |
| 6 | WEBSTORE-DATA-P2-001 | P2 | Quote status enum mismatch between migration and admin UI |
| 7 | WEBSTORE-API-P2-002 | P2 | No rate limiting on public promo/quote endpoints |
| 8 | WEBSTORE-IMPORT-P2-003 | P2 | Import/export client-side only, no server API |
| 9 | WEBSTORE-LAYOUT-P2-004 | P2 | Store layout is client component, loses SSR benefit |
| 10 | WEBSTORE-API-P2-005 | P2 | Analytics endpoint lacks batching for high-volume events |

### File Count Summary

| Layer | Count |
|---|---|
| Catalog JSON data files | 38 |
| Catalog TypeScript modules | 9 |
| Public store pages | 9 |
| Store components | 16 |
| Admin store pages | 36 |
| API route files | 2 |
| API lib files | 1 |
| DB migrations | 3 |
| Web test files | 17 |
| API test files | 1 |
| E2E test files | 0 |
| **Total** | **132** |
