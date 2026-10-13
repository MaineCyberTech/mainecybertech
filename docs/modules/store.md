# Store

**Category:** Public + Admin
**API Routes:** `apps/api/src/routes/store.ts` → `apps/api/src/routes/store/catalog.ts`, `apps/api/src/routes/store/promotions.ts`, `apps/api/src/routes/store/quotes.ts`, `apps/api/src/routes/store/campaigns.ts`, `apps/api/src/routes/store/visual-assets.ts`
**SDK:** `packages/sdk/src/store.ts`
**Frontend:** `apps/web/app/(public)/store/**`, `apps/web/app/(admin)/admin/store/**`, `apps/web/lib/catalog/`

## Overview

Public-facing service storefront. The catalog is **DB-first** (`store_products` / `store_categories`) with the bundled JSON (`apps/api/src/data/products.json`, `categories.json`) as an offline/empty-table fallback; the public storefront reads it through `apps/web/lib/catalog/catalog-source.ts`. Admin pages manage the catalog, promotions, campaigns, quotes, leads, proposal drafts and visual assets.

## Key Features

- Catalog persisted in `store_products` / `store_categories` (seed/fallback: 245 products / 12 categories from JSON); admin CRUD
- Public product + category browsing, bundle savings calculator, comparison pages, trust badges, FAQ, service-finder quiz, quote builder
- Promotions CRUD (admin) with active/inactive states and audit logging
- Quote intake (public) → `store_quotes` + structured `store_quote_requests` + scored `store_leads`
- Proposal drafts (`store_proposal_drafts`, linked to a first-class `proposals` row) and intake→project handoff (`/quote-requests/:id/convert`)
- Seasonal campaigns (`store_campaigns`) feeding the public banner, with truthful capacity messaging
- Visual assets (`store_visual_assets`) admin CRUD
- Import/export of the live DB catalog

### Admin page data sources (FEAT-P3-002)

The admin Store section mixes three kinds of pages. The bundled-JSON management
surfaces render a `Preview` banner in the UI and their primary actions stay
disabled until the corresponding Store APIs exist:

- **DB-backed (live `store_*` tables via the Store API):** products (+ detail),
  categories, promotions, campaigns, quotes, quote-requests, visuals,
  import/export.
- **Bundled-JSON previews (read-only; marked `Preview` in the UI):**
  case-studies, content-audit, dependencies, faqs, fulfillment, lead-magnets,
  lifecycle, nurture, profitability, proposals, seo-pages. They render starter
  data from `apps/web/lib/catalog/data/*.json` (`v5-loaders`); management
  actions are disabled.
- **Bundled-JSON read-only views/calculators (no management claims):** store
  dashboard, analytics, audit, bundles, bundle-calculator, ladders, quiz,
  recommendations, comparisons, testimonials, trust-badges, portal-services,
  leads, operations.

## Endpoints (all under `/api/v1/store`)

| Method            | Path                                             | Description                                                  |
| ----------------- | ------------------------------------------------ | ------------------------------------------------------------ |
| GET               | `/products`                                      | List products (optional `?category=`) — public               |
| GET               | `/products/by-id/:id`                            | Product by id — admin                                        |
| GET               | `/products/:slug`                                | Product detail — public                                      |
| POST/PATCH/DELETE | `/products[/:id]`                                | Catalog CRUD — admin                                         |
| GET               | `/categories`, `/categories/:slug`               | Categories (+products) — public                              |
| POST/PATCH/DELETE | `/categories[/:id]`                              | Category CRUD — admin                                        |
| GET               | `/promotions`, `/promotions/active`              | Active promotions — public                                   |
| GET               | `/promotions/admin`                              | All promotions — admin                                       |
| POST/PATCH/DELETE | `/promotions[/:id]`                              | Promotion CRUD — admin                                       |
| GET               | `/campaigns`                                     | Active global campaigns — public                             |
| GET               | `/campaigns/admin`                               | All campaigns — admin                                        |
| POST/PATCH/DELETE | `/campaigns[/:id]`                               | Campaign CRUD — admin                                        |
| POST              | `/quotes`                                        | Submit a quote — public                                      |
| GET               | `/quotes`                                        | List quotes — admin                                          |
| GET               | `/quote-requests`                                | List structured quote requests — admin                       |
| POST              | `/quote-requests/:id/proposal`                   | Generate a proposal draft (+ linked `proposals` row) — admin |
| POST              | `/quote-requests/:id/convert`                    | Intake → project handoff — admin                             |
| GET               | `/leads`                                         | Scored leads — admin                                         |
| GET               | `/proposal-drafts`, PATCH `/proposal-drafts/:id` | Proposal drafts — admin                                      |
| GET               | `/visual-assets`, POST/PATCH/DELETE              | Visual assets — admin                                        |

List endpoints return plain arrays capped at `LIST_HARD_CAP` (1000); store admin routes use `requireAdmin` + `requireOrgAccess`.

## Access Control

- Public: products, categories, active promotions, active global campaigns, quote submit
- Admin: catalog/promotion/campaign/visual-asset CRUD, quotes/leads/drafts/handoff — `requireAuth` + `requireAdmin` (+ `requireOrgAccess` on org-scoped writes)
