# Store

**Category:** Public + Admin
**API Routes:** `apps/api/src/routes/store.ts`
**SDK:** `packages/sdk/src/store.ts`
**Frontend:** `apps/web/app/(public)/store/**`, `apps/web/app/(admin)/admin/store/**`, `apps/web/lib/catalog/`

## Overview

Public-facing service storefront backed by a 245-product catalog (shared JSON between web and API) plus a promotions engine and quote intake. The admin center manages promotions and quotes; the public store renders products, categories, bundles, and conversion features (service finder quiz, quote builder, trust badges).

## Key Features

- 245-product catalog across 12 categories (shared `products.json` / `categories.json` in both `apps/web/lib/catalog/` and `apps/api/src/data/`)
- Public product + category browsing, bundle savings calculator
- Promotions CRUD (admin) with active/inactive states and audit logging
- Quote request intake (public) + admin quote review
- Conversion modules: service finder quiz, quote builder, seasonal campaigns, lead magnets, comparison pages, trust badges, FAQ system
- Migration-backed persistence for quotes/leads/proposal drafts/visual assets (`store_quote_requests`, `store_leads`, `store_proposal_drafts`, `store_visual_assets`)

## Endpoints

| Method | Path                          | Description                              |
| ------ | ----------------------------- | ---------------------------------------- |
| GET    | /api/v1/store/products        | List products (filter by category)       |
| GET    | /api/v1/store/products/:slug  | Get product by slug                      |
| GET    | /api/v1/store/categories      | List categories                          |
| GET    | /api/v1/store/categories/:slug| Get category by slug                     |
| GET    | /api/v1/store/promotions      | List active promotions (public)          |
| GET    | /api/v1/store/promotions/active | Alias for active promotions            |
| GET    | /api/v1/store/promotions/admin| List all promotions (admin)              |
| POST   | /api/v1/store/promotions      | Create promotion (admin)                 |
| PATCH  | /api/v1/store/promotions/:id  | Update promotion (admin)                 |
| DELETE | /api/v1/store/promotions/:id  | Delete promotion (admin)                 |
| POST   | /api/v1/store/quotes          | Submit a quote request (public)          |
| GET    | /api/v1/store/quotes          | List quote requests (admin)              |

## Access Control

- Public endpoints (products, categories, active promotions, quote submit): unauthenticated
- Admin endpoints (promotion CRUD, quote list): `requireAuth` + `requireAdmin`
